(function() {
  'use strict';

  angular.module('lachesis-common')
    .filter('msToHours', filterBlock);

  /** @ngInject */
  function filterBlock() {
    return function(input, type) {
      if(!input) return '';
      type = type || 'H:M'
      var totalSeconds = input / 1000;
      var hours = addZero(totalSeconds / 3600),
          minutes = addZero(totalSeconds % 3600 / 60),
          seconds = addZero(totalSeconds % 3600 % 60);
      return type.replace(/H/g, hours).replace(/M/g, minutes).replace(/S/g, seconds);
    }

    function addZero(num) {
      var result = Math.floor(num);
      result = num < 10 ? ('0' + result): ('' + result);
      return result;
    }
  }
})();