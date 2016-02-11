/**
 * Created by haffo on 2/13/15.
 */

angular.module('igl')
    .controller('SegmentListCtrl', function ($scope, $rootScope, Restangular, ngTreetableParams, CloneDeleteSvc, $filter, $http, $modal, $timeout) {
//        $scope.loading = false;
        $scope.readonly = false;
        $scope.saved = false;
        $scope.message = false;
        $scope.segmentCopy = null;

        $scope.reset = function () {
//            $scope.loadingSelection = true;
//            $scope.message = "Segment " + $scope.segmentCopy.label + " reset successfully";
//            angular.extend($rootScope.segment, $scope.segmentCopy);
//             $scope.loadingSelection = false;
        };

        $scope.close = function () {
            $rootScope.segment = null;
            $scope.refreshTree();
            $scope.loadingSelection = false;
        };
        
        $scope.cloneSegmentFlavor = function(segment) {
        		CloneDeleteSvc.cloneSegmentFlavor(segment);
        }

        $scope.delete = function (segment) {
        		CloneDeleteSvc.deleteSegment(segment.id);
			$rootScope.$broadcast('event:SetToC');
        };
        
        $scope.hasChildren = function (node) {
            return node && node != null && ((node.fields && node.fields.length > 0 ) || (node.datatype && $rootScope.getDatatype(node.datatype) && $rootScope.getDatatype(node.datatype).components && $rootScope.getDatatype(node.datatype).components.length > 0));
        };


        $scope.validateLabel = function (label, name) {
            if (label && !label.startsWith(name)) {
                return false;
            }
            return true;
        };

        $scope.onDatatypeChange = function (node) {
            $rootScope.recordChangeForEdit2('field', 'edit', node.id, 'datatype', node.datatype);
            $scope.refreshTree();
        };

        $scope.refreshTree = function () {
            if ($scope.segmentsParams)
                $scope.segmentsParams.refresh();
        };

        $scope.goToTable = function (table) {
            $scope.$emit('event:openTable', table);
        };

        $scope.goToDatatype = function (datatype) {
            $scope.$emit('event:openDatatype', datatype);
        };

        $scope.deleteTable = function (node) {
            node.table = null;
            $rootScope.recordChangeForEdit2('field', 'edit', node.id, 'table', null);
        };

        $scope.mapTable = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'TableMappingSegmentCtrl.html',
                controller: 'TableMappingSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.findDTByComponentId = function (componentId) {
            return $rootScope.parentsMap && $rootScope.parentsMap[componentId] ? $rootScope.parentsMap[componentId].datatype : null;
        };

        $scope.isSub = function (component) {
            return $scope.isSubDT(component);
        };

        $scope.isSubDT = function (component) {
            return component.type === 'component' && $rootScope.parentsMap && $rootScope.parentsMap[component.id] && $rootScope.parentsMap[component.id].type === 'component';
        };

        $scope.managePredicate = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'PredicateSegmentCtrl.html',
                controller: 'PredicateSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.manageConformanceStatement = function (node) {
            var modalInstance = $modal.open({
                templateUrl: 'ConformanceStatementSegmentCtrl.html',
                controller: 'ConformanceStatementSegmentCtrl',
                windowClass: 'app-modal-window',
                resolve: {
                    selectedNode: function () {
                        return node;
                    }
                }
            });
            modalInstance.result.then(function (node) {
                $scope.selectedNode = node;
            }, function () {
            });
        };

        $scope.show = function (segment) {
            return true;
        };

        $scope.countConformanceStatements = function (position) {
            var count = 0;
            if ($rootScope.segment != null) {
                for (var i = 0, len1 = $rootScope.segment.conformanceStatements.length; i < len1; i++) {
                    if ($rootScope.segment.conformanceStatements[i].constraintTarget.indexOf(position + '[') === 0)
                        count = count + 1;
                }
            }
            return count;
        };

        $scope.countPredicate = function (position) {
            if ($rootScope.segment != null) {
                for (var i = 0, len1 = $rootScope.segment.predicates.length; i < len1; i++) {
                    if ($rootScope.segment.predicates[i].constraintTarget.indexOf(position + '[') === 0)
                        return 1;
                }
            }
            return 0;
        };
    });

