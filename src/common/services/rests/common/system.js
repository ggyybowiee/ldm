(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('sysService', sysService);

  /** @ngInject */
  function sysService(Restangular) {
    var appVersion = '/sys/sysAppVersions';
    var serverTime = '/sys/sysServerTime';
    var service = {
      getAppVersions: getAppVersions,
      getServerTime: getServerTime
    };

    return service;

    function getAppVersions() {
      return Restangular.all(appVersion).customGET();
    }

    function getServerTime() {
      return Restangular.all(serverTime).customGET();
    }
  }
})();
