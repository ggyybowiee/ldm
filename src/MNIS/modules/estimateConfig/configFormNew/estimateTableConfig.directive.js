(function () {
  "use strict";
  angular
    .module("lachesis-mnis")
    .directive("estimateDocConfig", estimateDocConfig);

  /** @ngInject */
  function estimateDocConfig($timeout, estimateTplUtil, _, docUtil) {
    var directive = {
      restrict: "E",
      scope: {
        tpl: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, modalService, sysRest, utilService) {

        var vm = this;

        sysRest.getHosInfo().then(function (response) {
          $scope.hospitalName = response.hosDisplayName;
          $scope.hospitalLogo = response.hosLogoPath;
        });

        vm.validationOption = {};
        vm.refreshShowTable = refreshShowTable;
        vm.printPreview = "0";

        // 获取打印预览方式
        vm.getPrintPreview = function () {
          if ($scope.tpl.components.combineType == 'combine')
            return -1;
          return vm.printPreview;
        }

        // 监听tpl变化
        var tplWatcher = $scope.$watch("tpl", function (value) {
          if (value) {

            // console.log(value);

            // 页面尺寸
            var pageSize = $scope.tpl.size.split(",");
            vm.pageSize = {
              width: pageSize[0] + "mm",
              height: pageSize[1] + "mm",
              margin: "0px auto"
            };

            // 表格头数据绑定
            if (value.components.tablesV11 == undefined) {
              var table = getNewTable();
              value.components.tablesV11 = [table];
            }
            vm.newTable = value.components.tablesV11;

            // 计算新的表头布局
            refreshShowTable();
          }
        });
        $scope.$on("$destroy", tplWatcher);

        // 编辑单元格
        vm.headerCellOnClick = function (headerData, tableIndex) {
          if (headerData.subHeaders == undefined) {
            headerData.subHeaders = [];
          }

          if (headerData.opts == undefined) {
            headerData.opts = [];
          }

          var formData = {
            headerData: headerData,
            headInputTypes: vm.headInputTypes,
            showType: headerData.isValueHeader == 1 && headerData.isDataBind == 1 ?
              1 : 0,
            curOption: null
          };

          modalService.open({
            templateUrl: "MNIS/modules/estimateConfig/configFormNew/estimateTableHeaderConfig.modal.html",
            size: "xlg",
            data: {
              formData: formData,
              metaData: {
                tableHeadOption: docUtil.getCrosslineDic(),
                dataTableHeader: vm.dataTableHeader,
                tableIndex: tableIndex,
                formulaValidation: {
                  isValid: true
                }
              }
            },
            ok: function () {
              var that = this;
              that.validateFomula(that.formData.headerData.formula);
              if (!that.metaData.formulaValidation.isValid)
                return false;

              // 计算新的表头布局
              refreshShowTable();
              return true;
            },
            methodsObj: {
              addSubHeader: function () {
                headerData.subHeaders.push(newHeader(headerData.level));
              },
              removeSubHeader: function (index) {
                headerData.subHeaders.splice(index, 1);
              },
              upSubHeader: function (index) {
                if (index == 0) return;

                var header = headerData.subHeaders[index];
                headerData.subHeaders.splice(index, 1);
                headerData.subHeaders.splice(index - 1, 0, header);
              },
              downSubHeader: function (index) {
                if (index == headerData.subHeaders.length - 1) return;

                var header = headerData.subHeaders[index];
                headerData.subHeaders.splice(index, 1);
                headerData.subHeaders.splice(index + 1, 0, header);
              },
              updateSubHeader: function (header, args) {
                if (args == "isSum") {
                  if (header.isSum)
                    header.isLevel = false;
                } else if (args == "isLevel") {
                  if (header.isLevel)
                    header.isSum = false;
                }
              },
              addOption: function (event) {
                var option = newOption();
                headerData.opts.push(option);
                formData.curOption = option;

                event.stopPropagation();
              },
              removeOption: function (option) {
                var index = headerData.opts.indexOf(option);
                headerData.opts.splice(index, 1);
                index == 0 ?
                  delete formData.curOption :
                  this.optionOnSelect(index - 1);
              },
              upOption: function (option) {
                var index = headerData.opts.indexOf(option);
                if (index == 0) return;

                headerData.opts.splice(index, 1);
                headerData.opts.splice(index - 1, 0, option);
                this.optionOnSelect(index - 1);
              },
              downOption: function (option) {
                var index = headerData.opts.indexOf(option);
                if (index == headerData.opts.length - 1) return;

                headerData.opts.splice(index, 1);
                headerData.opts.splice(index + 1, 0, option);
                this.optionOnSelect(index + 1);
              },
              optionOnSelect: function (index) {
                formData.curOption = headerData.opts[index];
              },
              optionSelectSytle: function (option) {
                return option == formData.curOption ? "st-selected" : "";
              },
              dataBindChanged: function (header) {
                _.forEach(header.subHeaders, function (item) {
                  item.isDataBind = !header.isDataBind;
                });
              },
              appendDataHeader: function (header) {
                var that = this;
                if (that.formData.headerData.formula)
                  that.formData.headerData.formula = that.formData.headerData.formula + header.dataBind;
                else that.formData.headerData.formula = header.dataBind;
              },
              validateFomula: function (formula) {

                var that = this;
                if (!formula) {
                  that.metaData.formulaValidation = {
                    isValid: true
                  }
                  return;
                }

                var dataBinds = _.map(_.filter(that.metaData.dataTableHeader[that.metaData.tableIndex], 'isValueHeader'), 'dataBind');
                var variableList = estimateTplUtil.getVaraibleInFormula(formula);

                that.metaData.formulaValidation = {
                  isValid: true
                }
                for (var i = 0; i < variableList.length && that.metaData.formulaValidation.isValid; i++) {
                  if (dataBinds.indexOf(variableList[i]) == -1) {
                    that.metaData.formulaValidation = {
                      isValid: false,
                      content: '不存在名称为[' + variableList[i] + ']的表头绑定值'
                    }
                  }
                }
              }
            }
          });
        };

        // 确定表格分配的面积是否足够布局
        vm.renderSizeEnough = function (index) {

          var actualHeight = angular.element("#estiamte-config-table-" + index).height();
          var calcHeight = (vm.getPrintPreview() == '-1' || $scope.tpl.orientation === "vertical") ? vm.newTable[index].actualHeight : vm.contentHeight;

          // console.log(index, actualHeight, calcHeight, Math.abs(calcHeight - actualHeight) < 2 ? "" : "size-not-enough");

          return Math.abs(calcHeight - actualHeight) < 2 ? "" : "size-not-enough";
        }

        // 新的选项
        function newOption() {
          return {
            id: "1",
            text: "1",
            value: "1",
            shortcut: ""
          };
        }

        // 生成新的表格
        function getNewTable() {
          var newTable = {};
          newTable.subHeaders = [newHeader(0)];
          newTable.heightRate = 10;
          return newTable;
        }

        // 生成新的Header
        function newHeader(parentLevel) {
          return {
            textAlign: "center",
            title: "新的表头",
            subHeaders: [],
            level: parentLevel + 1,
            isValueHeader: true,
            isDataBind: parentLevel == 0,
            editable: true,
            dataBind: 'dataBind_1',
            dataType: 'text'
          };
        }

        // 横版数据表头
        vm.getHorizonDataTableHeader = function () {

          var _count = $scope.tpl.rowNum - 1 || 1;
          return new Array(parseInt(_count));
        };

        // 纵版数据表头
        vm.getVerticalDataTableHeader = function (tableIndex, index) {
          var headerRow = vm.showTableHeader[tableIndex][index];
          var dataHeader;
          for (var i = 0; i < headerRow.length; i++) {
            if (!headerRow[i].isValueHeader) return null;

            if (headerRow[i].isDataBind) {
              dataHeader = headerRow[i];
              break;
            }
          }

          if (!dataHeader) return null;

          var _count = $scope.tpl.rowNum || 1;
          var colHeader = [];
          for (i = 0; i < parseInt(_count); i++) {
            colHeader.push(dataHeader);
          }
          return colHeader;
        };

        // 添加表格事件
        vm.addTableButtonOnClick = function () {
          vm.newTable.push(getNewTable());
          refreshShowTable();
        }

        // 右键菜单
        vm.contextMenuConfig = [
          [
            "往后插入一行",
            function ($rowScope) {

              var tableIndex = $rowScope.$parent.$parent.$index;
              var index = vm.newTable[tableIndex].subHeaders.indexOf($rowScope.header);
              var header = newHeader(0);
              vm.newTable[tableIndex].subHeaders.splice(index + 1, 0, header);
              refreshShowTable();
            },
            function ($rowScope) {
              return $rowScope.header.level == 1;
            }
          ],
          [
            "向前挪动",
            function ($rowScope) {
              var tableIndex = $rowScope.$parent.$parent.$index;
              var index = vm.newTable[tableIndex].subHeaders.indexOf($rowScope.header);
              var tmp = vm.newTable[tableIndex].subHeaders[index];
              vm.newTable[tableIndex].subHeaders.splice(index, 1);
              vm.newTable[tableIndex].subHeaders.splice(index - 1, 0, tmp);
              refreshShowTable();
            },

            function ($rowScope) {
              var tableIndex = $rowScope.$parent.$parent.$index;
              return (
                $rowScope.header.level == 1 &&
                vm.newTable[tableIndex].subHeaders.indexOf($rowScope.header) != 0
              );
            }
          ],
          [
            "删除该(行/列)",
            function ($rowScope) {
              var tableIndex = $rowScope.$parent.$parent.$index;
              var index = vm.newTable[tableIndex].subHeaders.indexOf($rowScope.header);
              vm.newTable[tableIndex].subHeaders.splice(index, 1);
              refreshShowTable();
            },
            function ($rowScope) {

              var tableIndex = $rowScope.$parent.$parent.$index;
              return (
                $rowScope.header.level == 1 && vm.newTable[tableIndex].subHeaders.length > 1
              );
            }
          ],
          [
            "删除该单元格",
            function ($rowScope) {
              var tableIndex = $rowScope.$parent.$parent.$index;
              var parent = searchParentHeaderDFS(vm.newTable[tableIndex], $rowScope.header);
              parent.subHeaders.splice(
                parent.subHeaders.indexOf($rowScope.header),
                1
              );
              refreshShowTable();
            },
            function ($rowScope) {
              return $rowScope.header.level > 1;
            }
          ],
          [
            "删除该表",
            function ($rowScope) {

              var tableIndex = $rowScope.$parent.$parent.$index;
              vm.newTable.splice(tableIndex, 1);
              refreshShowTable();
            }
          ]
        ];

        // 列宽改变时
        vm.colWidthRateOnChanged = function (tableIndex) {
          refreshTableColWidth(vm.newTable[tableIndex], vm.titleTableHeader[tableIndex]);
        };

        //重新生成显示的表格
        $scope.refreshShowTable = refreshShowTable;



        function refreshShowTable() {

          vm.showTableHeader = [];
          vm.dataTableHeader = [];
          vm.titleTableHeader = [];

          $scope.tpl.components.showTableHeader = vm.showTableHeader;
          $scope.tpl.components.dataTableHeader = vm.dataTableHeader;
          $scope.tpl.components.titleTableHeader = vm.titleTableHeader;

          for (var i = 0; i < vm.newTable.length; i++) {

            var table = vm.newTable[i];

            var padding = estimateTplUtil.getPagePadding($scope.tpl.margin);
            vm.pageSize.padding =
              padding.top +
              "mm " +
              padding.right +
              "mm " +
              padding.bottom +
              "mm " +
              padding.left +
              "mm ";

            calcHeaderDeep(table);
            if ($scope.tpl.orientation === "horizon") {
              vm.showTableHeader.push(refreshShowTableHorizon(table));
            } else if ($scope.tpl.orientation === "vertical") {
              vm.showTableHeader.push(refreshShowTableVertical(table));
            }

            vm.dataTableHeader.push(getDataTableHeaderDFS(table));
            vm.titleTableHeader.push(getTitleTableHeaderDFS(table));
            refreshTableColWidth(table, vm.titleTableHeader[i]);
          }
        }

        // 重新记算列宽
        function refreshTableColWidth(table, titleTableHeader) {

          $timeout(function () {
            var totalWidthRate = 0;
            for (var i = 0; i < titleTableHeader.length; i++) {
              totalWidthRate += titleTableHeader[i].colWidthRate;
            }

            var totalHeightRate = 0;
            _.forEach(vm.newTable, function (item) {
              totalHeightRate += _.get(item, "heightRate") ? item.heightRate : 20;
            })

            var padding = estimateTplUtil.getPagePadding($scope.tpl.margin);

            var width = 0;

            var height =
              angular.element(".estimate-config-page-inner-panel").height() -
              (angular.element(".estimate-config-table-header").height() +
                angular.element(".estimate-config-table-footer").height());

            console.log("panel:", angular.element(".estimate-config-page-inner-panel").height());
            console.log("header:", angular.element(".estimate-config-table-header").height());
            console.log("footer:", angular.element(".estimate-config-table-footer").height());

            if ($scope.tpl.orientation === 'vertical') {
              vm.contentHeight = height - $scope.tpl.components.tableSpace;
              angular.element(".estimate-config-table").height(vm.contentHeight);
              _.forEach(vm.newTable, function (item) {
                item.actualHeight = vm.contentHeight;
              })
            } else {

              var tableCount = vm.newTable.length;
              vm.contentHeight = height - (tableCount * $scope.tpl.components.tableSpace);
              if (vm.getPrintPreview() == '-1') {
                for (i = 0; i < vm.newTable.length; i++) {
                  vm.newTable[i].actualHeight = vm.contentHeight * (_.get(vm.newTable[i], "heightRate") ? vm.newTable[i].heightRate : 20) / totalHeightRate;
                  angular.element('#estiamte-config-table-' + i).height(vm.newTable[i].actualHeight);
                }
              } else {
                angular.element('#estiamte-config-table-' + vm.printPreview).height(vm.contentHeight);
              }
            }

            console.log("contentHeight", vm.contentHeight);


            if ($scope.tpl.orientation === "horizon") {
              width = parseInt(vm.pageSize.width) - padding.left - padding.right;
              // 移除border的宽度
              width -= titleTableHeader.length + 1;
            } else if ($scope.tpl.orientation === "vertical") {
              width = height;
              // 移除border的宽度
              width -= titleTableHeader.length + 1;
            }
            var totalWidthCheck = 0;
            for (i = 0; i < titleTableHeader.length; i++) {
              titleTableHeader[i].colWidth = (width * titleTableHeader[i].colWidthRate) / totalWidthRate;
              totalWidthCheck += titleTableHeader[i].colWidth;
            }
            calcAllHeaderWidthDFS(table);
          })
        }

        // 计算所有表头的宽度
        function calcAllHeaderWidthDFS(root) {

          if (!root.subHeaders || root.subHeaders.length == 0)
            return root.colWidth;

          var colWidth = 0;
          _.forEach(root.subHeaders, function (item) {
            calcAllHeaderWidthDFS(item);
            colWidth += item.colWidth;
          });
          root.colWidth = colWidth;
        }

        //重新生成水平显示的表格
        function refreshShowTableHorizon(newTable) {

          var headerQueue = [];
          var showTableHeader = [];
          var levelDeep = newTable.deep;
          var headerRow;
          var curLevel = 0;
          var i;

          for (i = 0; i < newTable.subHeaders.length; i++)
            headerQueue.push(newTable.subHeaders[i]);
          while (headerQueue.length != 0) {
            var header = headerQueue[0];
            headerQueue.splice(0, 1);
            if (header.level > curLevel) {
              headerRow = [];
              showTableHeader.push(headerRow);
              curLevel++;
              levelDeep--;
            }

            headerRow.push(header);
            header.rowspan =
              header.subHeaders.length === 0 ? levelDeep - header.deep + 1 : 1;
            if (!header.isValueHeader && header.childrenCnt != 0) {
              header.rowspan += isNaN($scope.tpl.rowNum) ?
                1 :
                parseInt($scope.tpl.rowNum);
            }
            header.colspan = header.childrenCnt;

            for (i = 0; i < header.subHeaders.length; i++)
              headerQueue.push(header.subHeaders[i]);
          }
          return showTableHeader;
        }

        //重新生成垂直显示的表格
        function refreshShowTableVertical(newTable) {

          var showTableHeaderVertical = [];
          var newRows = [];
          showTableHeaderVertical.push(newRows);
          getVerticalShowTableHeaderDFS(
            newTable,
            true,
            newTable.deep,
            newRows,
            showTableHeaderVertical
          );

          return showTableHeaderVertical;
        }

        function getVerticalShowTableHeaderDFS(
          root,
          isRoot,
          levelDeep,
          rows,
          showTableHeaderVertical
        ) {
          if (!isRoot) {
            rows.push(root);
            root.rowspan = root.childrenCnt;
            root.colspan =
              root.subHeaders.length === 0 ? levelDeep - root.deep + 1 : 1;
            if (!root.isValueHeader && root.childrenCnt != 0) {
              root.colspan += isNaN($scope.tpl.rowNum) ?
                1 :
                parseInt($scope.tpl.rowNum);
            }
          }

          if (root.subHeaders == undefined || root.subHeaders.length == 0) {
            return;
          }

          for (var i = 0; i < root.subHeaders.length; i++) {
            if (i == 0)
              getVerticalShowTableHeaderDFS(
                root.subHeaders[i],
                false,
                levelDeep - 1,
                rows,
                showTableHeaderVertical
              );
            else {
              var newRows = [];
              showTableHeaderVertical.push(newRows);
              getVerticalShowTableHeaderDFS(
                root.subHeaders[i],
                false,
                levelDeep - 1,
                newRows,
                showTableHeaderVertical
              );
            }
          }
        }

        // 计算Header每个结点的深度
        function calcHeaderDeep(root) {
          var maxDeep = 1;
          var childrenCnt = root.subHeaders.length === 0 ? 1 : 0;

          if (root.subHeaders.length === 0 && !root.colWidthRate)
            root.colWidthRate = 10;

          for (var i = 0; i < root.subHeaders.length; i++) {

            root.subHeaders[i].isParentDataBind = root.isParentDataBind || root.isDataBind;
            if (root.subHeaders[i].isParentDataBind)
              root.subHeaders[i].isDataBind = false;

            root.subHeaders[i].isParentValueHeader = root.isParentValueHeader || root.isValueHeader;
            maxDeep = Math.max(maxDeep, calcHeaderDeep(root.subHeaders[i]) + 1);
            childrenCnt += root.subHeaders[i].childrenCnt;
          }

          root.deep = maxDeep;
          root.childrenCnt = childrenCnt;
          root.colWidth = 0;
          return root.deep;
        }

        // 获取html文档
        vm.getHtml = function (str) {
          if (str)
            return str.replace(/\n/g, "<br />");
          return "";
        };

        //查找结点的父结点
        function searchParentHeaderDFS(root, header) {
          if (root.subHeaders.indexOf(header) != -1) {
            return root;
          }

          var result = null;
          for (var i = 0; i < root.subHeaders.length && result == null; i++) {
            result = searchParentHeaderDFS(root.subHeaders[i], header);
          }

          return result;
        }

        // 获取数据表头
        function getDataTableHeaderDFS(root) {
          var dataTableHeader = [];

          for (var i = 0; i < root.subHeaders.length; i++) {
            if (!root.subHeaders[i].isValueHeader) {
              dataTableHeader.push(root.subHeaders[i]);
              continue;
            }

            if (root.subHeaders[i].isDataBind) {
              dataTableHeader.push(root.subHeaders[i]);
            } else {
              var subDataTableHeader = getDataTableHeaderDFS(
                root.subHeaders[i]
              );
              for (var j = 0; j < subDataTableHeader.length; j++) {
                dataTableHeader.push(subDataTableHeader[j]);
              }
            }
          }

          return dataTableHeader;
        }

        // 获取标题表头
        function getTitleTableHeaderDFS(root) {
          var titleTableHeader = [];
          if (root.subHeaders.length == 0) titleTableHeader.push(root);
          for (var i = 0; i < root.subHeaders.length; i++) {
            var subDataTableHeader = getTitleTableHeaderDFS(root.subHeaders[i]);
            for (var j = 0; j < subDataTableHeader.length; j++) {
              titleTableHeader.push(subDataTableHeader[j]);
            }
          }

          return titleTableHeader;
        }

        vm.getEstiamteHeaderClass = function (header) {

          var className = "divide-show ";
          if (header.crossline == "L")
            className += "table-seperate-line-td-l";
          else if (header.crossline == "R")
            className += "table-seperate-line-td-r";

          if (estimateTplUtil.headerDataBindCheck(header) == undefined)
            className += " estimate-config-table-header-td";
          else className += " estimate-config-table-header-td-something-wrong";
          return className;
        }

        //  数据类型定义
        vm.headInputTypes = [{
            type: "text",
            desc: "文本"
          },
          {
            type: "textarea",
            desc: "多行文本"
          },
          {
            type: "multiSelect",
            desc: "多选"
          },
          {
            type: "radio",
            desc: "单选"
          },
          {
            type: "select",
            desc: "下拉单选"
          },
          {
            type: "select2",
            desc: "下拉多选"
          },
          {
            type: "datetime",
            desc: "日期时间"
          },
          {
            type: "date",
            desc: "日期"
          },
          {
            type: "time",
            desc: "时间"
          },
          {
            type: "signature",
            desc: "签名"
          },
          {
            type: "verifySignature",
            desc: "审核签名"
          }
        ];
      },
      controllerAs: "vm",
      templateUrl: "MNIS/modules/estimateConfig/configFormNew/estimateTableConfig.tpl.html",
      link: function (scope) {

        $timeout(function () {
          scope.refreshShowTable();
        });
      }
    };

    return directive;
  }
})();
