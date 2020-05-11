(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('loading', loadingFunc);

  /** @ngInject */
  /**
   * [loadingFunc 全局加载动画]
   * @return {[object]} [指令对象]
   */
  function loadingFunc() {
    return {
      restrict: 'E',
      template: '<div class="loading-wrapper"> <div class="spinner"> <div class="spinner-container container1"> <div class="circle1"></div> <div class="circle2"></div> <div class="circle3"></div> <div class="circle4"></div> </div> <div class="spinner-container container2"> <div class="circle1"></div> <div class="circle2"></div> <div class="circle3"></div> <div class="circle4"></div> </div> <div class="spinner-container container3"> <div class="circle1"></div> <div class="circle2"></div> <div class="circle3"></div> <div class="circle4"></div> </div> </div> </div> ',
      link: loadingLinkFunc,
      scope: true,
      replace: true
    };

    function loadingLinkFunc(scope, elem, attrs) {
      scope.$on('loading', function(e, type) {
        if (type === attrs.type) elem.show();
      });
      scope.$on('loaded', function(e, type) {
        if (type === attrs.type) {
          elem.hide();
          elem[0].setAttribute('style', 'display: none');
        }
      });
    }
  }
})();
