(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('roleAuthenticationAssign', roleAuthenticationAssign);

  /** @ngInject */
  function roleAuthenticationAssign() {
    var directive = {
      restrict: 'EA',
      scope: {

      },
      templateUrl: 'settings/modules/authentication/rightAssign/roleAuthenticationAssign/roleAuthenticationAssign.tpl.html',
      controllerAs: "vm",
      controller: function ($scope, $filter, roleService, userService, authHelperService, $q, $timeout, _, authenticationUtil) {

        var vm = this;


        initViewModel();

        function initViewModel() {

          vm.treeOption = {
            allowDeselect: false
          };

          // 加载权限
          vm.loadAuths = {
            func: getAuths
          };

          // 加载角色和资源
          vm.loadRoleAndResource = {
            func: loadRoleAndResource,
            init: true
          }

          // 加载角色资源元素权限表
          vm.getRoleResourceElementMappingProc = {
            func: getRoleResourceElementMapping
          }

          // 编辑的资源结点
          vm.editingItemNode = {
            treeNode: null
          };

          vm.selectAppResource = selectAppResource;
          vm.assignRoleResource = assignRoleResource;
          vm.onSelectedModuleResource = onSelectedModuleResource;
          vm.assignElementMapping = assignElementMapping;
        }

        function getAuths(role) {

          vm.activeRole = role;
          vm.editRoleApplication = 0;

          return roleService.getRoleResources(role.roleCode).then(function (data) {
            vm.userAuthentication = data.plain();
            updateAppResourceTreeUserAuthentication();
          })
        }

        // 加载角色与资源关系
        function loadRoleAndResource() {

          var rolesPromise = roleService.getRoles(),
            resourcesPromise = roleService.getResources(),
            resourceElementPromise = roleService.getResourceElement();
          return $q.all([rolesPromise, resourcesPromise, resourceElementPromise]).then(function (results) {

            var roles = results[0].plain(),
              resources = results[1].plain(),
              resourceElements = results[2].plain().queryResult;;

            vm.authRoles = roles;

            // 处理所有资源
            vm.resources = $filter('orderBy')(resources, ['parentResourceCode', 'sortNo']);
            vm.resourceDic = {};
            _.forEach(vm.resources, function (item) {
              item.parentResourceCode = item.parentResourceCode || "";
              vm.resourceDic[item.resourceCode] = item;
            })

            // 过滤生成应用资源
            vm.appResources = _.filter(vm.resources, {
              'resourceType': roleService.resourceDic['App']
            });

            // 生成资源元素对应表            
            vm.resourceElementDic = _.groupBy(resourceElements, 'resourceCode');

            if (vm.authRoles.length > 0) {
              vm.activeRole = vm.authRoles[0];
              if (vm.appResources.length > 0)
                vm.selectAppResource(vm.appResources[0]);
              vm.loadAuths.func(vm.activeRole);
            }

          });
        }

        // 加载角色资源元素权限表
        function getRoleResourceElementMapping() {
          return roleService.getResourceRoleElementMapping(vm.activeRole.roleCode, vm.editingItemNode.treeNode.resourceCode).then(function (response) {

            var roleResourceElementMapping = response.plain().queryResult;
            var resourceElementList = vm.resourceElementDic[vm.editingItemNode.treeNode.resourceCode];

            _.forEach(roleResourceElementMapping, function (mapping) {
              var element = _.find(resourceElementList, {
                elementCode: mapping.elementCode
              });

              if (element) {
                element.mapping = mapping;
              }
            })

          });
        }

        // 选中应用资源
        function selectAppResource(appResource) {

          var defer = $q.defer();

          vm.resourceTree = {};
          vm.activeAppResource = appResource;

          if (appResource != null) {

            $timeout(function () {

              vm.resourceTree = authenticationUtil.getAppResourceTree(appResource, vm.resources);
              defer.resolve();
            });
          }

          return defer.promise;
        }

        function onSelectedModuleResource(moduleResource) {

          vm.editingItemNode.treeNode = moduleResource;
          vm.getRoleResourceElementMappingProc.func();
        }

        // 更新资源树权限
        function updateAppResourceTreeUserAuthentication() {

          _.forEach(vm.resources, function (item) {
            delete item.roleResourceMapping;
          })

          _.forEach(vm.userAuthentication, function (item) {
            if (vm.resourceDic[item.resourceCode]) {
              vm.resourceDic[item.resourceCode].roleResourceMapping = item;
            }
          });
        }

        //分配角色资源 
        function assignRoleResource(resourceNode) {
          var editRoleResourceMapping = null;
          if (resourceNode.roleResourceMapping && resourceNode.roleResourceMapping.relation == 1) {
            // 移除权限              
            editRoleResourceMapping = _.cloneDeep(resourceNode.roleResourceMapping);
            editRoleResourceMapping.relation = 0;
            roleService.saveRoleResource(editRoleResourceMapping).then(function (data) {
              $scope.$emit('toast', {
                type: 'success',
                content: '移除角色权限成功'
              });
              resourceNode.roleResourceMapping = data.plain();
            })
          } else {
            // 添加权限
            if (resourceNode.roleResourceMapping) {
              editRoleResourceMapping = _.cloneDeep(resourceNode.roleResourceMapping);
              editRoleResourceMapping.relation = 1;
              roleService.saveRoleResource(editRoleResourceMapping).then(function (data) {
                $scope.$emit('toast', {
                  type: 'success',
                  content: '添加角色权限成功'
                });
                resourceNode.roleResourceMapping = data.plain();
              })
            } else {

              var newRoleResourceMapping = {
                roleCode: vm.activeRole.roleCode,
                resourceCode: resourceNode.resourceCode,
                relation: 1
              }

              roleService.createRoleResource(newRoleResourceMapping).then(function (data) {
                $scope.$emit('toast', {
                  type: 'success',
                  content: '添加角色权限成功'
                });
                resourceNode.roleResourceMapping = data.plain();
              })
            }
          }
        }

        // 分配角色元素相关权限
        function assignElementMapping(rightFeild, element) {

          var editingMapping = undefined;

          if (element.mapping) {

            // 已经分配过权限
            editingMapping = _.cloneDeep(element.mapping);
            delete editingMapping.element;
            editingMapping[rightFeild] = (editingMapping[rightFeild] === '0') ? "1" : "0";
            roleService.updateResourceRoleElementMapping(editingMapping).then(function (updatedMapping) {
              element.mapping = updatedMapping.plain();
              $scope.$emit("toast", {
                type: "success",
                content: "权限修改成功！"
              });
            });

          } else {

            // 未分配过权限
            editingMapping = {
              roleCode: vm.activeRole.roleCode,
              elementCode: element.elementCode,
              visibility: '0',
              enable: '0'
            };
            editingMapping[rightFeild] = '1';
            roleService.addResourceRoleElementMapping(editingMapping).then(function (addedMapping) {
              element.mapping = addedMapping.plain();

              $scope.$emit("toast", {
                type: "success",
                content: "权限修改成功！"
              });
            });
          }
        }
      }
    }

    return directive;
  }

})();
