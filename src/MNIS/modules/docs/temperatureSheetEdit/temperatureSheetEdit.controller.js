(function () {
  'use strict';

  angular.module('lachesis-mnis').controller('tempEditController', tempEditController);

  /** @ngInject */
  function tempEditController($scope, modalService, patientEventRest, $stateParams, $q, sessionService, _, nursingRest, moment, $location, $rootScope, $timeout, patientEventUtil) {
    var vm = this;
    var profile = sessionService.getProfile();
    vm.nextWeek = nextWeek;
    vm.prevWeek = prevWeek;
    vm.changeWeek = changeWeek;
    vm.getStartDate = getStartDate;
    vm.wardCode = ($location.$$search.openOuter && $location.$$search.wardCode) ? $location.$$search.wardCode : profile.wardCode;
    vm.openOuter = $stateParams.openOuter;
    vm.docShowScale = 100;
    vm.showByPrinting = false;

    function getStartDate(week) {
      return moment(vm.inDate).add({
        days: (week - 1) * 7
      }).format('YYYY-MM-DD');
    }

    function getEndDate(week) {
      return moment(vm.inDate).add({
        days: week * 7
      }).format('YYYY-MM-DD');
    }

    vm.validationOption = {};

    // 初始化视图
    initViewModel();

    function initViewModel() {

      var patientWatch = $scope.$watch('$parent.vm.patient', function (value) {

        if (value) {

          var inDate = $scope.$parent.vm.patient.inDate ? $scope.$parent.vm.patient.inDate : new Date();
          var outDate = $scope.$parent.vm.patient.outDate ? $scope.$parent.vm.patient.outDate : new Date();
          vm.inDate = moment(new Date(inDate)).format('YYYY-MM-DD');
          vm.outDate = moment(new Date(outDate)).format('YYYY-MM-DD');
          if (vm.inDate > vm.outDate) {
            inDate = outDate;
          }
          vm.originalWeek = Math.ceil((new Date(vm.outDate).getTime() - new Date(vm.inDate).getTime() + 24 * 3600 * 1000) / (7 * 24 * 3600 * 1000));
          vm.weekCount = vm.originalWeek;
          vm.queryParams = {
            startDate: getStartDate(vm.weekCount),
            endDate: getEndDate(vm.weekCount),
            inhosCode: value.inhosCode,
            wardCode: vm.wardCode
          };

          $timeout(function () {
            nursingRest.getTempConfig().customGET('', {
              wardCode: vm.wardCode
            }).then(function (response) {
              vm.tpl = response.plain().config;
              vm.loadInhosPatTemperatureSheet.func();
            });
          })
        }
      });
      $scope.$emit('destroy', patientWatch);

      vm.loadInhosPatTemperatureSheet = {
        func: getInhosPatTemperatureSheet
      }
    }

    $scope.$on('firstLoadTempSheet', function () {
      vm.loadInhosPatTemperatureSheet.func();
    });

    // 添加患者事件
    vm.addPatientEvent = function () {

      patientEventUtil.editPatientEvent(
        function (data) {

          var savingData = patientEventUtil.preparePatientEventForSaving(data);
          if (!savingData) {
            $scope.$emit('toast', {
              type: 'warning',
              content: '输入的事件日期与时间不能为空'
            })
            return false;
          }

          return patientEventRest.addPatientEvent(savingData).then(function () {

            $scope.$emit('toast', {
              type: 'success',
              content: '添加患者事件成功'
            })

            getVisibleEventInTempSheet();

            // 添加后重新刷新当前页表头信息
            nursingRest.getVitalSignHeaderWithPageNo({
              inhosCode: $scope.$parent.vm.patient.inhosCode,
              pageNo: vm.weekCount
            }).then(function (response) {
              vm.headers = response.header;
              vm.printFlag = response.printFlag;
            });

          });
        }, $scope.$parent.vm.patient);
    }

    // 获取所有可见的患者事件
    function getVisibleEventInTempSheet() {
      return patientEventRest.getPatientEvent({
        inhosCode: $scope.$parent.vm.patient.inhosCode
      }).then(function (response) {
        vm.eventData = _.filter(response.plain().queryResult, function (item) {
          return _.findIndex(vm.tpl.visibleEvents, {
            'dicCode': item.event
          }) != -1;
        });
      });
    }

    // 获取住院患者体征单数据
    function getInhosPatTemperatureSheet() {

      var params = vm.queryParams;

      var queryPromise = [];

      // 获取体征数据
      queryPromise.push(nursingRest.getTempSheetData().getList(params).then(function (response) {
        vm.tplData = response.plain();
        var findIndex = 0;
        for (; findIndex < vm.tplData.length; findIndex++) {
          if (vm.tplData[findIndex].date > vm.outDate)
            break;
        }
        if (findIndex < vm.tplData.length) {
          vm.tplData.splice(findIndex, vm.tplData.length - findIndex);
        }
      }));

      // 获取体温单表头数据
      queryPromise.push(nursingRest.getVitalSignHeaderWithPageNo({
        inhosCode: $scope.$parent.vm.patient.inhosCode,
        pageNo: vm.weekCount
      }).then(function (response) {
        vm.headers = response.header;
        vm.printFlag = response.printFlag;
      }));

      // 获取患者事件数据
      queryPromise.push(getVisibleEventInTempSheet());

      $timeout(function () {
        $rootScope.$broadcast('refreshDiagnosis');
      });

      //[start]外部打开页面 禁止点击事件
      if ($location.$$search.openOuter) {
        $timeout(function () {
          var wrapper = document.querySelector('.temperature-sheet-container');

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
        });
      }
      //[end]外部打开页面 禁止点击事件

      return $q.all(queryPromise);
    }

    // 更换周
    function changeWeek(weekCnt) {

      weekCnt = Math.max(1, weekCnt);
      weekCnt = Math.min(Math.ceil(vm.originalWeek), weekCnt);
      vm.weekCount = weekCnt;
      vm.queryParams.startDate = getStartDate(weekCnt);
      vm.queryParams.endDate = getEndDate(weekCnt);
      return vm.loadInhosPatTemperatureSheet.func();
    }

    // 下一周
    function nextWeek(isLast) {
      if (isLast) {
        changeWeek(Math.ceil(vm.originalWeek));
      } else {
        changeWeek(parseInt(vm.weekCount) + 1);
      }
    }

    // 上一周
    function prevWeek(isFirst) {
      if (isFirst) {
        changeWeek(1);
      } else {
        changeWeek(parseInt(vm.weekCount) - 1);
      }
    }

    var printParams = [];

    // 打印完成之后，调用打印接口标记
    var vitalSignPrintSuccess = function() {
      var index = _.findIndex(printParams, function (item) {
        return item.pageNo == vm.weekCount;
      })

      if (index === -1) {
        printParams.push({
          inhosCode: $scope.$parent.vm.patient.inhosCode,
          pageNo: vm.weekCount
        });
      }

      nursingRest.getVitalsignsForPrint(printParams).then(function (res) {
        vm.showByPrinting = false;
        vm.printFlag = true;
        printParams = [];
      });
    }

    var vitalSignPrintCancel = function() {
      vm.showByPrinting = false;
      printParams = [];
    }

    // 打印当前页
    vm.printCurrentPage = function () {
      var outerHTML = angular.element('#temperatureSheet')[0].outerHTML;
      vm.printHtml(outerHTML, 1, vitalSignPrintSuccess, vitalSignPrintCancel, true);
    }

    // 打印页面
    vm.printPage = function () {

      modalService.open({
        size: "sm",
        templateUrl: "MNIS/modules/docs/temperatureSheetEdit/printPageSelector.modal.html",
        data: {
          metaData: {
            maxPage: vm.originalWeek
          },
          formData: {
            start: 1,
            end: vm.originalWeek
          }
        },
        ok: function (data) {
          startNewPrintRecursion(data.start, data.end, data.maxPage, [], changeWeek);
          return true;
        }
      });
    }

    // 打印递归实例
    function startNewPrintRecursion(curPage, endPage, stopPage, printHtmlContents, changeWeekFunc) {
      var changeWeek = changeWeekFunc;

      var printRecursionEcho = {
        isCancelled: false,
        printCurPageCount: 0
      }

      function print(curPage, endPage, stopPage, printHtmlContents, modalInstance) {

        if (curPage > endPage || curPage > vm.originalWeek || printRecursionEcho.isCancelled) {

          if (!printRecursionEcho.isCancelled) {
            var html = "";
            _.forEach(printHtmlContents, function (item) {
              html += item;
            });
            vm.printHtml(html, 1, vitalSignPrintSuccess, vitalSignPrintCancel, true);
          }

          // 关闭加载窗口
          modalInstance && modalInstance.close();
          // changeWeek(stopPage);
        } else {

          changeWeek(curPage).then(function () {
            $timeout(function () {
              var outerHTML = angular.element('#temperatureSheet')[0].outerHTML;
              printHtmlContents.push(outerHTML);
              printParams.push({
                inhosCode: $scope.$parent.vm.patient.inhosCode,
                pageNo: curPage
              });
              printRecursionEcho.printCurPageCount++;
              print(curPage + 1, endPage, stopPage, printHtmlContents, modalInstance);
            }, 100);
          });
        }
      }

      function openPrintProgress(totalPrintPage) {
        return modalService.open({
          size: 'sm',
          templateUrl: 'MNIS/modules/docs/temperatureSheetEdit/printProgress.modal.html',
          data: {
            metaData: {
              echo: printRecursionEcho,
              totalPrintPage: totalPrintPage
            }
          },
          ok: function () {
            printRecursionEcho.isCancelled = true;
            return true;
          }
        });
      }

      var modalInstance = openPrintProgress(endPage - curPage + 1);
      print(curPage, endPage, stopPage, printHtmlContents, modalInstance);
    }
  }
})();
