(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('patientEventRest', patientEventRest);

  /** @ngInject */
  function patientEventRest(Restangular) {

    var patientEventUrl = '/mnis/patEventRecord';

    var service = {
      getPatientEvent: getPatientEvent,
      addPatientEvent: addPatientEvent,
      addPatientEvents: addPatientEvents,
      updatePatientEvent: updatePatientEvent,
      deletePatientEvent: deletePatientEvent
    };

    return service;

    function getPatientEvent(params) {
      return Restangular.all(patientEventUrl).customGET('', params);
    }

    function addPatientEvent(patientEvent) {
      return Restangular.all(patientEventUrl).customPOST(patientEvent);
    }

    function addPatientEvents(patientEventList) {
      return Restangular.all(patientEventUrl + 's').customPOST(patientEventList);
    }

    function updatePatientEvent(patientEvent) {
      return Restangular.all(patientEventUrl).customPUT(patientEvent);
    }

    function deletePatientEvent(eventId) {
      return Restangular.all(patientEventUrl + '/' + eventId).customDELETE();
    }

  }
})();
