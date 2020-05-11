(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('userSignUpload', userSignUpload);

  /** @ngInject */
  function userSignUpload() {
    var directive = {
      restrict: 'EA',
      scope: {
        ngModel: "=",
      },
      templateUrl: 'common/components/userSignUpload/userSignUpload.tpl.html',
      link: function (scope, element, attrs) {

        scope.reader = new FileReader();

        scope.deleteUserSignData = function () {
          if (scope.ngModel.dataSign) {
            scope.ngModel.dataSign = false;
          }
        }

        scope.imageSelected = function (files) {
          scope.id = (new Date()).valueOf();
          scope.reader.readAsDataURL(files[0]);
          scope.reader.onload = function (ev) {
            scope.$apply(function () {
              scope.ngModel.uploadUserSignContent = ev.target.result;
            });
          };
        };

      },
      replace: true
    };

    return directive;
  }

})();
