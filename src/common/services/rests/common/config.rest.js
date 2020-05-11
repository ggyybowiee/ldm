(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('configRest', configRest);

  /** @ngInject */
  function configRest(Restangular) {
    var configItem = '/sys/sysConfig';
    var service = {
      getConfigItem: getConfigItem,
      updateConfigItem: updateConfigItem,
      addConfigItem: addConfigItem,
      deleteConfigItem: deleteConfigItem,
      refreshCache: refreshCache
    };

    return service;

    function refreshCache() {
      return Restangular.one(configItem + '/cache').customPOST();
    }

    function getConfigItem() {
      return Restangular.all(configItem).customGET();
    }

    function updateConfigItem(configItemObj) {
      return Restangular.one(configItem).customPUT(configItemObj);
    }

    function addConfigItem(configItemObj) {
      return Restangular.one(configItem).customPOST(configItemObj);
    }

    function deleteConfigItem(seqId) {
      return Restangular.one(configItem + '/' + seqId).customDELETE();

    }
  }
})();
