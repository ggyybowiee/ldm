(function() {
  "use strict";

  angular.module("lachesis-mnis").directive("orderPrint", orderPrint);
  /** @ngInject */
  function orderPrint(lodopTool) {
    var directive = {
      link: linkFunc,
      scope: {
        cb: '&'
      }
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var lodop;
      if (window.CLODOP) {
        lodop = getCLodop();
        lodop.PRINT_INIT();
        el.click(function() {
          var container = angular.element(attr.orderPrint);
          lodop.SET_PRINT_PAGESIZE(1, 0, 0, "A4");
          lodop.ADD_PRINT_HTML(
            0,
            0,
            "100%",
            "100%",
            lodopTool.getTableStyle() +
              lodopTool.getCommonStyle() +
              container.html()
          );
          lodop.On_Return = function(taskId, value) {
            if(+value) {
              scope.cb();
            }
          }
          lodop.PREVIEW();
        });
      }
    }
  }
})();
