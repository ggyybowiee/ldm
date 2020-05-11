(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('docScaleInput', docScaleInput);

  /** @ngInject */
  function docScaleInput() {
    var directive = {
      restrict: 'EA',
      scope: {
        ngModel: '=',
        min: '@',
        max: '@'
      },
      replace: true,
      templateUrl: 'MNIS/modules/docs/directive/docScaleInput/docScaleInput.tpl.html',
      controller: ctrlFunc,
      controllerAs: 'vm',
    };

    return directive;

    function ctrlFunc($scope) {

      var vm = this;

      $scope.min = $scope.min || 50;
      $scope.max = $scope.max || 100;

      vm.scale = function (delta) {
        console.log(delta);
        var newScale = $scope.ngModel + delta;
        newScale= Math.max($scope.min, newScale);
        newScale= Math.min($scope.max, newScale);

        $scope.ngModel = newScale;

      }
    }
  }

})();
