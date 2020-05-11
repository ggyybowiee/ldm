(function() {
    "use strict";

    angular
      .module("lachesis-ldm")
      .controller("OTADistributionController", OTADistributionController);

    /** @ngInject */
    function OTADistributionController(
      $rootScope,
      $scope,
      $state,
      modalService,
      deviceInfoService,
      ldmSessionCache,
      hospitalRest,
      deviceAppService,
      _
    ) {
        var vm = this;
        vm.pushUpgrade = pushUpgrade;
        vm.allVersion = '';
        vm.setAllVersion = setAllVersion;
        vm.queryParams = {
            eqpName: '',
            eqpType: '',
            eqpBelong: '',
            eqpStatus: 10001,
            version: ''
        }

        vm.updateParams = {
            deviceId: '',
            otaId: ''
        }

        vm.deviceTypes = [
          {
            code: 1001,
            name: "NDA"
          },
          {
            code: 1004,
            name: "蓝桥"
          }
        ]

        vm.load = {
          init: true,
          func: init
        }
        vm.queryParams.eqpType = 1001;
        init();
        getWards();
        getCode();

        function init(changeDeviceType) {
          vm.allVersion = '';
          if(changeDeviceType === true){
            vm.queryParams.version = '';
          }
            return getDevices(vm.queryParams).then(function(response) {
                vm.devices = response.map(function(item){
                  item.id = null;
                  return item;
                });
                getOTAPackages({deviceType: vm.queryParams.eqpType});
                getDeviceVersions({deviceType: vm.queryParams.eqpType});
            });
        }

        function getDevices(params) {
            return deviceInfoService.getDevices(params);
        }

        function getOTAPackages(params) {
            return deviceAppService.getOTAPackages(params).then(function(response) {
                vm.packages = response;
            });
        }

        function getWards() {
          //获取医院病区
            return hospitalRest.getWards().then(function(response) {
                vm.wards = response;
            });
        }

        function getCode() {
          return deviceInfoService.getCodes().then(function(response) {
            vm.codes = response;
            vm.otaSendStep = _.filter(vm.codes, { type: "step" });
          });
        }

        function getDeviceVersions(params) {
          return deviceAppService.getDeviceVersions(params).then(function(response) {
              vm.versions = response;
          })
        }

        function setAllVersion(version) {
          vm.devices.map(function(item){
            item.id = version;
          })
        }

        function pushUpgrade(item) {
            vm.updateParams.deviceId = item.content.basicInfo.mac;
            vm.updateParams.otaId = item.id;
            deviceAppService.postOTAUpgrade(vm.updateParams).then(function(response) {
              //目前推送成功后推送按钮才失效
              item.clicked = true;
              $scope.$emit("toast", {
                type: "success",
                content: "已推送！"
              });
            });
        }
    }
  })();
