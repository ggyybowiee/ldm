(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('inout', inout);

  /** @ngInject */
  function inout(modalService, _) {
    var directive = {
      restrict: 'E',
      scope: {
        tpls: '=',
        ngModel: '='
      },
      templateUrl: 'MNIS/components/nursingDoc/edit/inoutInput.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var instance = null;
      el.click(function() {
        if (instance) {
          return;
        }

        instance = modalService.open({
          size: 'md',
          templateUrl: 'MNIS/components/nursingDoc/edit/inoutInput.modal.html',
          ok: function() {
            var vm = this;
            scope.ngModel = vm.formData;

            return true;
          },
          methodsObj: {
            formData: _.assign({}, scope.ngModel, {
              totalIn: +scope.ngModel.totalIn,
              totalOut: +scope.ngModel.totalOut
            })
          }
        });

        instance.closed.then(function () {
          instance = null;
        });
      });
    }
  }

})();
