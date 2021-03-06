(function() {
    "use strict";

    angular
      .module("lachesis-ldm")
      .controller("WardAPCountController", WardAPCountController);

    /** @ngInject */
    function WardAPCountController(
      $rootScope,
      $scope,
      $state,
      $stateParams,
      $http,
      deviceInfoService,
      hospitalRest
    ) {
      var vm = this, wardDevice = $rootScope.APDevice;
      vm.onlineCount = 0;
      vm.offlineCount = 0;
      vm.graphData = null;
      vm.load = {
        init: true,
        func: init
      };

      getDeviceTypes();
      getDeviceBelong();

      function init() {
        return deviceInfoService.getDevices({macList: wardDevice.connectedDevices}).then(function(response) {

      })
    }

      function getDeviceTypes() {
        return deviceInfoService.getDeviceType().then(function(response) {
          vm.deviceTypes = response;
        });
      }
      function getDeviceBelong() {
        return hospitalRest.getWards().then(function(response) {
          vm.belongs = response;
        });
      }

      function setIcons(deviceTypeCode) {
        var link = "assets/images/devices/";
        var src = "";
        switch(deviceTypeCode) {
          case 1014: src = link + "device_erwenqiang.png"; break;//耳温枪
          case 1001: src = link + "device_shuye.png"; break;       //nda
          case 1005: src = link + "device_shuye.png"; break;     //输液检测器
          case 1008: src = link + "device_erwenqiang.png"; break;//医护安全卫士
          case 1011: src = link + "device_erwenqiang.png"; break;//脉搏夹
          case 1010: src = link + "device_erwenqiang.png"; break;//血压
          case 1006: src = link + "device_erwenqiang.png"; break;//患者腕带
          case 1016: src = link + "device_erwenqiang.png"; break;//门口机
          case 1015: src = link + "device_erwenqiang.png"; break;//门头卡
          case 1017: src = link + "device_erwenqiang.png"; break;//护士站
          case 1018: src = link + "device_erwenqiang.png"; break;//病区TV
          case 1002: src = link + "device_erwenqiang.png"; break;//医生推车
          case 1003: src = link + "device_erwenqiang.png"; break;//护士推车
          default: src = link + "device_qita.png"; break;//其它
        }
        return src;
      }
    }
  })();
