(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("IpConficatAnalysisController", IpConficatAnalysisController);

  /** @ngInject */
  function IpConficatAnalysisController($rootScope, $scope, $state, $http, deviceInfoService, $filter, hospitalRest) {
    var vm = this;

    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.queryParams = {
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
      return getIpCollision().then(function(response) {
        vm.collision = response;
      });
    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.types = response;
      });
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }
    function getIpCollision() {
      return deviceInfoService.getIpCollision(vm.queryParams);
    }
  }
})();
