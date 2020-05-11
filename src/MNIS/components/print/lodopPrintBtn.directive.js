(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('lodopPrintBtn', lodopPrintBtn);
  /** @ngInject */
  function lodopPrintBtn($window, lodopTool) {
    var directive = {
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      var lodop;
      if($window.CLODOP) {
        lodop = $window.getCLodop();
        lodop.PRINT_INIT();
        el.click(function() {
          var table = angular.element('#printWindow')[0].contentWindow.document.querySelector('table');
          lodop.SET_PRINT_PAGESIZE(1, 0, 0, "A4");
          lodop.ADD_PRINT_TABLE(0, 0, '100%', '100%', lodopTool.getTableStyle() + table.outerHTML);
          lodop.PREVIEW();
        });
      }
    }
  }
})();