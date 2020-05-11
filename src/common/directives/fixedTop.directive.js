(function() {
  'use strict';

  angular.module('lachesis-common').directive('fixedTop', fixedTop);

  function fixedTop($timeout) {
    return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var windowWidthNoScroll = window.outerWidth;

      $timeout(function () {
        var topElement = angular.element(attrs.top);
        var rightElement = angular.element(attrs.right);
        var leftElement = angular.element(attrs.left);
        var bottomElement = angular.element(attrs.bottom);
        var refraction = angular.element(attrs.refraction);
        var top = topElement.length === 0 ? attrs.top || 'initial' : topElement.height(),

        right = rightElement.length === 0 ? attrs.right || 'initial' : rightElement.width(),
        left = leftElement.length === 0 ? attrs.left || 'initial' : leftElement.width(),
        bottom = bottomElement.length === 0 ? attrs.left || 'initial' : bottomElement.height();

        var elementOffsetTop = refraction.length > 0 ? refraction.offset().top : elem.offset().top;
        var offsetTop = elementOffsetTop - top;
        var target = refraction.length === 0 ? elem : refraction;

        if (refraction.length > 0) {
          elem.hide();
          elem.width(refraction.width());
        }

        document.addEventListener('scroll', function (e) {
          var pageOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
          var windowWidthScroll = document.body.offsetWidth;

          if (pageOffset >= offsetTop) {
            if (refraction.length > 0) {
              elem.css({
                top: top,
                right: right - (windowWidthNoScroll - windowWidthScroll),
                left: left,
                bottom: bottom
              });
              elem.show();
              elem.addClass('fixedTop');
            } else {
              refraction.addClass('fixedTop');
            }
          } else {
            if (refraction.length > 0) {
              elem.removeClass('fixedTop');
              elem.hide();
            } else {
              refraction.removeClass('fixedTop');
            }
          }
        })
      }, 500);
    }
  };
  }
})();
