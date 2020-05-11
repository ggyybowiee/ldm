// getUserSysRoles
(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('modalService', modalServiceFunc);

  function modalServiceFunc($uibModal, $uibModalStack) {
    return {
      open: function (options) {
        return $uibModal.open({
          templateUrl: options.templateUrl,
          size: options.size,
          backdrop: 'static',
          appendTo: options.appendTo,
          animation: options.animation || true,
          controller: 'ModalController',
          controllerAs: 'vm',
          resolve: {
            initFn: function () {
              return options.initFn;
            },
            ok: function () {
              return options.ok;
            },
            data: function () {
              if (options.data) {
                return options.data;
              }
            },
            context: function () {
              return options.context;
            },
            methodsObj: function () {
              if (options.methodsObj) {
                return options.methodsObj;
              }
            },
            cancel: function () {
              return options.cancel;
            }
          }
        });
      },
      close: function (reason) {
        $uibModalStack.dismissAll(reason);
      }
    };
  }
})();
