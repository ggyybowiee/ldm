(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .controller('ModalController', ModalControllerFunc);

  function ModalControllerFunc($rootScope, $scope, $log, $uibModalInstance, ok, cancel, data, context, methodsObj, initFn, _) {
    var vm = this;

    vm.rootScope = $rootScope;
    vm.scope = $scope;
    vm.cancelCallback = cancel;

    // 预设的表单数据
    vm.formData = data && data.formData;
    // 预设的原始数据
    vm.metaData = data && data.metaData;

    // 在弹层中调用方法
    if (angular.isObject(methodsObj)) {
      for (var prop in methodsObj) {
        // if (typeof methodsObj[prop] === 'function') {
        vm[prop] = methodsObj[prop];
        // }
      }
    } else {
      if (methodsObj) {
        $log.error('methodsObj必须是对象!');
      }
    }

    if (initFn) {
      vm.initFn = initFn;
      vm.initFn(vm);
    }

    _.assign(vm, context);

    vm.ok = function (arg) {
      // 第三个参数是表单
      if (arguments[2] && angular.isFunction(arguments[2].doValidate)) {
        arguments[2].doValidate();
        if (!arguments[2].$valid) return;
      }

      var _promise = ok.call(vm, vm.formData, arg, arguments);


      if (!_promise) {
        // $uibModalInstance.dismiss('cancel');
        return;
      }

      if (_.isBoolean(_promise) && _promise) {
        $uibModalInstance.close();
      }

      if (angular.isFunction(_promise.then)) {
        _promise.then(function (response) {
          if (response === 'error') {
            return;
          }
          $uibModalInstance.close();
        })
      }
    };

    vm.cancel = function () {
      vm.cancelCallback && vm.cancelCallback();
      $uibModalInstance.dismiss('cancel');
    };
  }
})();
