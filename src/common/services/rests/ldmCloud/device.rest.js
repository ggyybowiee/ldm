(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("cloudDeviceInfoService", cloudDeviceInfoService);

  /** @ngInject */
  function cloudDeviceInfoService(Restangular) {
    var deviceTypes = "/ldmCloud/deviceTypes",
        code = "/ldmCloud/ldmCode";
    var service = {
      getDeviceTypes: getDeviceTypes,
      postDeviceType: postDeviceType,
      putDeviceType: putDeviceType,
      getLdmCode: getLdmCode
    };

    return service;

    function getDeviceTypes() {
      return Restangular.all(deviceTypes).getList();
    }

    function postDeviceType(data) {
      return Restangular.one(deviceTypes).customPOST(data);
    }

    function putDeviceType(data) {
      return Restangular.one(deviceTypes).customPUT(data);
    }

    function getLdmCode() {
      return Restangular.all(code).getList();
    }
  }
})();
