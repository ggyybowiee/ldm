(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('estimateItemEdit', estimateItemEdit);


  function estimateItemEdit(utilService, sessionService, _) {

    var directive = {
      restrict: "EA",
      scope: {
        hlpgd: "=",
        closePanel: "=",
        editData: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope) {

        var vm = this;
        vm.close = close;

        activie();

        function activie() {

          vm.savingRecordProc = {
            func: $scope.closePanel
          }
        }

        vm.saveEditButton = function () {

          var originalData = _.cloneDeep($scope.editData)


          var anyChanged = false;
          var changedHeader = [];

          _.forEach($scope.editingData.row, function (headerItem) {
            if (headerItem.isValueHeader) {

              var valueChanged = false;
              var originValue = $scope.editData.rowdata.data[headerItem.dataBind];
              var editedValue = $scope.editingData.rowdata.data[headerItem.dataBind];

              if (angular.isObject(originValue) && angular.isObject(editedValue)) {

                if (JSON.stringify(originValue) != JSON.stringify(editedValue)) {
                  valueChanged = true;
                  changedHeader.push(headerItem);
                }

              } else if (originValue != editedValue) {
                valueChanged = true;
                changedHeader.push(headerItem);
              }

              if (valueChanged) {
                anyChanged = true;
                $scope.editData.rowdata.data[headerItem.dataBind] = $scope.editingData.rowdata.data[headerItem.dataBind]
              }
            }
          });

          if (anyChanged) {

            var verifySignOnly = true;
            _.forEach(changedHeader, function (header) {
              if (header.dataType != 'verifySignature')
                verifySignOnly = false;
            })

            vm.savingRecordProc.func({
              editData: $scope.editData,
              originalData: originalData,
              verifySignOnly: verifySignOnly
            });
          } else {
            $scope.closePanel(undefined, true);
          }
        }

        vm.cancelEditButton = function () {
          return $scope.closePanel(undefined, true);
        }

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateDocControl/estimateItemEdit.tpl.html",
      link: function (scope) {

        function getDataValueScore(dataValue) {

          var score = 0;
          if (dataValue == null) {
            return score;
          } else if (angular.isArray(dataValue) && dataValue.length > 0) {

            for (var i = 0; i < dataValue.length; i++)
              score += getDataValueScore(dataValue[i]);
          } else if (angular.isObject(dataValue)) {
            score += (!utilService.isRealNum(dataValue.value) ? 0 : parseInt(dataValue.value));
          } else {
            score += (!utilService.isRealNum(dataValue) ? 0 : parseInt(dataValue));
          }
          return score;
        }

        var dataWatcher = scope.$watch('editData', function (value) {

          scope.editingData = _.cloneDeep(value);

          angular.element('.estimate-item-edit-form-panel')[0].scrollTop = 0;
          recalcScoreAndRiskLevel();
          recalcFormula();
        });

        scope.$on('$destroy', function () {
          dataWatcher();
        });

        scope.valueChanged = function () {
          recalcScoreAndRiskLevel();
          recalcFormula();
        }

        function recalcScoreAndRiskLevel() {
          if (!scope.editingData) {
            return;
          }

          var totalScore = 0;
          var totalKeyDataBinds = [],
            levelKeyDataBinds = [];

          // 评估总分计算项
          for (var i = 0; i < scope.editingData.row.length; i++) {

            var header = scope.editingData.row[i];
            var dataValue = scope.editingData.rowdata.data[header.dataBind];
            if (header.isSum) {
              totalKeyDataBinds.push(header.dataBind);
              continue;
            } else if (header.isLevel) {
              levelKeyDataBinds.push(header);
              continue;
            } else if (!header.countable) {
              continue;
            }

            totalScore += getDataValueScore(dataValue);
          }

          for (i = 0; i < totalKeyDataBinds.length; i++) {
            scope.editingData.rowdata.data[totalKeyDataBinds[i]] = totalScore;
          }

          // 评估等级绑定项
          var riskCodeDic = sessionService.getDicHelper().dic.riskLevel;
          for (i = 0; i < riskCodeDic.length; i++) {
            var riskRange = scope.hlpgd.tpl.components.risk[riskCodeDic[i].dicCode];
            if (totalScore >= riskRange[0] && totalScore <= riskRange[1]) {
              break;
            }
          }

          var risk = (i < riskCodeDic.length) ? riskCodeDic[i].dicCode : (_.find(riskCodeDic, {
            'dicName': '无'
          }).dicCode);
          for (i = 0; i < levelKeyDataBinds.length; i++) {

            var levelHeader = levelKeyDataBinds[i];

            for (var j = 0; j < levelHeader.opts.length; j++) {
              if (levelHeader.opts[j].id == risk) {
                scope.editingData.rowdata.data[levelKeyDataBinds[i].dataBind] = levelHeader.opts[j];
                break;
              }
            }
          }
        }

        // 计算数学公式
        function recalcFormula() {

          if (!scope.editingData) {
            return;
          }

          for (var i = 0; i < scope.editingData.row.length; i++) {
            var header = scope.editingData.row[i];
            if (!header.fomula) {

            }
          }
        }
      }
    }

    return directive;
  }
})();
