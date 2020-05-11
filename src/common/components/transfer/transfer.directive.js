(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('transfer', transfer);

  /** @ngInject */
  function transfer(moment,_) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        wardList: '=' 
      },
      templateUrl: 'common/components/transfer/transfer.tpl.html',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr) {
      // scope.searchChange = function() {
      //   console.log(scope.filter)
      //   scope.filterList = _.filter(scope.wardList, function(item) { return item.wardName.indexOf(scope.filter) > -1; });
      //   console.log(scope.filterList)
      // };

      scope.selected = function (item) {
        scope.ngModel = [];
        // scope.wardList[index].selected = !scope.wardList[index].selected;
        item.selected = !item.selected;
        scope.selectedWards = _.filter(scope.wardList, function(item) { return item.selected; });
        if (scope.selectedWards.lenght === 0) {
          scope.ngModel = [];
        } else {
          _.map(scope.selectedWards, function(item) {
            scope.ngModel.push(item.wardCode);
          });
        }
      }
    }
  }

})();
