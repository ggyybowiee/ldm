(function() {
  'use strict';

  angular.module('lachesis-common').directive('pageSelect', pageSelect);

  function pageSelect() {
    return {
      restrict: 'E',
      template: '<input class="input-sm form-control" style="display: inline-block;width: 5em;margin: 0 5px;text-align:center" type="text" class="select-page" ng-model="inputPage" ng-change="selectPage(inputPage)">',
      link: function(scope) {
        scope.$watch('currentPage', function(c) {
          scope.inputPage = c;
          //配合分页，选择其它页时发出。
          scope.$emit('table-page-changed');
        });
      }
    };
  }
})();
