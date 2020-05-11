(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('timeCodec', timeCodec);

  /** @ngInject */
  function timeCodec(moment) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$formatters.shift();
        ngModel.$formatters.shift();
        ngModel.$parsers.shift();
        ngModel.$formatters.unshift(function(v) {
          if(!v) {
            return '';
          }
          return moment(v).format('YYYY-MM-DD');
        });
        ngModel.$parsers.push(function(v) {
          if(!v) {
            element.val('');
            return '';
          }
          var result = moment(v).format('YYYY-MM-DD');
          //初始化引起的view的改动
          element.val(moment(v).format('YYYY-MM-DD'));
          return result;
        })
      }
    };

    return directive;
  }

})();

(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('dateCodec', dateCodec);

  /** @ngInject */
  function dateCodec(moment) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$formatters.shift();
        ngModel.$formatters.shift();
        ngModel.$parsers.shift();
        ngModel.$formatters.unshift(function(v) {
          if(!v) {
            return '';
          }
          if (v.split(' ').length === 1) {
            return  new Date(moment().format('YYYY-MM-DD') + ' ' + v);
          }
          return new Date(v).format('HH:mm:ss');
        });
        ngModel.$parsers.push(function(v) {
          if(!v) {
            element.val('');
            return '';
          }
          var result = moment(v).format('HH:mm');
          //初始化引起的view的改动
          element.val(moment(v).format('HH:mm'));
          return result;
        })
      }
    };

    return directive;
  }

})();
