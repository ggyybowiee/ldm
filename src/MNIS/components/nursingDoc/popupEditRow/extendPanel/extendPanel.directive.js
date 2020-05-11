(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('extendPanel', extendPanel);


  function extendPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        editData: "=",
        extendEcho: "=",
        patientInfo: "=",
        hideCloseButton: "=",
        insertCallback: "=",
        tpl: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope) {

        var vm = this;

        // 关闭扩展面板
        vm.closePanel = function () {
          $scope.extendEcho.isOpen = false;
          $scope.extendEcho.showIndex = -1;
        }

        // 初始化视图
        initViewModel();

        function initViewModel() {

          // 扩展界面类型字典
          vm.extendType = [{
            type: 0,
            text: "特殊值"
          }, {
            type: 1,
            text: "医嘱"
          }, {
            type: 2,
            text: "体征"
          }, {
            type: 3,
            text: "化验"
          }, {
            type: 4,
            text: "检查"
          }, {
            type: 5,
            text: "手术"
          }, {
            type: 6,
            text: "病历"
          }, {
            type: 100,
            text: "模版"
          }];
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/extendPanel.tpl.html"
    }

    return directive;
  }
})();
