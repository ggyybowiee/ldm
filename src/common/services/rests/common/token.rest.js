(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('tokenService', tokenService);

  /** @ngInject */
  function tokenService(Restangular) {
    var token = '/authentication/tokens';
    var service = {
      getToken: getToken
    };

    return service;

    function getToken(params) {
      var data = Restangular.one(token);
      data.userCode = params.userCode;
      data.password = params.password;
      return data.save();
    }
  }
})();