(function () {
  "use strict";
  angular
    .module("lachesis-mnis")
    .directive("pathNursingRecord", pathNursingRecord);

  function pathNursingRecord() {
    var directive = {
      restrict: "EA",
      scope: {
        patientInfo: "=",
        reloadSheets: "&"
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, $timeout, $state, sessionService, nursingRest, docUtil, $q, _) {

        var vm = this;
        var profile = sessionService.getProfile();

        initViewModel();

        // 初始化视图
        function initViewModel() {
          // 患者绑定监听
          var patientWathcer = $scope.$watch("patientInfo", function (value) {
            if (value) {
              $timeout(function () {
                vm.loadNursingRecord.func();
              });
            }
          });
          $scope.$on('$destroy', patientWathcer);

          // 加载护理记录单数据
          vm.loadNursingRecord = {
            func: function () {
              vm.loadNursingRecord.loaded = false;
              return getPathNursingRecord().then(function () {
                vm.loadNursingRecord.loaded = true;
              });
            }
          };
        }

        // 获取患者病历记录
        function getPathNursingRecord() {

          var defer = $q.defer();

          var queryList = [];

          // 查询患者的所有护理记录单实例
          queryList.push(nursingRest.getNursingSheets({
            inhosCode: $scope.patientInfo.inhosCode
          }));

          if (!vm.isBindSheetExist()) {
            queryList.push(docUtil.loadWardCodeTpls());
          }

          $q.all(queryList).then(function (result) {

            var customSheetsQResult = result[0].plain();
            vm.patientNursingDocSheetList = _.filter(customSheetsQResult, {
              category: "hljld"
            });
            calcPageAndOffset(vm.patientNursingDocSheetList);

            loadPathNursingRecord();
            if (!vm.isBindSheetExist()) {
              vm.nursingDocTpl = [];
              _.forEach(result[1].tpl, function (itemGroup) {
                _.forEach(itemGroup, function (item) {
                  if (item.category === "hljld") {
                    vm.nursingDocTpl.push(item);
                  }
                });
              });
            }
            defer.resolve();
          }, function () {
            defer.reject();
          });

          return defer.promise;
        }

        // 创建文书
        vm.createNursingDoc = function (tpl) {

          var keys = ['tplName', 'tplId', 'showType', 'category', 'retouch', 'headerFormItems', 'lineHeight'];

          return nursingRest.updateNursingSheet(_.assign({
              headerForm: {},
              tplRowNum: tpl.rowNum,
              inhosCode: $scope.patientInfo.inhosCode,
              wardCode: profile.wardCode
            },
            _.pick(tpl, keys)
          )).then(function (response) {

            // var createdSheet = response.plain();
            if ($scope.reloadSheets) {
              $scope.reloadSheets();
            }

            var updatingPath = _.cloneDeep($scope.patientInfo.currentPath);
            updatingPath.sheetId = response.sheetId;

            nursingRest.updatePatientPath(updatingPath).then(function (data) {
              $scope.patientInfo.currentPath.sheetId = data.sheetId;
              vm.loadNursingRecord.func();
            });
          });
        }

        function calcPageAndOffset(collection) {
          var grouped = _.groupBy(collection, 'tplId');

          for (var tplId in grouped) {
            var sheets = grouped[tplId];

            _.each(sheets, function (item, index) {
              var sheetIndex = _.findIndex(collection, function (sheet) {
                return item.sheetId === sheet.sheetId;
              });

              collection[sheetIndex].$totalPage = (collection[sheetIndex].rowRequired / collection[sheetIndex].tplRowNum) || 0;
              collection[sheetIndex].$offsetPage = (_.get(sheets, [index - 1, '$offsetPage']) || 0) + (_.get(sheets, [index - 1, '$totalPage']) || 0);
            });
          }
        }

        // 加载护理文书记录
        function loadPathNursingRecord() {
          vm.currentSheet = _.find(vm.patientNursingDocSheetList, {
            'sheetId': $scope.patientInfo.currentPath.sheetId
          });
        }

        // 绑定表单是否存在
        vm.isBindSheetExist = function () {
          return $scope.patientInfo.currentPath.sheetId && vm.currentSheet;
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/directives/nursingPath/pathNursingRecord/pathNursingRecord.tpl.html"
    };

    return directive;
  }
})();
