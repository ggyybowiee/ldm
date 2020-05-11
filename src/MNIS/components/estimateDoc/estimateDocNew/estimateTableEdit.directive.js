(function () {
  "use strict";
  angular
    .module("lachesis-mnis")
    .directive("estimateTableEdit", estimateTableEdit);

  /** @ngInject */
  function estimateTableEdit($timeout, estimateTplUtil, moment, modalService, $q) {
    var directive = {
      restrict: "EA",
      scope: {
        hlpgd: "=",
        tplData: "=",
        sheet: "=",
        patInfo: "=",
        reloadSheets: "&",
        pageEcho: "=",
        save: "=",
        remove: "=",
        editLink: "=",
        newDataEcho: "=",
        pageScale: "="
      },
      replace: true,
      transclude: true,
      controller: function (
        $scope,
        $stateParams,
        sessionService,
        sysRest,
        _
      ) {
        var vm = this;

        vm.printPreview = 0;

        var confHelper = sessionService.getConfHelper();
        vm.conf = confHelper.conf;

        sysRest.getHosInfo().then(function (response) {
          $scope.hospitalName = response.hosDisplayName;
          $scope.hospitalLogo = response.hosLogoPath;
        });

        initialize();

        function initialize() {
          //  鼠标选择初始化
          vm.mouseOnIndex = {
            tableIndex: -1,
            index: -1
          };

          // 行右键
          vm.contextMenuConfig = [
            [
              "删除该行",
              function ($rowScope, $event) {
                modalService.open({
                  templateUrl: "common/directives/confirm/confirm.tpl.html",
                  size: "sm",
                  ok: function () {
                    var tableCount = $scope.hlpgd.tpl.components.tablesV11.length;
                    for (var i = 0; i < tableCount; i += 1) {
                      $scope.remove(
                        $event,
                        $scope.hlpgd.data[i],
                        $rowScope.$index
                      );
                    }
                    return true;
                  },
                  data: {
                    metaData: {
                      title: "确定删除该行？",
                      type: "confirm"
                    }
                  }
                });

              },
              function () {
                return true;
              }
            ]
          ];
        }

        // 获取打印预览方式
        vm.getPrintPreview = function () {
          if ($scope.hlpgd.tpl.components.combineType == "combine") return -1;
          return vm.printPreview;
        };

        var hlpgdWathcer = $scope.$watch("hlpgd", function () {
          // 页面尺寸
          vm.getPageSize();
          vm.reloadEstiamteTable();
          vm.dataRowEditOnClose(null, true);
        });
        $scope.$on("$destroy", hlpgdWathcer);

        var printPreviewWatcher = $scope.$watch("pageEcho.curPage", function (value) {
          // 页面尺寸
          vm.printPreview = ($scope.pageEcho.curPage - 1) % 2;
          vm.reloadEstiamteTable();
        });
        $scope.$on("$destroy", printPreviewWatcher);

        var newDataEchoWatcher = $scope.$watch('newDataEcho', function (value) {
          if (value) {
            vm.editDataOnClick(value.data, value.bindHeader, value.tableIndex, value.rowIndex, true);
          }
        });
        $scope.$on("$destroy", newDataEchoWatcher);

        vm.validationOption = {};

        // 获取页面尺寸
        vm.getPageSize = function () {
          var pageSize = $scope.hlpgd.tpl.size.split(",");
          vm.pageSize = {
            width: pageSize[0] + "mm",
            height: pageSize[1] + "mm"
          };

          vm.innerSize = {};

          var margin = estimateTplUtil.getPagePadding($scope.hlpgd.tpl.margin);
          vm.margin =
            margin.top +
            "mm " +
            margin.right +
            "mm " +
            margin.bottom +
            "mm " +
            margin.left +
            "mm ";

          vm.innerSize.width = (pageSize[0] - margin.right - margin.left) + 'mm';
          vm.innerSize.height = (pageSize[1] - margin.top - margin.bottom) + 'mm';
        };

        // 返回显示值
        vm.getDisplayTextForCell = function (item, header, index, tableIndex) {

          if (angular.isArray(item)) {
            var displayText = "";
            for (var i = 0; i < item.length; i++) {
              if (i != 0) displayText += ",";
              displayText += vm.getDisplayTextForCell(item[i]);
            }
            return displayText;
          } else {

            if (item == undefined)
              return "";

            if (item == '2018-09-02')
              return item;


            if (header && (header.dataType == "date")) {

              var curValue = $scope.pageEcho.recordDataInPage[tableIndex][index];
              if (curValue == "empty")
                return "";


              if (index > 0) {
                var preValue =
                  $scope.pageEcho.recordDataInPage[tableIndex][index - 1];
                if (preValue.data[header.dataBind] == curValue.data[header.dataBind])
                  return "";
              }
            }

            return item.shortcut || item.value || item.text || item;
          }
        };

        // 横版判断是否需要显示多表
        vm.horizonTableVisible = function (index) {
          if ($scope.hlpgd.tpl.orientation != "horizon") return false;

          if ($scope.hlpgd.tpl.components.combineType == "combine") return true;

          if (!_.get($scope.pageEcho, "curPage")) {
            return true;
          }

          return (
            ($scope.pageEcho.curPage - 1) %
            $scope.hlpgd.tpl.components.tablesV11.length ==
            index
          );
        };

        // 纵版数据表头
        vm.getVerticalDataTableHeader = function (tableIndex, index) {
          var headerRow =
            $scope.hlpgd.tpl.components.showTableHeader[tableIndex][index];
          var dataHeader;
          for (var i = 0; i < headerRow.length; i++) {
            if (!headerRow[i].isValueHeader) return null;

            if (headerRow[i].isDataBind) {
              dataHeader = headerRow[i];
              break;
            }
          }

          if (!dataHeader) return null;

          var _count = $scope.hlpgd.tpl.rowNum || 1;
          var colHeader = [];
          for (i = 0; i < parseInt(_count); i++) {
            colHeader.push(dataHeader);
          }
          return colHeader;
        };

        // 获取html文档
        vm.getHtml = function (str) {
          if (str) return str.replace(/\n/g, "<br />");
          return "";
        };

        // 获取列状态
        vm.colMouseEnterWhenVertical = function (tableIndex, index) {
          vm.mouseOnIndex = {
            tableIndex: tableIndex,
            index: index
          };
        };

        vm.colMouseLeaveWhenVertical = function () {
          vm.mouseOnIndex = {
            tableIndex: -1,
            index: -1
          };
        };

        vm.getColSytleWhenVertical = function (dataRow, tableIndex, index) {
          if (dataRow == "empty") {
            return "estiamte-data-container-disable";
          } else if (
            index == vm.mouseOnIndex.index &&
            tableIndex == vm.mouseOnIndex.tableIndex
          ) {
            // console.log(tableIndex, index);
            return "estiamte-data-container-hover";
          } else {
            return "";
          }
        };

        vm.editDataOnClick = function (
          dataRow,
          bindHeader,
          tableIndex,
          rowIndex,
          isNewItem
        ) {
          if (dataRow == "empty" || $stateParams.openOuter) return;

          vm.editingData = {
            row: angular.copy(bindHeader),
            rowdata: dataRow,
            isNewItem: isNewItem
          };
          vm.isEditPanelShow = true;
          $scope.$emit('estimateRecordEditPanelOpen');
          vm.tableIndex = tableIndex;
          vm.rowIndex = rowIndex;
        };

        // 编辑行窗口关闭
        vm.dataRowEditOnClose = function (saveData, notSave) {

          if (!notSave)
            return vm.saveDoc(vm.rowIndex, vm.tableIndex, saveData.editData.isNewItem, saveData.verifySignOnly).then(function () {
              vm.isEditPanelShow = false;
              $scope.$emit('estimateRecordEditPanelClose');

              delete vm.editingData;
              delete vm.tableIndex;
              delete vm.rowIndex;
            }, function () {
              // 恢复初始值
              _.forEach(saveData.originalData.row, function (headerItem) {
                if (headerItem.isValueHeader) {
                  saveData.editData.rowdata.data[headerItem.dataBind] = saveData.originalData.rowdata.data[headerItem.dataBind]
                }

              });
            });
          else {
            vm.isEditPanelShow = false;
            $scope.$emit('estimateRecordEditPanelClose');
            delete vm.editingData;
            delete vm.tableIndex;
            delete vm.rowIndex;

            return true;
          }
        };

        // 重新加载评估单
        vm.reloadEstiamteTable = function () {

          // 计算本页所在的日期
          var tableData = $scope.pageEcho.recordDataInPage || [];
          if ($scope.hlpgd.tpl.orientation == 'horizon' && tableData.length > 0) {
            tableData = tableData[0];
          }

          if (tableData.length == 0) {
            vm.startTime = vm.endTime = moment(new Date()).format('YYYY-MM-DD');
          } else {
            vm.startTime = moment(_.get(tableData[0], ('recordDate'))).format('YYYY-MM-DD');

            var lastItemIndex = tableData.length - 1;
            while (lastItemIndex >= 0) {
              if (tableData[lastItemIndex] == "empty")
                lastItemIndex--;
              else break;
            }
            vm.endTime = moment(_.get(tableData[lastItemIndex], 'recordDate')).format('YYYY-MM-DD');
          }

          $timeout(function () {

            var tables = $scope.hlpgd.tpl.components.tablesV11;

            var totalHeightRate = 0;
            _.forEach(tables, function (item) {
              totalHeightRate += _.get(item, "heightRate") ? item.heightRate : 20;
            })

            var height =
              angular.element(".estimate-config-page-inner-panel").height() -
              (angular.element(".doc-header").height() +
                angular.element(".doc-footer").height());
            vm.contentHeight = height - $scope.hlpgd.tpl.components.tableSpace;
            // console.log(vm.contentHeight);

            if ($scope.hlpgd.tpl.orientation === 'vertical') {
              angular.element(".estimate-edit-table").height(vm.contentHeight);
            } else {

              var tableCount = tables.length;
              vm.contentHeight = height - (tableCount * $scope.hlpgd.tpl.components.tableSpace);
              if (vm.getPrintPreview() == '-1') {
                for (var i = 0; i < tables.length; i++) {
                  var tableHeight = vm.contentHeight * (_.get(tables[i], "heightRate") ? tables[i].heightRate : 20) / totalHeightRate;
                  angular.element('#estiamte-edit-table-' + i).height(tableHeight);
                }
              } else {
                angular.element('#estiamte-edit-table-' + vm.printPreview).height(vm.contentHeight);
              }
            }
          });
        };

        // 保存数据记录
        vm.saveDoc = function (rowIndex, tableIndex, isNewItem, verifySignOnly) {
          if (rowIndex == undefined) return;

          if (isNewItem) {
            rowIndex = rowIndex <= 0 ? getRowIndexInSheet(rowIndex) : rowIndex;
          } else {
            rowIndex = rowIndex < 0 ? getRowIndexInSheet(rowIndex) : rowIndex; 
          }

          return $scope.save(
            $scope.hlpgd.data[tableIndex][rowIndex],
            tableIndex,
            $scope.sheet.sheetId,
            true,
            isNewItem,
            verifySignOnly
          );
        };

        // 获取分页下数据实际的行数
        function getRowIndexInSheet(rowIndex) {

          if ($scope.hlpgd.tpl.components.combineType == 'combine') {
            rowIndex =
              ($scope.pageEcho.curPage - 1) * $scope.hlpgd.tpl.rowNum + rowIndex;
          } else if ($scope.hlpgd.tpl.components.combineType == 'seperate') {
            rowIndex =
              Math.floor(($scope.pageEcho.curPage - 1) / $scope.hlpgd.tpl.components.tablesV11.length) * $scope.hlpgd.tpl.rowNum + rowIndex;
          }
          return rowIndex;
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateDocNew/estimateTableEdit.tpl.html"
    };

    return directive;
  }
})();
