(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NewNDAconfigurationController", newNDAconfigController);

  /** @ngInject */
  function newNDAconfigController(
    $rootScope,
    $scope,
    $state,
    $q,
    modalService,
    deviceInfoService,
    ldmSessionCache,
    $stateParams,
    hospitalRest,
    FileUploader,
    sysRest,
    _,
    deviceAppService
  ) {
    var vm = this;

    //验证子网掩码，网关等
    var reg = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    vm.id = $stateParams.id ? $stateParams.id : null;
    vm.openDevicesModal = openDevicesModal;
    vm.save = save;
    vm.getFilenameFromPath = getFilenameFromPath;
    vm.downloadFile = downloadFile;
    vm.setUncheckedProperty = setUncheckedProperty;
    vm.changeTimeServerState = changeTimeServerState;
    vm.queryParams = {
      eqpName: "",
      eqpType: 1001,
      eqpBelong: "",
      eqpStatus: 10001
    };
    vm.download = download;
    vm.switch = {};

    vm.uploader = new FileUploader({
      removeAfterUpload: true,
      onAfterAddingFile: getIpParseResult
    });

    vm.wlanBands = [{
      code: '0',
      value: '自动切换'
    }, {
      code: '1',
      value: '5G'
    }, {
      code: '2',
      value: '2.4G'
    }];
    vm.encryptTypes = [{
      code: '0',
      value: '不加密'
    }, {
      code: '2',
      value: 'WAP/WAP2-PSK'
    }, {
      code: '1',
      value: 'WEP'
    }, {
      code: '3',
      value: '802.1xEAP'
    }];

    var switchArray = [
      ['OTA', 'content.OTA'],
      ['pdaScanMethod', 'content.pdaScanMethod'],
      ['backendServer', 'content.backendServer'],
      ['timeServer', 'content.syncTime.timeServer'],
      ['desktopTitle', 'content.desktopTitle'],
      ['staticIp', 'content.AP.SSIDstaticIp.fileName']
    ];

    getDeviceBelong();

    if (vm.id) {
      deviceInfoService.getDeviceConfig(vm.id).then(function(res) {
        vm.data = res;

        // 开关设置
        switchArray.forEach(function (prop) {
          vm.switch[prop[0]] = angular.isString(_.get(res, prop[1])) || angular.isObject(_.get(res, prop[1]));
        });
        if(vm.data.content.sysPwdEnable === 0){
          vm.data.content.sysPwdEnable = 1;
        }
        if(angular.isString(vm.data.content.pdaScanMethod)){
          vm.switch['pdaScanMethod'] = 1;
        }
      });
    } else {
      vm.data = {};
    }

    function download(url) {
      window.open(url, 'ip文件');
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      })
    }

    function openDevicesModal() {
      modalService.open({
        templateUrl: "LDM/modules/layoutEquipment/NDAconfig/addDevices.modal.html",
        size: "lg",
        ok: function() {
          var defer = $q.defer();

          vm.data.devices = this.checked.slice();

          defer.resolve(this.checked);

          return defer.promise;
        },
        initFn: function() {
          var that = this;
          that.queryParams = {
            eqpName: "",
            eqpType: 1001,
            eqpBelong: "",
            eqpStatus: 10001
          };
          that.belongs = vm.belongs;
          if(vm.data === null){
            that.checked = [];
          }else that.checked = vm.data.devices ? vm.data.devices.slice() : [];
          // that.checked = vm.data.devices ? vm.data.devices.slice() : [];

          getDevices(that.queryParams).then(function(response) {
            that.devices = response;
          });
        },
        methodsObj: {
          getDevices: function () {
            var that = this;
            getDevices(this.queryParams).then(function(response) {
              that.devices = response;
            });
          }
        }
      });
    }

    function getDevices(params) {
      return deviceInfoService.getDevices(params);
    }

    function getIpParseResult(item) {
      var formData = new FormData();
      formData.append("uploadFile", item._file);
      var fileType = /\.(\w*)$/g.exec(item._file.name)[1];
      // formData.append("type", fileType);

      if (['xls', 'xlsx'].indexOf(fileType) === -1) {
        $scope.$emit("toast", {
          type: "warning",
          content: "请上传表格文件类型（xlx、xlxs）"
        });
        return;
      }

      // sysRest.upload({
      //   moduleName: "nda_config_ip",
      //   type: fileType
      // }, formData).then(function(response) {
      //   if (response) {
      //     _.set(vm.data, 'content.AP.SSIDstaticIp.url', response.file_url);
      //   }
      // });
      deviceAppService.postFileLdm(formData).then(function(response) {
        if (response) {
          _.set(vm.data, 'content.AP.SSIDstaticIp.fileSeqId', response.seqId);
          _.set(vm.data, 'content.AP.SSIDstaticIp.fileName', response.fileName + '.' + response.fileExtension);
          vm.fileInfo = response;
        }
      });
    }

    function deleteUnnecessaryProp(obj) {
      Object.keys(obj).forEach(function (key) {
        if (obj[key] === null) {
          delete obj[key]
        }

        if (angular.isObject(obj[key]) && Object.keys(obj[key]).length > 0) {
          deleteUnnecessaryProp(obj[key]);
        }
      });

      if(!obj.fileName && obj.fileSeqId) delete obj.fileSeqId;
    }

    function getFilenameFromPath(path) {
      return path && path.replace(/(\/\w*)*\//g, '')
    }

    function downloadFile(id) {
      if(vm.data && vm.data.content && vm.data.content.AP.SSIDstaticIp && vm.data.content.AP.SSIDstaticIp.fileName){
        var uri = URI('/windranger/sys/sysAttachment/' + id + '/file');
        return uri.toString();
      }
    }

    function setUncheckedProperty(){
      if(vm.data.content.sysPwdEnable === -1){
        vm.data.content.sysPassword = null;
      }
      if(vm.switch['pdaScanMethod'] === -1){
        vm.data.content.pdaScanMethod = -1;
      }
    }

    function changeTimeServerState(){
      if(!vm.switch.timeServer && vm.data.content.syncTime.syncInterval){
        delete vm.data.content.syncTime;
      }
    }

    function save() {
      // if((vm.data.content.wifiRoaming.trigger && (vm.data.content.wifiRoaming.trigger < 30 || vm.data.content.wifiRoaming.trigger > 100)) || (vm.data.content.wifiRoaming.gain && (vm.data.content.wifiRoaming.gain < 30 || vm.data.content.wifiRoaming.gain > 100)) ){
      //   $scope.$emit("toast", {
      //     type: "warning",
      //     content: "漫游触发值或增益值超出范围！"
      //   });
      //   return;
      // }
      // 开关未打开不保存
      switchArray.forEach(function (prop) {
        if (!vm.switch[prop[0]]) {
          _.set(vm.data, prop[1], null);
        }
      });

      if(vm.switch.staticIp){
        if(!vm.data.content.AP.SSIDstaticIp.fileName){
          $scope.$emit("toast", {
            type: "warning",
            content: "请选择静态IP配置文件！"
          });
          return;
        }
      }

      //验证网关合法性
      if(vm.data.content.AP.SSIDstaticIp.gateway){
        if(!reg.test(vm.data.content.AP.SSIDstaticIp.gateway)){
          $scope.$emit("toast", {
            type: "warning",
            content: "网关形式不正确！"
          });
          return;
        }
      }

      if(vm.data.content.sysPwdEnable === 1 && (!vm.data.content.sysPassword || vm.data.content.sysPassword.length === 0)){
        vm.data.content.sysPwdEnable = 0;
      }else if(vm.data.content.sysPwdEnable === -1){
        vm.data.content.sysPassword = null;
      }

      if(vm.switch['pdaScanMethod'] === -1){
        vm.data.content.pdaScanMethod = -1;
      }
      vm.data.status = 1;

      deleteUnnecessaryProp(vm.data);

      if(vm.data.content.syncTime==null || angular.equals({},vm.data.content.syncTime)){
        delete vm.data.content.syncTime;
      }

      //有ID时修改，否则是新建
      if (vm.id) {
        vm.data.put().then(function(response) {
          if (response) {
            $scope.$emit("toast", {
              type: "success",
              content: "更新成功！"
            });
            $state.go("main.NDAconfig");
          }
          // $state.go("main.NDAconfig");
        });
      } else {
        vm.data.deviceType = '1';
        deviceInfoService.getDeviceConfigsResource().post(vm.data).then(function(response) {
          vm.data.id = response.id;
          if (response) {
            $scope.$emit("toast", {
              type: "success",
              content: "添加成功！"
            });
            $state.go("main.NDAconfig");
          }
          // $state.go("main.NDAconfig");
        });
      }
    }
  }
})();
