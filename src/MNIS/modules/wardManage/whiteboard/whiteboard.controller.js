(function() {

  angular.module('lachesis-mnis').controller('WhiteboardController', WhiteboardController);

  /** @ngInject */
  function WhiteboardController($sce, $rootScope, taskRemindRest, moment, sessionService, _, $timeout) {
    var vm = this;
    var conf = sessionService.getConfHelper().conf;
    activate();

    function activate() {
      var url = _.get(conf, 'whiteBoardIframSrc.configValue');

      var params = {
        token: JSON.parse(window.localStorage.getItem('token')),
        profile: JSON.parse(window.localStorage.getItem('profile')),
        editable: true
      }

      vm.whiteBoardSrc = $sce.trustAsResourceUrl(url);

      var iframe = document.getElementById('whiteBoardSrc');

      window.addEventListener('message', function (event) {
        if (event.data === 'ready') {
          iframe.contentWindow.postMessage(params, '*');
        }
      });
    }
  }
})();
