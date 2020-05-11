(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('customEcharts', customEcharts);

  /** @ngInject */
  function customEcharts($timeout, echarts) {
    var directive = {
      restrict: 'A',
      scope: {
        options: '=',
        scale: '@',
        width: '@',
        height: '@'
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      if(scope.width || scope.height) {
        el.height(scope.height);
        el.width(scope.width);
      }else {
        el.height(el.width() * scope.scale.split(':')[1] / scope.scale.split(':')[0]);
      }
      var chart = echarts.init(el[0]);
      scope.$watch('options', function(option) {
        if(option) {
          $timeout(function() {
            chart.setOption(option);
          });
        }
      }, true);
    }
  }

})();