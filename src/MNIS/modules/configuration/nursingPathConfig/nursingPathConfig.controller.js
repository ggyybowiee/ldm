(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('NursingPathConfig', NursingPathConfig);

  /** @ngInject */
  function NursingPathConfig($scope, sessionService, nursingPathRest, $state, modalService) {

    // 自动注入服务数据声明
    var vm = this;
    vm.profile = sessionService.getProfile();

    // 初始化
    initViewModel();

    function initViewModel() {
      vm.pathList = [];

      vm.loadPathList = {
        func: getPathList,
        init: true
      };

      vm.params = {
        wardCode: vm.profile.wardCode,
        num: 20,
        offset: 0,
        countAll: true
      };

      vm.pageItem = {
        maxSize: 10,
        totalItems: 0,
        count: '20',
        page: 1
      }
    }

    // 获取路径设置
    function getPathList() {
      return nursingPathRest.getNursingPathConfigByWardCode(vm.params)
        .then(function (res) {
          vm.pathList = res.queryResult || [];
          vm.pageItem.totalItems = res.totalCnt;
        });
    }

    vm.queryList = function (page) {
      vm.params.num = +vm.pageItem.count;
      vm.params.offset = (page - 1) * vm.params.num;
      getPathList();
    }

    // 删除路径
    vm.deleteItem = function (item) {
      nursingPathRest.deleteNursingPatientConfigById(item.pathTplId).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '删除成功'
        })
        getPathList();
        modalService.close();
      });
    }

    // 添加
    vm.open = function (data, index) {
      var row = data ? {
        pathName: data.pathName,
        pathTplId: data.pathTplId
      } : {
        pathName: ''
      };

      var type = data ? '编辑' : '新建';

      var instance = modalService.open({
        size: 'md',
        templateUrl: 'MNIS/modules/configuration/nursingPathConfig/nursingPathConfig.modal.html',
        data: {
          formData: row
        },
        ok: function () {
          var params = {};
          if (data) {
            params = vm.pathList[index];
            params.pathName = row.pathName;
            nursingPathRest.updateNursingPathConfigByWardCode(
              params
            ).then(function () {
              $scope.$emit('toast', {
                type: 'success',
                content: '编辑成功'
              })
              getPathList();
              modalService.close();
            });
          } else {
            params = {
              wardCode: vm.profile.wardCode,
              pathName: row.pathName,
              pathTplId: row.pathTplId
            }

            nursingPathRest.addNursingPatientConfig(
              params
            ).then(function () {
              $scope.$emit('toast', {
                type: 'success',
                content: '新建成功'
              })
              getPathList();
              modalService.close();
            });
          }
        },
        initFn: function (params) {
          var modal = this;
          modal.type = type;
        }
      });
      instance.result.then(function () {
        getPathList();
      });
    }

    // 保存路径
    vm.saveItem = function (index) {
      nursingPathRest.updateNursingPathConfigByWardCode(vm.pathList[index]).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '路径修改保存成功'
        })
      });
    }

    // 设置路径禁用状态
    vm.setItemStatus = function (index, item) {
      item.status = (item.status == 0) ? 1 : 0;
      vm.saveItem(index);
    }

    // 设置
    vm.settingItem = function (item) {
      $state.go('main.nursingPathConfigSetting', {
        tplId: item.pathTplId
      });
    }
  }
})();
