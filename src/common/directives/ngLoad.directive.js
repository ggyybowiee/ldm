(function() {
  'use strict';

  angular.module('lachesis-common').directive('ngOnload', ngOnload);

  function ngOnload() {
    return {
      restrict: "A",
      scope: {
        callback: "&ngOnload"
      },
      link: function(scope, element) {
        element.on("load", function(event) {
          scope.callback({event: event});
        });
      }
    };
  }
})();
