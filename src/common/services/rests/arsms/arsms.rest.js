(function() {
  'use strict';

  angular.module('lachesis-common').factory('arsmsService', arsmsService);

  /** @ngInject */
  function arsmsService(Restangular, _) {
    var device = '/arsms/eqpInfos';
    var user = '/arsms/eqpUsers';
    var location = '/arsms/blueBridgeLocations';
    var eventType = '/arsms/arsmsEqpChestcardWarning';
    var report = '/arsms/report';
    var exportExcelReport = '/arsms/report/export';
    var cancelAlertUrl = '/arsms/alert/cancel';
    var alertStatus = '/arsms/alert/status';
    var batteryReminder = '/arsms/reminder';

    var service = {
      getDevices: getDevices,
      getUsers: getUsers,
      getLocations: getLocations,
      getEventTypes: getEventTypes,
      gatherLastData: _.noop,
      gatherData: _.noop,
      getCopyDataByPatID: _.noop,
      copy: _.noop,
      deleteData: _.noop,
      getReport: getReport,
      exportReportExcel: exportReportExcel,
      cancelAlert: cancelAlert,
      getAlertStatus: getAlertStatus,
      setAlertStatus: setAlertStatus,
      getBatteryReminder: getBatteryReminder,
      updateBatteryReminder: updateBatteryReminder,
      postBatteryReminder: postBatteryReminder
    };

    return service;

    function getDevices(params) {
      return Restangular.all(device).getList(params);
    }

    function getUsers() {
      return Restangular.all(user);
    }

    function getLocations() {
      return Restangular.all(location);
    }

    function getEventTypes() {
      return Restangular.all(eventType);
    }

    function getReport(query) {
      return Restangular.all(report).customGET('', query);
    }

    function exportReportExcel(query) {
      return Restangular.all(exportExcelReport).getList(query);
    }

    function cancelAlert(mac) {
      return Restangular.all(cancelAlertUrl + '?deviceMac=' + mac).customPOST();
    }

    function getAlertStatus(wardCode) {
      return Restangular.one(alertStatus + '?wardCode=' + wardCode).get();
    }

    function setAlertStatus(status, wardCode) {
      return Restangular.all(alertStatus + '?status=' + status + '&wardCode=' + wardCode).customPOST({
        wardCode: wardCode,
        status: status
      });
    }

    function getBatteryReminder(){
      return Restangular.one(batteryReminder).get();
    }

    function updateBatteryReminder(data){
      return Restangular.one(batteryReminder).customPUT(data);
    }

    function postBatteryReminder(data){
      return Restangular.one(batteryReminder).customPOST(data);
    }

  }
})();
