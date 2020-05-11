(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('userRoleAssignManager', userRoleAssignManager);

  /** @ngInject */
  function userRoleAssignManager() {
    var directive = {
      restrict: 'EA',
      scope: {

      },
      templateUrl: 'settings/modules/authentication/roleAssign/directive/userRoleAssignManager/userRoleAssignManager.tpl.html',
      controllerAs: "vm",
      controller: function ($scope, userService, roleService, _) {

        var vm = this;

        initViewModel();

        function initViewModel() {

          // 获取角色列表
          vm.loadRoles = {
            func: getRoles,
            init: true
          }

          vm.loadAssignUsers = {
            func: getAssignUsers
          }

          vm.loadAvailableUsers = {
            func: getAvailableUsers
          }

          // 函数
          vm.logout = logout;
        }

        // 获取角色列表
        function getRoles() {
          return roleService.getRoles().then(function (data) {
            vm.rRoles = data.plain();
            if (vm.rRoles.length > 0) {
              vm.selectRole(vm.rRoles[0]);
            } else {
              vm.selectedRole = undefined;
            }
          });
        }

        // 获取可用的用户
        function getAvailableUsers() {
          return userService.getSysUserRole(vm.selectedRole.roleCode, {
            isDistribute: 0
          }).then(function (res) {
            vm.availableUsers = res.plain();
          });
        }

        // 获取已经分配的用户
        function getAssignUsers() {
          return userService.getSysUserRole(vm.selectedRole.roleCode, {
            isDistribute: 1
          }).then(function (res) {
            vm.assignUsers = res.plain();
          });
        }

        // 选中角色
        vm.selectRole = function (role) {
          vm.selectedRole = role;
          vm.loadAvailableUsers.func();
          vm.loadAssignUsers.func();
        }

        // 取消分配用户
        vm.cancelUser = function (user) {

          userService.getUserRole(user.userCode).then(function (res) {

            var match = _.findWhere(res.plain(), {
              roleCode: vm.selectedRole.roleCode
            });

            if (match) {
              userService.removeUserRole(match.seqId).then(function () {

                var index = vm.assignUsers.indexOf(user);
                if(index != -1) {
                  vm.assignUsers.splice(index, 1);
                  vm.availableUsers.splice(0, 0, user);
                }
              });
            }
          })
        }

        // 取消分配所有用户
        vm.cancleAllUser = function () {
          return true;
        }

        // 分配用户角色
        vm.assignUser = function (user) {

          var index = vm.availableUsers.indexOf(user);
          if(index != -1) {
            userService.createUserRole(user.userCode, vm.selectedRole.roleCode).save().then(function () {
              vm.availableUsers.splice(index, 1);
              vm.assignUsers.splice(0, 0, user);
            });
          }
        }

        // 分配所有用户角色
        vm.assignAllUser = function () {
          return true;
        }

        function logout() {
          $scope.$emit('logout');
        }
      }
    };

    return directive;

  }

})();
