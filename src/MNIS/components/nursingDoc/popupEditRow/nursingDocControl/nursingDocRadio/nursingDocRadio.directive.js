(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('nursingDocRadio', nursingDocRadio);

  /** @ngInject */
  function nursingDocRadio(_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        options: '=',
        layout: '@',
        name: '@',
        onChange: '&',
        onFocus: '&',
        needOtherValue: '='
      },
      templateUrl: 'MNIS/components/nursingDoc/popupEditRow/nursingDocControl/nursingDocRadio/nursingDocRadio.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {

      scope.lastValue = scope.ngModel;
      scope.otherValue = undefined;

      var ngModelWatcher = scope.$watch('ngModel', function (value) {
        if (value) {

          scope.onChange();

          var selectedValue = _.find(scope.options, function (item) {
            return item === value;
          })
          if (selectedValue == undefined)
            scope.otherValue = value;
        }
      });
      scope.$on('$destroy', ngModelWatcher);


      var otherValueWatcher = scope.$watch('otherValue', function (value) {

        if (value) {
          delete scope.lastValue;
          scope.ngModel = value;
        }
      });
      scope.$on('$destroy', otherValueWatcher);

      scope.itemFocus = function (event) {
        scope.onFocus();
      }

      scope.handleClick = function (bindingItem, event) {

        event.originalEvent.stopPropagation();
        if (scope.lastValue == bindingItem) {
          delete scope.lastValue;
          scope.ngModel = null;
        } else {
          scope.lastValue = bindingItem;
          scope.ngModel = bindingItem;
          scope.otherValue = undefined;
        }
      };
    }
  }

})();
