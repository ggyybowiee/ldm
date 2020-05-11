(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .directive('customPrint', customPrint);

  /** @ngInject */
  function customPrint($timeout, modalService, $q, _) {
    var directive = {
      restrict: 'E',
      scope: {
        printHtml: '=',
        cb: '&',
        cancel: '&'
      },
      templateUrl: 'common/directives/print/customPrint.tpl.html',
      link: linkFunc,
      replace: true
    };

    return directive;

    function linkFunc(scope, el, attr) {
      var iframe = el.find('iframe')[0];

      scope.printHtml = function(html, flag, cb, cancel, printFlag) {
        iframe.contentWindow.document.head.innerHTML = window.document.head.innerHTML;
        iframe.contentWindow.document.body.id = 'customPrint';
        iframe.contentWindow.document.body.innerHTML = html;

        var printMark = iframe.contentWindow.document.getElementsByClassName('printMark');
        if (printMark && printMark.length > 0) {
          _.forEach(printMark, function (item) {
            item.innerHTML = '';
          });
        }

        var defer = $q.defer();

        $timeout(function() {
          defer.resolve(iframe.contentWindow.print());

          if(flag) {
            $timeout(function() {
              modalService.open({
                size: 'sm',
                templateUrl: 'common/directives/print/printTip.modal.html',
                data: {
                  formData: {
                    printFlag: printFlag
                  }
                },
                ok: function() {
                  if (cb) {
                    cb();
                  }
                  return true;
                },
                cancel: function () {
                  if (cancel) {
                    cancel();
                  }
                  return true;
                }
              });
            }, 300);
          }
        }, 1000);

        return defer.promise;
      }
    }
  }

})();
