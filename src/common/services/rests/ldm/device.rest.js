(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("deviceInfoService", deviceInfoService);

  /** @ngInject */
  function deviceInfoService(Restangular) {
    var device = "/ldm/device",
      code = "/ldm/code",
      belong = "/ldm/code/deviceBelong",
      deviceType = "/ldm/code/deviceType",
      deviceDetail = "/ldm/device/detail",
      deviceOperation = "ldm/deviceOperation",
      location = "ldm/location",
      deviceConfigs = "/ldm/deviceConfigs",
      readIPFile = "/ldm/readFile",
      deviceSendRecords = "/ldm/deviceSendRecords",
      deviceReiceiveRecord = "/ldm/deviceReceives",
      deviceBinding = "/ldm/device/binding",
      deviceSearch = "/ldm/deviceSearch",
      //device statistic
      deviceCount = "/ldm/statistic/device/count",
      onlineCount = "/ldm/statistic/online/count",
      operationCount = "/ldm/statistic/operation/count",
      blueBridgeThroughput = "/ldm/statistic/blueBridge/throughput",
      ipCollision = "/ldm/statistic/ip/collision",
      usageRate = "/ldm/statistic/usage",
      operationHistory = "/ldm/statistic/operation/history",
      batteryHistory = "/ldm/statistic/battery/history",
      connectedDevices = "/ldm/statistic/connectedDevices",
      blueBridgeConnectedGraph = "/ldm/statistic/connected/graph",
      blueBridgeConnectedGraphDetail = "/ldm/statistic/connected/graph/detail",
      batteryHistoryExport = "/ldm/tool/battery/history/export",
      operationHistoryExport = "/ldm/tool/operation/history/export",
      APConnectedGraph = "/ldm/statistic/ap/connected/graph",
      //设备消息推送管理
      notify = "/ldm/message",
      notifyRecord = "/ldm/message/records";
    var service = {
      getDevices: getDevices,
      getDevice: getDevice,
      postDevice: postDevice,
      putDevice: putDevice,
      getCodes: getCodes,
      // getCode: getCode,
      getBelongs: getBelongs,
      getDeviceType: getDeviceType,
      getDeviceOperation: getDeviceOperation,
      getDeviceDetail: getDeviceDetail,
      getDeviceResource: getDeviceResource,

      getDeviceConfigs: getDeviceConfigs,
      getDeviceConfigsResource: getDeviceConfigsResource,
      postDeviceConfigs: postDeviceConfigs,
      getDeviceConfig: getDeviceConfig,
      putDeviceConfig: putDeviceConfig,
      deleteDeviceConfig: deleteDeviceConfig,
      postIPFile: postIPFile,
      getDeviceSendRecords: getDeviceSendRecords,
      getDeviceReceiveRecords: getDeviceReceiveRecords,
      getDeviceSearch: getDeviceSearch,
      postDeviceSearch: postDeviceSearch,
      getLocation: getLocation,

      bindDevice: bindDevice,
      removeBind: removeBind,

      //statistic
      getDeviceCount: getDeviceCount,
      getOnlineCount: getOnlineCount,
      getOperationCount: getOperationCount,
      getBlueBridgeThroughtput: getBlueBridgeThroughtput,
      getIpCollision: getIpCollision,
      getUsageRate: getUsageRate,
      getOperationHistory: getOperationHistory,
      getBatteryHistory: getBatteryHistory,
      getConnectedDevices: getConnectedDevices,
      getBlueBridgeConnectedGraph: getBlueBridgeConnectedGraph,
      getBlueBridgeConnectedGraphDetail: getBlueBridgeConnectedGraphDetail,
      getBatteryHistoryExport: getBatteryHistoryExport,
      getOperationHistoryExport: getOperationHistoryExport,
      getAPConnectedGraph: getAPConnectedGraph,
      //消息推送管理
      postNotifyMessage: postNotifyMessage,
      getNotifyRecord: getNotifyRecord,
      getNotifyRecordDetail: getNotifyRecordDetail
    };

    return service;

    function getDevices(params) {
      return Restangular.all(device).getList(params);
    }

    function getDevice(id) {
      return Restangular.one(device, id).get();
    }

    function postDevice(data) {
      return Restangular.all(device).post(data);
    }

    function putDevice(data) {
      return Restangular.one(device, data.id).put(data);
    }

    function getDeviceResource() {
      return Restangular.all(device);
    }

    function getCodes() {
      return Restangular.all(code).getList();
    }

    function getBelongs() {
      return Restangular.all(belong).getList();
    }

    function getDeviceDetail() {
      return Restangular.all(deviceDetail);
    }

    function getDeviceType() {
      return Restangular.all(deviceType).getList();
    }

    function getDeviceOperation(params) {
      return Restangular.all(deviceOperation).getList(params);
    }

    function getLocation() {
      return Restangular.all(location);
    }

    function getDeviceConfigs(params) {
      return Restangular.all(deviceConfigs).getList(params);
    }

    function postDeviceConfigs(config) {
      return Restangular.all(deviceConfigs).post(config);
    }

    function getDeviceConfig(id) {
      return Restangular.one(deviceConfigs, id).get();
    }

    function getDeviceConfigsResource() {
      return Restangular.all(deviceConfigs);
    }

    function putDeviceConfig(id, config) {
      return Restangular.one(deviceConfigs, id).put(config);
    }

    function deleteDeviceConfig(id) {
      return Restangular.one(deviceConfigs, id).delete();
    }

    function postIPFile(params, data) {
      return Restangular.all(readIPFile)
        .withHttpConfig({ transformRequest: angular.identity })
        .customPOST(data, undefined, params, { "Content-Type": undefined });
    }

    function getDeviceSendRecords() {
      return Restangular.all(deviceSendRecords);
    }

    function getDeviceReceiveRecords(id) {
      return Restangular.one(deviceReiceiveRecord).get(id);
    }

    function getDeviceSearch(id) {
      return Restangular.one(deviceSearch).get(id);
    }

    function postDeviceSearch(config) {
      return Restangular.all(deviceSearch).post(config);
    }

    function bindDevice(bindInfo) {
      return Restangular.all(deviceBinding).post(bindInfo);
    }

    function removeBind(macAddress) {
      return Restangular.all(deviceBinding).customDELETE("", {
        mac: macAddress
      });
    }

    //statistic
    function getDeviceCount(deviceTypes) {
      return Restangular.all(deviceCount).getList(deviceTypes);
    }

    function getOnlineCount(deviceTypes) {
      return Restangular.all(onlineCount).getList(deviceTypes);
    }

    function getOperationCount(deviceTypes) {
      return Restangular.all(operationCount).getList(deviceTypes);
    }

    function getBlueBridgeThroughtput(params) {
      return Restangular.all(blueBridgeThroughput).getList(params);
    }

    function getUsageRate(params) {
      return Restangular.all(usageRate).getList(params);
    }

    function getIpCollision(params) {
      return Restangular.all(ipCollision).getList(params);
    }

    function getOperationHistory(params) {
      return Restangular.all(operationHistory).getList(params);
    }

    function getBatteryHistory(params) {
      return Restangular.all(batteryHistory).getList(params);
    }

    function getConnectedDevices(params) {
      return Restangular.all(connectedDevices).getList(params);
    }

    function getBlueBridgeConnectedGraph() {
      return Restangular.one(blueBridgeConnectedGraph).getList();
    }

    function getBlueBridgeConnectedGraphDetail(id) {
      return Restangular.all(blueBridgeConnectedGraphDetail).getList(id);
    }

    function getAPConnectedGraph() {
      return Restangular.one(APConnectedGraph).getList();
    }
    //设备管理平台工具
    function getBatteryHistoryExport(params) {
      return Restangular.all(batteryHistoryExport).customGET("", params);
    }

    function getOperationHistoryExport(params) {
      return Restangular.all(operationHistoryExport).customGET("", params);
    }
    //消息推送管理
    function postNotifyMessage(data) {
      return Restangular.all(notify).post(data);
    }

    function getNotifyRecord(params) {
      return Restangular.all(notifyRecord).getList(params);
    }

    function getNotifyRecordDetail(id) {
      return Restangular.one(notifyRecord,id).getList();
    }
  }
})();
