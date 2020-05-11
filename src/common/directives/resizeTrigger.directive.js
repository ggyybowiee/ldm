(function() {
  "use strict";

  angular.module("lachesis-common").directive("resizeTrigger", resizeTrigger);

  function resizeTrigger($window,$watch) {
    return {
      restrict: "A",
      scope:{
        size:'&'
      },
      link: function(scope, element, attrs, ngModel) {
        //   ngModel.$parsers.push(function(val) {
        //     return val !== null
        //       ? parseInt(val, 10)
        //       : null;
        //   });
        //   ngModel.$formatters.push(function(val) {
        //     return val !== null
        //       ? '' + val
        //       : null;
        //   });
        // }
        scope.size = {};
        var w = angular.element($window);
        scope.$watch(w.width(),function(newValue, oldValue){
          scope.size.height = element.height();
          scope.size.width = element.width();
        });
      }
    };
  }
})();
