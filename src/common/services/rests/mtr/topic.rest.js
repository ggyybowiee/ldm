(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('topicRest', topicRest);

  /** @ngInject */
  function topicRest(Restangular, moment) {
    var service = {
      getSubjectsByUser: getSubjectsByUser,
      getSubjectStatitiesByUser: getSubjectStatitiesByUser,
      getSubjectStatitics: getSubjectStatitics,
      getSubject: getSubject,
      getSampleGroups: getSampleGroups,
      createGroup: createGroup,
      updateGroup: updateGroup,
      delGroup: delGroup,
      createSample: createSample,
      getSamples: getSamples
    };

    return service;

    function getSubjectsByUser(userCode, params) {
      return Restangular.one('/mtr/users', userCode).all('subjects').getList(params);
    }

    function getSubjectStatitiesByUser(userCode, params) {
      return Restangular.one('/mtr/users', userCode).one('subject', 'statitics').get(params);
    }

    function getSubjectStatitics(id) {
      return Restangular.one('/mtr/subjects', id).one('statitics').get();
    }

    function getSubject(id) {
      return Restangular.one('/mtr/subjects', id).get();
    }

    function getSampleGroups(id) {
      return Restangular.one('mtr/subjects', id).all('sampleGroups').getList();
    }

    function createGroup(subId, data) {
      data.researchSubjectCode = subId;
      data.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.createPerson = 'test';
      data.updatePerson = 'test';
      return Restangular.one('mtr/subjects', subId).all('sampleGroups').customPOST(data);
    }

    function updateGroup(data) {
      return Restangular.one('mtr/sampleGroups', data.seqId).customPUT(data);
    }

    function delGroup(id) {
      return Restangular.one('mtr/sampleGroups', id).remove();
    }

    function createSample(groupId, data) {
      data.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.createPerson = 'test';
      data.updatePerson = 'test';
      return Restangular.one('mtr/sampleGroups', groupId).all('emrGroupMappings').customPOST([data]);
    }

    function getSamples(id) {
      return Restangular.one('/mtr/sampleGroups/', id).all('emrGroupMappings').getList();
    }
  }
})();