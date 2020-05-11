(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BlueBridgeCountController", BlueBridgeCountController);

  /** @ngInject */
  function BlueBridgeCountController(
    $rootScope,
    $scope,
    $state,
    $http,
    deviceInfoService,
    hospitalRest,
    $document
  ) {
    var vm = this;

    vm.onlineCount = 0;
    vm.offlineCount = 0;
    vm.graphData = null;
    // vm.clickWard = clickWard;
    vm.setIcons = setIcons;
    vm.setBBLocation = setBBLocation;
    vm.load = {
      init: true,
      func: init
    };

    getDeviceTypes();
    getDeviceBelong();

    function init() {
      return getBlueBridgeConnectedGraph().then(function(response) {
        vm.graphData = response.map(function(wardItem) {
          wardItem.onlineCount = 0;
          wardItem.offlineCount = 0;
          wardItem.statistics.map(function(item) {
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

    function getBlueBridgeConnectedGraph() {
      return deviceInfoService.getBlueBridgeConnectedGraph();
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

    // function clickWard(wardCode) {
    //   $rootScope.blueBridgeGraDetail = wardCode;
    //   $state.go('main.blueBridgeCount.wardBlueBridgeCount');
    // }

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
        // case 1003: src = link + "device_luyouqi.png"; break;//路由器
        // case 1003: src = link + "device_qita.png"; break;//蓝桥
      }
      return src;
    }

    function setBBLocation() {
      //设置最左边蓝桥图标的位置。使其在图像大于浏览器高度时，在浏览器中垂直居中，在图像小于浏览器高度时，居中与图像。
      if($document.documentElement.clientHeight < $("bbDetail").height){

      }
    }

    // $scope.$watch('$viewContentLoaded', function(){
    //   if($document.context.documentElement.clientHeight < angular.element("#bbDetail")[0].height){
    //       alert();
    //     }
    // })

    // $document.ready(function() {
    //   alert();
    // })
  }
})();
