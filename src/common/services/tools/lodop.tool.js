(function() {
  "use strict";

  angular.module("lachesis-common").factory("lodopTool", lodopTool);

  /** @ngInject */
  function lodopTool($window, modalService) {
    var service = {
      lodopTip: lodopTip,
      getTableStyle: getTableStyle,
      getCommonStyle: getCommonStyle,
      init: init,
      pageInit: pageInit
    };

    return service;

    function init() {
      var lodop = $window.getCLodop && $window.getCLodop();
      if (lodop) {
        lodop.PRINT_INIT()
      }

      return lodop;
    }

    function pageInit(lodop) {
      lodop.SET_PRINT_MODE('AUTO_CLOSE_PREWINDOW', 1);
      lodop.SET_PREVIEW_WINDOW(1, 0, 1);
      lodop.SET_SHOW_MODE('HIDE_PAGE_PERCENT', 1);
    }

    function lodopTip() {
      modalService.open({
        size: "sm",
        templateUrl: "common/services/tools/tpl/lodop.tip.html",
        methodsObj: {
          reload: function() {
            location.reload();
          }
        }
      });
    }

    function getTableStyle() {
      return (
        "<style>" +
        "table {width: 100%; border-collapse:collapse; margin-bottom: 20px;}" +
        "th, td {border: 1px solid black;text-align: center; height:20px;}" +
        "th {font-size: 12px;}" +
        "td {font-size: 12px;}" +
        "tr, thead {page-break-inside: avoid}" +
        ".group-table tbody {page-break-inside: avoid}" +
        "</style>"
      );
    }

    function getCommonStyle() {
      return (
        "<style>" +
        ".row:before, .row:after {content: ' '; display: table;}" +
        ".row:after {clear: both;}" +
        ".col-xs-2, .col-xs-4 {position: relative; min-height: 1px;}" +
        ".col-xs-1 {width: 8.3%}" +
        ".col-xs-2 {width: 16.3%}" +
        ".col-xs-3 {width: 25%}" +
        ".col-xs-4 {width: 33%}" +
        ".pull-right {float: right;}" +
        ".text-left {text-align: left!important;}" +
        ".text-right {text-align: right!important;}" +
        ".text-center {text-align: center!important;}" +
        "</style>"
      );
    }
  }
})();
