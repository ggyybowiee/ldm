(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('APCountDataTableController', APCountDataTableController);

  /** @ngInject */
  function APCountDataTableController($rootScope,$scope,$state, deviceInfoService, hospitalRest) {
    var vm = this;

    vm.clickRow= clickRow;
    vm.setColor = setColor;
    vm.queryParams = {
      key: "",
      warCode: "",
      deviceType: "AP"
    }

    vm.load = {
      init: true,
      func: init
    }

    getDeviceBelong();
    getDeviceTypes();

    function init() {
      return deviceInfoService.getConnectedDevices(vm.queryParams).then(function(response) {
        vm.devices = response;
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
    function getDeviceInfo(mac) {
      return deviceInfoService.getDevices({eqpName: mac}).then(function(response) {
        vm.devicesInfo = response;
      })
    }

    function clickRow(row) {
      row.showDetail ? row.showDetail = false : row.showDetail = true;
      getDeviceInfo(row.mac);
    }

    function setColor(count) {
      var color = "text-warning";
      if(count > 15) {
        color = "text-danger";
      } else if ( count < 11) {
        color = "";
      } 
      return color;
    }
  }
})();
