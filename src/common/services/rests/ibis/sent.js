(function() {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('setDoc', setDoc);

  /** @ngInject */
  function setDoc(Restangular, $http) {
    var wardDocterMapping = "/ibis/ibisWardDocterMapping";
    var doorDocterMapping = "/ibis/ibisDoorDocterMapping";
    var fileType = "/ibis/ibisFileType";
    var newFileType = "/ibis/fileType";
    var fileType_types = "/ibis/ibisFileType/types";
    var fileInfo = "/ibis/ibisFileInfo";
    var fileInfoFiles = "/ibis/ibisFileInfo/Files";
    var totalWards = "/hospital/wards";
    var ignoreTimes = "/ibis/ignoreTimes";
    var hosImage = "/ibis/settings/hosImage";  
    var sysConfig = "/sys/sysConfig";
    var hugeFileUpload = '/sys/hugeFileUpload';
    var service = {
      setDoc: setDocFuc,
      changeDoc: changeDocFuc,
      sentDirectDoc: sentDirectDocFuc,
      changDirectDoc: changDirectDocFuc,

      sentType: sentTypeFuc,
      getType: getTypeFuc,
      deleType: deleTypeFuc,
      changeType: changeTypeFuc,
      getIndexType: getIndexTypeFuc,

      getEducations: getEducationFuc,
      getIndexEducation: getIndexEducationFuc,
      getAllWards: getAllWardsFuc,
      setEducation: setEducationFuc,
      deleEducation: deleEducationFuc,
      changeEducation: changeEducationFuc,
      setHosSetting: setHosSettingFuc,
      getHosSetting: getHosSettingFuc,
      getSettingTime: getSettingTimeFuc,
      setSettingTime: setSettingTimeFuc,
      deleSettingTime: deleSettingTimeFuc,
      changeSettingTime: changeSettingTimeFuc,

      setConfig: setConfigFuc,
      getConfig: getConfigFuc,

      hugeFileUpload: hugeFileUploadFuc

    };

    return service;


    function setDocFuc(data) {
      var pamars = {
        "createPerson": data.createPerson,
        "mainNurse": data.mainNurse,
        "updateTime": data.updateTime,
        "mainDoctor": data.mainDoctor,
        "wardCode": data.wardCode,
        "seqId": data.seqId,
        "updatePerson": data.updatePerson,
        "createTime": data.createTime
      }
      return Restangular.all(wardDocterMapping).customPOST(pamars);
    };

    function changeDocFuc(data) {
      var pamars = {
        "createPerson": data.createPerson,
        "mainNurse": data.mainNurse,
        "updateTime": data.updateTime,
        "mainDoctor": data.mainDoctor,
        "wardCode": data.wardCode,
        "seqId": data.seqId,
        "updatePerson": data.updatePerson,
        "createTime": data.createTime
      }
      return Restangular.all(wardDocterMapping).customPUT(pamars);
    };

    function changDirectDocFuc(data,success,error){
      var pamars = {
        "createPerson": data.createPerson,
        "createTime": data.createTime,
        "directDoctor": data.directDoctor,
        "directNurse": data.directNurse,
        "doorCode": data.doorCode,
        "doorMac": data.doorMac,
        "seqId": data.seqId,
        "updatePerson": data.updatePerson,
        "updateTime": data.updateTime,
        "wardCode": data.wardCode
      }
      return Restangular.all(doorDocterMapping).customPUT(pamars);
    }



    function sentDirectDocFuc(data,success,error){
     var pamars = {
        "createPerson": data.createPerson,
        "createTime": data.createTime,
        "directDoctor": data.directDoctor,
        "directNurse": data.directNurse,
        "doorCode": data.doorCode,
        "doorMac": data.doorMac,
        "seqId": data.seqId,
        "updatePerson": data.updatePerson,
        "updateTime": data.updateTime,
        "wardCode": data.wardCode
      }
      return Restangular.all(doorDocterMapping).customPOST(pamars);
    }


    function sentTypeFuc(data){
      var pamars = {
        "name":data.name,
        "sort":data.sort
      };
      return Restangular.all(fileType).post(pamars);
    };


    //  function sentTypeFuc(){
    //   return Restangular.all("ibis/ibisFileType").customPOST(data);
    // };





    function getTypeFuc(success,error){
      return Restangular.all(fileType_types).getList();
    };

    function deleTypeFuc(data){
      return Restangular.one(fileType+"/",data).customDELETE();
    };


    function changeTypeFuc(data){
      return Restangular.all(newFileType).customPATCH(data);
    };

    function getIndexTypeFuc(data){
      return Restangular.one(fileType+"/",data).customGET();
    }


    function getEducationFuc(){
      return Restangular.all(fileInfoFiles).getList();
    };


    function getIndexEducationFuc(data,success,error){
    return Restangular.one(fileInfo,data).get();

    }


    function getAllWardsFuc(){
      return Restangular.all(totalWards).getList();
    };


    function setEducationFuc(data){
    var pamars = {
      "imgUrl":data.imageUrl,
      "name":data.name,
      "path":data.path,
      "typeSeqId":data.typeSeqId,
      "wardCodeList":data.wardCodeList
    }
    return  Restangular.all(fileInfo).post(pamars);
    };


    function changeEducationFuc(data){
      var pamars = {
        "seqId":data.seqId,
        "imgUrl":data.imageUrl,
        "name":data.name,
        "path":data.path,
        "typeSeqId":data.typeSeqId,
        "wardCodeList":data.wardCodeList
      }
      return Restangular.all(fileInfo).customPUT(pamars);
    }


    function deleEducationFuc(data){
      return Restangular.one(fileInfo+'/', data).customDELETE();
    }


    function setHosSettingFuc(data,success,error){
      var pamars = {
        name:data.name,
        path:data.path
      }
      return Restangular.all(hosImage).customPOST(pamars)
    };


    function getHosSettingFuc(success,error){
      return  Restangular.one(hosImage).get();
    };


    function getSettingTimeFuc(success,error){
      return Restangular.one(ignoreTimes).get();
    };




    function setSettingTimeFuc(data,success,error){
      var pamars = {
        "endTime": data.endTime,
        "startTime": data.startTime
      }
      return Restangular.all(ignoreTimes).customPOST(pamars);
    };

    function deleSettingTimeFuc(data){
      return Restangular.one(ignoreTimes+'/',data).customDELETE();
    };

    function changeSettingTimeFuc(data){
      var pamars = {
        "seqId":data.seqId,
        "endTime": data.endTime,
        "startTime": data.startTime
      }
      return Restangular.all(ignoreTimes).customPUT(pamars);
    };

    function setConfigFuc(data){
      return Restangular.all(sysConfig).customPATCH(data);
    }

    function getConfigFuc(data){
      return Restangular.one(sysConfig,data).get();
    }

    function hugeFileUploadFuc() {
      return Restangular.all(hugeFileUpload).customPOST();
    }




















  }
})();