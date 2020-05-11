(function () {
  "use strict";

  angular.module("lachesis-mnis").directive("bottlePrint", bottlePrint);

  /** @ngInject */
  function bottlePrint(
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
        content: "=bottlePrint",
        cb: "&"
      },
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, el) {
      var lodop = lodopTool.init(),
        confHelper = sessionService.getConfHelper();
      el.attr("disabled", "disabled");
      scope.dicHelper = sessionService.getDicHelper();
      scope.$watch("content", change);
      //$templateRequest("MNIS/components/print/bottle.tpl.html")
      dicService.getDic().then(function (response) {
        // var isUseMongoConfig = response.data.sysConfig.printUseMongoConfig;
        // if (isUseMongoConfig && parseInt(isUseMongoConfig.configValue) === 1) {
        //   wardRest.getHTMLTemplate({
        //     tplType: 'label',
        //     wardCode: sessionService.getProfile().wardCode
        //   }).then(function (res) {
        //     var html = res.template,
        //       length = res.length,
        //       width = res.width,
        //       printerName = res.printerName;
        //     print(html, width, length, _.get(response.data.sysConfig, 'bottlePrintDirection.configValue') || 1, printerName);
        //   })
        // } else {
          $templateRequest("MNIS/components/print/bottle.tpl.html").then(function (res) {
            print(res, 860, 680, 0);
          })
        // }
      });

      function printBottleAtOnce(html, width, length, direction, printerName) {
        for (var i = 0; i < scope.content.length; i = i + 100) {
          lodopTool.pageInit(lodop);
          lodop.SET_PRINT_PAGESIZE(direction, width, length);
          lodop.SET_PRINT_MODE("AUTO_CLOSE_PREWINDOW", true);
          lodop.SET_PRINTER_INDEX(
            printerName
          );

          _.forEach(scope.content.slice(i, i + 100), function (item) {
            var subScope = scope.$new(true);
            item.wardCode = sessionService.getProfile().wardCode;
            item.wardName = sessionService.getProfile().wardName;
            var data = angular.copy(item);
            subScope.order = data;
            subScope.getAge = businessCalc.getAge;
            subScope.getGender = businessCalc.getGender;
            var elem = angular.element(html);
            $compile(elem)(subScope);
            scope.$apply();

            lodop.NewPage();
            //ADD_PRINT_HTM,文本打印普通模式，放大依然清晰
            //ADD_PRINT_HTML，文本打印图形模式，放大模糊。打印速度快。
            lodop.ADD_PRINT_HTM(0, 0, "100%", "100%", elem[0].outerHTML);
          });

          lodop.PRINT();
          scope.cb();
        }
      }

      function previewBottle(html, width, length, direction, printerName) {
        lodopTool.pageInit(lodop);
        lodop.SET_PRINT_PAGESIZE(direction, width, length);
        lodop.SET_PRINT_MODE("AUTO_CLOSE_PREWINDOW", true);
        lodop.SET_PRINTER_INDEX(
          printerName
        );

        _.forEach(scope.content, function (item) {
          var subScope = scope.$new(true);
          item.wardCode = sessionService.getProfile().wardCode;
          item.wardName = sessionService.getProfile().wardName;
          var data = angular.copy(item);
          subScope.order = data;
          subScope.getAge = businessCalc.getAge;
          subScope.getGender = businessCalc.getGender;
          var elem = angular.element(html);
          $compile(elem)(subScope);
          scope.$apply();

          lodop.NewPageA();
          //ADD_PRINT_HTM,文本打印普通模式，放大依然清晰
          //ADD_PRINT_HTML，文本打印图形模式，放大模糊。打印速度快。
          lodop.ADD_PRINT_HTM(0, 0, "100%", "100%", elem[0].outerHTML);
        });

        lodop.On_Return = function (id, value) {
          if (+value) {
            scope.cb();
          }
        };
        lodop.PREVIEW();
      }

      function print(html, width, length, direction, printerName) {
        el.click(function () {
          if (!lodop) {
            lodopTool.lodopTip();
          } else {
            scope.content.length > 100 ? printBottleAtOnce(html, width, length, direction, printerName) : previewBottle(html, width, length, direction, printerName);
          }
        });
      }

      function change() {
        if (
          (wardRest.getHTMLTemplate({
            tplType: 'label',
            wardCode: sessionService.getProfile().wardCode
          }) || $templateRequest("MNIS/components/print/bottle.tpl.html")) &&
          scope.content &&
          scope.content.length
        ) {
          el.removeAttr("disabled");
        } else {
          el.attr("disabled", "disabled");
        }
      }
    }
  }
})();