angular.module('igl')
    .controller('SegmentRowCtrl', function ($scope, $filter) {
        $scope.formName = "form_" + new Date().getTime();
    });

angular.module('igl').controller('TableMappingSegmentCtrl', function ($scope, $modalInstance, selectedNode, $rootScope) {

    $scope.selectedNode = selectedNode;
    $scope.selectedTable = null;
    if (selectedNode.table != undefined) {
        $scope.selectedTable = $rootScope.tablesMap[selectedNode.table];
    }

    $scope.selectTable = function (table) {
        $scope.selectedTable = table;
    };

    $scope.mappingTable = function () {
        $scope.selectedNode.table = $scope.selectedTable.id;
        $rootScope.recordChangeForEdit2('field', 'edit', $scope.selectedNode.id, 'table', $scope.selectedNode.table);
        $scope.ok();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

});

angular.module('igl').controller('PredicateSegmentCtrl', function ($scope, $modalInstance, selectedNode, $rootScope) {
    $scope.selectedNode = selectedNode;
    $scope.constraintType = 'Plain';
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = '';
    $scope.newComplexConstraintClassification = 'E';
    $scope.newComplexConstraint = [];
    
    $scope.newConstraint = angular.fromJson({
    	segment: '',
        field_1: null,
        component_1: null,
        subComponent_1: null,
        field_2: null,
        component_2: null,
        subComponent_2: null,
        verb: null,
        contraintType: null,
        value: null,
        trueUsage: null,
        falseUsage: null,
        valueSetId: null,
        bindingStrength: 'R',
        bindingLocation: '1',
        constraintClassification: 'E'
    });
    $scope.newConstraint.segment = $rootScope.segment.name;
    
    $scope.initPredicate = function () {
    	$scope.newConstraint = angular.fromJson({
        	segment: '',
            field_1: null,
            component_1: null,
            subComponent_1: null,
            field_2: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            contraintType: null,
            value: null,
            trueUsage: null,
            falseUsage: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1',
            constraintClassification: 'E'
        });
        $scope.newConstraint.segment = $rootScope.segment.name;
    }
    
    $scope.deletePredicate = function (predicate) {
        $rootScope.segment.predicates.splice($rootScope.segment.predicates.indexOf(predicate), 1);
        $rootScope.segmentPredicates.splice($rootScope.segmentPredicates.indexOf(predicate), 1);
        if (!$scope.isNewCP(predicate.id)) {
            $rootScope.recordChangeForEdit2('predicate', "delete", predicate.id, 'id', predicate.id);
        }
    };
    
    $scope.deletePredicateForComplex = function (predicate) {
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf(predicate), 1);
    };

    $scope.isNewCP = function (id) {
        if ($rootScope.isNewObject("predicate", "add", id)) {
            if ($rootScope.changes['predicate'] !== undefined && $rootScope.changes['predicate']['add'] !== undefined) {
                for (var i = 0; i < $rootScope.changes['predicate']['add'].length; i++) {
                    var tmp = $rootScope.changes['predicate']['add'][i];
                    if (tmp.obj.id === id) {
                        $rootScope.changes['predicate']['add'].splice(i, 1);

                        if ($rootScope.changes["predicate"]["add"] && $rootScope.changes["predicate"]["add"].length === 0) {
                            delete  $rootScope.changes["predicate"]["add"];
                        }

                        if ($rootScope.changes["predicate"] && Object.getOwnPropertyNames($rootScope.changes["predicate"]).length === 0) {
                            delete  $rootScope.changes["predicate"];
                        }


                        return true;
                    }
                }
            }
            return true;
        }
        return false;
    };
    
    $scope.changeConstraintType = function () {
    	$scope.newConstraint = angular.fromJson({
    		segment: '',
            field_1: null,
            component_1: null,
            subComponent_1: null,
            field_2: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            contraintType: null,
            value: null,
            trueUsage: null,
            falseUsage: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1',
            constraintClassification: 'E'
	    });
		$scope.newConstraint.segment = $rootScope.segment.name;
		
    	if($scope.constraintType === 'Complex'){
    		$scope.newComplexConstraint = [];
    		$scope.newComplexConstraintId = '';
    		$scope.newComplexConstraintClassification = 'E';
    	}
    }

    $scope.updateField_1 = function () {
        $scope.newConstraint.component_1 = null;
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateField_2 = function () {
        $scope.newConstraint.component_2 = null;
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };


    $scope.deletePredicateByTarget = function () {
        for (var i = 0, len1 = $rootScope.segment.predicates.length; i < len1; i++) {
            if ($rootScope.segment.predicates[i].constraintTarget.indexOf($scope.selectedNode.position + '[') === 0) {
                $scope.deletePredicate($rootScope.segment.predicates[i]);
                return true;
            }
        }
        return false;
    };
    
    $scope.addComplexConformanceStatement = function(){
        $scope.deletePredicateByTarget();
        $scope.complexConstraint.constraintId = $scope.newConstraint.segment + '-' + $scope.selectedNode.position;
        $scope.complexConstraint.constraintClassification = $scope.newComplexConstraintClassification;
        $rootScope.segment.predicates.push($scope.complexConstraint);
        $rootScope.segmentPredicates.push($scope.complexConstraint);
        var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: $scope.complexConstraint};
        $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
        
        $scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.complexConstraint), 1);
        
        $scope.complexConstraint = null;
        $scope.newComplexConstraintClassification = 'E';
    };
    
    $scope.compositeConformanceStatements = function(){
    	if($scope.compositeType === 'AND'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'AND(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: '['+ $scope.firstConstraint.description + '] ' + 'AND' + ' [' + $scope.secondConstraint.description + ']',
                    trueUsage: $scope.firstConstraint.trueUsage,
                    falseUsage: $scope.firstConstraint.falseUsage,
                    assertion: '<AND>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</AND>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}else if($scope.compositeType === 'OR'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'OR(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: '['+ $scope.firstConstraint.description + '] ' + 'OR' + ' [' + $scope.secondConstraint.description + ']',
                    trueUsage: $scope.firstConstraint.trueUsage,
                    falseUsage: $scope.firstConstraint.falseUsage,
                    assertion: '<OR>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</OR>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}else if($scope.compositeType === 'IFTHEN'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'IFTHEN(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: 'IF ['+ $scope.firstConstraint.description + '] ' + 'THEN ' + ' [' + $scope.secondConstraint.description + ']',
                    trueUsage: $scope.firstConstraint.trueUsage,
                    falseUsage: $scope.firstConstraint.falseUsage,
                    assertion: '<IMPLY>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</IMPLY>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}
    	
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.firstConstraint), 1);
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.secondConstraint), 1);
    	
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
    };

    $scope.updatePredicate = function () {
        $rootScope.newPredicateFakeId = $rootScope.newPredicateFakeId - 1;
        if($scope.constraintType === 'Plain'){
        	$scope.deletePredicateByTarget();
        }

        var position_1 = $scope.genPosition($scope.newConstraint.segment, $scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        var position_2 = $scope.genPosition($scope.newConstraint.segment, $scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        var location_1 = $scope.genLocation($scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        var location_2 = $scope.genLocation($scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);

        if (position_1 != null) {
            if ($scope.newConstraint.contraintType === 'valued') {
                if($scope.constraintType === 'Plain'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType,
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<Presence Path=\"' + location_1 + '\"/>'
                    };
                	
                	$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
                }else if ($scope.constraintType === 'Complex'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType,
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<Presence Path=\"' + location_1 + '\"/>'
                    };
                	$scope.newComplexConstraint.push(cp);
                }
            } else if ($scope.newConstraint.contraintType === 'a literal value') {
                if($scope.constraintType === 'Plain'){
                    var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' \'' + $scope.newConstraint.value + '\'.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PlainText Path=\"' + location_1 + '\" Text=\"' + $scope.newConstraint.value + '\" IgnoreCase="false"/>'
                        };

                	$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
                }else if ($scope.constraintType === 'Complex'){
                    var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' \'' + $scope.newConstraint.value + '\'.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PlainText Path=\"' + location_1 + '\" Text=\"' + $scope.newConstraint.value + '\" IgnoreCase="false"/>'
                        };

                	$scope.newComplexConstraint.push(cp);
                }
            } else if ($scope.newConstraint.contraintType === 'one of list values') {
                if($scope.constraintType === 'Plain'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<StringList Path=\"' + location_1 + '\" CSV=\"' + $scope.newConstraint.value + '\"/>'
                        };
                	$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
                }else if ($scope.constraintType === 'Complex'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<StringList Path=\"' + location_1 + '\" CSV=\"' + $scope.newConstraint.value + '\"/>'
                        };
                	$scope.newComplexConstraint.push(cp);
                }
            } else if ($scope.newConstraint.contraintType === 'one of codes in ValueSet') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.valueSetId + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<ValueSet Path=\"' + location_1 + '\" ValueSetID=\"' + $scope.newConstraint.valueSetId + '\" BindingStrength=\"' + $scope.newConstraint.bindingStrength + '\" BindingLocation=\"' + $scope.newConstraint.bindingLocation +'\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.valueSetId + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<ValueSet Path=\"' + location_1 + '\" ValueSetID=\"' + $scope.newConstraint.valueSetId + '\" BindingStrength=\"' + $scope.newConstraint.bindingStrength + '\" BindingLocation=\"' + $scope.newConstraint.bindingLocation +'\"/>'
                        };
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'formatted value') {
                if($scope.constraintType === 'Plain'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' valid in format: \'' + $scope.newConstraint.value + '\'.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<Format Path=\"' + location_1 + '\" Regex=\"' + $rootScope.genRegex($scope.newConstraint.value) + '\"/>'
                        };
                	$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
                }else if ($scope.constraintType === 'Complex'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' valid in format: \'' + $scope.newConstraint.value + '\'.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<Format Path=\"' + location_1 + '\" Regex=\"' + $rootScope.genRegex($scope.newConstraint.value) + '\"/>'
                        };
                	$scope.newComplexConstraint.push(cp);
                }
            } else if ($scope.newConstraint.contraintType === 'identical to the another node') {
                if($scope.constraintType === 'Plain'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' identical to the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                        };
                	$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
                }else if ($scope.constraintType === 'Complex'){
                	var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' identical to the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                        };
                	$scope.newComplexConstraint.push(cp);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'not-equal to the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="NE" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="NE" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'greater than the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GT" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GT" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'equal to or greater than the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GE" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GE" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'less than the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LT" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LT" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'equal to or less than the another node') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LE" Path2=\"' + location_2 + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than the value of ' + position_2 + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LE" Path2=\"' + location_2 + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'equal to') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="EQ" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="EQ" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'not-equal to') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="NE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="NE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'greater than') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GT" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GT" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'equal to or greater than') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'less than') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LT" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LT" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            } else if ($scope.newConstraint.contraintType === 'equal to or less than') {
            	if($scope.constraintType === 'Plain'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: $scope.newConstraint.segment + '-' + $scope.selectedNode.position,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		$rootScope.segment.predicates.push(cp);
                    $rootScope.segmentPredicates.push(cp);
                    var newCPBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cp};
                    $rootScope.recordChangeForEdit2('predicate', "add", null, 'predicate', newCPBlock);
            	}else if ($scope.constraintType === 'Complex'){
            		var cp = {
                            id: new ObjectId().toString(),
                            constraintId: 'CP' + $rootScope.newPredicateFakeId,
                            constraintTarget: $scope.selectedNode.position + '[1]',
                            constraintClassification: $scope.newConstraint.constraintClassification,
                            description: 'If the value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than ' + $scope.newConstraint.value + '.',
                            trueUsage: $scope.newConstraint.trueUsage,
                            falseUsage: $scope.newConstraint.falseUsage,
                            assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LE" Value=\"' + $scope.newConstraint.value + '\"/>'
                        };
            		
            		$scope.newComplexConstraint.push(cp);
            	}
            }
        }
        
        $scope.initPredicate();
    };

    $scope.genPosition = function (segment, field, component, subComponent) {
        var position = null;
        if (field != null && component == null && subComponent == null) {
            position = segment + '-' + field.position;
        } else if (field != null && component != null && subComponent == null) {
            position = segment + '-' + field.position + '.' + component.position;
        } else if (field != null && component != null && subComponent != null) {
            position = segment + '-' + field.position + '.' + component.position + '.' + subComponent.position;
        }

        return position;
    };

    $scope.genLocation = function (field, component, subComponent) {
        var location = null;
        if (field != null && component == null && subComponent == null) {
            location = field.position + '[1]';
        } else if (field != null && component != null && subComponent == null) {
            location = field.position + '[1].' + component.position + '[1]';
        } else if (field != null && component != null && subComponent != null) {
            location = field.position + '[1].' + component.position + '[1].' + subComponent.position + '[1]';
        }

        return location;
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

});

