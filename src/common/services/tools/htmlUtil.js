(function () {
  'use strict';

  angular.module('lachesis-common')
    .filter('trusthtmlcontent', function ($sce) {
      return function (text) {
        if (text)
          return $sce.trustAsHtml('<div>' + text.replace(/\n/g, "<br/>") + '</div>');
        return "";
      }
    })
    .filter('htmlcontent', function () {
      return function (str) {
        if (!str) {
          return '';
        }
        str = str.replace(/\n/g, '<br/>');
        str = str.replace(/[ ]/g, "&nbsp;");

        return str;
      }
    });

})();
