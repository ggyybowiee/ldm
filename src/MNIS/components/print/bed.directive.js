(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("bedPrint", bedPrint);

  /** @ngInject */
  function bedPrint(
    $templateRequest,
    $timeout,
    $compile,
    lodopTool,
    sessionService,
    wardRest,
    businessCalc,
    _
  ) {
    var directive = {
      restrict: "A",
      scope: {
        content: "=bedPrint"
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

      doCompile();

      function doCompile() {
        getTemplate(confHelper.conf).then(function (res) {
          print(res.template, res.width, res.length, _.get(confHelper.conf, 'bedCardPrintDirection.configValue') || 1, res.printerName);
        });
      }

      function getTemplate(conf) {
        scope.isUseMongoConfig = conf.printUseMongoConfig;
        if (scope.isUseMongoConfig && parseInt(scope.isUseMongoConfig.configValue) === 1) {
          return wardRest.getHTMLTemplate({
            tplType: 'bedcard',
            wardCode: sessionService.getProfile().wardCode
          });
        } else {
          return $templateRequest("MNIS/components/print/bed.tpl.html").then(function (res) {
            return {
              template: res,
              width: 1480,
              length: 2100
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
              subScope.getNurseLevel = businessCalc.getNurseLevel;
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

              lodop.PREVIEW();
              scope.$emit("preview_finish",'');
            }, 200);
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
