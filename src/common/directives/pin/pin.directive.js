(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('pin', pin);

  /** @ngInject */
  function pin() {
    var directive = {
      restrict: 'EA',
      scope: true,
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      el.pin({
        containerSelector: '.server-detail-wrapper',
        top: 100
      });
    }
  }

})();