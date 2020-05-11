(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('userSign', userSign);

  /** @ngInject */
  function userSign(docUtil) {
    var directive = {
      restrict: 'E',
      scope: {
        signContent: '=',
        verticalAlign: '@'
      },
      templateUrl: 'common/components/userSign/userSign.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope) {

      scope.verticalAlign = scope.verticalAlign || "top";
      scope.display = scope.display || "block";

      var signContentWatcher = scope.$watch("signContent", function (value) {
        var userContent = docUtil.getUserContentInSignContent(value);
        scope.showType = userContent.showType;
        scope.userCode = userContent.userCode;
        scope.userName = userContent.userName;
      })

      scope.$on('$destroy', signContentWatcher);

    }
  }

})();
