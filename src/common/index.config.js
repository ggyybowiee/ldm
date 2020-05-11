(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .config(config);

  /** @ngInject */
  function config(toastrConfig, stConfig, w5cValidatorProvider) {
    // Set options third-party lib
    toastrConfig.autoDismiss = true;
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    // toastrConfig.closeButton = true;
    toastrConfig.positionClass = 'toast-top-center';
    // toastrConfig.preventDuplicates = true;
    toastrConfig.progressBar = false;
    toastrConfig.preventOpenDuplicates = true;
    toastrConfig.iconClasses = {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    };
    /**
     * 分页配置
     */
    stConfig.pagination.template = 'common/components/pagination/pagination.tpl.html';

    //表单验证
    w5cValidatorProvider.setDefaultRules({
      customizer: '数据规则错误'
    });
    w5cValidatorProvider.setRules({
      confirmPwd: {
        customizer: "两次密码不相等"
      },
      oldPwd: {
        customizer: "密码错误"
      }
    });
  }

})();
