(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('resourceEditor', resourceEditor);

  /** @ngInject */
  function resourceEditor(_, roleService, modalService, $timeout) {
    var directive = {
      restrict: 'EA',
      scope: {
        resource: '=',
        parentResource: '=',
        chidrenResources: '=',
        onResourceSaved: '=',

        // 是否集成在弹出框中，用于隐藏提示信息
        embeddedModal: '=',
        // 编辑的资源类型，用于控制是否可以自定义类型
        editResourceType: '=',

        // 用于设置父结点时使用
        // 可用的应用资源列表
        appResources: '=',
        // 当前选中的应用资源列表
        activeAppResource: '=',
        // 获取App资源树的方法
        appResourceTreeGetter: '=',

        //保存echo
        saveEcho: '='
      },
      replace: true,
      templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/directive/resourceEdit.tpl.html',
      controller: ctrlFunc,
      controllerAs: 'vm'
    };

    return directive;

    function ctrlFunc($scope) {

      var vm = this;

      initViewModel();

      function initViewModel() {

        // 监听resource改变
        var resourceWatcher = $scope.$watch("resource", function (value) {
          vm.editingResource = _.cloneDeep(value);
        });
        $scope.$on('$destroy', resourceWatcher);

        // 监听saveEcho改变
        var saveEchoWatcher = $scope.$watch("saveEcho", function (value) {
          if (value == 'needSave') {

            create().then(function () {
              $scope.saveEcho = "saved";
            }, function () {
              $scope.saveEcho = "saved";
            })
          }
        });
        $scope.$on('$destroy', saveEchoWatcher);

        vm.validationOption = {};
        vm.resourceFieldDic = roleService.dic;
        vm.resourceTypeDic = roleService.resourceDic;

        // 函数
        vm.undo = undo;
        vm.save = save;
        vm.moveParentNode = moveParentNode;
      }


      // 撤销修改
      function undo() {

        vm.editingResource = _.cloneDeep($scope.resource);

        $scope.$emit('toast', {
          type: "success",
          content: "撤销修改成功"
        });
      }

      // 保存修改
      function save() {

        roleService.saveResource(vm.editingResource).then(function () {

          $scope.$emit('toast', {
            type: "success",
            content: "资源保存成功"
          });

          replaceResourceUsingClone();
        });
      }

      // 创建资源
      function create() {

        return roleService.createResource(vm.editingResource).then(function (resource) {

          var createdResource = resource.plain();

          $scope.$emit('toast', {
            type: "success",
            content: "资源创建成功"
          });

          replaceResourceUsingClone(createdResource);
        });
      }

      // 移动父结点
      function moveParentNode() {

        modalService.open({
          size: 'lg',
          templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/directive/parentResourceSelector.modal.html',
          data: {
            formData: null,
            metaData: {
              appResources: $scope.appResources,
              selectedAppResoure: $scope.activeAppResource,
              tree: getAvailableParentNodeTree($scope.activeAppResource),
              editingResource: vm.editingResource
            }
          },
          initFn: function () {},
          methodsObj: {
            onSelecteAppResource: function (appResource) {
              var that = this;
              that.metaData.selectedAppResoure = appResource;
              that.metaData.tree = {
                appResourceTree: {},
                appResourceTreeExpandedNode: {}
              };
              var tree = getAvailableParentNodeTree(appResource);
              $timeout(function () {
                that.metaData.tree = tree;
              })
            }
          },
          ok: function (data) {

            if (data) {
              vm.editingResource.parentResourceCode = data.resourceCode;
              $scope.parentResource = data;
              return true;
            } else {

              $scope.$emit('toast', {
                type: "warning",
                content: "请先中一个新的父结点"
              });
              return false;
            }
          }
        });

        function getAvailableParentNodeTree(appResource) {
          var tree = $scope.appResourceTreeGetter(appResource);
          tree.appResourceTreeExpandedNode = _.filter(tree.appResourceTreeExpandedNode, function (item) {
            return item.nodeLevel < 2;
          })
          return tree;
        }
      }

      function replaceResourceUsingClone(cloneInstance) {

        var source = cloneInstance || vm.editingResource;

        var allkeys = _.union(_.keys(source), _.keys($scope.resource));
        _.forEach(allkeys, function (item) {
          _.set($scope.resource, item, _.get(source, item));
        });
        if ($scope.onResourceSaved) {
          $scope.onResourceSaved($scope.resource, allkeys);
        }
      }
    }
  }

})();
