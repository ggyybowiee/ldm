(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('characters', nursingDoc);

  /** @ngInject */
  function nursingDoc($q, $timeout, $interval, _, $location, utilService, sessionService) {
    var directive = {
      restrict: 'EA',
      scope: {},
      replace: true,
      templateUrl: 'MNIS/components/characters/characters.tpl.html',
      link: linkFunc,
      controller: ctrlFunc,
      controllerAs: 'vm',
      bindToController: true
    };

    var IS_OPEN = 'charactersIsOpen';

    return directive;

    function linkFunc(scope, el) {
      var vm = scope.vm;

      vm.isOpen = JSON.parse(sessionStorage.getItem(IS_OPEN));

      hotkeys('alt+shift+e', function(event,handler) {
        vm.toggleOpen();
      });

      var listener = scope.$on('openCharacters', vm.toggleOpen);

      scope.$on('$destroy', listener);
    }

    function ctrlFunc($rootScope, $scope, nursingRest, $timeout) {
      var vm = this;

      vm.toggleOpen = toggleOpen;

      $timeout(function () {
        angular.element(document).on('click', function (e) {
          if (['INPUT', 'TEXTAREA'].indexOf(e.target.tagName) >= 0) {
            vm.activeElement = e.target;
          }
        });
      });

      nursingRest.getDocConfig('character').then(function (response) {
        vm.characters = _.chunk(response.contents, 6);
      });

      vm.setValue = function (value) {
        var ngModel = angular.element(vm.activeElement).controller('ngModel');
        var finalValue = (ngModel.$modelValue || '') + '' + value;
        vm.activeElement.value = finalValue;
        ngModel.$setViewValue(finalValue);
        vm.activeElement.focus();
      };

      function toggleOpen() {
        vm.isOpen = !vm.isOpen;

        sessionStorage.setItem(IS_OPEN, vm.isOpen);
        try {
          $scope.$apply();
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

})();
