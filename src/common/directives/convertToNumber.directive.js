(function() {
  'use strict';

  angular.module('lachesis-common').directive('convertToNumber', convertToNumber);

  function convertToNumber() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function(val) {
          return val !== null && val !== ''
            ? parseInt(val, 10)
            : null;
        });
        ngModel.$formatters.push(function(val) {
          return val !== null
            ? '' + val
            : null;
        });
      }
    };
  }
})();