angular.module('igl').controller('ConformanceStatementSegmentCtrl', function ($scope, $modalInstance, selectedNode, $rootScope) {
    $scope.selectedNode = selectedNode;
    $scope.constraintType = 'Plain';
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = '';
    $scope.newComplexConstraintClassification = 'E';
    $scope.newComplexConstraint = [];

    $scope.newConstraint = angular.fromJson({
        segment: '',
        field_1: null,
        component_1: null,
        subComponent_1: null,
        field_2: null,
        component_2: null,
        subComponent_2: null,
        verb: null,
        constraintId: null,
        contraintType: null,
        value: null,
        valueSetId: null,
        bindingStrength: 'R',
        bindingLocation: '1',
        constraintClassification: 'E'
    });
    $scope.newConstraint.segment = $rootScope.segment.name;
    
    $scope.initConformanceStatement = function () {
    	$scope.newConstraint = angular.fromJson({
            segment: '',
            field_1: null,
            component_1: null,
            subComponent_1: null,
            field_2: null,
            component_2: null,
            subComponent_2: null,
            verb: null,
            constraintId: null,
            contraintType: null,
            value: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1',
            constraintClassification: 'E'
        });
        $scope.newConstraint.segment = $rootScope.segment.name;
    }
    

    $scope.deleteConformanceStatement = function (conformanceStatement) {
        $rootScope.segment.conformanceStatements.splice($rootScope.segment.conformanceStatements.indexOf(conformanceStatement), 1);
        $rootScope.segmentConformanceStatements.splice($rootScope.segmentConformanceStatements.indexOf(conformanceStatement), 1);
        if (!$scope.isNewCS(conformanceStatement.id)) {
            $rootScope.recordChangeForEdit2('conformanceStatement', "delete", conformanceStatement.id, 'id', conformanceStatement.id);
        }
    };
    
    $scope.deleteConformanceStatementForComplex = function (conformanceStatement) {
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf(conformanceStatement), 1);
    };


    $scope.isNewCS = function (id) {
        if ($rootScope.isNewObject("conformanceStatement", "add", id)) {
            if ($rootScope.changes['conformanceStatement'] !== undefined && $rootScope.changes['conformanceStatement']['add'] !== undefined) {
                for (var i = 0; i < $rootScope.changes['conformanceStatement']['add'].length; i++) {
                    var tmp = $rootScope.changes['conformanceStatement']['add'][i];
                    if (tmp.obj.id === id) {
                        $rootScope.changes['conformanceStatement']['add'].splice(i, 1);
                        if ($rootScope.changes["conformanceStatement"]["add"] && $rootScope.changes["conformanceStatement"]["add"].length === 0) {
                            delete  $rootScope.changes["conformanceStatement"]["add"];
                        }

                        if ($rootScope.changes["conformanceStatement"] && Object.getOwnPropertyNames($rootScope.changes["conformanceStatement"]).length === 0) {
                            delete  $rootScope.changes["conformanceStatement"];
                        }
                        return true;
                    }

                }
            }
            return true;
        }
        return false;
    };
    
    $scope.changeConstraintType = function () {
    	$scope.newConstraint = angular.fromJson({
	        segment: '',
	        field_1: null,
	        component_1: null,
	        subComponent_1: null,
	        field_2: null,
	        component_2: null,
	        subComponent_2: null,
	        verb: null,
	        constraintId: null,
	        contraintType: null,
	        value: null,
	        valueSetId: null,
	        bindingStrength: 'R',
	        bindingLocation: '1',
	        constraintClassification: 'E'
	    });
		$scope.newConstraint.segment = $rootScope.segment.name;
		
    	if($scope.constraintType === 'Complex'){
    		$scope.newComplexConstraint = [];
    		$scope.newComplexConstraintId = '';
    		$scope.newComplexConstraintClassification = 'E';
    	}
    }

    $scope.updateField_1 = function () {
        $scope.newConstraint.component_1 = null;
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateComponent_1 = function () {
        $scope.newConstraint.subComponent_1 = null;
    };

    $scope.updateField_2 = function () {
        $scope.newConstraint.component_2 = null;
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.updateComponent_2 = function () {
        $scope.newConstraint.subComponent_2 = null;
    };

    $scope.genPosition = function (segment, field, component, subComponent) {
        var position = null;
        if (field != null && component == null && subComponent == null) {
            position = segment + '-' + field.position;
        } else if (field != null && component != null && subComponent == null) {
            position = segment + '-' + field.position + '.' + component.position;
        } else if (field != null && component != null && subComponent != null) {
            position = segment + '-' + field.position + '.' + component.position + '.' + subComponent.position;
        }

        return position;
    };

    $scope.genLocation = function (field, component, subComponent) {
        var location = null;
        if (field != null && component == null && subComponent == null) {
            location = field.position + '[1]';
        } else if (field != null && component != null && subComponent == null) {
            location = field.position + '[1].' + component.position + '[1]';
        } else if (field != null && component != null && subComponent != null) {
            location = field.position + '[1].' + component.position + '[1].' + subComponent.position + '[1]';
        }

        return location;
    };
    
    $scope.addComplexConformanceStatement = function(){
    	$scope.complexConstraint.constraintId = $scope.newComplexConstraintId;
    	$scope.complexConstraint.constraintClassification = $scope.newComplexConstraintClassification;
    	
    	$rootScope.segment.conformanceStatements.push($scope.complexConstraint);
        $rootScope.segmentConformanceStatements.push($scope.complexConstraint);
        var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: $scope.complexConstraint};
        $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
        
        $scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.complexConstraint), 1);
        $scope.complexConstraint = null;
        $scope.newComplexConstraintId = '';
        $scope.newComplexConstraintClassification = 'E';
    };
    
    $scope.compositeConformanceStatements = function(){
    	if($scope.compositeType === 'AND'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'AND(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: '['+ $scope.firstConstraint.description + '] ' + 'AND' + ' [' + $scope.secondConstraint.description + ']',
                    assertion: '<AND>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</AND>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}else if($scope.compositeType === 'OR'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'OR(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: '['+ $scope.firstConstraint.description + '] ' + 'OR' + ' [' + $scope.secondConstraint.description + ']',
                    assertion: '<OR>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</OR>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}else if($scope.compositeType === 'IFTHEN'){
    		var cs = {
                    id: new ObjectId().toString(),
                    constraintId: 'IFTHEN(' + $scope.firstConstraint.constraintId + ',' + $scope.secondConstraint.constraintId + ')',
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    description: 'IF ['+ $scope.firstConstraint.description + '] ' + 'THEN ' + ' [' + $scope.secondConstraint.description + ']',
                    assertion: '<IMPLY>' + $scope.firstConstraint.assertion + $scope.secondConstraint.assertion + '</IMPLY>'
            };
    		$scope.newComplexConstraint.push(cs);
    	}
    	
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.firstConstraint), 1);
    	$scope.newComplexConstraint.splice($scope.newComplexConstraint.indexOf($scope.secondConstraint), 1);
    	
    	$scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
    };

    $scope.addConformanceStatement = function () {
        $rootScope.newConformanceStatementFakeId = $rootScope.newConformanceStatementFakeId - 1;

        var position_1 = $scope.genPosition($scope.newConstraint.segment, $scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        var position_2 = $scope.genPosition($scope.newConstraint.segment, $scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);
        var location_1 = $scope.genLocation($scope.newConstraint.field_1, $scope.newConstraint.component_1, $scope.newConstraint.subComponent_1);
        var location_2 = $scope.genLocation($scope.newConstraint.field_2, $scope.newConstraint.component_2, $scope.newConstraint.subComponent_2);


        if (position_1 != null) {
            if ($scope.newConstraint.contraintType === 'valued') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + '.',
                    assertion: '<Presence Path=\"' + location_1 + '\"/>'
                };
                
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                	$scope.newComplexConstraint.push(cs);
                }
                
            } else if ($scope.newConstraint.contraintType === 'a literal value') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' \'' + $scope.newConstraint.value + '\'.',
                    assertion: '<PlainText Path=\"' + location_1 + '\" Text=\"' + $scope.newConstraint.value + '\" IgnoreCase="false"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'one of list values') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.value + '.',
                    assertion: '<StringList Path=\"' + location_1 + '\" CSV=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'one of codes in ValueSet') {
                var cs = {
                        id: new ObjectId().toString(),
                        constraintId: $scope.newConstraint.constraintId,
                        constraintTarget: $scope.selectedNode.position + '[1]',
                        constraintClassification: $scope.newConstraint.constraintClassification,
                        description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' ' + $scope.newConstraint.contraintType + ': ' + $scope.newConstraint.valueSetId + '.',
                        assertion: '<ValueSet Path=\"' + location_1 + '\" ValueSetID=\"' + $scope.newConstraint.valueSetId + '\" BindingStrength=\"' + $scope.newConstraint.bindingStrength + '\" BindingLocation=\"' + $scope.newConstraint.bindingLocation +'\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                    $scope.newComplexConstraint.push(cs);
                }
            }  else if ($scope.newConstraint.contraintType === 'formatted value') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' valid in format: \'' + $scope.newConstraint.value + '\'.',
                    assertion: '<Format Path=\"' + location_1 + '\" Regex=\"' + $rootScope.genRegex($scope.newConstraint.value) + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if($scope.constraintType === 'Complex'){
                	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'identical to the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' identical to the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="EQ" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'not-equal to the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="NE" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'greater than the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GT" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to or greater than the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="GE" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'less than the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LT" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to or less than the another node') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than the value of ' + position_2 + '.',
                    assertion: '<PathValue Path1=\"' + location_1 + '\" Operator="LE" Path2=\"' + location_2 + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="EQ" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'not-equal to') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' different with ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="NE" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'greater than') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' greater than ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GT" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to or greater than') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or greater than ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="GE" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'less than') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' less than ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LT" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            } else if ($scope.newConstraint.contraintType === 'equal to or less than') {
                var cs = {
                    id: new ObjectId().toString(),
                    constraintId: $scope.newConstraint.constraintId,
                    constraintTarget: $scope.selectedNode.position + '[1]',
                    constraintClassification: $scope.newConstraint.constraintClassification,
                    description: 'The value of ' + position_1 + ' ' + $scope.newConstraint.verb + ' equal to or less than ' + $scope.newConstraint.value + '.',
                    assertion: '<SimpleValue Path=\"' + location_1 + '\" Operator="LE" Value=\"' + $scope.newConstraint.value + '\"/>'
                };
                if($scope.constraintType === 'Plain'){
                	$rootScope.segment.conformanceStatements.push(cs);
                    $rootScope.segmentConformanceStatements.push(cs);
                    var newCSBlock = {targetType: 'segment', targetId: $rootScope.segment.id, obj: cs};
                    $rootScope.recordChangeForEdit2('conformanceStatement', "add", null, 'conformanceStatement', newCSBlock);
                }else if ($scope.constraintType === 'Complex'){
                  	$scope.newComplexConstraint.push(cs);
                }
            }
        }
        $scope.initConformanceStatement();
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedNode);
    };

});

