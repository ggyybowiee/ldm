(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('intervalLoading', intervalLoading);

    function intervalLoading($interval) {
      var directive = {
        restrict: 'E',
        template: '<div class="interval-loading"></div>',
        replace: true,
        scope: {
          cb: '&',
          time: '@',
          hide: '='
        },
        link: function(scope, element) {
          var timeId = $interval(function() {
            scope.cb();
          }, parseInt(scope.time) * 1000);
          element.addClass('interval-bar-animation');
          element.css({
            'animation-duration': parseInt(scope.time) + 's'
          });
          if (scope.hide) {
            element.addClass('hide');
          }

          scope.$on('$destroy', function() {
            $interval.cancel(timeId);
          })
        }
      };

      return directive;
    }

})();
