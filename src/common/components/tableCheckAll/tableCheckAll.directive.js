(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('tableCheck', tableCheck)
    .directive('tableCheckAll', tableCheckAll)
    .directive('tableCheckAllItem', tableCheckAllItem);

  /** @ngInject */
  function tableCheckAll(_) {
    var directive = {
      restrict: 'A',
      require: '^?tableCheck',
      controllerAs: 'vm',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ctrl) {
      ctrl.scope.checkAllElement = el;

      ctrl.scope.$watch('selected', function (newValue, oldValue) {
        if (ctrl.scope.source) {
          el[0].checked = newValue && newValue.length === ctrl.scope.source.length;
        }
      }, true);

      ctrl.scope.$watch('source', function(value) {
        if (!value) {
          return;
        }

        el[0].checked = false;
        ctrl.scope.selected = [];
      }, true);

      el.bind('change', function(e) {
        var source = ctrl.scope.source;

        if (!angular.isArray(source)) {
          return;
        }

        if (e.target.checked) {
          var key = ctrl.scope.key;

          if (ctrl.scope.key) {
            ctrl.scope.selected = source.map(function (item) {
              return _.get(item, key);
            });
          } else {
            ctrl.scope.selected = source.slice();
          }
        } else {
          ctrl.scope.selected = [];
        }

        scope.$apply();
      });
    }
  }

  function tableCheck() {
    var directive = {
      restrict: 'A',
      scope: {
        source: '=tableCheck',
        selected: '=',
        key: '@'
      },
      controller: tableCheckAllController,
      controllerAs: 'vm',
      link: linkFunc
    };

    return directive;

    function tableCheckAllController ($scope) {
      var vm = this;
      vm.scope = $scope;
    }

    function linkFunc(scope, el, attr) {
      // scope.$watch('selected', function (value) {
      //   if (value && value.length !== scope.source.length) {
      //     el[0].checked = false;
      //   }
      // }, true);
    }
  }

  function tableCheckAllItem(_) {
    var directive = {
      restrict: 'A',
      require: '^?tableCheck',
      scope: {
        value: '='
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ctrl) {
      scope.allScope = ctrl.scope;
      el.bind('change', function(e) {

        var index;
        var key = ctrl.scope.key;

        if (angular.isObject(scope.value) && key) {
          index = _.findIndex(ctrl.scope.selected, function (item) {
            return _.get(item, key) === _.get(scope.value, key);
          });
        } else {
          index = ctrl.scope.selected.indexOf(scope.value);
        }

        if (e.target.checked) {

          ctrl.scope.selected.push(scope.value);
        } else {
          if (index > -1) {
            ctrl.scope.selected.splice(index, 1);
          }
        }

        scope.$apply();
      });

      scope.$watch('allScope.selected', function (value) {
        el[0].checked = value && value.indexOf(scope.value) > -1;
      }, true);
    }
  }

})();
