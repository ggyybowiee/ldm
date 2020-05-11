(function () {
  "use strict";
  angular
    .module('lachesis-mnis')
    .directive('nursingDocUserSignInput', nursingDocUserSignInput);


  function nursingDocUserSignInput() {

    var directive = {
      restrict: "EA",
      scope: {
        nursingDocData: '=',
        signKey: '='
      },
      replace: true,
      transclude: true,
      controller: function ($rootScope, $scope, docUtil, sessionService) {

        // 审核签名控件
        $scope.verifySignature = function () {
          if ($scope.nursingDocData.data[$scope.signKey]) {
            docUtil.caSignRecord($scope.nursingDocData, "verifySignCancel", $scope.signKey);
          } else {
            docUtil.caSignRecord($scope.nursingDocData, "verifySign", $scope.signKey);
          }
        }
      },
      controllerAs: "vm",
      templateUrl: "MNIS/components/estimateDoc/estimateDocControl/nursingDocUserSignInput/nursingDocUserSignInput.tpl.html"
    }

    return directive;
  }
})();
