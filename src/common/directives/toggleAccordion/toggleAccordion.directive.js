(function() {
  'use strict';

  angular.module('lachesis-common').directive('toggleAccordion', toggleAccordion);

  function toggleAccordion($compile, $timeout) {
    return {
      restrict: 'A',
      scope: {
        toggleAccordion: '@',
        initState: '@',
        open: '=',
        triggerCallback: '&'
      },
      link: function(scope, elem, attrs) {
        var direction = scope.toggleAccordion || 'left';
        scope.classNames = {
          inner: Object.keys(attrs).indexOf('inner') >= 0,
          up: scope.toggleAccordion === 'up',
          left: scope.toggleAccordion === 'left'
        };
        // scope.inner = Object.keys(attrs).indexOf('inner') >= 0;
        elem.css({ position: 'relative' });
        elem.addClass(direction);
        scope.open = true;

        scope.toggle = function () {
          elem.toggleClass('accordion-hide');
          scope.open = !scope.open;

          if (scope.triggerCallback) {
            $timeout(scope.triggerCallback);
          }
        };

        scope.oppositDirection = {
          left: 'right',
          up: 'down',
          right: 'left',
          down: 'up'
        };

        if (scope.initState === 'hide') {
          scope.toggle();
        }

        $(elem[0]).wrapInner('<div class="accordion-inner"></div>');

        if (elem.find('.accordion-trigger').length === 0) {
          elem.append($compile('<div ng-click="toggle()" class="accordion-trigger" ng-class="classNames"><i class="fa fa-angle-{{open ? toggleAccordion : oppositDirection[toggleAccordion]}}"></i></div>')(scope));
        }
      }
    };
  }
})();
