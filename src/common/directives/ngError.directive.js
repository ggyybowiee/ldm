(function() {
  'use strict';

  angular.module('lachesis-common').directive('onImageError', ngOnerror);

  function ngOnerror() {
    return {
      restrict: "A",
      link: function(scope, element) {
        element.on("error", function() {
          element.hide();
        });
        element.on("load", function() {
          element.show();
        });
      }
    };
  }
})();
