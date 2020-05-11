(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("wristPrint", wristPrint);

  /** @ngInject */
  function wristPrint(
    $templateRequest,
    $templateCache,
    $interpolate,
    $timeout,
    $compile,
    $window,
    lodopTool,
    modalService,
    sessionService,
    businessCalc,
    wardRest,
    dicService,
    _
  ) {
    var directive = {
      restrict: "A",
      scope: {
        content: "=wristPrint"
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      var lodop = lodopTool.init(),
        confHelper = sessionService.getConfHelper();

      el.attr("disabled", "disabled");

      scope.$watch("content", function (val) {
        change();
        if (val) {
          doCompile();
        }
      });

      function doCompile() {
        getTemplate(confHelper.conf).then(function (res) {
          print(res.template, res.width, res.length, _.get(confHelper.conf, 'wristPrintDirection.configValue') || 2, res.printerName);
        });
      }

      function getTemplate(conf) {
        scope.isUseMongoConfig = conf.printUseMongoConfig;
        if (scope.isUseMongoConfig && parseInt(scope.isUseMongoConfig.configValue) === 1) {
          return wardRest.getHTMLTemplate({
            tplType: 'wristband',
            wardCode: sessionService.getProfile().wardCode
          });
        } else {
          return $templateRequest("MNIS/components/print/wrist.tpl.html").then(function (res) {
            return {
              template: res,
              width: 350,
              length: 2480,
              direction: 2
            };
          })
        }
      }

      function print(html, width, length, direction, printerName) {
        el.off('click').on('click', function () {
          if (!lodop) {
            lodopTool.lodopTip();
          } else {
            lodopTool.pageInit(lodop);
            lodop.SET_PRINT_PAGESIZE(direction, width, length);
            lodop.SET_PRINTER_INDEX(
              printerName
            );

            var stack = [];
            _.forEach(scope.content, function (item) {
              var subScope = scope.$new(true);
              var data = angular.copy(item);
              subScope.patient = data;
              subScope.getAge = businessCalc.getAge;
              subScope.getGender = businessCalc.getGender;
              var elem = angular.element(html);
              $compile(elem)(subScope);
              stack.push(elem);
            });

            $timeout(function () {
              _.forEach(stack, function (item) {
                lodop.NewPage();
                lodop.ADD_PRINT_HTM(0, 0, "100%", "100%", item[0].outerHTML);
                lodop.SET_PRINT_STYLEA(0, "HtmWaitMilSecs", 300);
              });
              scope.$emit("preview_finish",'');
              lodop.On_Return = function (id, value) {
                if (+value) {
                  scope.cb();
                }
              };
              lodop.PREVIEW();
            }, 100);
          }
        });
      }

      function change() {
        if (scope.content && scope.content.length > 0) {
          el.removeAttr("disabled");
        } else {
          el.attr("disabled", "disabled");
        }
      }
    }
  }
})();
