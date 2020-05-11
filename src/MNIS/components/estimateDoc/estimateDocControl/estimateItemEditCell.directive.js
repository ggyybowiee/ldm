(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('estimateItemEditCell', estimateItemEditCell);


  function estimateItemEditCell() {

    var directive = {
      restrict: "EA",
      scope: {
        hlpgd: "=",
        tpl: "=",
        patCode: "=",
        editData: "=",
        header: "=",
        onChange: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope) {

        var vm = this;

        var editDataWatcher = $scope.$watch("$scope.header", function () {
          if (($scope.header.dataType === "radio" || $scope.header.dataType === "select" ||
              $scope.header.dataType === "multiSelect" || $scope.header.dataType === 'select2')) {
            $scope.selectedItems = $scope.editData.data[$scope.header.dataBind];
            if ($scope.selectedItems == undefined)
              $scope.selectedItems = [];
            else if (!angular.isArray($scope.selectedItems)) {
              $scope.selectedItems = [$scope.selectedItems];
            }
          }
        });
        $scope.$on('$destroy', editDataWatcher);

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateDocControl/estimateItemEditCell.tpl.html",
      link: function (scope) {

        scope.checkBoxChanged = function (opt) {
          scope.editData.data[scope.header.dataBind] = opt.dicCode;
        };

        scope.checkboxConfig = {
          value: 'dicCode',
          text: 'dicName'
        };

        scope.multiSelectOnChanged = function (options) {
          scope.editData.data[scope.header.dataBind] = options;
          scope.onChange();
        }

        scope.valueChanged = function () {
          scope.onChange();
        }
      }
    }

    return directive;
  }
})();
