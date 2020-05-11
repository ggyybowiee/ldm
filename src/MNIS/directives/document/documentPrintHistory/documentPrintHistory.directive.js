(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('documentPrintHistory', documentPrintHistory);

  /** @ngInject */
  function documentPrintHistory() {
    var directive = {
      restrict: 'E',
      scope: {
        patientInfo: '='
      },
      templateUrl: 'MNIS/directives/document/documentPrintHistory/documentPrintHistory.tpl.html',
      controller: function ($scope) {

        initModelView();
        // 初始化视图
        function initModelView() {

        }
      },
      controllerAs: 'vm'
    };

    return directive;
  }

})();
