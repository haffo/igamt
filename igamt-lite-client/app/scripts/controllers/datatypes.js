/**
 * Created by haffo on 2/13/15.
 */




angular.module('igl')
    .controller('DatatypeListCtrl', function ($scope, $rootScope, Restangular, ngTreetableParams,$filter) {
        $scope.loading = false;
        $scope.loadingSelection = false;
        $scope.readonly = false;
        $scope.saved = false;
        $scope.message = false;
        $scope.params = null;
        $scope.treeRoot = null;

        $scope.tmpDatatypes =[].concat($rootScope.datatypes);
        $scope.backUp = null;
        $scope.init = function () {
            $scope.loading = true;
            $scope.params = new ngTreetableParams({
                getNodes: function (parent) {
//                    return parent && parent !== null ? parent.datatype ? parent.datatype.children : $rootScope.datatype !== null ? $rootScope.datatype.children: []:[];
                    return parent && parent.datatype? parent.datatype.children : $rootScope.datatype != null ? $rootScope.datatype.children:[];

                },
                getTemplate: function (node) {
                    return 'DatatypeEditTree.html';
                }
            });
            $scope.loading = false;
        };
//

//        $scope.orderByPosition = function(obj){
//            if(obj.children){
//                $filter('orderBy')(obj.children, 'position');
//                angular.forEach(obj.children, function (component) {
//                    $scope.orderByPosition(component);
//                });
//            }else if(obj.datatype){
//                $scope.orderByPosition(obj.datatype);
//            }
//        };

        $scope.select = function (datatype) {
            $scope.readonly = true;
            $scope.loadingSelection = true;
            $scope.backUp = angular.copy(datatype);
            $rootScope.datatype = datatype;
            $rootScope.datatype["type"] = "datatype";
            $scope.treeRoot = {children:[$rootScope.datatype ]};
//            $scope.orderByPosition($rootScope.datatype);
            $scope.backUp = datatype;
            if ($scope.params)
                $scope.params.refresh();
            $scope.loadingSelection = false;
        };

//        $scope.edit = function (datatype) {
//            $scope.readonly = false;
//            $scope.loadingSelection = true;
//            $rootScope.datatype = angular.copy(datatype);
//            $scope.treeRoot = {children:[$rootScope.datatype ]};
//            $scope.backUp = datatype;
//            if ($scope.params)
//                $scope.params.refresh();
//            $scope.loadingSelection = false;
//        };

        $scope.clone = function (datatype) {
            $scope.readonly = false;
            $scope.loadingSelection = true;
            //TODO: call server
            $scope.backUp = datatype;
            $scope.datatype = angular.copy(datatype);
            $scope.treeRoot = {children:[$rootScope.datatype ]};
            if ($scope.params)
                $scope.params.refresh();
            $scope.loadingSelection = false;
        };


        $scope.reset = function () {
            $scope.loadingSelection = true;
            $scope.message = "Datatype " + $scope.backUp.label + " reset successfully";
            $rootScope.datatype = angular.extend($rootScope.datatype, $scope.backUp);
            $scope.treeRoot = null;
            $scope.loadingSelection = false;
        };


        $scope.delete = function (datatype) {
            //TODO: Check that there is no reference
            $scope.loadingSelection = true;
            var index = $rootScope.datatypes.indexOf(datatype);
            if (index > -1) $scope.datatypes.splice(index, 1);
            $scope.message = "Datatype " + $scope.backUp.label + " deleted successfully";
            $rootScope.datatype = null;
            $scope.backUp = null;
            $scope.treeRoot = null;
        };

//        $scope.save = function () {
//            $scope.loadingSelection = true;
//            $scope.backUp = angular.extend($scope.backUp,$rootScope.datatype);
//            //TODO: call server to save
//            $scope.message = "Datatype " + $scope.backUp.label + " saved successfully";
//            $rootScope.datatype = null;
//            $scope.treeRoot = null;
//            $scope.saved = true;
//        };


        $scope.hasChildren = function(node){
            return node && node != null && node.datatype && node.datatype.children != null && node.datatype.children.length >0;
        };


        $scope.goToTable = function(table){

        };

    });



