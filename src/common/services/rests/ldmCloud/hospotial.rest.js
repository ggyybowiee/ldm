(function() {
    "use strict";

    angular
      .module("lachesis-common")
      .factory("cloudHospitalInfoService", cloudHospitalInfoService);

    /** @ngInject */
    function cloudHospitalInfoService(Restangular) {
      var hospitalInfo = "/ldmCloud/hospitals"
      var service = {
        getHospitailsInfo: getHospitailsInfo,
        postHospitailsInfo: postHospitailsInfo,
        patchHospitailsInfo: patchHospitailsInfo
      };

      return service;

      function getHospitailsInfo() {
        return Restangular.all(hospitalInfo).getList();
      }

      function postHospitailsInfo(data) {
        return Restangular.one(hospitalInfo).customPOST(data);
      }

      function patchHospitailsInfo(data) {
        return Restangular.one(hospitalInfo).customPATCH(data);
      }
    }
  })();
