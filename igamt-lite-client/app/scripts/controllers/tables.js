/**
 * Created by Jungyub on 4/01/15.
 */

angular.module('igl').controller('TableListCtrl', function ($scope, $rootScope, Restangular, $filter, $http, $modal, $timeout) {
    $scope.readonly = false;
    $scope.codeSysEditMode = false;
    $scope.saved = false;
    $scope.message = false;
    $scope.params = null;
    $scope.init = function () {
    };

    $scope.addTable = function () {
        $rootScope.newTableFakeId = $rootScope.newTableFakeId - 1;
        var newTable = angular.fromJson({
            id: new ObjectId().toString(),
            type: 'table',
            bindingIdentifier: '',
            name: '',
            version: '',
            oid: '',
            tableType: '',
            stability: '',
            extensibility: '',
            codes: []
        });
        $rootScope.tables.push(newTable);
        $rootScope.tablesMap[newTable.id] = newTable;
        $rootScope.table = newTable;
        $rootScope.recordChangeForEdit2('table', "add", newTable.id,'table', newTable);

    };
    
    
    $scope.makeCodeSystemEditable = function () {
    	$scope.codeSysEditMode = true;
    	$rootScope.newCodeSystemStr = "AAA";
    }
    
    
    $scope.addCodeSystem = function () {
    	console.log($rootScope.newCodeSystemStr);
    	if($rootScope.codeSystems.indexOf(newCodeSystemStr) < 0){
    		if(newCodeSystemStr && newCodeSystemStr !== ''){
    			$rootScope.codeSystems.push(newCodeSystemStr);
    		}
		}
    	newCodeSystemStr = '';
    	$scope.codeSysEditMode = false;
    };
    
    $scope.updateCodeSystem = function (table,codeSystem) {
    	for (var i = 0; i < $rootScope.table.codes.length; i++) {
    		$rootScope.table.codes[i].codeSystem = codeSystem;
    		$scope.recordChangeValue($rootScope.table.codes[i],'codeSystem',$rootScope.table.codes[i].codeSystem,table.id);
    	}
    }

    $scope.addValue = function () {
        $rootScope.newValueFakeId = $rootScope.newValueFakeId ?  $rootScope.newValueFakeId - 1: -1;
        var newValue = {
            id: new ObjectId().toString(),
            type: 'value',
            value: 'newValue' + $rootScope.newValueFakeId,
            label: 'newDescription',
            codeSystem: 'NA',
            codeUsage: 'E'
        };


        $rootScope.table.codes.unshift(newValue);
        var newValueBlock = {targetType:'table', targetId:$rootScope.table.id, obj:newValue};
        if(!$scope.isNewObject('table', 'add', $rootScope.table.id)){
        	$rootScope.recordChangeForEdit2('value', "add", null,'value', newValueBlock);
        }
    };

    $scope.deleteValue = function (value) {
        if (!$scope.isNewValueThenDelete(value.id)) {
            $rootScope.recordChangeForEdit2('value', "delete", value.id,'id', value.id);
        }
        $rootScope.table.codes.splice($rootScope.table.codes.indexOf(value), 1);
    };

    $scope.isNewValueThenDelete = function (id) {
    	if($rootScope.isNewObject('value', 'add',id)){
    		if($rootScope.changes['value'] !== undefined && $rootScope.changes['value']['add'] !== undefined) {
    			for (var i = 0; i < $rootScope.changes['value']['add'].length; i++) {
        			var tmp = $rootScope.changes['value']['add'][i];
        			if (tmp.obj.id === id) {
                        $rootScope.changes['value']['add'].splice(i, 1);
                        if ($rootScope.changes["value"]["add"] && $rootScope.changes["value"]["add"].length === 0) {
                            delete  $rootScope.changes["value"]["add"];
                        }

                        if ($rootScope.changes["value"] && Object.getOwnPropertyNames($rootScope.changes["value"]).length === 0) {
                            delete  $rootScope.changes["value"];
                        }
                        return true;
                   }
        		}
    		}
    		return true;
    	}
    	if($rootScope.changes['value'] !== undefined && $rootScope.changes['value']['edit'] !== undefined) {
    		for (var i = 0; i < $rootScope.changes['value']['edit'].length; i++) {
    			var tmp = $rootScope.changes['value']['edit'][i];
    			if (tmp.id === id) {
                    $rootScope.changes['value']['edit'].splice(i, 1);
                    if ($rootScope.changes["value"]["edit"] && $rootScope.changes["value"]["edit"].length === 0) {
                        delete  $rootScope.changes["value"]["edit"];
                    }

                    if ($rootScope.changes["value"] && Object.getOwnPropertyNames($rootScope.changes["value"]).length === 0) {
                        delete  $rootScope.changes["value"];
                    }
                    return false;
               }
    		}
    		return false;
    	}
        return false;
    };

    $scope.isNewValue = function (id) {
        return $scope.isNewObject('value', 'add', id);
    };

    $scope.isNewTable = function (id) {
        return $scope.isNewObject('table', 'add',id);
    };

    $scope.close = function () {
        $rootScope.table = null;
    };

    $scope.cloneTable = function (table) {
        $rootScope.newTableFakeId = $rootScope.newTableFakeId - 1;
        var newTable = angular.fromJson({
            id:new ObjectId().toString(),
            type: '',
            bindingIdentifier: '',
            name: '',
            version: '',
            oid: '',
            tableType: '',
            stability: '',
            extensibility: '',
            codes: []
        });
        newTable.type = 'table';
        newTable.bindingIdentifier = table.bindingIdentifier + '_' + $rootScope.postfixCloneTable + $rootScope.newTableFakeId;
        newTable.name = table.name + '_' + $rootScope.postfixCloneTable + $rootScope.newTableFakeId;
        newTable.version = table.version;
        newTable.oid = table.oid;
        newTable.tableType = table.tableType;
        newTable.stability = table.stability;
        newTable.extensibility = table.extensibility;

        for (var i = 0, len1 = table.codes.length; i < len1; i++) {
            $rootScope.newValueFakeId = $rootScope.newValueFakeId - 1;
            var newValue = {
                    id: new ObjectId().toString(),
                    type: 'value',
                    value: table.codes[i].value,
                    label: table.codes[i].label,
                    codeSystem: table.codes[i].codeSystem,
                    codeUsage: table.codes[i].codeUsage
                };
            
            newTable.codes.push(newValue);
        }

        $rootScope.tables.push(newTable);
        $rootScope.table = newTable;
        $rootScope.tablesMap[newTable.id] = newTable;
        
        $rootScope.codeSystems = [];
        
        for (var i = 0; i < $rootScope.table.codes.length; i++) {
        	if($rootScope.codeSystems.indexOf($rootScope.table.codes[i].codeSystem) < 0){
        		if($rootScope.table.codes[i].codeSystem && $rootScope.table.codes[i].codeSystem !== ''){
        			$rootScope.codeSystems.push($rootScope.table.codes[i].codeSystem);
        		}
			}
    	}
        
        
        $rootScope.recordChangeForEdit2('table', "add", newTable.id,'table', newTable);
    };

    $scope.recordChangeValue = function (value, valueType, tableId) {
        if (!$scope.isNewTable(tableId)) {
            if (!$scope.isNewValue(value.id)) {
            	$rootScope.recordChangeForEdit2('value', 'edit',value.id,valueType,value);  
            }
        }
    };

    $scope.recordChangeTable = function (table, valueType, value) {
        if (!$scope.isNewTable(table.id)) {
            $rootScope.recordChangeForEdit2('table', 'edit',table.id,valueType,value);            
        }
    };

    $scope.setAllCodeUsage = function (table, usage) {
        for (var i = 0, len = table.codes.length; i < len; i++) {
            if (table.codes[i].codeUsage !== usage) {
                table.codes[i].codeUsage = usage;
                if (!$scope.isNewTable(table.id) && !$scope.isNewValue(table.codes[i].id)) {
                    $rootScope.recordChangeForEdit2('value','edit',table.codes[i].id,'codeUsage',usage);  
                }
            }
        }
    };

    $scope.delete = function (table) {
        $rootScope.references = [];
        angular.forEach($rootScope.segments, function (segment) {
            $rootScope.findTableRefs(table, segment);
        });
        if ($rootScope.references != null && $rootScope.references.length > 0) {
            $scope.abortDelete(table);
        } else {
            $scope.confirmDelete(table);
        }
    };

    $scope.abortDelete = function (table) {
        var modalInstance = $modal.open({
            templateUrl: 'ValueSetReferencesCtrl.html',
            controller: 'ValueSetReferencesCtrl',
            resolve: {
                tableToDelete: function () {
                    return table;
                }
            }
        });
        modalInstance.result.then(function (table) {
            $scope.tableToDelete = table;
        }, function () {
        });
    };

    $scope.confirmDelete = function (table) {
        var modalInstance = $modal.open({
            templateUrl: 'ConfirmValueSetDeleteCtrl.html',
            controller: 'ConfirmValueSetDeleteCtrl',
            resolve: {
                tableToDelete: function () {
                    return table;
                }
            }
        });
        modalInstance.result.then(function (table) {
            $scope.tableToDelete = table;
        }, function () {
        });
    };
});

