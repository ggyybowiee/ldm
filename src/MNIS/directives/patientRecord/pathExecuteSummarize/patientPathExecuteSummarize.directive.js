(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('patientPathExecuteSummarize', patientPathExecuteSummarize);

  /** @ngInject */
  function patientPathExecuteSummarize(examLabelRest) {
    var directive = {
      restrict: 'E',
      scope: {
        pathSummaryData: '=',
        pathSummaryKeys: '='
      },
      // replace: true,
      // transclude: true,
      templateUrl: 'MNIS/directives/patientRecord/pathExecuteSummarize/patientPathExecuteSummarize.tpl.html',
      controllerAs: "vm",
      
      controller: function ($scope, $filter, moment, sessionService, $timeout, _) {

        var vm = this;

        // 监听器
        var watcher = $scope.$watch('pathSummaryData', function (value) {
          vm.pathSummaryData = $scope.pathSummaryData;
          vm.pathSummaryKeys = $scope.pathSummaryKeys;
        });
        $scope.$on('$destroy', watcher);

        initModelView();
        // 初始化视图
        function initModelView() {
          vm.pathSummaryData = $scope.pathSummaryData;
          vm.pathSummaryKeys = $scope.pathSummaryKeys;
        }
      }
    };

    return directive;
  }

})();
