(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NotificationController", NotificationController);

  /** @ngInject */
  function NotificationController(
    $rootScope,
    $scope,
    $state,
    deviceInfoService,
    hospitalRest,
    modalService,
    $q
  ) {
    var vm = this;
    //向选取的设备推送消息，消息类型分为'普通消息'和'命令消息'
    vm.postMessage = postMessage;
    vm.openDevicesModal = openDevicesModal;
    vm.deleteDevice = deleteDevice;
    vm.reset = reset;
    vm.selectedDevices = [];
    vm.isTimedSending = false;
    vm.time = null;
    vm.date = null;
    vm.deviceTypes = null;
    vm.messageTemplate = {
      content: "",
      macList: [],
      msgType: "general_message"
    };

    getCode();
    getDeviceType();
    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.msgType = _.filter(vm.codes, { type: 'msgType' });
      });
    }

    function getDeviceType(){
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.deviceTypes = response;
      });
    }

    // getDevices();
    function openDevicesModal() {
      modalService.open({
        templateUrl: "LDM/modules/notification/addDevices.modal.html",
        size: "lg",
        data: {
          metaData: {
            devices: ''
          }
        },
        ok: function() {
          var that = this;
          var defer = $q.defer();

          vm.selectedDevices = vm.selectedDevices.concat(that.checked.slice());

          defer.resolve(that.checked);

          return defer.promise;
        },
        initFn: function() {
          var that = this;
          that.queryParams = {
            eqpName: "",
            eqpType: "",
            eqpBelong: "",
            eqpStatus: 10001
          };
          that.deviceTypes = vm.deviceTypes;
          getDevices(that.queryParams).then(function(response) {
            that.devices = filterDevices(vm.selectedDevices, response).map(function(item, index) {
              item.seqNum = index;
              return item;
            });
            // that.devices = response.forEach(function(item, index) {
            //   item.seqNum = index;
            // });
            that.checked = vm.selectedDevices ? vm.selectedDevices.slice() : [];
          });
          hospitalRest.getWards().then(function(response) {
            that.belongs = response;
          })
        },
        methodsObj: {
          getDevices: function () {
            var that = this;
            getDevices(this.queryParams).then(function(response) {
              that.devices = filterDevices(vm.selectedDevices, response);
            });
          }
        }
      });
    }

    function getDevices(params) {
      return deviceInfoService.getDevices(params);
    }

    function filterDevices(selectedItems, items) {
      if (selectedItems.length == 0) return items;
      selectedItems.map(function(selectedItem) {
        for (var i = 0; i < items.length; i++) {
          if (selectedItem === items[i].content.basicInfo.mac) {
            items.splice(i, 1);
          }
        }
      });
      return items;
    }

    function deleteDevice(mac) {
      if(vm.selectedDevices.indexOf(mac) > -1) {
        vm.selectedDevices.splice(vm.selectedDevices.indexOf(mac),1);
      }
    }
    function reset() {
      vm.selectedDevices.length = 0;
      vm.messageTemplate.content = '';
      vm.messageTemplate.msgType = 'general_message';
      vm.messageTemplate.macList.length = 0;
      vm.date = '';
      vm.time = '';
      vm.isTimedSending = false;
      //选择框
    }

    function postMessage() {
      //if(vm.isTimedSending && vm.date && vm.time) vm.messageTemplate.scheduledTime = new Date(vm.date +' ' + vm.time);
      if(vm.isTimedSending){
        if(vm.date && vm.time){
          vm.messageTemplate.scheduledTime = new Date(vm.date +' ' + vm.time);
          if(vm.messageTemplate.scheduledTime < new Date()){
            $scope.$emit("toast", {
              type: "warning",
              content: "推送时间应晚于当前时间！"
            });
          }else{
            vm.messageTemplate.macList = vm.selectedDevices;
            return deviceInfoService
              .postNotifyMessage(vm.messageTemplate)
              .then(function(response) {
                  $scope.$emit("toast", {
                    type: "success",
                    content: "已发送！"
                  });
              });
          }
        }else{
          $scope.$emit("toast", {
            type: "warning",
            content: "请正确填写推送时间！"
          });
        }

      }else{
        vm.messageTemplate.macList = vm.selectedDevices;
        return deviceInfoService
          .postNotifyMessage(vm.messageTemplate)
          .then(function(response) {
              $scope.$emit("toast", {
                type: "success",
                content: "已发送！"
              });
          });
      }
    }
  }
})();
