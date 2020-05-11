(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('workflowRest', workflowRest);

  /** @ngInject */
  function workflowRest(Restangular) {
    var workflow = 'workflows/procdefs',
        history = 'workflows/procHistories',
        deploy = 'workflows/deploy';
    var service = {
      getWorkflows: getWorkflows,
      getWorkflow: getWorkflow,
      getHistory: getHistory,
      postDeploy: postDeploy
    };

    return service;

    function getWorkflows(cate) {
      return Restangular.all(workflow).getList({
        category: cate
      });
    }

    function getWorkflow(id) {
      return Restangular.one(workflow, id).get();
    }

    function getHistory(key) {
      return Restangular.all(history).getList({
        key: key
      });
    }

    function postDeploy(formData) {
      return Restangular.all(deploy)
        .withHttpConfig({transformRequest: angular.identity})
        .customPOST(formData, undefined, undefined,
        { 'Content-Type': undefined });
    }
  }
})();