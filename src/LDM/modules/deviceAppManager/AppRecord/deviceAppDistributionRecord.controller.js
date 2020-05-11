(function() {
  "use strict";

  // @ts-check

  angular
    .module("lachesis-ldm")
    .controller(
      "DeviceAppDistributionRecordController",
      DeviceAppDistributionRecordController
    );

  /** @ngInject */
  function DeviceAppDistributionRecordController(
    $scope,
    modalService,
    sessionService,
    deviceInfoService,
    Restangular,
    deviceAppService,
    hospitalRest,
    roleService,
    $filter
  ) {
    var vm = this;

    var today = new Date();
    vm.openDetail = openDetail;
    vm.roles = roleService.roles;
    vm.getName = getName;
    vm.selectedRow = null;
    vm.queryParams = {
      startTime: today ,
      endTime: today ,
      softwareName: ""
    }

    vm.status = [
      {
        code: "1",
        info: "已完成"
      },
      {
        code: "-1",
        info: "失败"
      },
      {
        code: "0",
        info: "未完成"
      }
    ]

    vm.load = {
      init: true,
      func: init
    }

    getWards();
    //getRoles();
    function init() {
      return getUpgradeRecords(vm.queryParams).then(function(response) {
        vm.records = response.map(function(item) {
          item.names = "";
          var softwares = item.softwares.map(function(software){
            return software.name;
          });
          item.names = softwares.join(';');
          item.showDetail = false;
          return item;
        });
      })
    }

    function getWards() {
      return hospitalRest.getWards().then(function(response) {
        vm.wards = response;
      })
    }

    function getRoles() {
      return  roleService.getRoleResources().then(function(response){
        vm.roles = response;
      });
    }

    function getUpgradeRecords(params) {
      return deviceAppService.getSoftwareUpgradeRecords(params);
    }

    function getUpgradeRecord(id) {
      return deviceAppService.getSoftwareUpgradeRecord(id);
    }

    function openDetail(row) {
      row.showDetail = !row.showDetail;
      if(row.showDetail) {
        getUpgradeRecord(row.groupId).then(function(response) {
          row.detail = response;
        })
      } else {
        row.detail = null;
      }
      vm.selectedRow = row;
    }

    function getName(row){
      // vm.roles | filter: {primaryKey: row.createPerson})[0].createPerson
      //row.createPersonName =  $filter('filter')(vm.roles,{primaryKey: parseInt(row.createPerson)})[0].createPerson;
    }
  }
})();
