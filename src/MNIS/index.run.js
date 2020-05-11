(function() {
  'use strict';

  angular.module('lachesis-mnis').run(runBlock);

  /** @ngInject */
  function runBlock($rootScope, $stateParams, mnisCalc) {
    $rootScope.mnisUtils = mnisCalc;
    $rootScope.mnisGlobal = {
      CLODOP: !!window.CLODOP
    };

    if ($stateParams.openOuter) {
      $rootScope.$broadcast("openOuter");
    }

    if (window.CLODOP) {
      window.CLODOP.SET_LICENSES(
        '深圳联影医疗科技有限公司',
        '4F9046779D3B7FAAEBA1D2F896DA0546',
        '',
        ''
      );
    }
  }

})();
