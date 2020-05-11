(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('hoverToggle', hoverToggle);

  /** @ngInject */
  function hoverToggle($timeout) {
    var directive = {
      restrict: 'A',
      link: function(scope, element) {
        var width = element.width();
        // var height = element.height();
        var _element = $(element[0]);
        element.addClass('hover-init');
        $timeout(function () {
          var top = element.offset().top;
          element.height(window.innerHeight - top);
          // _element.wrapInner('<div class="hover-inner" style="top: ' + top + 'px;"></div>');
        }, 1000);

        element.hover(function () {
          element.addClass('hover-show');
          _element.animate({
            width: width
          }, 100, function () {
            element.removeClass('hover-mask');
          });
        }, function () {
          element.find('select').blur();
          element.removeClass('hover-show');
          element.addClass('hover-mask');
          _element.animate({
            width: 30
          }, 100, function () {
            element.addClass('hover-mask');
          });
        });
      }
    };

    return directive;
  }

})();
