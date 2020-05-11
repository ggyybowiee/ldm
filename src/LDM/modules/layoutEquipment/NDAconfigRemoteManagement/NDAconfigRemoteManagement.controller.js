(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller(
      "NDAconfigRemoteManagementController",
      NDAconfigRemoteManagementController
    );

  /** @ngInject */
  function NDAconfigRemoteManagementController(
    $rootScope,
    $scope,
    $state,
    modalService,
    deviceInfoService,
    hospitalRest,
    $filter,
    sessionService,
    $interval
  ) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();
    vm.searchTypeArray = [];

    vm.dic = dicHelper.dic;
    vm.openSearchDevicesModal = openSearchDevicesModal;
    vm.search = search;
    vm.searchWithBelong = searchWithBelong;
    vm.intervalLoadingCb = intervalLoadingCb;
    vm.isNotShowIntervalLoading = true;
    vm.interval = null;
    vm.queryText = "";
    vm.queryParams = {
      eqpName: "",
      eqpType: 1001,
      eqpBelong: "",
      eqpStatus: 10001,
      content: ""
    };

    vm.searchDevices = {
      vibrateisChecked: false,
      beepisChecked: false,
      locationisChecked: false
    };

    vm.searchDevicesType = vm.dic.ldmSearchType;

    vm.searchDevicesConfig = {
      "createPerson": "",
      "deviceId": "",
      "searchTypes": []
    };

    deviceInfoService.getDevices(vm.queryParams).then(function(res) {
      vm.date = res;
      vm.dateCopy = vm.date;
    });

    getDeviceBelong();
    getDeviceTypes()
    function getDeviceBelong() {
      //获取所有科室名称
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function getDeviceTypes() {
      //获取所有设备类型名称
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.types = response;
      });
    }

    function search() {
      //顶端搜索条搜索，过滤
      deviceInfoService.getDevices(vm.queryParams).then(function(res) {
        vm.date = res;
        vm.dateCopy = vm.date;
      });
    }

    function searchWithBelong() {
      //根据科室过滤，选择设备
      deviceInfoService.getDevices(vm.queryParams).then(function(res) {
        vm.date = res;
        vm.dateCopy = vm.date;
      });
    }

    function intervalLoadingCb() {
      vm.isNotShowIntervalLoading = true;
    }

    function openSearchDevicesModal(item) {
      var instance = modalService.open({
        templateUrl:
          "LDM/modules/layoutEquipment/NDAconfigRemoteManagement/searchNDADevices.modal.html",
        size: "md",
        methodsObj: {
          currentDevice: item,
          searchType: vm.searchDevicesType,
          searchTypeArray: vm.searchTypeArray,
          setSearchType: function(num) {
            var that = this;
            if(that.searchTypeArray.indexOf(num) === -1){
              that.searchTypeArray.push(num);
            }else that.searchTypeArray.splice(that.searchTypeArray.indexOf(num),1);
          }
        },
        initFn: function() {
          var that = this;
          vm.isHideIntervalLoading = true;
          that.searchTypeArray = [];
        },
        ok: function() {
          var that = this;
          vm.searchDevicesConfig.createPerson = item.createPerson;
          vm.searchDevicesConfig.deviceId = item.id;
          vm.searchDevicesConfig.searchTypes = that.searchTypeArray;
          vm.isHideIntervalLoading = false;
          deviceInfoService.postDeviceSearch(vm.searchDevicesConfig).then(function(response) {
            that.searchDevicesResult = null;
            vm.isNotShowIntervalLoading = false;
            vm.interval = $interval(function() {
                  deviceInfoService.getDeviceSearch({deviceId: item.id}).then(function(response) {
                    that.searchDevicesResult = response;
                })
            },5000,7);
          })
        },
        cancel: function() {}
      });

      instance.closed.then(function () {
        $interval.cancel(vm.interval);
      })
    }
  }
})();
