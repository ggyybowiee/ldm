(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('estimateRadio', estimateRadio);

  /** @ngInject */
  function estimateRadio(_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        options: '=',
        layout: '@',
        name: '@',
        onChange: '&'
      },
      templateUrl: 'MNIS/components/estimateDoc/estimateDocControl/estimateRadio/estimateRadio.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {

      scope.lastValue = scope.ngModel;

      var watcher = scope.$watch('ngModel', function (value) {
        scope.onChange();
      });

      scope.$on('$destroy', watcher);
      scope.handleClick = function (bindingItem, event) {
        event.originalEvent.stopPropagation();
        if (scope.lastValue != undefined && scope.lastValue.id == bindingItem.id) {
          delete scope.lastValue;
          scope.ngModel = null;
        } else {
          scope.lastValue = bindingItem;
          scope.ngModel = bindingItem;
        }
      };
    }
  }

})();
