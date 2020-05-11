(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('fullScreen', fullScreen);

  /** @ngInject */
  function fullScreen() {
    var directive = {
      restrict: 'A',
      replace: true,
      scope: {},
      templateUrl: 'common/components/fullScreen/fullScreen.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var elem = angular.element('#' + attr.fullScreen);
      el.click(function() {
        scope.expand = !scope.expand;
        scope.$digest();
        elem.toggleClass('full-screen');
      });
    }
  }

})();