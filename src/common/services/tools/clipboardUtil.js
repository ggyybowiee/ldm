(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('clipboardUtil', clipboardUtil);

  /** @ngInject */
  function clipboardUtil() {
    var service = {
      copyToClipBoard: copyToClipBoard
    };

    return service;

    function copyToClipBoard(text) {
      navigator.clipboard.writeText(text).then(function () {
        console.log('复制成功!');
      }, function (err) {
        console.error('复制失败：', err);
      });      
    }
  }
})();
