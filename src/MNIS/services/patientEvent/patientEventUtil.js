(function () {
  'use strict';

  angular.module('lachesis-mnis').factory('patientEventUtil', patientEventUtil);


  /** @ngInject */
  function patientEventUtil(moment, _, modalService, sessionService) {

    var eventTypes = _.map(sessionService.getDicHelper().dic.eventType, function (item) {
      return {
        text: item.dicName,
        value: item.dicCode
      }
    });

    var service = {
      preparePateintEventForEdit: preparePateintEventForEdit,
      preparePatientEventForSaving: preparePatientEventForSaving,
      editPatientEvent: editPatientEvent
    };

    function editPatientEvent(okFuction, patientInfo, event) {

      modalService.open({
        templateUrl: 'MNIS/directives/patientRecord/eventList/patientEventEdit.modal.html',
        data: {
          formData: preparePateintEventForEdit(event, patientInfo.inhosCode),
          metaData: {
            eventTypes: eventTypes,
            bedTransferValidate: true,
            patientInfo: patientInfo,
            datePickerOption: {
              minDate: new Date(patientInfo.inDate),
              maxDate: patientInfo.outDate ? new Date(patientInfo.outDate) : new Date()
            }
          }
        },
        size: 'sm',
        methodsObj: {
          selectEventType: function (eventType) {
            var that = this;
            if (that.formData.event == eventType.value)
              that.formData.event = "";
            else {
              that.formData.event = eventType.value;
              if (that.formData.event == 'bedTransfer') {
                that.formData.bedCode = patientInfo.bedCode || "1";
                that.formData.targetBed = patientInfo.bedCode || "1";
              } else {
                delete that.formData.bedCode;
                delete that.formData.targetBed;
              }
            }
          },
          validateBed: function () {

            var that = this;
            if (that.formData.event != 'bedTransfer')
              return true;
            else {
              return (that.formData.bedCode && that.formData.targetBed && that.formData.bedCode != that.formData.targetBed);
            }
          }
        },
        ok: function (data) {

          var that = this;
          that.metaData.bedTransferValidate = that.validateBed();
          if (!that.metaData.bedTransferValidate)
            return false;
          return okFuction(data);
        }
      });
    }

    function preparePateintEventForEdit(patientEvent, inhosCode) {

      var wardCode = sessionService.getProfile().wardCode;
      var wardName = sessionService.getProfile().wardName;

      var editEvent = patientEvent == undefined ? {
        recordTime: new Date(),
        inhosCode: inhosCode,
        wardCode: wardCode,
        wardName: wardName
      } : angular.copy(patientEvent);

      editEvent.inputDate = moment(editEvent.recordTime).format('YYYY-MM-DD');
      editEvent.inputTime = moment(editEvent.recordTime).format('HH:mm');

      return editEvent;
    }

    function preparePatientEventForSaving(patientEvent) {

      if (!patientEvent.inputDate || !patientEvent.inputTime)
        return false;

      var patientEventClone = angular.copy(patientEvent);

      patientEventClone.recordTime = moment(new Date(patientEventClone.inputDate + " " + patientEventClone.inputTime)).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      delete patientEventClone.inputDate;
      delete patientEventClone.inputTime;

      return patientEventClone;
    }

    return service;
  }
})();
