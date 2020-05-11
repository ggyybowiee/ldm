(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("nursingDoc", nursingDoc);

  /** @ngInject */
  function nursingDoc($q, _, $location, modalService, sessionService, nursingRecordCustomPageUtil) {
    var directive = {
      restrict: "EA",
      scope: {
        tpl: "=",
        data: "=", //绘制数据
        methods: "=", //键盘事件
        echo: "=", //回显
        delData: "=", //删除数据
        editingRow: "=",
        showData: "=",
        rawData: "=",
        sheet: "=",
        altPage: "=",
        lineHeight: "=",
        scrollPage: "=",
        printFromThisRow: "=",
        currentPageColumns: "=",
        setColumns: "=",
        inputPage: "=",
        inputDisabled: "@",
        rowMark: "@",
        loadPageData: "=",
        patientInfo: "=",
        directToPage: "="
      },
      replace: true,
      templateUrl: "MNIS/components/nursingDoc/canvas.tpl.html",
      link: linkFunc,
      controller: ctrlFunc,
      controllerAs: "doc",
      bindToController: true
    };

    return directive;

    function linkFunc(scope, el) {
      var height = 72,
        borderWidth = 0.2,
        padding = 10,
        size,
        unit,
        defer = $q.defer(),
        vm = scope.doc;
      var configHelper = sessionService.getConfHelper();
      var conf = configHelper.conf;

      var attendSameTimeShow =
        _.get(conf, "attendSameTimeShow.configValue") === "1";

      var watchers = {};
      var listeners = {};

      vm.scrollPage = function (page, row) {
        var offset = vm.sheet.$offsetPage + 1,
          total = vm.sheet.$totalPage,
          row = row || 0;
        var diff =
          angular.element(".table-border-pages").height() -
          angular.element(".table-content-wrapper").height();
        var pageUnit = diff / total;
        var pageOffset = (page - offset) * pageUnit;
        var rowOffset = (row / vm.sheet.tplRowNum) * pageUnit;
        angular
          .element(".table-content-wrapper")
          .scrollTop(pageOffset + rowOffset);
      };

      watchers.tplWatcher = scope.$watch(
        "doc.tpl",
        function (tpl) {
          if (tpl && tpl.size) {
            var pageSize = tpl.size.split(",");
            size = parseInt(pageSize[0]);
            unit = "mm";
            vm.pageWidth = size;
            vm.unit = unit;
            vm.rowsPerPage = _.range(tpl.rowNum);
            var docs = headlerCompnents();
            vm.headerDivs = docs.headers;
            vm.contentDivs = docs.contents;
            vm.docWidth = _.chain(docs.contents)
              .map("calcWidth")
              .reduce(function (meo, p) {
                return +meo + +p;
              }, 0)
              .value();
            vm.docWidthStyle =
              "calc(" + vm.docWidth + "mm + " + vm.contentDivs.length + "px)";
            defer.resolve(tpl);
          }
        },
        true
      );

      watchers.showDataWatcher = scope.$watch(
        "doc.showData",
        function (value) {

          if (value && value.length > 0 && value[0].hasOwnProperty('dateHidden')) {

          } else {
            defer.promise.then(function () {
              handleShowData(value);
            });
          }


          // 判断当前页是否为空白页
          vm.echo.isCurrentBlankPage = false;
          if (value && value.length > 0) {
            var isCurrentBlankPage = true;
            _.forEach(value, function (item) {
              isCurrentBlankPage = isCurrentBlankPage && item.blankPage;
            });
            vm.echo.isCurrentBlankPage = isCurrentBlankPage;
          }
        },
        true
      );

      listeners.firstAddData = scope.$on("firstAddData", handleShowData);

      // 清除$watcher
      scope.$on("$destroy", function () {
        Object.keys(watchers).forEach(function (watcherName) {
          watchers[watcherName]();
        });

        Object.keys(listeners).forEach(function (name) {
          listeners[name]();
        });
      });

      scope.$on("firstAddData", handleShowData);

      function handleShowData(value) {
        var newRows = 1;
        var preNotStaticRow = null;

        // var data = value.name === "firstAddData" ? arguments[1] : value;
        var data = value || [];

        _.forEach(data, function (item) {
          preNotStaticRow = preNotStaticRow || item;
          item.tempStamp = new Date().getTime();
          if (newRows % vm.tpl.rowNum === 1) {
            item.dateHidden = false;
            item.timeHidden = false;
          } else if (
            preNotStaticRow.recordDate &&
            item.recordDate &&
            item.recordDate.split("T")[0] ===
            preNotStaticRow.recordDate.split("T")[0] &&
            !item.inOutStatistics
          ) {
            if (
              attendSameTimeShow &&
              item.recordDate.split("T")[1] ===
              preNotStaticRow.recordDate.split("T")[1]
            ) {
              item.timeHidden = true;
            }
            item.dateHidden = true;
          } else {
            item.timeHidden = false;
            item.dateHidden = false;
          }

          newRows += item.$count;

          if (!item.inOutStatistics) {
            preNotStaticRow = item;
          }
        });
      }

      function headlerCompnents() {
        var components = angular.copy(vm.tpl.components),
          headers,
          contents = [],
          totalUnit,
          cellWidth;
        //让header形成树形结构
        _.each(components, function (item) {
          var sup;
          if (item.sup) {
            sup = _.find(components, {
              id: item.sup
            });
            sup.subs || (sup.subs = []);
            sup.subs.push(item);
          }
        });
        headers = _.chain(components)
          .filter(isText)
          .sortBy("index")
          .value();
        _.chain(headers)
          .filter(isTop)
          .each(function (item) {
            item.subs = _.sortBy(item.subs, "index");
          })
          .value();
        _.each(headers, function (item) {
          if (isCommon(item)) {
            contents.push(item);
          } else {
            _.each(item.subs, function (sub) {
              contents.push(sub);
            });
          }
        });
        totalUnit = _.chain(contents)
          .reduce(function (memo, item) {
            return memo + item.width;
          }, 0)
          .value();
        cellWidth =
          (size -
            padding * 2 -
            (contents.length + 1) * borderWidth -
            contents.length / 10) /
          totalUnit;
        _.each(contents, function (item) {
          if (isBottom(item)) {
            item.calcWidth = +(item.width * cellWidth).toFixed(2);
          }
        });
        _.each(headers, function (item) {
          if (isCommon(item)) {
            item.calcWidth = +(item.width * cellWidth).toFixed(2);
          }
          item.calcHeight = height;
        });
        return {
          headers: headers,
          contents: contents
        };
      }

      function calcDataRows(data) {
        if (data.rowSize === 0) {
          return 0;
        } else if (data.inOutStatistics) {
          return 1;
        }
        data = data.data;
        var result = 1;
        _.each(data, function (value, key) {
          var valLength = calcTextLength(value);
          var match = _.find(vm.contentDivs, {
            key: key
          });
          var count;
          if (match) {
            count = Math.ceil((valLength * +match.font) / match.calcWidth);
            result = Math.max(result, count);
          }
        });
        return result;
      }

      function calcTextLength(text) {
        var length = 0,
          exp = /[\u00ff-\uffff]/;
        _.each(text, function (unit) {
          if (exp.test(unit)) {
            length += 1;
          } else {
            length += 0.5;
          }
        });
        return length;
      }

      function isValue(item) {
        return item.double !== "1";
      }

      function isText(item) {
        return angular.isUndefined(item.sup);
      }

      function isCommon(item) {
        return item.double === "0";
      }

      function isTop(item) {
        return item.double === "1";
      }

      function isBottom(item) {
        return angular.isDefined(item.sup);
      }
    }

    function ctrlFunc($rootScope, $scope, sessionService, $q, nursingRest) {
      var vm = this;
      var profile = sessionService.getProfile();
      var configHelper = sessionService.getConfHelper();
      var conf = configHelper.conf;

      vm.getHtml = $rootScope.getHtml;

      vm.conf = conf;
      vm.openCustomColumnEdit = openCustomColumnEdit;
      vm.echo.openCustomColumnEdit = openCustomColumnEdit;
      vm.setCustomValue = function (key, value) {
        if (!vm.currentPageColumns.content) {
          vm.currentPageColumns.content = {};
        }
        _.set(
          vm.currentPageColumns,
          ["content", key],
          value.replace(/\s/g, "")
        );
      };

      vm.toggleMode = function (event, isCustom) {
        vm.isEditing = isCustom;
      };

      function saveCustomHeader(setWhenPopupEdit) {
        _.chain(vm.currentPageColumns)
          .get("content")
          .keys()
          .forEach(function (key) {
            var value = _.get(vm.currentPageColumns, ["content", key]);
            _.set(
              vm.currentPageColumns,
              ["content", key],
              // value.replace(/\s/g, "")
              value
            );
          })
          .value();
        var payload = _.assign({}, vm.currentPageColumns, {
          pageNo: vm.inputPage
        });
        if (vm.columns && vm.columns.id) {
          payload.id = vm.columns.id;
        }
        vm.setColumns(payload, setWhenPopupEdit).then(vm.getColumns);
      }

      // 设置当前页自定义列
      function openCustomColumnEdit(customColumn) {

        if (!customColumn.isCustomColumn)
          return;

        var setWhenPopupEdit = false;
        if (vm.contentDivs.indexOf(customColumn) == -1) {
          setWhenPopupEdit = true;
          customColumn = _.find(vm.contentDivs, {
            'id': customColumn.id
          });
          if (!customColumn || !customColumn.isCustomColumn)
            return;
        }

        var editingCurrentPageColumns = _.cloneDeep(vm.currentPageColumns);
        var editingData = {
          content: _.get(editingCurrentPageColumns, "content") ?
            _.get(editingCurrentPageColumns, "content") : {},
          key: customColumn.key
        }

        var originContent = _.cloneDeep(editingData.content);
        var originCustomColumn = _.cloneDeep(customColumn);

        vm.customColumnEdit = {
          templateUrl: "MNIS/components/nursingDoc/customColumn/customColumnEdit.modal.html",
          size: "xlg",
          data: {
            formData: {
              content: editingData.content
            },
            metaData: {
              headerDivs: vm.headerDivs,
              unit: vm.unit,
              selectedColumn: customColumn,
              setWhenPopupEdit: setWhenPopupEdit,
              editType: 0,
              extendEcho: {
                showIndex: 1
              },
              patientInfo: vm.patientInfo,
              editingData: editingData,
              insertText: function (editData, appendText) {
                editData.content[editData.key] = appendText;
              }
            }
          },
          ok: function () {
            var that = this;

            vm.currentPageColumns = editingCurrentPageColumns;
            if (_.get(vm, "currentPageColumns.content") == undefined)
              _.set(vm, "currentPageColumns.content", that.formData.content);
            saveCustomHeader(that.metaData.setWhenPopupEdit);
            delete vm.customColumnEdit;
            return true;
          },
          cancel: function () {
            var that = this;
            _.set(
              that.formData.content,
              [originCustomColumn.key],
              originContent[originCustomColumn.key]
            );
            return true;
          },
          methodsObj: {
            selectColumn: function (item) {
              if (!item.isCustomColumn) return;

              var that = this;
              that.metaData.selectedColumn = item;
              that.metaData.editingData.key = item.key;
            },
            setCustomColumnName: function (option) {
              var that = this;
              if (!that.formData.content) {
                that.formData.content = {};
              }
              _.set(
                that.formData.content,
                [that.metaData.selectedColumn.key],
                // option.replace(/\s/g, "")
                option
              );
            },
            matchFilter: function (item) {
              var filterText = vm.customColumnEdit.data.formData.content[vm.customColumnEdit.data.metaData.selectedColumn.key];
              if (filterText == undefined || filterText == "")
                return false;

              return item.indexOf(filterText) != -1;
            },
            notMatchFilter: function (item) {
              return !vm.customColumnEdit.methodsObj.matchFilter(item);
            }
          }
        }

        modalService.open(vm.customColumnEdit);
      }

      vm.select = function (i, row) {
        vm.echo.selected = vm.data[i];

        if (row.inOutStatistics) return;

        if ($scope.doc.tpl.editType == "popup") {
          vm.echo.selectedRawData = vm.rawData[i];

        }
      };

      if (!$location.$$search.openOuter) {
        vm.contextMenuConfig = [
          [
            "删除该行",
            function ($rowScope, $event) {
              modalService.open({
                templateUrl: "common/directives/confirm/confirm.tpl.html",
                size: "sm",
                ok: function () {
                  return vm.delData(vm.showData[$rowScope.$index]);
                },
                data: {
                  metaData: {
                    title: "确定删除该行？",
                    type: "confirm"
                  }
                }
              });

            },
            function ($rowScope) {
              var checkUser = _.get(vm.showData, [
                $rowScope.$index,
                "checkUserCode"
              ]);

              if (!checkUser) {
                return true;
              } else {
                return checkUser === profile.userCode;
              }
            }
          ],
          [
            "从此行开始打印",
            function ($rowScope) {
              vm.printFromThisRow($rowScope.$index);
            },
            function ($rowScope) {
              return !vm.rawData[$rowScope.$index].blankPage;
            }
          ],
          [
            "在此插入换页符",
            function ($rowScope) {
              nursingRecordCustomPageUtil.insertCustomPage(vm.sheet, vm.rawData[$rowScope.$index],
                function () {
                  if ($scope.doc.loadPageData)
                    $scope.doc.loadPageData();
                });
            },
            function ($rowScope) {
              return !_.get(vm.rawData[$rowScope.$index], 'blankPage');
            }
          ]
        ];

        vm.customColumnMenuConfig = [
          [
            "批量修改",
            function ($rowScope) {

              var customColumn = $rowScope.sub || $rowScope.$parent.item;
              vm.openCustomColumnBatchEdit(customColumn);
            },
            function ($rowScope) {
              var customColumn = $rowScope.sub || $rowScope.$parent.item;
              return _.get(vm.currentPageColumns, ["content", customColumn.key]);
            }
          ],
          [
            "清除此页表头",
            function ($rowScope) {

              modalService.open({
                templateUrl: 'common/directives/confirm/confirm.tpl.html',
                size: 'sm',
                ok: function () {
                  var customColumn = $rowScope.sub || $rowScope.$parent.item;
                  if (_.get(vm.currentPageColumns, ["content", customColumn.key])) {
                    delete vm.currentPageColumns.content[customColumn.key];
                    saveCustomHeader();
                  }
                  return true;
                },
                data: {
                  metaData: {
                    title: '清除表头可能会影响到已经录入的内容，是否确定清除此自定义表头？',
                    type: 'confirm'
                  }
                }
              })
            },
            function () {
              return true;
            }
          ]
        ];
      } else {
        vm.contextMenuConfig = [];
        vm.customColumnMenuConfig = [];
      }



      // 批量设置自定义列
      vm.openCustomColumnBatchEdit = function (customColumn) {
        modalService.open({
          templateUrl: "MNIS/components/nursingDoc/customColumn/customColumnBatchEdit.modal.html",
          size: "lg",
          data: {
            metaData: {
              initHeaderKey: vm.currentPageColumns.content[customColumn.key],
              sheet: vm.sheet,
              tpl: vm.tpl
            },
            formData: {
              srcTitle: "",
              desTitle: "",
              containTitleSheet: [],
              containTitleSheetChange: [],
              containTitleData: [],
              containTitleDataChange: []
            }
          },
          initFn: function () {

            var that = this;
            that.formData.srcTitle = that.metaData.initHeaderKey;
            that.searchHeaderKey();
          },
          ok: function (data) {

            // 准备变更的页码信息
            var changedTitleSheetDic = {};
            var changedTitleSheet = [];
            _.forEach(data.containTitleSheetChange, function (pageChangeItem) {
              if (pageChangeItem.newValue != undefined) {

                pageChangeItem.originSrc.content[pageChangeItem.column.key] = pageChangeItem.newValue;
                if (!changedTitleSheetDic[pageChangeItem.originSrc.id]) {
                  changedTitleSheetDic[pageChangeItem.originSrc.id] = pageChangeItem.originSrc;
                }
              }
            });
            _.forEach(changedTitleSheetDic, function (value, key) {
              changedTitleSheet.push(value);
            })

            // 准备变更的记录信息
            var changedTitleDataDic = {};
            var changedTitleData = [];
            _.forEach(data.containTitleDataChange, function (dataChangeItem) {
              if (dataChangeItem.newValue != undefined) {

                var oldkey = dataChangeItem.columnData.key + '_' + dataChangeItem.oldValue;
                var newKey = dataChangeItem.columnData.key + '_' + dataChangeItem.newValue;

                if (dataChangeItem.newValue != "") {
                  dataChangeItem.originSrc.data[newKey] = dataChangeItem.originSrc.data[oldkey];
                }
                delete dataChangeItem.originSrc.data[oldkey];

                if (!changedTitleDataDic[dataChangeItem.originSrc.dataId]) {
                  changedTitleDataDic[dataChangeItem.originSrc.dataId] = dataChangeItem.originSrc;
                }
              }
            });
            _.forEach(changedTitleDataDic, function (value, key) {
              changedTitleData.push(value);
            });

            var request = [];
            if (changedTitleSheet.length > 0)
              request.push(nursingRest.updateAttendHeaders(changedTitleSheet));
            if (changedTitleData.length > 0)
              request.push(nursingRest.updateAttendDataList(changedTitleData));

            return $q.all(request).then(function () {

              if (request.length > 0) {

                $scope.$emit('toast', {
                  type: 'success',
                  content: '批量修改保存成功'
                })

                if ($scope.doc.loadPageData)
                  $scope.doc.loadPageData();
              }
            });
          },
          methodsObj: {
            selectRecord: function (selectedItems, allValue) {
              if (angular.isArray(selectedItems)) {
                _.forEach(selectedItems, function (item) {
                  if (allValue != undefined)
                    item.isSelected = allValue;
                  else {
                    item.isSelected = !item.isSelected;
                  }
                })
              } else {
                selectedItems.isSelected = !selectedItems.isSelected;
              }
            },
            modifyPageItem: function () {
              var that = this;
              _.forEach(that.formData.containTitleSheetChange, function (changeItem) {
                if (changeItem.isSelected) {
                  changeItem.newValue = that.formData.desTitle;
                }
              });
            },
            modifyRecordItem: function () {
              var that = this;
              _.forEach(that.formData.containTitleDataChange, function (changeItem) {
                if (changeItem.isSelected) {
                  changeItem.newValue = that.formData.desTitle;
                }
              });
            },
            selectPageRecord: function () {

              var that = this;
              var pages = {};
              _.forEach(that.formData.containTitleSheetChange, function (page) {
                if (page.isSelected)
                  pages[page.pageNo + '_' + page.column.key] = page;
              })

              _.forEach(that.formData.containTitleDataChange, function (data) {
                data.isSelected = pages[data.pageNo + '_' + data.columnData.key] != undefined;
              });
            },
            searchHeaderKey: function () {

              var that = this;
              var oldHeaderKey = that.formData.srcTitle;
              that.formData.desTitle = oldHeaderKey;

              //  获取表头页码数据
              nursingRest.getCustomColumns().getList({
                sheetId: that.metaData.sheet.sheetId,
                headerKey: oldHeaderKey
              }).then(function (response) {
                that.formData.containTitleSheet = response.plain();
                that.formData.containTitleSheetChange = generatePageChangesRecord(that.formData.containTitleSheet, that.metaData.tpl, oldHeaderKey);
              });

              // 获取表头记录数据
              nursingRest.getNursingData({
                sheetId: that.metaData.sheet.sheetId,
                headerKey: oldHeaderKey
              }).then(function (response) {
                that.formData.containTitleData = response.plain();
                that.formData.containTitleDataChange = generateRecordChangesRecord(that.formData.containTitleData, that.metaData.tpl, oldHeaderKey);
              })
            }
          }
        });
      };

      // 生成自定义表头自定义修改记录
      function generatePageChangesRecord(containTitleSheet, tpl, oldHeaderKey) {

        var containTitleSheetChange = [];
        _.forEach(containTitleSheet, function (item) {
          _.forEach(item.content, function (value, key) {

            var changeItem = {
              id: item.id,
              pageNo: item.pageNo,
              oldValue: oldHeaderKey,
              newValue: undefined,
              column: {},
              isSelected: false,
              originSrc: item
            };

            if (value == oldHeaderKey) {
              var column = _.find(tpl.components, {
                'key': key
              });
              if (column) {
                changeItem.column = {
                  text: column.text,
                  key: column.key
                };
              }
              containTitleSheetChange.push(changeItem);
            }
          });
        });
        return containTitleSheetChange;
      }

      // 生成自定义
      function generateRecordChangesRecord(containTitleData, tpl, oldHeaderKey) {

        var containTitleDataChanges = [];

        _.forEach(containTitleData, function (item) {
          _.forEach(item.data, function (value, key) {

            var changeItem = {
              id: item.dataId,
              recordDate: item.recordDate,
              pageNo: item.pageNo,
              pageRow: item.pageRow,
              oldValue: oldHeaderKey,
              newValue: undefined,
              columnData: {},
              isSelected: false,
              originSrc: item
            };

            var columnKeys = key.split("_");
            if (key.indexOf(oldHeaderKey) != -1) {

              var column = _.find(tpl.components, {
                'key': columnKeys[0]
              });
              if (column) {

                changeItem.columnData = {
                  key: columnKeys[0],
                  text: columnKeys[1],
                  content: value.replace(/\s/g, ""),
                  title: column.text
                }
                containTitleDataChanges.push(changeItem);
              }
            }
          });
        });

        return containTitleDataChanges;
      }
    }
  }
})();

(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("selectRow", selectRow);

  /** @ngInject */
  function selectRow() {
    var directive = {
      restrict: "A",
      require: "^?nursingDoc",
      scope: true,
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ctrl) {
      el.off("click").on("click", function () {
        var $this = angular.element(this);
        ctrl.select($this.parent().index());
      });
    }
  }
})();
