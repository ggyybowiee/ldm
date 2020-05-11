(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('specialValueConfig', specialValueConfig);

  function specialValueConfig() {

    var directive = {
      restrict: "E",
      scope: {
        nursingPathTpl: '='
      },
      replace: true,
      transclude: true,
      controllerAs: "vm",
      templateUrl: "MNIS/directives/specialValueConfig/specialValueConfig.tpl.html",
      controller: function ($rootScope, $scope, _, sessionService, modalService, nursingPathRest) {

        var vm = this;

        // 监听器
        var watcher = $scope.$watch('nursingPathTpl', function (value) {
          vm.specialItems = (value && value.specialItems) || [{
            label: '',
            dataBind: '',
            dataType: '',
            opts: []
          }];
        });
        $scope.$on('$destroy', watcher);

        initViewModel();

        // 初始化ViewModel
        function initViewModel() {
          // 表头录入项类型
          vm.headInputTypes = [
            {
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
              type: "selectAndInput",
              desc: "下拉输入"
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
              type: "signaturePicture",
              desc: "仅签名图片"
            }
          ];
        }

        //删除选项
        vm.removeFormItem = function (index) {
          vm.specialItems.splice(index, 1);
        }

        // 添加表头项
        vm.addHeaderItem = function () {
          if (!angular.isArray(vm.specialItems)) {
            vm.specialItems = [];
          }
          vm.specialItems.push({});
        }

        // 添加选项
        vm.addOption = function (item) {
          modalService.open({
            templateUrl: "MNIS/modules/estimateConfig/configForm/options.modal.html",
            size: "lg",
            data: {
              metaData: {
                options: item.opts || [],
                item: item
              },
              formData: {}
            },
            ok: function () {
              var that = this;
              that.metaData.item.opts = this.metaData.options;
              return true;
            },
            methodsObj: {
              setActive: function (option, index) {
                option.description = option.description || [];
                this.formData = option;
                this.activeIndex = index;
              },
              removeOption: function (index) {
                this.metaData.options.splice(index, 1);
                delete this.activeIndex;
              },
              addOption: function () {
                var modal = this;

                var newOpt = {
                  id: "",
                  dicName: "",
                  dicCode: ""
                };
                modal.metaData.options.push(newOpt);

                modal.formData = newOpt;
                modal.metaData.item.opts = modal.metaData.options;
                modal.activeIndex = modal.metaData.options.length - 1;
              },
              selectRowCss: function (index) {
                var modal = this;
                return modal.activeIndex == index ?
                  "estiamte-option-list-table-row-select" :
                  "estiamte-option-list-table-row";
              },
              removeDesc: function (index) {
                var modal = this;
                modal.formData.description.splice(index, 1);
              },
              addDesc: function () {
                var modal = this;
                modal.formData.description.push("");
              }
            }
          });
        }

        //获取护理路径模版
        function getNursingPathTpl(pathTplId) {
          nursingPathRest.getNursingPathConfigById(pathTplId).then(function (res) {
            $scope.nursingPathTpl = res.plain();
          });
        }

        // 保存
        vm.save = function () {
          var params = angular.copy($scope.nursingPathTpl);
          params.specialItems = vm.specialItems;
          nursingPathRest.updateNursingPathConfigByWardCode(
            params
          ).then(function () {
            $scope.$emit('toast', {
              type: 'success',
              content: '保存成功'
            });
            getNursingPathTpl(params.pathTplId);
          });
        }
      }
    }

    return directive;
  }
})();
