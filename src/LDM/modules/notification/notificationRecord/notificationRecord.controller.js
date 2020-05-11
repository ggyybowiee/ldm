(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NotificationRecordController", NotificationRecordController);

  /** @ngInject */
  function NotificationRecordController(
    $rootScope,
    $scope,
    $state,
    deviceInfoService,
    hospitalRest,
    modalService,
    $filter,
    orderByFilter,
    _
  ) {
    var vm = this;

    vm.today = $filter('date')(new Date, "yyyy-MM-dd");
    vm.getNotificationRecords = getNotificationRecords;
    vm.openDetailModal = openDetailModal;
    vm.records = [];
    vm.load = {
      init: true,
      func: init
    }
    vm.queryParams = {
      key: '',
      startTime: '',
      endTime: vm.today
    }

    getCode();

    function init() {
      return getNotificationRecords(vm.queryParams).then(function(response) {
        vm.records = orderByFilter(response, 'sendTime',true);
      })
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.msgType = _.filter(vm.codes, { type: 'msgType' });
        vm.status = _.filter(vm.codes, { type: 'messageStatus'});
      });
    }

    function getNotificationRecords(params) {
      return deviceInfoService.getNotifyRecord(params);
    }

    function openDetailModal(row) {
      modalService.open({
        templateUrl: "LDM/modules/notification/notificationRecord/recordDetail.modal.html",
        size: "lg",
        data: {
          metaData: {
            detail: '',
            deviceTypes:[],
            wards: [],
            msgType: vm.msgType
          }
        },
        ok: function() {
        },
        initFn: function() {
          var that = this;
          that.metaData.status = vm.status;
          hospitalRest.getWards().then(function(response) {
            that.metaData.wards = response;
          });
          deviceInfoService.getDeviceType().then(function(response) {
            that.metaData.deviceTypes = response;
          });
          deviceInfoService.getNotifyRecordDetail(row.groupId).then(function(response) {
            that.metaData.detail = response;
          })
        },
        methodsObj: {}
      });
    }
  }
})();
