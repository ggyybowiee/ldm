(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('estimateCheckbox', estimateCheckbox)
    .filter('estimateCheckBoxChecked', function(_){
      return function(opt, options){
        return _.find(options, {'id': opt.id}) ? true : false;
      }
    });

  /** @ngInject */
  function estimateCheckbox(_, $filter) {
    var directive = {
      restrict: 'E',
      scope: {
        ngModel: '=',
        options: '=',
        onChange: '='
      },
      templateUrl: 'MNIS/components/estimateDoc/estimateDocControl/estimateCheckbox/estimateCheckbox.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope) {

      scope.updateSelection = function ($event, opt) {

        var checkbox = $event.target;
        var checked = checkbox.checked;
        var idx;

        if (checked) {
          for (idx = 0; idx < scope.ngModel.length; idx++) {
            if (scope.ngModel[idx].id > opt.id)
              break;
          }
          scope.ngModel.splice(idx, 0, opt);
        } else {

          var deleteItems = [];
          for (idx = 0; idx < scope.ngModel.length; idx++) {
            if (scope.ngModel[idx].id == opt.id)
              deleteItems.push(idx);
          }

          for (idx = 0; idx < deleteItems.length; idx++) {
            scope.ngModel.splice(deleteItems[idx] - idx, 1);
          }
        }

        scope.ngModel = $filter('orderBy')(scope.ngModel, optionsOrderBy);
        scope.onChange(scope.ngModel);
      };

      function optionsOrderBy(option) {
        var index = _.findIndex(scope.options, {
          'id': option.id
        });
        return index;
      }
    }
  }

})();
