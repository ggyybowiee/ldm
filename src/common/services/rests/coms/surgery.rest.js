(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('surgeryService', surgeryService);

  /** @ngInject */
  function surgeryService(Restangular) {
    var surgery = '/coms/surgeries',
        theater = '/coms/surgeryTheaters',
        analysis = '/coms/surgeryStatistics',
        events = '/coms/surgeries/allSurgeryEvents',
        transfusion = '/coms/bloodTransfusionCheckInfos';
    var service = {
      getSurgeries: getSurgeries,
      getSurgery: getSurgery,
      getTheaters: getTheaters,
      getRooms: getRooms,
      getInstruments: getInstruments,
      getAnalysis: getAnalysis,
      getInstrumentsEvents: getInstrumentsEvents,
      getAllEvents: getAllEvents,
      getTransfusions: getTransfusions
    };

    return service;

    function getSurgeries(params) {
      return Restangular.all(surgery).getList(params);
    }

    function getSurgery(id) {
      return Restangular.one(surgery, id).get();
    }

    function getTheaters() {
      return Restangular.all(theater).getList();
    }

    function getRooms(theaterCode) {
      return Restangular.one(theater, theaterCode).all('surgeryRooms').getList();
    }

    function getInstruments(surgeryCode) {
      return Restangular.one(surgery, surgeryCode).all('instruments').getList();
    }

    function getAnalysis(params) {
      return Restangular.one(analysis).get(params);
    }

    function getInstrumentsEvents() {
      return [
        'beforeSugery_instrumentCheck',
        'inSurgery_instrumentCheck',
        'beforeClose_instrumentCheck',
        'afterClose_instrumentCheck',
        'afterSurgery_instrumentCheck'
      ];
    }

    function getAllEvents() {
      return Restangular.all(events).getList();
    }

    function getTransfusions() {
      return Restangular.all(transfusion);
    }
  }
})();
