(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('roleManager', roleManager);

  /** @ngInject */
  function roleManager() {
    var directive = {
      restrict: 'EA',
      scope: {

      },
      templateUrl: 'settings/modules/authentication/rightAssign/roleManager/roleManager.tpl.html',
      controllerAs: "vm",
      controller: function ($scope, roleService, modalService, _) {

        var vm = this;

        initViewModel();

        function initViewModel() {

          vm.loadRoles = {
            func: getRoles,
            init: true
          };

          vm.openRole = openRole;
          vm.delRole = delRole;

        }

        function getRoles() {
          return roleService.getRoles().then(function (data) {
            vm.roles = data;
          });
        }

        function openRole(data) {
          var raw = data ? data.clone() : roleService.createRole();
          var instance = modalService.open({
            size: 'sm',
            templateUrl: 'settings/modules/authentication/rightAssign/roleManager/role.modal.html',
            data: {
              formData: raw
            },
            ok: function () {
              return raw.save();
            }
          });
          instance.result.then(function () {
            vm.loadRoles.func();
          });
        }

        function delRole(data) {
          return data.remove().then(function () {
            vm.loadRoles.func();
          });
        }
      }
    };

    return directive;

  }

})();
