(function() {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('DocController', DocController);

  /** @ngInject */
  function DocController(modalService, authHelperService, docRest, hospitalRest, sessionService, workflowRest, _) {
    var vm = this;
    var dicHelper = sessionService.getDicHelper();
    vm.dic = dicHelper.dic;
    vm.queryParams = {};
    vm.load = {
      init: true,
      func: loadData
    };
    vm.go = go;
    vm.delDoc = delDoc;
    vm.open = open;
    vm.openDocAdd = openDocAdd;

    activate();

    function activate() {
      getWards();
      vm.apps = authHelperService.getInApps();
      vm.sizeDic = docRest.sizeDic;
    }

    function loadData() {
      return docRest.getDocs(vm.queryParams).then(function(data) {
        vm.list = _.sortBy(data, function(item) {
          return +item.sortNo
        });
      });
    }

    function getWards() {
      return hospitalRest.getWards().then(function(response) {
        vm.wards = response;
      });
    }

    function getWorkflows(category) {
      return workflowRest.getWorkflows(category);
    }

    function delDoc(id) {
      return docRest.delDoc(id).then(function(data) {
        vm.load.func();
      });
    }

    function go(id, workflow) {
      localStorage.removeItem('IDOC_STATE');
      if(id) {
        location.href = '/DOC/design/index.html#/canvas?tplId=' + id + '&workflow=' + (workflow || '');
      }else {
        location.href = '/DOC/design/index.html#/canvas';
      }
    }

    function open(data) {
      var raw = data.clone();
      var instance = modalService.open({
        size: 'sm',
        templateUrl: 'settings/modules/doc/doc.modal.html',
        data: {
          formData: raw,
          metaData: {
            wards: vm.wards,
            dic: vm.dic
          }
        },
        ok: function() {
          return docRest.editDoc(raw);
        }
      });
      instance.result.then(function() {
        vm.load.func();
      });
    }

    function openDocAdd() {
      modalService.open({
        size: 'md',
        templateUrl: 'settings/modules/doc/add.modal.html',
        data: {
          formData: {},
          metaData: {
            wards: vm.wards,
            apps: vm.apps
          }
        },
        ok: function() {
          var vm = this;

          return createDoc(vm.formData.name, vm.formData.workflow).then(function (response) {
            go(response.tplId, vm.formData.workflow);
          });
        },

        methodsObj: {
          getWorkflows: function () {
            var vm = this;

            getWorkflows(vm.metaData.category).then(function (response) {
              vm.workflows = response.plain();
            });
          }
        }
      });
    }

    function createDoc(tplName, workflow) {
      return docRest.getDocResource().post({
        dataKey: null,
        workflow: workflow,
        tplName: tplName
      });
    }

  }
})();
