(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('confirm', confirm);

  /** @ngInject */
  function confirm(modalService) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        yes: '&',
        content: '@',
        type: '@'
      },
      link: function (scope, elem) {
        elem.on('click', function (e) {
          e.stopPropagation();
          modalService.open({
            templateUrl: 'common/directives/confirm/confirm.tpl.html',
            size: 'sm',
            ok: function () {
              return scope.yes();
            },
            data: {
              metaData: {
                title: scope.content,
                type: scope.type || 'confirm'
              }
            }
          })
        })
      }
    };
  }
})();
