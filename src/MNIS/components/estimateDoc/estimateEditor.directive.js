(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('estimateEditor', estimateEditor);


  function estimateEditor() {

    var directive = {
      restrict: "E",
      scope: {
        curSheet: "=",
        patient: "=",
        reloadSheets: "=",
        editorType: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, modalService, sessionService, utilService, _, nursingRest, moment, $filter, $timeout, docUtil, $q) {

        var vm = this;

        vm.save = save;
        vm.tableData = {};
        vm.validationOption = {};

        var profile = sessionService.getProfile();
        var configHelper = sessionService.getConfHelper();
        var conf = configHelper.conf;
        var rowCount = 0;


        // 初始化视图
        initViewModel();

        function initViewModel() {

          vm.signType = _.get(conf, ["signShowImageOrName", "configValue"]);
          vm.insert = insert;
          vm.remove = remove;
          vm.insertAtLastRow = insertAtLastRow;
          vm.choosePrintType = choosePrintType;
          vm.modalService = modalService;
          vm.print = print;
          vm.printAll = printAll;
          vm.printCurrent = printCurrent;
          vm.docShowScale = 100;
          vm.editPage = 0;
          if ($scope.reloadSheets) {
            vm.loadSheets = $scope.reloadSheets;
          }

          vm.pageEcho = {
            curPage: 1,
            refreshPageRecordData: refreshPageRecordData,
            firstPage: firstPage,
            lastPage: lastPage,
            nextPage: nextPage,
            pageInputChange: pageInputChange,
            pageInputBlur: pageInputBlur,
            previewPage: previewPage,
            isDataChanged: false,
            totalPage: 1
          };

          vm.loadEstimateData = {
            func: getEstimateData,
            init: false
          }

          // 监测selectedNode绑定变化
          var hlpgdWacher = $scope.$watch("curSheet", function (value) {
            if (value) {
              reloadPageData(value);
            }
          });
          $scope.$on("$destroy", hlpgdWacher);
        }

        // 重新加载
        function reloadPageData(value) {
          rowCount = value.rowCount;
          vm.loadEstimateData.func(value.tplId, value.sheetId).then(function () {

            if (isEstiamteVersionV11()) {

              if (vm.hlpgd.tpl.components.combineType == "seperate") {
                setCurPage(getTotalPage() - 1);
              } else {
                setCurPage(getTotalPage());
              }
              
              refreshPageRecordData();
            }
          })
        }

        // 获取评估单数据
        function getEstimateData(tplId, sheetId) {
          var deffered = $q.defer();
          var getTpl = nursingRest.getNursingDoc(tplId);
          var getData = nursingRest.getEvaluateData().getList({
            sheetId: sheetId,
            pageNo: vm.pageEcho.curPage
          });

          var getHeaders = nursingRest.getCustomColumns().customGET('page', {
            sheetId: sheetId,
            pageNo: vm.pageEcho.curPage
          });

          var customSheetsQ = nursingRest.getNursingSheets({
            inhosCode: $scope.patient.inhosCode
          });

          $q.all([getTpl, getData, getHeaders, customSheetsQ]).then(function (responses) {
            var tpl = responses[0].plain();
            var data = responses[1].plain();
            var headerData = responses[2].plain();
            var allSheets = responses[3].plain();
            var tplData = [];

            if (angular.isArray(data) && data.length === 0 && tpl.rowNum) {
              tplData = [];
            } else {
              var group = _.groupBy(_.map(data, function (row) {
                var tableKey = Object.keys(row.data)[0];
                return {
                  dataId: row.dataId,
                  sheetId: row.sheetId,
                  tableKey: tableKey,
                  recordDate: row.recordDate,
                  data: row.data[tableKey]
                }
              }), 'tableKey');

              tplData = group;
            }

            vm.hlpgd = {
              tpl: tpl,
              data: tplData,
              headers: headerData.header,
              printFlag: headerData.printFlag,
              showByPrinting: false
            };

            rowCount = _.find(allSheets, function (item) {
              return item.sheetId === sheetId;
            }).rowCount;

            deffered.resolve();
          });

          return deffered.promise;
        }

        // 保存表头项目
        vm.saveHeaderForm = function () {
          $rootScope.$broadcast("saveHeaderForm");
          $scope.$emit("toast", {
            type: "success",
            content: "表头保存成功"
          });
        };


        // 重新加载分页数据（V1.1）
        function refreshPageRecordData(callback, callbackArgs) {
          vm.pageEcho.isDataChanged = true;
          getEstimateData($scope.curSheet.tplId, $scope.curSheet.sheetId).then(function () {
            loadPageRecordData(vm.pageEcho.curPage, callback, callbackArgs);
          });
        }

        var tempCurrentPage = null;
        var beforeBlurPage = null;
        // 加载分页数据（V1.1）
        function loadPageRecordData(page, callback, callbackArgs) {
          vm.pageEcho.totalPage = getTotalPage();
          tempCurrentPage = getTotalPage();

          page = Math.max(1, page);
          page = Math.min(page, vm.pageEcho.totalPage);

          var tableCount = isEstiamteVersionV11() ? vm.hlpgd.tpl.components.tablesV11.length : vm.hlpgd.tpl.components.tables.length;
          vm.pageEcho.recordDataInPage = [];

          if (page != vm.pageEcho.curPage || vm.pageEcho.isDataChanged) {

            for (var i = 0; i < tableCount; i += 1) {
              var tableData = vm.hlpgd.data[i];
              if (!tableData) {
                tableData = [];
              }

              var st = 0;
              var ed = Math.min(
                _.get(vm.hlpgd, ["data", i, "length"]) || 0,
                page * vm.hlpgd.tpl.rowNum
              );

              var recordData = tableData.slice(st, ed);
              for (
                var j = vm.hlpgd.tpl.rowNum - recordData.length - 1; j >= 0; j -= 1
              ) {
                recordData.push("empty");
              }
              vm.pageEcho.recordDataInPage.push(recordData);
            }
          }

          $timeout(function () {
            if (callback) {
              var outerHTML = angular.element(".estimate-config-page-panel")[0]
                .outerHTML;
              callbackArgs[2].push(outerHTML);

              var curPage = callbackArgs[1];
              var tableIndex = callbackArgs[3];
              var printType = callbackArgs[4];
              if (
                tableIndex < vm.hlpgd.tpl.components.tablesV11.length - 1 &&
                printType != 0
              ) {
                tableIndex++;
              } else {
                curPage++;
                tableIndex = 0;
              }

              callback(
                callbackArgs[0],
                curPage,
                callbackArgs[2],
                tableIndex,
                callbackArgs[4],
                callbackArgs[5]
              );
            }
          });

        }

        // 计算总页数
        function getTotalPage() {
          if (vm.hlpgd.tpl.rowNum == undefined || vm.hlpgd.tpl.rowNum <= 0) {
            vm.hlpgd.tpl.rowNum = 10;
            $scope.$emit("toast", {
              content: "护理评估不能正常分页，请尽快重新设置模版行数限制，未设置时以每页默认10行显示！",
              type: "warn"
            });

            return 1;
          }

          var seperatorCnt = 1;

          if (vm.hlpgd.tpl.components.combineType == "seperate") {

            seperatorCnt = vm.hlpgd.tpl.components.tablesV11.length == 1 ? 1 : vm.hlpgd.tpl.components.tablesV11.length;

          } else {
            seperatorCnt = vm.hlpgd.tpl.components.tablesV11.length;
          }

          if (rowCount > 0) {
            if (vm.hlpgd.data != undefined && vm.hlpgd.tpl.rowNum != 0) {
              var totalPage = Math.ceil(Math.ceil(rowCount / seperatorCnt) / Number(vm.hlpgd.tpl.rowNum));

              return vm.hlpgd.tpl.components.combineType == "seperate" ? totalPage * seperatorCnt : totalPage;
            }
          }
          return vm.hlpgd.tpl.components.combineType == "seperate" ? seperatorCnt : 1;
        }

        // 第一页
        function firstPage() {
          setCurPage(1);
          getEstimateData($scope.curSheet.tplId, $scope.curSheet.sheetId).then(function () {
            loadPageRecordData(vm.pageEcho.curPage);
          });
        }

        // 最后一页
        function lastPage() {
          setCurPage(vm.pageEcho.totalPage);
          getEstimateData($scope.curSheet.tplId, $scope.curSheet.sheetId).then(function () {
            loadPageRecordData(vm.pageEcho.curPage);
          });
        }

        // 下一页
        function nextPage() {
          if (vm.pageEcho.curPage == "") {
            return;
          }
          setCurPage(Number(vm.pageEcho.curPage) + 1);
          getEstimateData($scope.curSheet.tplId, $scope.curSheet.sheetId).then(function () {
            loadPageRecordData(vm.pageEcho.curPage);
          });
        }

        // 上一页
        function previewPage() {
          if (vm.pageEcho.curPage == "") {
            return;
          }
          setCurPage(Number(vm.pageEcho.curPage) - 1);
          getEstimateData($scope.curSheet.tplId, $scope.curSheet.sheetId).then(function () {
            loadPageRecordData(vm.pageEcho.curPage);
          });
        }

        // 设置当前显示页码
        function setCurPage(page, forcedPage) {

          if (forcedPage || (page <= getTotalPage() && page > 0)) {
            vm.editPage = page;
            vm.pageEcho.curPage = page;
            beforeBlurPage = page;
          }
        }

        // 确定设置页码
        vm.confirmCurPage = function (page) {

          if (page > getTotalPage() || page <= 0 || !utilService.isRealNum(page)) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '请输入正确的页码或范围[1' + '-' + getTotalPage() + ']'
            });
            setCurPage(vm.pageEcho.curPage);
            return;
          }

          setCurPage(page);
          vm.pageEcho.refreshPageRecordData();
        }

        // 页码输入变更
        function pageInputChange(page) {
          if (!page) {
            return;
          }
          page = Number(page);
          if (page > vm.pageEcho.totalPage || page <= 0) {
            vm.editPage = tempCurrentPage;
          }
        }

        // 失焦
        function pageInputBlur() {
          vm.editPage = beforeBlurPage;
        }

        // 模板是否为V11版本
        function isEstiamteVersionV11() {
          return vm.hlpgd.tpl.components.render == "v1_1";
        }

        // V11版本全部打印
        function printAll() {
          modalService.open({
            size: "sm",
            templateUrl: "MNIS/modules/docs/estimateEdit/printTypeV11.modal.html",
            data: {
              formData: {
                start: 1,
                end: vm.pageEcho.totalPage,
                multiTable: vm.hlpgd.tpl.components.tablesV11.length > 1,
                combinePrint: false
              }
            },
            ok: function (data) {
              printRecursion(vm.pageEcho.curPage, data.start, [], 0, 0, data.end);
              return true;
            }
          });
        }

        var printParams = [];

        // 打印完成之后，调用打印接口标记
        var vitalSignPrintSuccess = function () {
          var index = _.findIndex(printParams, function (item) {
            return item.pageNo == vm.pageEcho.curPage;
          })

          if (index === -1) {
            printParams.push({
              sheetId: $scope.curSheet.sheetId,
              pageNo: vm.pageEcho.curPage
            });
          }

          nursingRest.setAttendForPrint(printParams).then(function (res) {
            vm.hlpgd.showByPrinting = false;
            vm.hlpgd.printFlag = true;
            printParams = [];
          });
        }

        var vitalSignPrintCancel = function () {
          vm.hlpgd.showByPrinting = false;
          printParams = [];
        }

        // V11版本打印当前页
        function printCurrent() {
          printRecursion(
            vm.pageEcho.curPage,
            vm.pageEcho.curPage,
            [],
            0,
            0,
            vm.pageEcho.curPage
          );
        }

        // V11版本递归逐页加载打印
        function printRecursion(
          prePage,
          curPage,
          printHtmlContent,
          tableIndex,
          printType,
          endPage
        ) {

          if (curPage > endPage) {
            setCurPage(prePage);
            vm.pageEcho.refreshPageRecordData();

            var html = "";
            _.forEach(printHtmlContent, function (item) {
              html += item;
            });
            vm.printHtml(html, 1, vitalSignPrintSuccess, vitalSignPrintCancel, true);

            return;
          }
          setCurPage(curPage);

          printParams.push({
            sheetId: $scope.curSheet.sheetId,
            pageNo: vm.pageEcho.curPage
          });

          if (vm.hlpgd.tpl.components.tablesV11.length == 1 || printType == 0) {
            $timeout(function () {
              vm.pageEcho.refreshPageRecordData(printRecursion, [
                prePage,
                curPage,
                printHtmlContent,
                tableIndex,
                printType,
                endPage
              ]);
            });
          } else {
            // 控制另外一张表
            $timeout(function () {
              vm.pageEcho.refreshPageRecordData(printRecursion, [
                prePage,
                curPage,
                printHtmlContent,
                tableIndex,
                printType,
                endPage
              ]);
            });
          }
        }

        // 在最后一行新增数据
        function insertAtLastRow() {
          var tables = vm.hlpgd.tpl.components.tables;
          if (vm.hlpgd.tpl.components.render == "v1_1") {
            tables = vm.hlpgd.tpl.components.tablesV11;
          }

          for (var i = 0; i < tables.length; i++) {
            if (vm.hlpgd.data[i] == undefined || vm.hlpgd.data[i].length == 0)
              vm.hlpgd.data[i] = [];

            if (isEstiamteVersionV11() && i > 0) continue;

            insert({
              tableData: vm.hlpgd.data[i],
              tpl: vm.hlpgd.tpl,
              rowIndex: vm.hlpgd.data[i].length,
              tableIndex: i,
              sheetId: $scope.curSheet.sheetId,
              needEdit: i == 0,
              jumpToPage: i == 0
            });
          }
        }

        // 插入一条新的数据
        function insert(params) {
          if (params.event != undefined)
            params.event.originalEvent.stopPropagation();

          if (!isEstiamteVersionV11()) {
            insertVersion1_0(params);
            return;
          }

          if (typeof params.tableData === "undefined") {
            params.tableData = [];
          }

          params.tableData.splice(params.rowIndex + 1, 0, {
            data: {
              datetime: moment().format("YYYY-MM-DD HH:mm"),
              date: moment().format("YYYY-MM-DD"),
              time: moment().format("HH:mm")
            },
            tableKey: params.tableIndex
          });

          if (isEstiamteVersionV11() && params.needEdit) {
            var rowIndex = params.rowIndex;
            if (vm.hlpgd.tpl.components.combineType == "seperate") {
              rowIndex =
                params.rowIndex -
                Math.floor(
                  (vm.pageEcho.curPage - 1) / vm.hlpgd.tpl.components.tablesV11.length
                ) *
                vm.hlpgd.tpl.rowNum;
            }

            vm.newDataEcho = {
              data: params.tableData[params.rowIndex + 1] || _.last(params.tableData),
              bindHeader: vm.hlpgd.tpl.components.dataTableHeader[params.tableIndex],
              tableIndex: params.tableIndex,
              rowIndex: rowIndex,
              isNewItem: true
            };
          } else {
            return save(
              params.tableData[params.rowIndex + 1] || _.last(params.tableData),
              params.tableIndex,
              params.sheetId,
              params.jumpToPage
            );
          }

          return true;
        }

        // V1.0插入记录
        function insertVersion1_0(params) {
          // 空表新增V1.0逻辑
          if (params.isAddNewLine) {
            for (var i = 0; i < params.tableCount; i += 1) {
              params.tableData[i] = [];
              params.tableData[i].push({
                data: {
                  datetime: moment().format("YYYY-MM-DD HH:mm"),
                  date: moment().format("YYYY-MM-DD"),
                  time: moment().format("HH:mm")
                },
                tableKey: params.tableIndex
              });
              save(
                params.tableData[i][0] || _.last(params.tableData),
                i,
                params.sheetId
              );
            }
          } else {

            params.tableData.splice(params.rowIndex + 1, 0, {
              data: {
                datetime: moment().format("YYYY-MM-DD HH:mm"),
                date: moment().format("YYYY-MM-DD"),
                time: moment().format("HH:mm")
              },
              tableKey: params.tableIndex
            });

            save(
              params.tableData[params.rowIndex + 1] || _.last(params.tableData),
              params.tableIndex,
              params.sheetId,
              params.jumpToPage
            );
          }
        }

        // 删除一行
        function remove($event, collection, index) {

          $event.originalEvent.stopPropagation();
          if (!angular.isArray(collection) || index >= collection.length) {
            return;
          }

          nursingRest
            .getEvaluateData()
            .customDELETE("" + collection[index].dataId)
            .then(function () {
              $scope.$emit("toast", "已删除!");
              $scope.$emit('updatePatientEvaluateStatus');
              collection.splice(index, 1);

              if (vm.hlpgd.tpl.components.combineType == "combine") {
                if (collection.length == 0 && vm.pageEcho.curPage === vm.pageEcho.totalPage && vm.pageEcho.curPage > 1) {
                  setCurPage(vm.pageEcho.curPage - 1);
                  vm.pageEcho.curPage--;
                }
              } else if (vm.hlpgd.tpl.components.combineType == "seperate") {
                if (collection.length == 0 && vm.pageEcho.curPage > vm.hlpgd.tpl.components.tablesV11.length && (vm.pageEcho.totalPage - vm.pageEcho.curPage <= vm.hlpgd.tpl.components.tablesV11.length)) {
                  setCurPage(vm.pageEcho.curPage - vm.hlpgd.tpl.components.tablesV11.length);
                }
              }

              vm.pageEcho.refreshPageRecordData();
            });
        }

        $scope.$on('estimateRecordEditPanelClose', function (value) {
          if (vm.hlpgd.tpl.components.combineType == "combine" && value.targetScope.hlpgd.data[0] && !_.last(value.targetScope.hlpgd.data[0]).sheetId) {
            vm.hlpgd.data[0].splice(vm.hlpgd.data[0].length - 1, 1);
          }
        });

        // 保存数据
        function save(data, tableIndex, sheetId, jumpToPage, isNewItem, verifySignOnly) {
          delete vm.newDataEcho;

          var dataCopy = _.assign({}, data);

          var formData = _.assign({
            sheetId: sheetId,
            data: _.fromPairs([
              [tableIndex, dataCopy.data || {}]
            ])
          },
            _.pick(dataCopy, ["dataId"])
          );

          // 验证录入时间、日期有效性
          var headers = [];
          if (isEstiamteVersionV11()) {
            headers = _.map(
              _.filter(
                vm.hlpgd.tpl.components.dataTableHeader[tableIndex],
                "isValueHeader"
              ),
              "dataBind"
            )
          } else {
            headers = _.map(vm.hlpgd.tpl.components.tables[tableIndex].tableHeader, 'dataBind')
          }

          var check = docUtil.prepareDataForSaving(
            dataCopy,
            "estimateDoc",
            headers,
            verifySignOnly
          );

          if (!check.result) {
            $rootScope.$broadcast("toast", {
              type: "warning",
              content: check.error
            });

            var deferred = $q.defer();
            var promise = deferred.promise;
            deferred.reject();

            return promise;
          }

          return nursingRest
            .getEvaluateData()
            .customPOST(formData)
            .then(function (response) {
              var key = Object.keys(response.plain().data)[0];
              var _data = _.assign({}, response.plain());
              _data.data = _data.data[key];
              _.assign(data, _data);

              // console.log("Response FormData", formData);
              // console.log("Response Data", data);
              // console.log("Response hlpgd", vm.hlpgd);

              $scope.$emit("toast", "保存成功！");
              $scope.$emit('updatePatientEvaluateStatus');
              if (isEstiamteVersionV11()) {
                // 如果是新增需要为其它表添加数据
                if (isNewItem && vm.hlpgd.tpl.components.combineType != "seperate") {
                  var queryPromise = [];
                  for (var i = 1; i < vm.hlpgd.tpl.components.tablesV11.length; i++) {
                    var query = insert({
                      tableData: vm.hlpgd.data[i],
                      tpl: vm.hlpgd.tpl,
                      rowIndex: vm.hlpgd.data[i].length,
                      tableIndex: i,
                      sheetId: sheetId,
                      needEdit: false,
                      jumpToPage: false
                    });
                    queryPromise.push(query);
                  }
                }

                if (isNewItem && vm.hlpgd.tpl.components.combineType == "seperate" && tableIndex == 0) {
                  setCurPage((_data.pageNo - 1), true);
                } else {
                  setCurPage(_data.pageNo, true);
                }

                reArrangeTableDataAfterSave(data, tableIndex);
              }
            });

        }

        // 重新排列保存后的记录
        function reArrangeTableDataAfterSave(data, tableIndex) {
          var orderFilter = $filter("orderBy");

          var headerList = _.map(
            _.filter(
              vm.hlpgd.tpl.components.dataTableHeader[tableIndex],
              "isValueHeader"
            ),
            "dataBind"
          );
          var datetimeFormat = docUtil.getDateTimeFormat(headerList);
          if (datetimeFormat == "combine") {
            vm.hlpgd.data[tableIndex] = orderFilter(
              vm.hlpgd.data[tableIndex],
              "data.datetime"
            );
          } else if (datetimeFormat == "seperate") {
            vm.hlpgd.data[tableIndex] = orderFilter(vm.hlpgd.data[tableIndex], [
              "data.date",
              "data.time"
            ]);
          }

          refreshPageRecordData();
        }

        // V1.0选择打印方式
        function choosePrintType() {
          modalService.open({
            size: "sm",
            templateUrl: "MNIS/modules/docs/estimateEdit/printType.modal.html"
          });
        }

        // 签名本页所有我的记录
        vm.signAllPage = function () {

          var editingSignDataRecord = [];
          _.forEach(vm.pageEcho.recordDataInPage, function (tableData) {
            _.forEach(tableData, function (recordData) {
              if (recordData != "empty") {

                var editingRecord = _.clone(recordData);
                editingRecord.userCode = profile.userCode;

                editingSignDataRecord.push(editingRecord);
              }
            });
          });

          docUtil.caSignRecord(editingSignDataRecord, "estimateDoc", 'sign').then(function (result) {

            var signedRecords = result.datas;

            _.forEach(signedRecords, function (recordData) {
              var signedRecordData = recordData.data;
              recordData.data = {};
              recordData.data[recordData.tableKey] = signedRecordData;
              delete recordData.tableKey;
            })

            nursingRest.updateEvaluateDataList(signedRecords).then(function () {
              reloadPageData($scope.curSheet);
            }, function () {
              reloadPageData($scope.curSheet);
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

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateEditor.tpl.html",
      link: function (scope) { }
    }

    return directive;
  }
})();