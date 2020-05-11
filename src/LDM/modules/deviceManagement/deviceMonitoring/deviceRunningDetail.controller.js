(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('LDMDeviceRunningDetailController', LDMDeviceRunningDetailController);

  /** @ngInject */
  function LDMDeviceRunningDetailController($scope, $rootScope, modalService, $interval, $window, monitoringService, deviceInfoService, $stateParams, hospitalRest, $q, moment, _) {
    var vm = this;
    
    vm.newId = $window.monitoringDeviceMac;
    vm.id = $stateParams.id ? $stateParams.id : $rootScope.monitoringDeviceMac ?　$rootScope.monitoringDeviceMac　: null;
    vm.load = {
      init: true,
      func: init
    };
    vm.codes = [];
    vm.queryParams = {
      onlineStatus: '',
      errorLevel: '',
      eqpType: '',
      key: '',
      eqpBelong: ''
    };

    function init() {
      return getMonitors(vm.queryParams).then(function (response) {
        vm.statuses = response;
      });
    }

    getCode();

    getDeviceTypes();
    getDeviceBelong();
    init();

    function init() {
      if(vm.id) {
        vm.deviceInfo = deviceInfoService.getDevice(vm.id);
        vm.network = monitoringService.getStatus('online', params);
        vm.record = monitoringService.getStatus('operation', params);
        vm.logInfo = monitoringService.getLogInfo(params);
        vm.errorInfo = monitoringService.getStatus('error', params);
        vm.locationInfo = monitoringService.getStatus('location', params);
        vm.batteryInfo = monitoringService.getStatus('battery', params);
      }
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.connectInfos = _.filter(vm.codes, { type: 'onlineStatus' });
        vm.errorInfos = _.filter(vm.codes, { type: 'errorLevel' });
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

    function getMonitors() {
      return monitoringService.getStatus('brief', vm.queryParams);
    }

    };
})();
