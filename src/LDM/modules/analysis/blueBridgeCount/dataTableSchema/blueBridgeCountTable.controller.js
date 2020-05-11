(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("BlueBridgeCountDataTableController", BlueBridgeCountDataTableController);

  /** @ngInject */
  function BlueBridgeCountDataTableController($rootScope, $scope, $state, hospitalRest, deviceInfoService) {
    var vm = this;

    vm.clickRow= clickRow;
    vm.setColor = setColor;
    vm.queryParams = {
      key: "",
      wardCode: "",
      deviceType: 1004
    }

    vm.operation =[{
      info: '展开',
      src: 'assets/images/devices/icon_xiala.png'
    },{
      info: '收缩',
      src: ''
    }
  ]

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
      return deviceInfoService.getDevices({macList: mac}).then(function(response) {
        vm.devicesInfo = response;
      })
    }

    function clickRow(row) {
      if(row.connectedNum !== 0){
        row.showDetail ? row.showDetail = false : row.showDetail = true;
        var macList = [];
        row.deviceList.map(function(item){
          macList.push(item.content.basicInfo.mac);
        })
        getDeviceInfo(macList);
      }
    }

    function setColor(count) {
      var color = "text-warning";
      if(count > 7) {
        color = "text-danger";
      } else if ( count < 5) {
        color = "";
      }
      return color;
    }
  }
})();
