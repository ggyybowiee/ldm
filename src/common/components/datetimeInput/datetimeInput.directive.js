(function () {
  "use strict";

  angular.module("lachesis-common").directive("datetimeInput", datetimeInput);

  /** @ngInject */
  function datetimeInput($timeout, moment, _) {
    var directive = {
      restrict: "E",
      scope: {
        ngModel: "=",
        ngInputKeydown: "=",
        ngInputFocus: "=",
        editFormat: "@",
        inputClass: "@"
      },
      templateUrl: "common/components/datetimeInput/datetimeInput.tpl.html",
      replace: true,
      link: linkFunc
    };

    function linkFunc(scope, el) {
      initViewModel();

      var handlers = {
        year: function () {
          if (scope.year.value) {
            scope.year.value = Math.max(1, scope.year.value);
          }
          handlers.day(null);
        },
        month: function () {
          if (scope.month.value) {
            scope.month.value = Math.min(12, scope.month.value);
            scope.month.value = Math.max(1, scope.month.value);
            scope.month.value = getTextValue(scope.month.value);
            handlers.day(null);
          }
        },

        day: function () {
          if (scope.day.value) {
            switch (scope.month.value) {
              case ("01", "03", "05", "07", "08", "10", "12"):
                scope.day.value = Math.min(31, scope.day.value);
                break;
              case "02":

                var year = parseInt(scope.year.value);

                if (
                  (year % 100 == 0 &&
                    year % 400 == 0) ||
                  (year % 100 != 0 && year % 4 == 0)
                ) {
                  scope.day.value = Math.min(29, scope.day.value);
                } else {
                  scope.day.value = Math.min(28, scope.day.value);
                }
                break;
              case ("04", "06", "09", "11"):
                scope.day.value = Math.min(30, scope.day.value);
                break;
            }
            scope.day.value = Math.max(1, scope.day.value);
            scope.day.value = getTextValue(scope.day.value);
          }
        },

        hour: function () {
          if (scope.hour.value) {
            scope.hour.value = Math.min(23, scope.hour.value);
            scope.hour.value = Math.max(0, scope.hour.value);
            scope.hour.value = getTextValue(scope.hour.value);
          }
        },

        minute: function () {
          if (scope.minute.value) {
            scope.minute.value = Math.min(59, scope.minute.value);
            scope.minute.value = Math.max(0, scope.minute.value);
            scope.minute.value = getTextValue(scope.minute.value);
          }
        }
      };
      var focusIndex = 0;

      scope.handleChange = function (type) {
        var inputs = el.find(".datetime-input");
        var inputValue = _.get(scope, [type, "value"]);

        if (!inputValue) {
          return;
        }

        if (
          (type === "year" && inputValue.length === 4) ||
          (type !== "year" && inputValue.length === 2)
        ) {
          focusIndex += 1;
          inputs.eq(focusIndex).focus();
        }

        if (type == 'minute' && inputValue.length === 2) {
          scope.$emit("FocusNextInputControl");
        }
      };

      scope.onBlur = function (type) {
        handlers[type]();
        var format = "YYYY-MM-DD HH:mm";
        format = format.replace("YYYY", scope.year.value);
        format = format.replace("MM", scope.month.value);
        format = format.replace("DD", scope.day.value);
        format = format.replace("HH", scope.hour.value);
        format = format.replace("mm", scope.minute.value);

        scope.ngModel = moment(format).format(scope.editFormat);
      };

      scope.onFocus = function (event) {
        
        var input = event.target;
        var inputs = el.find(".datetime-input");
        event.target = inputs[0];
        scope.ngInputFocus && scope.ngInputFocus(event);

        focusIndex = angular
          .element(input)
          .parent()
          .index();

        $timeout(function() {
          angular.element(input).select();
        });
      }

      $timeout(function () {

        angular.element(".datetime-input").on("keydown", function (e) {

          var inputs = el.find(".datetime-input");
          var input = e.target;

          // 上 + Enter
          if (e.keyCode == 38 || e.keyCode == 13) {
            e.target = inputs[0];
            scope.ngInputKeydown && scope.ngInputKeydown(e);
          }
          // 下
          else if (e.keyCode == 40) {
            e.target = inputs[0];
            scope.ngInputKeydown && scope.ngInputKeydown(e);
          }
          // 右
          else if (e.keyCode == 39) {
            // console.log(input);
            if (input.selectionEnd == input.value.length) {
              focusIndex += 1;
              focusIndex = Math.min(inputs.length, focusIndex);
              inputs.eq(focusIndex).focus();
            }
          }
          // 左
          else if (e.keyCode == 37) {
            if (input.selectionEnd == 0) {
              focusIndex -= 1;
              focusIndex = Math.max(0, focusIndex);
              inputs.eq(focusIndex).focus();
            }
          }
        });
      });

      // 初始化ViewModeld
      function initViewModel() {
        scope.editFormat = scope.editFormat || "YYYY-MM-DD HH:mm";
        var datetime = new Date(scope.ngModel);
        scope.ngModel = moment(datetime).format(scope.editFormat);
        scope.year = {
          value: getTextValue(datetime.getFullYear()),
          visible: scope.editFormat.indexOf("YYYY") != -1
        };

        scope.month = {
          value: getTextValue(datetime.getMonth() + 1),
          visible: scope.editFormat.indexOf("MM") != -1
        };

        scope.day = {
          value: getTextValue(datetime.getDate()),
          visible: scope.editFormat.indexOf("DD") != -1
        };

        scope.hour = {
          value: getTextValue(datetime.getHours()),
          visible: scope.editFormat.indexOf("HH") != -1
        };

        scope.minute = {
          value: getTextValue(datetime.getMinutes()),
          visible: scope.editFormat.indexOf("mm") != -1
        };
      }

      function getTextValue(val) {
        return val < 10 ? "0" + val : "" + val;
      }
    }

    return directive;
  }
})();
