(function () {
  'use strict';

  angular.module('lachesis-mnis')
    .directive('editableLine', editableLine)
    .directive('editableWrapper', editableWrapper)
    .directive('editableCell', editableCell)
    .filter('whitespaceFilter', function () {
      return function (input) {
        input = input || '';
        return input.replace(/\s/g, '&nbsp;');
      };
    })
    .filter('brFilter', function () {
      return function (input) {
        input = input || '';
        return input.replace(/<br>|<div>|<\/div>/g, '');
      };
    })
    .filter('prefixFilter', function () {
      return function (input, prefix) {
        input = input || '';

        return (prefix || '') + input;
      };
    });

  var keyMap = {
    13: {
      name: 'enter',
      fn: function (ctx, target, $timeout) {
        $timeout(function () {
          ctx.rowIndex = undefined;
          angular.element('.editing-line').removeClass('editing-line');
        });
      }
    },
    37: {
      name: 'left',
      fn: function (scope, target, $timeout) {
        var input = target.parents('[editable-cell]').prev();

        focusInput(input, $timeout);
      }
    },
    39: {
      name: 'right',
      fn: function (scope, target, $timeout) {
        var input = target.parents('[editable-cell]').next();

        focusInput(input, $timeout);
      }
    }
  };

  function editableLine($timeout, _) {
    return {
      restrict: 'A',
      require: ['^editableWrapper', '^?nursingDoc'],
      scope: true,
      link: function (scope, element, attrs, ctrls) {
        var ctrl = ctrls[0],
          doc = ctrls[1];
        element.off('dblclick').on('dblclick', function (event) {
          event.preventDefault();
          var $this = angular.element(this);
          var promise;
          if ($this.hasClass('fixed')) return;
          if (angular.isFunction(ctrl.eventMap.click)) {
            var path = event.originalEvent ? event.originalEvent.path : event.path;
            var isInOut = _.some(path, function (elem) {
              return elem.classList && elem.classList.contains('in-out-line');
            }) || (event.currentTarget && event.currentTarget.classList.contains('in-out-line'));
            if (ctrl.rowIndex === scope.$index && !isInOut) {
              return;
            }

            if (!isInOut) {
              promise = ctrl.eventMap.click(ctrl.rowIndex, element);
            }
          }

          if (promise && promise.then) {
            promise.then(function () {
              ctrl.eventMap.dblclick(scope.$index)
            });
          } else {
            ctrl.eventMap.dblclick(scope.$index);
          }
          scope.$emit('refreshEditingIndex', scope.$index);
          ctrl.rowIndex = scope.$index;
          ctrl.rowElement = element;

          if (element.hasClass('editing-line')) {
            return;
          }
          var tds = element.find('[editable-cell]');
          element.addClass('editing-line').parent().siblings().find('.table-content-row').removeClass('editing-line');
          tds.each(function (index, item) {
            var _td = angular.element(item);
            var _input = _td.find('.editable-line__input-control');
            var type = _td.data('type');
            if (_input.length > 0 || !type) {
              return;
            }
          });
          focusInput(event.target, $timeout, 1000);
        });
      }
    };
  }

  function editableCell($compile, $sce, $timeout) {
    function getControl(type) {
      var inputMap = {
        text: {
          tpl: '<input class="form-control input-sm editable-line__input-control"  type="text" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()"/>',
          text: ['<div ng-if="!cell.editing" class=\'div-no-wrap\' ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'width':cell.cellWidth, 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px', ",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel | whitespaceFilter"></div>'
          ].join('')
        },
        divideCell: {
          text: ['<nursing-doc-divide-cell class="editable-line__text" seperator-type="cell.options.divideCellSeperateCross" ng-model="cell.ngModel"',
            'font-size="cell.options.font" line-height="cell.lineHeight" cell="cell"',
            'content-type="{{(cell.options.key===\'sign\')?\'sign\':\'text\'}}" image-base-url="/windranger/hospital/userDataSign/"',
            'visibility="cell.options.divideCellVisibility" divide-visibility="true" seperator-char="cell.options.divideCellSeprChar"></nursing-doc-divide-cell>'
          ].join(" ")
        },
        textarea: {
          tpl: '<textarea class="form-control input-sm editable-line__input-control" type="text" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()"></textarea>',
          text: ['<div class="editable-line__text" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        date: {
          tpl: '<date-picker no-icon="true" class="editable-line__input-control" width="100%" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()"></date-picker>',
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-show="!cell.extra.dateHidden" ng-style="{',
            "'font-size': cell.options.font + 'mm',  'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px', ",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        time: {
          tpl: '<time-picker class="editable-line__input-control" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()"></time-picker>',
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-show="!cell.extra.timeHidden" ng-style="{',
            "'font-size': cell.options.font + 'mm',  'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px', ",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        datetime: {
          text: ['<nursing-doc-datetime-cell class="editable-line__text" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'text-align': cell.options.textAlign",
            '}" ng-model="cell.ngModel" cell="cell" display-format="{{cell.extra.dateHidden ?',
            " ((cell.extra.timeHidden)? '' : ' HH:mm'):'MM-DD HH:mm'",
            '}} " ',
            'text-align="cell.options.textAlign" font-size="cell.options.font" line-height="cell.lineHeight"></nursing-doc-datetime-cell>'
          ].join('')
        },
        inoutInput: {
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'width':cell.cellWidth, 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px', ",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel | whitespaceFilter"></div>'
          ].join('')
        },
        boolean: {
          tpl: [
            '<div class="editable-line__input-control"><input type="checkbox" ng-model="cell.editingRow.data[cell.options.key]" ng-true-value="{{cell.options.rule.trueValue}}" ng-false-value="{{cell.options.rule.falseValue}}" /></div>'
          ].join(''),
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px'",
            '}">',
            '{{cell.ngModel == cell.options.rule.trueValue ? "√" : ""}}',
            '</div>'
          ].join('')
        },
        select: {
          tpl: [
            '<select class="form-control input-sm editable-line__input-control" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()">',
            '<option ng-repeat="item in cell.options.rule.options" value="{{item}}">{{item}}</option>',
            '</select>'
          ].join(''),
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px'",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        selectAndInput: {
          tpl: [
            '<select-and-input is-insert="cell.options.rule.isInsert" options="cell.options.rule.options" class="editable-line__input-control" ng-model="cell.editingRow.data[cell.options.key]"></select-and-input>'
          ].join(''),
          text: ['<div ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}"  ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px'",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        number: {
          tpl: '<input class="form-control input-sm editable-line__input-control" type="number" min="{{cell.options.rule.number.min}}" max="{{cell.options.rule.number.max}}" ng-model="cell.editingRow.data[cell.options.key]" ng-if="cell.isEditing()" />',
          text: ['<div  ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px',  ",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel"></div>'
          ].join('')
        },
        modal: {
          tpl: [
            '<modal-input class="editable-line__input-control" ng-model="cell.editingRow.data[cell.options.key]" show-model="cell.ngModel" tpls="cell.options.rule.tpls" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'height': cell.lineHeight + 'px',",
            "'text-align': cell.options.textAlign",
            '}" ng-if="cell.isEditing()"></modal-input>'
          ].join(''),
          text: [
            '<div class="editable-line__text" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'text-align': cell.options.textAlign",
            '}" ng-bind-html="cell.ngModel | whitespaceFilter"></div>'
          ].join('')
        },
        outer: {
          tpl: ['<div class="editable-line__input-control" data-type="outer" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'height': cell.lineHeight + 'px'",
            '}" ng-if="cell.isEditing()"><span ng-repeat="sign in cell.ngModel track by $index"><img ng-if="cell.signType === \'image\'" class="doc-sign-img" ng-src="/windranger/hospital/userDataSign/{{sign}}" /><span ng-if="cell.signType === \'name\'">{{sign}}</span></span></div>'
          ].join(''),
          text: ['<div  ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" data-type="outer" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px'",
            '}"><span class="editable-line__sign">' +
            '<user-sign sign-content="sign" style="display:inline-block;" ng-repeat="sign in cell.ngModel track by $index"></user-sign>' +
            '</span></div>'
          ].join('')
        },
        inout: {
          tpl: [
            '<inout class="editable-line__input-control" ng-model="cell.editingRow.data[cell.options.key]" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'height': cell.lineHeight + 'px',",
            "'text-align': cell.options.textAlign",
            '}" ng-if="cell.isEditing()"></inout>'
          ].join(''),
          text: [
            '<div class="editable-line__text" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'text-align': 'center'",
            '}">',
            '<div class="flex-box total-in-out-wrap align-center">',
            '<div class"">',
            '{{cell.ngModel.date}}&nbsp;',
            '{{cell.ngModel.time}}&nbsp;',
            '{{cell.ngModel.remark}}&nbsp;',
            '<span ng-show="cell.ngModel.inVisable && cell.ngModel.totalIn">总入量：{{cell.ngModel.totalIn}} ml;',
            '{{cell.ngModel.inRemark ? "（" + cell.ngModel.inRemark + "）" : ""}}',
            '</span>',
            '</div>',
            '<div class"">',
            '<span ng-show="cell.ngModel.outVisable && cell.ngModel.totalOut">总出量：<span>{{cell.ngModel.totalOut}} ml;</span>',
            '{{cell.ngModel.outRemark ? "（" + cell.ngModel.outRemark + "）" : ""}}',
            '</span>',
            '</div>',
            '</div>'
          ].join('')
        },
        verifySignature: {
          tpl: ['<div class="editable-line__input-control" data-type="outer" ng-style="{',
            "'font-size': cell.options.font + 'mm',",
            "'height': cell.lineHeight + 'px'",
            '}" ng-if="cell.isEditing()"><span ng-repeat="sign in cell.ngModel track by $index"><img ng-if="cell.signType === \'image\'" class="doc-sign-img" ng-src="/windranger/hospital/userDataSign/{{sign}}" /><span ng-if="cell.signType === \'name\'">{{sign}}</span></span></div>'
          ].join(''),
          text: ['<div  ng-class="{\'editable-line__text__wrap\': cell.options.isWrapInCell==\'true\', \'editable-line__text\': cell.options.isWrapInCell==\'false\'}" data-type="outer" ng-style="{',
            "'font-size': cell.options.font + 'mm', 'height': cell.options.isWrapInCell==\'true\' ? cell.lineHeight + 'px' : 'auto', 'line-height': cell.options.isWrapInCell==\'true\' ? cell.options.font + 'mm' : cell.lineHeight + 'px'",
            '}">' + '<user-sign sign-content="cell.ngModel" style="display:\'inline-block;\'"></user-sign>' + '</div>'
          ].join('')
        }
      };

      return [inputMap[type].tpl, inputMap[type].text].join('');
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        extra: '=',
        ngModel: '=ngModel',
        options: '=options',
        lineHeight: '=',
        cellWidth: '=',
        editing: '=',
        methods: '=',
        editingRow: '=',
        signType: '='
      },
      link: function (scope, element) {
        var el, vm = scope.cell,
          init;
        el = $compile(getControl(vm.options.type))(scope);

        element.append(el);

        vm.isEditing = function () {
          if (!init && vm.editing) {
            init = true;
            return init;
          } else if (init) {
            return init;
          } else {
            return false;
          }
        };
      },
      controller: function () {

      },
      controllerAs: 'cell',
      bindToController: true
    };
  }

  function editableWrapper($timeout, $document, _) {
    return {
      restrict: 'A',
      scope: {
        /**
         * editableWrapper 事件处理程序
         * up/down/left/right/click
         * 每个处理程序接收当前行索引（rowIndex）和前一行索引（prevIndex）
         * @Object
         */
        eventMap: '=editableWrapper',
        rowIndex: '='
      },
      controllerAs: 'vm',
      bindToController: true,
      controller: function ($scope) {
        var vm = this;
        vm.scope = $scope;
      },
      link: function (scope, element) {
        var vm = scope.vm;
        // 全局回车保存文书
        $document.off('keydown').on('keydown', function (e) {
          var code = e.keyCode || e.which;
          // 修正手动统计出入量按回车出现时间弹框的问题
          if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
            return;
          }

          // 不在编辑状态时，全局回车不执行保存
          if (code !== 13 || _.some(e.originalEvent.path, function (elem) {
              return elem.classList && elem.classList.contains('modal-body');
            })) {
            return;
          }

          Object.keys(vm.eventMap).forEach(function (key) {
            if (keyMap[code] && keyMap[code].name === key) {
              var promise = vm.eventMap[key]();

              if (promise && promise.then) {
                keyMap[code].fn(vm, angular.element(e.target), $timeout);
              }
            }
          });
        });
        element.off('keydown').on('keydown', function (e) {
          var code = e.keyCode || e.which;

          if (code === 13) {
            return;
          }

          if (!keyMap[code]) {
            return;
          }
          var prevIndex = vm.rowIndex;

          keyMap[code].fn(vm, angular.element(e.target), $timeout);

          scope.eventMap && Object.keys(scope.eventMap).forEach(function (key) {
            if (keyMap[code] && keyMap[code].name === key) {
              scope.eventMap[key](vm.rowIndex, prevIndex);
            }
          });
        });


      }
    }
  }

  function focusInput(target, timeout, time) {
    var _target = angular.element(target);
    var _input = _target.is('[editable-cell]') ?
      _target :
      _target.parents('[editable-cell]');
    var elem, type, input;
    timeout(function () {
      input = _input.find('.editable-line__input-control');
      if (input.find('.hours input').length) {
        elem = input.find('.hours input');
        type = 'focus';
      } else if (input.find('input[uib-datepicker-popup]').length) {
        elem = input.find('input[uib-datepicker-popup]');
        type = 'click';
      } else if (input.is('.modal-input')) {
        elem = input;
        type = 'click';
      } else {
        elem = input;
        type = 'focus';
      }
      elem[type]();
    }, time || 0);
  }
})();
