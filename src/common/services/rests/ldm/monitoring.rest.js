(function() {
  'use strict';

  angular.module('lachesis-common').factory('monitoringService', monitoringService);

  /** @ngInject */
  function monitoringService(Restangular) {
    var monitors = '/ldm/deviceOperation',
      connectStatus = '/ldm/connectStatus',
      errorInfo = '/ldm/errorInfo',
      logInfo = '/ldm/logInfo',
      record = '/ldm/operationStatus',
      battery = '/ldm/batStatus',
      location = '/ldm/location',
      log = '/ldm/logs/message/upload',
      logDownload = '/ldm/logs';
    var status = '/ldm/status/';
    var service = {
      getMonitors: getMonitors,
      getConnectStatus: getConnectStatus,
      getErrorInfo: getErrorInfo,
      getRecord: getRecord,
      getLocationInfo: getLocationInfo,
      getLogInfo: getLogInfo,
      getBatteryStatus: getBatteryStatus,
      downLoadLog: downLoadLog,
      getStatus: getStatus,
      getLog: getLog
    };

    return service;

    function getMonitors(params) {
      return Restangular.all(monitors).getList(params);
    }

    function getStatus(statusCode, params) {
      return Restangular.all(status + statusCode).customGET('', params);
    }

    function getConnectStatus(params) {
      return Restangular.all(connectStatus).getList(params);
    }

    function getBatteryStatus() {
      return Restangular.all(battery);
    }

    function getErrorInfo(params) {
      return Restangular.all(errorInfo).getList(params);
    }
    function getRecord(params) {
      return Restangular.one(record).get(params);
    }
    function getLogInfo(params) {
      return Restangular.all(logInfo).getList(params);
    }
    function getLocationInfo(params) {
      return Restangular.all(location).getList(params);
    }

    function downLoadLog() {
      return Restangular.all(logDownload);
    }

    function getLog(params){
      return Restangular.one(log).customPOST(undefined,undefined,params,undefined);
    }
  }
})();
