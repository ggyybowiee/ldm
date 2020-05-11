(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('dicService', dicService);

  /** @ngInject */
  function dicService(Restangular) {
    var dic = '/sys/sysDics';
    var dicItem = '/sys/sysDic';
    var service = {
      getDic: getDic,
      getDicOf: getDicOf,
      getDicItem: getDicItem,
      updateDicItem: updateDicItem,
      addDicItem: addDicItem,
      deleteDicItem: deleteDicItem,
      refreshCache: refreshCache
    };

    return service;

    function getDic() {
      return Restangular.one(dic).get();
    }

    function getDicOf(type) {
      return Restangular.one('/sys/sysDic/' + type).get();
    }

    function refreshCache() {
      return Restangular.one(dicItem + '/cache').customPOST();
    }

    function getDicItem() {
      return Restangular.all(dicItem).customGET();
    }

    function updateDicItem(dicItemObj) {
      return Restangular.one(dicItem).customPUT(dicItemObj);
    }

    function addDicItem(dicItemObj) {
      return Restangular.one(dicItem).customPOST(dicItemObj);
    }

    function deleteDicItem(seqId) {
      return Restangular.one(dicItem + '/' + seqId).customDELETE();

    }
  }
})();
