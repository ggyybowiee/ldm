(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("APCountController", APCountController);

  /** @ngInject */
  function APCountController(   $rootScope,
    $scope,
    $state,
    $http,
    deviceInfoService,
    hospitalRest) {
    var vm = this;

        vm.onlineCount = 0;
        vm.offlineCount = 0;
        vm.graphData = null;
        vm.clickWard = clickWard;
        vm.setIcons = setIcons;
        vm.selectedDevice = {};
        vm.getDevices = getDevices;
        vm.load = {
          init: true,
          func: init
        };

        getDeviceTypes();
        getDeviceBelong();

        function init() {
          return getAPConnectedGraph().then(function(response) {
            vm.graphData = response.map(function(wardItem) {
              wardItem.onlineCount = 0;
              wardItem.offlineCount = 0;
              wardItem.connectedDevices.map(function(item) {
                wardItem.onlineCount += item.onlineNumber;
                wardItem.offlineCount += item.offlineNumber;
                return item;
              });
              vm.onlineCount += wardItem.onlineCount;
              vm.offlineCount += wardItem.offlineCount;
              return wardItem;
            });
            // vm.graphData = response;
          });
        }

        function getAPConnectedGraph() {
          return deviceInfoService.getAPConnectedGraph();
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

        function clickWard(apDevice) {
          $rootScope.APDevice = apDevice;
          $state.go('main.APCount.wardAPCount');
        }

        function getDevices(mac, ward) {
          vm.selectedDevice.deviceType = ward.deviceType;
          vm.selectedDevice.mac = mac;
          return deviceInfoService.getDevices({macList: ward.macList}).then(function(response) {
            vm.selectedDeviceDetail = response;
          })
        }

        function setIcons(deviceTypeCode) {
          var link = "assets/images/devices/";
          var src = "";
          switch(deviceTypeCode) {
            case 1014: src = link + "device_erwenqiang.png"; break;//耳温枪
            case 1001: src = link + "device_qita.png"; break;       //nda
            case 1004: src = link + "device_qita.png"; break;//蓝桥
            case 1005: src = link + "device_shuye.png"; break;     //输液检测器
            case 1008: src = link + "device_qita.png"; break;//医护安全卫士
            case 1011: src = link + "device_maiboyi.png"; break;//脉搏夹
            case 1010: src = link + "device_xueyayi.png"; break;//血压
            case 1006: src = link + "device_qita.png"; break;//患者腕带
            case 1016: src = link + "device_qita.png"; break;//门口机
            case 1015: src = link + "device_qita.png"; break;//门头卡
            case 1017: src = link + "device_qita.png"; break;//护士站
            case 1018: src = link + "device_qita.png"; break;//病区TV
            case 1002: src = link + "device_qita.png"; break;//医生推车
            case 1003: src = link + "device_qita.png"; break;//护士推车
            default: src = link + "device_qita.png"; break;//其它
          }
          return src;
        }
  }
})();
