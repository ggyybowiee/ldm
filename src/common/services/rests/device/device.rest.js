(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('deviceService', deviceService);

  /** @ngInject */
  function deviceService(Restangular, moment, _) {
    var device = '/devices';
    var bind = '/devicePatientMappings';
    var service = {
      getDevices: getDevices,
      createDevice: createDevice,
      createBind: createBind,
      gatherLastData: _.noop,
      gatherData: _.noop,
      getCopyDataByPatID: _.noop,
      copy: _.noop,
      deleteData: _.noop
    };

    return service;

    function getDevices(params) {
      return Restangular.all(device).getList(params);
    }

    function createDevice(data) {
      var result = Restangular.one(device, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return _.assign(result, data);
    }

    function createBind(data) {
      var result = Restangular.one(bind, undefined, true);
      result.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      result.createPerson = 'test';
      result.updatePerson = 'test';
      return _.assign(result, data);
    }

  }
})();