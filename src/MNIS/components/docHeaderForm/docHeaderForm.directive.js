(function () {
  'use strict';

  angular.module('lachesis-mnis')
    .directive('docHeaderForm', docHeaderForm)
    .directive('editableFormItem', editableFormItem);

  function editableFormItem($compile, $timeout, sessionService) {
    function getControl(type, name, options, scope) {
      var inputMap = {
        text: {
          tpl: '<input class="form-control input-sm editable-doc-item__input-control header-form-control" name="{{name}}" type="text" ng-model="ngModel" />',
          text: '<div class="editable-doc-item__text header-form-text">{{ngModel}}</div>'
        },
        date: {
          tpl: '<date-picker no-icon="true" class="editable-doc-item__input-control header-form-control" name="{{name}}" ng-model="ngModel"></date-picker>',
          text: '<div class="editable-doc-item__text header-form-text">{{ngModel}}</div>'
        },
        time: {
          tpl: ['<span uib-dropdown auto-close="outsideClick" class="editable-doc-item__input-control header-form-control">',
            '<a href id="simple-dropdown" uib-dropdown-toggle>',
            '{{ngModel || "时间"}}',
            '</a>',
            '<ul class="dropdown-menu" uib-dropdown-menu>',
            '<li>',
            '<time-picker show-now="true" ng-model="ngModel"></time-picker>',
            '</li>',
            '</ul>',
            '</span>'].join(''),
          text: '<div class="editable-doc-item__text header-form-text">{{ngModel}}</div>'
        },
        signaturePicture: {
          tpl: '',
          text: '<div class="editable-doc-item__text"><img class="doc-sign-img" ng-if="signType === \'image\'" ng-src="/windranger/hospital/userDataSign/{{ngModel}}"><span ng-if="signType === \'name\'">{{ngModel}}</span></div>'
        },
        signature: {
          tpl: ['<div class="editable-doc-item__input-control">',
            '<button class="btn btn-default btn-xs" ng-if="!ngModel" ng-click="handleSign(patient)">签名</button>',
            '<img class="doc-sign-img" ng-if="ngModel && signType === \'image\'" ng-src="/windranger/hospital/userDataSign/{{ngModel}}">',
            '<span ng-if="signType === \'name\'">{{ngModel}}</span>',
            '</div>'].join(''),
          text: '<div class="editable-doc-item__text"><img class="doc-sign-img" ng-src="/windranger/hospital/userDataSign/{{ngModel}}"></div>'
        },
        select: {
          tpl: [
            '<select class="form-control input-sm editable-doc-item__input-control header-form-control" ng-model="ngModel" style="min-width: 20px" name="{{name}}">',
            '<option ng-repeat="item in _options" value="{{item.value}}">{{item.label}}</option>',
            '</select>'
          ].join(''),
          text: ['<div class="editable-doc-item__text header-form-text">',
            '{{ngModel ? ((_options | filter: {value: ngModel})[0].label || ngModel) : ""}}',
            '</div>'].join('')
        },
        select2: {
          tpl: '<dropdown-selector ng-model="ngModel" class="editable-doc-item__input-control" name="{{name}}" options="_options" with-id="withId" multiple="true"></dropdown-selector>'
        },
        selectAndInput: {
          tpl: '<select-and-input ng-model="ngModel" class="editable-doc-item__input-control header-form-control doc-header-form-select-and-input" name="{{name}}" options="_options" type="docHeader"></select-and-input>',
          text: '<div class="editable-doc-item__text header-form-text">{{ngModel}}</div>'
        },
        radio: {
          tpl: '<radio class="editable-doc-item__input-control" ng-model="ngModel" name="{{name}}" options="_options"></radio>',
          text: '<div class="editable-doc-item__text">{{getCheckboxLabels(_options, ngModel)}}</div>'
        },
        multiSelect: {
          tpl: [
            '<checkbox-group class="editable-doc-item__input-control" ng-model="ngModel" eles="_options"></checkbox-group>'
          ].join(''),
          text: '<div class="editable-doc-item__text">{{getCheckboxLabels(_options, ngModel)}}</div>'
        },
        textarea: {
          tpl: '<textarea style="resize: initial" class="form-control input-sm editable-doc-item__input-control header-form-control" name="{{name}}" type="text" ng-model="ngModel" ></textarea>',
          text: '<div class="editable-doc-item__text"><pre>{{ngModel}}</pre></div>'
        }
      };

      return [inputMap[type || 'text'].tpl, inputMap[type || 'text'].text].join('');
    }

    return {
      restrict: 'E',
      require: 'ngModel',
      scope: {
        type: '=',
        ngModel: '=',
        options: '=',
        editable: '=',
        name: '=',
        disabled: '=',
        callback: '&',
        demonstration: '='
      },
      link: function (scope, element) {
        var type = scope.type;
        var configHelper = sessionService.getConfHelper();
        var conf = configHelper.conf;

        scope.signType = _.get(conf, ['signShowImageOrName', 'configValue']);

        scope._options = scope.options && scope.options.map(function (item) {
          return {
            value: item.dicCode || item,
            label: item.dicName || item.dicCode || item
          };
        });

        var el = $compile(getControl(type, scope.name, scope.options || [], scope))(scope);
        element.append(el);

        scope.handleSign = function () {
          var profile = sessionService.getProfile();

          scope.ngModel = scope.signType === 'name' ? profile.userName : profile.userCode;

          if (scope.callback) {
            $timeout(function () {
              scope.callback();
            }, 200);
          }
        };

        scope.getCheckboxLabels = function (opts, values) {
          return _.chain(opts)
            .filter(function (item) {
              return values && values.indexOf(item.value) > -1;
            })
            .map('label')
            .join(', ')
            .value();
        };
      }
    };
  }

  /** @ngInject */
  function docHeaderForm(nursingRest, _, $document) {
    var directive = {
      restrict: 'E',
      replace: true,
      scope: {
        items: '=',
        sheet: '=',
        callback: '&',
        demonstration: '='
      },
      templateUrl: 'MNIS/components/docHeaderForm/docHeaderForm.tpl.html',
      link: function (scope, element, attrs) {
        scope.editable = true;

        var sheetWatcher = scope.$watch('sheet', function (value) {
          if (value) {
            scope.sheetForm = _.cloneDeep(value);
          }
        });

        var listener;


        // 清除$watcher
        scope.$on('$destroy', function () {
          sheetWatcher();
          listener();
        });

        // scope.edit = function () {
        //   scope.editable = true;
        // };

        scope.save = function () {
          nursingRest.updateNursingSheet(_.omit(scope.sheetForm, ['itemText', 'children', '$offsetPage', '$totalPage'])).then(function (response) {
            // scope.sheetForm = response.plain();
            // scope.editable = false;
            // scope.$emit('toast', {
            //   type: 'success',
            //   content: '保存成功！'
            // });

            if (typeof scope.callback === 'function') {
              scope.callback();
            }
          });
        };

        listener = scope.$on('saveHeaderForm', scope.save);
      }
    };

    return directive;
  }

})();
