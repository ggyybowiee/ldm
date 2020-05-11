(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('fullPage', fullPage);

  /** @ngInject */
  function fullPage($timeout) {
    var directive = {
      restrict: 'A',
      scope: false,
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var paddingBottom = 0,
        ref, height;
      var finishedFunc;

      if (attr.fullPageFinish) {
        finishedFunc = scope.$parent.vm[attr.fullPageFinish];
        finishedFunc();
      }

      $timeout(function () {
        if (el.is(':hidden')) {
          ref = angular.element(attr.fullPage);
        } else {
          ref = el;
        }
        height = window.innerHeight - ref.offset().top - paddingBottom;


        if (attr.fullPageBottom) {
          height -= attr.fullPageBottom;
        }

        if (attr.fullPage === 'reverse') {
          el.css({
            'max-height': height,
            'overflow-y': 'auto'
          });
        } else if (attr.fullPage === 'fix') {
          el.css({
            'height': height,
            'overflow-y': 'auto'
          });
        } else if (attr.fullPage === 'overflowHidden') {
          el.css({
            'height': height,
            'overflow': 'hidden'
          });
        } else {
          el.css({
            'min-height': height
          });
        }
      });
    }
  }

})();
