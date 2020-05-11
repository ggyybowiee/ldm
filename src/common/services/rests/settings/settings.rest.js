(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('settingsRest', settingsRest);

  /** @ngInject */
  function settingsRest(Restangular) {
    var avatar = '/ibis/ibisUserImage';
    var service = {
      getAvatar: getAvatar,
      createAvatar: createAvatar,
      updateAvatar: updateAvatar
    };

    return service;

    function getAvatar(userCode) {
      return Restangular.one(avatar, userCode).get();
    }

    function createAvatar(data) {
      return Restangular.all(avatar).customPOST(data);
    }

    function updateAvatar(data) {
      return Restangular.all(avatar).customPUT(data);
    }
  }
})();
