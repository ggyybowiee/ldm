(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('loadingWrapper', loadingFunc);

  /** @ngInject */
  /**
   * [loadingFunc 全局加载动画]
   * @return {[object]} [指令对象]
   */
  function loadingFunc($timeout) {
    return {
      restrict: 'A',
      template: '<div ng-transclude></div><loading type="{{type}}"></loading>',
      scope: {
        type: '@loadingType',
        options: '=loadingOptions',
        tmpOptions: '=loadingWrapper'
      },
      link: loadingLinkFunc,
      transclude: true
    };

    function loadingLinkFunc(scope, elem) {
      scope.type = scope.type || 'content';
      var options = scope.options || scope.tmpOptions;
      var rawFunc = options.func;

      if (!elem.css('position') || elem.css('position') === 'static') {
        elem.css('position', 'relative');
      }
      options.func = function() {
        var args = Array.prototype.slice.call(arguments);
        var _pro;
        // $timeout(function() {
          scope.$broadcast('loading', scope.type);
        // });
        try {
          _pro = rawFunc.apply(null, args);
          if (!angular.isFunction(_pro.then)) {
            return;
          }
          return _pro.then(function() {
            $timeout(function() {
              scope.$broadcast('loaded', scope.type);
            });
          }).catch(function (err) {
            console.log(err);
            scope.$broadcast('loaded', scope.type);
          });
        } catch (err) {
          console.log(err);
        }
      }

      if (options.init) {
        options.func(options.params);
      }
    }
  }
})();
