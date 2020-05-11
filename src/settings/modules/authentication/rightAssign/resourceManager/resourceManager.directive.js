(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .directive('resourceManager', resourceManager);

  /** @ngInject */
  function resourceManager() {
    var directive = {
      restrict: 'EA',
      scope: {

      },
      templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/resourceManager.tpl.html',
      controllerAs: "vm",
      controller: function ($scope, $q, $filter, roleService, modalService, _, $timeout, authenticationUtil) {

        var vm = this;
        vm.dic = roleService.dic;

        initViewModel();

        function initViewModel() {

          vm.loadResources = {
            func: getResources,
            init: true
          };
          vm.saveResources = {
            func: saveResourcesProc
          }

          vm.addAppResource = addAppResource;
          vm.delResource = delResource;
          vm.onResourceSaved = onResourceSaved;
          vm.addNewResourceToParent = addNewResourceToParent;
          vm.getAppResourceTree = getAppResourceTree;
          vm.resourceSetOrder = resourceSetOrder;
          vm.setAsMainPage = setAsMainPage;

          vm.openResourceElement = openResourceElement;
          vm.deleteResourceElement = deleteResourceElement;

          vm.resourceDetailType = 0;

          vm.treeOption = {
            allowDeselect: false
          };
        }

        // 添加应用资源
        function addAppResource() {

          var newAppResource = {
            resourceType: roleService.resourceDic['App'],
            isMobileResource: 0,
            engine: 'angular'
          };

          modalService.open({
            size: 'middle',
            templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/appResourceEditor.modal.html',
            data: {
              formData: newAppResource,
              metaData: {
                saveEcho: "saved"
              }
            },
            methodsObj: {
              onResourceSaved: function (resource, allKeys) {
                vm.loadResources.func();
                modalService.close();
              }
            },
            ok: function () {
              var that = this;
              that.metaData.saveEcho = "needSave";
            }
          });
        }

        // 获取系统资源列表
        function getResources(donNotSelected) {

          var defer = $q.defer();

          roleService.getResources().then(function (data) {

            var resources = data.plain();
            _.forEach(resources, function (item) {
              item.parentResourceCode = item.parentResourceCode || "";
            })
            vm.resources = $filter('orderBy')(resources, ['parentResourceCode', 'sortNo']);

            vm.appResources = _.filter(vm.resources, {
              'resourceType': roleService.resourceDic['App']
            });

            if (!donNotSelected && vm.appResources.length > 0)
              vm.selectAppResource(vm.appResources[0]);


            roleService.getResourceElement().then(function (response) {
              var resourceElements = response.plain().queryResult;
              vm.resourceElementDic = _.groupBy(resourceElements, 'resourceCode');
              defer.resolve();
            }, function () {
              defer.reject();
            })
          }, function () {
            defer.reject();
          });

          return defer.promise;
        }

        // 删除资源
        function delResource(resource) {

          return roleService.deleteResource(resource).then(function () {

            if (resource.resourceType == roleService.resourceDic['App']) {
              // 如果删除的是应用资源，需要重新加载
              vm.loadResources.func();
            } else {
              // 如果删除的是非应用资源，只需要重新计算树构
              var index = _.findIndex(vm.resources, {
                'resourceCode': resource.resourceCode
              });
              vm.resources.splice(index, 1);
              vm.selectAppResource(vm.activeAppResource);
            }

            $scope.$emit("toast", {
              type: "success",
              content: "删除资源成功！"
            });
          });
        }

        //资源已经被更改后 
        function onResourceSaved(resource, allKeys) {

          var saveNeedReload = {
            reload: false
          }
          // 更新树结构元素
          _.forEach(allKeys, function (key) {

            if (key === 'parentResourceCode' && _.get(vm.editingItemNode.treeNode, key) != _.get(resource, key)) {
              saveNeedReload.reload = true;
              saveNeedReload.activeAppResourceCode = vm.activeAppResource.resourceCode;
            }
            _.set(vm.editingItemNode.treeNode, key, _.get(resource, key));
          })

          // 保存后需要重新加载数据
          if (saveNeedReload.reload) {

            vm.loadResources.func(true).then(function () {
              var activeAppResource = _.find(vm.appResources, {
                'resourceCode': saveNeedReload.activeAppResourceCode
              });
              vm.selectAppResource(activeAppResource).then(function () {

              });
            })
          }
        }

        // 创建新资源
        function addNewResourceToParent(parent) {

          var newAppResource = {
            resourceType: roleService.resourceDic['Module'],
            isMobileResource: parent.isMobileResource,
            engine: parent.engine,
            parentResourceCode: parent.resourceCode
          };

          modalService.open({
            size: 'middle',
            templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/appResourceEditor.modal.html',
            data: {
              formData: newAppResource,
              metaData: {
                saveEcho: "saved",
                parentResource: parent
              }
            },
            methodsObj: {
              onResourceSaved: function (resource) {

                vm.resources.push(resource);
                vm.selectAppResource(vm.activeAppResource);
                modalService.close();
              }
            },
            ok: function () {
              var that = this;
              that.metaData.saveEcho = "needSave";
            }
          });

        }

        // 选择应用资源的INDEX
        vm.selectAppResource = function (item) {

          var defer = $q.defer();

          vm.resourceTree = {};
          vm.activeAppResource = item;

          if (item != null) {

            $timeout(function () {
              vm.resourceTree = getAppResourceTree(item);
              vm.onSelectedModuleResource(vm.resourceTree.appResourceTree[0]);
              defer.resolve();
            });
          }

          return defer.promise;
        }

        // 获取应用资源树
        function getAppResourceTree(appResource) {
          return authenticationUtil.getAppResourceTree(appResource, vm.resources);
        }

        // 在菜单树选择资源
        vm.onSelectedModuleResource = function (itemNode) {
          vm.editingItemNode = {
            treeNode: itemNode,
            editResourceParent: (itemNode.parentResourceCode ? _.find(vm.resources, {
              'resourceCode': itemNode.parentResourceCode
            }) : null),
            editResource: _.find(vm.resources, {
              'resourceCode': itemNode.resourceCode
            })
          }
        }

        // 设置资源顺序
        function resourceSetOrder(resourceNode, direction) {

          var sameLevelNodes = _.filter(vm.resources, function (item) {
            if (!resourceNode.parentResourceCode)
              return item.parentResourceCode == null || item.parentResourceCode == "";
            else return item.parentResourceCode == resourceNode.parentResourceCode;
          });
          var resourceIndex = _.findIndex(sameLevelNodes, {
            'resourceCode': resourceNode.resourceCode
          });

          if (resourceIndex != null) {
            if (swapArrayItem(sameLevelNodes, resourceIndex, resourceIndex + ((direction > 0) ? 1 : -1)) || resourceNode.sortNo == null) {
              var modifiedItem = _.cloneDeep(sameLevelNodes);
              _.forEach(modifiedItem, function (item, index) {
                item.sortNo = index;
              });
              vm.saveResources.func(modifiedItem);
            }
          }
        }

        // 交换数组元素
        function swapArrayItem(array, srcIndex, desIndex) {

          if (desIndex < 0 || desIndex >= array.length)
            return false;

          var temp = array[srcIndex];
          array[srcIndex] = array[desIndex];
          array[desIndex] = temp;

          return true;
        }

        // 批量保存资源（排序）
        function saveResourcesProc(resourcesArray) {
          return roleService.saveResources(resourcesArray).then(function () {
            var selectedAppResourceCode = vm.activeAppResource.resourceCode;
            vm.loadResources.func(true).then(function () {
              $timeout(function () {
                var selectedAppResource = _.find(vm.resources, {
                  'resourceCode': selectedAppResourceCode
                });
                vm.selectAppResource(selectedAppResource);
              })
            })
          })
        }

        // 设置为主页 
        function setAsMainPage() {
          // TODO: 设置为主页
        }

        // 打开资源元素
        function openResourceElement(editElement) {

          var editingElement = editElement ? _.cloneDeep(editElement) : {
            elementCode: vm.editingItemNode.treeNode.resourceCode + "_",
            elementDesc: ""
          }
          editingElement.resourceCode = vm.editingItemNode.treeNode.resourceCode;
          editingElement.resource = vm.editingItemNode.treeNode;

          modalService.open({
            size: 'md',
            templateUrl: 'settings/modules/authentication/rightAssign/resourceManager/elementEditor.modal.html',
            data: {
              formData: editingElement,
              metaData: {}
            },
            methodsObj: {

            },
            ok: function (formData) {

              delete formData.resource;

              var resoureElementList = vm.resourceElementDic[formData.resourceCode];

              if (editElement) {
                // 修改
                return roleService.updateResourceElement(formData).then(function (updatedElement) {
                  for (var i = 0; i < resoureElementList.length; i++) {
                    if (resoureElementList[i].seqId == updatedElement.seqId) {
                      resoureElementList[i] = updatedElement.plain();
                      break;
                    }
                  }

                  $scope.$emit("toast", {
                    type: "success",
                    content: "修改元素成功！"
                  });
                });
              } else {
                // 添加
                return roleService.addResourceElement(formData).then(function (addedElement) {
                  if (resoureElementList) {
                    resoureElementList.push(addedElement.plain());
                  } else {
                    vm.resourceElementDic[addedElement.resourceCode] = [addedElement.plain()];
                  }
                  $scope.$emit("toast", {
                    type: "success",
                    content: "增加元素成功！"
                  });
                });
              }
            }
          });
        }

        function deleteResourceElement(deleteResourceElement) {

          var resoureElementList = vm.resourceElementDic[deleteResourceElement.resourceCode];
          var itemIndex = resoureElementList.indexOf(deleteResourceElement)

          return roleService.removeResourceElement(deleteResourceElement).then(function () {
            resoureElementList.splice(itemIndex, 1);
            $scope.$emit("toast", {
              type: "success",
              content: "删除元素成功！"
            });
          })
        }
      }
    };

    return directive;

  }

})();
