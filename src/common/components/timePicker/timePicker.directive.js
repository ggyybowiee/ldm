(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('timePicker', timePicker);

  /** @ngInject */
  function timePicker(moment) {
    var directive = {
      restrict: 'E',
      scope: {
        model: '=ngModel',
        onChange: '&ngChange',
        showNow: '=',
        options: '='
      },
      templateUrl: 'common/components/timePicker/timePicker.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      scope.name = (scope.options && scope.options.name) || attr.ngModel.split('.').pop();
      if (scope.model && scope.model.length > 8) {
        scope.model = moment(scope.model).format('HH:mm');
      }
      scope.now = function () {
        scope.model = moment().format('HH:mm');
      }
      var watcher = scope.$watch('model', function (value) {
        if (value) {
          scope.onChange();
        }

        if (value && value.length > 8) {
          scope.model = moment(value).format('HH:mm');
        }
      });

      scope.$on('$destroy', watcher);
    }
  }

})();