angular.module('igl').controller('TableModalCtrl', function ($scope) {
    $scope.showModal = false;
    $scope.toggleModal = function () {
        $scope.showModal = !$scope.showModal;
    };
});

angular.module('igl').controller('ConfirmValueSetDeleteCtrl', function ($scope, $modalInstance, tableToDelete, $rootScope) {
    $scope.tableToDelete = tableToDelete;
    $scope.loading = false;
    $scope.delete = function () {
        $scope.loading = true;

        if (!$scope.isNewTableThenDelete(tableToDelete.id)) {
        	$rootScope.recordChangeForEdit2('table', "delete", tableToDelete.id,'id', tableToDelete.id);
        }
        $rootScope.tables.splice($rootScope.tables.indexOf(tableToDelete), 1);
        $rootScope.tablesMap[tableToDelete.id] = undefined;
        
        
        $rootScope.generalInfo.type = 'info';
        $rootScope.generalInfo.message = "Table " + $scope.tableToDelete.bindingIdentifier + " deleted successfully";

        if ($rootScope.table === $scope.tableToDelete) {
            $rootScope.table = null;
        }

        $rootScope.references = [];
        $modalInstance.close($scope.tableToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };




    $scope.isNewTableThenDelete = function (id) {
    	if($rootScope.isNewObject('table', 'add', id)){
    		if($rootScope.changes['table'] !== undefined && $rootScope.changes['table']['add'] !== undefined) {
    			for (var i = 0; i < $rootScope.changes['table']['add'].length; i++) {
        			var tmp = $rootScope.changes['table']['add'][i];
        			if (tmp.id == id) {
                        $rootScope.changes['table']['add'].splice(i, 1);
                        if ($rootScope.changes["table"]["add"] && $rootScope.changes["table"]["add"].length === 0) {
                            delete  $rootScope.changes["table"]["add"];
                        }

                        if ($rootScope.changes["table"] && Object.getOwnPropertyNames($rootScope.changes["table"]).length === 0) {
                            delete  $rootScope.changes["table"];
                        }
                        return true;
                   }
        		}
    		}
    		return true;
    	}
    	if($rootScope.changes['table'] !== undefined && $rootScope.changes['table']['edit'] !== undefined) {
    		for (var i = 0; i < $rootScope.changes['table']['edit'].length; i++) {
    			var tmp = $rootScope.changes['table']['edit'][i];
    			if (tmp.id === id) {
                    $rootScope.changes['table']['edit'].splice(i, 1);
                    if ($rootScope.changes["table"]["edit"] && $rootScope.changes["table"]["edit"].length === 0) {
                        delete  $rootScope.changes["table"]["edit"];
                    }

                    if ($rootScope.changes["table"] && Object.getOwnPropertyNames($rootScope.changes["table"]).length === 0) {
                        delete  $rootScope.changes["table"];
                    }
                    return false;
               }
    		}
    		return false;
    	}
        return false;
    };
});

angular.module('igl').controller('ValueSetReferencesCtrl', function ($scope, $modalInstance, tableToDelete) {

    $scope.tableToDelete = tableToDelete;

    $scope.ok = function () {
        $modalInstance.close($scope.tableToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});