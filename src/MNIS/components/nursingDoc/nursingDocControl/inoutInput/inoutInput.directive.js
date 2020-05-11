(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('inoutInput', inoutInput);

  /** @ngInject */
  function inoutInput() {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        inputClass: '@',
        ngAvalibleKeydown: '=',
        ngAvalibleFocus: '='
      },
      templateUrl: 'MNIS/components/nursingDoc/nursingDocControl/inoutInput/inoutInput.tpl.html',
      replace: true,
      link: function (scope) {

        var reg = /[0-9]*[.]?[0-9]+$/g;

        var result = "";

        if (scope.ngModel) {
          if (reg.test(scope.ngModel)) {
            result = scope.ngModel.match(reg);
            scope.amount = result[0];
            scope.character = scope.ngModel.replace(scope.amount, "");
          }
          else {
            scope.amount = "";
            scope.character = scope.ngModel;
          }
        } else {
          scope.character = "";
          scope.amount = "";
        }


        scope.keyDown = function (event) {
          scope.ngAvalibleKeydown && scope.ngAvalibleKeydown(event);
        }

        scope.itemFocus = function (event) {
          scope.ngAvalibleFocus && scope.ngAvalibleFocus(event);
        }

        scope.characterChange = function (event) {
          refreshNgModel();
        }

        scope.amountChange = function (event) {
          var data = scope.amount;
          var reg = /^[-]?[0-9]*[.]?[0-9]*/g;

          if (reg.test(data)) {
            var result = data.match(reg);
            if (!data || data != "")
              scope.amount = result[0];
          } else {
            scope.amount = "";
          }

          refreshNgModel();
        }

        function refreshNgModel() {
          scope.ngModel = (scope.character + scope.amount) || "";
        }
      }
    };

    return directive;


  }

})();
