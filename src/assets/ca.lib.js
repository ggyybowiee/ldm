/*--------------------------------------------------------------------------
 *
 * BJCA Adaptive Javascript, Version SAB(Support All Browsers :))
 * This script support bjca client version 2.0 and later
 * Author:BJCA-zys
 *--------------------------------------------------------------------------*/

/* globals var */
var $_$softCertListID = ""; // Soft CertListID, Set by SetUserCertList
var $_$hardCertListID = ""; // USBKeyCertListID, Set by SetUserCertList
var $_$allCertListID = ""; // All CertListID, Set by SetUserCertList
var $_$loginCertID = ""; // logined CertID, Set by SetAutoLogoutParameter
var $_$logoutFunc = null; // logout Function, Set by SetAutoLogoutParameter
var $_$onUsbKeyChangeCallBackFunc = null; //custom onUsbkeyChange callback function
var $_$XTXAlert = null; // alert custom function
var $_$XTXAppObj = null; // XTXAppCOM class Object
var $_$SecXV2Obj = null; // BJCASecCOMV2 class Object
var $_$SecXObj = null; // BJCASecCOM class Object
var $_$WebSocketObj = null; // WebSocket class Object
var $_$CurrentObj = null; // Current use class Object
var $_$GetPicObj = null; // GetKeyPic class Object

// const var
var CERT_TYPE_HARD = 1;
var CERT_TYPE_SOFT = 2;
var CERT_TYPE_ALL = 3;

// const var
var CERT_OID_VERSION = 1;
var CERT_OID_SERIAL = 2;
var CERT_OID_SIGN_METHOD = 3;
var CERT_OID_ISSUER_C = 4;
var CERT_OID_ISSUER_O = 5;
var CERT_OID_ISSUER_OU = 6;
var CERT_OID_ISSUER_ST = 7;
var CERT_OID_ISSUER_CN = 8;
var CERT_OID_ISSUER_L = 9;
var CERT_OID_ISSUER_E = 10;
var CERT_OID_NOT_BEFORE = 11;
var CERT_OID_NOT_AFTER = 12;
var CERT_OID_SUBJECT_C = 13;
var CERT_OID_SUBJECT_O = 14;
var CERT_OID_SUBJECT_OU = 15;
var CERT_OID_SUBJECT_ST = 16;
var CERT_OID_SUBJECT_CN = 17;
var CERT_OID_SUBJECT_L = 18;
var CERT_OID_SUBJECT_E = 19;
var CERT_OID_PUBKEY = 20;
var CERT_OID_SUBJECT_DN = 33;
var CERT_OID_ISSUER_DN = 34;

// set auto logout parameters
function SetAutoLogoutParameter(strCertID, logoutFunc) {
  $_$loginCertID = strCertID;
  $_$logoutFunc = logoutFunc;
  return;
}

function SetLoginCertID(strCertID) {
  $_$loginCertID = strCertID;
  return;
}

function SetLogoutFunction(logoutFunc) {
  $_$logoutFunc = logoutFunc;
}

// set user cert list id
function SetUserCertList(strListID, certType) {
  if (arguments.length == 1) {
    $_$hardCertListID = strListID;
  } else {
    if (certType == CERT_TYPE_HARD) {
      $_$hardCertListID = strListID;
    }
    if (certType == CERT_TYPE_SOFT) {
      $_$softCertListID = strListID;
    }
    if (certType == CERT_TYPE_ALL) {
      $_$allCertListID = strListID;
    }
  }
  GetUserList($pushAllDropListBox);

  return;
}

// set custom usbkeychange callback
function SetOnUsbKeyChangeCallBack(callback) {
  $_$onUsbKeyChangeCallBackFunc = callback;
}

// set custom alert function
function SetAlertFunction(custom_alert) {
  $_$XTXAlert = custom_alert;
}

function $checkBrowserISIE() {
  return (!!window.ActiveXObject || 'ActiveXObject' in window) ? true : false;
}

function $popDropListBoxAll(strListID) {
  var objListID = eval(strListID);
  if (objListID == undefined) {
    return;
  }
  var i, n = objListID.length;
  for (i = 0; i < n; i++) {
    objListID.remove(0);
  }

  objListID = null;
}

function $pushOneDropListBox(userListArray, strListID) {
  var objListID = eval(strListID);
  if (objListID == undefined) {
    return;
  }

  var i;
  for (i = 0; i < userListArray.length; i++) {
    var certObj = userListArray[i];
    var objItem = new Option(certObj.certName, certObj.certID);
    objListID.options.add(objItem);
  }

  objListID = null;

  return;
}

function $pushAllDropListBox(certUserListObj) {
  if ($_$hardCertListID != "") {
    $popDropListBoxAll($_$hardCertListID);
  }
  if ($_$softCertListID != "") {
    $popDropListBoxAll($_$softCertListID);
  }

  if ($_$allCertListID != "") {
    $popDropListBoxAll($_$allCertListID);
  }

  var strUserList = certUserListObj.retVal;
  var allListArray = []
  while (true) {
    var i = strUserList.indexOf("&&&");
    if (i <= 0) {
      break;
    }
    var strOneUser = strUserList.substring(0, i);
    var strName = strOneUser.substring(0, strOneUser.indexOf("||"));
    var strCertID = strOneUser.substring(strOneUser.indexOf("||") + 2, strOneUser.length);
    allListArray.push({
      certName: strName,
      certID: strCertID
    });

    if ($_$hardCertListID != "") {
      GetDeviceType(strCertID, function (retObj) {
        if (retObj.retVal == "HARD") {
          $pushOneDropListBox([retObj.ctx], $_$hardCertListID);
        }
      }, {
        certName: strName,
        certID: strCertID
      });
    }

    if ($_$softCertListID != "") {
      GetDeviceType(strCertID, function (retObj) {
        if (retObj.retVal == "SOFT") {
          $pushOneDropListBox([retObj.ctx], $_$softCertListID);
        }
      }, {
        certName: strName,
        certID: strCertID
      });
    }
    var len = strUserList.length;
    strUserList = strUserList.substring(i + 3, len);
  }

  if ($_$allCertListID != "") {
    $pushOneDropListBox(allListArray, $_$allCertListID);
  }
}

function $myAutoLogoutCallBack(retObj) {
  if (retObj.retVal.indexOf($_$loginCertID) <= 0) {
    $_$logoutFunc();
  }
}

//usbkey change default callback function
function $OnUsbKeyChange() {
  GetUserList($pushAllDropListBox);
  if (typeof $_$onUsbKeyChangeCallBackFunc == 'function') {
    $_$onUsbKeyChangeCallBackFunc();
  }
  if ($_$loginCertID != "" && typeof $_$logoutFunc == 'function') {
    GetUserList($myAutoLogoutCallBack);
  }
}

// IE11 attach event
function $AttachIE11OnUSBKeychangeEvent(strObjName) {
  var handler = document.createElement("script");
  handler.setAttribute("for", strObjName);
  handler.setAttribute("event", "OnUsbKeyChange");
  handler.appendChild(document.createTextNode("$OnUsbKeyChange()"));
  document.body.appendChild(handler);
}

