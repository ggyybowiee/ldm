(function() {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('KeysController', KeysController);

  /** @ngInject */
  function KeysController($timeout, $state, modalService, authService, userService, authHelperService, _) {
    var vm = this, userCode = authService.getToken().userCode;

    vm.load = {
      func: loadData
    };
    vm.open = open;
    vm.unbind = unbind;

    activate();

    function activate() {
      vm.apps = authHelperService.getOutApps(null, true);
      $timeout(function () {
        vm.load.func();
      });
    }

    function open(resourceCode, data) {
      var raw = data ? data.clone() : userService.createUserAppKey(userCode, resourceCode);
      var instance = modalService.open({
        size: 'sm',
        templateUrl: 'settings/modules/keys/keys.modal.html',
        data: {
          formData: raw
        },
        ok: function() {
          return userService.saveUserAppKey(raw);
        }
      });
      instance.result.then(function() {
        vm.load.func();
      });
    }

    function unbind(id) {
      userService.removeUserAppKey(id).then(function() {
        vm.load.func();
      });
    }

    function loadData() {
      return userService.getUserAppKey(userCode).then(function(data) {
        vm.keys = data;
        _.forEach(vm.apps, function(app) {
          app.key = _.find(vm.keys, {
            resourceCode: app.resourceCode
          });
        });
      });
    }
  }
})();