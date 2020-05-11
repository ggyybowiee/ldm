(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("cloudStatisticService", cloudStatisticService);

  /** @ngInject */
  function cloudStatisticService(Restangular) {
    var deviceCount = "/ldmCloud/statistic/device/count",
        nbFlow = "/ldmCloud/statistic/nbFlow",
        onlineCount = "/ldmCloud/statistic/online/count",
        operationCount = "/ldmCloud/statistic/operation/count",
        errorDeviceType = "/ldmCloud/errorStatistic/deviceType",
        errorFocusHos = "/ldmCloud/errorStatistic/focusHos",
        errorProcessType = "/ldmCloud/errorStatistic/processType",
        errorTopNHos = "/ldmCloud/errorStatistic/topNHos";
    var service = {
      getDeviceCount: getDeviceCount,
      getNbFlow: getNbFlow,
      getOnlineCount: getOnlineCount,
      getOperationCount: getOperationCount,
      getErrorDeviceType: getErrorDeviceType,
      getErrorFocusHos: getErrorFocusHos,
      getErrorProcessType: getErrorProcessType,
      getErrorTopNHos: getErrorTopNHos
    };

    return service;

    function getDeviceCount(params) {
      return Restangular.all(deviceCount).getList(params);
    }

    function getNbFlow() {
      return Restangular.all(nbFlow).getList();
    }

    function getOnlineCount(params) {
      return Restangular.all(onlineCount).getList(params);
    }

    function getOperationCount(params) {
      return Restangular.all(operationCount).getList(params);
    }

    function getErrorDeviceType() {
      return Restangular.all(errorDeviceType).getList();
    }

    function getErrorFocusHos(params) {
      return Restangular.all(errorFocusHos).getList(params);
    }

    function getErrorProcessType() {
      return Restangular.all(errorProcessType).getList();
    }

    function getErrorTopNHos(params) {
      return Restangular.all(errorTopNHos).getList(params);
    }
  }
})();
