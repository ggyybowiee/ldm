(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('LDMDeviceRunningDetailController', LDMDeviceRunningDetailController);

  /** @ngInject */
  function LDMDeviceRunningDetailController($scope, modalService, $interval, monitoringService, deviceInfoService, hospitalRest, $q, moment, _) {
    var vm = this;

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
    vm.openDetail = openDetail;

    function init() {
      return getMonitors(vm.queryParams).then(function (response) {
        vm.statuses = response;
      });
    }

    getCode();

    // getCode('connectInfo').then(function (response) {
    //   vm.connectInfos = response;
    // });
    // getCode('errorInfo').then(function (response) {
    //   vm.errorInfos = response;
    // });
    getDeviceTypes();
    getDeviceBelong();

    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.connectInfos = _.filter(vm.codes, { type: 'onlineStatus' });
        vm.errorInfos = _.filter(vm.codes, { type: 'errorLevel' });
      });
    }

    // function getConnectStatus() {
    //   return monitoringService.getConnectStatus().then(function (response) {
    //     console.log(response);
    //   });
    // }

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

    function openDetail(row) {
      var params = {
        eqpSn: row.basicInfo.sn,
        eqpMac: row.basicInfo.mac
      };

      modalService.open({
        templateUrl: 'LDM/modules/deviceManagement/deviceMonitoring/detail.modal.html',
        size: 'lg',
        data: {
          metaData: {
            belongs: vm.belongs,
            types: vm.types,
            codes: vm.codes
          }
        },
        initFn: function () {
          var that = this;
          var network = monitoringService.getStatus('online', params);
          var record = monitoringService.getStatus('operation', params);
          var logInfo = monitoringService.getLogInfo(params);
          var errorInfo = monitoringService.getStatus('error', params);
          var locationInfo = monitoringService.getStatus('location', params);
          var batteryInfo = monitoringService.getStatus('battery', params);

          // TODO:测试数据
          that.currentDate = moment().format('YYYY-MM-DD');
          that.onlineTime = ((new Date().getTime() - new Date(that.currentDate + ' 08:38:00').getTime()) / (1000 * 60 * 60)).toFixed(1);

          $q.all([network, record, logInfo, errorInfo, locationInfo, batteryInfo]).then(function (response) {
            that.metaData.network = response[0];
            that.metaData.record = response[1];
            that.metaData.logInfo = response[2];
            that.metaData.errorInfo = response[3];
            that.metaData.locationInfo = response[4];
            that.metaData.batteryInfo = response[5];
            that.metaData.deviceInfo = row;
          });
        },
        methodsObj: {
          downloadLogFile: function(url) {
            window.open('windranger/ldm/logs?URL=' + url, url);
          }
        }
      });
    }
  }
})();
