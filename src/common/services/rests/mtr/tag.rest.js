(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('tagRest', tagRest);

  /** @ngInject */
  function tagRest(Restangular, moment) {
    var service = {
      getTagsByUser: getTagsByUser,
      createTag: createTag,
      deleteTag: deleteTag,
      getTag: getTag,
      getCollected: getCollected,
      collect: collect,
      uncollect: uncollect,
      getTagRecords: getTagRecords,
      getTagStatitics: getTagStatitics,
      getShared: getShared,
      share: share,
      unshare: unshare
    };

    return service;

    function getTagsByUser(userCode, params) {
      return Restangular.one('/mtr/user', userCode).all('tags').getList(params);
    }

    function createTag(userCode, data) {
      data.userCode = userCode;
      data.createTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.updateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      data.createPerson = 'test';
      data.updatePerson = 'test';
      return Restangular.all('mtr/tags').customPOST(data);
    }

    function deleteTag(id) {
      return Restangular.one('mtr/tags', id).remove();
    }

    function getTag(id) {
      return Restangular.one('mtr/tags', id).get();
    }

    function getCollected(patId, userCode) {
      return Restangular.one('mtr/emr/', patId).one('recordTagMapping', userCode).all('tags').getList();
    }

    function collect(patId, tagId) {
      var data = {
        patCode: patId,
        patEmrTagSeqId: tagId,
        createTime: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        updateTime: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        createPerson: 'test',
        updatePerson: 'test'
      }
      return Restangular.one('mtr/tags', tagId).all('recordTagMappings').customPOST([data]);
    }

    function uncollect(id) {
      return Restangular.one('/mtr/tags/recordTagMappings/', id).remove();
    }

    function getTagRecords(id) {
      return Restangular.one('/mtr/tags/', id).all('inhosRecords').getList();
    }

    function getTagStatitics(id) {
      return Restangular.one('/mtr/tags/', id).one('statitics').get();
    }

    function getShared(id) {
      return Restangular.one('/mtr/tags/' + id).all('tagUserMappings').getList();
    }

    function share(docId, tagId) {
      var data = {
        userCode: docId,
        patEmrTagSeqId: tagId,
        createTime: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        updateTime: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        createPerson: 'test',
        updatePerson: 'test'
      }
      return Restangular.one('mtr/tags', tagId).all('tagUserMappings').customPOST([data]);
    }

    function unshare(id) {
      return Restangular.one('/mtr/tags/tagUserMappings/', id).remove();
    }
  }
})();