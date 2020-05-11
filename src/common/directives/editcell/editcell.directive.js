(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('editCellAble', editCellAble)
    .directive('editCellDir', editCellDir)
    .directive('editTextDir', editTextDir)
    .directive('editInputDir', editInputDir);
  /** @ngInject */

  function editCellAble() {
    return {
      restrict: 'A',
      scope: false,
      controller: function($scope, $attrs, $parse) {
        var vm = this;
        vm.getStatus = function() {
          return $parse($attrs.editCellAble)($scope);
        };
      }
    }
  }
  function editCellDir($rootScope) {
    // angular.element(document)
    //   .on('keydown', '.select2-input', function(e){
    //     if(e.keyCode === 18) {
    //       e.preventDefault();
    //       e.stopPropagation();
    //     }
    //   });
    angular.element(document).off('click').on('click', function() {
      $rootScope.$broadcast('hide');
    });
    return {
      restrict: 'C',
      require: '?^editCellAble',
      link: function (scope, elem, attrs, editCellAble) {
        scope.getStatus = getStatus;
        scope.$watch('getStatus()', function(v) {
          if(v) {
            elem.addClass('enable');
          }
        });
        elem.click(function(e) {
          e.stopPropagation();
          if(!getStatus()) {
            return;
          }
          var editInput = elem.find('.edit-input-dir');
          editInput.show().focus();
          editInput[0].select && editInput[0].select();
          var editText = elem.find('.edit-text-dir:not(.keep-show)');
          editText.hide();
          // var select2 = elem.find('.edit-input-dir').find('.select2-choices');

          // select2.click();
          // select2.find('input').off().on('blur', function () {
            // editText.show();
            // editInput.hide();
          // });
          $rootScope.$broadcast('hide', elem);
        });

        scope.$on('hide', function(e, target) {
          if(elem === target) return;
          elem.find('.edit-text-dir').show();
          elem.find('.edit-input-dir').hide();
        });

        function getStatus() {
          return editCellAble ? editCellAble.getStatus() : true;
        }
      }
    };
  }

  function editTextDir() {
    return {
      restrict: 'C'
    };
  }

  function editInputDir() {
    return {
      restrict: 'C',
      link: function (scope, elem) {
        var _elem = elem;
        // 失去焦点后，关闭编辑状态
        _elem.blur(function () {
          var _this = angular.element(this);
          // 如果是必选项，则判断是否为空
          if (_this.attr('required') && _this.val() === '') {
            _this.addClass('error');
            return;
          }
          _this.removeClass('error').hide();
          _this.parents('.edit-cell-dir').find('.edit-text-dir').show();
          // debugger;
        })
      }
    };
  }
})();