//load a control
function $LoadControl(CLSID, ctlName, testFuncName, addEvent) {
  var pluginDiv = document.getElementById("pluginDiv" + ctlName);
  if (pluginDiv) {
    return true;
  }
  pluginDiv = document.createElement("div");
  pluginDiv.id = "pluginDiv" + ctlName;
  document.body.appendChild(pluginDiv);

  try {
    if ($checkBrowserISIE()) { // IE
      pluginDiv.innerHTML = '<object id="' + ctlName + '" classid="CLSID:' + CLSID + '" style="HEIGHT:0px; WIDTH:0px"></object>';
      if (addEvent) {
        var clt = eval(ctlName);
        if (clt.attachEvent) {
          clt.attachEvent("OnUsbKeyChange", $OnUsbKeyChange);
        } else { // IE11 not support attachEvent, and addEventListener do not work well, so addEvent ourself
          $AttachIE11OnUSBKeychangeEvent(ctlName);
        }
      }
    } else {
      var chromeVersion = window.navigator.userAgent.match(/Chrome\/(\d+)\./);
      if (chromeVersion && chromeVersion[1]) {
        if (parseInt(chromeVersion[1], 10) >= 42) { // not support npapi return false
          document.body.removeChild(pluginDiv);
          pluginDiv.innerHTML = "";
          pluginDiv = null;
          return false;
        }
      }

      if (addEvent) {
        pluginDiv.innerHTML = '<embed id=' + ctlName + ' type=application/x-xtx-axhost clsid={' + CLSID + '} event_OnUsbkeyChange=$OnUsbKeyChange width=0 height=0 />';
      } else {
        pluginDiv.innerHTML = '<embed id=' + ctlName + ' type=application/x-xtx-axhost clsid={' + CLSID + '} width=0 height=0 />';
      }
    }

    if (testFuncName != null && testFuncName != "" && eval(ctlName + "." + testFuncName) == undefined) {
      document.body.removeChild(pluginDiv);
      pluginDiv.innerHTML = "";
      pluginDiv = null;
      return false;
    }
    return true;
  } catch (e) {
    document.body.removeChild(pluginDiv);
    pluginDiv.innerHTML = "";
    pluginDiv = null;
    return false;
  }
}

function $XTXAlert(strMsg) {
  if (typeof $_$XTXAlert == 'function') {
    $_$XTXAlert(strMsg);
  } else {
    alert(strMsg);
  }
}

function $myOKRtnFunc(retVal, cb, ctx) {
  if (typeof cb == 'function') {
    var retObj = {
      retVal: retVal,
      ctx: ctx
    };
    cb(retObj);
  }
  return retVal;
}

