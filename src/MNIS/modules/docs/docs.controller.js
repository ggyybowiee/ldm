(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('DocsController', DocsController);

  /** @ngInject */
  function DocsController($rootScope, $state, $stateParams, $q, $scope, docRest,
    sessionService, mnisSessionCache, nursingRest, $timeout, docUtil, hospitalRest,
    modalService, sysRest, _, $location, moment, sysService) {
    var vm = this,
      profile = sessionService.getProfile(),
      dicHelper = sessionService.getDicHelper(),
      hid = $stateParams.inhosCode,
      isHis = +$stateParams.isHis,
      tplId = $stateParams.tplId,
      wardHelper = mnisSessionCache.getWardHelper(),
      conf = sessionService.getConfHelper().conf;
    var sdk = window.sdk;
    vm.isHis = isHis;
    vm.hid = hid;
    vm.tplId = tplId;
    vm.loadSheets = loadSheets;
    vm.setSelectedDocSheet = setSelectedDocSheet;
    vm.sdkOperate = sdkOperate;

    vm.saveDoc = saveDoc;
    vm.print = print;
    vm.resetHeight = resetHeight;
    vm.openOuter = $location.$$search.openOuter ? $location.$$search.openOuter : false;
    vm.wardCode = ($location.$$search.openOuter && $location.$$search.wardCode) ? $location.$$search.wardCode : profile.wardCode;
    vm.isPatLoadingEcho = {
      isOpen: false,
      isfullPageLoaded: false
    };
    vm.showByPrinting = false;
    vm.pathParam = {
      selectedIndex: 0,
      recordTimeIndex: 0
    }

    // 体温单结点
    vm.patientTemperatureNodes = {
      itemText: '体温单',
      category: 'documentPrintHistory',
      children: [{
          itemText: '体温单查询',
          category: 'tempSheet'
        }, {
          itemText: '患者事件录入',
          category: 'eventList'
        }
        // ,{
        //   itemText: '体温单录入',
        //   category: 'tempSheetInput'
        // }
      ]
    };

    // 患者查询结点
    vm.patientQueryNodes = {
      itemText: '患者查询',
      children: [{
          itemText: '医嘱查询',
          category: 'orderList'
        },
        {
          itemText: '检验报告查询',
          category: 'testList'
        },
        {
          itemText: '检查报告查询',
          category: 'examList'
        }
      ]
    };

    // “MEWS评分”通过系统配置动态展示
    if (_.get(conf, ['showMewsCategory', 'configValue']) === '1') {
      vm.patientQueryNodes.children.push({
        itemText: 'MEWS评分',
        category: 'mewsList'
      });
    }

    // 加载患者路径
    vm.loadPatientPath = {
      func: function () {

        var tc = getTemperatureConfig();
        var us = getHosUserShiftExt();
        var pp = getPaitentPath();

        return $q.all([tc, us, pp]);
      }
    }

    // 选中显示项监听
    var selectedIndexWatcher = $scope.$watch('vm.pathParam.selectedIndex', function (value) {
      if (vm.loadedStatus)
        vm.loadedStatus[vm.pathParam.selectedIndex] = true;
      $timeout(function () {
        resetHeight();
        // $scope.$emit('idocInit');
        $scope.$emit('hideIdoc');
      });

      if (value === 2) {
        if ($location.$$search.type === 'evaluate') {
          vm.loadSheets.func().then(function () {
            $timeout(function () {
              select(taskRemindFromEvaluate);
              vm.selectedNode = taskRemindFromEvaluate;
            }, 0);
          });
        } else {
          vm.loadSheets.func().then(function () {
            toCurrentTplTemplate();
          });
        }
      }
    });
    $scope.$on('$destroy', selectedIndexWatcher);

    // 选中患者
    vm.patientOnSelected = function (patient) {
      if (patient.pathStatus && !vm.openOuter) {
        vm.activeIndex = 1;
      } else {
        vm.activeIndex = 0;
      }

      if (vm.hid != patient.inhosCode) {
        if (!isHis) {
          redirectToPatient(patient.patCode, patient.inhosCode, 1, vm.tplId);
        } else {
          redirectToPatient(patient.patCode, patient.inhosCode, 0, vm.tplId);
        }
      } else {
        vm.patient = patient;
        vm.loadedStatus = [false, false, false, false];
        vm.loadSheets.func().then(function () {
          if ($location.$$search.type) {
            vm.pathParam.selectedIndex = 2;
          } else {
            if (patient.pathStatus) {
              vm.pathParam.selectedIndex = 0;
              vm.loadPatientPath.func();
            } else {
              vm.pathParam.selectedIndex = 2;
              toCurrentTplTemplate();
            }
          }
        });
      }
    }

    sysRest.getHosInfo().then(function (response) {
      vm.hospitalName = response.hosDisplayName;
      vm.hospitalLogo = response.hosLogoPath;
    });

    // 患者信息切换后需切换到当前文书模板
    function toCurrentTplTemplate() {
      var treeCollectionTpls = _.chain(vm.treeCollection)
        .map(function (item) {
          return item.children;
        })
        .flatten()
        .value();

      if (vm.tplId) {
        var findObj = _.chain(treeCollectionTpls)
                       .filter(function(item){
                         return item.tplId === vm.tplId;
                       })
                       .last()
                       .value();

        if (findObj) {
          vm.selectedNode = findObj;
          select(findObj);
          return;
        }
      }

      vm.selectedNode = vm.patientTemperatureNodes.children[0];
      select(vm.patientTemperatureNodes.children[0]);
    }

    // 初始化文书菜单列表
    function initTreeCollection() {
      vm.treeCollection = dicHelper.dic.attendShowCategory.map(function (item) {
        return {
          itemText: item.dicName,
          showType: item.dicCode,
          category: 'documentPrintHistory',
          children: []
        };
      });
      vm.treeCollection.unshift(vm.patientTemperatureNodes, vm.patientQueryNodes);
    }

    // 删除文书
    vm.removeSheet = function (node) {
      if (node.dataKey) {
        return docRest.delData(node.dataId).then(function () {
          $scope.$emit('toast', {
            type: 'success',
            content: '删除成功！'
          });

          vm.loadSheets.func().then(function () {
            vm.selectedNode = vm.patientTemperatureNodes.children[0];
            select(vm.patientTemperatureNodes.children[0]);
          });
        });
      }

      return nursingRest.deleteNursingSheet(node.sheetId).then(function (response) {
        if (response) {
          $scope.$emit('toast', {
            type: 'success',
            content: '删除成功！'
          });
          vm.loadSheets.func().then(function () {
            vm.selectedNode = vm.patientTemperatureNodes.children[0];
            select(vm.patientTemperatureNodes.children[0]);
          });
        } else {
          $scope.$emit('toast', {
            type: 'warning',
            content: '该文书已录有数据，不可删除！'
          });
        }
      });
    }

    activate();

    $scope.$on('$destroy', function () {
      $scope.$emit('hideIdoc');
      window.removeEventListener('resize', resetHeight);
    });

    function activate() {
      if (!vm.openOuter) {
        getCa();
        getHosUserInfo().then(getHosSign);
        vm.activeIndex = 1;
      } else {
        vm.activeIndex = 0;
      }

      if (isHis) {
        vm.type = 1;
      } else {
        vm.type = 0
      }
      $scope.$emit('idocInit');
      var defer = $q.defer();
      vm.open = open;
      vm.wardHelper = wardHelper;
      vm.treeOption = {
        allowDeselect: false,
        equality: function (node, selectedNode, scope) {
          if (!node || !node.sheetId || !selectedNode || !selectedNode.sheetId || !node.dataId || !selectedNode.dataId) {
            return defaultEquality(node, selectedNode, scope);
          }
          return (node.sheetId === selectedNode.sheetId || node.dataId === selectedNode.dataId) && node.itemText === selectedNode.itemText;
        }
      };
      vm.loadSheets = {
        func: function () {

          if (!vm.patient.inhosCode) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '查询患者文书记录前，需要先选中患者'
            })
          }

          initTreeCollection();
          return docUtil.loadWardCodeTpls().then(function (data) {
            vm.tpls = data.tpl;
            vm.idocTpls = data.idocTpls;
            return loadSheets().then(defer.resolve);
          });
        },
        init: false
      };

      vm.select = select;
      vm.dicHelper = dicHelper;
      vm.getIdocName = getIdocName;
      vm.isIdoc = false;
    }

    function defaultEquality(a, b, $scope) {
      if (!a || !b)
        return false;
      a = shallowCopy(a);
      a[$scope.options.nodeChildren] = [];
      b = shallowCopy(b);
      b[$scope.options.nodeChildren] = [];
      return angular.equals(a, b);
    }

    function shallowCopy(src, dst) {
      if (angular.isArray(src)) {
        dst = dst || [];

        for (var i = 0; i < src.length; i++) {
          dst[i] = src[i];
        }
      } else if (angular.isObject(src)) {
        dst = dst || {};

        for (var key in src) {
          if (hasOwnProperty.call(src, key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
            dst[key] = src[key];
          }
        }
      }

      return dst || src;
    }

    // 验证CA
    function verifyPin(pin) {
      var defer = $q.defer();

      setTimeout(defer.resolve, 1000);

      // for (var i = 0; i < vm.users.length; i += 1) {
      //   window.VerifyUserPIN(vm.users[i].certId, pin, function (res) {
      //     if (res.retValue) {

      //       defer.resolve(vm.users[i]);

      //       return;
      //     }
      //   });
      // }

      return defer.promise;
    }

    function redirectToPatient(patCode, inhosCode, isHis, tplId) {
      $scope.$destroy();
      $state.go('main.docs', {
        patCode: patCode,
        inhosCode: inhosCode,
        isHis: isHis,
        tplId: tplId
      });
    }

    function open() {

      var instance = modalService.open({
        size: 'lg',
        templateUrl: 'MNIS/modules/docs/docs.modal.html',
        data: {
          formData: {
            inhosCode: vm.patient.inhosCode,
            wardCode: profile.wardCode
          }
        },
        ok: function () {
          var modal = this,
            keys;
          if (modal.curTpl.dataKey) {
            keys = ['tplId', 'dataKey', 'showType'];
            return docRest.addData(_.assign({
              key: getKeys(modal.curTpl.tplId)
            }, _.pick(modal.curTpl, keys))).then(function (response) {
              vm.loadSheets.func().then(function () {
                select(response);
                var node = _.assign({}, response.plain(), {
                  itemText: modal.curTpl.tplName,
                  recordDates: [],
                  children: []
                });
                vm.selectedNode = node;
              });
            });
          } else {
            keys = ['tplName', 'tplId', 'showType', 'category', 'retouch', 'headerFormItems', 'lineHeight'];
            if (modal.curTpl.category === 'hlpgd') {
              keys.push('nature');
            } else {
              modal.formData.tplRowNum = modal.curTpl.rowNum;
            }
            return nursingRest.updateNursingSheet(_.assign({
                headerForm: {}
              },
              _.pick(modal.formData, 'tplRowNum', 'inhosCode', 'wardCode'),
              _.pick(modal.curTpl, keys)
            )).then(function (response) {
              vm.loadSheets.func().then(function () {
                select(response.plain());
                var node = _.assign({}, response.plain(), {
                  itemText: response.tplName,
                  recordDates: [],
                  children: []
                });

                if (node.category === 'hljld') {
                  node.children = [];
                  node.$totalPage = 0;
                  node.itemText = response.tplName + '—' + wardHelper.getWardName(response.wardCode);
                  var grouped = _.groupBy(vm.hljld, 'tplId');
                  node.$offsetPage = _.reduce(grouped[node.tplId], function (memo, sheet) {
                    return memo + sheet.rowRequired / sheet.tplRowNum;
                  }, 0);
                }
                vm.selectedNode = node;
              });
            });
          }
        },
        methodsObj: {
          tpls: vm.tpls,
          dic: dicHelper.dic,
          sheets: vm.treeCollection,
          changeList: function (code) {
            var modal = this;
            modal.selected = code;
            modal.curList = _.chain(modal.tpls[code])
              .filter(function (item) {
                var exist = _.find(vm.idocSheets, function (sheet) {
                  return sheet.tplId === item.tplId;
                });
                // idoc文书需要判断duplicable是否允许创建多个实例副本
                if (item.dataKey && item.duplicable) {
                  return true;
                }

                return !exist && code === item.showType;

                // return code === item.showType;
              })
              .value();
            modal.curTpl = null;
          },
          dicHelper: dicHelper
        }
      });

      // instance.result.then(function () {
      //   vm.loadSheets.func();
      // });
    }

    function calcPageAndOffset(collection) {
      var grouped = _.groupBy(collection, 'tplId');

      for (var tplId in grouped) {
        var sheets = grouped[tplId];

        _.each(sheets, function (item, index) {
          var sheetIndex = _.findIndex(collection, function (sheet) {
            return item.sheetId === sheet.sheetId;
          });

          collection[sheetIndex].$totalPage = (collection[sheetIndex].rowRequired / collection[sheetIndex].tplRowNum) || 0;
          collection[sheetIndex].$offsetPage = (_.get(sheets, [index - 1, '$offsetPage']) || 0) + (_.get(sheets, [index - 1, '$totalPage']) || 0);
          // if (collection[sheetIndex].$offsetPage == 0) {
          // console.log(collection[sheetIndex]);
          // }
        });
      }
    }

    var taskRemindFromEvaluate;

    // 加载文书实例
    function loadSheets() {

      var customSheetsQ = nursingRest.getNursingSheets({
        inhosCode: vm.patient.inhosCode
      });
      var idocQ = docRest.getData({
        key: vm.selectedNode && vm.selectedNode.key || ("inhosCode=" + vm.patient.inhosCode)
      });

      return $q.all([customSheetsQ, idocQ]).then(function (results) {

        // 获取护理记录单内容
        var data = results[0].plain();
        var expanded;

        if ($location.$$search.type === 'evaluate') {
          taskRemindFromEvaluate = _.find(data, function (item) {
            return $location.$$search.tplId === item.tplId;
          })
        }

        // 如果没找到tplId， 默认显示护理单第一个数据，如果护理单没有第一个数据，就选中护理单
        if (!taskRemindFromEvaluate) {
          if (data.length > 0) {
            taskRemindFromEvaluate = data[0];
          } else {
            taskRemindFromEvaluate = vm.treeCollection[2];
          }
        }

        vm.hljld = _.chain(data).each(function (sheet) {
          sheet.itemText = sheet.category === 'hljld' ? sheet.tplName + '—' + wardHelper.getWardName(sheet.wardCode) : sheet.tplName;
        }).filter({
          category: 'hljld'
        }).value();
        // 页码偏移需要按模板区别
        calcPageAndOffset(vm.hljld);

        vm.idocSheets = results[1].plain();

        // idoc文书的实例没有showType，需要从idocTpls中拿到
        _.forEach(vm.idocSheets, function (item) {
          var correctTpl = _.chain(vm.idocTpls)
            .find(function (tpl) {
              return tpl.tplId === item.tplId;
            })
            .value();

          item.showType = correctTpl ? (correctTpl.showType || 'null') : 'null';
          item.itemText = correctTpl ? correctTpl.tplName : '未命名文书';
        });

        // 护理记录单加入菜单
        _.each(_.groupBy(data.concat(vm.idocSheets), 'showType'), function (value, key) {
          _.forEach(vm.treeCollection, function (item) {
            if (item.showType === key) {
              item.children = value;
            }
          });
        });

        if (vm.selectedNode && vm.selectedNode.category === 'hljld') {
          var exist = _.find(vm.hljld, function (item) {
            return item.sheetId === vm.selectedNode.sheetId;
          });

          if (exist) {
            vm.selectedNode.rowRequired = exist.rowRequired;
            vm.selectedNode.rowCount = exist.rowCount;
            // 添加新护理记录单时，将计算后的页码偏移和页面数存至selectedNode
            vm.selectedNode.$totalPage = exist.$totalPage;
            vm.selectedNode.$offsetPage = exist.$offsetPage;
          }
        }

        // vm.sheets = sheets;

        expanded = vm.treeCollection.slice(0);
        if (vm.hljld.length) {
          expanded.push(_.last(vm.hljld));
        }
        vm.expandedNodes = expanded;

        vm.treeCollection = _.cloneDeep(vm.treeCollection);
      });
    }

    function sdkOperate(obj) {
      sdk.reset();
      sdk.renderByDataKeyAndTpl({
        key: getKeys(obj.tplId),
        dataId: obj.dataId,
        resourcesKey: getResourcesKeys(obj.tplId)
      })(obj.dataKey)(obj.tplId).then(function () {
        vm.docFetching = false;
      });

      sdk.setUserInfo(profile);
      sdk.setCAInfo(_.assign({}, vm.oldCA ? vm.oldCA.plain() : {}, {
        SF: vm.currentHosUser.papersNo,
        png: _.get(vm.currentSignPicture, 'signData')
      }));

      sdk.register('showMessage', function () {
        alert('这个弹窗从外部系统注册了“showMessage”事件处理而调用！');
      });
    }

    function select(data, flag) {
      vm.selectedNode = data;
      vm.tplId = _.get(data, 'tplId') || null;

      var findObj = _.find(vm.idocSheets, function (item) {
        return item.dataId === data.dataId;
      });

      vm.printFlag = false;

      if (findObj) {
        vm.printFlag = findObj.printFlag;
      }


      var editingRow = angular.element('.key-table').find('.editing-row');
      if (editingRow.length > 0) {
        editingRow.removeClass('editing-row');
        $rootScope.$broadcast('batchInputSave');
      }

      if (data.dataKey) {
        //  打开IDOC文件
        vm.isIdoc = true;
        resetHeight();
        $scope.$emit('showIdoc');
        sdkOperate(data);

        if ($location.$$search.openOuter) {
          disabledOutterInteraction();
        }
      } else {
        // 打开非IDOC文件
        $scope.$emit('hideIdoc');
        vm.isIdoc = false;
        // selectMap[data.category] && selectMap[data.category](data);
      }

      if (data.category === 'hlpgd' && vm.openOuter) {
        document.querySelector('.nursing-doc-page-wrapper').addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
        }, true);
      }
    }

    function getIdocName(tplId) {
      return _.chain(vm.idocTpls).find({
        tplId: tplId
      }).get('tplName').value();
    }

    function disabledOutterInteraction() {
      var wrapper = window.frames[0].document;

      wrapper.removeEventListener('dblclick', function (event) {
        event.preventDefault();
        event.stopPropagation();
      }, true);
      wrapper.addEventListener('dblclick', function (event) {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      wrapper.removeEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      }, true);
      wrapper.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      wrapper.onkeydown = function () {
        return false;
      };

      wrapper.removeEventListener('mousedown', function (event) {
        // debugger
        if (event.button == 2 || event.button == 3) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      wrapper.addEventListener('mousedown', function (event) {
        // debugger
        if (event.button == 2 || event.button == 3) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    }

    function queryObjToStr(paramsObj) {
      var temp = [];

      Object.keys(paramsObj).forEach(function (key) {
        if (angular.isArray(paramsObj[key])) {
          var paramIsArray = _.map(paramsObj[key], function (valueString) {
            return key + '=' + encodeURIComponent(valueString);
          });
          temp = _.concat(temp, paramIsArray);
        } else {
          temp.push(key + '=' + paramsObj[key]);
        }
      });

      return temp.join('&');
    }

    function getKeys(tplId) {
      var keyMap = {};
      var keys = _.chain(vm.idocTpls).find({
        tplId: tplId
      }).get('components.keys').value();

      _.forEach(keys, function (key) {
        keyMap[key] = $stateParams[key] || '';
      });

      return queryObjToStr(keyMap);
    }

    function getResourcesKeys(tplId) {
      var resources = _.chain(vm.idocTpls).find({
        tplId: tplId
      }).get('components.resources').value();

      var keyMap = {};

      var getKey = function (url) {
        if (!url) {
          return;
        }

        var match = url.match(/{(\w*)}*/g);

        if (match) {
          match = _.map(match, function (item) {
            return item.replace(/\{|\}/g, '');
          });
        }
        return match;
      };

      var keys = _.chain(resources)
        .map(function (item) {
          return getKey(item.url);
        })
        .flatten()
        .uniq()
        .compact()
        .sort()
        .value();

      // 按字母顺序排序
      keys.sort(function (a, b) {
        return a.toString().localeCompare(b);
      });

      _.forEach(keys, function (key) {
        keyMap[key] = $stateParams[key] || '';
      });

      return queryObjToStr(keyMap);
    }

    function getCa() {
      if (profile.userCode) {
        return docRest.getCa(profile.userCode).then(function (response) {
          vm.oldCA = response;
        });
      }
    }

    function getHosUserInfo() {
      return hospitalRest.getHosUsers({
        hisCode: profile.hisCode
      }).then(function (response) {
        vm.currentHosUser = _.get(response, 'queryResult[0]');
      });
    }

    function getHosSign() {
      return hospitalRest.getHosSign().customGET('', {
        nurseId: vm.currentHosUser.userCode
      }).then(function (response) {
        vm.currentSignPicture = _.get(response, 'queryResult[0]');
      });
    }

    // 页面加载完成
    vm.fullPageLoaded = function () {
      vm.isPatLoadingEcho.fullPageLoaded = true;
      // $scope.$apply();
    }

    vm.hasLoaded = false;

    function getInhosRecord() {
      return nursingRest.getInhosRecords(vm.wardCode).then(function (data) {
        vm.patients = data;
        vm.hasLoaded = true;
      });
    }
    getInhosRecord();

    $scope.$on('updatePatientEvaluateStatus', function () {
      getInhosRecord();
    });

    window.removeEventListener('resize', resetHeight);
    window.addEventListener('resize', resetHeight);

    function resetHeight() {
      // var offset = $('.header-top').height() + $('.selector-bar-panel').height() + $('.doc-control').height();
      var offset = $('.header-top').outerHeight() + $('.selector-bar-panel').outerHeight() + $('.patient-path-toolbar').outerHeight() + 2;

      // console.log('Window', window.innerHeight);
      // console.log('Header',$('.header-top').height());
      // console.log('PatientInfo',$('.selector-bar-panel').height());
      // console.log('DocControl',$('.doc-control').height());
      // console.log('NursingDocpanel', window.innerHeight - offset);

      $('.nursing-doc-panel').height(window.innerHeight - offset);
      $('.accordion-inner').css('height', window.innerHeight - offset);
      $('.accordion-inner').css('max-height', window.innerHeight - offset);
      $('.path-tree').css({
        'height': window.innerHeight - offset - 186 + 'px',
        'max-height': window.innerHeight - offset - 186 + 'px',
        'overflow': 'auto'
      });
      var detail = $('.doc-detail');
      var idoc = $('.idoc-container');
      if (!vm.isOpen) {
        idoc.css({
          width: '100%',
          'margin-left': 0,
          height: window.innerHeight - offset - 20 + 'px'
          // display: 'flex'
        });
        detail.css({
          width: '100%',
          'left': 0
        });
      } else {
        detail.css({
          width: window.innerWidth - 280,
          left: '280px'
        });
        idoc.css({
          width: window.innerWidth - 280,
          'margin-left': 280,
          height: window.innerHeight - offset - 20 + 'px'
          // display: 'flex'
        });
      }
    }

    // --------------------------------------------------------------------------------------------------------------------------------------------
    // IDOC部分
    // --------------------------------------------------------------------------------------------------------------------------------------------

    // IDOC文书保存
    function saveDoc() {
      vm.docSaving = true;
      sdk.save().then(function () {
        vm.docSaving = false;
        // $scope.$emit('toast', {
        //   type: 'success',
        //   content: '保存成功！'
        // });
        $scope.$apply();
      }).catch(function () {
        vm.docSaving = false;
        $scope.$emit('toast', {
          type: 'error',
          content: '保存失败！'
        });
        $scope.$apply();
      });
    }

    // 打印完成之后，调用打印接口标记
    var vitalSignPrintSuccess = function () {
      var printParams = {
        dataId: vm.selectedNode.dataId
      }

      nursingRest.getIdocForPrint(printParams).then(function (res) {
        vm.showByPrinting = false;
        vm.printFlag = true;
        vm.loadSheets.func();
      });
    }

    var vitalSignPrintCancel = function () {
      vm.showByPrinting = false;
    }

    // IDOC文书打印
    function print() {
      sdk.print();

      $timeout(function () {
        modalService.open({
          size: 'sm',
          templateUrl: 'common/directives/print/printTip.modal.html',
          data: {
            formData: {
              printFlag: true
            }
          },
          ok: function () {
            vitalSignPrintSuccess();
            return true;
          },
          cancel: function () {
            vitalSignPrintCancel();
            return true;
          }
        });
      }, 300);

    }


    // --------------------------------------------------------------------------------------------------------------------------------------------
    // 路径部分
    // --------------------------------------------------------------------------------------------------------------------------------------------
    function getTemperatureConfig() {
      return nursingRest.getTempConfig().customGET('', {
        wardCode: profile.wardCode
      }).then(function (response) {

        var data = response.plain();
        var config = data.config;

        vm.timeList = _.chain(config.timesInterval.split(','))
          .map(function (item) {
            var hour = item.length === 1 ? '0' + item : item;
            return {
              showName: hour + ':00',
              value: hour + ':00:00'
            };
          })
          .value();

        var date = moment().format('YYYY-MM-DD');
        return sysService.getServerTime().then(function (response) {
          vm.pathParam.recordTimeIndex = 0;
          for (var i = 0; i < vm.timeList.length; i++) {
            if (Math.abs(moment(response).diff(moment(date + ' ' + vm.timeList[i].value))) < 2.0 * 3600 * 1000) {
              vm.pathParam.recordTimeIndex = i;
              break;
            }
          }
        });
      });

    }

    /**
     * 时间转为秒
     * @param time 时间(00:00:00)
     * @returns {string} 时间戳（单位：秒）
     */
    var time_to_sec = function (time) {
      var s = '';

      var hour = time.split(':')[0];
      var min = time.split(':')[1];
      var sec = time.split(':')[2];

      s = Number(hour * 3600) + Number(min * 60) + Number(sec);

      return s;
    };

    // 获取班次列表
    function getHosUserShiftExt() {
      nursingRest.getHosUserShiftExt({
        wardCode: profile.wardCode,
        status: 1
      }).then(function (data) {
        vm.shiftList = data;
        var now = time_to_sec(moment().format('HH:mm:ss'));
        _.forEach(vm.shiftList, function (item) {
          var startTime = time_to_sec(moment(item.startTime).format("HH:mm:ss"));
          var endTime = time_to_sec(moment(item.endTime).format("HH:mm:ss"));
          item.displayTitle = item.shiftName + '班 (' + moment(item.startTime).format('HH:mm') + ' - ' + moment(item.endTime).format('HH:mm') + ')';

          if (endTime < startTime) {
            if (now >= startTime && now < 24 * 60 * 60 * 1000) {
              vm.currentShift = item;
            } else if (now >= 0 && now < endTime) {
              vm.currentShift = item;
            }
          } else {
            if (now > startTime && now < endTime) {
              vm.currentShift = item;
            }
          }
        });

        // 如果没有找到班组信息，则默认显示第一个班次
        if (!vm.currentShift && vm.shiftList.length > 0) {
          vm.currentShift = vm.shiftList[0];
        }
      });
    }

    // 获取患者路径
    function getPaitentPath() {
      return nursingRest.getPatientPath({
        inhosCode: vm.patient.inhosCode
      }).then(function (res) {
        vm.patient.currentPath = res.plain();
      });
    }

    // 退出路径
    vm.exitPath = function () {

      var exitList = sessionService.getDicHelper().dic.exitPathReason;

      vm.patient.currentPath.bedCode = vm.patient.bedCode;
      vm.patient.currentPath.patName = vm.patient.patName;
      var outPath = modalService.open({
        size: 'md',
        templateUrl: 'MNIS/modules/patients/beds.outPath.modal.html',
        data: {
          formData: vm.patient.currentPath,
          metaData: {
            exitList: exitList
          }
        },
        ok: function () {
          var tempExitReason = _.find(exitList, function (item) {
            return item.dicCode === vm.patient.currentPath.exitReasonCode;
          });
          var params = {
            exitDate: vm.patient.currentPath.outPathDate,
            exitReasonCode: vm.patient.currentPath.exitReasonCode,
            inhosCode: vm.patient.currentPath.inhosCode,
            exitReason: tempExitReason.dicName,
            remark: vm.patient.currentPath.remark || ''
          };
          var currentDay = moment().format('YYYY-MM-DD');
          if (!vm.patient.currentPath.outPathDate) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '出径日期不能为空'
            });
            return false;
          }
          if (new Date(vm.patient.currentPath.outPathDate).getTime() > new Date(currentDay).getTime()) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '出径日期不能大于当天日期'
            });
            return false;
          }
          if (new Date(vm.patient.currentPath.outPathDate).getTime() < new Date(vm.patient.currentPath.enterDate).getTime()) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '出径日期必须大于等于入径日期'
            });
            return false;
          }

          return nursingRest.patientPathExit(params).then(function () {
            $scope.$emit('toast', {
              type: 'success',
              content: '出径成功'
            });
            $state.reload();
          });
        }
      });
      outPath.result.then(function () {
        $state.reload();
      });
    }

    // 选中文书(只限于护理记录单使用)
    function setSelectedDocSheet(sheetId) {
      console.log(sheetId);
      console.log(vm.hljld);
    }

    vm.executePathNode = function () {
      $scope.$broadcast('pathExecuteNodeBatch');
    }

    // 恢复路径
    vm.resetPath = function () {
      nursingRest.recoverNode({
        inhosCode: vm.patient.inhosCode
      }).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '恢复成功'
        });
        $state.reload();
      });
    }

  }
})();
