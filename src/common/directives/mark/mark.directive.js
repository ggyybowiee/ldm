(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('mark', mark);

  /** @ngInject */
  function mark($timeout) {
    var directive = {
      restrict: 'A',
      scope: {
        markWatch: '=markWatch',
        keyword: '@mark'
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      scope.$watch('markWatch', function(value){
        if(value) {
          $timeout(function() {
            el.unmark({
              done: function() {
                el.mark(scope.keyword);
              }
            })
          })
        }
      });
    }
  }

})();