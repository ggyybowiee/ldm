(function() {
  'use strict';

  angular.module('lachesis-common').config(config);

  /** @ngInject */
  function config(RestangularProvider) {
    RestangularProvider.setBaseUrl('/windranger');
    RestangularProvider.addRequestInterceptor(function(element, operation) {
      if (operation === 'remove') {
        return null;
      }
      return element;
    });
  }

})();

(function() {
  'use strict';

  angular.module('lachesis-common').run(runBlock);

  /** @ngInject */
  function runBlock(Restangular, _) {
    var idMap = {
      roles: 'roleCode',
      resources: 'resourceCode',
      roleResourceMappings: 'seqId',
      userResourceMappings: 'seqId',
      users: 'userCode',
      wardRfidTimes: 'wardCode',
      attendTpls: 'tplId'
    };
    Restangular.configuration.getIdFromElem = function(elem) {
      var field,
        match = _.find(idMap, function(value, key) {
          return elem.route && elem.route.endsWith(key);
        });
      field = match || 'id';
      return elem[field];
    };

    Restangular.configuration.setIdToElem = function(elem, id, route) {
      var croute = elem.route || route;
      var field,
        match = _.find(idMap, function(value, key) {
          return croute.endsWith(key);
        });
      field = match || 'id';
      elem[field] = id;
      return this;
    };
  }

})();
