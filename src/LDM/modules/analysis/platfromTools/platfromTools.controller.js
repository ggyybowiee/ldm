(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("PlatfromToolsController", PlatfromToolsController);

  /** @ngInject */
  function PlatfromToolsController($rootScope, $scope, $state, deviceInfoService, hospitalRest, $filter) {
    var vm = this;
    var date = new Date();
    vm.firstDay = $filter('date')(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd");
    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.exportExcel = exportExcel;
    vm.load = {
      init: true,
      func: init
    }

    vm.operationQueryParams = {
      startTime: vm.firstDay,
      endTime: vm.today,
      key: "",
      wardCode: "",
      deviceType: ""
    }

    vm.batteryQueryParams = {
      startTime: vm.today,
      endTime: vm.today,
      key: "",
      wardCode: "",
      deviceType: ""
    }

    getDeviceTypes();
    getDeviceBelong();

    function init() {

    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.deviceTypes = response;
        vm.operationQueryParams.deviceType = vm.deviceTypes[0].code;
        vm.batteryQueryParams.deviceType = vm.deviceTypes[0].code;
      });
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.wards = response;
        vm.operationQueryParams.wardCode = vm.wards[0].wardCode;
        vm.batteryQueryParams.wardCode = vm.wards[0].wardCode;
      });
    }

    function exportExcel(uri,queryParams) {
      var uri = URI(uri).query(queryParams);
      return uri.toString();
    }

    // function download(fileName, content) {
    //   var aLink = document.createElement('a');
    //   var blob = new Blob([content]);
    //   var evt = document.createEvent("HTMLEvents");
    //   evt.initEvent("click", false, false);//initEvent 不加后两个参数在FF下会报错, 感谢 Barret Lee 的反馈
    //   aLink.download = fileName;
    //   aLink.href = URL.createObjectURL(blob);
    //   aLink.dispatchEvent(evt);
    // }
  }
})();
