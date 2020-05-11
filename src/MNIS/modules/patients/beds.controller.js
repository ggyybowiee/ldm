(function () {
  "use strict";

  angular.module("lachesis-mnis").controller("BedsController", BedsController);

  /** @ngInject */
  function BedsController(
    $q,
    $scope,
    $state,
    sessionService,
    nursingRest,
    _,
    mewsService,
    $timeout,
    modalService,
    nursingPathRest,
    moment
  ) {
    var vm = this,
      profile = sessionService.getProfile();

    var configHelper = sessionService.getConfHelper();
    vm.conf = configHelper.conf;
    vm.MEWSPathOnBedList = _.get(vm.conf, ['MEWSPathOnBedList', 'configValue']);
    vm.MEWSPathOnBedList = (vm.MEWSPathOnBedList && vm.MEWSPathOnBedList == '1') ? 1 : 0;

    var exitList = sessionService.getDicHelper().dic.exitPathReason;

    activate();

    function activate() {
      vm.load = {
        func: loadData
      };
      vm.goDoc = goDoc;
      vm.params = {};
      vm.filter = {
        type: 1,
        cate: 0,
        text: ""
      };
      vm.toggleFocus = toggleFocus;
      vm.balanceFilter = balanceFilter;
      vm.calcPosition = calcPosition;
      vm.text = "";
      vm.syncPatientInfo = syncPatientInfo;
      vm.bedCodeShortCut = bedCodeShortCut;
      vm.accordion = {
        'ward': true,
        'device': true
      }
      vm.mewsAlertLevelDic = mewsService.getMewsAlertLevelDic();

      var watcher = $scope.$watch("vm.filter.cate", function () {
        vm.load.func();
      });
      $scope.$on("$destroy", watcher);

      vm.pathList = [];
      vm.outHosPatients = [];
      vm.surgeryPatients = [];
      getWhiteBoardConfig();
      $timeout(function () {
        vm.load.func();
      });
    }

    vm.contextMenuConfig = [
      [
        "出路径",
        function ($rowScope, $event) {
          // console.info($rowScope, $event);
          initModal($rowScope.row, "out");
        },
        function ($rowScope) {
          if ($rowScope.row.pathStatus === 1) {
            return true;
          } else if ($rowScope.row.pathStatus === 2) {
            return false;
          }
          return false;
        }
      ],
      [
        "入路径",
        function ($rowScope, $event) {
          // console.info($rowScope.$index, $event);
          initModal($rowScope.row, "in");
        },
        function ($rowScope) {
          if ($rowScope.row.pathStatus === 1) {
            return false;
          } else if ($rowScope.row.pathStatus === 2) {
            return false;
          }
          return true;
        }
      ]
    ];

    function getWhiteBoardConfig() {
      return nursingRest.getWhiteBoardConfig().customGET('', {
        wardCode: profile.wardCode
      }).then(function (response) {
        if (!_.get(response, "config")) {
          return;
        }
        var data = response.config;
        // vm.whiteBoardData = data;
        vm.whiteBoardData = data.leftSideConfig;
        vm.basicConfig = data.basicConfig;
      });
    }

    function bedCodeShortCut(bedCode) {
      var regString = vm.basicConfig.bedCodeRegex;
      if (regString == undefined) return bedCode;

      var reg = new RegExp(regString);
      if (reg.test(bedCode)) {
        var result = bedCode.match(reg);
        return result[0];
      } else {
        return "";
      }
    }

    function initModal(row, type) {
      // 出路径
      if (type === "out") {
        row.outPathDate = moment().format("YYYY-MM-DD");

        nursingRest
          .getPatientPath({
            inhosCode: row.inhosCode
          })
          .then(function (data) {
            row.pathName = data.pathName;
            row.enterDate = data.enterDate;

            modalService.open({
              size: "md",
              templateUrl: "MNIS/modules/patients/beds.outPath.modal.html",
              data: {
                formData: row,
                metaData: {
                  exitList: exitList
                }
              },
              ok: function (data) {
                var tempExitReason = _.find(exitList, function (item) {
                  return item.dicCode === data.exitReasonCode;
                });
                var params = {
                  exitDate: data.outPathDate,
                  exitReasonCode: data.exitReasonCode,
                  inhosCode: data.inhosCode,
                  exitReason: tempExitReason.dicName,
                  remark: data.remark || ""
                };
                var currentDay = moment().format("YYYY-MM-DD");
                if (!data.outPathDate) {
                  $scope.$emit("toast", {
                    type: "warning",
                    content: "出径日期不能为空"
                  });
                  return false;
                }
                if (
                  new Date(data.outPathDate).getTime() >
                  new Date(currentDay).getTime()
                ) {
                  $scope.$emit("toast", {
                    type: "warning",
                    content: "出径日期不能大于当天日期"
                  });
                  return false;
                }
                if (
                  new Date(data.outPathDate).getTime() <
                  new Date(row.enterDate).getTime()
                ) {
                  $scope.$emit("toast", {
                    type: "warning",
                    content: "出径日期必须大于等于入径日期"
                  });
                  return false;
                }
                return nursingRest.patientPathExit(params).then(function () {
                  loadData();
                });
              }
            });
          });
      } else if (type === "in") {
        // 入路径
        row.inPathDate = moment().format("YYYY-MM-DD");
        row.pathTplId = "";
        modalService.open({
          size: "md",
          templateUrl: "MNIS/modules/patients/beds.inPath.modal.html",
          data: {
            formData: row,
            metaData: {
              pathList: vm.pathList,
              specialItems: [],
              headerForm: {}
            }
          },
          ok: function (data) {
            var that = this;
            var params = {
              enterDate: data.inPathDate,
              inhosCode: data.inhosCode,
              pathTplId: data.pathTplId,
              specialItems: that.metaData.headerForm
            };
            var currentDay = moment().format("YYYY-MM-DD");
            if (!data.inPathDate) {
              $scope.$emit("toast", {
                type: "warning",
                content: "路径日期不能为空"
              });
              return false;
            }
            if (
              new Date(data.inPathDate).getTime() >
              new Date(currentDay).getTime()
            ) {
              $scope.$emit("toast", {
                type: "warning",
                content: "路径日期不能大于当天日期"
              });
              return false;
            }
            return nursingRest.patientPathEnter(params).then(function () {
              loadData();
            });
          },
          methodsObj: {
            pathChange: function (value) {
              var that = this;
              var obj = _.find(vm.pathList, function (item) {
                return item.pathTplId === value;
              });
              that.metaData.specialItems = (obj && obj.specialItems) || [];
            }
          }
        });
      }
    }

    function loadData() {
      var rq = undefined,
        bq = undefined,
        fq = undefined,
        pq = undefined,
        oq = undefined,
        sq = undefined;
      
      if (vm.filter.cate == 0) {
        rq = nursingRest
          .getInhosRecords(profile.wardCode, vm.params)
          .then(function (data) {
            vm.list = data;
            var mewsAlertPatient = [],
              nursingPathPatient = [],
              ILevelNursingPatient = [],
              IILevelNursingPatient = [],
              criticalNursingPatient = [],
              severeNursingPatient = [],
              specialNursingPatient = [],
              newPathPatient = [];

            _.forEach(vm.list, function (patient) {

              if (patient.mewsRecord) {
                if (patient.mewsRecord && patient.mewsRecord.alertLevel > 0) {
                  mewsAlertPatient.push(patient);
                }
              }

              if (patient.pathStatus) {
                nursingPathPatient.push(patient);
              }

              if (patient.nurseLevel == '1') {
                ILevelNursingPatient.push(patient);

              } else if (patient.nurseLevel == '2') {
                IILevelNursingPatient.push(patient);

              } else if (patient.nurseLevel == '0') {
                specialNursingPatient.push(patient);

              }
              if (patient.dangerLevel == 'S') {
                criticalNursingPatient.push(patient);

              }
              if (patient.dangerLevel == 'D') {
                severeNursingPatient.push(patient);

              }

              if (moment(patient.inDate).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD')) {
                newPathPatient.push(patient);
              }

            });
            vm.mewsAlertPatient = mewsAlertPatient;
            vm.nursingPathPatient = nursingPathPatient;
            vm.ILevelNursingPatient = ILevelNursingPatient;
            vm.IILevelNursingPatient = IILevelNursingPatient;
            vm.criticalNursingPatient = criticalNursingPatient;
            vm.severeNursingPatient = severeNursingPatient;
            vm.specialNursingPatient = specialNursingPatient;
            vm.newPathPatient = newPathPatient;

            return data;
          });
      } else {
        fq = nursingRest
          .getInhosRecordsByTeamCode(profile.wardCode)
          .then(function (data) {
            vm.myGroupList = data;
            return data;
          });
      }

      bq = nursingRest.getBedsList(profile.wardCode).then(function (data) {
        vm.beds = data;
        return data;
      });

      pq = nursingPathRest
        .getNursingPathConfigByWardCode({
          wardCode: profile.wardCode,
          status: 1
        })
        .then(function (data) {
          vm.pathList = data.queryResult || [];
        });

      oq = nursingRest.getHisRecords({
        wardCode: profile.wardCode,
        beginTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD')
      }).then(function (data) {
        vm.outHosPatients = _.get(data, 'queryResult') || [];
        return _.get(data, 'queryResult') || [];
      });

      sq = nursingRest.getSurgeryRecords(profile.wardCode, {
        beginTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD')
      }).then(function (data) {
        vm.surgeryPatients = data;
        return data;
      });

      return $q.all([rq, bq, fq, pq, oq, sq]);
    }

    function balanceFilter(item) {
      return item.balance < 0;
    }

    function goDoc(row) {
      $state.go("main.docs", {
        inhosCode: row.inhosCode,
        patCode: row.patCode
      });
    }

    function toggleFocus(data) {
      if (data.focus) {
        nursingRest.removeFocusBed(data.focus).then(function () {
          data.focus = false;
        });
      } else {
        nursingRest
          .createFocusBed({
            bedCode: data.bedCode,
            userCode: profile.userCode,
            wardCode: data.wardCode
          })
          .then(function (rst) {
            data.focus = rst[0].seqId;
          });
      }
    }

    vm.patientFilter = function (item) {
      if (item.bedCode.indexOf(vm.filter.text) != -1) return true;

      if (item.patName.indexOf(vm.filter.text) != -1) return true;

      if (_.startsWith(item.displayCode, vm.filter.text)) return true;

      return false;
    };

    vm.bedCodeOrder = function (item) {
      // return -item.length;
      
    }

    function calcPosition(i) {
      if (i % 5 !== 4) {
        return "right";
      } else {
        return "left";
      }
    }

    function syncPatientInfo() {
      vm.syncing = true;
      return nursingRest
        .syncInhosRecords(profile.wardCode)
        .then(function (response) {
          vm.syncing = false;
          if (response.result === "fail") {
            $scope.$emit("toast", {
              type: "warning",
              content: "同步失败！请稍后重试"
            });

            return;
          }

          $scope.$emit("toast", {
            type: "success",
            content: "同步成功！"
          });
        })
        .catch(function () {
          vm.syncing = false;
        })
        .then(loadData);
    }
  }
})();
