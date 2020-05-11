/**
 * Created by gary on 2017/5/25.
 */
(function() {
  'use strict';

  angular.module('lachesis-common').directive('isFullScreen', isFullScreen);

  function isFullScreen($timeout) {
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        $timeout(function () {
          angular.element(attrs.isFullScreen).addClass('hide');
          angular.element('.container').addClass('full')
        }, 100);
      }
    };
  }
})();
