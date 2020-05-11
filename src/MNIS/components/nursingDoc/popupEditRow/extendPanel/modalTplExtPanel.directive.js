(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('modalTplExtPanel', modalTplExtPanel);


  function modalTplExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        editData: "=",
        extendEcho: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, nursingRecordUtil) {

        var vm = this;
        vm.filterText = "";

        // 初始化视图模型
        initViewModel();

        function initViewModel() {
          if ($scope.extendEcho.extendsData) {
            $scope.extendEcho.extendsData.tpls = $scope.extendEcho.focusRowEcho.row.rule && $scope.extendEcho.focusRowEcho.row.rule.tpls || [];
          }
        }

        vm.addTplText = function (tpl) {

          var extendsData = $scope.extendEcho.extendsData;
          nursingRecordUtil.insertText(extendsData.editData, $scope.extendEcho.focusRowEcho, tpl, $scope, $scope.insertCallback);
        }

        vm.copyToClipboard = function (tpl) {
          
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/modalTplExtPanel.tpl.html"
    }

    return directive;
  }
})();
