(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('fileBind', fileBind);

  /** @ngInject */
  function fileBind($document) {
    var i = 0;
    var directive = {
      restrict: 'A',
      scope: {
        fileBind: '='
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      var input = angular.element('<input type="file" class="sr-only" id="file' + i++ + '"">');
      angular.element($document.body).append(input);
      el.click(function() {
        input.click();
      });
      input.on('change', function(e) {
        scope.fileBind = e.target.files[0];
      })
    }
  }

})();