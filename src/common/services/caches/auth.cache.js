(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('authService', authService);

  /** @ngInject */
  function authService($rootScope, Restangular, $http) {
    var token, role;
    var service = {
      setToken: setToken,
      getToken: getToken,
      clearToken: clearToken,
      setRole: setRole,
      getRole: getRole,
      clearRole: clearRole
    };

    return service;

    function setToken(t) {
      token = t;
      localStorage.setItem('token', angular.toJson(t));
      Restangular.setDefaultHeaders({Authorization: t.tokenContent});
      // $http.header();
    }

    function getToken() {
      return token || angular.fromJson(localStorage.getItem('token'));
    }

    function clearToken() {
      token = null;
      localStorage.removeItem('token');

      clearWards();
      Restangular.setDefaultHeaders({Authorization: null});
    }

    function clearWards() {
      localStorage.removeItem('wardName');
      localStorage.removeItem('wardCode');
    }

    function setRole(r) {
      role = r;
      localStorage.setItem('role', angular.toJson(r));
    }

    function getRole() {
      return role || angular.fromJson(localStorage.getItem('role'));
    }

    function clearRole() {
      role = null;
      localStorage.removeItem('role');
    }

  }
})();
