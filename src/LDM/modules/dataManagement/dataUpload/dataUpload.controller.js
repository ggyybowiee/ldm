(function() {
  "use strict";

  angular
    .module("lachesis-ldm")
    .controller("DataUploadController", DataUploadController);

  /** @ngInject */
  function DataUploadController(
    $rootScope,
    $scope,
    $state,
    deviceInfoService,
    hospitalRest,
    dataManagementService,
    $filter,
    moment,
    FileUploader,
    modalService,
    _
  ) {
    var vm = this;

    vm.select = false;
    vm.openAdd = openAdd;
    vm.downloadFile = downloadFile;
    vm.updateDownloadTimes = updateDownloadTimes;
    vm.cancelPackage = cancelPackage;
    vm.del = del;
    vm.today = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss");
    vm.defaultStart = moment()
      .subtract(1, "months")
      .format("YYYY-MM-DD HH:mm:ss");
    vm.isMonthAgo =  false;
    vm.isFirstLoad = true;
    vm.queryParams = {
      startTime: vm.defaultStart,
      endTime: vm.today
    };
    vm.load = {
      init: true,
      func: init
    };

    getCode();
    function init() {
      var startTime = vm.queryParams.startTime;
      var endTime = vm.queryParams.endTime;
      var params = {
        startTime: moment(startTime).startOf("day").format("YYYY-MM-DD HH:mm:ss"),
        endTime: moment(endTime).endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        orderBy: 'endTime'
      };
      return dataManagementService
        .getDataPackage(params)
        .then(function(response) {
          vm.history = $filter('orderBy')(response.queryResult, '-endTime');
          //有记录时，更新最后打包时间，判断是否需要显示提醒打包信息。
          if(vm.isFirstLoad) {
            vm.isFirstLoad = false;
            if(vm.history.length === 0 || vm.history.length > 0 && moment(vm.today).subtract(1, 'month').isAfter($filter("date")(_.find(vm.history, { status: 2 }).endTime, "yyyy-MM-dd"))){
              vm.isMonthAgo = true;
            }
          }
        });
    }

    function getCode() {
      return deviceInfoService.getCodes().then(function(response) {
        vm.codes = response;
        vm.packStatus = _.filter(vm.codes, { type: "packStatus" });
      });
    }

    function openAdd() {
      modalService.open({
        templateUrl: "LDM/modules/dataManagement/dataUpload/upload.modal.html",
        size: "sm",
        data: {
          metaData: {

          },
          formData: { }
        },
        ok: function(data) {
          var that = this;
          data.startTime = data.startTime ? moment(data.startTime).startOf("day").format("YYYY-MM-DD HH:mm:ss") : null;
          data.endTime = moment(data.endTime).endOf("day").format("YYYY-MM-DD HH:mm:ss");
          return save.call(this, data);
        },
        initFn: function() {
          var that = this;
          // if (item) {
          //   vm.filePath = null;
          //   getSoftware(item.seqId).then(function(response) {
          //     that.formData = response;
          //     that.formData.status = response.status.toString();
          //   });
          // }
          that.isPacked = false;
          if(vm.history.length === 0) {
            that.formData.startTime = null;
          } else {
            that.formData.startTime = $filter("date")(_.find(vm.history, { status: 2 }).endTime, "yyyy-MM-dd HH:mm:ss");
          }
          that.formData.endTime = vm.today;
        },
        methodsObj: {
        }
      });
    }

    function openDownload(row) {
      window.open(row.softPath, row.softName);
    }

    function save(data) {
      var that = this;
      return dataManagementService.postDataPackage(data).then(function() {
        vm.isMonthAgo = false;
        vm.load.func();
      });
    }

    function downloadFile(item) {
        var uri = URI("/windranger/sys/sysAttachment/" + item.attachmentId + "/file");
        return uri.toString();
    }

    function cancelPackage(item) {
      return dataManagementService.cancelPost(item.id).then(function() {
        vm.load.func();
      })
    }
    function updateDownloadTimes(item) {
      return dataManagementService.updateDownLoadTimes(item.id).then(function() {
        item.downloadTimes = item.downloadTimes + 1;
      });
    }

    function del(item) {
      return dataManagementService.deleteDataPackage(item.id).then(function() {
        $scope.$emit("toast", {
          type: "success",
          content: "已删除！"
        });
        vm.load.func();
      });
    }
  }
})();
