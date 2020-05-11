(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('commonHeader', header);

  /** @ngInject */
  function header(tokenService, $q, $timeout, $rootScope, authService, businessCalc, sessionService, authHelperService, modalService, utilService, userService, userShiftRest, sysRest, _, deptRest) {
    var directive = {
      restrict: 'EA',
      scope: {
        title: '=',
        containNav: '='
      },
      replace: true,
      templateUrl: 'common/components/header/header.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope) {
      var conf = sessionService.getConfHelper().conf,
        profile = sessionService.getProfile();
      // $interval(function() {
      //   scope.time_now = moment().format('YYYY年MM月DD日  HH:mm:ss');
      // }, 1000);
      var wards = authService.getToken().wards;
      scope.go = go;
      scope.changePwd = changePwd;
      scope.setDefaultWard = setDefaultWard;
      scope.role = authService.getRole();
      scope.roles = authService.getToken().roles;
      scope.profile = profile;
      scope.wards = wards;

      scope.hosInfo = {};

      scope.gUtils = businessCalc;

      scope.logout = logout;
      scope.changeRole = changeRole;
      scope.changeUser = changeUser;
      scope.changeWard = changeWard;
      scope.apps = _.sortBy(authHelperService.getApps(null, true), 'appType');
      scope.resource = _.find(scope.apps, {
        resourceCode: utilService.getParams('resource')
      });

      getHosInfo();

      function logout() {
        scope.$emit('logout');
      }

      function getHosInfo() {
        return sysRest.getHosInfo().then(function (data) {
          scope.hosInfo = data;
        }).catch(function (error) {
          if (error.status === 404) {
            scope.hosIconPath = '../assets/images/logo-white.png';
          }
        });
      }

      function changeRole(role) {
        scope.$emit('toast', '正在切换角色...');
        scope.$emit('crole', role);
      }

      function changeWard(ward) {
        scope.$emit('toast', '正在切换病区...');
        scope.$emit('cward', ward);
      }

      function go(app) {
        authHelperService.goApp(app);
      }

      function changeUser() {
        modalService.open({
          templateUrl: 'common/components/header/changeUser.modal.html',
          size: 'sm',
          ok: function (data) {
            return login(data);
          }
        });
      }

      function changePwd() {
        modalService.open({
          templateUrl: 'common/components/header/pwd.modal.html',
          size: 'sm',
          initFn: function () {
            var vm = this;
            userService.getUser(profile.userCode).then(function (data) {
              vm.profile = data;
            });
          },
          ok: function (data) {
            var vm = this;
            vm.profile.userPassword = data.newPwd;
            return userService.updateUserPassword(_.omit(vm.profile, 'wardName')).then(function () {
              $rootScope.$broadcast('toast', '密码修改成功，请重新登录');
              $timeout(function () {
                $rootScope.$broadcast('logout');
              }, 1000);
            });
          },
          methodsObj: {
            checkerEqual: function () {
              var vm = this;
              return vm.formData.newPwd === vm.formData.confirmPwd;
            },
            checkPwd: checkPwd()
          }
        });

        function checkPwd() {
          var timeout = 500,
            handler;
          return function () {
            var vm = this,
              data = vm.formData,
              defer = $q.defer();
            if (handler) {
              $timeout.cancel(handler);
            }
            handler = $timeout(function () {
              userService.checkPwd({
                userCode: profile.userCode,
                userPassword: data.oldPwd
              }).then(function (data) {
                if (data) {
                  return defer.resolve();
                } else {
                  return defer.reject();
                }
              });
            }, timeout);
            return defer.promise;
          }
        }
      }

      // 修改默认科室
      function setDefaultWard() {

        modalService.open({
          templateUrl: 'common/components/header/defaultWard.modal.html',
          size: 'sm',
          initFn: function () {
            var vm = this;
            vm.wards = wards;
            vm.formData = {
              wardCode: ""
            };
            userService.getUser(profile.userCode).then(function (data) {
              vm.profile = data;
              vm.formData.wardCode = data.wardCode;
              vm.formData.userShift = data.teamCode;

              userShiftRest.getUserGroup({
                wardCode: profile.wardCode,
                status: 1
              }).then(function (shiftData) {
                vm.shifts = shiftData.queryResult;
              });
            });
          },
          ok: function (data) {

            var vm = this;
            vm.profile.wardCode = data.wardCode;
            vm.profile.teamCode = data.userShift;

            if (data.wardCode === "") {
              scope.$emit('toast', {
                content: '请选择科室',
                type: 'warning'
              });
              return false;
            }

            return userService.updateUser(_.pick(vm.profile, ['wardCode', 'hisCode', 'teamCode'])).then(function () {
              $rootScope.$broadcast('toast', '修改成功');
              window.location.reload();
            });
          }
        });
      }

      function login(formData) {

        if (scope.profile.userCode === formData.userCode) {
          scope.$emit("toast", {
            type: "info",
            title: '提示',
            content: "您切换的用户已是当前登录用户，无需切换~"
          });

          return;
        }

        scope.changing = true;
        return tokenService.getToken(formData).then(function (data) {
          if (!data.roles.length) {
            scope.$emit("toast", {
              type: "error",
              title: "登录失败",
              content: "该用户没有设置角色"
            });
            throw new Error("no roles");
          }

          scope.$emit("init", {
            token: data
          });

          // 获取用户的病区列表
          deptRest.getUserWards(data.userCode).then(function (response) {
            scope.changing = false;
            localStorage.setItem("loginInfo", angular.toJson(formData));

            $rootScope.$broadcast("init", {
              token: _.assign({
                wards: response.plain()
              }, data),
              state: "main.entry"
            });

            $rootScope.$broadcast("toast", {
              type: "success",
              content: "正在切换..."
            });

            window.location.reload();
          });
        });
      }
    }
  }

})();
