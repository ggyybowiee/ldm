/**
 * Created by gary on 2017/5/25.
 */
(function () {
  'use strict';

  angular.module('lachesis-common').directive('imageonload', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('load', function () {
          //call the function that was passed 
          scope.$apply(attrs.imageonload);
        });
      }
    };
  })
})();