angular.module('igl').controller('ConfirmSegmentDeleteCtrl', function ($scope, $modalInstance, segToDelete, $rootScope) {
    $scope.segToDelete = segToDelete;
    $scope.loading = false;
    
    $scope.delete = function () {
        $scope.loading = true;
        var index = $rootScope.segments.indexOf($scope.segToDelete);
        if (index > -1) $rootScope.segments.splice(index, 1);
        if ($rootScope.segment === $scope.segToDelete) {
            $rootScope.segment = null;
        }
        if (index > -1) $rootScope.igdocument.profile.segments.children.splice(index, 1);
        if ($rootScope.segment === $scope.segToDelete) {
            $rootScope.segment = null;
        }
        $rootScope.segmentsMap[$scope.segToDelete.id] = null;
        $rootScope.references = [];
        if ($scope.segToDelete.id < 0) {
            var index = $rootScope.changes["segment"]["add"].indexOf($scope.segToDelete);
            if (index > -1) $rootScope.changes["segment"]["add"].splice(index, 1);
            if ($rootScope.changes["segment"]["add"] && $rootScope.changes["segment"]["add"].length === 0) {
                delete  $rootScope.changes["segment"]["add"];
            }
            if ($rootScope.changes["segment"] && Object.getOwnPropertyNames($rootScope.changes["segment"]).length === 0) {
                delete  $rootScope.changes["segment"];
            }
        } else {
            $rootScope.recordDelete("segment", "edit", $scope.segToDelete.id);
            if ($scope.segToDelete.components != undefined && $scope.segToDelete.components != null && $scope.segToDelete.components.length > 0) {

                //clear field changes
                angular.forEach($scope.segToDelete.fields, function (component) {
                    $rootScope.recordDelete("field", "edit", field.id);
                    $rootScope.removeObjectFromChanges("field", "delete", field.id);
                });
                if ($rootScope.changes["field"]["delete"] && $rootScope.changes["field"]["delete"].length === 0) {
                    delete  $rootScope.changes["field"]["delete"];
                }

                if ($rootScope.changes["field"] && Object.getOwnPropertyNames($rootScope.changes["field"]).length === 0) {
                    delete  $rootScope.changes["field"];
                }

            }

            if ($scope.segToDelete.predicates != undefined && $scope.segToDelete.predicates != null && $scope.segToDelete.predicates.length > 0) {
                //clear predicates changes
                angular.forEach($scope.segToDelete.predicates, function (predicate) {
                    $rootScope.recordDelete("predicate", "edit", predicate.id);
                    $rootScope.removeObjectFromChanges("predicate", "delete", predicate.id);
                });
                if ($rootScope.changes["predicate"]["delete"] && $rootScope.changes["predicate"]["delete"].length === 0) {
                    delete  $rootScope.changes["predicate"]["delete"];
                }

                if ($rootScope.changes["predicate"] && Object.getOwnPropertyNames($rootScope.changes["predicate"]).length === 0) {
                    delete  $rootScope.changes["predicate"];
                }

            }

            if ($scope.segToDelete.conformanceStatements != undefined && $scope.segToDelete.conformanceStatements != null && $scope.segToDelete.conformanceStatements.length > 0) {
            	//clear conforamance statement changes
                angular.forEach($scope.segToDelete.conformanceStatements, function (confStatement) {
                    $rootScope.recordDelete("conformanceStatement", "edit", confStatement.id);
                    $rootScope.removeObjectFromChanges("conformanceStatement", "delete", confStatement.id);
                });
                if ($rootScope.changes["conformanceStatement"]["delete"] && $rootScope.changes["conformanceStatement"]["delete"].length === 0) {
                    delete  $rootScope.changes["conformanceStatement"]["delete"];
                }

                if ($rootScope.changes["conformanceStatement"] && Object.getOwnPropertyNames($rootScope.changes["conformanceStatement"]).length === 0) {
                    delete  $rootScope.changes["conformanceStatement"];
                }
            }
        }


        $rootScope.msg().text = "segDeleteSuccess";
        $rootScope.msg().type = "success";
        $rootScope.msg().show = true;
        $rootScope.manualHandle = true;
        $modalInstance.close($scope.segToDelete);
        $rootScope.$broadcast('event:SetToC');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('igl').controller('SegmentReferencesCtrl', function ($scope, $modalInstance, segToDelete) {

    $scope.segToDelete = segToDelete;

    $scope.ok = function () {
        $modalInstance.close($scope.segToDelete);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
