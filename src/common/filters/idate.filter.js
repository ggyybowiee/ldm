(function () {
  'use strict';

  angular.module('lachesis-common')
    .filter('idate', filterBlock);

  /** @ngInject */
  function filterBlock($filter) {
    var date = $filter('date');
    return function (input, type) {
      var map = {
        'DH': 'yyyy-MM-dd HH:mm:ss',
        'DM': 'yyyy-MM-dd HH:mm',
        'D': 'yyyy-MM-dd',
        'XD': 'MM-dd',
        'H': 'HH:mm:ss',
        'dh': 'yy-MM-dd HH:mm',
        'XDH':'MM-dd HH:mm',
        'HM': 'HH:mm'
      };
      return date(input, map[type || 'D']);
    };
  }
})();
