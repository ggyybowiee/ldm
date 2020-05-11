(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('editText', editText);
  /** @ngInject */
  function editText($timeout) {
    var directive = {
      scope: {
        model: '=editText',
        cb: '&'
      },
      templateUrl: 'MNIS/components/paper/editText.tpl.html',
      controller: ctrlFunc,
      controllerAs: 'edit',
      bindToController: true
    };

    return directive;

    function ctrlFunc($scope, $element) {
      var vm = this;
      $element.click(function(e) {
        e.preventDefault();
        vm.show = true;
        $timeout(function() {
          $element.find('input').focus();
        }, 1000);
      });
      $element.on('blur', 'input', function() {
        vm.cb();
        vm.show = false;
      });
      $element.on('keydown', 'input', function(e) {
        if(e.keyCode === 13) {
          vm.cb();
          vm.show = false;
        }
      });
    }
  }
})();