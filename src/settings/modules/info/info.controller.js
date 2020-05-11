(function() {
   'use strict';

  angular
    .module('lachesis-settings')
    .controller('HosInfoController', HosInfoController);

  /** @ngInject */
  function HosInfoController($scope, sysRest) {
    var vm = this;

    activate();

    function activate() {
      vm.iconOptions = {
        sizeRules: { max: "1M" },
        suffixRules: ["jpg", "png"],
        moduleName: "hospital_icon"
      };
      vm.imgOptions = {
        sizeRules: { max: "5M" },
        suffixRules: ["jpg", "png"],
        moduleName: "hospital_banner"
      };
      vm.ok = ok;
      vm.isNewInfo = false;
      vm.load = {
        func: loadData,
        init: true
      };
      vm.reload = reload;
    }

    function ok() {
      vm.formData.hosCode ? "" : (vm.formData.hosCode = "test1");
      if (vm.isNewInfo) {
        delete vm.formData.hosImagePath;
        delete vm.formData.hosIconPath;
        delete vm.formData.hosLogoPath;
        return sysRest.postHosInfo(vm.formData).then(function() {
          $scope.$emit("toast", {
            type: "success",
            content: "上传成功！"
          });
          vm.load.func();
        });
      } else {
        delete vm.formData.hosImagePath;
        delete vm.formData.hosIconPath;
        delete vm.formData.hosLogoPath;
        return sysRest.putHosInfo(vm.formData).then(function() {
          $scope.$emit("toast", {
            type: "success",
            content: "上传成功！"
          });
          vm.load.func();
        });
      }
    }
    function loadData() {
      return sysRest.getHosInfo().then(function(data) {
        vm.formData = data;
      }).catch(function (error) {
        if (error.status === 404) {
          vm.isNewInfo = true;
        }
      });
    }

    function reload() {
      location.href = "/";
    }
  }
})();
