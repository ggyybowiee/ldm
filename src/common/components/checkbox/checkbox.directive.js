(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('checkbox', checkbox);

  /** @ngInject */
  function checkbox() {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        text: '@',
        type: '@',
        // switchType: '@',
        switchIcon: '@',
        value: '@'
      },
      templateUrl: 'common/components/checkbox/checkbox.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope) {
      scope.type = scope.type || 'normal';
    }
  }

})();

(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('checkboxGroup', checkboxGroup);

  /** @ngInject */
  function checkboxGroup(_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        eles: '=',
        options: '=',
        dangerItem: '='
      },
      templateUrl: 'common/components/checkbox/checkbox.group.html',
      link: function(scope) {
        scope.dangerKey = scope.dangerItem ? Object.keys(scope.dangerItem)[0] : '';
        scope.dangerValue = scope.dangerItem ? scope.dangerItem[scope.dangerKey] : '';
        scope.opts = _.assign({
          'value': 'value',
          'text': 'text'
        }, scope.options || {
          value: 'value',
          text: 'label'
        });
      }
    };

    return directive;
  }

})();

(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('checkList', checkList);

  /** @ngInject */
  function checkList() {
    var directive = {
      restrict: 'A',
      scope: {
        list: '=checkList',
        value: '@'
      },
      require: '?^checkboxTeam',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ct) {
      scope.list = scope.list || [];

      var handler = function(setup) {
        var checked = el.prop('checked');
        scope.list = scope.list || [];
        var index = scope.list.indexOf(scope.value);

        if (checked && index == -1) {
          el.next().addClass('checked');
          if (setup) {
            el.prop('checked', false);
          } else {
            scope.list.push(scope.value);
          }
        } else if (!checked && index != -1) {
          el.next().removeClass('checked');
          if (setup) {
            el.prop('checked', true);
          } else {
            scope.list.splice(index, 1);
          }
        }
        // ct && ct.setAllStatus();
      };

      var setupHandler = handler.bind(null, true);
      var changeHandler = handler.bind(null, false);
      setupHandler();

      el.bind('change', function() {
        scope.$apply(changeHandler);
      });

      scope.$watch('list', setupHandler)
    }
  }

})();

(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('checkboxTeam', checkboxTeam);

  /** @ngInject */
  function checkboxTeam($timeout, _) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: linkFunc,
      controller: function($scope, $element) {
        var vm = this;

        vm.toggleAll = function(check) {
          if(check) {
            $element.find('input[check-list]').prop('checked', true).trigger('change');
          }else {
            $element.find('input[check-list]').removeAttr('checked').trigger('change');
          }
        };
        vm.setAllStatus = function() {
          var flag;
          var inputs = $element.find('input[check-list]');

          if(inputs.length) {
            _.forEach(inputs, function (item) {
              angular.element(item).next().removeClass('checked');
            })
            flag = _.every(inputs, function(item) {
              return angular.element(item).prop('checked');
            });
          }
          if(flag) {
            $element.find('input[checkbox-all]').prop('checked', true);
          }else {
            $element.find('input[checkbox-all]').removeAttr('checked');
          }
        };
      },
      controllerAs: 'ct'
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var t;
      scope.$watch(attr.checkboxTeam, function(value) {
        if(!value) return;
        if(t) $timeout.cancel(t);
        t = $timeout(function() {
          var listener = _.get(scope, attr.listener);
          if(_.isFunction(listener)) listener(value);
          scope.ct.setAllStatus();
        }, 20);
      }, true);
    }
  }

})();

(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('checkboxAll', checkboxAll);

  /** @ngInject */
  function checkboxAll() {
    var directive = {
      restrict: 'A',
      scope: false,
      require: '^?checkboxTeam',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ct) {
      el.bind('change', function() {
        console.log(scope);
        ct.toggleAll(el.is(':checked'));
      });

      //配合分页，选择并跳转到其它页时，取消勾选。
      // scope.$on('table-page-changed', function(){
      //   angular.element('input[checkbox-all]').removeAttr('checked');
      //   angular.element('input[check-list]').removeAttr('checked').trigger('change');
      // })
    }
  }

})();
