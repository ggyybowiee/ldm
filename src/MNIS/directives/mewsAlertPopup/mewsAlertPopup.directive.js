(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('mewsAlertPopup', mewsAlertPopup)
    .filter('senseValue', function(item) {

      

    });


  function mewsAlertPopup() {

    var directive = {
      restrict: "EA",
      scope: {
        alert: '=',
        process: '=',
        wait: '='
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, _, sessionService) {

        var vm = this;
        var dicHelper = sessionService.getDicHelper();
        vm.vitalSignTypeDic = {};
        for (var i = 0; i < dicHelper.dic["vitalItem"].length; i++) {
          var dicItem = dicHelper.dic["vitalItem"][i];
          vm.vitalSignTypeDic[dicItem.dicCode] = dicItem;
        }

        vm.handlerMewsAlert = function (processed) {
          if (processed && $scope.process) {
            $scope.process($scope.alert);
          } else if ($scope.wait) {
            $scope.wait($scope.alert);
          }
        }

        vm.getAdviceList = function (nursingAdvise) {

          if (!nursingAdvise)
            return [];

          var advice = nursingAdvise.split('\n');
          return advice;
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/directives/mewsAlertPopup/mewsAlertPopup.tpl.html"
    }

    return directive;
  }
})();
