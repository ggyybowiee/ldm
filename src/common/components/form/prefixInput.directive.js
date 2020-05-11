(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('prefixInput', prefixInput);
  /** @ngInject */
  function prefixInput() {
    var directive = {
      require: 'ngModel',
      scope: false,
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el, attr, ngModel) {
      ngModel.$formatters.unshift(function(v) {
        if(v) {
          scope.prefix = v[0];
          return v.slice(1);
        }
        return v;
      });
      ngModel.$parsers.push(function(v) {
        return scope.prefix + v;
      });
    }
  }
})();
