(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('commonBreadcrumb', acmeBreadFunc);

  /** @ngInject */
  function acmeBreadFunc($interpolate, $state, $q, $timeout, _) {
    return {
      restrict: 'E',
      templateUrl: function(elem, attrs) {
        var templateUrl = 'common/components/breadcrumb/breadcrumb.tpl.html';

        return attrs.templateUrl || templateUrl;
      },
      replace: true,
      link: function(scope) {
        var timeouts = [], topState;
        scope.breadcrumbs = [];
        if ($state.$current.name !== '') {
          refresh();
        }
        scope.$on('$stateChangeSuccess', function() {
          $timeout(function() {
            init();
            refresh();
          })
        });

        function init() {
          _.each(timeouts, function(item) {
            item.watch && item.watch();
            item.timeout && $timeout.cancel(item.timeout);
          });
          timeouts = [];
        }

        /**
         * 刷新面包屑数组
         */
        function refresh() {
          scope.breadcrumbs = [];
          topState = $state.$current;
          var namePromises = [];
          var breadcrumbs = [];
          var currentState = $state.$current;
          var index = 0;

          while (currentState && currentState.name !== '') {
            if(_.get(currentState, 'data.breadcrumb.hide')) {
              currentState = getSuperState(currentState, _.get(currentState, 'data.breadcrumb.super'));
              continue;
            }
            namePromises.push(getDisplayName(currentState).then(handlerName(currentState, breadcrumbs, index)));
            /*
             * 前一级放在data.breadcrumb.super中
             */
            currentState = getSuperState(currentState, _.get(currentState, 'data.breadcrumb.super'));
            index++;
          }
          $q.all(namePromises).then(function() {
            breadcrumbs.reverse();
            scope.breadcrumbs = breadcrumbs;
          });
        }

        function handlerName(state, arr, i) {
          return function(displayName) {
            if (displayName !== false && !stateAlreadyInBreadcrumbs(state, arr)) {
              arr[i] = {
                displayName: displayName,
                route: state.name
              };
            }
          }
        }

        /**
         * 数组名放在data.breadcrumb.name中，可使用{{}}表达式
         */
        function getDisplayName(currentState) {
          var scopeContext;
          var propertyReference;
          var displayName;
          var defer;
          var destroy;
          var timeout;
          var property;

          propertyReference = _.get(currentState, 'data.breadcrumb.name');

          if (propertyReference === false) {
            return $q.resolve(false);
          } else if (typeof propertyReference === 'undefined') {
            return $q.resolve('');
          } else {
            if(currentState.locals) {
              property = _.find(_.keys(currentState.locals), function(v) {
                return v.indexOf('@') === 0;
              });
              scopeContext = currentState.locals[property].$scope;
              displayName = $interpolate(propertyReference)(scopeContext);
            }else {
              displayName = propertyReference;
            }
            //通过ajax获取的数据需要监听到变化为确定的值才进行渲染
            if(displayName.replace(/\s/g, '')) {
              return $q.resolve(displayName);
            }else {
              defer = $q.defer();
              if(scopeContext) {
                destroy = scopeContext.$watch(propertyReference.replace(/[\{|\|\s}]/g, ''), function(value) {
                  if(value) {
                    defer.resolve(value);
                    destroy();
                  }
                });
                //5秒后扔未初始化则不再监听，释放资源
                timeout = $timeout(function() {
                  defer.resolve('未知');
                  destroy && destroy();
                }, 5000);
                timeouts.push({
                  watch: destroy,
                  timeout: timeout
                });
              }else {
                defer.resolve('未知');
              }
              return defer.promise;
            }
          }
        }

        /**
         * 检测是否已存在，避免循环
         */
        function stateAlreadyInBreadcrumbs(state, breadcrumbs) {
          var i;
          var alreadyUsed = false;
          for (i = 0; i < breadcrumbs.length; i++) {
            if (breadcrumbs[i] && breadcrumbs[i].route === state.name) {
              alreadyUsed = true;
            }
          }
          return alreadyUsed;
        }

        /*
         * 获取前一级面包屑，如果在state链中则取用链中的state，此种情况支持{{}}表达式，如果不在state链中则通过$state获取，仅支持文本
         */
        function getSuperState(state, name) {
          if(!name) return;
          while(state && state.name !== name) {
            state = state.parent;
          }
          if(!state) {
            state = topState.parent;
            while(state && state.name !== name) {
              state = state.parent;
            }
          }
          if(state) {
            return state;
          }else {
            return $state.get(name);
          }
        }
      }
    };
  }

})();
