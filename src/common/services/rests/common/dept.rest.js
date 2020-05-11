(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('deptRest', deptRest);

  /** @ngInject */
  function deptRest(Restangular) {
    var dept = '/hospital/hosUserDeptRef';
    var userWards = '/hospital/hosUserWard';
    var service = {
      getDepts: getDepts,
      getUserWards: getUserWards
    };

    return service;

    function getDepts(params) {
      return Restangular.all(dept).getList(params);
    }

    function getUserWards(userCode) {
      return Restangular.one(userWards, userCode).get();
    }
  }
})();
