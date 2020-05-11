(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('nursingDocPanel', nursingDocPanel);

  /** @ngInject */
  function nursingDocPanel($timeout, $rootScope, $q, docUtil, $filter, sessionService, modalService, _, moment, $document, sysRest, $location, nursingRecordCustomPageUtil) {
    var directive = {
      restrict: 'E',
      scope: {
        curSheet: '=',
        allSheets: '=',
        patient: '=',
        reloadSheets: '&',
        setSelectedDocSheet: "="
      },
      templateUrl: 'MNIS/components/nursingDoc/panel.tpl.html',
      replace: true,
      link: linkFunc,
      controller: ctrlFunc,
      controllerAs: 'panel',
      bindToController: true
    };
    var beforeBlurPage = null;

    return directive;

    function linkFunc(scope, el, attr) {
      var vm = scope.panel;
      var watchers = {};
      watchers.curSheetWatcher = scope.$watch('panel.curSheet', function (value) {
        delete vm.isSave;
        if (value && value.tplId && !value.dataKey) {
          vm.isNewSheet = typeof value.$totalPage === 'undefined';
          vm.load.func();

          if (vm.grouped) {
            vm.page = _.reduce(vm.grouped[value.tplId], function (memo, sheet) {
              var sheetIndex = _.findIndex(vm.allSheets, function (item) {
                return item.sheetId === sheet.sheetId;
              });
              return vm.allSheets[sheetIndex].$offsetPage + vm.allSheets[sheetIndex].$totalPage || 1;
            }, 0);
            vm.printSheets = angular.copy(vm.grouped[vm.curSheet.tplId]);

          }
          vm.echo && (vm.echo.pageNum = Math.ceil(value.rowRequired / value.tplRowNum));
          vm.echo.curPage = (vm.echo.pageNum + value.$offsetPage) || 1;
          beforeBlurPage = vm.echo.curPage;
          vm.lineHeight = value.lineHeight || 26;
        } else {
          vm.isNewSheet = false;
        }
      });

      watchers.allSheetsWatcher = scope.$watch('panel.allSheets', function (value, oldValue) {
        if (value) {
          vm.grouped = _.groupBy(value, 'tplId');

          if (vm.curSheet) {
            var correctSheet = _.find(value, {
              sheetId: vm.curSheet.sheetId
            });
            vm.page = _.reduce(vm.grouped[vm.curSheet.tplId], function (memo, sheet) {
              var sheetIndex = _.findIndex(value, function (item) {
                return item.sheetId === sheet.sheetId;
              });
              value[sheetIndex].$offsetPage = memo;
              value[sheetIndex].$totalPage = sheet.rowRequired / sheet.tplRowNum;
              return value[sheetIndex].$offsetPage + value[sheetIndex].$totalPage || 1;
            }, 0);

            var newPageNum = Math.ceil(correctSheet.rowRequired / correctSheet.tplRowNum);

            if (vm.echo.pageNum !== newPageNum) {
              vm.echo.curPage = (newPageNum + correctSheet.$offsetPage) || 1;
              vm.loadPageData(vm.echo.curPage);
            }

            vm.echo && (vm.echo.pageNum = newPageNum);
          }
          vm.printSheets = angular.copy(vm.grouped[vm.curSheet.tplId]);
        }
      }, true);
      //[start]外部打开页面 禁止点击事件
      scope.panel.openOuter = $location.$$search.openOuter ? $location.$$search.openOuter : false;
      if ($location.$$search.openOuter) {
        angular.element('.doc-wrapper').css('cursor', 'not-allowed');

        document.querySelector('.doc-wrapper').addEventListener('dblclick', function (event) {
          event.preventDefault();
          event.stopPropagation();
        }, true);

        document.querySelector('.doc-wrapper').addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
        }, true);
      }
      //[end]外部打开页面 禁止点击事件

      // 清除$watcher
      scope.$on('$destroy', function () {
        Object.keys(watchers).forEach(function (watcherName) {
          watchers[watcherName]();
        });
      });
    }

    function ctrlFunc($scope, nursingRest, $q) {
      var vm = this,
        profile = sessionService.getProfile(),
        heightUnit = vm.curSheet && vm.curSheet.lineHeight || 26,
        mark, cursor;
      activate();

      var dicHelper = sessionService.getDicHelper();
      var configHelper = sessionService.getConfHelper();
      var dic = dicHelper.dic;
      var conf = configHelper.conf;
      var deferToAddNewCustomColumn;
      var hasExtraRow = false;

      sysRest.getHosInfo().then(function (response) {
        vm.hospitalName = response.hosDisplayName;
        vm.hospitalLogo = response.hosLogoPath;
      });

      vm.printFromThisRow = printFromThisRow;

      vm.dic = dic;

      function activate() {
        vm.load = {
          func: loadAll
        };
        vm.echo = {};
        vm.methods = {
          click: save,
          dblclick: enterEditing,
          enter: save
          // 去除最后一样回车后新增行
          // enterWhenLast: addData
        };
        vm.save = function () {
          angular.element('.editing-line').removeClass('editing-line');
          save();
        };
        vm.getDicValue = $rootScope.getDicValue;
        vm.getHtml = $rootScope.getHtml;
        vm.utils = $rootScope.gUtils;
        vm.altPage = altPage;
        vm.addData = addData;
        vm.delData = delData;
        vm.nursingCheckSign = nursingCheckSign;
        vm.hasUnsaveData = hasUnsaveData;
        vm.print = print;
        vm.printCon = printCon;
        vm.printCur = printCur;
        vm.setBreakPoint = setBreakPoint;
        vm.profile = profile;
        vm.printSync = printSync;
        vm.goPage = goPage;
        vm.goMark = goMark;
        vm.setCustomColumns = setCustomColumns;
        vm.lineHeight = heightUnit;
        vm.loadMark = loadMark;
        vm.manualStatistics = manualStatistics;
        vm.nextPage = nextPage;
        vm.prevPage = prevPage;
        vm.firstPage = firstPage;
        vm.lastPage = lastPage;
        vm.pageInputChange = pageInputChange;
        vm.pageInputBlur = pageInputBlur;
        vm.loadPageData = loadPageData;
        vm.openPrintProgress = openPrintProgress;
        vm.reloadSheetAndPage = reloadSheetAndPage;
        vm.setCustomPage = setCustomPage;
        vm.docShowScale = 100;
        vm.editPanel = {
          isOpen: false
        }
        vm.showByPrinting = false;
        loadMark();
        getDiagnosis();

        var selectedDataWatcher = $scope.$watch("panel.echo.selectedRawData", function (value) {
          if (value) {
            vm.editPanel.editData = value;
            vm.editPanel.isOpen = true;
          }
        })
        $scope.$on("$destroy", selectedDataWatcher);
      }

      var watchers = {};

      watchers.panel = $scope.$watch('panel.page', function (value, oldValue) {
        if (value && value > oldValue) {
          deferToAddNewCustomColumn && deferToAddNewCustomColumn.resolve(value);
        }
      }, true);

      // 清除$watcher
      $scope.$on('$destroy', function () {
        Object.keys(watchers).forEach(function (watcherName) {
          watchers[watcherName]();
        });
      });

      function handleMark(data) {
        mark = data;
        vm.oriMark = mark;
        vm.mark = calcMark(mark && mark.markRow || 0);
      }

      function getCurrentColumns(offsetParam) {
        var correctColumns = _.find(vm.customColumns, function (item) {
          return item.pageNo === offsetParam && vm.curSheet.sheetId === item.sheetId;
        });

        vm.columns = correctColumns;
      }

      function getCustomColumns() {

        var reqs = _.map([vm.curSheet], function (sheet) {
          return nursingRest.getCustomColumns().customGET('', {
            sheetId: sheet.sheetId
          });
        });

        return $q.all(reqs).then(function (values) {
          vm.customColumns = _.chain(values).map(function (value) {
            return value.plain()
          }).flatten().value();

          return vm.customColumns;
        });
      }

      function setCustomColumns(data, abondonLoadData) {
        return nursingRest.getCustomColumns().customPOST(_.assign(data, {
            sheetId: vm.curSheet.sheetId
          }))
          .then(function () {
            $scope.$emit('toast', {
              type: 'success',
              content: '自定义列已保存！'
            });

            if (!abondonLoadData)
              return vm.load.func(abondonLoadData)
            else {
              $q.all(loadHeader(undefined, vm.curSheet.sheetId), getCustomColumns());
            }
          });
      }

      function getDiagnosis() {
        nursingRest.getDiagnosis(vm.patient.inhosCode).then(function (response) {
          vm.diagnosis = response;
        });
      }

      function calcMark(rows) {
        var i = 0;
        var sheets = _.filter(vm.allSheets, {
          tplId: vm.curSheet.tplId
        });
        var sheet = sheets[i];
        var rowCount = _.chain(sheets)
          .map('rowCount')
          .reduce(function (pre, cur) {
            return pre + cur;
          }, 0)
          .value();

        if (!sheet) {
          return;
        }

        if (rows > 0) {
          // 所有相同tplId的sheets

          while (sheet && rows > rowCount) {
            rows -= sheet.rowRequired;
            sheet = sheets[++i];
          }

          if (!sheet) {
            sheet = _.last(vm.allSheets);
          }

          if (rows < 0) {
            return {
              page: 0,
              row: 0
            };
          }

          return {
            page: Math.ceil(rows / sheet.tplRowNum) + (sheet.$offsetPage || 0),
            row: rows % sheet.tplRowNum || sheet.tplRowNum
          };
        } else {
          return {
            page: 0,
            row: 0
          }
        }
      }

      function calcCursor(rows) {
        rows++;
        var i = 0;
        var sheets = _.filter(vm.allSheets, {
          tplId: vm.curSheet.tplId
        });
        var sheet = sheets[i];
        var rowCount = _.chain(sheets)
          .map('rowCount')
          .reduce(function (pre, cur) {
            return pre + cur;
          }, 0)
          .value();

        if (rows) {
          while (rows - 1 > rowCount) {
            rows -= sheet.rowRequired;
            sheet = sheets[++i];
            if (!sheet) { // 最后一张单
              return;
            }
          }
          if (rows < 0) {
            rows = 1;
          }
          return {
            page: Math.ceil(rows / sheet.tplRowNum) + sheet.$offsetPage,
            row: --rows % sheet.tplRowNum
          }
        } else {
          return {
            page: 0,
            row: 0
          }
        }
      }

      function loadMark() {
        if (!_.get(vm, 'curSheet.tplId')) {
          return;
        }

        return nursingRest.getMarkRows(vm.patient.inhosCode, vm.curSheet.tplId).then(function (data) {
          handleMark(data);

          return data;
        });
      }

      function loadTpl(tplId) {
        return nursingRest.getNursingDoc(tplId || vm.curSheet.tplId).then(function (data) {
          vm.tpl = data.plain();
          var pageSize = vm.tpl.size.split(',');
          vm.pageWidth = pageSize[0] + 'mm';
          vm.editPanel = {
            isOpen: false
          }

          // 初使化评估单
          _.forEach(vm.tpl.components, function (item) {
            if (item.double) {
              item.orderIndex = item.index * 1000;
            }
          });

          _.forEach(vm.tpl.components, function (item) {

            if (item.double == undefined) {

              for (var i = 0; i < vm.tpl.components.length; i++) {
                var compareItem = vm.tpl.components[i];
                if (compareItem.id == item.sup) {
                  compareItem.childCnt = compareItem.childCnt ? compareItem.childCnt + 1 : 1;
                  item.orderIndex = compareItem.index * 1000 + item.index;
                  break;
                }
              }
            }
          })
        });
      }

      function nextPage() {
        vm.echo.curPage = Number(vm.echo.curPage) + 1;
        beforeBlurPage = vm.echo.curPage;
        return loadPageData();
      }

      function prevPage() {
        if (vm.echo.curPage > 0) {
          vm.echo.curPage -= 1;
          beforeBlurPage = vm.echo.curPage;
          return loadPageData();
        }
      }

      function firstPage() {
        vm.echo.curPage = vm.curSheet.$offsetPage + 1;
        beforeBlurPage = vm.echo.curPage;
        return loadPageData();
      }

      function lastPage() {
        vm.echo.curPage = vm.echo.pageNum + vm.curSheet.$offsetPage;
        beforeBlurPage = vm.echo.curPage;
        return loadPageData();
      }

      var inputPageIsLegal = false;

      function pageInputChange(page, autoDirect) {
        if (!page) {
          inputPageIsLegal = false;
          return;
        }

        page = Number(page);
        var minPage = vm.curSheet.$offsetPage + 1;
        var maxPage = vm.echo.pageNum + vm.curSheet.$offsetPage;

        if (page <= maxPage && page >= minPage) {
          inputPageIsLegal = true;
        } else {
          inputPageIsLegal = false;
        }

        if (autoDirect && inputPageIsLegal)
          goPage(page);
      }

      function pageInputBlur() {
        vm.echo.curPage = beforeBlurPage;
      }

      function loadPageData(pageNo, sheetId) {
        return loadHeader(pageNo, sheetId).then(function () {
          return loadData(pageNo, sheetId)
        });
      }

      function goPage(pageNo, sheetId) {

        if (inputPageIsLegal) {
          loadPageData(pageNo, sheetId);
          beforeBlurPage = pageNo;
        } else {
          var minPage = vm.curSheet.$offsetPage + 1;
          var maxPage = vm.echo.pageNum + vm.curSheet.$offsetPage;

          $rootScope.$broadcast('toast', {
            type: 'warning',
            content: '输入页数的范围应该是' + minPage + '-' + maxPage
          });

          vm.echo.curPage = beforeBlurPage;
        }
      }

      function loadHeader(pageNo, sheetId) {
        return nursingRest.getCustomColumns().customGET('page', {
          sheetId: sheetId || vm.curSheet.sheetId,
          pageNo: pageNo || vm.echo.curPage
        }).then(function (response) {
          vm.currentPageColumns = response.plain && response.plain();
          vm.headers = response.header;
          vm.printFlag = response.printFlag;
        });
      }

      // 整页签名
      vm.signAllPage = function () {

        docUtil.caSignRecord(vm.rawData, 'nursingDoc', 'sign').then(function (result) {

          var signedData = result.datas;

          nursingRest.updateAttendDataList(signedData).then(function () {

            $scope.$emit('toast', {
              type: "success",
              content: "整页签名成功，共签" + signedData.length + "条记录"
            })
            docUtil.caSignRecord(vm.showData, 'nursingDoc', 'sign', profile);
            docUtil.caSignRecord(vm.tplData, 'nursingDoc', 'sign', profile);
          })

        }, function (errorType) {
          if (errorType == 'noRecord') {
            $scope.$emit('toast', {
              type: "warning",
              content: "当前没有" + profile.userName + "[" + profile.userCode + "]可签名的记录"
            })
          }
        });

      }

      // 整页冠签
      vm.checkAllPage = function () {

        var unCheckedRecordData = getUncheckedRecordData(vm.rawData);


        if (unCheckedRecordData.length == 0) {
          $scope.$emit('toast', {
            type: "warning",
            content: "本页没有未冠签的记录"
          })
        } else {

          docUtil.caSignRecord(unCheckedRecordData, "nursingDocCheckSign", "sign").then(function (result) {

            var verifiedUserSign = result.sign;

            nursingRest.updateAttendDataList(unCheckedRecordData).then(function () {
              $scope.$emit('toast', {
                type: "success",
                content: "整页冠签成功，共签" + unCheckedRecordData.length + "条记录"
              })

              unCheckedRecordData = getUncheckedRecordData(vm.showData);
              docUtil.caSignRecord(unCheckedRecordData, "nursingDocCheckSign", "sign", verifiedUserSign);

              unCheckedRecordData = getUncheckedRecordData(vm.tplData);
              docUtil.caSignRecord(unCheckedRecordData, "nursingDocCheckSign", "sign", verifiedUserSign);
            });
          });
        }
      }

      // 获取本页未冠签的记录
      function getUncheckedRecordData(recordDatas) {
        var unCheckedRecordData = [];
        _.forEach(recordDatas, function (recordData) {
          if (recordData.checkUserCode == undefined || recordData.checkUserCode == "") {
            unCheckedRecordData.push(recordData);
          }
        });
        return unCheckedRecordData;
      }

      function loadData(pageNo, sheetId) {

        vm.editingRow = null;
        vm.echo.active = undefined;
        vm.showData = [];

        if (!vm.curSheet.sheetId) {
          return;
        }

        if (typeof pageNo !== 'undefined') {
          vm.echo.curPage = +pageNo;
          beforeBlurPage = vm.echo.curPage;
        }

        return nursingRest.getNursingData({
          sheetId: sheetId || vm.curSheet.sheetId,
          pageNo: pageNo || vm.echo.curPage || 1,
          date: vm.curSheet.date
        }).then(function (data) {
          //获取当前sheet的数据，去除高度为0的行
          data = _.filter(data.plain(), function (item) {
            return item.rowSize > 0;
          });

          // 修改自定义表头和修改记录单数据不滚动
          // vm.echo.curPage = vm.echo.curPage || vm.curSheet.$offsetPage + 1 || 0;
          // 默认滚动到最后一行
          if (!vm.isSave) {
            $timeout(function () {
              scrollTo(data, data.length - 1);
            }, 500);
          }

          vm.echo.selected = null;
          vm.echo.active = undefined;
          vm.tplData = angular.copy(data);

          // vm.rawData = angular.copy(data);
          getCurrentColumns(vm.echo.curPage);
          var dataWithNoLodash = removeUnderscore(data);

          vm.rawData = replaceBrWithWhiteSpace(dataWithNoLodash);
          vm.showData = replaceBrWithDiv(dataWithNoLodash, vm.tpl);

          var rows = 0;

          _.each(vm.showData, function (item) {
            item.$count = item.rowSize;
            rows += item.rowLength;
          });

          if (vm.rawData.length == 0) {
            vm.startTime = vm.endTime = undefined;
          }

          if (+(pageNo || vm.echo.curPage) !== +vm.tpl.rowNum && vm.curSheet.rowCount !== vm.curSheet.rowRequired) {
            if (vm.rawData.length > 0) {
              vm.startTime = moment(_.get(vm.rawData[0], ('recordDate'))).format('YYYY-MM-DD');
              vm.endTime = moment(_.get(vm.rawData[vm.rawData.length - 1], 'recordDate')).format('YYYY-MM-DD');

              if (vm.startTime == vm.endTime) {
                vm.endTime = moment(_.get(vm.rawData[vm.rawData.length - 1], 'recordDate')).add(1, "days").format('YYYY-MM-DD');
              }
            }
          }

          vm.echo && (vm.echo.rowNum = rows);
        });
      }

      function scrollTo(data, index) {
        var rowCount = _.reduce(data.slice(0, index + 1), function (memo, end) {
          return memo + end.rowSize;
        }, 0);

        rowCount = Math.max(0, rowCount - 5);
        angular.element('.table-content-wrapper').scrollTop(rowCount * vm.lineHeight);
      }

      function loadAll() {
        delete vm.editPageNo;
        vm.echo.active = undefined;

        return $q.all([loadTpl().then(loadPageData), loadMark()]);
      }

      function altPage(offset) {
        if (vm.curSheet.date) return;
        var index = _.findIndex(vm.allSheets, {
          sheetId: vm.curSheet.sheetId
        });
        if (index < 0) return;
        offset += index;
        if (vm.allSheets[offset]) {
          vm.curSheet = vm.allSheets[offset];
        }
      }

      function goMark() {
        var page, row, mark = vm.mark,
          startPage = vm.curSheet.$offsetPage,
          endPage = vm.curSheet.$offsetPage + vm.curSheet.$totalPage,
          match;
        if (mark) {
          page = mark.page;
          row = mark.row;
        } else {
          page = 1;
          row = 0;
        }
        if (page && page <= vm.page) {
          if (page > startPage && page <= endPage) {
            vm.scrollPage(page, row);
          } else {
            match = findSheetByPage(page);
            match.$scrollPage = page;
            match.$scrollRow = row;
            vm.curSheet = match;
          }
        }
      }

      function addCustomKeyAndPrefix(dataSource) {
        var components = vm.tpl.components;
        var dataCopy = angular.copy(dataSource);

        var currentCulomns = vm.currentPageColumns;

        components.forEach(function (item) {
          var key = item.key;
          var prefix = item.rule && item.rule.prefix;

          if (angular.isString(dataCopy.data[key]) && !!dataCopy.data[key] && prefix) {
            prefix = prefix.replace(/(&nbsp;)/g, ' ');

            if (dataCopy.data[key].indexOf(prefix) !== 0) {
              dataCopy.data[key] = prefix + dataCopy.data[key];
            }
          }
          // 自定义列的数据需要附加自定义列的表头数据
          if (item.isCustomColumn && dataCopy.data[key]) {
            var columnsData = (dataCopy.currentColumns ? dataCopy.currentColumns.content[key] : currentCulomns.content && currentCulomns.content[key]) || '';
            var suffix = columnsData ? '_' + columnsData : '';

            dataCopy.data[key + suffix] = dataCopy.data[key];
            delete dataCopy.data[key];
          }
        });

        vm.editPageNo = dataCopy.currentColumns && dataCopy.currentColumns.pageNo;

        delete dataCopy.dateHidden;
        delete dataCopy.timeHidden;
        delete dataCopy.currentColumns;
        delete dataCopy.customColumnDataDiff;

        return dataCopy;
      }

      function saveToServer(data) {
        return nursingRest.updateNursingData(data).then(function (res) {
          vm.editingRow = null;
          vm.echo.active = undefined;
          vm.echo.curPage = Math.ceil(res.rowInfile / vm.curSheet.tplRowNum);

          // return vm.load.func().then(loadPageData);
          return $q.all([vm.load.func(), vm.reloadSheets()]);
        });
      }

      function reloadSheetAndPage() {
        return $q.all([vm.load.func(), vm.reloadSheets()]);
      }

      function enterEditing(index) {

        if (typeof index !== 'undefined') {
          if (!vm.rawData[index].inOutStatistics && vm.editingRow && vm.editingRow.inOutStatistics) {
            vm.editingRow = vm.editingRow;
          } else {
            vm.editingRow = _.assign({}, vm.rawData[index]);
          }
          vm.echo.active = index;
        }
        $scope.$broadcast('setEditingField', vm.editingRow);
      }

      vm.saveEditItemDataWhenPopup = function (editedData, notSave, reloadingData, verifySignOnly) {

        if (!notSave) {

          vm.editingRow = editedData;
          return save(undefined, verifySignOnly).then(function () {
            vm.editPanel = {
              isOpen: false
            };
            delete vm.echo.selectedRawData;
          });

        } else {

          vm.editingRow = null;

          vm.editPanel = {
            isOpen: false
          };
          delete vm.echo.selectedRawData;

          if (reloadingData) {
            vm.load.func();
          } else if (hasExtraRow && vm.echo.pageNum > 1) {
            vm.echo.pageNum -= 1;
            hasExtraRow = true;
            loadPageData(vm.echo.pageNum + vm.curSheet.$offsetPage);
          }
          return true;
        }
      }

      // 保存表头项目
      vm.saveHeaderForm = function () {
        $rootScope.$broadcast('saveHeaderForm');
        vm.reloadSheets();
        $scope.$emit('toast', {
          type: 'success',
          content: '表头保存成功'
        });
      }

      function save(pageNo, verifySignOnly) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $rootScope.$broadcast('saveHeaderForm');

        if (!vm.editingRow || _.keys(vm.editingRow).length === 0) {
          return;
        }

        var match = _.assign({}, vm.editingRow),
          data;

        if (vm.isSave) {
          return;
        }


        match = addCustomKeyAndPrefix(match);

        data = angular.copy(_.omit(match, fieldFilter));
        data.sheetId = vm.curSheet.sheetId;

        var check = docUtil.prepareDataForSaving(data, 'nursingDoc', _.map(_.filter(vm.tpl.components, 'key'), 'key'), verifySignOnly);
        if (!check.result) {
          $rootScope.$broadcast('toast', {
            type: 'warning',
            content: check.error
          });
          vm.isSave = false;

          deferred.reject();

          return promise;
        }

        vm.isSave = true;
        return saveToServer(data).then(function () {
          vm.isSave = false;
          $scope.$emit('toast', {
            type: 'success',
            content: '记录内容保存成功'
          });

          if (pageNo != undefined) {
            loadPageData(vm.echo.curPage);
          }
        }, function () {
          vm.isSave = false;

          if (pageNo != undefined) {
            loadPageData(vm.echo.curPage);
          }
        });
      }

      function addAction(signData) {
        var datetimeCol = _.find($scope.panel.tpl.components, {
          key: 'datetime'
        });

        var rawData = {
          sheetId: vm.curSheet.sheetId,
          data: {
            date: datetimeCol ? undefined : moment().format('YYYY-MM-DD'),
            time: datetimeCol ? undefined : moment().format('HH:mm'),
            datetime: datetimeCol ? moment().format('YYYY-MM-DD HH:mm') : undefined
          }
        }

        // 签名
        docUtil.signRecord(rawData.data, "nursingDoc");


        if (vm.tpl.editType == 'inside') {
          vm.showData.push(angular.copy(rawData));
          vm.rawData.push(angular.copy(rawData));
        }

        $timeout(function () {
          if (vm.tpl.editType == 'popup') {
            vm.echo.selectedRawData = rawData;
          } else {
            angular.element('.table-content-row-wrapper:last').find('.table-content-row .content-item').eq(2).dblclick();
          }
        });
      }

      function addData() {
        var signData = _.get(conf, ['signShowImageOrName', 'configValue']) === 'name' ? profile.userName : profile.userCode;
        hasExtraRow = false;

        if (vm.echo.rowNum >= +vm.tpl.rowNum && vm.curSheet.rowCount % vm.curSheet.tplRowNum === 0) {
          vm.echo.pageNum += 1;
          hasExtraRow = true;

          if (vm.curSheet.$offsetPage == 0) {
            loadPageData(vm.echo.pageNum).then(function () {
              addAction(signData);
            });
          } else {
            loadPageData(vm.echo.pageNum + vm.curSheet.$offsetPage).then(function () {
              addAction(signData);
            });
          }
        }

        if (vm.editingRow) {
          save.then(function () {
            loadPageData((vm.echo.pageNum) + (vm.curSheet.$offsetPage || 1)).then(function () {
              addAction(signData);
            });
          });
        } else {

          if (!hasExtraRow) {
            loadPageData((vm.echo.pageNum == 0 && vm.curSheet.$offsetPage == 0 ? 1 : vm.echo.pageNum + vm.curSheet.$offsetPage)).then(function () {
              addAction(signData);
            });
          }
        }
      }

      function delData(data) {
        var id = data.dataId;
        delete vm.editPageNo;
        vm.echo.active = undefined;

        if (angular.isUndefined(id)) {
          _.remove(vm.tplData, function (item) {
            return item.dataId === id;
          });

          return true;
        } else {
          return nursingRest.delNursingData(id).then(function () {
            $q.all([vm.load.func().then(loadPageData), vm.reloadSheets()]).then(function () {
              loadMark();
            })
          });
        }
      }

      function hasUnsaveData() {
        return _.some(vm.tplData, function (item) {
          return angular.isUndefined(item.dataId);
        });
      }

      // 冠签
      function nursingCheckSign() {

        var data = _.omit(vm.echo.selected, fieldFilter);
        data = addCustomKeyAndPrefix(data);

        // 如果签过名的取消签名
        var actionType = ""
        if (data.checkUserCode != undefined && data.checkUserCode != "") {
          actionType = "nursingDocCheckSignCancel";
        } else {
          actionType = "nursingDocCheckSign";
        }

        docUtil.caSignRecord(data, actionType, "sign").then(function () {

          nursingRest.updateNursingData(data).then(function (rsp) {

            if (actionType == "nursingDocCheckSign") {
              $scope.$emit('toast', {
                type: 'success',
                content: '冠签成功'
              });
            } else {
              $scope.$emit('toast', {
                type: 'success',
                content: '取消冠签成功'
              });
            }

            vm.load.func();
          });
        });


      }

      function print() {
        modalService.open({
          size: 'sm',
          templateUrl: 'MNIS/components/nursingDoc/print.modal.html',
          data: {
            formData: {
              start: 1,
              end: vm.page
            }
          },
          ok: function (data) {
            return printByPage(data.start - 1, data.end);
          }
        });
      }

      function openPrintProgress(offsetPage) {

        offsetPage = offsetPage || 0;

        return modalService.open({
          size: 'sm',
          templateUrl: 'MNIS/components/nursingDoc/printProgress.modal.html',
          initFn: function () {
            var modal = this;

            $scope.$watch('panel.printPageNo', function (val) {
              modal.printPageNo = val;
            });
            modal.totalPage = vm.totalPrintPage;
            modal.offsetPage = offsetPage;
          }
        });
      }

      // 统计出入量
      function manualStatistics(event) {

        angular.element(event.target).blur();
        var sortedInOutStatTime = $filter('orderBy')(dic.inOutStatTime, 'dicCode');
        modalService.open({
          size: 'sm',
          templateUrl: 'MNIS/components/nursingDoc/statisticsTime.modal.html',
          data: {
            formData: {
              recordDate: moment().format('YYYY-MM-DD'),
              sheetId: vm.curSheet.sheetId,
              timeKey: sortedInOutStatTime[0].dicCode
            },
            metaData: {
              times: dic.inOutStatTime
            }
          },
          ok: function (data) {
            return nursingRest.getInOutStatData(data).then(function (response) {
              if (!response.data) {
                $rootScope.$broadcast('toast', {
                  type: 'warning',
                  content: '没有统计内容'
                });
                return;
              }

              var plainData = response.plain();

              plainData.rowSize = 1;
              vm.editingRow = plainData;

              var exist = _.findIndex(vm.showData, function (item) {
                return item.dataId === plainData.dataId;
              });

              if (exist > -1) {
                _.set(vm.showData, [exist], plainData);
                $rootScope.$broadcast('toast', {
                  type: 'info',
                  content: '该时间点已有统计内容'
                });
              } else {
                var correctItem = _.chain(vm.showData).filter(function (item) {
                  return new Date(plainData.recordDate).getTime() >= new Date(item.recordDate).getTime();
                }).last().value() || {};

                var lastIndex = _.findIndex(vm.showData, {
                  dataId: correctItem.dataId
                });

                if (lastIndex > -1) {
                  exist = lastIndex + 1;
                } else {
                  exist = vm.showData.length;
                }
                vm.showData.splice(exist, 0, plainData);
              }

              $timeout(function () {
                var pageNo = Math.ceil(plainData.rowInfile / vm.curSheet.tplRowNum);
                vm.echo.curPage = pageNo;
                $scope.$apply();
                save(pageNo);
              });
            });
          }
        });
      }

      // 设置自定页码
      function setCustomPage() {

        nursingRecordCustomPageUtil.setCustomPage($scope, vm.curSheet.sheetId,
          function () {
            return $q.all([vm.load.func(), vm.reloadSheets()]);
          });
      }

      function printCur() {
        printByPage(vm.echo.curPage - 1, vm.echo.curPage);
      }

      function printCon() {
        function doPrint(markOffset) {
          if (!mark) {
            printByPage(0, vm.page, 0, true);
            return;
          }

          if (markOffset && vm.page >= markOffset.page) {
            printByPage(markOffset.page - 1, vm.page, markOffset.row, true);
          } else {
            $rootScope.$broadcast('toast', {
              type: 'warning',
              content: '没有续打内容'
            });
          }
        }

        loadMark().then(function (response) {
          var markOffset;
          var changedRow = response.recentChangedMinRow;
          var markedRow = response.markRow;
          var influencePrint = response.influencePrint;
          var currentDiff = vm.curSheet.rowRequired - vm.curSheet.rowCount;
          var rowCount = _.chain(vm.printSheets).map('rowRequired').reduce(function (prev, cur) {
            return prev + cur;
          }, 0).value();

          if (changedRow && changedRow <= markedRow && influencePrint === 'Y') {
            var curMark = calcMark(changedRow);

            if (!curMark || markedRow >= rowCount) {
              $rootScope.$broadcast('toast', {
                type: 'warning',
                content: '没有续打内容'
              });

              return;
            }

            var prePage = curMark.page - 1;
            var preRow;

            if (!prePage) {
              preRow = 0;
            } else {
              preRow = calcPageRows(prePage);
            }

            modalService.open({
              size: 'middle',
              data: {
                metaData: {
                  rows: preRow,
                  changedRow: changedRow,
                  prePage: prePage
                }
              },
              ok: function () {
                var vm = this;
                setBreakPoint(vm.metaData.rows);
                markOffset = calcCursor(preRow);
                doPrint(markOffset);

                return true;
              },
              initFn: function () {
                var modal = this;
                modal.printCurrentMark = function () {
                  markOffset = calcCursor(markedRow);

                  doPrint(markOffset);

                  modal.cancel();
                };
              },
              templateUrl: 'MNIS/components/nursingDoc/cursor.modal.html'
            });

            return;
          }

          if (markedRow >= (rowCount - currentDiff)) {
            $rootScope.$broadcast('toast', {
              type: 'warning',
              content: '没有续打内容'
            });

            return;
          }

          markOffset = calcCursor(markedRow);
          doPrint(markOffset);
        });
      }

      function removeUnderscore(sourceData) {
        var tempData = angular.copy(sourceData);
        var customKeys = _.chain(vm.currentPageColumns.content).keys().compact().uniq().value();
        _.each(tempData, function (item) {

          // 将自定义数据取第二个索引值
          customKeys.forEach(function (key) {
            var dataKeys = _.keys(item.data);
            var changedKey = _.find(dataKeys, function (dataKey) {
              return dataKey.indexOf(key + '_') > -1;
            });

            if (item.data && _.get(vm.currentPageColumns, 'content') && changedKey && !_.get(vm.currentPageColumns, ['content', changedKey])) {
              var columnTitle = vm.currentPageColumns.content[key];
              var suffix = columnTitle ? '_' + columnTitle : columnTitle;
              var mergedKey = key + suffix;

              if (vm.currentPageColumns && !item.data[mergedKey] && item.data[changedKey]) {
                if (!item.customColumnDataDiff) {
                  item.customColumnDataDiff = {};
                }

                item.customColumnDataDiff[key] = {
                  key: key,
                  before: changedKey.replace(key + '_', ''),
                  after: columnTitle
                };

                item.data[key] = item.data[changedKey];
              } else {
                item.data[key] = item.data[mergedKey];
              }

              delete item.data[changedKey];
              delete item.data[mergedKey];
            }
          });
        });

        return tempData;
      }

      function replaceBrWithWhiteSpace(sourceData) {
        return _.map(sourceData, function (item) {
          var temp = angular.copy(item);

          _.each(temp.data, function (value, key) {
            var type = _.chain(vm.tpl.components).find({
              key: key
            }).get('type').value();
            if (angular.isString(value)) {
              var reg = new RegExp('&nbsp', "g")
              var valueString = value.replace(reg, '');
              temp.data[key] = valueString.replace(/<br>|<div>|<\/div>/g, '');

              if (!isNaN(Number(temp.data[key])) && type === 'number') {
                temp.data[key] = (+temp.data[key]);
              }
            }
          });

          return temp;
        });
      }

      function replaceBrWithDiv(sourceData, tpl, isPrint) {
        var whiteList = ['time', 'date', 'datatime', 'verifySignature'];
        return _.chain(angular.copy(sourceData))
          .filter('dataId')
          .map(function (item) {
            var rowStart = item.rowFrom;
            var rowEnd = item.rowTo;
            var temp = _.assign({}, item);

            // item.$count = item.rowSize;

            _.each(temp.data, function (value, key) {
              rowEnd = temp.rowTo;
              var splited = typeof value === 'string' && value.split(/<br>/);
              if (splited && rowEnd === 0) {
                rowEnd = splited.length;
              }

              if (isPrint) {
                rowEnd = 100000;
              }

              var columnDef = _.find(tpl.components, {
                'key': key
              });

              var containDateAndTime = _.some(whiteList, function (whiteItem) {
                return columnDef && columnDef.type.indexOf(whiteItem) > -1;
              });

              // 日期时间、时间、日期、审核签名等控件开头需要显示
              if (splited && !containDateAndTime) {
                var intercepted = splited.slice(rowStart, rowEnd);
                var diff = rowEnd - rowStart;

                temp.rowLength = diff <= temp.rowLength ? temp.rowLength : diff;

                temp.data[key] = _.chain(intercepted).map(function (item) {
                  return '<div>' + item + '</div>'
                }).value().join('');
              }
            });

            if (typeof temp.rowLength === 'undefined') {
              temp.rowLength = temp.rowSize;
            }

            return temp;
          })
          .value();
      }

      function printAfterAjax(collection, pageNo, index, offset, callback) {
        var sheet = _.get(collection, index);
        printParams.push({
          sheetId: _.get(collection, [index, 'sheetId']),
          pageNo: pageNo
        });
        loadTpl(sheet.tplId).then(function () {
          loadPageData(pageNo, _.get(collection, [index, 'sheetId'])).then(function () {
            $timeout(function () {
              printPage(pageNo, index, offset, callback);
            });
          });
        });
      }

      function printByPage(start, end, offset, isUpdateMarkRow) {

        var defer = $q.defer();
        var prints = [];
        vm.printPagesHtml = [];
        _.each(vm.printSheets, function (sheet) {
          var startPage = sheet.$offsetPage,
            endPage = sheet.$offsetPage + sheet.$totalPage;
          if (start >= endPage || end <= startPage) {
            return;
          }
          if (start > startPage && start < endPage) {
            _.set(sheet, 'offset.start', start - startPage);
          }
          if (end > startPage && end < endPage) {
            _.set(sheet, 'offset.end', endPage - end);
          }
          prints.push(sheet);
        });

        vm.printPageNo = start + 1;
        vm.printStartPageNo = start + 1;
        vm.printIndex = 0;
        vm.totalPrintPage = _.reduce(prints, function (memo, val) {
          return memo + val.$totalPage;
        }, 0);

        var modalInstance;

        if (end - start > 1) {
          modalInstance = openPrintProgress(vm.printStartPageNo);
        }

        var loop = function () {
          if (vm.printPageNo >= end) {
            defer.resolve();
            modalInstance && modalInstance.close();
            // 超多页情况分片打印
            var pageChunk = 30;
            var i = 0;

            var chunkLoop = function () {
              if (i < vm.printPagesHtml.length) {

                chunkPrint(vm.printPagesHtml.slice(i, i + pageChunk).join(''), i + pageChunk >= vm.printPagesHtml.length && isUpdateMarkRow, chunkLoop);
                i += pageChunk;
              }
            };

            chunkLoop();

            cursor = _.max(vm.tplData, function (item) {
              return item.rowInfile;
            });

            return;
          }

          if (_.get(prints, [vm.printIndex, '$totalPage']) === vm.printPageNo && vm.printIndex < prints.length - 1) {
            vm.printIndex += 1;
          }

          vm.printPageNo += 1;

          printAfterAjax(prints, vm.printPageNo, vm.printIndex, offset, loop);
        };

        printAfterAjax(prints, vm.printPageNo, vm.printIndex, offset, loop);

        return defer.promise;
      }

      var printParams = [];

      // 打印完成之后，调用打印接口标记
      var vitalSignPrintSuccess = function () {
        var index = _.findIndex(printParams, function (item) {
          return item.pageNo == vm.echo.curPage;
        })

        if (index === -1) {
          printParams.push({
            sheetId: vm.curSheet.sheetId,
            pageNo: vm.echo.curPage || 1
          });
        }

        // 设置最后一行数据为当前打印标记
        setBreakPoint(vm.showData[vm.showData.length - 1], true).then(function () {
          nursingRest.setAttendForPrint(printParams).then(function () {
            vm.showByPrinting = false;
            vm.printFlag = true;
            printParams = [];

            setSheetWhenPrintFinished();
          });
        });
      }

      var vitalSignPrintCancel = function () {
        vm.showByPrinting = false;
        printParams = [];
        setSheetWhenPrintFinished();
      }

      // 打印结束时，更新选中的SHEET状态
      function setSheetWhenPrintFinished() {        

        var findSheet = _.find(vm.allSheets, function (item) {
          return (vm.curSheet.tplId == item.tplId && vm.echo.curPage > item.$offsetPage && vm.echo.curPage <= item.$offsetPage + item.$totalPage);
        });

        if (findSheet && findSheet.sheetId != vm.curSheet.sheetId) {
          vm.curSheet = findSheet;
        } 
      }

      function chunkPrint(html, isUpdateMarkRow, callback) {
        var promise = vm.printHtml(html, 1, vitalSignPrintSuccess, vitalSignPrintCancel, true);
        if (promise) {
          promise.then(callback);
        }

        return promise;
      }

      function printPage(pageNo, index, offset, callback) {
        var element = angular.element('.doc-box .doc-wrapper').clone();
        var pagination = '<div class="pagination-footer">第' + pageNo + '页</div>';

        element.find('.table-content-wrapper').css({
          height: vm.lineHeight * (+vm.tpl.rowNum) + 'px',
          overflow: 'visible'
        });

        // 续打隐藏网格
        if (offset > 0 && vm.printStartPageNo === pageNo) {
          var total = 0;
          element.find('.table-border-pages').remove();
          element.find('.doc-footer').remove();
          element.find('.doc-header').addClass('printHidden');
          element.find('.table-header').addClass('printHidden');
          element.find('.in-out-line').addClass('printBorderHidden');
          element.find('.table-content-row-wrapper').each(function (i, rowItem) {
            var elemItem = angular.element(rowItem);
            var diff = elemItem.data('count') - (elemItem.data('from') || 0);

            total += diff;

            if (offset >= total) {
              elemItem.addClass('printHidden');
            }
          });
        } else {
          element.find('.doc-footer').after(pagination);
        }

        var marginStr = _.chain(vm.tpl.margin).map(function (val, key) {
          return 'margin-' + key + ': ' + val + 'mm;';
        }).join('').value();

        // 设置打印方向
        var pageSize = _.chain(vm.tpl)
          .get('size')
          .split(',')
          .map(function (item) {
            return parseInt(item);
          })
          .value();

        var printDirection = '<style>@media print{@page {' + marginStr + 'size: ' + pageSize[0] + 'mm ' + pageSize[1] + 'mm ' + '}}</style>';

        if (!vm.echo.isCurrentBlankPage)
          vm.printPagesHtml.push(element[0].outerHTML + printDirection);
        callback();
      }

      function printSync() {
        setBreakPoint(cursor, true);
      }

      function printFromThisRow(index) {
        setBreakPoint(vm.showData[index]).then(printCon);
      }

      function setBreakPoint(data, isSync) {
        var offset = _.isObject(data) ? data.rowInfile - 1 : data;

        if (isSync) {
          offset = data.rowInfile;
        }

        if (mark && mark.tplId === vm.curSheet.tplId) {
          mark.markRow = offset;
        } else {
          mark = {
            inhosCode: vm.patient.inhosCode,
            markRow: offset,
            // fileId: vm.curSheet.fileId,
            tplId: vm.curSheet.tplId
          }
        }

        return nursingRest.updateMarkRows(mark).then(function (data) {
          handleMark(data);
        });
      }

      function fieldFilter(value, key) {
        return key.indexOf('$') === 0 || key === 'children';
      }

      function findSheetByPage(page) {
        return _.find(vm.allSheets, function (sheet) {
          var startPage = sheet.$offsetPage,
            endPage = sheet.$offsetPage + sheet.$totalPage;
          return page > startPage && page <= endPage;
        });
      }

      function calcPageRows(page) {
        var curSheet = findSheetByPage(page);
        var count = 0;
        _.some(vm.allSheets, function (sheet) {
          if (sheet !== curSheet) {
            count += sheet.rowRequired;
          } else {
            if (page === sheet.$offsetPage + sheet.$totalPage) {
              count += sheet.rowCount;
            } else {
              count += (page - sheet.$offsetPage) * sheet.tplRowNum;
            }
            return true;
          }
        });
        return count;
      }
    }
  }

})();
