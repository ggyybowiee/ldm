(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .run(runBlock);

  /** @ngInject */
  function runBlock($rootScope, $state, $timeout, $location, $stateParams, toastr, authService, sessionService, userService, businessCalc, _) {
    var loginUrl = '/#/login';

    var stateOff = $rootScope.$on('$stateChangeStart', function (event, toState) {

      if (!(toState.data && toState.data.public) && !authService.getToken() && toState.url.indexOf('openOuter') < 0) {
        event.preventDefault();
        $timeout(function () {
          location.href = loginUrl;
        });
      }
    });

    var openOuter = $rootScope.$on('openOuter', function (event, options) {
      var token = options.token,
        role = options.role || token.roles[0],
        state = options.state;
      authService.setToken(token);
      authService.setRole(role);
      if (state) {
        location.href = $location.$$absUrl.split('#')[0] + 'mnis.html?resource=MNIS-IN#/beds?inhosCode=' + state.inhosCode + '&patCode=' + state.patCode + '&openOuter=' + state.openOuter + '&wardCode=' + state.wardCode;
      }
    });

    var toastOff = $rootScope.$on('toast', function (event, info) {
      var type, content, title;
      if (_.isObject(info)) {
        type = info.type;
        content = info.content;
        title = info.title;
      } else if (_.isString(info)) {
        content = info;
      }
      type = type || 'success';
      content = content || (type === 'success' ? '操作成功' : '操作失败');
      title = title || '';
      toastr[type](content, title);
    });

    var loginOff = $rootScope.$on('init', function (event, options) {
      var token = options.token,
        role = options.role || token.roles[0],
        state = options.state;
      authService.setToken(token);
      authService.setRole(role);
      if (state) {
        $state.go(state, {
          location: 'replace'
        });
      }
    });

    var logoutOff = $rootScope.$on('logout', function () {
      authService.clearToken();
      authService.clearRole();
      sessionService.destroy();
      if (location.href.indexOf(loginUrl) === -1) {
        location.href = loginUrl;
      }
    });

    //change role
    var croleOff = $rootScope.$on("crole", function (event, role) {
      authService.setRole(role);
      location.href = '/';
    });

    //change ward
    var cwardOff = $rootScope.$on('cward', function (event, ward) {

      sessionService.changeWard(ward);
      if (location.href.indexOf("#/entry") === -1) {
        $state.go('main.beds');
      }

      $timeout(function () {
        location.reload();
      }, 0);
    });

    $rootScope.$on('$destroy', function () {
      openOuter();
      stateOff();
      toastOff();
      loginOff();
      logoutOff();
      croleOff();
      cwardOff();
    });

    $rootScope.gUtils = businessCalc;
    $rootScope.getHtml = function (str) {
      if (!str) {
        return '';
      }
      str = str.replace(/\n/g, '<br/>');
      str = str.replace(/[ ]/g, "&nbsp;");

      return str;
    };

    $rootScope.getDicValue = function getDicValue(source, dicCode) {
      var gender = {
        F: '女',
        M: '男'
      };

      var value = _.get(source, dicCode);
      if (typeof dicCode === 'string' && (dicCode.toLowerCase().indexOf('date') >= 0 || dicCode.toLowerCase().indexOf('time') >= 0)) {
        if (typeof value === 'undefined') {
          return '';
        }
        if ((dicCode.indexOf('admissionDate') >= 0)) {
          return moment(value).format('YYYY-MM-DD');
        } else {
          return moment(value).format('YYYY-MM-DD HH:mm');
        }
      }

      if (dicCode === 'gender') {
        return _.get(gender, value);
      }

      return value;
    };

  }
})();

(function () {
  "use strict";

  angular.module("lachesis-common").run(runBlock);

  /** @ngInject */
  function runBlock($rootScope, authService) {
    var token = authService.getToken(),
      role = authService.getRole();

    if (token) {
      $rootScope.$emit('init', {
        token: token,
        role: role
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module("lachesis-common").run(runBlock);

  /** @ngInject */
  function runBlock($rootScope, $timeout, Restangular, _) {
    Restangular.setErrorInterceptor(function (response) {
      if (response.status === 401) {
        $rootScope.$emit('toast', {
          type: 'error',
          content: '您的登录状态已经失效，请重新登录系统'
        });
        $timeout(function () {
          $rootScope.$emit("logout");
        }, 1000);
      } else if (response.status === 403) {
        $rootScope.$emit("toast", {
          type: "error",
          content: response.data.message || "当前角色没有权限进行操作"
        });
      } else if (response.status === 404) {
        $rootScope.$emit("toast", {
          type: "error",
          content: (response.data && response.data.message) || "服务器的连接中断</br>或者正在查询的内容不存在"
        });
      } else if (response.status === 500) {
        $rootScope.$emit("toast", {
          type: "error",
          content: (response.data && response.data.message) || "您的请求服务器反馈操作失败"
        });
      }
      return true;
    });

    _.fromPairs = function (pairs) {
      var result = {};
      if (pairs == null) {
        return result;
      }
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (
          var _iterator = pairs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true
        ) {
          var pair = _step.value;

          result[pair[0]] = pair[1];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return result;
    };
  }
})();
