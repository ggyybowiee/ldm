(function () {
  'use strict';

  angular
    .module('lachesis-settings')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        controller: 'MainController',
        controllerAs: 'vm',
        // abstract: true,
        templateUrl: 'settings/modules/main/main.tpl.html',
        resolve: {
          init: function (sessionService) {
            return sessionService.init();
          }
        }
      })
      .state('main.auths', {
        url: 'auths',
        templateUrl: 'settings/modules/authentication/rightAssign/auth.tpl.html',
        controller: 'AuthController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '权限分配'
          }
        }
      })
      .state('main.caBinding', {
        url: 'caBinding',
        templateUrl: 'settings/modules/caBinding/caBinding.tpl.html',
        controller: 'CaBinding',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: 'CA绑定'
          }
        }
      })
      .state('main.roles', {
        url: 'roles',
        templateUrl: 'settings/modules/authentication/roleAssign/role.tpl.html',
        controller: 'RoleController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '角色分配'
          }
        }
      })
      .state('main.keys', {
        url: 'keys',
        templateUrl: 'settings/modules/keys/keys.tpl.html',
        controller: 'KeysController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '统一认证钥匙串'
          }
        }
      })
      .state('main.workflow', {
        url: 'workflow',
        templateUrl: 'settings/modules/workflow/workflow.tpl.html',
        controller: 'WorkflowController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '工作流模板列表'
          }
        }
      })
      .state('main.workflowDetail', {
        url: 'workflow/:id',
        templateUrl: 'settings/modules/workflow/workflow.detail.html',
        controller: 'WorkflowEditController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '工作流详情',
            super: 'main.workflow'
          }
        }
      })
      .state('main.workflowHistory', {
        url: 'workflow/:id/history?key',
        templateUrl: 'settings/modules/workflow/history.tpl.html',
        controller: 'WorkflowHistoryController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '工作流历史版本',
            super: 'main.workflow'
          }
        }
      })
      .state('main.doc', {
        url: 'doc',
        templateUrl: 'settings/modules/doc/doc.tpl.html',
        controller: 'DocController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '文书模板列表'
          }
        }
      })
      .state('main.hosInfo', {
        url: 'hosInfo',
        templateUrl: 'settings/modules/info/info.tpl.html',
        controller: 'HosInfoController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '医院基础信息'
          }
        }
      })
      .state('main.settingBasicDictionary', {
        url: 'settingBasicDictionary',
        templateUrl: 'settings/modules/configuration/settingBasicDictionary/settingBasicDictionary.tpl.html',
        controller: 'settingBasicDictionary',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '字典配置'
          }
        }
      })
      .state('main.settingBasicConfig', {
        url: 'settingBasicConfig',
        templateUrl: 'settings/modules/configuration/settingBasicConfig/settingBasicConfig.tpl.html',
        controller: 'settingBasicConfig',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '基础配置项'
          }
        }
      })

    ;
    $urlRouterProvider.otherwise('/');
    // $urlRouterProvider.when('/', '/auths')
  }
})();
