(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('numberPicker', numberPicker);

  /** @ngInject */
  function numberPicker($timeout) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=ngModel',
        max: '=',
        min: '=',
        onChange: '&ngChange'
      },
      templateUrl: 'common/components/numberPicker/numberPicker.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope) {
      scope.ngModel = scope.ngModel || 0;
      scope.minus = minus;
      scope.plus = plus;
      scope.handleChange = handleChange;
      function minus() {
        if (typeof scope.max !== 'undefined' && scope.ngModel <= scope.min) {
          return;
        }
        scope.ngModel--;
        $timeout(function () {
          scope.onChange();
        }, 200);
      }

      function plus() {
        if (typeof scope.max !== 'undefined' && scope.ngModel >= scope.max) {
          return;
        }
        scope.ngModel++;
        $timeout(function () {
          scope.onChange();
        }, 200);
      }

      function handleChange(event) {
        if (event.value < scope.min && event.value > scope.max) {
          return;
        }
        $timeout(function () {
          scope.onChange();
        }, 200);
      }
    }
  }

})();
