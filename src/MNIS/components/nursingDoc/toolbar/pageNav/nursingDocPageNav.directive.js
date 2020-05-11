(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('nursingDocPageNav', nursingDocPageNav);

  function nursingDocPageNav($timeout, nursingRest, $q, _, moment) {

    var directive = {
      restrict: "EA",
      scope: {
        curSheet: '=',
        directToPage: '='
      },
      replace: true,
      transclude: true,
      controller: function ($scope) {

        var vm = this;

        // 初始化视图模型
        initViewModel();

        function initViewModel() {

          vm.loadSheetPageDates = {
            func: getSheetPageDates
          }

        }

        //获取SHEET的日期分页信息 
        function getSheetPageDates() {

          var defer = $q.defer();

          nursingRest.getAttendDates($scope.curSheet.sheetId).then(function (response) {
            vm.datesPageList = response.plain();

            var lastDate;
            _.forEach(vm.datesPageList, function (item) {

              // lastDate = lastDate || moment(item.recordDate).format('YYYY-MM-DD');
              if (!lastDate || lastDate != moment(item.recordDate).format('YYYY-MM-DD')) {
                lastDate = moment(item.recordDate).format('YYYY-MM-DD');
                item.dateString = lastDate;
              } else {
                item.dateString = "";
              }
              item.timeString = moment(item.recordDate).format('HH:mm');
              item.searchText = moment(item.recordDate).format('YYYYMMDDHHmm');
            });

            angular.element(".nursing-doc-search-filter-input").focus();
            $timeout(function () {
              defer.resolve();
            })
          }, function () {
            defer.reject();
          });

          return defer.promise;
        }

        // 菜单打开
        vm.menuToggle = function () {
          delete vm.datesPageList;
          $timeout(function () {
            vm.loadSheetPageDates.func();
          })
        }

        // 定位到指定的页码
        vm.directToPage = function (page) {
          if ($scope.directToPage != null)
            $scope.directToPage(page, true)
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/nursingDoc/toolbar/pageNav/nursingDocPageNav.tpl.html",
      link: function (scope, element) {}
    }

    return directive;
  }
})();
