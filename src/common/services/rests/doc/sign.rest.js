(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('signService', signService);

  /** @ngInject */
  function signService(Restangular, authService) {
    var sign = '/doc/userSignData';
    var service = {
      createSign: createSign,
      getImgUrl: getImgUrl,
      removeSign: removeSign
    };

    return service;

    function createSign(tplId, key) {
      var result = Restangular.one(sign, undefined, true);
      result.userCode = authService.getToken().userCode;
      result.tplId = tplId;
      result.key = key;
      return result;
    }

    function getImgUrl() {
      return '/windranger/hospital/userDataSign/' + authService.getToken().userCode;
    }

    function removeSign(id) {
      return Restangular.allUrl(sign + '/' + id).customDELETE();
    }
  }
})();