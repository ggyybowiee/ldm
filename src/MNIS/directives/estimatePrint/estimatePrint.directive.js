(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('estimatePrintBtn', estimatePrintBtn)
    .directive('estimatePrint', estimatePrint)
    .directive('estimatePrintBtnV11', estimatePrintBtnV11);

  /** @ngInject */
  function estimatePrint() {
    var directive = {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<iframe id="estimatePrintFrame" frameborder="0"></iframe>',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, elem, attrs, ctrl, transclude) {
      elem[0].contentWindow.document.head.innerHTML = window.document.head.innerHTML;
      // angular.element(elem[0].contentWindow.document.body).append(transclude());
    }
  }

  /** @ngInject */
  function estimatePrintBtn($timeout, $rootScope) {
    var directive = {
      restrict: 'A',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, elem, attrs, ctrl) {
      elem.on('click', function () {

        $rootScope.$broadcast('startEstimatePrint', function (html) {
          $timeout(function () {
            var iframeWindow = angular.element(window.document.body).find('#estimatePrintFrame')[0].contentWindow;
            var bodyElem = angular.element(iframeWindow.document.body);

            bodyElem.html('');
            bodyElem.append(html);
            iframeWindow.print();
          });
        }, attrs.estimatePrintBtn);
      });
    }
  }

  /** @ngInject */
  function estimatePrintBtnV11($timeout, $rootScope) {
    var directive = {
      restrict: 'A',
      link: linkFunc
    };

    return directive;

    function linkFunc(scope, elem, attrs, ctrl) {
      elem.on('click', function () {

        var iframeWindow = angular.element(window.document.body).find('#estimatePrintFrame')[0].contentWindow;
        var bodyElem = angular.element(window.document.body).find('#estimate-print-frame');
        console.log("123");
        iframeWindow.document.body.outerHTML = bodyElem[0].outerHTML;
        iframeWindow.print();
      });
    }
  }

})();
