(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('nursingDocItemEdit', nursingDocItemEdit);


  function nursingDocItemEdit(_) {

    var directive = {
      restrict: "EA",
      scope: {
        tpl: "=",
        closePanel: "=",
        editData: "=",
        echo: "=",
        nursingCheckSign: "=",
        currentPageColumns: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope) {

        var vm = this;

        // 关闭编辑界面
        vm.closePanel = function (notSave, reloadingData, verifySignOnly) {
          if (vm.extendEcho.isOpen) {
            vm.closeAllExtPanel();
          } else {
            if ($scope.closePanel != undefined) {
              vm.savingDataProc.func($scope.editingData, notSave, reloadingData, verifySignOnly)
            }
          }

          vm.shouldReloadData = false;
        }

        // 扩展编辑框控制
        vm.swtichExtendPanel = function (index, extendsData) {
          if (vm.extendEcho.isOpen && index == -1) {
            vm.closeAllExtPanel();
          } else {
            vm.extendEcho.isOpen = true;
            vm.extendEcho.showIndex = index;
            vm.extendEcho.extendsData = extendsData;
          }
        }

        // 护士冠签或取消签名
        vm.nursingCheckSign = function () {
          if ($scope.nursingCheckSign) {
            $scope.nursingCheckSign();
          }
        }

        // 打开自定义表头编辑
        vm.openCustomColumnEdit = function (customColumn) {
          $scope.echo.openCustomColumnEdit(customColumn);
          vm.shouldReloadData = true;
        }

        //选中上个控件
        $scope.$on("FocusPreviewInputControl", function () {
          if (vm.focusIndex > 0)
            getInputControl()[vm.focusIndex - 1].focus();
        })

        //选中下个控件
        $scope.$on("FocusNextInputControl", function () {
          if (vm.focusIndex < vm.inputControl.length - 1)
            getInputControl()[vm.focusIndex + 1].focus();
        })

        // 选中一个控件
        $scope.$on("FocusElement", function (event, elem) {
          vm.focusIndex = getInputControl().indexOf(elem);
        })

        // 获取所有录入的控件
        function getInputControl() {
          if (!_.get(vm, "inputControl")) {
            var elements = angular.element(".nursing-doc-edit-cell-control");
            vm.inputControl = [];
            for (var i = 0; i < elements.length; i++)
              vm.inputControl.push(elements[i]);
          }
          return vm.inputControl;
        }

        // 保存
        vm.saveEditButton = function () {
          vm.closeAllExtPanel();
          if ($scope.editingData.checkUserCode) {
            // 如果此记录已经冠签
            vm.closePanel(true, vm.shouldReloadData);
          } else {

            var isEdited = false;
            var changedKeys = [];

            var allKeys = _.union(_.keys($scope.editData.data), _.keys($scope.editingData.data));

            _.forEach(allKeys, function (key) {

              var value = $scope.editingData.data[key];

              if (angular.isArray(value) && angular.isArray($scope.editData.data[key])) {
                _.forEach(value, function (signItem, index) {
                  if (value != $scope.editData.data[key][index])
                    isEdited = true;
                })
              } else if (!angular.isArray(value) && !angular.isArray($scope.editData.data[key])) {
                if ($scope.editData.data[key] == undefined || $scope.editData.data[key] != $scope.editingData.data[key]) {
                  isEdited = true;
                  changedKeys.push(key)
                }
              } else {
                isEdited = true;
              }
            });
            if (!isEdited) {
              // 数据未编辑修改过
              vm.closePanel(true, vm.shouldReloadData);
            } else {
              // 数据编辑修改过,判断是不是只修改了签名
              var verifySignOnly = true;
              _.forEach(changedKeys, function (key) {
                var column = _.find($scope.tpl.components, {
                  'key': key
                })
                if (column && column.type != 'verifySignature')
                  verifySignOnly = false;
              })
              vm.closePanel(false, false, verifySignOnly);
            }
          }
        }

        // 取消保存
        vm.cancelEditButton = function () {
          vm.closeAllExtPanel();
          vm.closePanel(true, vm.shouldReloadData);
          return true;
        }

        // 初始化视图模型
        initViewModel();

        function initViewModel() {

          // 添加监听器
          var dataWathcer = $scope.$watch("editData", function (value) {
            if (value) {
              $scope.editingData = angular.copy(value);
            }

          });
          $scope.$on('$destroy', dataWathcer);

          // 添加监听器
          var focusWatcher = $scope.$watch("vm.extendEcho.focusRowEcho", function (value, oldValue) {
            if (value == undefined || value.row == undefined)
              return;
            vm.openModalPanel(value.row, _.get(oldValue, 'row'));
          });
          $scope.$on('$destroy', focusWatcher);

          // 打开模版引用
          vm.openModalPanel = function (row, oldRow) {

            if (row.type != 'modal') {

              if (vm.extendEcho.isOpen && vm.extendEcho.showIndex == 100) {
                vm.swtichExtendPanel(100, {
                  editData: $scope.editingData,
                  tpls: row.rule && row.rule.tpls && [],
                  key: row.key
                });

                if (oldRow.autoShow) {
                  vm.closeAllExtPanel();
                }
              }
              return;
            }

            if (angular.isUndefined(row.rule) || !angular.isArray(row.rule.tpls))
              return;

            if ((row.rule.tpls.length > 0 && vm.extendEcho.isOpen) || (!vm.extendEcho.isOpen && row.autoShow)) {
              vm.swtichExtendPanel(100, {
                editData: $scope.editingData,
                tpls: row.rule.tpls,
                key: row.key
              });
            }
          }

          // 引用
          vm.importButton = function () {

            if (vm.extendEcho.isOpen)
              vm.swtichExtendPanel(-1);
            else {
              var row = vm.extendEcho.focusRowEcho.row;

              if (_.isUndefined(row)) {
                $scope.$emit('toast', {
                  type: 'warning',
                  content: '请先在右侧编辑区选中要编辑的项目再引用！'
                });
              }

              if (row.type == 'modal') {
                vm.swtichExtendPanel(100);
                vm.openModalPanel(row);
              } else {
                vm.swtichExtendPanel(0);
              }
            }
          }

          // 关闭所有扩展编辑框
          vm.closeAllExtPanel = function () {
            vm.extendEcho.isOpen = false;
            vm.extendEcho.type = '';
            vm.extendEcho.showIndex = -1;
            delete vm.extendEcho.extendsData;
          }

          // 查找父HEADER
          vm.findHeader = function (headerItem) {

            if (!headerItem.sup)
              return;

            for (var i = 0; i < $scope.tpl.components.length; i++) {
              var compareItem = $scope.tpl.components[i];
              if (compareItem.id == headerItem.sup)
                return compareItem;
            }
          }

          // 扩展界面控制器
          vm.extendEcho = {
            isOpen: false,
            type: '',
            showIndex: -1,
            focusRowEcho: {}
          };

          vm.savingDataProc = {
            func: $scope.closePanel
          }
        }
      },
      controllerAs: 'vm',
      templateUrl: 'MNIS/components/nursingDoc/popupEditRow/nursingDocItemEdit.tpl.html'
    }

    return directive;
  }
})();
