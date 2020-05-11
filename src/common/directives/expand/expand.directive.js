(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('gridExpand', gridExpandFunc)
    .directive('gridExpandTable', gridExpandTableFunc)
    .directive('gridExpandTrigger', gridExpandTriggerFunc);

  /** @ngInject */
  function gridExpandFunc() {
    return {
      restrict: 'A',
      scope: {
        init: '&',
        data: '=',
        methods: '='
      },
      controller: function($scope, $element) {
        var vm = this;
        vm.getTdLen = function() {
          return $element.children('tr:first').children('td').length;
        };
        vm.getData = function() {
          return vm.data;
        };
        vm.toggle = function() {
          $element.children('tr[grid-expand-table]').toggle();
          $scope.$apply();
        };
        vm.getStatus = function() {
          return $element.children('tr[grid-expand-table]').is(':visible');
        };
      },
      controllerAs: 'vm',
      bindToController: true
    }
  }

  /** @ngInject */
  /**
   * 表格展开更多信息
   * @return {object}
   */
  function gridExpandTableFunc(_) {
    return {
      restrict: 'A',
      require: '^gridExpand',
      templateUrl: function(element, attrs) {
        return attrs.tplSrc || ''
      },
      link: function(scope, element, attrs, gridExpand) {
        scope.tdLen = gridExpand.getTdLen();
        scope.getStatus = gridExpand.getStatus;
        scope.getData = function() {
          if(scope.getStatus()) {
            return gridExpand.getData();
          }
        };
        _.assign(scope, gridExpand.methods);
      }
    }
  }

  /** @ngInject */
  /**
   * 展开表格开关
   * @return {object} 指令对象
   */
  function gridExpandTriggerFunc() {
    return {
      restrict: 'A',
      require: '^gridExpand',
      scope: false,
      template: '<i class="fa" ng-class="{false: \'fa-caret-right\', true: \'fa-caret-down\'}[getStatus()]">',
      link: function(scope, element, attrs, gridExpand) {
        element.unbind().bind('click', function() {
          gridExpand.toggle();
        });
        scope.getStatus = gridExpand.getStatus;
      }
    }
  }

})();
