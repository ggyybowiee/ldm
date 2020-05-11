(function() {
  'use strict';

  angular.module('lachesis-ldm').config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider.state('main', {
      url: '/',
      controller: 'MainController',
      controllerAs: 'vm',
      templateUrl: 'LDM/modules/main/main.tpl.html',
      // abstract: true,
      resolve: {
        init: function(sessionService) {
          return sessionService.init();
        }
      },
      data: {
        breadcrumb: {
          name: '首页'
        }
      }
    })
    .state('main.deviceOverview', {
      url: 'deviceOverview',
      templateUrl: 'LDM/modules/deviceManagement/deviceOverview/deviceOverview.tpl.html',
      controller: 'LDMDeviceOverviewController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备一览',
          super: 'main'
        }
      }
    })
    .state('main.deviceInfoManager', {
      url: 'deviceInfoManager',
      templateUrl: 'LDM/modules/deviceManagement/deviceInfoManager/deviceInfoManager.tpl.html',
      controller: 'LDMDeviceInfoManagerController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备信息管理',
          super: 'main'
        }
      }
    })
    .state('main.deviceMonitoring', {
      url: 'deviceMonitoring',
      templateUrl: 'LDM/modules/deviceManagement/deviceMonitoring/deviceMonitoring.tpl.html',
      controller: 'LDMDeviceMonitoringController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备运行监控',
          super: 'main'
        }
      }
    })
    .state('main.deviceRunningDetail', {
      url: 'deviceRunningDetail',
      templateUrl: 'LDM/modules/deviceManagement/deviceMonitoring/deviceRunningDetail.tpl.html',
      controller: 'LDMDeviceRunningDetailController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备运行详情',
          super: 'main'
        }
      }
    })
    // .state('main.devInfoMapping', {
    //   url: 'devInfoMapping',
    //   templateUrl: 'LDM/modules/devInfoMapping/devInfoMapping.tpl.html',
    //   controller: 'LDMdevInfoMappingController',
    //   controllerAs: 'vm',
    //   data: {
    //     breadcrumb: {
    //       name: '设备运行监控'
    //     }
    //   }
    // })
    .state("main.deviceAppManager", {
        url: "deviceAppManager",
        templateUrl: "LDM/modules/deviceAppManager/deviceAppManager.tpl.html",
        controller: "DeviceAppManagerController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "软件管理",
            super: 'main'
          }
        }
      })
      .state("main.deviceAppDistribution", {
        url: "deviceAppDistribution",
        templateUrl: "LDM/modules/deviceAppManager/AppDistribution/deviceAppDistribution.tpl.html",
        controller: "DeviceAppDistributionController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "软件推送",
            super: 'main'
          }
        }
      })
      .state("main.deviceAppDistributionRecord", {
        url: "deviceAppDistributionRecord",
        templateUrl: "LDM/modules/deviceAppManager/AppRecord/deviceAppDistributionRecord.tpl.html",
        controller: "DeviceAppDistributionRecordController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "软件分发记录",
            super: 'main'
          }
        }
      })
      .state("main.OTAManagement", {
        url: "OTAManagement",
        templateUrl: "LDM/modules/deviceAppManager/OTAManagement/OTAManagement.tpl.html",
        controller: "OTAManagementController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "OTA管理",
            super: 'main'
          }
        }
      })
      .state("main.OTADistribution", {
        url: "OTADistribution",
        templateUrl: "LDM/modules/deviceAppManager/OTADistribution/OTADistribution.tpl.html",
        controller: "OTADistributionController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "OTA推送",
            super: 'main'
          }
        }
      })
      .state("main.OTADistributionRecord", {
        url: "OTADistributionRecord",
        templateUrl: "LDM/modules/deviceAppManager/OTARecord/OTADistributionRecord.tpl.html",
        controller: "OTADistributionRecordController",
        controllerAs: "vm",
        data: {
          breadcrumb: {
            name: "OTA记录",
            super: 'main'
          }
        }
      })
    .state('main.analysis', {
      url: 'analysis',
      templateUrl: 'LDM/modules/analysis/usageRate/usageRate.html',
      controller: 'usageRateController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备使用率统计',
          super: 'main'
        }
      }
    })
    .state('main.usageRate', {
      url: 'usageRate',
      templateUrl: 'LDM/modules/analysis/usageRate/usageRate.html',
      controller: 'UsageRateController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备使用率统计',
          super: 'main'
        }
      }
    })
    .state('main.ipAnalysis', {
      url: 'ipAnalysis',
      templateUrl: 'LDM/modules/analysis/ipConficatAnalysis/ipConficatAnalysis.html',
      controller: 'IpConficatAnalysisController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备IP冲突分析',
          super: 'main'
        }
      }
    })
    // .state('main.blueBridgeCount', {
    //   url: 'blueBridgeCount',
    //   templateUrl: 'LDM/modules/analysis/blueBridgeCount/blueBridgeCount.html',
    //   controller: 'BlueBridgeCountController',
    //   controllerAs: 'vm',
    //   data: {
    //     breadcrumb: {
    //       name: '蓝桥实时接入设备统计'
    //     }
    //   }
    // })
    // .state('main.blueBridgeCount.blueBridgeCountTable', {
    //   url: 'blueBridgeCountTable',
    //   templateUrl: 'LDM/modules/analysis/blueBridgeCount/dataTableSchema/blueBridgeCountTable.html',
    //   controller: 'BlueBridgeCountDataTableController',
    //   controllerAs: 'vm',
    //   data: {
    //     breadcrumb: {
    //       name: '蓝桥实时接入设备统计'
    //     }
    //   }
    // })
    .state('main.blueBridgeCount', {
      url: 'blueBridgeCountTable',
      templateUrl: 'LDM/modules/analysis/blueBridgeCount/dataTableSchema/blueBridgeCountTable.html',
      controller: 'BlueBridgeCountDataTableController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '蓝桥实时接入设备统计',
          super: 'main'
        }
      }
    })
    .state('main.blueBridgeCount.wardBlueBridgeCount', {
      url: 'wardBlueBridgeCount?wardCode',
      templateUrl: 'LDM/modules/analysis/blueBridgeCount/wardBlueBridgeCount.html',
      controller: 'WardBlueBridgeCountController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '蓝桥实时接入设备统计',
          super: 'main'
        }
      }
    })
    // .state('main.APCount', {
    //   url: 'APCount',
    //   templateUrl: 'LDM/modules/analysis/APCount/APCount.html',
    //   controller: 'APCountController',
    //   controllerAs: 'vm',
    //   data: {
    //     breadcrumb: {
    //       name: 'AP实时接入设备统计'
    //     }
    //   }
    // })
    // .state('main.APCount.APCountDataTable', {
    //   url: 'APCountDataTable',
    //   templateUrl: 'LDM/modules/analysis/APCount/dataTableSchema/APCountDataTable.html',
    //   controller: 'APCountDataTableController',
    //   controllerAs: 'vm',
    //   data: {
    //     breadcrumb: {
    //       name: 'AP实时接入设备统计'
    //     }
    //   }
    // })
    .state('main.APCount', {
      url: 'APCountDataTable',
      templateUrl: 'LDM/modules/analysis/APCount/dataTableSchema/APCountDataTable.html',
      controller: 'APCountDataTableController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: 'AP实时接入设备统计',
          super: 'main'
        }
      }
    })
    .state('main.APCount.wardAPCount', {
      url: 'wardAPCountTable',
      templateUrl: 'LDM/modules/analysis/APCount/wardAPCount.html',
      controller: 'WardAPCountController',
      controllerAs: 'vm',
      params: {'code': ''},
      data: {
        breadcrumb: {
          name: 'AP实时接入设备统计',
          super: 'main'
        }
      }
    })
    .state('main.NDASwitchgear', {
      url: 'NDASwitchgear',
      templateUrl: 'LDM/modules/analysis/NDASwitchgear/NDASwitchgear.html',
      controller: 'NDASwitchgearController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: 'NDA开关机统计',
          super: 'main'
        }
      }
    })
    .state('main.batteryUse', {
      url: 'batteryUse',
      templateUrl: 'LDM/modules/analysis/batteryUse/batteryUse.html',
      controller: 'BatteryUseController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备电池使用统计',
          super: 'main'
        }
      }
    })
    .state('main.platfromTools', {
      url: 'platfromTools',
      templateUrl: 'LDM/modules/analysis/platfromTools/platfromTools.html',
      controller: 'PlatfromToolsController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '平台工具',
          super: 'main'
        }
      }
    })
    .state('main.layoutEquipment', {
      url: 'layoutEquipment',
      templateUrl: 'LDM/modules/layoutEquipment/layoutEquipment.html',
      controller: 'layoutEquipmentController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '设备配置',
          super: 'main'
        }
      }
    })
    .state('main.NDAconfig', {
      url: 'NDAconfig',
      templateUrl: 'LDM/modules/layoutEquipment/NDAconfig/NDAconfig.html',
      controller: 'NDAconfigurationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: 'NDA配置',
          super: 'main'
        }
      }
    })
    .state('main.newNDAconfig', {
      url: 'newNDAconfig',
      templateUrl: 'LDM/modules/layoutEquipment/NDAconfig/newNDAconfig.html',
      controller: 'NewNDAconfigurationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '添加NDA配置',
          super: 'main'
        }
      }
    })
    .state('main.editNDAconfig', {
      url: 'editNDAconfig/:id',
      templateUrl: 'LDM/modules/layoutEquipment/NDAconfig/newNDAconfig.html',
      controller: 'NewNDAconfigurationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '编辑NDA配置',
          super: 'main'
        }
      }
    })
    .state('main.NDAconfigRecord', {
      url: 'NDAconfigRecord',
      templateUrl: 'LDM/modules/layoutEquipment/NDAconfigRecord/NDAconfigRecord.html',
      controller: 'NDAconfigRecordController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: 'NDA配置记录',
          super: 'main'
        }
      }
    })
    .state('main.NDAconfigRemoteManagement', {
      url: 'NDAconfigRemoteManagement',
      templateUrl: 'LDM/modules/layoutEquipment/NDAconfigRemoteManagement/NDAconfigRemoteManagement.html',
      controller: 'NDAconfigRemoteManagementController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: 'NDA远程管理',
          super: 'main'
        }
      }
    })
    .state('main.bridgeConfig', {
      url: 'bridgeConfig',
      templateUrl: 'LDM/modules/layoutEquipment/bridgeConfig/bridgeConfig.html',
      controller: 'BridgeConfigController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '蓝桥配置',
          super: 'main'
        }
      }
    })
    .state('main.newBridgeconfig', {
      url: 'newBridgeconfig',
      templateUrl: 'LDM/modules/layoutEquipment/bridgeConfig/newBridgeconfig.html',
      controller: 'NewBridgeConfigurationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '添加蓝桥配置',
          super: 'main'
        }
      }
    })
    .state('main.editBridgeconfig', {
      url: 'editBridgeconfig/:id',
      templateUrl: 'LDM/modules/layoutEquipment/bridgeConfig/newBridgeconfig.html',
      controller: 'NewBridgeConfigurationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '编辑蓝桥配置',
          super: 'main'
        }
      }
    })
    .state('main.bridgeConfigRecord', {
      url: 'bridgeConfigRecord',
      templateUrl: 'LDM/modules/layoutEquipment/bridgeConfigRecord/bridgeConfigRecord.html',
      controller: 'BridgeConfigRecordController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '蓝桥配置记录',
          super: 'main'
        }
      }
    })
    .state('main.blueBridgeMap', {
      url: 'blueBridgeMap?building&level&src',
      templateUrl: 'LDM/modules/layoutEquipment/bridgeMapConfig/blueBridgeMap.tpl.html',
      controller: 'BlueBridgeMapController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '蓝桥地图配置',
          super: 'main'
        }
      }
    })
    .state('main.notification', {
      url: 'notification',
      templateUrl: 'LDM/modules/notification/notification.html',
      controller: 'NotificationController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '消息推送',
          super: 'main'
        }
      }
    })
    .state('main.notificationRecord', {
      url: 'notificationRecord',
      templateUrl: 'LDM/modules/notification/notificationRecord/notificationRecord.tpl.html',
      controller: 'NotificationRecordController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '推送记录',
          super: 'main'
        }
      }
    })
    .state('main.remindSetting', {
      url: 'remindSetting',
      templateUrl: 'LDM/modules/systemSetting/remindSetting.html',
      controller: 'remindSettingController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '系统设置',
          super: 'main'
        }
      }
    })
    .state('main.dataUpload', {
      url: 'dataUpload',
      templateUrl: 'LDM/modules/dataManagement/dataUpload/dataUpload.html',
      controller: 'DataUploadController',
      controllerAs: 'vm',
      data: {
        breadcrumb: {
          name: '数据包上传',
          super: 'main'
        }
      }
    });
    $urlRouterProvider.otherwise('/');
    // $urlRouterProvider.when('/', '/deviceMonitoring');
  }
})();
