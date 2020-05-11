(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('autoScroll', autoScroll);

  /** @ngInject */
  function autoScroll() {
    var directive = {
      restrict: 'A',
      scope: {
        data: '=autoScroll'
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.$watch('data', function() {
        el.scrollTop(0);
      });
    }
  }

})();