(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("OTAManagementController", OTAManagementController);

  /** @ngInject */
  function OTAManagementController(
    $scope,
    modalService,
    sessionService,
    deviceInfoService,
    Restangular,
    deviceAppService,
    hospitalRest,
    FileUploader,
    $interval,
    $q,
    _
  ) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();

    vm.dic = dicHelper.dic;
    vm.openAdd = openAdd;
    vm.openDownload = openDownload;
    vm.downloadFile = downloadFile;
    vm.openDetail = openDetail;
    vm.del = del;
    vm.save = save;
    vm.fileName = null;
    vm.progress = null;
    vm.queryParams = { keyword: "" };
    vm.load = {
      init: true,
      func: init
    };

    vm.fileData = {
      url: null,
      name: ""
    };

    // vm.uploader = new FileUploader({
    //   removeAfterUpload: true,
    //   onAfterAddingFile: getSoftwareUploadResult
    // });

    vm.formData = {};

    getDeviceTypes();

    function init() {
      return getOTAPackages(vm.queryParams).then(function(response) {
        vm.softwares = response;
      });
    }

    function getOTAPackages(params) {
      return deviceAppService.getOTAPackages(params);
    }

    function getOTAPackage(packageId) {
      return deviceAppService.getOTAPackage(packageId);
    }

    function getDeviceTypes() {
      //获取所有设备类型名称
      return deviceInfoService.getDeviceType().then(function(response) {
        vm.deviceTypes = response;
      });
    }

    function openAdd() {
      var instance = modalService.open({
        templateUrl:
          "LDM/modules/deviceAppManager/OTAManagement/addPackage.modal.html",
        size: "md",
        data: {
          metaData: {
            dic: vm.dic,
            deviceTypes: vm.deviceTypes,
            uploader: new FileUploader({
              removeAfterUpload: true,
              onAfterAddingFile: function (item) {
                var fileType = /\.(\w*)$/g.exec(item._file.name)[1];

                      if (["zip"].indexOf(fileType) === -1) {
                        $scope.$emit("toast", {
                          type: "warning",
                          content: "请上传zip类型文件"
                        });
                        return;
                      }else{
                        vm.modalVm.fileName = item._file.name;
                      }
              }
            })
          },
          formData: {}
        },
        ok: function(data) {
          var that = this;
          vm.modalVm = that;
          //通过该属性值，开始上传后，确认和取消按钮不能再点击，直到该模态框自动关闭。
          vm.modalVm.metaData.buttonDis = true;
          if(!data.deviceType){
            $scope.$emit("toast", {
              type: "warning",
              content: "请选择支持的设备类型！"
            });
          }else if(!vm.modalVm.fileName){
            $scope.$emit("toast", {
              type: "warning",
              content: "请选择上传文件！"
            });
          }else if(data.deviceType && (vm.modalVm.fileName || vm.modalVm.metaData.softPath)){
            return save.call(this, data);
          }

        },
        initFn: function() {
          var that = this;
          vm.modalVm = that;
          vm.modalVm.metaData.progress = null;
          vm.modalVm.metaData.buttonDis = false;
        },
        methodsObj: {
          getFilenameFromPath: function(path) {
            return path && path.replace(/(\/\w*)*\//g, "");
          }
        }
      });

      instance.closed.then(function () {
        $interval.cancel(vm.progress);
      })
    }

    function openDownload(row) {
      window.open(row.packageUrl, row.name);
    }

    function save() {
      var file = new FormData();
      vm.modalVm.metaData.progress = null;
      var defer = new $q.defer();
      // vm.modalVm.metaData.progress.uploadStatus = 0;
      file.append("uploadFile", vm.modalVm.metaData.uploader.queue[0]._file);
      if(vm.modalVm.metaData.uploader.queue[0]._file.size > 30*1024*1024){
        //大于30MB的文件上传，先调用postHugePackage申请文件上传。getUploadProgress用来获取上传进度。
        vm.modalVm.metaData.progress = {uploadRate: 0.01,uploadedSize: 0, fileSize: 0,uploadStatus: 0};
        deviceAppService.postHugePackage().then(function(res){
          if(res){
            vm.progress = $interval(function(){
              // var url = res + '/progress'
              deviceAppService.getUploadProgress(res).then(function(response){
                if(response.uploadRate === 0 ) response.uploadRate = 0.01;
                vm.modalVm.metaData.progress = response;
                if(response.uploadRate === 1) $interval.cancel(vm.progress);
              }).catch(defer.resolve)
            }, 1000);
            deviceAppService.postFileLdm(file,{'uploadId': res}).then(function(res) {
              if(res) {
                return deviceAppService
                .postOTAPackage({seqId: res.seqId, deviceType: vm.modalVm.formData.deviceType})
                .then(function(respon) {
                  defer.resolve();
                  if (respon) {
                    $scope.$emit("toast", {
                      type: "success",
                      content: "保存成功！"
                    });
                    $interval.cancel(vm.progress);
                    vm.load.func();
                  }
                  return true;
                }).catch(function(){
                  defer.resolve();
                });
              }
              return true;
            }).catch(function(){
              defer.resolve();
            });
          }
        })
        return defer.promise;
      }else {
        return deviceAppService.postFileLdm(file).then(function(res) {
          if(res) {
            deviceAppService
            .postOTAPackage({seqId: res.seqId, deviceType: vm.modalVm.formData.deviceType})
            .then(function(res) {
              if (res) {
                $scope.$emit("toast", {
                  type: "success",
                  content: "保存成功！"
                });
                vm.load.func();
              }
              return true;
            });
          }
        });
      }
    }

    function openDetail(item) {
      modalService.open({
        templateUrl:
          "LDM/modules/deviceAppManager/OTAManagement/packageDetail.modal.html",
        size: "lg",
        data: {
          metaData: {}
        },
        methodsObj: {},
        initFn: function() {
          var that = this;
          getOTAPackage(item.id).then(function(response) {
            that.data = response;
          });
        },
        ok: function() {}
      });
    }

    function downloadFile(url) {
      var uri = '';
      if(url){
        uri = URI(url);
      }
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
