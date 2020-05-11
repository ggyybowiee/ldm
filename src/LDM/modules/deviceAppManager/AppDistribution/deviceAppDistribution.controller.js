(function() {
  "use strict";

  // @ts-check

  angular
    .module("lachesis-ldm")
    .controller(
      "DeviceAppDistributionController",
      DeviceAppDistributionController
    );

  /** @ngInject */
  function DeviceAppDistributionController(
    $scope,
    modalService,
    sessionService,
    deviceInfoService,
    Restangular,
    deviceAppService,
    hospitalRest,
    $filter,
    $q
  ) {
    var vm = this;

    vm.getDevices = getDevices;
    vm.pushSoftware = pushSoftware;
    vm.openSearchDevices = openSearchDevices;
    vm.openSearchSoftwares = openSearchSoftwares;
    vm.deleteDevice = deleteDevice;
    vm.deleteSoftware = deleteSoftware;
    vm.selectedDevices = [];
    vm.selectedSoftwares = [];
    vm.distributionParams = {
      deviceIds: [],
      softwareIds: []
    };
    vm.load = {
      init: true,
      func: init
    };

    function init() {
      vm.devices = [];
      vm.softwares = [];
      vm.selectedDevices = [];
      vm.selectedSoftwares = [];
      vm.distributionParams.deviceIds = [];
      vm.distributionParams.softwareIds = [];
    }
    function getDevices() {
      return deviceInfoService.getDevices().then(function(response) {
        vm.devices = response;
      });
    }
    function pushSoftware() {
      filterParams();
      return deviceAppService
        .postSoftwareUpgrade(vm.distributionParams)
        .then(function(response) {
          $scope.$emit("toast", {
            type: "success",
            content: "已推送！"
          });

          vm.load.func();
        });
    }

    function filterParams() {
      var newDevices = [];
      var newSoftwares = [];
      vm.selectedDevices.forEach(function(element) {
        newDevices.push(element.content.basicInfo.mac);
      }, this);
      vm.distributionParams.deviceIds = newDevices;

      vm.selectedSoftwares.forEach(function(element) {
        newSoftwares.push(element.seqId);
      }, this);
      vm.distributionParams.softwareIds = newSoftwares;
    }
    function openSearchDevices() {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceAppManager/AppDistribution/searchDevices.modal.html",
        size: "lg",
        data: {
          metaData: {
            wards: vm.wards,
            deviceTypes: vm.deviceTypes,
            devices: vm.devices,
            // isSelectAll: false,
            status: [
              {
                result: "success",
                info: "成功"
              },
              {
                code: "failed",
                info: "失败"
              }
            ],
            queryParams: {
              eqpName: "",
              eqpType: 1001,
              eqpBelong: "",
              eqpStatus: 10001
            }
          }
        },
        initFn: function() {
          var that = this;
          hospitalRest.getWards().then(function(response) {
            that.metaData.wards = response;
          });

          //目前只支持NDA
          that.metaData.deviceTypes = [{
            code: 1001,
            name: "NDA"
          }];
          deviceInfoService.getDevices(that.metaData.queryParams).then(function(response) {
            that.data = filterDevices(vm.selectedDevices, response);
            // var temp = [];

            // for(var i = 0; i < 100; i += 1) {
            //   temp.push({
            //     name: 'gary' + i,
            //     seqId: '' + i
            //   });
            // }

            // that.data = temp;
            // that.selected = ["3"];
          });
          that.checked = vm.selectedDevices ? vm.selectedDevices : [];
        },
        ok: function() {
          var that = this;
          var defer = $q.defer();
          //复选框组件的value只能接受字符串。传入mac地址后再从设备列表中过滤出来。
          vm.selectedDevices = vm.selectedDevices.concat(_.filter(that.data, function(item){
            return that.checked.indexOf(item.content.basicInfo.mac) > -1;
          }));
          defer.resolve(that.checked);
          return defer.promise;
        },
        methodsObj: {
          searchDevices: function() {
            var that = this;
            return deviceInfoService.getDevices(that.metaData.queryParams).then(function(response) {
              //获取设备，过滤掉已经被选过的设备
              that.data = filterDevices(vm.selectedDevices, response);
              that.checked = vm.selectedDevices ? vm.selectedDevices : [];
            });
          }
        }
      });
    }

    function filterDevices(selectedItems, items) {
      if (selectedItems.length == 0) return items;
      selectedItems.map(function(selectedItem) {
        for (var i = 0; i < items.length; i++) {
          if (selectedItem.id === items[i].id) {
            items.splice(i, 1);
          }
        }
      });
      return items;
    }

    function deleteDevice(device) {
      var index = vm.selectedDevices.indexOf(device);
      if (index !== -1) {
        vm.selectedDevices.splice(index, 1);
      }
    }
    function openSearchSoftwares() {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceAppManager/AppDistribution/searchApps.modal.html",
        size: "md",
        data: {
          metaData: {
            softwares: vm.softwares,
            queryParams: {
              softName: ""
            }
          }
        },
        methodsObj: {
          searchApps: function() {
            var that = this;
            return deviceAppService.getSoftwares(that.metaData.queryParams).then(function(response) {
              //获取软件，过滤掉已经被选过的软件
              that.data = filterSoftwares(vm.selectedSoftwares, response);
              that.checked = vm.selectedSoftwares ? vm.selectedSoftwares : [];
            });
          }
        },
        initFn: function() {
          var that = this;
          deviceAppService.getSoftwares().then(function(response) {
            that.data = filterSoftwares(vm.selectedSoftwares, response);
          });
        },
        ok: function() {
          var that = this;
          var defer = $q.defer();
          vm.selectedSoftwares = vm.selectedSoftwares.concat(_.filter(that.data, function(item){
            return that.checked.indexOf(item.seqId) > -1;
          }));

          defer.resolve(that.checked);
          return defer.promise;
        }
      });
    }

    function filterSoftwares(selectedItems, items) {
      if (selectedItems.length == 0) return items;
      selectedItems.map(function(selectedItem) {
        for (var i = 0; i < items.length; i++) {
          if (selectedItem.seqId === items[i].seqId) {
            items.splice(i, 1);
          }
        }
      });
      return items;
    }

    function deleteSoftware(software) {
      var index = vm.selectedSoftwares.indexOf(software);
      if (index !== -1) {
        vm.selectedSoftwares.splice(index, 1);
      }
    }
  }
})();
