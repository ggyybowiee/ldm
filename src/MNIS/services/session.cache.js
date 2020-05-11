(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .factory('mnisSessionCache', mnisSessionCache);

  /** @ngInject */
  function mnisSessionCache($rootScope, $q, hospitalRest) {
    var wards;
    var service = {
      getWardHelper: getWardHelper,
      init: init,
      destroy: destroy
    };

    return service;

    function setWardHelper(w) {
      wards = w;
    }

    function getWardHelper() {
      return wards;
    }

    function clearWardHelper() {
      wards = null;
    }

    function init() {
      var wp = hospitalRest.getWards();
      return $q.all([wp]).then(function(results) {
        setWardHelper({
          wards: results[0].plain(),
          getWardName: function(wardCode) {
            var match = _.find(this.wards, function(item) {
              return item.wardCode == wardCode;
            });
            return match ? match.wardName: '';
          },
          getWardCode: function(wardName) {
            var match = _.find(this.wards, function(item) {
              return item.wardName == wardName;
            });
            return match ? match.wardCode: '';
          }
        });
      }, function() {
        $rootScope.$broadcast('toast', {
          type: 'error',
          content: '账号初始化失败，请联系管理员'
        });
        $rootScope.$broadcast('logout');
        throw new Error('init error');
      });
    }

    function destroy() {
      clearWardHelper();
    }
  }
})();