(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('HomeController', HomeController);

  /** @ngInject */
  function HomeController($state) {
    // var vm = this;

    activate();

    function activate() {
      // $state.go('main.deviceMonitoring');
    }
  }
})();
