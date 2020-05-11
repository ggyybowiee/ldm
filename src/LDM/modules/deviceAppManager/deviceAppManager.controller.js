(function() {
  "use strict";

  // @ts-check

  angular
    .module("lachesis-ldm")
    .controller("DeviceAppManagerController", DeviceAppManagerController);

  /** @ngInject */
  function DeviceAppManagerController(
    $scope,
    modalService,
    sessionService,
    deviceInfoService,
    Restangular,
    deviceAppService,
    hospitalRest,
    FileUploader,
    _,
    sysRest
  ) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();

    vm.dic = dicHelper.dic;
    vm.openAdd = openAdd;
    vm.openDownload = openDownload;
    vm.downloadFile = downloadFile;
    vm.del = del;
    vm.queryParams = { softName: "" };

    vm.load = {
      init: true,
      func: init
    };

    vm.fileData = {
      url: null,
      name: ''
    };

    vm.formData = {};

    getDeviceBelong();

    function init() {
      return getSoftwares(vm.queryParams).then(function(response) {
        vm.softwares = response;
      });
    }

    function getSoftwares(params) {
      return deviceAppService.getSoftwares(params);
    }

    function getSoftware(seqId) {
      return deviceAppService.getSoftware(seqId);
    }

    function getDeviceBelong() {
      return hospitalRest.getWards().then(function(response) {
        vm.belongs = response;
      });
    }

    function openAdd(item) {
      modalService.open({
        templateUrl: "LDM/modules/deviceAppManager/add.modal.html",
        size: "md",
        data: {
          metaData: {
            dic: vm.dic,
            uploader: new FileUploader({
              removeAfterUpload: true,
              onAfterAddingFile: function (item) {
                var fileType = /\.(\w*)$/g.exec(item._file.name)[1];

                if (["apk"].indexOf(fileType) === -1) {
                  $scope.$emit("toast", {
                    type: "warning",
                    content: "请上传apk类型文件"
                  });
                  return;
                }else{
                  var formData = new FormData();
                  formData.append("uploadFile", item._file);
                  formData.append("size", item._file.size);
                  deviceAppService.postFileLdm(formData).then(function(response) {
                    vm.seqId = response.seqId;
                    vm.modalVm.metaData.fileName = response.fileName;
                    sysRest.apkParseNew(encodeURIComponent(vm.seqId)).then(function (res) {
                      if (!res) {
                        $scope.$emit("toast", {
                          type: "error",
                          content: '文件错误！请重试！'
                        });
                        return;
                      }
                      if (res.code === 'fail') {
                        $scope.$emit("toast", {
                          type: "error",
                          content: res.error
                        });
                      } else {
                        _.assign(vm.modalVm.formData, res.plain());
                      }
                    });
                  });
                }
              }
            })
          },
          formData: { upgradeType: "" }
        },
        ok: function(data) {
          return save.call(this, data, !item);
        },
        initFn: function() {
          var that = this;
          vm.modalVm = that;
          if (item) {
            vm.filePath = null;
            getSoftware(item.seqId).then(function(response) {
              that.formData = response;
              that.formData.status = response.status.toString();
            });
          }
        },
        methodsObj: {
          max30: function() {
            var that = this;
            return (
              that.formData.softVersion > 0 && that.formData.softVersion < 1e30
            );
          },
          getFilenameFromPath: function (path) {
            return path && path.replace(/(\/\w*)*\//g, '')
          }
        }
      });
    }

    function openDownload(row) {
      window.open(row.softPath, row.softName);
    }

    function save(data, isNew) {
      var that = this;
      //上传软件弹出框的保存方法
      if (isNew && !vm.seqId) {
        $scope.$emit("toast", {
          type: "warning",
          content: "请选择需要上传的文件！"
        });
        return;
      }

      if (!isNew) {
        data.attachmentId = vm.seqId;
        return data.customPUT(data.plain(), data.seqId ).then(function() {
          $scope.$emit("toast", {
            type: "success",
            content: "更新成功！"
          });
          vm.load.func();
        });
      } else {
        return vm.softwares.post(_.assign({}, data, { status: 1, attachmentId: vm.seqId })).then(function(res) {
          if (res) {
            $scope.$emit("toast", {
              type: "success",
              content: "保存成功！"
            });
            vm.load.func();
          }
          return res;
        });
      }
    }

    function downloadFile(id) {
      var uri = URI('/windranger/sys/sysAttachment/' + id + '/file');
      return uri.toString();
    }

    function del(item) {
      return item.customDELETE(item.seqId).then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已删除！"
        });
        vm.load.func();
      });
    }
  }
})();
