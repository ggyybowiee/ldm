(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('datePicker', datePicker);

  /** @ngInject */
  function datePicker() {
    var directive = {
      restrict: 'E',
      scope: {
        model: '=ngModel',
        onChange: '&ngChange',
        max: '=',
        min: '=',
        options: '=',
        dateOptions: '=',
        disabled: '@',
        open: '@',
        noIcon: '='
      },
      templateUrl: 'common/components/datePicker/datePicker.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.disabled = scope.disabled || 'false';
      scope.width = attr.width || '150px';
      setTimeout(function () {
        scope.open = scope.open || 'true';
      });
      scope.name = (scope.options && scope.options.name) || attr.ngModel.split('.').pop();
      var watcher = scope.$watch('model', function (value) {
        if (value) {
          scope.onChange();
        }
      });
      scope.$on('$destroy', watcher);
    }
  }

})();
