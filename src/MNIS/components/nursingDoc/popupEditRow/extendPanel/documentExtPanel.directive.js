(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('documentExtPanel', documentExtPanel);


  function documentExtPanel() {

    var directive = {
      restrict: "EA",
      scope: {
        editData: "=",
        extendEcho: "=",
        insertCallback: "=",
        patientInfo: "="
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, examLabelRest, $timeout, moment, $filter, nursingRecordUtil, nursingRest, $templateRequest, $sce) {

        var vm = this;

        // 患者监听器
        var patientWatcher = $scope.$watch('patientInfo', function (value) {

          if (value) {
            vm.current = value.inhosCode;
            $timeout(function () {
              vm.loadDocuments.func();
            })
          }
        });
        $scope.$on('$destroy', patientWatcher);

        // 重置查询参数
        function resetParams() {
          vm.getDocumentLabelParams = {
            begin: moment($scope.patientInfo.inDate).format('YYYY-MM-DD'),
            end: moment().format('YYYY-MM-DD')
          };
        }

        vm.selectDocument = function (docu) {

          $templateRequest(docu.fileUrl).then(function (res) {

            var iframe = document.querySelector('#patient-document-ext-import-iframe');
            iframe.contentWindow.document.head.innerHTML = window.document.head.innerHTML;
            iframe.contentWindow.document.body.id = 'documentExt';
            iframe.contentWindow.document.body.innerHTML = res;

            // var bodyElme = $(iframe.contentWindow.document.body);
            // var scale = bodyElme.width() / $(iframe).width();
            // bodyElme.css('transform', 'scale(' + scale + ',' + scale + ')');
            // bodyElme.css('transform-origin', '0 0')
          });
        }

        // 获取检查列表
        function getDocuments() {

          resetParams();
          vm.getDocumentLabelParams.pid = $scope.patientInfo.patCode;
          vm.getDocumentLabelParams.inhosCode = $scope.patientInfo.inhosCode;
          return nursingRest.getDocumentExt($scope.patientInfo.patCode, $scope.patientInfo.inhosCode).then(function (res) {
            vm.documents = res;
            $timeout(function () {
              if (vm.documents.length > 0) {
                vm.selectedDocument = vm.documents[0];
                vm.selectDocument(vm.documents[0]);
              }
            }, 100);
          });
        }

        initModelView();
        // 初始化视图
        function initModelView() {

          vm.loadDocuments = {
            func: getDocuments
          }

          vm.getDocumentLabelParams = {};
        }

        // 插入引用部分
        vm.insertText = function () {
          vm.importText = document.getElementById('patient-document-ext-import-iframe').contentWindow.document.getSelection().toString();

          if (!vm.importText) {
            $rootScope.$broadcast('toast', {
              type: 'warning',
              content: '请选择需要引用内容'
            });
            return;
          }

          nursingRecordUtil.insertText($scope.editData, $scope.extendEcho.focusRowEcho, vm.importText, $scope, $scope.insertCallback);
          vm.importText = "";
        }

      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/popupEditRow/extendPanel/documentExtPanel.tpl.html"
    }

    return directive;
  }
})();
