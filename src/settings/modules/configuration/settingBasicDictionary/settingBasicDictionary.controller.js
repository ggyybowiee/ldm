(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('settingBasicDictionary', settingBasicDictionary);

  /** @ngInject */
  function settingBasicDictionary($scope, $q, $timeout, dicService, modalService, _) {

    var vm = this;

    // 初始化视图
    initViewModel();

    function initViewModel() {

      vm.loadDictionary = {
        func: getDictionary
      }

      vm.filter = {
        dicFilterText: "",
        dicItemFilterText: ""
      }

      $timeout(function () {
        vm.loadDictionary.func();
      })
    }


    // 获取系统字典
    function getDictionary() {
      return dicService.getDicItem().then(function (response) {

        var dicItemList = response.plain().queryResult;
        vm.dicItemGroup = _.map(_.groupBy(dicItemList, 'dicType'), function (value, key) {
          return {
            key: key,
            name: value[0].dicTypeName,
            owner: value[0].owner,
            items: value
          }
        })

        // vm.dicItemGroup.splice(0, 0, {
        //   name: "所有项目",
        //   items: dicItemList
        // });

        vm.selectedDic = vm.dicItemGroup.length > 0 ? vm.dicItemGroup[0] : undefined;
      });
    }

    // 选中字典
    vm.selecDicType = function (dic) {
      vm.selectedDic = dic;
    }

    // 强制后台更新字典
    vm.forceServerDicCacheRefresh = function (noToast) {

      dicService.refreshCache().then(function () {
        if (!noToast) {
          $scope.$emit('toast', {
            type: 'success',
            content: '后台字典缓存更新成功'
          })
        }
        vm.loadDictionary.func();
      });
    }

    // 添加或编辑字典项目
    vm.addOrEditDicItem = function (item) {

      var editItem = item ? angular.copy(item) : {};
      editItem.dicType = vm.selectedDic.key;
      editItem.dicTypeName = vm.selectedDic.name;
      editItem.owner = vm.selectedDic.owner;

      modalService.open({
        templateUrl: 'settings/modules/configuration/settingBasicDictionary/basicDictionary.modal.html',
        size: 'md',
        data: {
          formData: {
            dicItem: editItem,
            dic: vm.selectedDic
          },
          metaData: {
            type: 'item'
          }
        },
        ok: function (data) {

          if (item) {
            return dicService.updateDicItem(data.dicItem).then(function (response) {

              $scope.$emit('toast', {
                type: 'success',
                content: '更新字典项成功'
              })

              var index = vm.selectedDic.items.indexOf(item);
              vm.selectedDic.items.splice(index, 1, response.plain());
            });
          } else {

            return dicService.addDicItem(data.dicItem).then(function (response) {

              $scope.$emit('toast', {
                type: 'success',
                content: '添加字典项成功'
              })

              vm.selectedDic.items.push(response.plain());
            });
          }
        }
      })
    }

    //删除字典项
    vm.deleteDicItem = function (item) {

      return dicService.deleteDicItem(item.seqId).then(function () {

        $scope.$emit('toast', {
          type: 'success',
          content: '删除字典项成功'
        })

        var index = vm.selectedDic.items.indexOf(item);
        vm.selectedDic.items.splice(index, 1);
        if (vm.selectedDic.items.length == 0) {
          var dicIndex = vm.dicItemGroup.indexOf(vm.selectedDic);
          if (dicIndex != -1) {
            vm.dicItemGroup.splice(dicIndex, 1);
            vm.selectedDic = undefined;
          }
        }
      });
    }

    // 添加获编辑字典
    vm.addOrEditDic = function (dic) {

      var newDicItem = !dic ? {} : {
        dicCode: "valueless",
        dicName: "valueless",
        owner: "valueless",
        description: "valueless"
      };

      modalService.open({
        templateUrl: 'settings/modules/configuration/settingBasicDictionary/basicDictionary.modal.html',
        size: 'md',
        data: {
          formData: {
            dicItem: newDicItem,
            dic: dic ? dic : {}
          },
          metaData: {
            type: dic ? 'dic' : 'newDic'
          }
        },
        ok: function (data) {
          if (dic) {
            // 修改
            var updateRequest = [];
            _.forEach(dic.items, function (dicItem) {

              dicItem.dicType = data.dic.key;
              dicItem.dicTypeName = data.dic.name;
              dicItem.owner = data.dic.owner;

              updateRequest.push(dicService.updateDicItem(dicItem));
            })

            return $q.all(updateRequest).then(function () {

              $scope.$emit('toast', {
                type: 'success',
                content: '修改字典成功'
              })


            }, function () {
              vm.forceServerDicCacheRefresh(true);
            })
          } else {
            // 新增
            data.dicItem.dicType = data.dic.key;
            data.dicItem.dicTypeName = data.dic.name;
            data.dicItem.owner = data.dic.owner;

            return dicService.addDicItem(data.dicItem).then(function (response) {

              $scope.$emit('toast', {
                type: 'success',
                content: '添加字典项成功'
              })

              vm.dicItemGroup.splice(0, 1, data.dic);
              data.dic.items = [response.plain()];
              vm.selectedDic = data.dic;
            });
          }
        }
      })

    }

    // 删除字典
    vm.deleteDic = function (dic) {

      var deleteRequest = [];
      _.forEach(dic.items, function (dicItem) {
        deleteRequest.push(dicService.deleteDicItem(dicItem.seqId));
      });


      return $q.all(deleteRequest).then(function () {

        var dicIndex = vm.dicItemGroup.indexOf(dic);
        if (dicIndex != -1) {
          vm.dicItemGroup.splice(dicIndex, 1);
          if (vm.selectedDic == dic)
            vm.selectedDic = undefined;
        }

        $scope.$emit('toast', {
          type: 'success',
          content: '删除字典成功'
        })
      }, function () {
        vm.forceServerDicCacheRefresh(true);
      })

    }
  }
})();
