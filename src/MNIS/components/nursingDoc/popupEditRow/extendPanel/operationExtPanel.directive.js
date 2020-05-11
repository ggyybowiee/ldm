(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('operationExtPanel', operationExtPanel);


  function operationExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        editData: "=",
        extendEcho: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, $timeout, nursingRest, moment, nursingRecordUtil) {

        var vm = this;

        // 初始化视图模型
        initViewModel();

        function initViewModel() {

          vm.loadPatintSurgery = {
            func: getPatientSurgery
          }

          // 患者监听器
          var patientWatcher = $scope.$watch('patientInfo', function (value) {
            if (value) {
              $timeout(function () {
                vm.loadPatintSurgery.func();
              })
            }
          });
          $scope.$on('$destroy', patientWatcher);
        }

        function getPatientSurgery() {
          nursingRest.getPatientSurgery($scope.patientInfo.inhosCode).then(function (response) {
            vm.surgeryList = response.plain();
          });
        }

        vm.insertOperation = function (surgery) {
          var importText = (surgery.actualStartTime ? ("于" + moment(surgery.actualStartTime).format('YYYY-MM-DD HH:mm:ss')) : "") + "在" + surgery.anesthesiaMethod + "下行" + surgery.surgeryName + "";
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, importText, $scope, $scope.insertCallback);
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/operationExtPanel.tpl.html"
    }

    return directive;
  }
})();
