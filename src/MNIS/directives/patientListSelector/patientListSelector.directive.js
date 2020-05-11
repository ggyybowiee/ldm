(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('patientListSelector', patientListSelector);


  function patientListSelector(
    $rootScope,
    _,
    nursingRest,
    sessionService
  ) {

    var directive = {
      restrict: "EA",
      scope: {
        onPatientSelected: '='
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, _) {

        var vm = this;
        vm.filterText = "";

        vm.profile = sessionService.getProfile();
        vm.loadInhosRecord = {
          func: getInhosRecord,
          init: true
        };

        function getInhosRecord() {
          return nursingRest.getInhosRecords(vm.profile.wardCode).then(function (data) {

            vm.patients = data;
            vm.patientsDic = {};
            for (var i = 0; i < vm.patients.length; i++)
              vm.patientsDic[vm.patients[i].inhosCode] = vm.patients[i];

            if (vm.patients.length > 0) {
              vm.patientInhosCode = vm.patients[0].inhosCode;
            }
          });
        }

        var watcher = $scope.$watch('vm.patientInhosCode', function (value) {
          if (value && $scope.onPatientSelected) {
            $scope.onPatientSelected(vm.patientsDic[value]);
          }
        });
        $scope.$on('$destroy', watcher);

        vm.patientsFilter = function (data) {
          return data.bedCode.indexOf(vm.filterText) > -1;
        }

      },
      controllerAs: "vm",
      templateUrl: "MNIS/directives/patientListSelector/patientListSelector.tpl.html"
    }

    return directive;
  }
})();
