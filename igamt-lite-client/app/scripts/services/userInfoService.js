'use strict';

angular.module('igl').factory('userInfo', ['$resource',
    function ($resource) {
        return $resource('/api/accounts/cuser');
    }
]);

angular.module('igl').factory('userLoaderService', ['userInfo', '$q',
    function (userInfo, $q) {
        var load = function() {
            var delay = $q.defer();
            userInfo.get({},
                function(theUserInfo) {
                    delay.resolve(theUserInfo);
                },
                function() {
                    delay.reject('Unable to fetch user info');
                }
            );
            return delay.promise;
        };
        return {
            load: load
        };
    }
]);

angular.module('igl').factory('userInfoService', ['$cookieStore', 'userLoaderService',
    function($cookieStore, userLoaderService) {
        var currentUser = null;
        var supervisor = false,
        authorizedVendor = false,
        provider = false,
        admin = false,
        id = null,
        username = '';

        //console.log("USER ID=", $cookieStore.get('userID'));
       
        var loadFromCookie = function() {
            //console.log("UserID=", $cookieStore.get('userID'));

            id = $cookieStore.get('userID');
            username = $cookieStore.get('username');
            provider = $cookieStore.get('provider');
            supervisor = $cookieStore.get('supervisor');
            authorizedVendor = $cookieStore.get('authorizedVendor');
            admin = $cookieStore.get('admin');
        };

        var saveToCookie = function() {
            $cookieStore.put('accountID', id);
            $cookieStore.put('username', username);
            $cookieStore.put('provider', provider);
            $cookieStore.put('supervisor', supervisor);
            $cookieStore.put('authorizedVendor', authorizedVendor);
            $cookieStore.put('admin', admin);
        };

        var clearCookie = function() {
            $cookieStore.remove('accountID');
            $cookieStore.remove('username');
            $cookieStore.remove('provider');
            $cookieStore.remove('supervisor');
            $cookieStore.remove('authorizedVendor');
            $cookieStore.remove('admin');
            $cookieStore.remove('hthd');
        };

        var saveHthd = function(header) {
            $cookieStore.put('hthd', header);
        };

        var getHthd = function(header) {
            return $cookieStore.get('hthd');
        };

        var hasCookieInfo =  function() {
            if ( $cookieStore.get('username') === '' ) {
                return false;
            }
            else {
                return true;
            }
        };

        var getAccountID = function() {
            if ( isAuthenticated() ) {
                return currentUser.accountId.toString();
            }
            return '0';
        };

        var isAdmin = function() {
            return admin;
        };

        var isProvider = function() {
            return provider;
        };

        var isAuthorizedVendor = function() {
            return authorizedVendor;
        };

        var isCustomer = function() {
            return (provider || authorizedVendor);
        };

        var isSupervisor = function() {
            return supervisor;
        };

        var isAuthenticated = function() {
            if ( angular.isObject(currentUser) && currentUser.authenticated === true) {
                return true;
            }
            else {
                return false;
            }
        };

        var loadFromServer = function() {
            if ( !isAuthenticated() ) {
                userLoaderService.load().then(setCurrentUser);
            }
        };

        var setCurrentUser = function(newUser) {
            currentUser = newUser;
            //console.log("NewUser=", newUser);
            if ( angular.isObject(currentUser) ) {
//                console.log("currentUser -> "+currentUser);
                username = currentUser.username;
                id = currentUser.accountId;
                if ( angular.isArray(currentUser.authorities)) {
                    angular.forEach(currentUser.authorities, function(value, key){
                        switch(value.authority)
                        {
                        case 'user':
                            //console.log("user found");
                            break;
                        case 'admin':
                            admin = true;
                            //console.log("admin found");
                            break;
                        case 'provider':
                            provider = true;
                            //console.log("provider found");
                            break;
                        case 'authorizedVendor':
                            authorizedVendor = true;
                            //console.log("authorizedVendor found");
                            break;
                        case 'supervisor':
                            supervisor = true;
                            //console.log("supervisor found");
                            break;
                        default:
                            //console.log("default");
                        }
                    });
                }
                //saveToCookie();
            }
            else {
                supervisor = false;
                provider = false;
                admin = false;
                authorizedVendor = false;
                //clearCookie();
            }
        };

        var getUsername = function() {
            return username;
        };

        return {
            saveHthd: saveHthd,
            getHthd: getHthd,
            hasCookieInfo: hasCookieInfo,
            loadFromCookie: loadFromCookie,
            getAccountID: getAccountID,
            isAdmin: isAdmin,
            isProvider: isProvider,
            isAuthorizedVendor: isAuthorizedVendor,
            isCustomer: isCustomer,
            isAuthenticated: isAuthenticated,
            isSupervisor: isSupervisor,
            setCurrentUser: setCurrentUser,
            loadFromServer: loadFromServer,
            getUsername: getUsername
        };
    }
]);
