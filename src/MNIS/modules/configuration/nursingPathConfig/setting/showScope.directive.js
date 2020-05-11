(function () {
  'use strict';
  angular
    .module('lachesis-mnis')
    .directive('showScope', showScope);

  /** @ngInject */
  function showScope(_) {
    var directive = {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.css({
          'width': attrs.width - 16 * scope.node.tier + 'px'
        });
      }
    };

    return directive;
  }

})();
