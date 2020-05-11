(function() {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($scope, $timeout, authHelperService, workflowRest) {
    var vm = this;
    vm.queryParams = {};
    vm.load = {
      func: loadData
    };
    $scope.$watch('vm.file', function(file) {
      if(file) {
        var fd = new FormData();
        fd.append('file', file)
        workflowRest.postDeploy(fd).then(function() {
          if(vm.apps.length) {
            vm.load.func();
          }
        });
      }
    });

    activate();

    function activate() {
      vm.apps = authHelperService.getInApps();
      if(vm.apps.length) {
        vm.queryParams.category = vm.apps[0].resourceCode;
        $timeout(function() {
          vm.load.func();
        });
      }
    }

    function loadData() {
      return workflowRest.getWorkflows(vm.queryParams.category).then(function(data) {
        vm.list = data;
      });
    }
  }
})();

(function() {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('WorkflowEditController', WorkflowEditController);

  /** @ngInject */
  function WorkflowEditController($state, $stateParams, $timeout, $scope, workflowRest) {
    var vm = this, id = $stateParams.id;

    vm.load = {
      func: loadData
    };

    activate();

    function activate() {
      $timeout(function() {
        vm.load.func();
      });
    }

    function loadData() {
      return workflowRest.getWorkflow(id).then(function(data) {
        vm.data = data;
      });
    }

    $scope.$watch('vm.file', function(file) {
      if(file) {
        var fd = new FormData();
        fd.append('file', file)
        workflowRest.postDeploy(fd).then(function(id) {
          $state.go('main.workflowDetail', {
            id: id
          })
        });
      }
    });
  }
})();

(function() {
  'use strict';

  angular
    .module('lachesis-settings')
    .controller('WorkflowHistoryController', WorkflowHistoryController);

  /** @ngInject */
  function WorkflowHistoryController($stateParams, $q, workflowRest) {
    var vm = this, id = $stateParams.id, key = $stateParams.key;

    vm.load = {
      func: loadData,
      init: true
    };

    activate();

    function activate() {

    }

    function loadData() {
      var dq, hq;
      dq = workflowRest.getWorkflow(id).then(function(data) {
        vm.data = data;
      });
      hq = workflowRest.getHistory(key).then(function(data) {
        vm.history = data;
      });
      return $q.all([dq, hq]);
    }
  }
})();