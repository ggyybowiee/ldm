(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("UsageRateController", UsageRateController);

  /** @ngInject */
  function UsageRateController(
    $scope,
    modalService,
    $echarts,
    $interval,
    chartsService,
    deviceInfoService,
    hospitalRest,
    $filter,
    orderByFilter
  ) {
    var vm = this;

    vm.today = $filter('date')(new Date(), 'yyyy-MM-dd');
    vm.setTitle = setTitle;
    vm.search = search;
    vm.propertyName = '';
    vm.reverse = true;
    vm.title = "使用时长";
    vm.sortDevices = sortDevices;
    vm.queryParams = {
      key: "",
      deviceType: "",
      wardCode: "",
      startTime: "",
      endTime: ""
    }
    vm.titleWithTimes = [1014,1011,1010,1008];
    vm.load = {
      init: true,
      func: init
    };

    getDeviceBelong();
    // vm.queryParams.startTime = vm.today;
    // vm.queryParams.endTime = vm.today;

    function init() {
      return getDeviceTypes().then(function(response) {
        vm.types = response;
        vm.queryParams.deviceType = vm.types[0].code;
        vm.queryParams.startTime = vm.today;
        vm.queryParams.endTime = vm.today;
        getUsageRate().then(function(response) {
          vm.usageRate = response;
          if(response.length > 0) {
            setTitle(response[0]);
            response[0].times ? vm.propertyName ='times' : vm.propertyName = 'hours';
          }else{
            if(vm.titleWithTimes.indexOf(vm.queryParams.deviceType) > -1){
              vm.propertyName ='times';
              vm.title = "使用次数";
            }else{
              vm.propertyName = 'hours';
              vm.title = "使用时长(小时)";
            }
          }
        });
      });
    }

    function getDeviceTypes() {
      return deviceInfoService.getDeviceType();
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function getUsageRate() {
      return deviceInfoService.getUsageRate(vm.queryParams);
    }
    function search() {
      return getUsageRate().then(function(response) {
        vm.usageRate = response;
        if(response.length > 0) {
          setTitle(response[0]);
          response[0].times ? vm.propertyName ='times' : vm.propertyName = 'hours';
        }else{
          if(vm.titleWithTimes.indexOf(vm.queryParams.deviceType) > -1){
            vm.propertyName ='times';
            vm.title = "使用次数";
          }else{
            vm.propertyName = 'hours';
            vm.title = "使用时长(小时)";
          }
        }
      });
    }

    function setTitle(firstRow) {
      if(firstRow.hours !==null && firstRow.hours !== undefined && firstRow.hours !== "") {
        vm.title = "使用时长(小时)";
      } else if(firstRow.times !==null && firstRow.times  !== undefined && firstRow.times  !== ""){
        vm.title = "使用次数";
      };
    }

    function sortDevices(propertyName){
      vm.reverse = (vm.propertyName !==null && vm.propertyName === propertyName) ? !vm.reverse : false;
      vm.propertyName = propertyName;
      vm.usageRate = orderByFilter(vm.usageRate, vm.propertyName, vm.reverse);
    }
  }
})();
