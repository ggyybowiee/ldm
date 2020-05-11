(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('editableForm', eidtableFunc)
    .directive('editableInput', editableInputFunc)
    .directive('editableStart', editableStartFunc)
    .directive('editableLabel', editableLabelFunc)
    .directive('editableEnd', editableEndFunc);
  /** @ngInject */
  function eidtableFunc() {
    return {
      restrict: 'A',
      scope: {},
      controller: 'EditableController',
      controllerAs: 'vm',
      bindToController: {
        name: '=editableForm'
      },
      link: function (scope, elem, attrs) {
        scope.$parent[attrs.name].showEdit = function () {
          scope.$parent[attrs.name].isEditing = true;

          elem.addClass('form-editing')
        }
        scope.$parent[attrs.name].endEdit = function () {
          scope.$parent[attrs.name].isEditing = false;

          elem.removeClass('form-editing')
        }
      }
    };
  }

  function editableInputFunc() {
    return {
      restrict: 'A',
      scope: false,
      require: '?^editableForm',
      link: function (scope, elem, attr, ctrl) {
        if (!ctrl) return;

        scope.$watch(ctrl.name + '.isEditing', function (v) {
          if (v) {
            elem.css('display', 'inline-block');
          } else {
            elem.css('display', 'none');
          }
        })

      }
    };
  }

  function editableStartFunc() {
    return {
      restrict: 'A',
      scope: null,
      require: '?^editableForm',
      link: function (scope, elem, attr, ctrl) {
        if (!ctrl) return;

        scope.$parent.$watch(ctrl.name + '.isEditing', function (v) {
          if (v) {
            elem.css('display', 'none');
          } else {
            elem.css('display', 'inline-block');
          }
        })

      }
    }
  }

  function editableLabelFunc() {
    return {
      restrict: 'A',
      scope: false,
      require: '?^editableForm',
      link: function (scope, elem, attr, ctrl) {
        if (!ctrl) return;

        scope.$watch(ctrl.name + '.isEditing', function (v) {
          if (v) {
            elem.css('display', 'none');
          } else {
            elem.css('display', 'inline-block');
          }
        })

      }
    }
  }

  function editableEndFunc() {
    return {
      restrict: 'A',
      scope: null,
      require: '?^editableForm',
      link: function (scope, elem, attr, ctrl) {
        if (!ctrl) return;

        scope.$parent.$watch(ctrl.name + '.isEditing', function (v) {
          if (v) {
            elem.css('display', 'inline-block');
          } else {
            elem.css('display', 'none');
          }
        })

      }
    }
  }

})();
