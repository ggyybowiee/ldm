(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("NewBridgeConfigurationController", NewBridgeConfigController);

  /** @ngInject */
  function NewBridgeConfigController(
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
    _,
    sysRest,
    deviceAppService
  ) {
    var vm = this;

    var reg = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    vm.id = $stateParams.id ? $stateParams.id : null;
    vm.openDevicesModal = openDevicesModal;
    vm.downloadFile = downloadFile;
    vm.save = save;
    vm.queryParams = {
      eqpName: "",
      eqpType: 1002,
      eqpBelong: "",
      eqpStatus: 10001
    };
    vm.switch = {
      backendServer: true
    };
    vm.getFilenameFromPath = getFilenameFromPath;
    vm.download = download;

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
      ['backendServer', 'content.serverIP'],
      ['staticIp', 'content.fileName']
    ];

    getDeviceBelong();

    if (vm.id) {
      deviceInfoService.getDeviceConfig(vm.id).then(function(res) {
        vm.data = res;

        // 开关设置
        switchArray.forEach(function (prop) {
          vm.switch[prop[0]] = angular.isString(_.get(res, prop[1])) || angular.isObject(_.get(res, prop[1]));
        });

      });
    } else {
      vm.data = {};
    }

    if (!vm.data) {
      vm.data = {};
    }

    if (!vm.data.content) {
      vm.data.content = {
        option: 'both'
      };
    }

    vm.data.content.option = 'both';

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      })
    }

    function download(url) {
      window.open(url, 'ip文件');
    }

    function openDevicesModal() {
      modalService.open({
        templateUrl: "LDM/modules/layoutEquipment/bridgeConfig/addDevices.modal.html",
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
            eqpType: 1004,
            eqpBelong: "",
            eqpStatus: 10001
          };
          that.belongs = vm.belongs;
          if(vm.data === null){
            that.checked = [];
          }else that.checked = vm.data.devices ? vm.data.devices.slice() : [];

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

      deviceAppService.postFileLdm(formData).then(function(response) {
        if (response) {
          _.set(vm.data, 'content.fileSeqId', response.seqId);
          _.set(vm.data, 'content.fileName', response.fileName + '.' + response.fileExtension);
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
      return path && path.replace(/(\/\w*)*\//g, '');
    }

    function downloadFile(id) {
      if(!vm.data) return;
      if(vm.data.content && vm.data.content.fileName){
        var uri = URI('/windranger/sys/sysAttachment/' + id + '/file');
        return uri.toString();
      }
    }

    function save() {
      // 开关未打开不保存
      switchArray.forEach(function (prop) {
        if (!vm.switch[prop[0]]) {
          _.set(vm.data, prop[1], null);
        }
      });

      //验证网关合法性
      if(vm.data.content.gateWay){
        if(!reg.test(vm.data.content.gateWay)){
          $scope.$emit("toast", {
            type: "warning",
            content: "网关形式不正确！"
          });
          return;
        }
      }

      deleteUnnecessaryProp(vm.data);

      //有ID时修改，否则是新建
      if (vm.id) {
        vm.data.put().then(function(response) {
          if (response) {
            $scope.$emit("toast", {
              type: "success",
              content: "更新成功！"
            });
            $state.go("main.bridgeConfig");
          }
        });
      } else {
        vm.data.deviceType = '2';
        vm.data.status = '1';
        deviceInfoService.getDeviceConfigsResource().post(vm.data).then(function(response) {
          if (response) {
            $scope.$emit("toast", {
              type: "success",
              content: "添加成功！"
            });
            $state.go("main.bridgeConfig");
          }
        });
      }
    }
  }
})();
