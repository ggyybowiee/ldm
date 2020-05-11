(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('patientOrderList', patientOrderList)
    .filter('orderGourpItemVisible', function () {
      return function (item, row) {

        if (row.groupType == "┗" || row.groupType == "┃") {
          return "";
        } else return item;
      }
    });

  /** @ngInject */
  function patientOrderList() {
    var directive = {
      restrict: 'E',
      scope: {
        patientInfo: '='
      },
      templateUrl: 'MNIS/directives/patientRecord/orderList/patientOrderList.tpl.html',
      controller: function ($scope, moment, $stateParams, sessionService, modalService, ordersRest, $timeout, _) {

        var vm = this;
        var profile = sessionService.getProfile();
        vm.dicHelper = sessionService.getDicHelper();

        // 本地查看过滤监听
        var cateWatcher = $scope.$watch('vm.filter.showType', function () {
          for (var i = 0; vm.list && i < vm.list.length; i++) {
            var row = vm.list[i];
            delete row.isChecked;
          }
        });
        $scope.$on('$destroy', cateWatcher);

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {
          if (value) {
            vm.current = value.inhosCode;
            document.querySelector('#patientOrderTab').scrollTop = 0;
            resetParams();
            $timeout(function () {
              vm.loadOrders.func();
            });
          }
        });
        $scope.$on('$destroy', patientWatcher);

        //加载患者医嘱
        function loadOrders() {
          var wardCode = $stateParams.wardCode || profile.wardCode;
          if (!vm.current)
            return;

          return ordersRest.getOrdersByHid(wardCode, vm.current, vm.params).then(function (data) {

            var responseData = data.plain();
            vm.list = [];
            _.forEach(responseData, function (orderGroup) {
              _.forEach(orderGroup.items, function (orderItem, index) {

                var showItem = angular.copy(orderGroup);
                delete showItem.items;

                showItem.itemName = orderItem.itemName;
                showItem.itemPrice = orderItem.itemPrice;
                showItem.dosage = orderItem.dosage;
                showItem.dosageUnit = orderItem.dosageUnit;
                showItem.orderRemark = orderItem.orderRemark;
                showItem.specification = orderItem.specification;
                showItem.groupIndex = index;
                showItem.groupCount = orderGroup.items.length;

                if (orderGroup.items.length == 1) {
                  showItem.groupType = "";
                } else {
                  if (index == 0) {
                    showItem.groupType = "┏";
                  } else if (index == orderGroup.items.length - 1) {
                    showItem.groupType = "┗";
                  } else {
                    showItem.groupType = "┃";
                  }
                }

                vm.list.push(showItem);
              })
            })
          })
        }

        // 重置查询参数
        function resetParams() {
          vm.params = {
            endTime: moment().format('YYYY-MM-DD'),
            isLongTerm: '1',
            status: '2',
            execTypeCode: ''
          };
        }

        function saveEditData(data) {
          console.log(data);
          return ordersRest.updateOrderInfo(data.orderGroupNo, {
            isSelfPrepare: data.isSelfPrepare,
            nurseRemark: data.nurseRemark,
            inhosCode: data.inhosCode,
            orderGroupNo: data.orderGroupNo
          }).then(function () {
            $scope.$emit('toast', {
              content: '操作成功'
            });

            $timeout(function () {
              vm.loadOrders.func();
            });
          });
        }

        function orderGourpItemVisible(row) {
          if (row.groupType == "┗" || row.groupType == "┃") {
            return false;
          }
          
          return true;
        }

        // 打开医嘱执行详细
        function open(data) {
          if (vm.filter.showType == 0) {
            modalService.open({
              size: 'lg',
              templateUrl: 'MNIS/directives/patientRecord/orderList/orders.modal.html',
              initFn: function (vm) {
                ordersRest.getOrderDetail(data.orderGroupNo).then(function (data) {
                  vm.list = data;
                })
              }
            });
          } else {
            var index = vm.list.indexOf(data);

            if(index == -1) {
              return;
            }

            var setValue = !data.isChecked;

            for(var i = 0; i < data.groupCount; i++) {
              vm.list[index - data.groupIndex + i].isChecked = setValue;
            }
          }
        }

        function isNew(data) {
          return moment().diff(moment(data.enterDateTime), 'hours') < 2;
        }


        initModelView();
        // 初始化视图
        function initModelView() {

          vm.open = open;
          vm.isNew = isNew;
          vm.filter = {
            showType: 0
          };
          vm.dateOptions = {};
          vm.saveEditData = saveEditData;
          vm.orderGourpItemVisible = orderGourpItemVisible;
          vm.prepare = [
            {
              key: 0,
              value: '非自备药'
            },
            {
              key: 1,
              value: '自备药'
            }
          ];
          resetParams();

          // 医嘱加载
          vm.loadOrders = {
            func: loadOrders
          };


        }

      },
      controllerAs: 'vm'
    };

    return directive;
  }

})();
