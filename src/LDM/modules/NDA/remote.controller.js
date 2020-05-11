(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('NDARemoteController', NDARemoteController);

  /** @ngInject */
  function NDARemoteController(ldmSessionCache) {
    var vm = this, wardHelper = ldmSessionCache.getWardHelper();

    

    activate();

    function activate() {
      vm.wardHelper = wardHelper;
    }
  }
})();