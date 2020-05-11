(function() {
  'use strict';

  angular
    .module('lachesis-ldm')
    .controller('remindSettingController', remindSettingController);

  /** @ngInject */
  function remindSettingController($rootScope,$scope,deviceAppService,deviceInfoService) {
    var vm = this;
    vm.setting ={};
    vm.postReminder = postReminder;
    vm.setStatus = setStatus;
    vm.setNotifyMethod = setNotifyMethod;
    vm.incomingAddressString = "";
    vm.forwardAddressString = "";

    getReminder();
    getCode();

    function getReminder() {
      return deviceAppService.getSettingReminder().then(function(response) {
        if(response){
          vm.setting = response;
          vm.incomingAddressString = setMailAddress(vm.setting.mailSetting.incomingAddress);
          vm.forwardAddressString = setMailAddress(vm.setting.mailSetting.forwardAddress);
          angular.isArray(vm.setting.warningLevel) ? '' : vm.setting.warningLevel = [];
        } else {
          vm.setting = {
            "id": "",
            "mailSetting": {
              "exstraContent": "",
              "forwardAddress": [],
              "incomingAddress": [],
              "mailTitle": "",
              "password": "",
              "smtpAccount": "",
              "smtpServer": ""
            },
            "notifyMethod": "",
            "warningLevel": []
          };
        }
      })
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function (response) {
        vm.codes = response;
        vm.notifyMethod = _.filter(vm.codes, { type: 'notifyMethod' });
        vm.errorInfos = _.filter(vm.codes, { type: 'errorLevel' });
      });
    }

    function setStatus(code) {
      if(vm.setting.warningLevel.indexOf(code) === -1) {
        vm.setting.warningLevel.push(code);
      } else {
        vm.setting.warningLevel.splice(vm.setting.warningLevel.indexOf(code),1);
      }
    }

    function postReminder() {
      if(vm.incomingAddressString){
        if(vm.incomingAddressString.length === 0){
          vm.setting.mailSetting.incomingAddress = [];
        }else vm.setting.mailSetting.incomingAddress = vm.incomingAddressString.split(';');
      }
      if(vm.forwardAddressString){
        if(vm.forwardAddressString.length === 0){
          vm.setting.mailSetting.forwardAddress = [];
        }else vm.setting.mailSetting.forwardAddress = vm.forwardAddressString.split(';');
      }
      for(var prop in vm.setting){
        if (prop == null || prop == undefined)
        {delete vm.setting.prop;}
      }
      delete vm.incomingAddressString;
      delete vm.forwardAddressString;
      return deviceAppService.upgradeSettingReminder(vm.setting).then(function(response) {
        $scope.$emit("toast", {
          type: "success",
          content: "已保存！"
        });
        getReminder();
        getCode();
      })
    }

    function splitMailAddress(address) {
      var newAddress = null;
      if(address.indexOf(';') > -1){
        newAddress = address.split(';');
      } else newAddress = address;
      return newAddress
    }

    function setMailAddress(array){
      var newString = '';
      if(angular.isArray(array)){
        if(array.length > 1){
          newString = array.join(';');
        }else newString = array[0];
      }else{
        newString = '';
      }
      return newString;
    }

    function setNotifyMethod(){
      //notifyMethod现在不是数组类型。
      if(!vm.setting.notifyMethod){
        vm.setting.notifyMethod = '1';
      }else{
        vm.setting.notifyMethod = null;
      }
    }
  }
})();
