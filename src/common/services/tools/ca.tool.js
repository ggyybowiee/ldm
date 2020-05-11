

(function() {
  "use strict";

  angular.module("lachesis-common").factory("caTool", caTool);

  /** @ngInject */
  function caTool($window, _) {
    var service = {
      getCAInfo: getCAInfo,
      getCaPicture: getCaPicture,
      getCAExtendInfo: getCAExtendInfo,
      verifyUsers: verifyUsers
    };

    var OID = {
      RSA: '2.16.840.1.113732.2',
      SM2: '1.2.156.112562.2.1.1.1'
    };

    function getStrCerts (users) {
      return Promise.all(_.map(users, function (user) {
        return getStrCert(user.certId);
      }));
    }

    function getCaPictures (users) {
      return Promise.all(_.map(users, function (user) {
        return getCaPicture(user.certId);
      }));
    }

    function getExtendInfos (users) {
      return Promise.all(_.map(users, function (user) {
        return getCAExtendInfo(user.strCert);
      }));
    }

    function callbackForUserList(resolve, reject) {
      return function (response) {
        var value = response.retVal;

        if (!value) {
          reject();
          return null;
        }

        var users = _.chain(value)
          .split('&&&')
          .compact()
          .map(function (item) {
            var splitedNameAndCertId = item.split('||');

            return {
              userName: splitedNameAndCertId[0],
              certId: splitedNameAndCertId[1]
            };
          })
          .value();

        getCaPictures(users).then(function(pictures) {
          return _.map(users, function(userItem, index) {
            return _.assign({}, userItem, {
              png: pictures[index]
            });
          });
        }).then(function (response) {
          return getStrCerts(response).then(function(usersWithCertStr) {
            console.log(response, usersWithCertStr);
            return _.map(response, function(userItem, index) {
              return _.assign({}, userItem, {
                strCert: usersWithCertStr[index]
              });
            });
          });
        })
        .then(function (response) {
          return getExtendInfos(response).then(function(usersWithSF) {
            console.log(response, usersWithSF);
            return _.map(response, function(userItem, index) {
              return _.assign({}, userItem, {
                SF: usersWithSF[index]
              });
            });
          });
        })
        .then(resolve)
        .catch(function (error) {
          console.log(error);
        });
      };
    }

    /**
     * @return
     * [{
     *   png,
     *   userName,
     *   certId,
     *   strCert,
     *   SF
     * }]
     */
    function getCAInfo() {
      return new Promise(function (resolve, reject) {
        window.GetUserList(callbackForUserList(resolve, reject));
      }).catch(function (error) {
        console.log(error);
      });
    }

    function getStrCert(certId) {
      return new Promise(function (resolve, reject) {
        window.GetSignCert(certId, function (response) {
          resolve(response.retVal);
        });
      }).catch(function (error) {
        console.log(error);
      });
    }

    function getCAExtendInfo(strCert) {
      return new Promise(function (resolve, reject) {
        getCertBasicInfo(strCert, 3).then(function (response) {
          var oid = _.get(OID, response || response.retVal);
          window.GetExtCertInfoByOID(strCert, oid, function (res) {
            resolve(res.retVal);
          });
        });
      }).catch(function (error) {
        console.log(error);
      });
    }

    function getCertBasicInfo(strCert, type) {
      return new Promise(function (resolve, reject) {
        window.GetCertBasicinfo(strCert, type, function(response) {
          resolve(response.retVal);
        });
      }).catch(function (error) {
        console.log(error);
      });
    }

    function getCaPicture(certId) {
      var BASE64 = 'data:image/png;base64,';

      return new Promise(function (resolve, reject) {
        window.GetPic(certId, function (retObj) {
          if (retObj.retVal === '') {
            reject();

            return false;
          }

          window.ConvertPicFormat(retObj.retVal, 3, function (response) {
            if (response.retVal === '') {
              reject();
              return false;
            }

            resolve(BASE64 + response.retVal);
          });
        });
      }).catch(function (error) {
        console.log(error);
      });
    }

    function verifyUsers(users, pin) {
      return new Promise(function (resolve) {
        for (var i = 0; i < users.length; i += 1) {
          var certId = _.get(users, [i, 'certId']);

          window.VerifyUserPIN(certId, pin, function (result) {
            console.log(result);
            if (result.retVal) {
              resolve(certId);
            } else if (i === users.length - 1) {
              resolve(null);
            }
          });
        }
      }).catch(function (error) {
        console.log(error);
      });
    }

    return service;
  }
})();

