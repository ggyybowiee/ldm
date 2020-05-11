(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('NursingDocConfigController', NursingDocConfigController)
    .filter('edityType', function () {
      return function (category) {
        if (category == "hljld") {
          return "护理记录单"
        }

        if (category == "hlpgd") {
          return "护理评估单"
        }

        return "其它";
      }
    });

  /** @ngInject */
  function NursingDocConfigController($scope, $state, hospitalRest, sessionService, modalService, nursingRest, _) {
    var vm = this;

    vm.load = {
      func: loadData,
      init: true
    }
    vm.open = open;
    vm.del = del;
    vm.goEditDoc = goEditDoc;

    var dicHelper = sessionService.getDicHelper();
    vm.dic = dicHelper.dic;

    activate();

    function activate() {
      vm.attendShowCategoryDic = {};
      for (var i = 0; i < vm.dic.attendShowCategory.length; i++) {
        vm.attendShowCategoryDic[vm.dic.attendShowCategory[i].dicCode] = vm.dic.attendShowCategory[i];
      }
    }

    function open(data) {

      var raw = data ? data.clone() : {

        wardCodes: [],
        category: 'hljld',
        size: '297,210',
        rowNum: 24,
        orientation: 'horizon',
        margin: {
          top: 5,
          right: 5,
          left: 5,
          bottom: 5
        },
        lineHeight: 26
      };

      /*if (typeof raw.tplIdVisible === 'undefined') {
        raw.showTplIdVisible = true;
      }*/
      var dataRaw = {};
      dataRaw.raw = raw;
      dataRaw.dic = vm.dic;
      var instance = modalService.open({
        size: 'lg',
        templateUrl: 'MNIS/modules/nursingConfig/nursingDocConfig.modal.html',
        data: {
          formData: dataRaw
        },
        ok: function () {
          return nursingRest.updateNursingDocs(raw);
        },
        methodsObj: {
          sizes: nursingRest.sizeDic
        }
      });
      instance.result.then(function () {
        vm.load.func();
      });
    }

    function del(data) {
      return data.remove().then(function () {
        vm.load.func();
      });
    }

    function goEditDoc(data) {

      if (data.category == 'hljld') {
        $state.go('main.nursingDocEdit', {
          id: data.tplId
        });
      } else if (data.category == 'hlpgd') {
        $state.go('main.estimateConfigForm', {
          tplId: data.tplId
        });
      } else {
        $scope.$emit("toast", {
          type: 'error',
          content: '文书未指定编辑器，不能进入编辑'
        });
      }
    }

    function loadData() {
      return nursingRest.getNursingDocs({
        wardCode: "",
        category: ""
      }).then(function (data) {

        vm.list = data;
        vm.selectCategory = "";
        vm.filterText = "";
      });
    }
  }
})();

(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('NursingDocEditController', NursingDocEditController);

  /** @ngInject */
  function NursingDocEditController($scope, $stateParams, $rootScope, nursingRest) {
    var vm = this,
      did = $stateParams.id;

    activate();

    function activate() {
      vm.load = {
        func: loadData,
        init: true
      };
      vm.content = [{}];
      vm.save = save;
    }

    function loadData() {
      return nursingRest.getNursingDoc(did).then(function (data) {
        data.components || (data.components = []);
        vm.data = data;
        // console.log(data.wardCodes)
      });
    }

    $scope.$watch('vm.data', function (newValue) {

      if (newValue) {
        vm.previewSheet = _.assign({}, newValue, {
          rows: _.map(new Array(+vm.data.rowNum), function (val, index) {
            return index;
          })
        });
      }
    });

    function save() {
      
      delete vm.data.wardCode;
      nursingRest.updateNursingDocs(vm.data).then(function () {
        $rootScope.$broadcast('toast', '保存成功');
      });
    }
  }
})();
