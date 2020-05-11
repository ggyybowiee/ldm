(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .controller('EditableController', editableController);

  /** @ngInject */
  function editableController($rootScope, $scope) {
    var vm = this;
    vm.scope = $scope;
    vm.scopeParent = $scope.$parent;
  }
})();
