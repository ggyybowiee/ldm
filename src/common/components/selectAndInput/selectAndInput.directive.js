(function () {
  'use strict';

  angular.module('lachesis-common').directive('selectAndInput', selectAndInput)
    .filter('selecteAndInputType', function () {
      return function (item, type) {
        if (type == 'opt') {
          return item.text;
        } else if (type == 'docHeader') {
          return item.label;
        }

        return item;
      }
    });

  function selectAndInput($timeout, _) {
    return {
      restrict: 'E',
      templateUrl: 'common/components/selectAndInput/selectAndInput.tpl.html',
      scope: {
        ngModel: '=',
        options: '=',
        innerClass: '@',
        type: '@',
        ngAvalibleKeydown: '=',
        ngAvalibleFocus: '='
      },
      transclude: true,
      replace: true,
      link: function (scope, elem, attrs) {

        scope.selectIndex = -1;
        scope.isOpen = false;

        scope.$watch('ngModel', function (value) {
          if (value) {
            if (scope.type == 'opt') {
              scope.ngModel = scope.options[scope.selectIndex].text;
            } else if (scope.type == 'docHeader') {
              scope.ngModel = scope.options[scope.selectIndex].label;
            }
          }
        })

        scope.openOptions = function (event) {
          var targetElem = angular.element(event.originalEvent.target);
          var offset = event.originalEvent.target.getBoundingClientRect();
          var bottom = window.innerHeight - offset.top - offset.height - 50;
          scope.isOpen = true;
          scope.selectIndex = -1;

          targetElem.next().css({
            maxHeight: bottom + 'px'
          });

          scope.ngAvalibleFocus && scope.ngAvalibleFocus(event);
        }

        scope.hideOptions = function (event) {

          var parent = angular.element(event.target).parent();
          if (!parent) {
            return;
          }

          $timeout(function () {
            scope.isOpen = false;
            scope.selectIndex = -1;
          }, 200);
        }

        scope.setValue = function (index) {
          setSelectIndex(index);
          // scope.hideOptions();
        }

        scope.keyDown = function (event) {

          if (event.keyCode == 13) {
            scope.isOpen = false;
            scope.selectIndex = -1;
            scope.ngAvalibleKeydown && scope.ngAvalibleKeydown(event);
          } else if (event.keyCode == 38) {
            if (!scope.isOpen || scope.selectIndex == -1) {
              scope.isOpen = false;
              scope.ngAvalibleKeydown && scope.ngAvalibleKeydown(event);
            } else
              setSelectIndex(scope.selectIndex - 1);
          } else if (event.keyCode == 40) {
            if (!scope.isOpen || scope.selectIndex == scope.options.length) {
              scope.isOpen = false;
              scope.ngAvalibleKeydown && scope.ngAvalibleKeydown(event);
            } else
              setSelectIndex(scope.selectIndex + 1);
          } else if (event.keyCode == 27) {
            scope.isOpen = false;
            scope.selectIndex = -1;
          }
        }

        function setSelectIndex(index) {

          index = Math.max(-1, index);
          index = Math.min(scope.options.length, index);

          if (index == scope.selectIndex)
            return;

          scope.selectIndex = index;
          if (scope.selectIndex != -1) {
            scope.ngModel = scope.options[scope.selectIndex];
          }
        }
      }
    };
  }
})();
