(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('urlToBase64', fn);

  /** @ngInject */
  function fn() {
    var directive = {
      restrict: 'A',
      link: function (scope, element) {
        function getBase64Image(img) {
          if (img.src && img.src.indexOf('base64') > -1) {
            return;
          }
          var canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var res = '';
          try {
            res = canvas.toDataURL();
            img.src = res;
          } catch (err) {
            img.src = img.src;
          }
        }

        element.attr('crossOrigin', 'Anonymous');

        element[0].onload = function () {
          getBase64Image(element[0]);
        }
      }
    };

    return directive;
  }

})();
