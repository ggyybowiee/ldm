(function () {
  'use strict';

  angular
    .module('lachesis-mnis')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    if ($stateProvider) {
      window.$stateProvider = $stateProvider;
      window.$urlRouterProvider = $urlRouterProvider;
    }
    $stateProvider
      .state('main', {
        url: '/',
        controller: 'MainController',
        controllerAs: 'vm',
        // abstract: true,
        templateUrl: 'MNIS/modules/main/main.tpl.html',
        resolve: {
          init: function (sessionService) {
            return sessionService.init();
          },
          mnisInit: function (mnisSessionCache) {
            return mnisSessionCache.init();
          }
        }
      })
      .state('main.beds', {
        url: 'beds?inhosCode&patCode&openOuter&wardCode',
        controller: 'BedsController',
        controllerAs: 'vm',
        // abstract: true,
        templateUrl: 'MNIS/modules/patients/beds.tpl.html',
        data: {
          breadcrumb: {
            name: '床位列表'
          }
        }
      })
      .state('main.docs', {
        url: 'docs?inhosCode&patCode&isHis&openOuter&tplId&dataKey&category&wardCode',
        controller: 'DocsController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/docs/docs.list.html',
        data: {
          breadcrumb: {
            name: '{{vm.patient.patName}}',
            super: 'main.beds'
          }
        }
      })
      .state('main.nursingDocConfig', {
        url: 'nursingDocConfig',
        controller: 'NursingDocConfigController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingConfig/nursingDocConfig.tpl.html',
        data: {
          breadcrumb: {
            name: '护理记录单列表'
          }
        }
      })
      .state('main.nursingDocEdit', {
        url: 'nursingDocEdit?id',
        controller: 'NursingDocEditController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingConfig/nursingDocEdit.tpl.html',
        data: {
          breadcrumb: {
            name: '{{vm.data.tplName}}',
            super: 'main.nursingDocConfig'
          }
        }
      })
      .state('main.implPrint', {
        url: 'implPrint',
        controller: 'ImplPrintController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/orders/implPrint.tpl.html',
        data: {
          breadcrumb: {
            name: '瓶签打印'
          }
        }
      })
      .state('main.orders', {
        url: 'orders',
        controller: 'OrdersController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/orders/orders.tpl.html',
        data: {
          breadcrumb: {
            name: '医嘱查看'
          }
        }
      })
      .state('main.estimateConfigForm', {
        url: 'estimateConfigForm?tplId',
        controller: 'EstimateConfigFormController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/estimateConfig/configForm/configForm.tpl.html',
        data: {
          breadcrumb: {
            name: '{{vm.formData.tplName}}',
            super: 'main.estimateConfig'
          }
        }
      })
      .state('main.estimateEdit', {
        url: 'estimateConfigEdit?tplId&patCode&wardCode',
        controller: 'EstimateEditController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/estimateConfig/estimateEdit/estimateEdit.tpl.html',
        data: {
          breadcrumb: {
            name: '评估单录入',
            super: 'main.estimateConfig'
          }
        }
      })
      .state('main.temperatureSheetConfigForm', {
        url: 'temperatureSheetConfigForm',
        controller: 'TemperatureSheetConfigFormController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/temperatureSheetConfig/configForm/configForm.tpl.html',
        data: {
          breadcrumb: {
            name: '体温单配置'
          }
        }
      })
      .state('main.patientMewsScore', {
        url: 'patientMewsScore',
        controller: 'PatientMewsScoreContorller',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/mews/patientMewsScore/patientMewsScore.tpl.html',
        data: {
          breadcrumb: {
            name: '患者评分'
          }
        }
      })
      .state('main.mewsConfig', {
        url: 'mewsConfig',
        controller: 'MEWSConfigController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/mewsConfig/mewsConfig.tpl.html',
        data: {
          breadcrumb: {
            name: 'MEWS评分配置'
          }
        }
      })
      .state('main.eWhiteBoardConfig', {
        url: 'eWhiteBoardConfig',
        controller: 'EWhiteBoardConfigController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/eWhiteBoardConfig/eWhiteBoardConfig.tpl.html',
        data: {
          breadcrumb: {
            name: '电子小白板配置'
          }
        }
      })
      .state('main.riskMonitoring', {
        url: 'riskMonitoring',
        controller: 'RiskMonitoringController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/mews/riskMonitoring/riskMonitoring.tpl.html',
        data: {
          breadcrumb: {
            name: '风险监控配置'
          }
        }
      })
      .state('main.eWhiteBoard', {
        url: 'eWhiteBoard',
        controller: 'EWhiteBoardController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/wardManage/eWhiteBoard/eWhiteBoard.tpl.html',
        data: {
          breadcrumb: {
            name: '电子小白板配置'
          }
        }
      })
      .state('main.nursingGroupConfig', {
        url: 'nursingGroupConfig',
        controller: 'NursingGroupConfigController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/nursingGroupConfig/nursingGroupConfig.tpl.html',
        data: {
          breadcrumb: {
            name: '护理分组配置'
          }
        }
      })
      .state('main.orderSliceConf', {
        url: 'orderSliceConf',
        controller: 'OrderSliceConfController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/orders/config.tpl.html',
        data: {
          breadcrumb: {
            name: '标签拆分配置'
          }
        }
      })
      .state('main.observeItemConfig', {
        url: 'observeItemConfig',
        controller: 'ObserveItemConfig',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/observeItemConfig/observeItemConfig.tpl.html',
        data: {
          breadcrumb: {
            name: '观察项配置'
          }
        }
      })
      .state('main.nursingPathConfig', {
        url: 'nursingPathConfig',
        controller: 'NursingPathConfig',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/nursingPathConfig/nursingPathConfig.tpl.html',
        data: {
          breadcrumb: {
            name: '路径模版设置'
          }
        }
      })
      .state('main.nursingPathConfigSetting', {
        url: 'nursingPathConfigSetting?tplId',
        controller: 'NursingPathConfigSetting',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/configuration/nursingPathConfig/setting/nursingPathConfigSetting.tpl.html',
        data: {
          breadcrumb: {
            name: '路径模版编辑'
          }
        }
      })
      .state('main.nursingPathPatient', {
        url: 'nursingPathPatient',
        controller: 'NursingPathPatient',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingPath/nursingPathPatient/nursingPathPatient.tpl.html',
        data: {
          breadcrumb: {
            name: '路径患者'
          }
        }
      })
      .state('main.nursingHistoryPathPatient', {
        url: 'nursingHistoryPathPatient',
        controller: 'NursingHistoryPathPatient',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingPath/nursingHistoryPathPatient/nursingHistoryPathPatient.tpl.html',
        data: {
          breadcrumb: {
            name: '历史路径患者'
          }
        }
      })
      .state('main.nursingPathFullSenateStatistics', {
        url: 'nursingPathFullSenateStatistics',
        controller: 'NursingPathFullSenateStatistics',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingPath/nursingPathFullSenateStatistics/nursingPathFullSenateStatistics.tpl.html',
        data: {
          breadcrumb: {
            name: '全院统计报表'
          }
        }
      })
      .state('main.nursingPathWardNameStatistics', {
        url: 'nursingPathWardNameStatistics?wardCode&beginTime&endTime',
        controller: 'NursingPathWardNameStatistics',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/nursingPath/nursingPathWardNameStatistics/nursingPathWardNameStatistics.tpl.html',
        data: {
          breadcrumb: {
            name: '科室统计报表'
          }
        }
      })
      .state('main.implRecords', {
        url: 'implRecords',
        controller: 'ImplRecordsController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/orders/implRecords.tpl.html',
        data: {
          breadcrumb: {
            name: '医嘱执行记录'
          }
        }
      })
      .state('main.batchInput', {
        url: 'batchInput',
        controller: 'BatchInputController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/sign/batchInput.tpl.html',
        data: {
          breadcrumb: {
            name: '体征批量录入',
            super: 'main.nursing'
          }
        }
      })
      .state('main.workload', {
        url: 'workload',
        controller: 'WorkloadController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/wardManage/workload.tpl.html',
        data: {
          breadcrumb: {
            name: '工作量统计'
          }
        }
      })
      .state('main.whiteboard', {
        url: 'whiteboard',
        controller: 'WhiteboardController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/wardManage/whiteboard/whiteboard.tpl.html',
        data: {
          breadcrumb: {
            name: '小白板'
          }
        }
      })
      .state('main.handovermanagement', {
        url: 'handovermanagement',
        controller: 'HandoverManagementController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/wardManage/handoverManagement/handoverManagement.tpl.html',
        data: {
          breadcrumb: {
            name: '交班管理'
          }
        }
      })
      .state('main.device', {
        url: 'device',
        controller: 'DeviceController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/wardManage/device.tpl.html',
        data: {
          breadcrumb: {
            name: '腕带&床头卡'
          }
        }
      })
      .state('main.orderPaper', {
        url: 'orderPaper',
        controller: 'OrderPaperController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/orderPaper.tpl.html',
        data: {
          breadcrumb: {
            name: '医嘱执行单'
          }
        }
      })
      .state('main.transPaper', {
        url: 'transPaper',
        controller: 'TransPaperController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/transPaper.tpl.html',
        data: {
          breadcrumb: {
            name: '输液单'
          }
        }
      })
      .state('main.transTourPaper', {
        url: 'transTourPaper',
        controller: 'TransTourPaperController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/transTourPaper.tpl.html',
        data: {
          breadcrumb: {
            name: '输液巡视单'
          }
        }
      })
      .state('main.dosageRecords', {
        url: 'dosageRecords',
        controller: 'DosageRecordsController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/dosageRecords.tpl.html',
        data: {
          breadcrumb: {
            name: '医嘱配药记录'
          }
        }
      })
      .state('main.wardTourPaper', {
        url: 'wardTourPaper',
        controller: 'WardTourPaperController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/wardTourPaper.tpl.html',
        data: {
          breadcrumb: {
            name: '病房巡视单'
          }
        }
      })
      .state('main.skinTestPaper', {
        url: 'skinTestPaper',
        controller: 'SkinTestPaperController',
        controllerAs: 'vm',
        templateUrl: 'MNIS/modules/paper/skinTestPaper.tpl.html',
        data: {
          breadcrumb: {
            name: '皮试单'
          }
        }
      })
      .state('main.examLabel', {
        url: 'examLabel',
        templateUrl: 'MNIS/modules/examLabel/examLabel.html',
        controller: 'ExamController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '检查报告'
          }
        }
      })
      .state('main.testLabel', {
        url: 'testLabel',
        templateUrl: 'MNIS/modules/testLabel/testLabel.html',
        controller: 'TestController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '检验报告'
          }
        }
      })
      .state('main.crisisValue', {
        url: 'crisisValue',
        templateUrl: 'MNIS/modules/crisisValue/crisisValue.html',
        controller: 'CrisisValue',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '危急值'
          }
        }
      })
      .state('main.taskRemindConfig', {
        url: 'taskRemindConfig',
        templateUrl: 'MNIS/modules/taskRemindConfig/taskRemindConfig.html',
        controller: 'TaskRemindConfigController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '规则配置'
          }
        }
      })
      .state('main.taskRemindPaper', {
        url: 'taskRemindPaper',
        templateUrl: 'MNIS/modules/taskRemindPaper/taskRemindPaper.html',
        controller: 'TaskRemindPaperController',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '任务清单'
          }
        }
      })
      .state('main.batchVitalsignInputConfig', {
        url: 'batchVitalsignInputConfig',
        templateUrl: 'MNIS/modules/configuration/batchVitalsignInputConfig/batchVitalsignInputConfig.tpl.html',
        controller: 'batchVitalsignInputConfig',
        controllerAs: 'vm',
        data: {
          breadcrumb: {
            name: '批量体征录入配置'
          }
        }
      })
    
    ;
    $urlRouterProvider.otherwise('/');
  }
})();
