(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('deviceList', deviceList);

  /** @ngInject */
  function deviceList(nursingRest) {
    var directive = {
      restrict: 'E',
      scope: {

      },
      // replace: true,
      // transclude: true,
      templateUrl: 'MNIS/directives/bedList/deviceList/deviceList.tpl.html',
      controllerAs: "vm",
      bindToController: true,
      controller: function ($scope, $filter, moment, sessionService, $timeout, _, modalService, nursingPathRest, $q) {

        var vm = this,
            profile = sessionService.getProfile();

        initModelView();
        // 初始化视图
        function initModelView() {
          vm.filter = {
            text: ''
          };
          vm.deviceList = [];

          vm.loadDeviceData = {
            func: getDeviceListByWardCode,
            init: true
          }

          getPatientListByWardCode();
        }

        // 根据病区获取所有床边机IP与床位绑定列表
        function getDeviceListByWardCode() {
          return nursingRest.getDeviceListByWardCode(profile.wardCode).then(function (data) {
            vm.deviceList = data.plain();
          });
        }
        
        var patientList = [];
        // 根据病区获取患者
        function getPatientListByWardCode() {
          return nursingRest.getPatientListByWardCode(profile.wardCode).then(function (data) {
            patientList = data.plain();
          });
        }

        vm.deviceFilter = function (item) {

          if (item.mnisIpBedMapping.bedCode && item.mnisIpBedMapping.bedCode.indexOf(vm.filter.text) != -1)
            return true;

          if (item.patName && item.patName.indexOf(vm.filter.text) != -1)
            return true;

          if (item.mnisIpBedMapping.deviceName && item.mnisIpBedMapping.deviceName.indexOf(vm.filter.text) != -1)
            return true;

          if (item.mnisIpBedMapping.ip && item.mnisIpBedMapping.ip.indexOf(vm.filter.text) != -1)
            return true;

          return false;
        }

        // 绑定
        vm.bind = function (item) {
          modalService.open({
            size: 'lg',
            templateUrl: 'MNIS/directives/bedList/deviceList/deviceList.modal.html',
            data: {
              formData: item.mnisIpBedMapping,
              metaData: {
                patientList: patientList,
                personId: ""
              }
            },
            ok: function (data) {
              var that = this;
              var currentPatient = _.find(patientList, function (obj) {
                return obj.inhosCode === that.metaData.personId;
              });

              if (!currentPatient) {
                $scope.$emit('toast', {
                  type: 'warning',
                  content: '请选择患者!'
                });
                return;
              }

              var params = _.assign(data, {
                wardCode: profile.wardCode,
                bedCode: currentPatient.bedCode,
                inhosCode: currentPatient.inhosCode
              });

              return nursingRest.bindDevice(params).then(function (data) {
                vm.loadDeviceData.func().then(function (res) {
                  getPatientListByWardCode();
                  $scope.$emit('toast', {
                    type: 'success',
                    content: '绑定成功!'
                  });
                });
              });
            },
            methodsObj:{
              selectedPatient: function(patient) {
                var that = this;
                that.metaData.personId = patient.inhosCode;
              }
            }
          });
        }

        // 解绑
        vm.unbind = function (item) {
          nursingRest.unbindDevice(item.mnisIpBedMapping.seqId).then(function (data) {
            vm.loadDeviceData.func().then(function (res) {
              getPatientListByWardCode();
              $scope.$emit('toast', {
                type: 'success',
                content: '解绑成功!'
              });
              modalService.close();
            });
          });
        }
      }
    };

    return directive;
  }

})();
