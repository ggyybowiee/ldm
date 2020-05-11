(function () {
  'use strict';

  angular.module('lachesis-mnis')
    .directive('patientInfoBar', fn);

  /** @ngInject */
  function fn($rootScope, sessionService, nursingRest, moment, $timeout, patientEventRest, _) {

    var directive = {
      scope: {
        items: '=',
        patient: '=',
        patientEvent: '=',
        startTime: "=",
        endTime: "=",
        headers: "="
      },
      restrict: 'E',
      replace: true,
      transclude: true,
      controller: function () {},
      controllerAs: 'vm',
      bindToController: true,
      templateUrl: 'MNIS/components/patientInfoBar/patientInfoBar.tpl.html',
      link: function (scope) {


        var vm = scope.vm;
        var watchers = {};

        vm.getDicValue = $rootScope.getDicValue;

        // 转床、转科数据
        vm.dynamicProps = ['wardName', 'bedCode', 'wardCode'];
        vm.dynamicData = {};

        watchers.headers = scope.$watch('vm.headers', function (value) {
          if (value) {
            vm.dynamicData.bedCode = value.bedCode;
            vm.dynamicData.wardName = value.wardName;
          }
        });

        scope.$on('$destroy', function () {
          Object.keys(watchers).forEach(function (watcherName) {
            watchers[watcherName]();
          });
        });
        
      }
    };

    return directive;
  }

})();
