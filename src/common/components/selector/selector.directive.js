(function() {
  'use strict';

  angular.module('lachesis-common').directive('dropdownSelector', dropdownSelector);

  function dropdownSelector($document, _) {
    return {
      restrict: 'E',
      templateUrl: 'common/components/selector/selector.tpl.html',
      scope: {
        multiple: '=',
        withId: '=',
        ngModel: '=',
        options: '='
      },
      transclude: true,
      replace: true,
      link: function(scope, elem, attrs, ctl, transclude) {
        scope.required = attrs.required;
        scope.name = attrs.name;
        scope.class = attrs.class;
        var input = elem.find('.multi-selector__value');
        scope.open = false;

        input.on('click', function (e) {
          e.stopPropagation();
          scope.open = !scope.open;
          angular.element('.multi-selector').removeClass('open');
          elem.find('.multi-selector__options').css({'max-height': window.innerHeight - e.originalEvent.clientY - 100 + 'px' });
          elem.toggleClass('open');
        });

        var trancludeEmelemt = transclude();

        if (trancludeEmelemt.length > 0) {
          elem.find('.multi-selector__options').replaceWith(transclude());
        }

        var watcher = scope.$watch('ngModel', function (newValue, oldValue) {
          if (angular.isUndefined(newValue)) {
            return;
          }

          if (scope.multiple) {
            scope.showValue = _.chain(newValue)
            .map(function (value, index) {
              var option = _.find(scope.options, function (item) {
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
          } else {
            var currentOption = _.find(scope.options, function (item) {
              if (scope.withId) {
                return newValue.id ? newValue && item.id === newValue.id : _.get(newValue, [0, 'id']) === item.id;
              }

              return item.value === newValue;
            });

            scope.showValue = currentOption ? (currentOption.shortcut || currentOption.label) : '';
          }

        }, true);

        scope.$on('$destroy', watcher);

        scope.toggleOption = function (option, index) {
          var existIndex = _.findIndex(scope.ngModel, function (modelItem) {
            if (scope.withId) {
              return modelItem.id === option.id;
            }

            return modelItem === option.value;
          });

          var valueToSave = scope.withId ? {
            id: option.id,
            value: option.value
          } : option.value;

          if (scope.multiple) {
            if (existIndex === index) {
              scope.ngModel.splice(index, 1);
            }

            // TODO 按顺序排序
            if (existIndex > -1 && index !== existIndex) {
              scope.ngModel.splice(existIndex, 1);
            }

            if (existIndex < 0) {
              if (!scope.ngModel) {
                scope.ngModel = [];
              }

              var indexMoved = index;

              _.forEach(scope.ngModel, function (modelItem, modelIndex) {
                var modelInOptionsIndex = _.findIndex(scope.options, function (optionItem) {
                  if (scope.withId) {
                    return optionItem.id === modelItem.id;
                  }

                  return optionItem.value === modelItem;
                });

                if (modelInOptionsIndex > index && indexMoved > modelIndex) {
                  indexMoved = modelIndex;
                }
              });

              scope.ngModel.splice(indexMoved, 0, valueToSave);
            }
          } else {
            if (scope.withId && scope.ngModel && scope.ngModel.id === option.id) {
              scope.ngModel = null;

              return;
            }

            if (!scope.withId && typeof scope.ngModel !== 'undefined' && scope.ngModel === valueToSave) {
              scope.ngModel = null;

              return;
            }

            scope.ngModel = valueToSave;
          }
        };

        $document.off('click').on('click', function () {
          $document.find('.multi-selector').removeClass('open');
        });

        angular.element('.multi-selector__options').off().on('click', function (e) {
          e.stopPropagation();
        });
      }
    };
  }
})();
