(function() {
  'use strict';

  angular.module('lachesis-common')
  .directive('editableRow', editableRow)
  .directive('keyTable', keyTable)
  .directive('editableTd', editableTd)
  .directive('stRatio', function() {
    return {
      link: function(scope, element, attr) {
        var ratio =+ (attr.stRatio);

        element.css('width', ratio + '%');

      }
    };
  })
  .directive('stPixel', function() {
    return {
      link: function(scope, element, attr) {
        var pixel =+ (attr.stPixel);

        element.css('width', pixel + 'px');

      }
    };
  });

  function editableRow(_, $rootScope) {
    angular.element('body').off('click').on('click', function(event) {

      var editingRow = angular.element('.key-table').find('.editing-row');
      var parentRow = angular.element(event.target).parents('tr');
      if (parentRow.length > 0) {
        var scope = parentRow.scope();
        var tableKey;
        if (scope) {
          tableKey = scope.row && scope.row.tableKey;
        }
        if (typeof tableKey !== 'undefined' && typeof $rootScope.editingKeyTableIndex !== 'undefined' && +tableKey !== +$rootScope.editingKeyTableIndex) {
          editingRow.removeClass('editing-row');
          $rootScope.$broadcast('batchInputSave');
          delete $rootScope.editingKeyTableIndex;

          return;
        }
        if (typeof tableKey !== 'undefined') {
          $rootScope.editingKeyTableIndex = tableKey;
        }
        return;
      }

      // var editingRow = angular.element('.key-table').find('.editing-row');
      if (editingRow.length > 0) {
        editingRow.removeClass('editing-row');
        $rootScope.$broadcast('batchInputSave');
      }
    });
    return {
      restrict: 'A',
      require: '^keyTable',
      scope: {
        configSource: '=',
        extra: '=',
        tableIndex: '=',
        data: '=editableRow'
      },
      link: function(scope, element, attrs, ctrl) {
        element.off().on('click', function(event) {
          if (event.target.tagName === 'I') {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          // if ($rootScope.editingKeyTableIndex !== scope.tableIndex) {
          //   $rootScope.$broadcast('batchInputSave');
          // }

          // $rootScope.editingKeyTableIndex = scope.tableIndex;
          if (angular.isFunction(ctrl.scope.eventMap.click)) {
            if (element.hasClass('editing-row') && ctrl.scope.rowIndex === scope.$parent.$index) {
              return;
            }
            ctrl.scope.eventMap.click(scope.$parent.$index, ctrl.scope.rowIndex, ctrl.scope.tableIndex);
          }

          ctrl.scope.rowIndex = scope.$parent.$index;
          ctrl.scope.rowElement = element;

          if (element.hasClass('editing-row')) {
            return;
          }
          var tds = element.find('td');
          element.addClass('editing-row');
          element.siblings().removeClass('editing-row');
          tds.each(function(index, item) {
            var _td = angular.element(item);
            var _input = _td.find('.editable-row__input-control');
            var type = _td.data('type');
            if (_input.length > 0 || !type) {
              return;
            }
          });
          var _target = angular.element(event.target);
          var currentInput = _target[0].tagName === 'TD'
            ? _target.find('.editable-row__input-control')
            : _target.parents('td').find('.editable-row__input-control');
          if (currentInput.length < 0) {
            element.removeClass('editing-row');
            return;
          }
          currentInput.focus().select();
        });

        // 算总分表格
        var countableArr = _.map(_.filter(scope.configSource, function (item) {
          return item.countable;
        }), function (item) {
          return item.dataBind;
        });

        var levelItem = _.find(scope.configSource, function (item) {
          return item.isLevel;
        });

        var sumObj = _.find(scope.configSource, function (item) {
          return item.isSum;
        });

        // if (!sumObj) {
        //   return;
        // }
        var sumKey;
        var levelKey;

        var configSourceWatcher = scope.$watch('configSource', function (value) {
          if (value) {
            countableArr = _.map(_.filter(value, function (item) {
              return item.countable;
            }), function (item) {
              return item.dataBind;
            });

            sumObj = _.find(scope.configSource, function (item) {
              return item.isSum;
            });
            levelItem = _.find(scope.configSource, function (item) {
              return item.isLevel;
            });
            if (sumObj) {
              sumKey = sumObj.dataBind;
            }

            if (levelItem) {
              levelKey = levelItem && levelItem.dataBind;
            }
          }
        }, true);

        var dataWatcher = scope.$watch('data', function (newValue) {
          if (!scope.data) {
            return;
          }
          newValue[sumKey] = 0;
          Object.keys(newValue).forEach(function (key) {
            if (countableArr.indexOf(key) > -1) {
              var value = 0;
              // 多选
              if (angular.isArray(newValue[key]) && newValue[key].length > 0) {
                value = newValue[key].concat(0).reduce(function (memo, end) {
                  var volumeStart = angular.isObject(memo) ? memo.value : memo;
                  var volumeEnd = angular.isObject(end) ? end.value : end;

                  return (+volumeStart) + (+volumeEnd);
                });
              } else if (angular.isObject(newValue[key])) {
                value = newValue[key].value || 0;
              } else {
                value = isNaN(parseInt(newValue[key])) ? 0 : parseInt(newValue[key]);
              }

              newValue[sumKey] += (+value);
            }
          });

          scope.$on('$destroy', function () {
            dataWatcher();
            configSourceWatcher();
          });

          // 评分等级
          if (levelKey) {
            newValue[levelKey] = _.findKey(scope.extra.risk, function (riskItem) {
              return newValue[sumKey] >= riskItem[0] && newValue[sumKey] <= riskItem[1];
            });
          }

          newValue[sumKey] = '' + newValue[sumKey];
        }, true);
      }
    };
  }

  function editableTd(_, $compile) {
    function getControl(type, scope) {
      var inputMap = {
        text: {
          tpl: '<input class="form-control input-sm editable-row__input-control print-remove" required name="{{name}}" type="text" ng-model="ngModel" />',
          text: '<div class="editable-row__text">{{ngModel}}</div>'
        },
        date: {
          tpl: '<date-picker no-icon="true" class="editable-row__input-control print-remove" width="inherit" name="{{name}}" ng-model="ngModel"></date-picker>',
          text: '<div class="editable-row__text" ng-hide="preRow.data.date == ngModel">{{ngModel}}</div>'
        },
        time: {
          tpl: ['<span uib-dropdown auto-close="outsideClick" class="editable-row__input-control print-remove">',
          '<a href id="simple-dropdown" uib-dropdown-toggle>',
          '{{ngModel || "时间"}}',
          '</a>',
          '<ul class="dropdown-menu" uib-dropdown-menu>',
          '<li>',
          '<time-picker show-now="true" ng-model="ngModel"></time-picker>',
          '</li>',
          '</ul>',
          '</span>'].join(''),
          text: '<div class="editable-row__text">{{ngModel}}</div>'
        },
        signaturePicture: {
          tpl: '',
          text: '<div class="editable-row__text"><img url-to-base64 class="doc-sign-img" ng-if="signType === \'image\'" ng-src="/windranger/hospital/userDataSign/{{ngModel}}"><span ng-if="signType === \'name\'">{{ngModel}}</span></div>'
        },
        signature: {
          tpl: ['<div class="editable-row__input-control">', '<button class="btn btn-default btn-xs">签名</span>', '</div>'].join(''),
          text: '<div class="editable-row__text"><img url-to-base64 class="doc-sign-img" ng-if="signType === \'image\'" ng-src="/windranger/hospital/userDataSign/{{ngModel}}"><span ng-if="signType === \'name\'">{{ngModel}}</span></div>'
        },
        select: {
          tpl: [
            '<dropdown-selector ng-model="ngModel" class="editable-row__input-control" required name="{{name}}" options="_options" with-id="withId"></dropdown-selector>'
          ].join(''),
          text: '<div class="editable-row__text">{{getSingleValue(ngModel)}}</div>'
        },
        selectAndInput: {
          tpl: [
            '<select-and-input options="_options" class="editable-row__input-control" ng-model="ngModel"></select-and-input>'
          ].join(''),
          text: '<div class="editable-row__text">{{ngModel}}</div>'
        },
        boolean: {
          tpl: [
            '<div class="editable-row__input-control"><input type="checkbox" ng-model="ngModel" name="{{name}}" ng-true-value="{{settings.trueValue}}" ng-false-value="{{settings.falseValue}}" /></div>'
          ].join(''),
          text: ['<div class="editable-row__text">',
            '{{ngModel == settings.trueValue ? "√" : ""}}',
            '</div>'].join('')
        },
        multiSelect: {
          tpl: [
            '<dropdown-selector ng-model="ngModel" class="editable-row__input-control" required name="{{name}}" options="_options" with-id="withId" multiple="true"></dropdown-selector>'
          ].join(''),
          text: '<div class="editable-row__text">{{ngModel ? getShowValue(ngModel) : ""}}</div>'
        },
        textarea: {
          tpl: '<textarea style="resize: initial" class="form-control input-sm editable-row__input-control print-remove" required name="{{name}}" type="text" ng-model="ngModel" ></textarea>',
          text: '<div class="editable-row__text"><pre>{{ngModel}}</pre></div>'
        },
        bloodPress: {
          tpl: '<blood-pressure-input style="resize: initial" input-class="form-control input-sm editable-row__input-control print-remove" ng-model="ngModel" ></blood-pressure-input>',
          text: '<div class="editable-row__text">{{ngModel}}</div>'
        }

      };

      if (typeof scope.editable !== 'undefined' && !scope.editable) {
        return ['<div class="diseditable editable-row__input-control">', inputMap[type || 'text'].text,'</div>', inputMap[type || 'text'].text].join('');
      }

      return [inputMap[type || 'text'].tpl, inputMap[type || 'text'].text].join('');
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        type: '=',
        ngModel: '=ngModel',
        options: '=options',
        editable: '=editableTd',
        settings: '=',
        signType: '=',
        preRow: '=',
        // 有些选项需要保留id
        name: '='
      },
      link: function(scope, element) {
        var type = scope.type;

        scope._options = scope.options && scope.options.map(function (item) {
          if (typeof item === 'string') {
            return item;
          }

          return {
            value: item.dicCode || '',
            label: item.dicName || item.dicCode || '',
            id: item.id,
            shortcut: item.shortcut
          };
        });

        scope.withId = _.every(scope._options, function (item) {
          return !!item.id;
        });

        scope.getShowValue = function (inputValue) {
          return _.chain(inputValue)
          .map(function (value) {
            var option = _.find(scope._options, function (item) {
              if (scope.withId) {
                return item.id === value.id;
              }

              return item.value === value;
            });

            return option ? (option.shortcut || option.label || option.value) : '';
          })
          .compact()
          .join('、')
          .value();
        };

        scope.getSingleValue = function (inputValue) {
          var currentOption = _.find(scope._options, function (item) {
            if (scope.withId) {
              return inputValue && inputValue.id ? item.id === inputValue.id : _.get(inputValue, [0, 'id']) === item.id;
            }

            return item.value === inputValue;
          });

          return currentOption ? (currentOption.shortcut || currentOption.label || currentOption.value) : '';
        }

        var el = $compile(getControl(type, scope))(scope);
        element.append(el);
        if(element.find('.form-control').length) {
          element.find('.form-control').off('keydown').on('keydown', function(e) {
            var dir = [13, 37, 38, 39, 40];
            if(dir.indexOf(e.keyCode) > -1) {
              e.preventDefault();
            }
          })
        }
      }
    };
  }

  function keyTable($timeout) {
    var keyMap = {
      13: {
        name: 'enter',
        fn: function(scope, target) {
          var startIndex = typeof scope.startColumnIndex !== 'undefined' ? scope.startColumnIndex : 0
          keyMap[40].fn(scope, target, startIndex);
        }
      },
      37: {
        name: 'left',
        fn: function(scope, target) {
          var input = target.parents('td').prev().find('.editable-row__input-control');

          if (input.length === 0) {
            return;
          }
          input.focus();
          $timeout(function(){
            input.select();
          })
        }
      },
      38: {
        name: 'up',
        fn: function(scope, target) {
          if (scope.rowIndex === 0) {
            return;
          }
          scope.rowElement = scope.rowElement.prev();
          scope.rowIndex -= 1;
          scope.rowElement.addClass('editing-row').siblings().removeClass('editing-row');
          var indexOfTd = target.parents('td').index();
          if (indexOfTd < 0) {
            return;
          }
          var input = scope.rowElement.find('td').eq(indexOfTd).find('.editable-row__input-control');

          if (input.length === 0) {
            return;
          }
          input.focus();
          $timeout(function(){
            input.select();
          })
        }
      },
      39: {
        name: 'right',
        fn: function(scope, target) {
          var input = target.parents('td').next().find('.editable-row__input-control');

          if (input.length === 0) {
            return;
          }
          input.focus();
          $timeout(function(){
            input.select();
          })
        }
      },
      40: {
        name: 'down',
        fn: function(scope, target, index) {
          var next = scope.rowElement.next();
          if (next.length === 0) {
            return;
          }
          scope.rowIndex += 1;
          scope.rowElement = scope.rowElement.next();
          scope.rowElement.addClass('editing-row').siblings().removeClass('editing-row');
          var indexOfTd = typeof index === 'undefined' ? target.parents('td').index() : index;
          if (indexOfTd < 0) {
            return;
          }
          var input = scope.rowElement.find('td').eq(indexOfTd).find('.editable-row__input-control');

          if (input.length === 0) {
            return;
          }
          input.focus();
          $timeout(function(){
            input.select();
          })
        }
      }
    };

    return {
      restrict: 'A',
      scope: {
        /**
         * eventMap 事件处理程序
         * up/down/left/right/click
         * 每个处理程序接收当前行索引（rowIndex）和前一行索引（prevIndex）
         * @Object
         */
        eventMap: '=',
        /**
         * 开始列的索引，有些表格第一列并不能编辑，无法进入编辑状态。默认为0
         * @Number
         */
        startColumnIndex: '=',
        tableIndex: '=',
        data: '=keyTable'
      },
      controllerAs: 'vm',
      controller: function ($scope) {
        var vm = this;
        vm.scope = $scope;
        $scope.$watch('data', function (newValue, oldValue) {
          if (!newValue || !oldValue || newValue.length !== oldValue.length) {
            // 重新渲染表格时，初始化rowIndex为undefined
            delete $scope.rowIndex;
          }
        });
      },
      link: function(scope, element) {
        element.addClass('key-table');
        element.off('keydown').on('keydown', function(e) {
          var code = e.keyCode || e.which;

          if (!keyMap[code]) {
            return;
          }
          var prevIndex = scope.rowIndex;

          keyMap[code].fn(scope, angular.element(e.target));

          Object.keys(scope.eventMap).forEach(function (key) {
            if (keyMap[code] && keyMap[code].name === key) {
              scope.eventMap[key](scope.rowIndex, prevIndex, scope.tableIndex);
            }
          });
        });

        var batchInputSave = scope.$on('batchInputSave', function (e) {
          if (!scope.eventMap || !scope.eventMap.blur) {
            delete scope.rowIndex;
            return;
          }
          try {
            scope.eventMap.blur(scope.rowIndex, scope.rowIndex, scope.tableIndex);
          } catch (err) {
            console.log(err);
          } finally {
            delete scope.rowIndex;
          }
        });

        scope.$on('$destroy', batchInputSave);

        // TODO：滚动表格头部固定
        angular.element('.wrapper').off('scroll').on('scroll', function () {
          console.log(1);
        });
      }
    }
  }
})();
