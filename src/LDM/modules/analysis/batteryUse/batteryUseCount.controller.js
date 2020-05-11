(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BatteryUseController", BatteryUseController);

  /** @ngInject */
  function BatteryUseController($rootScope, $scope, $state, $filter, deviceInfoService, hospitalRest) {
    var vm = this;

    vm.clickRow = clickRow;
    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.queryParams = {
      key: "",
      deviceType: 1001,
      wardCode: "",
      startTime: vm.today,
      endTime: vm.today
    }
    vm.load = {
      init: true,
      func: init
    };

    getDeviceTypes();
    getDeviceBelong();
    function init() {
      return deviceInfoService.getBatteryHistory(vm.queryParams).then(function(response) {
        vm.history = response;
      })
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.types = response;
      });
    }

    function clickRow(row) {
      if(row.batteryRecordList.length !== 0) row.showDetail ? row.showDetail = false : row.showDetail = true;
    }
  }
})();
