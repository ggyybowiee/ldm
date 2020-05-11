(function() {
  'use strict';

  angular
    .module('lachesis-mnis')
    .controller('TaskRemindConfigController', TaskRemindConfigController);

  /** @ngInject */
  function TaskRemindConfigController($scope, modalService, nursingRest, taskRemindRest, sessionService, _) {

    $scope.taskRemindConfig = {
      list: [],
      pageNum: 1,
      size: 10
    };

    // 规则类型
    $scope.ruleType = {
      'vitalSign': '体征',
      'evaluate': '评估'
    };

    // 周期类型
    $scope.periodType = {
      'C': '连续',
      'D': '当天',
      'Q': '持续'
    };

    $scope.params = {
      wardCode: sessionService.getProfile().wardCode,
      num: 20,
      offset: 0,
      countAll: true
    };

    $scope.pageItem = {
      maxSize: 10,
      totalItems: 0,
      count: '20',
      page: 1
    }

    // 关联事件字典
    var eventTypeList = sessionService.getDicHelper().dic.taskRemindEvent;
    // 规则类型为 vitalSign 的关联项目
    var bindItemWithVitalSign = sessionService.getDicHelper().dic.vitalItem;
    var evaluateNature = sessionService.getDicHelper().dic.evaluateNature;
    bindItemWithVitalSign = bindItemWithVitalSign.concat(evaluateNature);
    // 规则为 evaluate 的关联项目
    var bindItemWithEvaluate = [];

    // 体温配置时间间隔
    var vitalConfigInterval = '';

    function loadData() {
      taskRemindRest.getTaskRemindConfigList($scope.params).then(function (res) {
        var data = res.queryResult;
        _.map(data, function (item, index) {
          var tempEventType = _.filter(eventTypeList, function (data) {
            return item.eventType === data.dicCode;
          });
          item.eventName = _.get(tempEventType, '[0].dicName') || null;

          if (item.ruleType === 'vitalSign') {
            var tempVitalSign = _.filter(bindItemWithVitalSign, function (data) {
              return item.bindItem === data.dicCode;
            });
            item.bindItemName = _.get(tempVitalSign, '[0].dicName') || null;
          } else {
            var tempEvaluate = _.filter(bindItemWithEvaluate, function (data) {
              return item.bindItem === data.tplId;
            });
            item.bindItemName = _.get(tempEvaluate, '[0].tplName') || null;
          }
        });
        $scope.taskRemindConfig.list = data;
        $scope.pageItem.totalItems = res.totalCnt;
      });
    }

    $scope.queryList = function(page) {
      $scope.params.num = +$scope.pageItem.count;
      $scope.params.offset = (page - 1) * $scope.params.num;
      loadData();
    }

    function loadBindItemWithEvaluate() {
      nursingRest.getNursingDocs({
        wardCode: sessionService.getProfile().wardCode,
        category: 'hlpgd'
      }).then(function (data) {
        bindItemWithEvaluate = data;
        loadData();
      });
    }

    getVitalConfig();
    loadBindItemWithEvaluate();

    function getVitalConfig() {
      taskRemindRest.getVitalConfig({
        wardCode: sessionService.getProfile().wardCode
      }).then(function (data) {
        vitalConfigInterval = data.config.timesInterval;
      });
    }

    $scope.open = function(data) {
      var raw = data ? data : {
        ruleType: 'vitalSign',
        ruleName: '',
        ageMin: 0,
        ageMax: 0,
        eventType: '',
        bindItem: '',
        periodType: '',
        duration: 0,
        interval: 0,
        cycleTime: 1,
        measureTimes: '',
        ruleValue: '',
        content: ''
      };
      raw.longTerm = data ? ('' + data.longTerm) : '0'

      var instance = modalService.open({
        size: 'md',
        templateUrl: 'MNIS/modules/taskRemindConfig/taskRemindConfig.modal.html',
        data: {
          formData: raw
        },
        ok: function () {
          var omit = _.omit(raw, ['bindItemName', 'eventName']);
          omit.wardCode = sessionService.getProfile().wardCode;
          omit.longTerm = +omit.longTerm;
          omit.measureTimes = '';
          _.map(this.measureTimes, function (item, index) {
            if (item.selected) {
              omit.measureTimes += item.value + ',';
            }
          })
          omit.measureTimes = omit.measureTimes.substr(0, omit.measureTimes.length - 1);

          if (omit.id) {
            taskRemindRest.updateTaskRemindRest(
              omit.id,
              omit
            ).then(function () {
              $scope.$emit('toast', {
                type: 'success',
                content: '编辑成功'
              })
              loadData();
              modalService.close();
            });
          } else {
            taskRemindRest.addTaskRemindRest(
              omit
            ).then(function () {
              $scope.$emit('toast', {
                type: 'success',
                content: '添加成功'
              })
              loadData();
              modalService.close();
            });
          }
        },
        initFn: function (params) {
          var modal = this;
          modal.type = data ? '编辑' : '添加';
          modal.ruleType = $scope.ruleType;

          if (data) {
            modal.bindItem = data.ruleType === 'vitalSign' ? bindItemWithVitalSign : bindItemWithEvaluate;
          } else {
            modal.bindItem = bindItemWithVitalSign;
          }
          
          modal.eventType = eventTypeList;
          modal.periodType = $scope.periodType;
          modal.longTerm = {
            1: '长期',
            0: '临时'
          };
          modal.measureTimes = [];
          _.map(vitalConfigInterval.split(','), function (i) {
            var temp = {
              value: i,
              selected: false
            }
            modal.measureTimes.push(temp);
          })

          if (data) {
            _.map(modal.measureTimes, function (item) {
              _.map(data.measureTimes.split(","), function (i){
                if (item.value === i) {
                  item.selected = true;
                }
              });
            });
          }

          modal.ruleTypeChange = function(type) {
            modal.bindItem = type === 'vitalSign' ? bindItemWithVitalSign : bindItemWithEvaluate;
          };

          modal.measureTimesPress = function (item) {
            item.selected = !item.selected;
          };
        }
      });
      instance.result.then(function() {
        loadData();
      });
    }

    $scope.del = function(data) {
      taskRemindRest.deleteTaskRemindConfig(
        data.id
      ).then(function (data) {
        $scope.$emit('toast', {
          type: 'success',
          content: '删除成功'
        })
        if ($scope.taskRemindConfig.list.length === 1) {
          $scope.params.num = +$scope.pageItem.count;
          $scope.pageItem.page--;
          $scope.params.offset = ($scope.pageItem.page - 1) * $scope.params.num;
        }
        loadData();
        modalService.close();
      })
    }
  }
})();

