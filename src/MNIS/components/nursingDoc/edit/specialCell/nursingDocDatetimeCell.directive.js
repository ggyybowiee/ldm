(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('nursingDocDatetimeCell', nursingDocDatetimeCell);

  /** @ngInject */
  function nursingDocDatetimeCell(moment) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        displayFormat: '@',
        lineHeight: '=',
        fontSize: '=',
        textAlign: '=',
        class: '='        
      },
      controller: function ($scope) {

        
        var watcher = $scope.$watch('ngModel', function () {
          if ($scope.ngModel == undefined) {
            $scope.displayString = "";
            return;
          }

          var realDateString = $scope.ngModel.replace(/<br>/g, "");
          realDateString = realDateString.replace(/<div>/g, "");
          realDateString = realDateString.replace(/<\/div>/g, "");
          var date = new Date(realDateString);

          $scope.displayString = $scope.displayFormat ? moment(date).format($scope.displayFormat) : "";
          $scope.displayString = $scope.displayString.replace(/ /g, "\n");
        });
        $scope.$on('$destroy', watcher);

      },
      templateUrl: 'MNIS/components/nursingDoc/edit/specialCell/nursingDocDatetimeCell.tpl.html',
      replace: true,
      link: function () {

        
      }
    };

    return directive;
  }

})();
