(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('nursingDocDivideCell', nursingDocDivideCell);

  /** @ngInject */
  function nursingDocDivideCell(_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        class: '=',
        seperatorChar: '=',
        lineHeight: '=',
        fontSize: '=',
        seperatorType: '=',
        visibility: '=',
        cell: '=',
        divideVisibility: "=",
        //  接受text、sign两种类型
        contentType: '@'
      },
      controller: function ($scope) {
      },
      templateUrl: 'MNIS/components/nursingDoc/edit/specialCell/nursingDocDivideCell.tpl.html',
      replace: true,
      link: function (scope) {

        scope.seperatorChar = scope.seperatorChar || '/';
        scope.lineHeight = scope.lineHeight || 26;

        var watcher = scope.$watch('ngModel', function (value) {

          var realData = "";
          // 处理签名的情况
          if (angular.isArray(value)) {
            _.forEach(value, function (itemVal, index) {
              realData += ((index != 0) ? "/" : "") + itemVal;
            })
          } else {
            realData = value || "";
          }
          
          realData = realData.replace(/<br>/g, "");
          realData = realData.replace(/<div>/g, "");
          realData = realData.replace(/<\/div>/g, "");

          var dataItems = realData.split(scope.seperatorChar);
          scope.leftValue = dataItems[0] || "";
          scope.rightValue = dataItems[1] || "";

          scope.isValid = dataItems.length >= 2;

          if (scope.visibility == 'always')
            scope.divideVisibility = false;

          scope.isShow = (scope.visibility == 'valid') ? scope.isValid : true;
          scope.allValue = realData;
        });
        scope.$on('$destroy', watcher);
      }
    };

    return directive;
  }

})();
