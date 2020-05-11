(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('commonPrintBtn', commonPrint);

  /** @ngInject */
  function commonPrint($timeout, modalService, _) {
    var directive = {
      restrict: 'A',
      scope: false,
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      el.click(function() {
        $timeout(function() {
          modalService.open({
            size: 'sm',
            templateUrl: 'common/directives/print/printTip.modal.html',
            ok: function() {
              var cb = _.get(scope, attr.commonPrintBtn);
              if(_.isFunction(cb)) cb();

              return true;
            }
          });
        }, 1000);
      });
    }
  }

})();
