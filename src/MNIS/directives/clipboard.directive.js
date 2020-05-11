/**
 * Created by gary on 2018/8/22.
 */
(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('clipboard', clipboard);

  /** @ngInject */
  function clipboard() {
    var directive = {
      restrict: 'EA',
      link: linkFunc,
      scope: { 
        clipboard: '@'
      }
    };

    return directive;

    function linkFunc(scope, elem) {
      elem.attr('data-clipboard-text', scope.clipboard);
      new ClipboardJS(elem[0]);
    }
  }

})();
