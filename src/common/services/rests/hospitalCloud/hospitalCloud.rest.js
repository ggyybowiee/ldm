(function() {
  "use strict";

  angular
    .module("lachesis-common")
    .factory("hosCloudService", hosCloudService);

  /** @ngInject */
  function hosCloudService(Restangular) {

    var service = {
      getHospitals: getHospitals,
      getHospitalsWithWards: getHospitalsWithWards,
      getHospitalResource: function () {
        return Restangular.all('/hosCloud/hosInfo');
      }
    };

    return service;

    function getHospitals(params) {
      return Restangular.all('/hosCloud/hosInfo').customGET('', params);
    }

    function getHospitalsWithWards(params) {
      return Restangular.all('/hosCloud/hosInfoCustom').customGET('', params);
    }
  }
})();
