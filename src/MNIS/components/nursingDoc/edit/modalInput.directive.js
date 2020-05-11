(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('modalInput', modalInput);

  /** @ngInject */
  function modalInput(modalService, $timeout) {
    var directive = {
      restrict: 'E',
      scope: {
        tpls: '=',
        ngModel: '=',
        showModel: '='
      },
      templateUrl: 'MNIS/components/nursingDoc/edit/modalInput.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var instance = null;
      el.click(function() {
        if (instance || angular.element('.editing-line').length === 0) {
          return;
        }

        $timeout(function () {
          instance = modalService.open({
            size: 'lg',
            templateUrl: 'MNIS/components/nursingDoc/edit/modalInput.modal.html',
            ok: function() {
              var vm = this;
              scope.ngModel = vm.text;
  
              return true;
            },
            initFn: function () {
              var modal = this;
  
              $timeout(function () {
                angular.element('.auto-focus').focus();
              }, 100);
  
              modal.handleEnter = function (e) {
                if (e.keyCode === 13) {
                  modal.ok();
                }
              };
            },
            methodsObj: {
              tpls: scope.tpls,
              choose: function(i) {
                var vm = this;
                vm.active = i;
                vm.text = vm.tpls[i];
              },
              text: scope.ngModel
            }
          });

          instance.closed.then(function () {
            instance = null;
          });
        });
      });
    }
  }

})();
