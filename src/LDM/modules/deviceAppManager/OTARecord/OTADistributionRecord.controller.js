(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller(
      "OTADistributionRecordController",
      OTADistributionRecordController
    );

  /** @ngInject */
  function OTADistributionRecordController(
    $rootScope,
    $scope,
    $state,
    modalService,
    deviceInfoService,
    ldmSessionCache,
    hospitalRest,
    deviceAppService,
    $filter,
    _
  ) {
    var vm = this;
    vm.openDetail = openDetail;
    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.queryParams = {
      startTime: vm.today,
      endTime: vm.today,
      keyword: "",
      wardCode: "",
      deviceType: ""
    };

    vm.deviceTypes = [
      {
        code: 1001,
        name: "NDA"
      },
      {
        code: 1004,
        name: "蓝桥"
      }
    ]

    vm.load = {
      init: true,
      func: init
    };

    vm.queryParams.deviceType = 1001;
    getWards();
    getCodes();

 function init() {
      return getRecords(vm.queryParams).then(function(response) {
        // vm.records = response;
        vm.records = $filter('orderBy')(response, '-createTime');
      });
    }

    function getRecords(params) {
      return deviceAppService.getOTAUpgradeRecords(params);
    }

    function getCodes() {
      return deviceInfoService.getCodes().then(function(response) {
        vm.status = $filter('filter')(response,{type: "installStatus"});
        vm.stepNames = $filter('filter')(response,{type: "step"});
        vm.results = $filter('filter')(response,{type: "otaStatus"});
        vm.reasons = $filter('filter')(response,{type: "otaFailReason"});
      })
    }
    function getWards() {
      //获取病区信息
      return hospitalRest.getWards().then(function(response) {
        vm.wards = response;
      });
    }

    function openDetail(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceAppManager/OTARecord/recordDetail.modal.html",
        size: "md",
        data: {
          metaData: {
            wards: vm.wards,
            deviceTypes: vm.deviceTypes,
            stepNames: vm.stepNames,
            status: vm.results,
            reasons: vm.reasons
            // status: [
            //   {
            //     result: "success",
            //     info: "成功"
            //   },
            //   {
            //     result: "fail",
            //     info: "失败"
            //   }
            // ]
            // stepNames: [
            //   {
            //     stepName: "download",
            //     info: "设备下载升级包"
            //   },
            //   {
            //     stepName: "upgrade",
            //     info: "升级"
            //   },
            //   {
            //     stepName: "upgrade",
            //     info: "推送升级消息"
            //   }
            // ]
          }
        },
        methodsObj: {},
        initFn: function() {
          var that = this;
          deviceAppService
            .getOTAUpgradeRecord(item.id, vm.queryParams)
            .then(function(response) {
              that.data = response;
            });
        },
        ok: function() {}
      });
    }
  }
})();
