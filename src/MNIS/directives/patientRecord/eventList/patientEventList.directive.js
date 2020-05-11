(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('patientEventList', patientEventList);

  /** @ngInject */
  function patientEventList(patientEventRest, modalService, patientEventUtil) {
    var directive = {
      restrict: 'E',
      scope: {
        patientInfo: '='
      },
      templateUrl: 'MNIS/directives/patientRecord/eventList/patientEventList.tpl.html',
      controller: function ($scope, $timeout, sessionService, _) {

        var vm = this;
        vm.eventTypeDic = {};
        _.forEach(sessionService.getDicHelper().dic.eventType, function (item) {
          vm.eventTypeDic[item.dicCode] = item;
        });

        // 获取患者事件
        function getPatientEvent() {
          return patientEventRest.getPatientEvent({
            inhosCode: $scope.patientInfo.inhosCode
          }).then(function (response) {
            vm.eventList = response.plain().queryResult;
            if (vm.eventList == undefined)
              vm.eventList = [];
          });
        }

        // 删除患者事件
        vm.addOrEditPatientEvent = function (event) {

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

              if (event == undefined) {

                return patientEventRest.addPatientEvent(savingData).then(function (response) {
                  vm.eventList.push(response.plain())
                });
              } else {
                return patientEventRest.updatePatientEvent(savingData).then(function (response) {
                  var index = _.findIndex(vm.eventList, {
                    'seqId': savingData.seqId
                  });

                  if (index != -1)
                    vm.eventList.splice(index, 1, response.plain())
                });
              }
            }, $scope.patientInfo, event);
        }

        // 删除患者事件
        vm.deletePatientEvent = function (event) {

          return patientEventRest.deletePatientEvent(event.seqId).then(function () {
            var index = vm.eventList.indexOf(event);
            if (index != -1)
              vm.eventList.splice(index, 1);
          });
        }

        initModelView();
        // 初始化视图
        function initModelView() {

          vm.loadPatientEvent = {
            func: getPatientEvent
          }

          // 患者监听器
          var patientWatcher = $scope.$watch('patientInfo', function (value) {
            if (value) {
              $timeout(function () {
                vm.loadPatientEvent.func();
              })
            }
          });
          $scope.$on('$destroy', patientWatcher);
        }

      },
      controllerAs: 'vm'
    };

    return directive;
  }

})();
