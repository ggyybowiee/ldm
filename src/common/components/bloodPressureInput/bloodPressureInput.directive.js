(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('bloodPressureInput', bloodPressureInput);

  /** @ngInject */
  function bloodPressureInput(_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        name: '@',
        inputClass: '@',
        inputType: '@',
        outerIndex: '@',
        ngInputKeydown: "=",
        ngInputFocus: "="
      },
      templateUrl: 'common/components/bloodPressureInput/bloodPressureInput.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, attrs) {
      scope.type = scope.type || 'normal';
      scope.class = attrs.class;
      scope.style = attrs.style;
      var pattern = /^([3-9][0-9])|^([1-2][0-9]{2})/g;

      scope.bloodPressureValid = /^[0-9]+[/][0-9]+ *$/g.test(scope.ngModel);

      if (scope.ngModel == undefined) {
        scope.bloodPressureValid = true;
      }

      scope.handleChange = function () {
        if (pattern.test(scope.ngModel) && scope.ngModel.indexOf('/') === -1) {
          scope.ngModel += '/';
        }

        var len = _.get(scope.ngModel.match(/\//g), 'length') || 0;

        if (len > 1) {
          scope.ngModel = scope.ngModel.substring(0, scope.ngModel.length - 1);
        }

        scope.bloodPressureValid = /^[0-9]+[/][0-9]+ *$/g.test(scope.ngModel);
      }

      scope.getWarningClass = function () {

      }

      scope.onKeydown = function (event) {
        if (scope.ngInputKeydown) {
          if (scope.inputType == "fourHour" && scope.outerIndex != undefined) {
            scope.ngInputKeydown(event, Number(scope.outerIndex));
          } else {
            scope.ngInputKeydown(event);
          }
        }
      }

      scope.onFocus = function (event) {
        scope.ngInputFocus && scope.ngInputFocus(event);
      }
    }
  }

})();
