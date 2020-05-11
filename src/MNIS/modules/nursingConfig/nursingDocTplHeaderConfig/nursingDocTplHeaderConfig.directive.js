(function () {
  "use strict";
  angular
    .module("lachesis-mnis")
    .directive("nursingDocTplHeaderConfig", nursingDocTplHeaderConfig);

  /** @ngInject */
  function nursingDocTplHeaderConfig(modalService, estimateTplUtil) {
    var directive = {
      restrict: "E",
      scope: {
        tpl: "=",
        imageInHeader: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, sessionService) {

        var vm = this;
        var dicHelper = sessionService.getDicHelper();
        vm.dic = dicHelper.dic;

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

        //删除选项
        vm.removeFormItem = function (index) {
          $scope.tpl.headerFormItems.splice(index, 1);
        }

        // 添加表头项
        vm.addHeaderItem = function () {
          if (!angular.isArray($scope.tpl.headerFormItems)) {
            $scope.tpl.headerFormItems = [];
          }
          $scope.tpl.headerFormItems.push({});
        }

        initViewModel();

        // 初始化ViewModel
        function initViewModel() {

          // 图片选项
          vm.imageOptions = {
            moduleName: "mnisFile",
            sizeRules: {
              max: "1M"
            },
            suffixRules: ["jpg", "png", "jpeg"]
          };

          // 表头录入项类型
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
      },
      controllerAs: "vm",
      templateUrl: "MNIS/modules/nursingConfig/nursingDocTplHeaderConfig/nursingDocTplHeaderConfig.tpl.html",
      link: function(scope) {
        
        scope.vm.pageSize = scope.tpl.size.split(",");
        scope.vm.pageSize = {
          width: scope.vm.pageSize[0]
        };
        scope.vm.pageSize.padding = estimateTplUtil.getPagePadding(scope.tpl.margin);
      }
    };

    return directive;
  }
})();
