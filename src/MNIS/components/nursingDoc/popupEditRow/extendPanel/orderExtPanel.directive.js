(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('orderExtPanel', orderExtPanel);


  function orderExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        insertCallback: "=",
        editData: "=",
        extendEcho: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($scope, $timeout, ordersRest, moment, $stateParams, sessionService, nursingRecordUtil, _) {

        var vm = this;
        var profile = sessionService.getProfile();
        vm.dicHelper = sessionService.getDicHelper();

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {
          vm.current = value.inhosCode;
          resetParams();
          $timeout(function () {
            vm.loadOrders.func();
          })
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
                showItem.itemNameAbbr = orderItem.itemNameAbbr;
                showItem.itemPrice = orderItem.itemPrice;
                showItem.dosage = orderItem.dosage;
                showItem.dosageUnit = orderItem.dosageUnit;
                showItem.orderRemark = orderItem.orderRemark;
                showItem.specification = orderItem.specification;

                if (orderGroup.items.length == 1)
                  showItem.groupType = "";
                else {
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
            status: '',
            execTypeCode: ''
          };
        }

        initModelView();
        // 初始化视图
        function initModelView() {

          vm.open = open;
          vm.filter = {
            showType: 0
          };
          vm.dateOptions = {};
          resetParams();

          // 医嘱加载
          vm.loadOrders = {
            func: loadOrders
          };
        }

        // 插入医嘱简称
        vm.insertOrderShortcut = function (order) {
          var importText = "" + order.itemNameAbbr + "";
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, importText, $scope, $scope.insertCallback);
        }

        // 插入医嘱
        vm.insertOrder = function (order) {
          var importText = "" + order.itemName + " " + order.administration + " " + order.frequencyCode + "";
          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, importText, $scope, $scope.insertCallback);
        }

        // 选中医嘱
        vm.selectOrder = function (order) {
          vm.selectedOrder = order;
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/orderExtPanel.tpl.html"
    }

    return directive;
  }
})();
