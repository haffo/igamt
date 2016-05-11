/**
 * http://usejsdoc.org/
 */
angular.module('igl').factory('SectionSvc', function($http, $q,userInfoService) {
	var svc = this;
    svc.save = function (id, section) {
        var delay = $q.defer();
        $http.post('api/igdocuments/'+ id+ '/section/save', section).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            delay.resolve(saveResponse);
        }, function (error) {
            delay.reject(error);
        });
        return delay.promise;
    };

    svc.delete = function (id, sectionId) {
        var delay = $q.defer();
        $http.post('api/igdocuments/'+ id+ '/section/delete', {params:{sectionId: sectionId}}).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            delay.resolve(saveResponse);
        }, function (error) {
            delay.reject(error);
        });
        return delay.promise;
    };

    return svc;
});