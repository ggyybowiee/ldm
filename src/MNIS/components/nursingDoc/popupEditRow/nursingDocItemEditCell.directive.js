(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('nursingDocItemEditCell', nursingDocItemEditCell);

  function nursingDocItemEditCell($timeout, utilService) {

    var directive = {
      restrict: "EA",
      scope: {
        row: "=",
        editData: "=",
        currentPageColumns: "=",
        focusRowEcho: "=",
        editable: '='
      },
      replace: true,
      transclude: true,
      controller: function ($scope) {

        var vm = this;

        // 初始化视图模型
        initViewModel();

        function initViewModel() {
        }


        $scope.validNumberInput = function (event) {
          var data = $scope.editData.data[$scope.row.key];
          validNumberData(data, $scope);
        }

        function validNumberData(data, $scope) {
          var reg = /^[-]?[0-9]*[.]?[0-9]*/g;
          if (reg.test(data) && data && data.match(reg)[0] != "") {
            $scope.editData.data[$scope.row.key] = data.match(reg)[0];
          } else {
            delete $scope.editData.data[$scope.row.key];
          }
        }

        $scope.focusItemTpl = function (event, disable) {
          if (event == undefined)
            return;

          $scope.focusRowEcho = {
            row: $scope.row,
            disable: disable,
            insertIndex: 0
          };
          $scope.$emit("FocusElement", event.target);
        }

        $scope.keyDown = function (event, isTextArea) {
          if (event == undefined)
            return;

          if (event.keyCode == 38) {
            if (!isTextArea) {
              $scope.$emit("FocusPreviewInputControl");
            } else {
              var textArea = event.target;
              if (textArea.selectionStart == 0)
                $scope.$emit("FocusPreviewInputControl");
            }
          } else if (event.keyCode == 40) {
            if (!isTextArea) {
              $scope.$emit("FocusNextInputControl");
            } else {
              textArea = event.target;
              if (textArea.selectionEnd == textArea.value.length)
                $scope.$emit("FocusNextInputControl");
            }
          } else if (event.keyCode == 13) {
            if (!isTextArea)
              $scope.$emit("FocusNextInputControl");
          }
        }

        $scope.selectAndInputKeyDown = function (elem) {
          if (event.keyCode == 40 || event.keyCode == 13) {
            $scope.$emit("FocusNextInputControl");
          } else if (event.keyCode == 38) {
            $scope.$emit("FocusPreviewInputControl");
          }
        }

        $scope.electAndInputFocusItemTpl = function (event) {
          $scope.focusRowEcho = {
            row: $scope.row,
            disable: false
          };
          $scope.$emit("FocusElement", event.target);
        }

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/nursingDocItemEditCell.tpl.html",
      link: function (scope, element) {

        function inputControlBlur(e) {
          scope.focusRowEcho.insertIndex = e.target.selectionEnd;
        }

        $timeout(function () {
          element.find('.nursing-doc-edit-cell-control').off('blur', inputControlBlur).on('blur', inputControlBlur);
        })

      }
    }

    return directive;
  }
})();
