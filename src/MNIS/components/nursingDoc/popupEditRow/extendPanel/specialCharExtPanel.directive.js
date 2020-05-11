(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('specialCharExtPanel', specialCharExtPanel);


  function specialCharExtPanel(clipboardUtil) {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        extendEcho: "=",
        editData: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, nursingRest, _, nursingRecordUtil) {

        var vm = this;

        // 初始化视图模型
        initViewModel();

        function initViewModel() {

          nursingRest.getDocConfig('character').then(function (response) {
            var charactersSet = _.get(response, "contents");
            if (!charactersSet)
              return;

            vm.charactersSet = []
            _.forEach(charactersSet, function (characters) {

              for (var i = characters.value.length; characters.value.length != 0 && i < 5; i++) {
                characters.value.push("");
              }

              vm.charactersSet.push({
                type: characters.type,
                characters: characters.value
              });
            })

            if (vm.charactersSet.length > 0)
              vm.showIndex = 0;
          });
        }

        // 追回文本
        vm.addText = function (item) {
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, item, $scope, $scope.insertCallback);
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/specialCharExtPanel.tpl.html"
    }

    return directive;
  }
})();
