(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .directive('printFrame', printFrame);

  /** @ngInject */
  function printFrame($timeout) {
    var directive = {
      restrict: 'A',
      link: linkFunc,
      scope: {
        printFrame: '@'
      }
    };

    return directive;

    function linkFunc(scope, elem, attrs, ctrl) {
      elem.on('click', function () {
        var targetElement = angular.element('#' + scope.printFrame);
        var iframeWindow = document.querySelector('#printFrame');
        if (!iframeWindow || iframeWindow.length === 0) {
          var iframe = document.createElement('iframe');
          iframe.id = 'printFrame';
          document.body.appendChild(iframe);
          iframeWindow = document.querySelector('#printFrame');
        }
        iframeWindow.contentWindow.document.head.innerHTML = window.document.head.innerHTML;
        iframeWindow.contentWindow.document.body.innerHTML = targetElement[0].outerHTML;
        iframeWindow.contentWindow.document.body.className = 'printSection';

        $timeout(function() {
          iframeWindow.contentWindow.print();
        }, 200)
      });
    }
  }

})();
