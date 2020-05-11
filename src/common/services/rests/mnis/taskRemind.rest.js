(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('taskRemindRest', taskRemindRest);

  /** @ngInject */
  function taskRemindRest(Restangular, $q, moment, _) {
    var taskRemindConfigUrl = '/Mnis/remindConfig'; 
    var taskRemindUrl = '/Mnis/taskReminds/list';
    var taskRemindInhosUrl = '/Mnis/taskReminds/inhos';
    var vitalConfigUrl = '/Mnis/vitalConfig';
    var taskReminds = '/Mnis/taskReminds';

    var service = {
      getTaskRemindConfigList: getTaskRemindConfigList,
      addTaskRemindRest: addTaskRemindRest,
      updateTaskRemindRest: updateTaskRemindRest,
      taskRemindsResource: taskRemindsResource,
      deleteTaskRemindConfig: deleteTaskRemindConfig,
      getTaskRemindList: getTaskRemindList,
      getVitalConfig: getVitalConfig,
      getTaskRemindInhos:getTaskRemindInhos
    };

    return service;

    function getTaskRemindInhos(params) {
      return Restangular.all(taskRemindInhosUrl).customGET('', params);
    }

    function getTaskRemindConfigList(params) {
      return Restangular.all(taskRemindConfigUrl).customGET('', params);
    }

    function addTaskRemindRest(data) {
      return Restangular.all(taskRemindConfigUrl).customPOST(data);
    }

    function updateTaskRemindRest(id, data) {
      return Restangular.all(taskRemindConfigUrl + '/' + id).customPUT(data);
    }

    function taskRemindsResource(id) {
      return Restangular.all(taskReminds + '/' + id);
    }

    function deleteTaskRemindConfig(id) {
      return Restangular.all(taskRemindConfigUrl).customDELETE(id);
    }

    function getTaskRemindList(params) {
      return Restangular.all(taskRemindUrl).customGET('', params);
    }

    function getVitalConfig(params) {
      return Restangular.one(vitalConfigUrl).get(params);
    }
  }
})();
