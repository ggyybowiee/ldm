(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('radio', radio);

  /** @ngInject */
  function radio() {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        ngDisabled: '=',
        options: '=',
        layout: '@',
        name: '@',
        onChange: '&'

      },
      templateUrl: 'common/components/radio/radio.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.name = (scope.name) || attr.ngModel.split('.').pop();
      scope._options = _.map(scope.options, function (item) {
        return {
          value: (item.value != null) ? item.value : item.dicCode,
          label: item.dicName || item.dicCode || item.label || item.text
        };
      });
      var watcher = scope.$watch('ngModel', function (value) {
        if (value != null) {
          scope.onChange();
        }
      });

      scope.$on('$destroy', watcher);

      scope.handleClick = function (bindingItem, event) {

        event.originalEvent.stopPropagation();
        if (scope.lastValue == bindingItem) {
          delete scope.lastValue;
          scope.ngModel = null;
        } else {
          scope.lastValue = bindingItem;
          scope.ngModel = bindingItem.value;
        }
      };
    }
  }

})();
