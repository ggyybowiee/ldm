(function() {
  'use strict';

  angular.module('lachesis-common').directive('switch', switchFunc);

  /** @ngInject */
  function switchFunc($timeout) {
    var directive = {
      scope: {
        ngModel: '=',
        on: '@',
        off: '@',
        disabled: '@',
        onChange: '&ngChange',
        icon: '@',
        onColor: '=',
        // TODO: 自定义off颜色
        offColor: '='
      },
      restrict: 'AE',
      replace: true,
      transclude: true,
      templateUrl: 'common/components/switch/switch.tpl.html',
      link: function(scope, element, attrs) {
        scope.handleClick = function() {
          if (!attrs.disabled) {
            scope.ngModel = !scope.ngModel;
            $timeout(scope.onChange, 200);
          }
        }
      }
    };

    return directive;
  }

})();
