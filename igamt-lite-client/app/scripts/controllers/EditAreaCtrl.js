angular.module('igl')
    .controller('EditAreaCtrl', function ($scope, $rootScope, CloneDeleteSvc, ToCSvc,SectionSvc) {

        $scope.init = function(){
            if($scope.editForm) {
                $scope.editForm.$setPristine();
                $scope.editForm.$dirty = false;
                console.log("=====> set $dirty to false")
            }
        };

        $rootScope.$on("event:initEditArea", function (event) {
            $scope.init();
        });

        $scope.$watch(
            function(){
              return $scope.editForm.$dirty;
            },
            function handleFormState( newValue) {
                if(newValue){
                    $rootScope.recordChanged();
                }else{
                    $rootScope.clearChanges();
                }
            }
        );



});