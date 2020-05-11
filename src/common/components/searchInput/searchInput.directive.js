(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('searchInput', searchInput);

  /** @ngInject */
  function searchInput($timeout) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        search: '&',
        text: '@'
      },
      templateUrl: 'common/components/searchInput/searchInput.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      $timeout(function() {
        scope.required = attr.required;
      })
    }
  }

})();
