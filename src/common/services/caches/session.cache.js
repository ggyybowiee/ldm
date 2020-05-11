(function () {
  'use strict';

  angular
    .module('lachesis-common')
    .factory('sessionService', sessionService);

  /** @ngInject */
  function sessionService($q, $rootScope, authService, userService, roleService, sysRest, dicService, deptRest, _) {
    var profile, auths, resources, keys, server, dic, conf, obic, hospitalInfo;
    var service = {
      setProfile: setProfile,
      getProfile: getProfile,
      clearProfile: clearProfile,
      setAuths: setAuths,
      getAuths: getAuths,
      clearAuth: clearAuths,
      setResources: setResources,
      getResources: getResources,
      clearResources: clearResources,
      setKeys: setKeys,
      getKeys: getKeys,
      clearKeys: clearKeys,
      setServer: setServer,
      getServer: getServer,
      clearServer: clearServer,
      setDicHelper: setDicHelper,
      getDicHelper: getDicHelper,
      clearDicHelper: clearDicHelper,
      setConfHelper: setConfHelper,
      getConfHelper: getConfHelper,
      clearConfHelper: clearConfHelper,
      getObservationItemConfig: getObservationItemConfig,
      init: init,
      destroy: destroy,
      changeWard: changeWard,
      getHospitalInfo: getHospitalInfo
    };

    return service;

    function setProfile(p) {
      profile = p;
    }

    function getProfile() {
      return profile;
    }

    function clearProfile() {
      profile = null;
    }

    function setAuths(a) {
      auths = a;
    }

    function getAuths() {
      return auths;
    }

    function clearAuths() {
      auths = null;
    }

    function setResources(r) {
      resources = r;
    }

    function getResources() {
      return resources;
    }

    function clearResources() {
      resources = null;
    }

    function setKeys(k) {
      keys = k;
    }

    function getKeys() {
      return keys;
    }

    function clearKeys() {
      keys = null;
    }

    function setServer(s) {
      server = s;
    }

    function getServer() {
      return server;
    }

    function clearServer() {
      server = null;
    }

    function getHospitalInfo() {
      return hospitalInfo;
    }

    function setHospitalInfo(hos) {
      hospitalInfo = hos;
    }

    function setDicHelper(d) {
      dic = d;
    }

    function getDicHelper() {
      return dic;
    }

    function clearDicHelper() {
      dic = null;
    }

    function setConfHelper(d) {
      conf = d;
    }

    function getConfHelper() {
      return conf;
    }

    function clearConfHelper() {
      conf = null;
    }

    function setObservationItemConfig(o) {
      obic = o;
    }

    function getObservationItemConfig() {
      return obic;
    }

    function clearObservationItemConfig() {

    }

    function changeWard(ward) {
      var profileTemp = getProfile();

      localStorage.setItem('wardCode', ward.wardCode);
      localStorage.setItem('wardName', ward.wardName);

      setProfile(_.assign({}, profileTemp, {
        wardCode: ward.wardCode,
        wardName: ward.wardName
      }));
    }

    function init() {
      var token = authService.getToken(),
        role = authService.getRole();
      var requests = [];

      var rp = roleService.getResources();
      var sp = sysRest.getServer();
      var ds = dicService.getDic();
      var npci = sysRest.getObservationItemConfig({
        typeList: ['vital']
      });
      var hosInfoRequest = sysRest.getHosInfo();

      if (!token) {
        requests = [rp, sp, ds, npci, hosInfoRequest];
      } else {
        var ap = roleService.getRoleResources(role.roleCode);
        var pp = userService.getUser(token.userCode);
        var kp = userService.getUserAppKey(token.userCode);

        requests = [pp, ap, rp, kp, sp, ds, npci, hosInfoRequest];
      }

      return $q.all(requests).then(function (results) {
        var profile = token ? results[0].plain() : {};
        var dic = token ? results[5].plain() : results[2].plain();
        var serverData = token ? results[4].plain() : results[1];
        var authData = token ? results[1].plain() : {};
        var npciData = token ? results[6].plain() : results[3].plain();
        var hosData = token ? results[7].plain() : results[4].plain();

        // lcoalstorage中存储的病区编号，如果有则从获取，没有则取默认病区，没有再取wards的第一个
        var firstWard;

        if (profile.wardCode && profile.wardCode !== "") {
          firstWard = {
            wardCode: profile.wardCode,
            wardName: profile.wardName || _.chain(token.wards).find({
              wardCode: profile.wardCode
            }).get('wardName').value()
          };
        } else if (token && token.wards && token.wards[0]) {
          firstWard = token.wards[0];
        } else {
          firstWard = {};
        }

        var wardCode = localStorage.getItem('wardCode') || firstWard.wardCode;
        var wardName = localStorage.getItem('wardName') || firstWard.wardName;

        var newProfile = _.assign({}, profile, {
          wardCode: wardCode,
          wardName: wardName
        });
        window.localStorage.setItem('profile', JSON.stringify(newProfile));
        setProfile(newProfile);
        setAuths(authData);

        if (token) {
          setResources(results[2].plain());
          setKeys(results[3].plain());
        }

        setServer(serverData);
        setDicHelper({
          dic: dic.data.dicInfo,
          getDicName: function (type, dicCode) {
            var match = _.find(this.dic[type], function (item) {
              return item.dicCode == dicCode;
            });
            return match ? match.dicName : '';
          },
          getDicCode: function (type, dicName) {
            var match = _.find(this.dic[type], function (item) {
              return item.dicName == dicName;
            });
            return match ? match.dicCode : '';
          },
          getDictionary: function (dicType) {
            var dictionary = {};
            _.forEach(this.dic[dicType], function (item) {
              dictionary[item.dicCode] = item;
            })

            return dictionary;
          }
        });
        setConfHelper({
          conf: dic.data.sysConfig,
          getConfName: function (type, configCode) {
            var match = _.find(this.dic[type], function (item) {
              return item.configCode == configCode;
            });
            return match ? match.configDesc : '';
          },
          getConfCode: function (type, configCode) {
            var match = _.find(this.conf[type], function (item) {
              return item.configCode == configCode;
            });
            return match ? match.configType : '';
          }
        });

        var obic = {};
        _.forEach(npciData, function (obicItem) {
          obic[obicItem.itemCode] = obicItem;
        })
        setObservationItemConfig(obic);

        setHospitalInfo({
          hospitalName: hosData.hosDisplayName,
          hospitalLogo: hosData.hosLogoPath
        });

      }, function () {
        $rootScope.$broadcast('toast', {
          type: 'error',
          content: '账号初始化失败，请联系管理员'
        });
        $rootScope.$broadcast('logout');
        throw new Error('init error');
      });
    }

    function destroy() {
      clearProfile();
      clearAuths();
      clearResources();
      clearKeys();
      clearServer();
      clearObservationItemConfig();
    }

  }
})();
