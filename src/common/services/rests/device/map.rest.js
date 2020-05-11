(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('mapService', mapService);

  /** @ngInject */
  function mapService(Restangular, _) {
    var service = {
      getMaps: _.noop,
      saveMap: _.noop
    };

    return service;

  }
})();