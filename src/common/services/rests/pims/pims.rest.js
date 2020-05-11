(function() {
  'use strict';

  angular.module('lachesis-common').factory('pimsRest', pimsRest);

  /** @ngInject */
  function pimsRest(Restangular, moment, _) {
    var device = '/pims/eqpInfos';
    var ldm = '/ldm/device';
    var inout = '/pims/eqpPatInOutDepts';
    var eqpPats = '/pims/eqpPats';
    var impPatients = '/pims/importantPatients';
    // var timeZone = '/pims/wardRfidTimes';
    var timeZone = '/pims/pimsRfidTime';

    var service = {
      getDevices: getDevices,
      getInouts: getInouts,
      getPatientsInouts: getPatientsInouts,
      createDevice: createDevice,
      saveDevice: saveDevice,
      getTimeZone: getTimeZone,
      createTimeZone: createTimeZone,
      setImp: setImp,
      unsetImp: unsetImp,
      bind: bind,
      unbind: unbind,
      getTimezoneResource: getTimezoneResource,
      inoutDic: ['进病区', '出病区']
    };

    return service;

    function getDevices(params) {
      return Restangular.all(device).getList(params);
    }

    function getInouts(params) {
      return Restangular.all(inout).getList(params);
    }

    function getPatientsInouts(id) {
      return Restangular.one(inout, id).get();
    }

    function createDevice(data) {
      var result = Restangular.one(ldm, undefined, true);
      return _.assign(result, data);
    }

    function bind(data) {
      var result = Restangular.one(eqpPats, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return _.assign(result, data);
    }

    function unbind(id) {
      return Restangular.one(eqpPats, id).remove();
    }

    function saveDevice(data) {
      var method = data.fromServer ? 'customPUT': 'customPOST';
      return Restangular.all(ldm)[method](_.pick(data, 'eqpName', 'eqpSn', 'eqpMac', 'eqpMfrs', 'eqpNotes', 'seqId'));
    }

    function getTimeZone(id) {
      return Restangular.one(timeZone).get(id);
    }

    function getTimezoneResource() {
      return Restangular.all(timeZone);
    }

    function createTimeZone(data) {
      var result = Restangular.one(timeZone, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return _.assign(result, data);
    }

    function setImp(id) {
      var result = Restangular.one(impPatients, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      result.patCode = id;
      return result.save();
    }

    function unsetImp(id) {
      return Restangular.one(impPatients, id).remove();
    }
  }
})();


