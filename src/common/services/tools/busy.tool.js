(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('busyService', busyService);

  /** @ngInject */
  function busyService() {
    var service = {
      busy: busy
    };

    return service;

    function busy(func, context, field) {
      field = field || 'busy';
      return function() {
        context[field] = true;
        func().finally(function() {
          context[field] = false;
        });
      }
    }
  }
})();