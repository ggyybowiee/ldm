(function() {
  'use strict';

  angular
    .module('lachesis-common', [
      'ngAnimate',
      'ngCookies',
      'ngTouch',
      'ngSanitize',
      'ngMessages',
      'ngAria',
      'ngResource',
      'ui.router',
      'ui.bootstrap',
      'toastr',
      'w5c.validator',
      'AngularPrint',
      'smart-table',
      'echarts-ng',
      'treeControl',
      'angularFileUpload',
      'ui.select2',
      'angular-timeline',
      'monospaced.qrcode',
      'restangular',
      'NgSwitchery',
      'ui.select',
      'colorpicker.module',
      'ui.bootstrap.contextMenu',
      'countUpModule'
    ]);

})();


// Removed IE support in this demo for the sake of simplicity

(function() {


  var _setSessionItem = sessionStorage.setItem;
  var setSessionItem = function(v, k) {
    _setSessionItem.call(sessionStorage, v, k);
  }

  function triggerSyncSessionStorage() {
    localStorage.setItem('getSessionStorage', Date.now());
  }

  window.addEventListener('storage', function(event) {
    console.log('storage event', event);

    if (event.key == 'getSessionStorage') {
    // Some tab asked for the sessionStorage -> send it

      localStorage.setItem('sessionStorage', JSON.stringify(Object.assign({}, sessionStorage, {_a: Math.random()})));

    } else if (event.key == 'sessionStorage') {
    // sessionStorage is empty -> fill it

      var data = JSON.parse(event.newValue), value;

      for (key in data) {
        setSessionItem(key, data[key]);
      }
    }
  });

  window.onbeforeunload = function(event) {
    // sessionStorage.clear();
    // localStorage.clear();
    // if (window.location.href.indexOf('#/entry') === -1) {
    //   sessionStorage.clear();
    //   localStorage.clear();
    // }
  };

  sessionStorage.setItem = function (v, k) {
    setSessionItem(v, k);
    localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
  }

  triggerSyncSessionStorage();


})();
