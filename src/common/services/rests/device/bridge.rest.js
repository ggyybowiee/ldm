(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('bridgeService', bridgeService);

  /** @ngInject */
  function bridgeService(Restangular) {
    var mockRestangular = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('mock');
    });
    var service = {
      getBlueList: getBlueList
    };

    return service;

    function getBlueList() {
      return mockRestangular.all('/bridge');
    }
  }
})();
