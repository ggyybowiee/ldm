(function () {
  'use strict';

  angular.module('lachesis-common').factory('utilService', utilService);

  /** @ngInject */
  function utilService(_) {
    var service = {
      getParams: getParams,
      hexToRGB: hexToRGB,
      guid: guid,
      isRealNum: isRealNum
    };

    return service;

    function getParams(key) {
      var paramsArr = location.search.slice(1).split('&');
      var match = _.find(paramsArr, function (param) {
        var paramArr = param.split('=');
        return paramArr[0] === key;
      });
      return match ?
        match.split('=')[1] :
        '';
    }

    function hexToRGB(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function isRealNum(num) {
      var reg = /^-?[0-9]*.?[0-9]+$/; //判断字符串是否为数字 ，判断正整数用/^[1-9]+[0-9]*]*$/
      if (!reg.test(num)) {
        return false;
      }
      return true;
    }
  }
})();