//XTXAppCOM class
function CreateXTXAppObject() {
  var bOK = $LoadControl("3F367B74-92D9-4C5E-AB93-234F8A91D5E6", "XTXAPP", "SOF_GetVersion()", true);
  if (!bOK) {
    return null;
  }

  var o = new Object();

  o.GetUserList = function (cb, ctx) {
    var ret = XTXAPP.SOF_GetUserList();
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o._GetUserListByType = function (strType, cb, ctx) {
    var strUserList = XTXAPP.SOF_GetUserList();
    var ret = "";
    while (true) {
      var i = strUserList.indexOf("&&&");
      if (i <= 0) {
        break;
      }
      var strOneUser = strUserList.substring(0, i);
      var strName = strOneUser.substring(0, strOneUser.indexOf("||"));
      var strCertID = strOneUser.substring(strOneUser.indexOf("||") + 2, strOneUser.length);
      if (XTXAPP.GetDeviceInfo(strCertID, 7) == strType) {
        ret += (strOneUser + "&&&");
      }
      var len = strUserList.length;
      strUserList = strUserList.substring(i + 3, len);
    }

    return $myOKRtnFunc(ret, cb, ctx);
  }
  o.GetUserList_USBKey = function (cb, ctx) {
    return o._GetUserListByType("HARD", cb, ctx);
  };
  o.GetUserList_Soft = function (cb, ctx) {
    return o._GetUserListByType("SOFT", cb, ctx);
  };

  o.ExportUserSignCert = function (strCertID, cb, ctx) {
    var ret;
    var strUserCert = XTXAPP.SOF_ExportUserCert(strCertID);
    var strUserExchCert = XTXAPP.SOF_ExportExChangeUserCert(strCertID);
    if (strUserCert == strUserExchCert) {
      ret = "";
    } else {
      ret = strUserCert;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ExportUserExchangeCert = function (strCertID, cb, ctx) {
    var ret = XTXAPP.SOF_ExportExChangeUserCert(strCertID)
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifyUserPIN = function (strCertID, strUserPIN, cb, ctx) {
    var ret = XTXAPP.SOF_Login(strCertID, strUserPIN);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ChangeUserPIN = function (strCertID, oldPwd, newPwd, cb, ctx) {
    var ret = XTXAPP.SOF_ChangePassWd(strCertID, oldPwd, newPwd);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetUserPINRetryCount = function (strCertID, cb, ctx) {
    var ret = XTXAPP.SOF_GetPinRetryCount(strCertID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfo = function (strCert, Type, cb, ctx) {
    var ret = XTXAPP.SOF_GetCertInfo(strCert, Type);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfoByOID = function (strCert, strOID, cb, ctx) {
    var ret = XTXAPP.SOF_GetCertInfoByOid(strCert, strOID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertEntity = function (strCert, cb, ctx) {
    var ret = XTXAPP.SOF_GetCertEntity(strCert);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GenRandom = function (RandomLen, cb, ctx) {
    var ret = XTXAPP.SOF_GenRandom(RandomLen);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignData = function (strCertID, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_SignData(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignedData = function (strCert, strInData, strSignValue, cb, ctx) {
    var ret = XTXAPP.SOF_VerifySignedData(strCert, strInData, strSignValue);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PubKeyEncrypt = function (strCert, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_PubKeyEncrypt(strCert, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PriKeyDecrypt = function (strCertID, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_PriKeyDecrypt(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignDataByP7 = function (strCertID, strInData, bDetach, cb, ctx) {
    var bFlag = 0;
    if (bDetach) {
      bFlag = 1;
    }
    var ret = XTXAPP.SOF_SignMessage(bFlag, strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifyDataByP7 = function (strP7Data, strPlainMsg, cb, ctx) {
    var ret = XTXAPP.SOF_VerifySignedMessage(strP7Data, strPlainMsg);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.EncyptMessage = function (strCert, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_EncryptDataEx(strCert, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.DecryptMessage = function (strCertID, strP7Envlope, cb, ctx) {
    var ret = XTXAPP.SOF_DecryptData(strCertID, strP7Envlope);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignFile = function (strCertID, strFilePath, cb, ctx) {
    var ret = XTXAPP.SOF_SignFile(strCertID, strFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignFile = function (strCert, strFilePath, strSignValue, cb, ctx) {
    var ret = XTXAPP.SOF_VerifySignedFile(strCert, strFilePath, strSignValue);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetSymKeyLength = function (cb, ctx) {
    var ret = 24;
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptData = function (strKey, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_SymEncryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptData = function (strKey, strInData, cb, ctx) {
    var ret = XTXAPP.SOF_SymDecryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret = XTXAPP.SOF_SymEncryptFile(strKey, strInFilePath, strOutFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret = XTXAPP.SOF_SymDecryptFile(strKey, strInFilePath, strOutFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ValidateCert = function (strCert, cb, ctx) {
    var r = XTXAPP.SOF_ValidateCert(strCert);
    var ret;
    if (ret == 0) {
      ret = true;
    } else {
      ret = false;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.HashFile = function (strFilePath, cb, ctx) {
    var ret = XTXAPP.SOF_HashFile(2, strFilePath); //sha1 alg
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetDateNotBefore = function (strCertValid) {
    return o._GetDateFormate(strCertValid);
  };

  o.GetDateNotAfter = function (strCertValid) {
    return o._GetDateFormate(strCertValid);
  };

  o._GetDateFormate = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(4, 6);
    var strDay = strCertValid.substring(6, 8);
    var strHour = strCertValid.substring(8, 10);
    var strMin = strCertValid.substring(10, 12);
    var strSecond = strCertValid.substring(12, 14);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(Number(strHour));
    RtnDate.setMinutes(Number(strMin));
    RtnDate.setSeconds(Number(strSecond));
    return RtnDate;
  };

  o.GetDeviceType = function (strCertID, cb, ctx) {
    var ret = XTXAPP.GetDeviceInfo(strCertID, 7);
    return $myOKRtnFunc(ret, cb, ctx);
  }

  o.SignHashData = function (strCertID, strHashData, ulHashAlg, cb, ctx) {
    var ret = XTXAPP.SOF_SignHashData(strCertID, strHashData, ulHashAlg);
    return $myOKRtnFunc(ret, cb, ctx);
  }

  o.VerifySignedHashData = function (strCert, strHashData, ulHashAlg, strSignValue, cb, ctx) {
    var ret = XTXAPP.SOF_VerifySignedHashData(strCert, strHashData, strSignValue, ulHashAlg);
    return $myOKRtnFunc(ret, cb, ctx);
  }

  return o;
}

//SecXV2 class
function CreateSecXV2Object() {
  var bOK = $LoadControl("FCAA4851-9E71-4BFE-8E55-212B5373F040", "SecXV2", "GetUserList()", true);
  if (!bOK) {
    return null;
  }

  var o = new Object();

  o.GetUserList = function (cb, ctx) {
    var ret = SecXV2.GetUserList();
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetUserList_USBKey = function (cb, ctx) {
    return o.GetUserList(cb, ctx);
  };
  o.GetUserList_Soft = function (cb, ctx) {
    return o.GetUserList(cb, ctx);
  };

  o.ExportUserSignCert = function (strCertID, cb, ctx) {
    var ret;
    var strUserCert = SecXV2.ExportUserCert(strCertID);
    var strUserExchCert = SecXV2.ExportExChangeUserCert(strCertID);
    if (strUserCert == strUserExchCert) {
      ret = "";
    } else {
      ret = strUserCert;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ExportUserExchangeCert = function (strCertID, cb, ctx) {
    var ret = SecXV2.ExportExChangeUserCert(strCertID);
    if (typeof cb == 'function') {
      var retObj = {
        retVal: ret,
        ctx: ctx
      };
      cb(retObj);
    }
    return ret;
  };

  o.VerifyUserPIN = function (strCertID, strUserPIN, cb, ctx) {
    var ret = SecXV2.UserLogin(strCertID, strUserPIN);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ChangeUserPIN = function (strCertID, oldPwd, newPwd, cb, ctx) {
    var ret = SecXV2.ChangePasswd(strCertID, oldPwd, newPwd);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetUserPINRetryCount = function (strCertID, cb, ctx) {
    var strExtLib = SecXV2.GetUserInfo(strCertID, 15);
    var ret = SecXV2.GetBjcaKeyParam(strExtLib, 8);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfo = function (strCert, Type, cb, ctx) {
    var ret = SecXV2.GetCertInfo(strCert, Type);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfoByOID = function (strCert, strOID, cb, ctx) {
    var ret = SecXV2.GetCertInfoByOid(strCert, strOID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertEntity = function (strCert, cb, ctx) {
    var ret = SecXV2.GetCertInfoByOid(strCert, "2.16.840.1.113732.2");
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GenRandom = function (RandomLen, cb, ctx) {
    var ret = SecXV2.GenRandom(RandomLen);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignData = function (strCertID, strInData, cb, ctx) {
    var ret = SecXV2.SignData(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignedData = function (strCert, strInData, strSignValue, cb, ctx) {
    var ret = SecXV2.VerifySignedData(strCert, strInData, strSignValue);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PubKeyEncrypt = function (strCert, strInData, cb, ctx) {
    var ret = SecXV2.PubKeyEncrypt(strCert, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PriKeyDecrypt = function (strCertID, strInData, cb, ctx) {
    var ret = SecXV2.PriKeyDecrypt(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignDataByP7 = function (strCertID, strInData, bDetach, cb, ctx) {
    var ret = SecXV2.SignDataByP7(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifyDataByP7 = function (strP7Data, strPlainMsg, cb, ctx) {
    var ret = SecXV2.VerifySignedDatabyP7(strP7Data);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.EncyptMessage = function (strCert, strInData, cb, ctx) {
    var ret = SecXV2.EncodeP7EnvelopedData(strCert, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.DecryptMessage = function (strCertID, strP7Envlope, cb, ctx) {
    var ret = SecXV2.DecodeP7EnvelopedData(strCertID, strP7Envlope);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignFile = function (strCertID, strFilePath, cb, ctx) {
    var ret = SecXV2.SignFile(strCertID, strFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignFile = function (strCert, strFilePath, strSignValue, cb, ctx) {
    var ret = SecXV2.VerifySignedFile(strCert, strFilePath, strSignValue);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetSymKeyLength = function (cb, ctx) {
    var ret = 24;
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptData = function (strKey, strInData, cb, ctx) {
    var ret = SecXV2.EncryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptData = function (strKey, strInData, cb, ctx) {
    var ret = SecXV2.DecryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret = SecXV2.EncryptFile(strKey, strInFilePath, strOutFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret = SecXV2.DecryptFile(strKey, strInFilePath, strOutFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ValidateCert = function (strCert, cb, ctx) {
    var ret = SecXV2.ValidateCert(strCert);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetDateNotBefore = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(5, 7);
    var strDay = strCertValid.substring(8, 10);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(0);
    RtnDate.setMinutes(0);
    RtnDate.setSeconds(0);
    return RtnDate;
  };

  o.GetDateNotAfter = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(5, 7);
    var strDay = strCertValid.substring(8, 10);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(23);
    RtnDate.setMinutes(59);
    RtnDate.setSeconds(59);
    return RtnDate;
  };

  return o;
}

//SecXV2 class
function CreateSecXObject() {
  $LoadControl("02BE3F91-A9E1-4D12-A65B-1E0D500292A7", "oCert", "", false);
  $LoadControl("4F763EC7-657A-43A8-96D0-BD3AD6D5E17E", "oCrypto", "", false);
  $LoadControl("D57CD2CA-8FA1-440F-8614-B0A28F64F0BE", "oDevice", "", false);
  var bOK = $LoadControl("BB7D3BAD-A402-4E98-B813-1C3C22481AE7", "oUtil", "getUserList()", false);
  if (!bOK) {
    return null;
  }
  bOK = $LoadControl("0CF5259B-A812-4B6E-9746-ACF7279FEF74", "USBKEY", "EnumUsbKey()", true);
  if (!bOK) {
    return null;
  }

  var o = new Object();

  o.CERT_SRC_BASE64 = 1; //证书来自Base64字符串
  o.CERT_SRC_UNIQUEID = 2; //证书来自唯一表示
  o.CERT_SRC_FILE = 3; //证书来自der文件
  o.CERT_SRC_CONTAINER_UCA = 4; //证书来自UCA类型证书容器
  o.CERT_SRC_CONTAINER_SIGN = 5; //证书来自容器下签名证书
  o.CERT_SRC_CONTAINER_ENC = 6; //证书来自容器下加密证书
  o.CERT_SRC_CONTAINER_BOTH = 7; //证书来自容器下签名加密证书
  o.CERT_SRC_PKCS12 = 8; //证书来自PKCS12文件

  o.CERT_DST_BASE64 = 1; //导出证书为Base64字符串
  o.CERT_DST_DERFILE = 2; //导出证书为der文件
  o.CERT_DST_P12 = 3; //到出证书为PKCS12文件

  o.CERT_XML_SUBJECT = 1; //从XML配置文件取用户名
  o.CERT_XML_UNIQUEID = 2; //从XML配置文件取用户唯一表识
  o.CERT_XML_DEPT = 3; //从XML配置文件取用户所有者部门
  o.CERT_XML_ISSUE = 4; //从XML配置文件取用户证书颁发者
  o.CERT_XML_STATE = 5; //从XML配置文件取用户证书使用状态
  o.CERT_XML_TRADETYPE = 6; //从XML配置文件取用户证书应用类型
  o.CERT_XML_PASSWORD = 7; //从XML配置文件取用户证书私钥保护口令
  o.CERT_XML_DEVICETYPE = 8; //从XML配置文件取用户证书介质类型
  o.CERT_XML_CATYPE = 9; //从XML配置文件取用户证书CA类型
  o.CERT_XML_KEYTYPE = 10; //从XML配置文件取用户证书密钥类型
  o.CERT_XML_SIGNSN = 11; //从XML配置文件取用户签名证书序列号
  o.CERT_XML_EXCHSN = 12; //从XML配置文件取用户加密证书序列号
  o.CERT_XML_DEVICENAME = 13; //从XML配置文件取用户证书介质名称
  o.CERT_XML_DEVICEPROVIDER = 14; //从XML配置文件取用户证书介质提供者
  o.CERT_XML_DEVICEAFFIX = 15; //从XML配置文件取用户证书介质附加库
  o.CERT_XML_SIGNPATH = 16; //从XML配置文件取用户签名证书路径
  o.CERT_XML_EXCHPATH = 17; //从XML配置文件取用户加密证书路径
  o.CERT_XML_SIGNPFXPATH = 18; //从XML配置文件取用户签名P12证书路径
  o.CERT_XML_EXCHPFXPATH = 19; //从XML配置文件取用户加密P12证书路径
  o.CERT_XML_CHAINPATH = 20; //从XML配置文件取用户证书链路径
  o.CERT_XML_CRLPATH = 21; //从XML配置文件取用户证书作废列表路径
  o.CERT_XML_UNIQUEIDOID = 22; //从XML配置文件取用户证书UniqueID的OID
  o.CERT_XML_VERIFYTYPE = 23; //从XML配置文件取用户证书验证类型
  o.CERT_XML_CACOUNTS = 24; //从XML配置文件取用户证书根证书个数
  o.CERT_XML_CANUMTYPE = 25; //从XML配置文件取用户证书跟证书类型

  o.CRYPT_CFGTYPE_UNSET = 0; //用户应用类型未定义
  o.CRYPT_CFGTYPE_CSP = 1; //用户应用类型CSP
  o.CRYPT_CFGTYPE_P11 = 2; //用户应用类型P11
  o.CRYPT_CFGTYPE_P12 = 3; //用户应用类型软算法

  o.ENVELOP_ENC = 1; //加密P7数字信封
  o.ENVELOP_DEC = 0; //解密P7数字信封


  o.GetUserList = function (cb, ctx) {
    var ret = USBKEY.getUserList();
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetUserList_USBKey = function (cb, ctx) {
    return o.GetUserList(cb, ctx);
  };
  o.GetUserList_Soft = function (cb, ctx) {
    return o.GetUserList(cb, ctx);
  };

  o.ExportUserSignCert = function (strCertID, cb, ctx) {
    var ret;
    var strCSPName = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEPROVIDER);
    var KeyType = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_KEYTYPE);
    if (KeyType == 1) {
      oCert.importCert(strCertID, o.CERT_SRC_CONTAINER_ENC, strCSPName);
      ret = oCert.exportCert(o.CERT_DST_BASE64);
    } else if (KeyType == 2) {
      oCert.importCert(strCertID, o.CERT_SRC_CONTAINER_SIGN, strCSPName);
      ret = oCert.exportCert(o.CERT_DST_BASE64);
    } else {
      ret = "";
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ExportUserExchangeCert = function (strCertID, cb, ctx) {
    var strCSPName = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEPROVIDER);
    oCert.importCert(strCertID, o.CERT_SRC_CONTAINER_ENC, strCSPName);
    var ret = oCert.exportCert(o.CERT_DST_BASE64);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifyUserPIN = function (strCertID, strUserPIN, cb, ctx) {
    var ret;
    var strCSPName = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEPROVIDER);
    var strExtLib = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEAFFIX);
    var r = oDevice.userLogin(strCSPName, strUserPIN);
    if (r == 0) {
      oCrypto.setUserCfg(o.CRYPT_CFGTYPE_CSP, strCSPName, strExtLib, strUserPIN);
      ret = true;
    } else {
      ret = false;
    }

    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ChangeUserPIN = function (strCertID, oldPwd, newPwd, cb, ctx) {
    var ret;
    var strCSPName = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEPROVIDER);
    var strExtLib = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEAFFIX);
    var r = oDevice.changeUserPin(strCSPName, strExtLib, oldPwd, newPwd)
    if (r == 0) {
      oCrypto.setUserCfg(o.CRYPT_CFGTYPE_CSP, strCSPName, strExtLib, newPwd);
      ret = true;
    } else {
      ret = false;
    }

    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetUserPINRetryCount = function (strCertID, cb, ctx) {
    var strExtLib = USBKEY.getUserInfoByContainer(strCertID, o.CERT_XML_DEVICEAFFIX);
    var ret = oDevice.getKeyRetrys(strExtLib);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfo = function (strCert, Type, cb, ctx) {
    oCert.importCert(strCert, o.CERT_SRC_BASE64);
    var SecXType;
    switch (Type) {
      case CERT_OID_ISSUER_CN:
        SecXType = 4;
        break;
      case CERT_OID_NOT_BEFORE:
        SecXType = 5;
        break;
      case CERT_OID_NOT_AFTER:
        SecXType = 6;
        break;
      case CERT_OID_SUBJECT_C:
        SecXType = 42;
        break;
      case CERT_OID_SUBJECT_O:
        SecXType = 45;
        break;
      case CERT_OID_SUBJECT_OU:
        SecXType = 46;
        break;
      case CERT_OID_SUBJECT_ST:
        SecXType = 44;
        break;
      case CERT_OID_SUBJECT_CN:
        SecXType = 41;
        break;
      case CERT_OID_SUBJECT_L:
        SecXType = 43;
        break;
      case CERT_OID_PUBKEY:
        SecXType = 43;
        break;
      default:
        SecXType = Type;
        break;
    }
    var ret = oCert.getBasicCertInfoByOID(SecXType);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertInfoByOID = function (strCert, strOID, cb, ctx) {
    oCert.importCert(strCert, o.CERT_SRC_BASE64);
    var ret = oCert.getExtCertInfoByOID(strOID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetCertEntity = function (strCert, cb, ctx) {
    oCert.importCert(strCert, o.CERT_SRC_BASE64);
    var ret = oCert.getExtCertInfoByOID("2.16.840.1.113732.2");
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GenRandom = function (RandomLen, cb, ctx) {
    var ret = oCrypto.generateRandom(RandomLen);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignData = function (strCertID, strInData, cb, ctx) {
    var ret = oCrypto.signedData(strInData, strCertID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignedData = function (strCert, strInData, strSignValue, cb, ctx) {
    var ret;
    var r = oCrypto.verifySignedData(strSignValue, strCert, strInData);
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }

    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PubKeyEncrypt = function (strCert, strInData, cb, ctx) {
    var ret = oCrypto.EncDataByCert(strCert, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.PriKeyDecrypt = function (strCertID, strInData, cb, ctx) {
    var ret = oCrypto.DecDataByRSA(strCertID, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignDataByP7 = function (strCertID, strInData, bDetach, cb, ctx) {
    var ret = oCrypto.signedDataByP7(strInData, strCertID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifyDataByP7 = function (strP7Data, strPlainMsg, cb, ctx) {
    var ret;
    var r = oCrypto.verifySignedDataByP7(strP7Data);
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }

    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.EncyptMessage = function (strCert, strInData, cb, ctx) {
    var ret = oCrypto.envelopedData(strInData, o.ENVELOP_ENC, strCert);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.DecryptMessage = function (strCertID, strP7Envlope, cb, ctx) {
    var ret = oCrypto.envelopedData(strP7Envlope, o.ENVELOP_DEC, strCertID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SignFile = function (strCertID, strFilePath, cb, ctx) {
    var ret = oCrypto.signFile(strFilePath, strCertID);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.VerifySignFile = function (strCert, strFilePath, strSignValue, cb, ctx) {
    var ret;
    var r = oCrypto.verifySignFile(strFilePath, strCert, strSignValue);
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetSymKeyLength = function (cb, ctx) {
    var ret = 24;
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptData = function (strKey, strInData, cb, ctx) {
    var ret = oCrypto.encryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptData = function (strKey, strInData, cb, ctx) {
    var ret = oCrypto.decryptData(strKey, strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret;
    var r = oCrypto.encryptFile(strInFilePath, strOutFilePath, strKey);
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymDecryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var ret;
    var r = oCrypto.decryptFile(strInFilePath, strOutFilePath, strKey);
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }

    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ValidateCert = function (strCert, cb, ctx) {
    var ret;
    var r = oCert.validateCert("", "");
    if (r == 0) {
      ret = true;
    } else {
      ret = false;
    }
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.HashFile = function (strFilePath, cb, ctx) {
    var ret = oCrypto.HashFile(strFilePath);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.GetDateNotBefore = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(5, 7);
    var strDay = strCertValid.substring(8, 10);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(0);
    RtnDate.setMinutes(0);
    RtnDate.setSeconds(0);
    return RtnDate;
  };

  o.GetDateNotAfter = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(5, 7);
    var strDay = strCertValid.substring(8, 10);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(23);
    RtnDate.setMinutes(59);
    RtnDate.setSeconds(59);
    return RtnDate;
  };

  return o;
}

//webSocket client class
function CreateWebSocketObject() {

  var o = new Object();

  o.ws_host = "ws://127.0.0.1:";
  o.ws_port_array = ["4044", "5044", "6044", "7044", "8044"];
  o.ws_port_use = 0;
  o.ws_obj = null;
  o.ws_heartbeat_id = 0;
  o.ws_queue_id = 0; // call_cmd_id
  o.ws_queue_list = {}; // call_cmd_id callback queue
  o.ws_queue_ctx = {};
  o.xtx_version = "";

  o.load_websocket = function () {
    if (o.ws_port_use > o.ws_port_array.length) {
      o.ws_port_use = 0;
      return false;
    }

    var ws_url = o.ws_host + o.ws_port_array[o.ws_port_use] + "/";
    try {
      o.ws_obj = new WebSocket(ws_url);
    } catch (e) {
      console.log(e);
      return false;
    }

    o.ws_queue_list["onUsbkeyChange"] = $OnUsbKeyChange;

    o.ws_obj.onopen = function (evt) {
      clearInterval(o.ws_heartbeat_id);
      o.callMethod("SOF_GetVersion", function (str) {
        o.xtx_version = str.retVal;
      });
      o.ws_heartbeat_id = setInterval(function () {
        o.callMethod("SOF_GetVersion", function (str) {});
      }, 10 * 1000);
      GetUserList($pushAllDropListBox);
    };

    o.ws_obj.onclose = function (evt) {

    };

    o.ws_obj.onmessage = function (evt) {
      var res = JSON.parse(evt.data);
      if (typeof (res['call_cmd_id']) != 'undefined' && typeof (o.ws_queue_list[res['call_cmd_id']]) == 'function') {
        var execFunc = o.ws_queue_list[res['call_cmd_id']];
        var ctx = o.ws_queue_ctx[res['call_cmd_id']];
        ctx = ctx || {
          returnType: "string"
        };
        var ret;
        if (typeof ctx.returnType == 'string') {
          if (ctx.returnType == "bool") {
            ret = res.retVal == "true" ? true : false;
          } else if (ctx.returnType == "number") {
            ret = Number(res.retVal);
          } else {
            ret = res.retVal;
          }
        } else {
          ret = res.retVal;
        }
        var retObj = {
          retVal: ret,
          ctx: ctx
        };
        execFunc(retObj);
        if (res['call_cmd_id'] != "onUsbkeyChange") {
          delete o.ws_queue_list[res['call_cmd_id']];
        }
        delete o.ws_queue_ctx[res['call_cmd_id']];
      }
    };

    o.ws_obj.onerror = function (evt) {
      o.ws_port_use++;
      o.load_websocket();
    };

    return true;
  };

  o.sendMessage = function (sendMsg) {
    if (o.ws_obj.readyState == WebSocket.OPEN) {
      o.ws_obj.send(JSON.stringify(sendMsg));
    } else {
      console.log("Can't connect to WebSocket server!");
    }
  };

  o.callMethod = function (strMethodName, cb, ctx, returnType, argsArray) {
    o.ws_queue_id++;
    if (typeof (cb) == 'function') {
      o.ws_queue_list['i_' + o.ws_queue_id] = cb;
      ctx = ctx || {};
      ctx.returnType = returnType;
      o.ws_queue_ctx['i_' + o.ws_queue_id] = ctx;
    }

    var sendArray = {};
    sendArray['xtx_func_name'] = strMethodName;
    sendArray['call_cmd_id'] = 'i_' + o.ws_queue_id;
    if (o.xtx_version >= "2.14") {
      sendArray['URL'] = window.location.href;
    }

    if (arguments.length > 4) {
      for (var i = 1; i <= argsArray.length; i++) {
        var strParam = "param_" + i;
        sendArray[strParam] = argsArray[i - 1];
      }
    }

    if (o.ws_obj.readyState == WebSocket.OPEN) {
      o.sendMessage(sendArray)
    } else if (o.ws_obj.readyState != WebSocket.OPEN && o.ws_obj.readyState != WebSocket.CONNECTING) {
      o.load_websocket();
      setTimeout(o.sendMessage(sendArray), 500);
    }
  };

  o.GetUserList = function (cb, ctx) {
    o.callMethod('SOF_GetUserList', cb, ctx, "string");
  };

  o._GetUserListByType = function (strType, cb, ctx) {
    o.GetUserList(function (retObj) {
      var strUserList = retObj.retVal;
      while (true) {
        var i = strUserList.indexOf("&&&");
        if (i <= 0) {
          break;
        }
        var strOneUser = strUserList.substring(0, i);
        var strName = strOneUser.substring(0, strOneUser.indexOf("||"));
        var strCertID = strOneUser.substring(strOneUser.indexOf("||") + 2, strOneUser.length);
        o.GetDeviceType(strCertID, function (retObj) {
          if (retObj.retVal == retObj.ctx.ctx.type) {
            if (typeof retObj.ctx.ctx.cb == 'function') {
              retObj.ctx.ctx.cb({
                retVal: retObj.ctx.userList,
                ctx: retObj.ctx.ctx.ctx
              })
            }
          }
        }, {
          userList: strOneUser,
          ctx: retObj.ctx
        });
        var len = strUserList.length;
        strUserList = strUserList.substring(i + 3, len);
      }
    }, {
      type: strType,
      cb: cb,
      ctx: ctx
    });
  }
  o.GetUserList_USBKey = function (cb, ctx) {
    return o._GetUserListByType("HARD", cb, ctx);
  };
  o.GetUserList_Soft = function (cb, ctx) {
    return o._GetUserListByType("SOFT", cb, ctx);
  };

  o.ExportUserSignCert = function (strCertID, cb, ctx) {
    var paramArray = [strCertID];
    o.callMethod('SOF_ExportUserCert', cb, ctx, "string", paramArray);
  };

  o.ExportUserExchangeCert = function (strCertID, cb, ctx) {
    var paramArray = [strCertID];
    o.callMethod('SOF_ExportExChangeUserCert', cb, ctx, "string", paramArray);
  };

  o.VerifyUserPIN = function (strCertID, strUserPIN, cb, ctx) {
    var paramArray = [strCertID, strUserPIN];
    o.callMethod('SOF_Login', cb, ctx, "bool", paramArray);
  };

  o.ChangeUserPIN = function (strCertID, oldPwd, newPwd, cb, ctx) {
    var paramArray = [strCertID, oldPwd, newPwd];
    o.callMethod('SOF_ChangePassWd', cb, ctx, "bool", paramArray);
  };

  o.GetUserPINRetryCount = function (strCertID, cb, ctx) {
    var paramArray = [strCertID];
    o.callMethod('SOF_GetPinRetryCount', cb, ctx, "number", paramArray);
  };

  o.GetCertInfo = function (strCert, Type, cb, ctx) {
    var paramArray = [strCert, Type];
    o.callMethod('SOF_GetCertInfo', cb, ctx, "string", paramArray);
  };

  o.GetCertInfoByOID = function (strCert, strOID, cb, ctx) {
    var paramArray = [strCert, strOID];
    o.callMethod('SOF_GetCertInfoByOid', cb, ctx, "string", paramArray);
  };

  o.GetCertEntity = function (strCert, cb, ctx) {
    var paramArray = [strCert];
    o.callMethod('SOF_GetCertEntity', cb, ctx, "string", paramArray);
  };

  o.GenRandom = function (RandomLen, cb, ctx) {
    var paramArray = [RandomLen];
    o.callMethod('SOF_GenRandom', cb, ctx, "string", paramArray);
  };

  o.SignData = function (strCertID, strInData, cb, ctx) {
    var paramArray = [strCertID, strInData];
    o.callMethod('SOF_SignData', cb, ctx, "string", paramArray);
  };

  o.VerifySignedData = function (strCert, strInData, strSignValue, cb, ctx) {
    var paramArray = [strCert, strInData, strSignValue];
    o.callMethod('SOF_VerifySignedData', cb, ctx, "bool", paramArray);
  };

  o.PubKeyEncrypt = function (strCert, strInData, cb, ctx) {
    var paramArray = [strCert, strInData];
    o.callMethod('SOF_PubKeyEncrypt', cb, ctx, "string", paramArray);
  };

  o.PriKeyDecrypt = function (strCertID, strInData, cb, ctx) {
    var paramArray = [strCertID, strInData];
    o.callMethod('SOF_PriKeyDecrypt', cb, ctx, "string", paramArray);
  };

  o.SignDataByP7 = function (strCertID, strInData, bDetach, cb, ctx) {
    var paramArray = [strCertID, strInData];
    o.callMethod('SOF_SignMessage', cb, ctx, "string", paramArray);
  };

  o.VerifyDataByP7 = function (strP7Data, strPlainMsg, cb, ctx) {
    var paramArray = [strP7Data, strPlainMsg];
    o.callMethod('SOF_VerifySignedMessage', cb, ctx, "bool", paramArray);
  };

  o.EncyptMessage = function (strCert, strInData, cb, ctx) {
    var paramArray = [strCert, strInData];
    o.callMethod('SOF_EncryptData', cb, ctx, "string", paramArray);
  };

  o.DecryptMessage = function (strCertID, strP7Envlope, cb, ctx) {
    var paramArray = [strCertID, strP7Envlope];
    o.callMethod('SOF_DecryptData', cb, ctx, "string", paramArray);
  };

  o.SignFile = function (strCertID, strFilePath, cb, ctx) {
    var paramArray = [strCertID, strFilePath];
    o.callMethod('SOF_SignFile', cb, ctx, "string", paramArray);
  };

  o.VerifySignFile = function (strCert, strFilePath, strSignValue, cb, ctx) {
    var paramArray = [strCert, strFilePath, strSignValue];
    o.callMethod('SOF_VerifySignedFile', cb, ctx, "bool", paramArray);
  };

  o.GetSymKeyLength = function (cb, ctx) {
    var ret = 24;
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.SymEncryptData = function (strKey, strInData, cb, ctx) {
    var paramArray = [strKey, strInData];
    o.callMethod('SOF_SymEncryptData', cb, ctx, "string", paramArray);
  };

  o.SymDecryptData = function (strKey, strInData, cb, ctx) {
    var paramArray = [strKey, strInData];
    o.callMethod('SOF_SymDecryptData', cb, ctx, "string", paramArray);
  };

  o.SymEncryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var paramArray = [strKey, strInFilePath, strOutFilePath];
    o.callMethod('SOF_SymEncryptFile', cb, ctx, "bool", paramArray);
  };

  o.SymDecryptFile = function (strKey, strInFilePath, strOutFilePath, cb, ctx) {
    var paramArray = [strKey, strInFilePath, strOutFilePath];
    o.callMethod('SOF_SymDecryptFile', cb, ctx, "bool", paramArray);
  };

  o.ValidateCert = function (strCert, cb, ctx) {
    var paramArray = [strCert];
    o.callMethod('SOF_ValidateCert', cb, ctx, "bool", paramArray);
  };

  o.HashFile = function (strFilePath, cb, ctx) {
    var paramArray = [2, strFilePath];
    o.callMethod('SOF_HashFile', cb, ctx, "string", paramArray);
  };

  o.GetDateNotBefore = function (strCertValid) {
    return o._GetDateFormate(strCertValid);
  };

  o.GetDateNotAfter = function (strCertValid) {
    return o._GetDateFormate(strCertValid);
  };

  o._GetDateFormate = function (strCertValid) {
    var strYear = strCertValid.substring(0, 4);
    var strMonth = strCertValid.substring(4, 6);
    var strDay = strCertValid.substring(6, 8);
    var strHour = strCertValid.substring(8, 10);
    var strMin = strCertValid.substring(10, 12);
    var strSecond = strCertValid.substring(12, 14);
    var RtnDate = new Date();
    RtnDate.setFullYear(Number(strYear), Number(strMonth) - 1, Number(strDay));
    RtnDate.setHours(Number(strHour));
    RtnDate.setMinutes(Number(strMin));
    RtnDate.setSeconds(Number(strSecond));
    return RtnDate;
  };

  o.GetDeviceType = function (strCertID, cb, ctx) {
    var paramArray = [strCertID, 7];
    o.callMethod('GetDeviceInfo', cb, ctx, "string", paramArray);
  }

  o.SignHashData = function (strCertID, strHashData, ulHashAlg, cb, ctx) {
    var paramArray = [strCertID, strHashData, ulHashAlg];
    o.callMethod('SOF_SignHashData', cb, ctx, "string", paramArray);
  }

  o.VerifySignedHashData = function (strCert, strHashData, ulHashAlg, strSignValue, cb, ctx) {
    var paramArray = [strCert, strHashData, ulHashAlg, strSignValue];
    o.callMethod('SOF_VerifySignedHashData', cb, ctx, "bool", paramArray);
  }

  // getpic begin
  o.GetPic = function (strContainerName, cb, ctx) {
    var paramArray = [strContainerName];
    o.callMethod('GetPic', cb, ctx, "string", paramArray);
  };

  o.Hash = function (strInData, cb, ctx) {
    var paramArray = [strInData];
    o.callMethod('Hash', cb, ctx, "string", paramArray);
  };

  o.ConvertPicFormat = function (strInData, type, cb, ctx) {
    var paramArray = [strInData, type];
    o.callMethod('ConvertPicFormat', cb, ctx, "string", paramArray);
  };

  o.ConvertGif2Jpg = function (strInData, cb, ctx) {
    var paramArray = [strInData];
    o.callMethod('ConvertGif2Jpg', cb, ctx, "string", paramArray);
  };

  o.ConvertPicSize = function (strInData, w, h, cb, ctx) {
    var paramArray = [strInData, w, h];
    o.callMethod('ConvertPicSize', cb, ctx, "string", paramArray);
  };
  // getpic end

  if (!o.load_websocket()) {
    return null;
  }

  return o;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// 对外提供的接口

function $myErrorRtnFunc(retVal, cb, ctx) {
  if (typeof cb == 'function') {
    var retObj = {
      retVal: retVal,
      ctx: ctx
    };
    cb(retObj);
  }

  return retVal;
}
//get user list
function GetUserList(cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetUserList(cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//get usbKey user list
function GetUserList_USBKey(cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetUserList_USBKey(cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//get soft user list
function GetUserList_Soft(cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetUserList_Soft(cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//export user signature cert
function GetSignCert(strCertID, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.ExportUserSignCert(strCertID, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//export user exchange cert
function GetExchCert(strCertID, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.ExportUserExchangeCert(strCertID, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//verify user pin
function VerifyUserPIN(strCertID, strUserPIN, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.VerifyUserPIN(strCertID, strUserPIN, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//modify user pin
function ChangeUserPassword(strCertID, oldPwd, newPwd, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.ChangeUserPIN(strCertID, oldPwd, newPwd, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//get user pin retry count
function GetUserPINRetryCount(strCertID, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetUserPINRetryCount(strCertID, cb, ctx);
  } else {
    return $myErrorRtnFunc(0, cb, ctx);
  }
}

// get cert basic info
function GetCertBasicinfo(strCert, Type, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetCertInfo(strCert, Type, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

// get cert extend info
function GetExtCertInfoByOID(strCert, strOID, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetCertInfoByOID(strCert, strOID, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

// get cert entity id
function GetCertEntity(strCert, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetCertEntity(strCert, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//generate random
function GenerateRandom(RandomLen, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GenRandom(RandomLen, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//sign data
function SignedData(strCertID, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SignData(strCertID, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//verify signed data
function VerifySignedData(strCert, strInData, strSignValue, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.VerifySignedData(strCert, strInData, strSignValue, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//encrypt data by cert
function PubKeyEncrypt(strCert, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.PubKeyEncrypt(strCert, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//decrypt data by private key(not support by gm key)
function PriKeyDecrypt(strCertID, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.PriKeyDecrypt(strCertID, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//sign data with pkcs7 format
function SignByP7(strCertID, strInData, bDetach, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SignDataByP7(strCertID, strInData, bDetach, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//verify pkcs7 signed data
function VerifyDatabyP7(strP7Data, strPlainMsg, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.VerifyDataByP7(strP7Data, strPlainMsg, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//encrypt pkcs7 envlope
function EncodeP7Enveloped(strCert, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.EncyptMessage(strCert, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//decrypt pkcs7 envlope
function DecodeP7Enveloped(strCertID, strP7Envlope, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.DecryptMessage(strCertID, strP7Envlope, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//sign file
function SignFile(strCertID, strFilePath, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SignFile(strCertID, strFilePath, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//verify signed file
function VerifySignFile(strCert, strFilePath, strSignValue, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.VerifySignFile(strCert, strFilePath, strSignValue, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//get symmitric key length
//because xtx and secxv2 secx default symmitric alg is no equal
function GetSymKeyLength(cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetSymKeyLength(cb, ctx);
  } else {
    return $myErrorRtnFunc(24, cb, ctx);
  }
}

//encrypt data by symmitric key
function EncryptData(strKey, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SymEncryptData(strKey, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//decrypt data by symmitric key
function DecryptData(strKey, strInData, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SymDecryptData(strKey, strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

//encrypt file by symmitric key
function EncryptFile(strKey, strInFilePath, strOutFilePath, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SymEncryptFile(strKey, strInFilePath, strOutFilePath, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//decrypt file by symmitric key
function DecryptFile(strKey, strInFilePath, strOutFilePath, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.SymDecryptFile(strKey, strInFilePath, strOutFilePath, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//validate cert
function ValidateCert(strCert, cb, ctx) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.ValidateCert(strCert, cb, ctx);
  } else {
    return $myErrorRtnFunc(false, cb, ctx);
  }
}

//get device type return SOFT or HARD
function GetDeviceType(strCertID, cb, ctx) {
  if ($_$CurrentObj != null && $_$CurrentObj.GetDeviceType != undefined) {
    return $_$CurrentObj.GetDeviceType(strCertID, cb, ctx);
  } else {
    return $myErrorRtnFunc("HARD", cb, ctx);
  }
}

// calculate file's hash
function HashFile(strFilePath, cb, ctx) {
  if ($_$CurrentObj != null && $_$CurrentObj.HashFile != undefined) {
    return $_$CurrentObj.HashFile(strFilePath, cb, ctx);
  }
  return $myErrorRtnFunc("", cb, ctx);
}

// sign hash data only v2.0 or later support
function SignHashData(strCertID, strHashData, ulHashAlg, cb, ctx) {
  if ($_$CurrentObj != null && $_$CurrentObj.SignHashData != undefined) {
    return $_$CurrentObj.SignHashData(strCertID, strHashData, ulHashAlg, cb, ctx);
  }
  return $myErrorRtnFunc("", cb, ctx);
}

// verify signed hash data  only v2.0 or later support
function VerifySignedHashData(strCert, strHashData, ulHashAlg, strSignValue, cb, ctx) {
  if ($_$CurrentObj != null && $_$CurrentObj.VerifySignedHashData != undefined) {
    return $_$CurrentObj.VerifySignedHashData(strCert, strHashData, ulHashAlg, strSignValue, cb, ctx);
  }
  return $myErrorRtnFunc(false, cb, ctx);
}

function GetDateNotBefore(strCertValid) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetDateNotBefore(strCertValid);
  }
  return "";
}

function GetDateNotAfter(strCertValid) {
  if ($_$CurrentObj != null) {
    return $_$CurrentObj.GetDateNotAfter(strCertValid);
  }
  return "";
}

function $loginSignRandomCallBack(retObj) {
  if (retObj.retVal == "") {
    $XTXAlert("客户端签名失败!");
    return;
  }
  var objForm = retObj.ctx.objForm;
  var strAction = retObj.ctx.action;
  objForm.UserSignedData.value = retObj.retVal;
  objForm.action = strAction;
  objForm.submit();
}

function $loginVerifyServerSignatureCallBack(retObj) {
  if (!retObj.retVal) {
    $XTXAlert("验证服务器端信息失败!");
    return;
  }

  var strCertID = retObj.ctx.certID;
  SignedData(strCertID, strServerRan, $loginSignRandomCallBack, retObj.ctx);
}

function $loginCheckCertValidNotAfter(retObj) {
  var notAfterDate = GetDateNotAfter(retObj.retVal);
  var milliseconds = notAfterDate.getTime() - new Date().getTime();
  if (milliseconds < 0) {
    $XTXAlert("您的证书已过期，请尽快到北京数字证书认证中心办理证书更新手续！");
    return;
  }

  days = parseInt(milliseconds / (1000 * 60 * 60 * 24));
  if (days > 0 && days <= 60) {
    $XTXAlert("您的证书还有" + days + "天过期\n请您尽快到北京数字证书认证中心办理证书更新手续！");
  } else if (days == 0) { // 证书有效期天数小于1天
    var hours = parseInt(milliseconds / (1000 * 60 * 60));
    if (hours > 0) {
      $XTXAlert("您的证书还有" + hours + "小时过期\n您尽快到北京数字证书认证中心办理证书更新手续！");
    }
    // 证书有效期小于1小时
    var minutes = parseInt(milliseconds / (1000 * 60));
    if (minutes > 1) {
      $XTXAlert("您的证书还有" + minutes + "分钟过期\n您尽快到北京数字证书认证中心办理证书更新手续！");
    } else {
      $XTXAlert("您的证书已过期，请尽快到北京数字证书认证中心办理证书更新手续！");
      return;
    }
  }

  VerifySignedData(strServerCert, strServerRan, strServerSignedData,
    $loginVerifyServerSignatureCallBack, retObj.ctx);
}

function $loginCheckCertValidNotBefore(retObj) {
  var notBeforeDate = GetDateNotBefore(retObj.retVal);
  var days = parseInt((notBeforeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (days > 0) {
    $XTXAlert("您的证书尚未生效!距离生效日期还剩" + days + "天!");
    return;
  }
  var strUserCert = retObj.ctx.objForm.UserCert.value;
  GetCertBasicinfo(strUserCert, CERT_OID_NOT_AFTER, $loginCheckCertValidNotAfter, retObj.ctx);
}

function $loginGetSignCertCallBack(retObj) {
  var strUserCert = retObj.retVal;
  if (strUserCert == "") {
    $XTXAlert("导出用户证书失败!");
    return;
  }
  retObj.ctx.objForm.UserCert.value = strUserCert;

  GetCertBasicinfo(strUserCert, CERT_OID_NOT_BEFORE, $loginCheckCertValidNotBefore, retObj.ctx);
}

function $loginGetPINRetryCallBack(retObj) {
  var retryCount = Number(retObj.retVal);
  if (retryCount > 0) {
    $XTXAlert("校验证书密码失败!您还有" + retryCount + "次机会重试!");
    return;
  } else if (retryCount == 0) {
    $XTXAlert("您的证书密码已被锁死,请联系BJCA进行解锁!");
    return;
  } else {
    $XTXAlert("登录失败!");
    return;
  }
}

function $loginVerifyPINCallBack(retObj) {
  var strCertID = retObj.ctx.certID;
  var objForm = retObj.ctx.objForm;
  if (!retObj.retVal) {
    GetUserPINRetryCount(strCertID, $loginGetPINRetryCallBack);
    return;
  }
  objForm.ContainerName.value = strCertID;

  GetSignCert(strCertID, $loginGetSignCertCallBack, retObj.ctx);
}

//Form login
function Login(formName, strCertID, strPin, strAction) {
  var objForm = eval(formName);
  if (objForm == null) {
    $XTXAlert("表单错误！");
    return;
  }
  if (strCertID == null || strCertID == "") {
    $XTXAlert("请输入证书密码！");
    return;
  }
  if (strPin == null || strPin == "") {
    $XTXAlert("请输入证书密码！");
    return;
  }

  //Add a hidden item ...
  var strSignItem = "<input type=\"hidden\" name=\"UserSignedData\" value=\"\">";
  if (objForm.UserSignedData == null) {
    objForm.insertAdjacentHTML("BeforeEnd", strSignItem);
  }
  var strCertItem = "<input type=\"hidden\" name=\"UserCert\" value=\"\">";
  if (objForm.UserCert == null) {
    objForm.insertAdjacentHTML("BeforeEnd", strCertItem);
  }
  var strContainerItem = "<input type=\"hidden\" name=\"ContainerName\" value=\"\">";
  if (objForm.ContainerName == null) {
    objForm.insertAdjacentHTML("BeforeEnd", strContainerItem);
  }

  var ctx = {
    certID: strCertID,
    objForm: objForm,
    action: strAction
  };

  VerifyUserPIN(strCertID, strPin, $loginVerifyPINCallBack, ctx);

  return;
}

/*
 * GetKeyPic控件接口
 */
//GetPic class
function CreateGetPicObject() {
  var bOK = $LoadControl("3BC3C868-95B5-47ED-8686-E0E3E94EF366", "OGetPic", "GetPic()", false);
  if (!bOK) {
    return null;
  }

  var o = new Object();

  o.GetPic = function (strContainerName, cb, ctx) {
    var ret = OGetPic.GetPic(strContainerName);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.Hash = function (strInData, cb, ctx) {
    var ret = OGetPic.Hash(strInData)
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ConvertPicFormat = function (strInData, type, cb, ctx) {
    var ret = OGetPic.ConvertPicFormat(strInData, type);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ConvertGif2Jpg = function (strInData, cb, ctx) {
    var ret = OGetPic.ConvertGif2Jpg(strInData);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  o.ConvertPicSize = function (strInData, w, h, cb, ctx) {
    var ret = OGetPic.ConvertPicSize(strInData, w, h);
    return $myOKRtnFunc(ret, cb, ctx);
  };

  return o;
}

function GetPic(strContainerName, cb, ctx) {
  if ($_$GetPicObj != null && $_$GetPicObj.GetPic != undefined) {
    return $_$GetPicObj.GetPic(strContainerName, cb, ctx);
  } else if ($_$WebSocketObj != null && $_$WebSocketObj.GetPic != undefined) {
    return $_$WebSocketObj.GetPic(strContainerName, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

function Hash(strInData, cb, ctx) {
  if ($_$GetPicObj != null && $_$GetPicObj.Hash != undefined) {
    return $_$GetPicObj.Hash(strInData, cb, ctx);
  } else if ($_$WebSocketObj != null && $_$WebSocketObj.Hash != undefined) {
    return $_$WebSocketObj.Hash(strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

function ConvertPicFormat(strInData, type, cb, ctx) {
  if ($_$GetPicObj != null && $_$GetPicObj.ConvertPicFormat != undefined) {
    return $_$GetPicObj.ConvertPicFormat(strInData, type, cb, ctx);
  } else if ($_$WebSocketObj != null && $_$WebSocketObj.ConvertPicFormat != undefined) {
    return $_$WebSocketObj.ConvertPicFormat(strInData, type, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

function ConvertGif2Jpg(strInData, cb, ctx) {
  if ($_$GetPicObj != null && $_$GetPicObj.ConvertGif2Jpg != undefined) {
    return $_$GetPicObj.ConvertGif2Jpg(strInData, cb, ctx);
  } else if ($_$WebSocketObj != null && $_$WebSocketObj.ConvertGif2Jpg != undefined) {
    return $_$WebSocketObj.ConvertGif2Jpg(strInData, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

function ConvertPicSize(strInData, w, h, cb, ctx) {
  if ($_$GetPicObj != null && $_$GetPicObj.ConvertPicSize != undefined) {
    return $_$GetPicObj.ConvertPicSize(strInData, w, h, cb, ctx);
  } else if ($_$WebSocketObj != null && $_$WebSocketObj.ConvertPicSize != undefined) {
    return $_$WebSocketObj.ConvertPicSize(strInData, w, h, cb, ctx);
  } else {
    return $myErrorRtnFunc("", cb, ctx);
  }
}

(function () {
  // don't check return value
  $_$GetPicObj = CreateGetPicObject();


  $_$XTXAppObj = CreateXTXAppObject();
  if ($_$XTXAppObj != null) {
    $_$CurrentObj = $_$XTXAppObj;
    return;
  }

  $_$SecXV2Obj = CreateSecXV2Object();
  if ($_$SecXV2Obj != null) {
    $_$CurrentObj = $_$SecXV2Obj;
    return;
  }

  $_$SecXObj = CreateSecXObject();
  if ($_$SecXObj != null) {
    $_$CurrentObj = $_$SecXObj;
    return;
  }

  $_$WebSocketObj = CreateWebSocketObject();
  if ($_$WebSocketObj != null) {
    $_$CurrentObj = $_$WebSocketObj;
    return;
  }

  $_$CurrentObj = null;

  $XTXAlert("检查证书应用环境出错!");
  return;
})();
