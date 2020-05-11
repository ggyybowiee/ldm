(function () {
  'use strict';

  angular.module('lachesis-common').factory('websocketService', websocketService);

  /** @ngInject */
  function websocketService() {
    var service = {
      parseWebsocketUrl: parseWebsocketUrl,
      createSocket: createSocket,
      createSocketScoped: createSocketScoped
    };

    return service;

    function parseWebsocketUrl(urlObj) {
      if (!urlObj) {
        throw new Error('argument must be an object, but got ' + (typeof urlObj));
      }
      return 'ws://' + (urlObj.ip || location.host.split(':')[0]) + ':' + (urlObj.port || location.host.split(':')[1] || '80') + urlObj.path;
    }

    function createSocket(name, url, handlers) {
      var proxySocket = {
        isDestroy: false
      };
      var socket = new WebSocket(url);
      socket.onopen = function () {
        console.log(name + ' websocket打开成功');
        if (handlers.onopen) {
          handlers.onopen();
        }
      }
      socket.onmessage = handlers.onmessage;
      socket.onclose = function () {
        console.log(name + ' websocket 关闭成功');
        if (handlers.onclose) {
          handlers.onclose();
        }

        if (!proxySocket.isDestroy) {
          setTimeout(function () {
            socket = createSocket(name, url, handlers).__socket;
            proxyMethodsSocket(socket);
          }, 1000);
        }
      };

      function proxyMethodsSocket(socket) {
        proxySocket.__socket = socket;
      }

      proxyMethodsSocket(socket);
      return proxySocket;
    }

    function createSocketScoped(name, url, handlers, $scope) {
      var socketScope = createSocket(name, url, handlers);
      socketScope.name = name;
      console.log(name + ' WebsocketScoped创建成功');
      $scope.$on('$destroy', function () {
        socketScope.isDestroy = true;
        socketScope.__socket.close();
        console.log(name + ' WebsocketScoped销毁成功');
      });
      return socketScope;
    }

  }
})();
