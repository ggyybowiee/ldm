(function() {
  'use strict';

  angular.module('lachesis-common').directive('colResizeable', colResizeable);

  function colResizeable($timeout) {
    return {
    restrict: 'A',
    link: function(scope, elem) {
      $timeout(function() {
        elem.colResizable({
          liveDrag: true,
          gripInnerHtml: "<div class='grip'></div>",
          draggingClass: "dragging",
          onDrag: function() {
            //trigger a resize event, so paren-witdh directive will be updated
            angular.element(window).trigger('resize');
          }
        });
      });
    }
  };
  }
})();
