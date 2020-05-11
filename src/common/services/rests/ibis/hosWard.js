(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('hosWard', hosWard);

  /** @ngInject */
  function hosWard($http,Restangular) {
    var getWardsUrl = "/hospital/hosUserWard";
    var service = {
      getHosWard: getHosWardFuc
    };

    return service;
    
    function getHosWardFuc(userCode) {
      return Restangular.one(getWardsUrl,userCode).get();
    }
  }
})();