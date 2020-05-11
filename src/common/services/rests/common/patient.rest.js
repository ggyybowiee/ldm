(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('patientService', patientService);

  /** @ngInject */
  function patientService(Restangular) {
    var mockRestangular = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('mock');
    });
    var patient = 'patients';
    var inout = 'inoutRecords';
    var service = {
      getPatients: getPatients,
      getPatInOutRecords: getPatInOutRecords
    };

    return service;

    function getPatients(params) {
      return mockRestangular.all(patient).getList(params);
    }

    function getPatInOutRecords(id, params) {
      return mockRestangular.one(patient, id).all(inout).getList(params);
    }
  }
})();
