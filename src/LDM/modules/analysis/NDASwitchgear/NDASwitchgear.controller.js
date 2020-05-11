(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NDASwitchgearController", NDASwitchgearController);

  /** @ngInject */
  function NDASwitchgearController($rootScope, $scope, $state, deviceInfoService, hospitalRest, $filter) {
    var vm = this;

    vm.select = false;
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

    getDeviceBelong();
    getCode();
    function init() {
      return deviceInfoService.getOperationHistory(vm.queryParams).then(function(response) {
        vm.history = response;
      })
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.switchgearType = _.filter(vm.codes, { type: 'operationStatus' });
      });
    }

    function clickRow(row) {
      if(row.count !== 0) row.showDetail ? row.showDetail = false : row.showDetail = true;
    }

  }
})();
