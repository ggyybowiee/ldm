(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('ObserveItemConfig', ObserveItemConfig);


  // TODO:
  // 分值校验

  /** @ngInject */
  function ObserveItemConfig($scope, sessionService, hospitalRest, sysRest, modalService, _) {

    // 自动注入服务数据声明
    var vm = this;
    var dicHelper = sessionService.getDicHelper();
    vm.obsrItemTypeDic = dicHelper.dic["obsrItemType"];
    vm.smartDeviceDic = dicHelper.dic["smartDevice"];
    vm.patVitalEventDic = dicHelper.dic["patVitalEvent"];

    //  观察项类型过滤
    vm.selectObsrItemType = function () {
      vm.queryArgs.checkall = true;
      _.forEach(vm.queryArgs.typeList, function (item) {
        vm.queryArgs.checkall = vm.queryArgs.checkall && item;
      })
      vm.loadobserveItemList.func();
    }

    //  观察项类型全选
    vm.selectAllObsrItemType = function () {
      for (var i = 0; i < vm.queryArgs.typeList.length; i++) {
        vm.queryArgs.typeList[i] = vm.queryArgs.checkall;
      }
      vm.loadobserveItemList.func();
    }

    // 初始化视图
    initViewModel();

    function initViewModel() {

      getWardsList();

      vm.loadobserveItemList = {
        func: getObserveItemList,
        init: true
      }

      vm.queryArgs = {
        checkall: true,
        wardCode: ""
      };

      // 获取空的选项视图
      vm.queryArgs.typeList = [];
      for (var i = 0; i < vm.obsrItemTypeDic.length; i++)
        vm.queryArgs.typeList.push(true);

    }

    // 加载观察配制项
    function getObserveItemList() {

      return sysRest.getObservationItemConfig({
        wardCode: vm.queryArgs.wardCode,
        typeList: getObserveItemQueryArgs()
      }).then(function (response) {
        vm.observeItemList = response;
      });
    }

    // 获取观察项类型查询条件
    function getObserveItemQueryArgs() {
      var args = [];
      for (var i = 0; i < vm.queryArgs.typeList.length; i++) {
        if (vm.queryArgs.typeList[i]) {
          args.push(vm.obsrItemTypeDic[i].dicCode);
        }
      }
      return args;
    }

    // 保存观察项
    vm.saveItem = function (index) {

      sysRest.updateObservationItemConfig(vm.observeItemList[index]).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '观察项修改保存成功'
        })
      })
    }


    // 设置配置项禁用状态
    vm.setItemStatus = function (index, item) {
      item.status = (item.status == 0) ? 1 : 0;
      vm.saveItem(index);
    }

    // 编辑观察项
    vm.openEditPanel = function (item) {
      if (item) {
        item.status = "" + item.status;
      }
      if (item && !item.abnormalEvents) {
        item.abnormalEvents = [{
          abnormalEvent: '',
          maxValue: '',
          minValue: ''
        }];
      }
      modalService.open({
        templateUrl: 'MNIS/modules/configuration/observeItemConfig/observeItemConfig.modal.html',
        size: "lg",
        data: {
          formData: item ? angular.copy(item) : {
            status: '1',
            abnormalEvents: [{
              abnormalEvent: '',
              maxValue: '',
              minValue: ''
            }]
          },
          metaData: {
            showType: 0,
            obsrItemTypeDic: vm.obsrItemTypeDic,
            smartDeviceDic: vm.smartDeviceDic,
            patVitalEventDic: vm.patVitalEventDic,
            wardList: vm.wardList
          }
        },
        initFn: function () {
          var modal = this;
          modal.type = item ? '编辑' : '添加';
        },
        ok: function (data) {
          if (item) {
            return sysRest.updateObservationItemConfig(data).then(function (response) {
              $scope.$emit('toast', {
                type: 'success',
                content: '观察项修改保存成功'
              })
              getObserveItemList();
            })
          } else {
            return sysRest.addObservationItemConfig(data).then(function (response) {
              $scope.$emit('toast', {
                type: 'success',
                content: '添加观察项修改成功'
              })
              getObserveItemList();
            })
          }
        },
        methodsObj: {
          removeItem: function (index) {
            var that = this;
            that.formData.abnormalEvents.splice(index, 1);
          },
          addItem: function () {
            var that = this;
            var newItem = {
              abnormalEvent: '',
              maxValue: '',
              minValue: ''
            };
            that.formData.abnormalEvents.push(newItem);
          }
        }
      });
    }

    // 删除项目
    vm.deleteItem = function (index, item) {

      return sysRest.deleteObservationItemConfig(item.id).then(function () {
        $scope.$emit('toast', {
          type: 'success',
          content: '删除观察项修改成功'
        });

        getObserveItemList();
      })
    }



    // 获取病区列表
    function getWardsList() {
      return hospitalRest.getWards().then(function (response) {
        vm.wardList = response;
      });
    }
  }
})();
