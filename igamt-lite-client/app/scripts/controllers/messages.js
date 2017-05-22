/**
 * Created by haffo on 2/13/15.
 */

angular.module('igl').controller('MessageListCtrl', function($scope, $rootScope, Restangular, ngTreetableParams, $filter, $http, $modal, $timeout, $q, CloneDeleteSvc, MastermapSvc, FilteringSvc, MessageService, SegmentService, SegmentLibrarySvc, DatatypeLibrarySvc, TableLibrarySvc, TableService, DatatypeService, blockUI, ViewSettings, ValidationService, $mdDialog) {

    $scope.viewSettings = ViewSettings;

    $scope.accordStatus = {
        isCustomHeaderOpen: false,
        isFirstOpen: true,
        isSecondOpen: false,
        isThirdOpen: false,
        isFifthOpen: false,
        isSixOpen: false,
        isFirstDisabled: false
    };
    $scope.tabStatus = {
        active: 1
    };

    $scope.init = function() {
        $scope.accordStatus = {
            isCustomHeaderOpen: false,
            isFirstOpen: true,
            isSecondOpen: false,
            isThirdOpen: false,
            isFifthOpen: false,
            isSixOpen: false,
            isFirstDisabled: false
        };
        $scope.tabStatus = {
            active: 1
        };

        $scope.findAllGlobalConstraints();

    };
    $scope.validateMessage = function() {
        console.log($rootScope.message);
        ValidationService.validateMessage($rootScope.message, $rootScope.igdocument.profile.metaData.hl7Version).then(function(result) {
            $rootScope.validationMap = {};
            $rootScope.childValidationMap = {};
            $rootScope.showMsgErrorNotification = true;
            $rootScope.validationResult = result;
            console.log($rootScope.validationResult);
            $rootScope.buildValidationMap($rootScope.validationResult);
            console.log($rootScope.validationMap);
            console.log($rootScope.childValidationMap);


        }, function(error) {
            console.log(error);
        });
    };
    $scope.isMessageValidated = function() {
        if ($rootScope.message && ($rootScope.validationResult.targetId === $rootScope.message.id || $rootScope.childValidationMap[$rootScope.message.id])) {
            return true;
        } else {
            return false;
        }
    };
    $scope.setErrorNotification = function() {
        $rootScope.showMsgErrorNotification = !$rootScope.showMsgErrorNotification;
    };

    $scope.redirectSeg = function(segmentRef) {
        SegmentService.get(segmentRef.id).then(function(segment) {
            var modalInstance = $modal.open({
                templateUrl: 'redirectCtrl.html',
                controller: 'redirectCtrl',
                size: 'md',
                resolve: {
                    destination: function() {
                        return segment;
                    }
                }



            });
            modalInstance.result.then(function() {
                $rootScope.editSeg(segment);
            });



        });
    };
    $scope.redirectDT = function(datatype) {
        DatatypeService.getOne(datatype.id).then(function(datatype) {
            var modalInstance = $modal.open({
                templateUrl: 'redirectCtrl.html',
                controller: 'redirectCtrl',
                size: 'md',
                resolve: {
                    destination: function() {
                        return datatype;
                    }
                }



            });
            modalInstance.result.then(function() {
                $rootScope.editDatatype(datatype);
            });



        });
    };
    $scope.redirectVS = function(binding) {
        TableService.getOne(binding.tableId).then(function(valueSet) {
            var modalInstance = $modal.open({
                templateUrl: 'redirectCtrl.html',
                controller: 'redirectCtrl',
                size: 'md',
                resolve: {
                    destination: function() {
                        return valueSet;
                    }
                }



            });
            modalInstance.result.then(function() {
                $rootScope.editTable(valueSet);
            });
        });
    };

    $scope.deleteConformanceStatement = function(cs, target) {
        target.conformanceStatements.splice(target.conformanceStatements.indexOf(cs), 1);
        $scope.setDirty();
    };


    $scope.OtoX = function(message) {
        var modalInstance = $modal.open({
            templateUrl: 'OtoX.html',
            controller: 'OtoXCtrl',
            size: 'md',
            resolve: {
                message: function() {
                    return message;
                }
            }
        });
        modalInstance.result.then(function() {
            $scope.setDirty();

            if ($scope.messagesParams)
                $scope.messagesParams.refresh();
        });
    };

    $scope.expanded = true;

    $scope.expandAll = function() {
        $scope.expanded = !$scope.expanded;

        $('#messageTable').treetable('expandAll');
    };

    $scope.collapseAll = function() {
        $scope.expanded = !$scope.expanded;
        $('#messageTable').treetable('collapseAll');
    };

    $scope.copy = function(message) {
        CloneDeleteSvc.copyMessage(message);
        $rootScope.$broadcast('event:SetToC');
    };

    $scope.reset = function() {
        blockUI.start();
        MessageService.reset();
        $rootScope.processMessageTree($rootScope.message);
        $scope.findAllGlobalConstraints();
        cleanState();
        blockUI.stop();
    };

    var findIndex = function(id) {
        for (var i = 0; i < $rootScope.igdocument.profile.messages.children.length; i++) {
            if ($rootScope.igdocument.profile.messages.children[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    var indexIn = function(id, collection) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    var cleanState = function() {
        $rootScope.addedSegments = [];
        $rootScope.addedDatatypes = [];
        $rootScope.addedTables = [];
        $scope.clearDirty();
        $scope.editForm.$setPristine();
        $scope.editForm.$dirty = false;
        $rootScope.clearChanges();
        if ($scope.messagesParams) {
            $scope.messagesParams.refresh();
        }
    };
    $scope.callMsgDelta = function() {
        $rootScope.$emit("event:openMsgDelta");
    };

    $scope.save = function() {
        $scope.saving = true;
        var message = $rootScope.message;
        $rootScope.$emit("event:saveMsgForDelta");
        console.log($rootScope.message);
        MessageService.save(message).then(function(result) {
            $rootScope.message.dateUpdated = result.dateUpdated;
            $rootScope.$emit("event:updateIgDate");
            var index = findIndex(message.id);
            if (index < 0) {
                $rootScope.igdocument.profile.messages.children.splice(0, 0, message);
            }

            MessageService.saveNewElements().then(function() {
                MessageService.merge($rootScope.messagesMap[message.id], message);
                cleanState();
            }, function(error) {
                $rootScope.msg().text = "Sorry an error occured. Please try again";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
        }, function(error) {
            $rootScope.msg().text = error.data.text;
            $rootScope.msg().type = error.data.type;
            $rootScope.msg().show = true;
        });
    };





    $scope.delete = function(message) {
        CloneDeleteSvc.deleteMessage(message);
        $rootScope.$broadcast('event:SetToC');
    };


    $scope.deleteSeg = function(segmentRefOrGrp) {
        var modalInstance = $modal.open({
            templateUrl: 'DeleteSegmentRefOrGrp.html',
            controller: 'DeleteSegmentRefOrGrpCtrl',
            windowClass: 'flavor-modal-window',
            resolve: {
                segOrGrpToDelete: function() {
                    return segmentRefOrGrp;
                }


            }
        });
        modalInstance.result.then(function() {
            $scope.setDirty();

            if ($scope.messagesParams)
                $scope.messagesParams.refresh();
        });
    };
    $scope.editableGrp = '';

    $scope.isGroupNameValid = function (gName) {
        var pattern = new RegExp("\^[A-Z0-9_\.]*$");

        return pattern.test(gName);

    };

    $scope.editGrp = function(group, message) {
        $scope.path = group.path.replace(/\[[0-9]+\]/g, '');
        $scope.path = $scope.path.split(".");
        MessageService.findParentByPath($scope.path, message).then(function() {});


        $scope.editableGrp = group.obj.id;
        $scope.grpName = group.obj.name;
        $scope.group = group.obj.position;


    };
    $scope.backGrp = function() {
        $scope.editableGrp = '';
    };
    $scope.applyGrp = function(group, name, position) {
        blockUI.start();
        $scope.editableGrp = '';
        if (group) {
            group.obj.name = name;


        }
        if (position) {
            MessageService.updatePosition($rootScope.segParent.children, group.obj.position - 1, position - 1);
        }
        $scope.setDirty();

        $rootScope.processMessageTree($rootScope.message);
        if ($scope.messagesParams)
            $scope.messagesParams.refresh();
        $scope.Posselected = false;

        blockUI.stop();
    };



    $scope.editableSeg = '';

    $scope.editSgmt = function(segmentRef, message) {
        blockUI.start();
        $scope.path = segmentRef.path.replace(/\[[0-9]+\]/g, '');
        $scope.path = $scope.path.split(".");
        MessageService.findParentByPath($scope.path, message).then(function() {
            // $scope.parentLength=$rootScope.segParent.children.length;
        });

        $scope.editableSeg = segmentRef.obj.id;
        $scope.loadLibrariesByFlavorName = function() {
            var delay = $q.defer();

            $scope.ext = null;
            $scope.results = [];
            $scope.tmpResults = [];
            $scope.results = $scope.results.concat(filterFlavors($rootScope.igdocument.profile.segmentLibrary, segmentRef.obj.ref.name));
            $scope.results = _.uniq($scope.results, function(item, key, a) {
                return item.id;
            });
            $scope.tmpResults = [].concat($scope.results);
            //                SegmentLibrarySvc.findLibrariesByFlavorName(segmentRef.obj.ref.name, 'HL7STANDARD', $rootScope.igdocument.profile.metaData.hl7Version).then(function(libraries) {
            //                    if (libraries != null) {
            //                        _.each(libraries, function(library) {
            //                            $scope.results = $scope.results.concat(filterFlavors(library, segmentRef.obj.ref.name));
            //
            //                        });
            //                    }
            //
            //                    $scope.results = _.uniq($scope.results, function(item, key, a) {
            //                        return item.id;
            //                    });
            //
            //                    $scope.tmpResults = [].concat($scope.results);
            //                    console.log($scope.tmpResults);
            //
            //                    delay.resolve(true);
            //                }, function(error) {
            //                    $rootScope.msg().text = "Sorry could not load the segments";
            //                    $rootScope.msg().type = error.data.type;
            //                    $rootScope.msg().show = true;
            //                    delay.reject(error);
            //                });
            blockUI.stop();
            return delay.promise;

        };

        var filterFlavors = function(library, name) {
            var results = [];
            _.each(library.children, function(link) {
                console.log("++++++++++");
                console.log(link);
                if (link.name === name) {
                    link.libraryName = library.metaData.name;
                    link.hl7Version = $rootScope.segmentsMap[link.id].hl7Version;
                    //link.hl7Version = library.metaData.hl7Version;
                    results.push(link);
                }
            });
            return results;
        };
        $scope.loadLibrariesByFlavorName().then(function(done) {
            // $scope.selection.selected = $scope.currentSegment.id;
            // $scope.selectSegment($scope.currentSegment);
        });


    };

    $scope.backSeg = function() {
        blockUI.start();
        $scope.editableSeg = '';
        // segmentRef.obj.position=$scope.initialPosition;
        blockUI.stop();
    };





    $scope.selectSeg = function(segmentRef, segment) {
        $scope.Segselected = true;
        $scope.editableSeg = '';

        blockUI.start();
        console.log(segment);
        console.log(segmentRef);


        segmentRef.obj.ref.id = JSON.parse(segment).id;
        segmentRef.obj.ref.ext = JSON.parse(segment).ext;
        segmentRef.obj.ref.label = JSON.parse(segment).label;
        segmentRef.obj.ref.name = JSON.parse(segment).name;



        console.log(segmentRef);
        $scope.setDirty();
        var ref = $rootScope.segmentsMap[segmentRef.obj.ref.id];
        $rootScope.processMessageTree($rootScope.message);


        if ($scope.messagesParams)
            $scope.messagesParams.refresh();
        $scope.Segselected = false;
        $scope.Posselected = false;
        blockUI.stop();

    };

    $scope.selectPos = function(segmentRef, position) {

        // $scope.Posselected = true;
        $scope.editableSeg = '';

        MessageService.updatePosition($rootScope.segParent.children, segmentRef.obj.position - 1, position - 1);
        $scope.setDirty();

        $rootScope.processMessageTree($rootScope.message);


        if ($scope.messagesParams)
            $scope.messagesParams.refresh();




    };


    // $scope.selectSeg = function() {

    //     $scope.Segselected = true;




    // };

    $scope.selectedSeg = function() {
        return ($scope.tempSeg !== undefined);
    };
    $scope.unselectSeg = function() {
        $scope.tempSeg = undefined;
        //$scope.newSeg = undefined;
    };
    $scope.isSegActive = function(id) {
        if ($scope.tempSeg) {
            return $scope.tempSeg.id === id;
        } else {
            return false;
        }

    };




    $scope.goToSegment = function(segmentId) {
        $scope.$emit('event:openSegment', $rootScope.segmentsMap[segmentId]);
    };
    $scope.segOption = [

        ['Add segment',
            function($itemScope) {
                $scope.addSegmentModal($itemScope.node);
                /*
                 console.log($itemScope);
                 $itemScope.node.children.push($rootScope.messageTree.children[0]);
                 if ($scope.messagesParams) {
                 $scope.messagesParams.refresh();
                 }
                 */

            }
        ],
        null, ['Add group',
            function($itemScope) {
                $scope.addGroupModal($itemScope.node);
                //$itemScope.node.children.push($rootScope.messageTree.children[3]);
                //$scope.messagesParams.refresh();
            }
        ]

    ];

    $scope.addSegmentModal = function(place) {
        var modalInstance = $modal.open({
            templateUrl: 'AddSegmentModal.html',
            controller: 'AddSegmentCtrl',
            windowClass: 'creation-modal-window',
            resolve: {
                segments: function() {
                    return $rootScope.segments;
                },
                place: function() {
                    return place;
                },
                messageTree: function() {
                    return $rootScope.messageTree;
                }

            }
        });
        modalInstance.result.then(function(segment) {

            $scope.setDirty();


            if ($scope.messagesParams)
                $scope.messagesParams.refresh();
        });
    };
    $scope.addGroupModal = function(place) {
        var modalInstance = $modal.open({
            templateUrl: 'AddGroupModal.html',
            controller: 'AddGroupCtrl',
            windowClass: 'creation-modal-window',
            resolve: {
                segments: function() {
                    return $rootScope.segments;
                },
                place: function() {
                    return place;
                },
                messageTree: function() {
                    return $rootScope.messageTree;
                }

            }
        });
        modalInstance.result.then(function(segment) {
            $scope.setDirty();

            if ($scope.messagesParams)
                $scope.messagesParams.refresh();
        });
    };


    $scope.showSelectSegmentFlavorDlg = function(segmentRef) {
        console.log(segmentRef);
        var modalInstance = $modal.open({
            templateUrl: 'SelectSegmentFlavor.html',
            controller: 'SelectSegmentFlavorCtrl',
            windowClass: 'flavor-modal-window',
            resolve: {
                currentSegment: function() {
                    return $rootScope.segmentsMap[segmentRef.ref.id];
                },
                datatypeLibrary: function() {
                    return $rootScope.igdocument.profile.datatypeLibrary;
                },
                segmentLibrary: function() {
                    return $rootScope.igdocument.profile.segmentLibrary;
                },

                hl7Version: function() {
                    return $rootScope.igdocument.profile.metaData.hl7Version;
                }
            }
        });
        modalInstance.result.then(function(segment) {
            if (segment && segment != null) {
                $scope.loadingSelection = true;
                segmentRef.obj.ref.id = segment.id;
                segmentRef.obj.ref.ext = segment.ext;
                segmentRef.obj.ref.name = segment.name;
                segmentRef.children = [];
                $scope.setDirty();
                var ref = $rootScope.segmentsMap[segmentRef.obj.ref.id];
                $rootScope.processMessageTree(ref, segmentRef);
                if ($scope.messagesParams)
                    $scope.messagesParams.refresh();
                $scope.loadingSelection = false;
            }
        });
    };


    $scope.goToDatatype = function(datatype) {
        $scope.$emit('event:openDatatype', datatype);
    };

    $scope.goToTable = function(table) {
        $scope.$emit('event:openTable', table);
    };

    $scope.hasChildren = function(node) {
        if (node && node != null) {
            if (node.type === 'group') {
                return node.children && node.children.length > 0;
            } else if (node.type === 'segmentRef') {
                return $rootScope.segmentsMap[node.ref.id] && $rootScope.segmentsMap[node.ref.id].fields && $rootScope.segmentsMap[node.ref.id].fields.length > 0;
            } else if (node.type === 'field' || node.type === 'component') {
                return $rootScope.datatypesMap[node.datatype.id] && $rootScope.datatypesMap[node.datatype.id].components && $rootScope.datatypesMap[node.datatype.id].components.length > 0;
            }
            return false;
        } else {
            return false;
        }

    };

    $scope.isAvailableConstantValue = function(node) {
        if($scope.hasChildren(node)) return false;
        var bindings = $scope.findingBindings(node);
        if(bindings && bindings.length > 0) return false;
        if($rootScope.datatypesMap[node.obj.datatype.id].name == 'ID' || $rootScope.datatypesMap[node.obj.datatype.id].name == "IS") return false;
        return true;
    };

    $scope.isSub = function(component) {
        return $scope.isSubDT(component);
    };

    $scope.isSubDT = function(component) {
        return component.type === 'component' && $rootScope.parentsMap && $rootScope.parentsMap[component.id] && $rootScope.parentsMap[component.id].type === 'component';
    };

    $scope.isVisible = function(node) {
        if (node && node != null) {
            //                return FilteringSvc.show(node);
            return true;
        } else {
            return true;
        }
    };

    $scope.isVisibleInner = function(node, nodeParent) {
        if (node && node != null && nodeParent && nodeParent != null) {
            //                return FilteringSvc.showInnerHtml(node, nodeParent);
            return true;
        } else {
            return true;
        }
    };

    $scope.isUsagefiltered = function(node, nodeParent) {
        if ($rootScope.usageF) {
            console.log(nodeParent);
        }
        return true;

    };

    //For Constraints

    $scope.findAllGlobalConstraints = function() {
        $scope.listGlobalConformanceStatements = [];
        $scope.listGlobalPredicates = [];
        $scope.travelMessage($rootScope.message, '');
    };

    $scope.travelMessage = function(current, positionPath) {
        if (current.conformanceStatements && current.conformanceStatements.length > 0) {
            $scope.listGlobalConformanceStatements.push(current);
        }

        if (current.predicates && current.predicates.length > 0) {
            $scope.listGlobalPredicates.push(current);
        }

        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                var segGroup = current.children[i];

                if (positionPath == '') {
                    segGroup.positionPath = segGroup.position + '[1]';
                } else {
                    segGroup.positionPath = positionPath + '.' + segGroup.position + '[1]';
                }

                $scope.travelMessage(segGroup, segGroup.positionPath);
            }
        }
    };

    $scope.openPredicateDialog = function(node) {
        if (node.obj.usage == 'C') $scope.openAddGlobalPredicateDialog(node, $rootScope.message);
    };

    $scope.openAddGlobalConformanceStatementDialog = function(message) {
        $mdDialog.show({
            parent: angular.element(document).find('body'),
            templateUrl: 'GlobalConformanceStatementCtrl.html',
            controller: 'GlobalConformanceStatementCtrl',
            locals: {
                selectedMessage: message,
                segmentsMap: $rootScope.segmentsMap,
                config : $rootScope.config,
                tables : $rootScope.tables
            }
        }).then(function(message) {
            if (message) {
                $rootScope.message = message;
                $scope.findAllGlobalConstraints();
                $scope.setDirty();
            }
        });

    };

    $scope.openAddGlobalPredicateDialog = function(node, message) {
        $mdDialog.show({
            parent: angular.element(document).find('body'),
            templateUrl: 'GlobalPredicateCtrl.html',
            controller: 'GlobalPredicateCtrl',
            locals: {
                selectedMessage: message,
                selectedNode: node,
                segmentsMap: $rootScope.segmentsMap,
                config : $rootScope.config,
                tables : $rootScope.tables
            }
        }).then(function(message) {
            if (message) {
                $rootScope.message = message;
                $scope.findAllGlobalConstraints();
                $scope.setDirty();
            }
        });

    };

    $scope.countPredicate = function(position) {
        var count = 0
        for (var i = 0, len1 = $scope.listGlobalPredicates.length; i < len1; i++) {
            for (var j = 0, len2 = $scope.listGlobalPredicates[i].predicates.length; j < len2; j++) {
                var positionPath = '';
                if (!$scope.listGlobalPredicates[i].positionPath || $scope.listGlobalPredicates[i].positionPath == '') {
                    positionPath = $scope.listGlobalPredicates[i].predicates[j].constraintTarget;
                } else {
                    positionPath = $scope.listGlobalPredicates[i].positionPath + '.' + $scope.listGlobalPredicates[i].predicates[j].constraintTarget;
                }

                if (positionPath == position) {
                    count = count + 1;
                }
            }
        }
        return count;
    };

    $scope.findPredicateByPath = function(position) {
        for (var i = 0, len1 = $scope.listGlobalPredicates.length; i < len1; i++) {
            for (var j = 0, len2 = $scope.listGlobalPredicates[i].predicates.length; j < len2; j++) {
                var positionPath = '';
                if (!$scope.listGlobalPredicates[i].positionPath || $scope.listGlobalPredicates[i].positionPath == '') {
                    positionPath = $scope.listGlobalPredicates[i].predicates[j].constraintTarget;
                } else {
                    positionPath = $scope.listGlobalPredicates[i].positionPath + '.' + $scope.listGlobalPredicates[i].predicates[j].constraintTarget;
                }

                if (positionPath == position) {
                    return $scope.listGlobalPredicates[i].predicates[j];
                }
            }
        }
        return null;
    };


    $scope.deletePredicateByPath = function(position, message) {
        var modalInstance = $modal.open({
            templateUrl: 'DeleteMessagePredicate.html',
            controller: 'DeleteMessagePredicateCtrl',
            size: 'md',
            resolve: {
                position: function() {
                    return position;
                },
                message: function() {
                    return message;
                }
            }
        });
        modalInstance.result.then(function() {
            $scope.setDirty();
            $scope.findAllGlobalConstraints();
        });
    };

    $scope.isAvailableForValueSet = function (node){
        if(node && node.obj){
            var currentDT = $rootScope.datatypesMap[node.obj.datatype.id];
            if(_.find($rootScope.config.valueSetAllowedDTs, function(valueSetAllowedDT){
                    return valueSetAllowedDT === currentDT.name;
                })) return true;
        }

        if(node && node.fieldDT && !node.componentDT){
            var parentDT = $rootScope.datatypesMap[node.fieldDT];
            var pathSplit = node.segmentPath.split(".");
            if(_.find($rootScope.config.valueSetAllowedComponents, function(valueSetAllowedComponent){
                    return valueSetAllowedComponent.dtName === parentDT.name && valueSetAllowedComponent.location == pathSplit[1];
                })) return true;
        }

        if(node && node.componentDT){
            var parentDT = $rootScope.datatypesMap[node.componentDT];
            var pathSplit = node.segmentPath.split(".");
            if(_.find($rootScope.config.valueSetAllowedComponents, function(valueSetAllowedComponent){
                    return valueSetAllowedComponent.dtName === parentDT.name && valueSetAllowedComponent.location == pathSplit[2];
                })) return true;
        }

        return false;
    };

    $scope.findingBindings = function(node) {
        var result = [];
        if(node && $rootScope.message){
            result = _.filter($rootScope.message.valueSetBindings, function(binding){
                return binding.location === $rootScope.refinePath(node.path);
            });
            for (var i = 0; i < result.length; i++) {
                result[i].bindingFrom = 'message';
            }

            if(result && result.length > 0) {
                return result;
            }

            if(node.segment) {
                var parentSeg = $rootScope.segmentsMap[node.segment];
                result = _.filter(parentSeg.valueSetBindings, function(binding){
                    return binding.location === node.segmentPath;
                });
                for (var i = 0; i < result.length; i++) {
                    result[i].bindingFrom = 'segment';
                }
            }

            if(result && result.length > 0) {
                return result;
            }

            if(node.fieldDT) {
                var parentDT = $rootScope.datatypesMap[node.fieldDT];
                var subPath = node.segmentPath.substr(node.segmentPath.indexOf('.') + 1);
                result = _.filter(parentDT.valueSetBindings, function(binding){
                    return binding.location === subPath;
                });
                for (var i = 0; i < result.length; i++) {
                    result[i].bindingFrom = 'field';
                }
            }

            if(result && result.length > 0) {
                return result;
            }

            if(node.componentDT) {
                var parentDT = $rootScope.datatypesMap[node.componentDT];
                var subPath = node.segmentPath.substr(node.segmentPath.split('.', 2).join('.').length + 1);
                result = _.filter(parentDT.valueSetBindings, function(binding){
                    return binding.location === subPath;
                });
                for (var i = 0; i < result.length; i++) {
                    result[i].bindingFrom = 'component';
                }
            }
        }

        return result;
    };

    $scope.findingComments = function(node) {
        var result = [];
        if(node && $rootScope.message){
            result = _.filter($rootScope.message.comments, function(comment){
                return comment.location === $rootScope.refinePath(node.path);
            });
            for (var i = 0; i < result.length; i++) {
                result[i].from = 'message';
                result[i].index = i + 1;
            }

            if(node.segment) {
                var parentSeg = $rootScope.segmentsMap[node.segment];
                var subResult = _.filter(parentSeg.comments, function(comment){
                    return comment.location === node.segmentPath;
                });
                for (var i = 0; i < subResult.length; i++) {
                    subResult[i].from = 'segment';
                    subResult[i].index = i + 1;
                }
                result = result.concat(subResult);
            }

            if(node.fieldDT) {
                var parentDT = $rootScope.datatypesMap[node.fieldDT];
                var subPath = node.segmentPath.substr(node.segmentPath.indexOf('.') + 1);
                var subSubResult = _.filter(parentDT.comments, function(comment){
                    return comment.location === subPath;
                });
                for (var i = 0; i < subSubResult.length; i++) {
                    subSubResult[i].from = 'field';
                    subSubResult[i].index = i + 1;
                }
                result = result.concat(subSubResult);
            }

            if(node.componentDT) {
                var parentDT = $rootScope.datatypesMap[node.componentDT];
                var subPath = node.segmentPath.substr(node.segmentPath.split('.', 2).join('.').length + 1);
                var subSubSubResult = _.filter(parentDT.comments, function(comment){
                    return comment.location === subPath;
                });
                for (var i = 0; i < subSubSubResult.length; i++) {
                    subSubSubResult[i].from = 'component';
                    subSubSubResult[i].index = i + 1;
                }
                result = result.concat(subSubSubResult);
            }
        }

        return result;
    };

    $scope.deleteBinding = function(binding){
        var index = $rootScope.message.valueSetBindings.indexOf(binding);
        if (index >= 0) {
            $rootScope.message.valueSetBindings.splice(index, 1);
            $scope.setDirty();
        }
    };

    $scope.deleteComment = function(comment){
        var index = $rootScope.message.comments.indexOf(comment);
        if (index >= 0) {
            $rootScope.segment.comments.splice(index, 1);
            $scope.setDirty();
        }
    };

    $scope.editModalBindingForMsg = function(node) {
        var modalInstance = $modal.open({
            templateUrl: 'TableMappingMessageCtrl.html',
            controller: 'TableMappingMessageCtrl',
            windowClass: 'app-modal-window',
            resolve: {
                currentNode: function() {
                    return node;
                }
            }
        });

        modalInstance.result.then(function(node) {
            $scope.setDirty();
        });
    };

    $scope.editCommentDlg = function(node, comment, disabled, type) {
        var modalInstance = $modal.open({
            templateUrl: 'EditComment.html',
            controller: 'EditCommentCtrl',
            backdrop: true,
            keyboard: true,
            windowClass: 'input-text-modal-window',
            backdropClick: false,
            resolve: {
                currentNode: function() {
                    return node;
                },
                currentComment: function() {
                    return comment;
                },
                disabled: function() {
                    return disabled;
                },
                type: function() {
                    return type;
                }
            }
        });

        modalInstance.result.then(function() {
            $scope.setDirty();
        });
    };

    $scope.openDialogForEditSev = function(node) {
        var modalInstance = $modal.open({
            templateUrl: 'EditSingleElement.html',
            controller: 'EditSingleElementCtrl',
            backdrop: true,
            keyboard: true,
            windowClass: 'input-text-modal-window',
            backdropClick: false,
            resolve: {
                currentNode: function() {
                    return node;
                }
            }
        });

        modalInstance.result.then(function(value) {
            $scope.addSev(node);
            node.sev.value = value;
            $scope.setDirty();
        });
    };

    $scope.confirmDatatypeSingleElementDuplicated = function (node) {
        var modalInstance = $modal.open({
            templateUrl: 'ConfirmSingleElementDuplicatedCtrl.html',
            controller: 'ConfirmSingleElementDuplicatedCtrl',
            resolve: {
                selectedNode: function () {
                    return node;
                }
            }
        });
        modalInstance.result.then(function (node) {
            $scope.openDialogForEditSev(node);
        }, function () {
        });
    };

    $scope.addSev = function (node){
        var sev = {};
        sev.location = $rootScope.refinePath(node.path);
        sev.value = '';
        sev.profilePath = $rootScope.refinePath(node.locationPath);
        sev.name = node.obj.name;
        console.log(sev);
        $rootScope.message.singleElementValues.push(sev);
        node.sev = sev;
        node.sev.from = 'message';
        $scope.setDirty();
    };

    $scope.deleteSev = function (node){
        var index = $rootScope.message.singleElementValues.indexOf(node.sev);
        if (index >= 0) {
            $rootScope.message.singleElementValues.splice(index, 1);
            $scope.setDirty();
        }

        if(node.componentDT) {
            var componentPath = node.segmentPath.substr(node.segmentPath.split('.', 2).join('.').length + 1);
            var foundSev = _.find($rootScope.datatypesMap[node.componentDT].singleElementValues, function (sev) {return sev.location == componentPath;});
            if (foundSev) {
                foundSev.from = 'component';
                node.sev = foundSev;
            }
        }

        if(node.fieldDT) {
            var fieldPath = node.segmentPath.substr(node.segmentPath.indexOf('.') + 1);
            var foundSev = _.find($rootScope.datatypesMap[node.fieldDT].singleElementValues, function(sev){ return sev.location  ==  fieldPath; });
            if(foundSev) {
                foundSev.from = 'field';
                node.sev = foundSev;
            }
        }

        if(node.segment) {
            var foundSev = _.find($rootScope.segmentsMap[node.segment].singleElementValues, function(sev){ return sev.location  ==  node.segmentPath; });
            if(foundSev) {
                foundSev.from = 'segment';
                node.sev = foundSev;
            }
        }

        if(node.sev && node.sev.from == 'message'){
            node.sev = null;
        }
    }




});

angular.module('igl').controller('MessageRowCtrl', function($scope) {
    $scope.formName = "form_" + new Date().getTime();


    //        $scope.init = function(){
    //            $scope.$watch(function(){
    //            return  $scope.formName.$dirty;
    //        }, function(newValue, oldValue) {
    //            $scope.editForm.$dirty = newValue !=null &&  oldValue != null;
    //        });
    //
    //        }

});

angular.module('igl').controller('SelectSegmentFlavorCtrl', function($scope, $filter, $q, $modalInstance, $rootScope, $http, segmentLibrary, SegmentService, $rootScope, hl7Version, ngTreetableParams, ViewSettings, SegmentLibrarySvc, datatypeLibrary, DatatypeLibrarySvc, currentSegment, TableService) {
    $scope.segmentLibrary = segmentLibrary;
    $scope.datatypeLibrary = datatypeLibrary;
    $scope.resultsError = null;
    $scope.viewSettings = ViewSettings;
    $scope.resultsLoading = null;
    $scope.results = [];
    $scope.tmpResults = [].concat($scope.results);
    $scope.currentSegment = currentSegment;
    $scope.selection = { library: null, scope: null, hl7Version: hl7Version, segment: null, name: $scope.currentSegment != null && $scope.currentSegment ? $scope.currentSegment.name : null, selected: null };


    $scope.segmentFlavorParams = new ngTreetableParams({
        getNodes: function(parent) {
            return SegmentService.getNodes(parent, $scope.selection.segment);
        },
        getTemplate: function(node) {
            return SegmentService.getReadTemplate(node, $scope.selection.segment);
        }
    });

    $scope.loadLibrariesByFlavorName = function() {
        var delay = $q.defer();
        $scope.selection.segment = null;
        $scope.selection.selected = null;
        $scope.resetMap();
        $scope.ext = null;
        $scope.results = [];
        $scope.tmpResults = [];
        $scope.results = $scope.results.concat(filterFlavors($scope.segmentLibrary, $scope.selection.name));
        $scope.tmpResults = [].concat($scope.results);
        SegmentLibrarySvc.findLibrariesByFlavorName($scope.selection.name, 'HL7STANDARD', /*$scope.selection.hl7Version*/ $rootScope.igdocument.profile.metaData.hl7Version).then(function(libraries) {
            if (libraries != null) {
                _.each(libraries, function(library) {
                    $scope.results = $scope.results.concat(filterFlavors(library, $scope.selection.name));
                });
            }

            $scope.results = _.uniq($scope.results, function(item, key, a) {
                return item.id;
            });

            $scope.tmpResults = [].concat($scope.results);

            delay.resolve(true);
        }, function(error) {
            $rootScope.msg().text = "Sorry could not load the segments";
            $rootScope.msg().type = error.data.type;
            $rootScope.msg().show = true;
            delay.reject(error);
        });
        return delay.promise;
    };

    var filterFlavors = function(library, name) {
        var results = [];
        _.each(library.children, function(link) {
            if (link.name === name) {
                link.libraryName = library.metaData.name;
                link.hl7Version = library.metaData.hl7Version;
                results.push(link);
            }
        });
        return results;
    };


    $scope.selectSegment = function(segment) {
        if (segment && segment != null) {
            $scope.loadingSelection = true;
            $scope.selection.segment = segment;
            $scope.selection.segment["type"] = "segment";
        }
    };

    var indexIn = function(id, collection) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    var collectNewSegmentAndDatatypesAndTables = function(segment, datatypes) {
        $rootScope.segmentsMap[segment.id] = segment;
        if (indexIn(segment.id, $rootScope.addedSegments) < 0) {
            $rootScope.addedSegments.push(segment);
        }
        var tmpTables = [];
        angular.forEach(datatypes, function(child) {
            if (indexIn(child.id, $rootScope.datatypes) < 0) {
                $rootScope.datatypesMap[child.id] = child;
            }
            if (indexIn(child.id, $rootScope.addedDatatypes) < 0) {
                $rootScope.addedDatatypes.push(child);
            }
            if (indexIn(child.table.id, $rootScope.addedTables) < 0) {
                tmpTables.push(child.table.id);
            }
        });

        if (tmpTables.length > 0) {
            TableService.findAllByIds(tmpTables).then(function(tables) {
                $rootScope.addedTables = $rootScope.addedTables.concat(tables);
                angular.forEach(tables, function(table) {
                    $rootScope.tablesMap[table.id] = table;
                });
                $modalInstance.close($scope.selection.segment);
            }, function(error) {
                $rootScope.msg().text = "Sorry an error occured. Please try again";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
        } else {
            $modalInstance.close($scope.selection.segment);
        }
    };

    $scope.submit = function() {
        console.log($scope.selection);
        var indexFromLibrary = indexIn($scope.selection.segment.id, $scope.segmentLibrary.children);
        var indexFromCollection = indexIn($scope.selection.segment.id, $rootScope.segments);
        var indexFromMap = $rootScope.segmentsMap[$scope.selection.segment.id] != undefined && $rootScope.segmentsMap[$scope.selection.segment.id] != null ? 100 : -1;
        if (indexFromLibrary < 0 | indexFromCollection < 0 | indexFromMap < 0) {
            SegmentService.get($scope.selection.segment.id).then(function(full) {
                $scope.ext = $scope.selection.segment.ext;
                $scope.selection.segment = full;
                $scope.selection.segment["type"] = "segment";
                SegmentService.collectDatatypes(full.id).then(function(datatypes) {
                    collectNewSegmentAndDatatypesAndTables($scope.selection.segment, datatypes);
                }, function(error) {
                    $scope.loadingSelection = false;
                    $rootScope.msg().text = "Sorry could not load the data type";
                    $rootScope.msg().type = "danger";
                    $rootScope.msg().show = true;
                });
            }, function(error) {
                $scope.resultsLoading = false;
                $rootScope.msg().text = "Sorry could not load the data type";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
        } else {
            $modalInstance.close($scope.selection.segment);
        }
    };
    $scope.cancel = function() {
        $scope.resetMap();
        $modalInstance.dismiss('cancel');
    };


    $scope.validateLabel = function(label, name) {
        if (label && !label.startsWith(name)) {
            return false;
        }
        return true;
    };

    $scope.findDTByComponentId = function(componentId) {
        return $rootScope.parentsMap && $rootScope.parentsMap[componentId] ? $rootScope.parentsMap[componentId] : null;
    };

    $scope.isSub = function(component) {
        return $scope.isSubDT(component);
    };

    $scope.isSubDT = function(component) {
        return component.type === 'component' && $rootScope.parentsMap && $rootScope.parentsMap[component.id] && $rootScope.parentsMap[component.id].type === 'component';
    };

    $scope.hasChildren = function(node) {
        return node && node != null && ((node.fields && node.fields.length > 0) || (node.datatype && $rootScope.getDatatype(node.datatype.id) && $rootScope.getDatatype(node.datatype.id).components && $rootScope.getDatatype(node.datatype.id).components.length > 0));
    };


    $scope.validateLabel = function(label, name) {
        if (label && !label.startsWith(name)) {
            return false;
        }
        return true;
    };


    $scope.isRelevant = function(node) {
        return SegmentService.isRelevant(node);
    };

    $scope.isBranch = function(node) {
        SegmentService.isBranch(node);
    };

    $scope.isVisible = function(node) {
        return SegmentService.isVisible(node);
    };

    $scope.children = function(node) {
        return SegmentService.getNodes(node);
    };

    $scope.getParent = function(node) {
        return SegmentService.getParent(node);
    };

    $scope.getSegmentLevelConfStatements = function(element) {
        return SegmentService.getSegmentLevelConfStatements(element);
    };

    $scope.getSegmentLevelPredicates = function(element) {
        return SegmentService.getSegmentLevelPredicates(element);
    };


    $scope.isChildSelected = function(component) {
        return $scope.selectedChildren.indexOf(component) >= 0;
    };

    $scope.isChildNew = function(component) {
        return component && component != null && component.status === 'DRAFT';
    };

    var containsId = function(id, library) {
        for (var i = 0; i < library.children.length; i++) {
            if (library.children[i].id === id) {
                return true;
            }
        }
    };

    $scope.resetMap = function() {
        if ($rootScope.addedDatatypes = null) {
            angular.forEach($rootScope.addedDatatypes, function(child) {
                delete $rootScope.datatypesMap[child];
            });
        }
    };

    $scope.getLocalDatatypeLabel = function(link) {
        return link != null ? $rootScope.getLabel(link.name, link.ext) : null;
    };

    $scope.getLocalSegmentLabel = function(link) {
        return link != null ? $rootScope.getLabel(link.name, link.ext) : null;
    };

    $scope.loadLibrariesByFlavorName().then(function(done) {
        $scope.selection.selected = $scope.currentSegment.id;
        $scope.selectSegment($scope.currentSegment);
    });

});

angular.module('igl').controller('MessageViewCtrl', function($scope, $rootScope, Restangular) {
    $scope.loading = false;
    $scope.msg = null;
    $scope.messageData = [];
    $scope.setData = function(node) {
        if (node) {
            if (node.type === 'message') {
                angular.forEach(node.children, function(segmentRefOrGroup) {
                    $scope.setData(segmentRefOrGroup);
                });
            } else if (node.type === 'group') {
                $scope.messageData.push({ name: "-- " + node.name + " begin" });
                if (node.children) {
                    angular.forEach(node.children, function(segmentRefOrGroup) {
                        $scope.setData(segmentRefOrGroup);
                    });
                }
                $scope.messageData.push({ name: "-- " + node.name + " end" });
            } else if (node.type === 'segment') {
                $scope.messageData.push + (node);
            }
        }
    };


    $scope.init = function(message) {
        $scope.loading = true;
        $scope.msg = message;
        console.log(message.id);
        $scope.setData($scope.msg);
        $scope.loading = false;
    };

    //        $scope.hasChildren = function (node) {
    //            return node && node != null && node.type !== 'segment' && node.children && node.children.length > 0;
    //        };

});

angular.module('igl').controller('ConfirmMessageDeleteCtrl', function($scope, $modalInstance, messageToDelete, $rootScope, MessagesSvc, IgDocumentService, CloneDeleteSvc) {
    $scope.messageToDelete = messageToDelete;
    $scope.loading = false;
    $scope.delete = function() {
        $scope.loading = true;
        IgDocumentService.deleteMessage($rootScope.igdocument.id, $scope.messageToDelete.id).then(function(res) {
            MessagesSvc.delete($scope.messageToDelete).then(function(result) {
                // We must delete from two collections.
                //CloneDeleteSvc.execDeleteMessage($scope.messageToDelete);
                if ($rootScope.messages.children) {
                    var index = MessagesSvc.findOneChild($scope.messageToDelete.id, $rootScope.messages.children);
                    if (index >= 0) {
                        $rootScope.messages.children.splice(index, 1);
                    }
                }

                var tmp = MessagesSvc.findOneChild($scope.messageToDelete.id, $rootScope.igdocument.profile.messages.children);
                if (tmp != null) {
                    var index = $rootScope.igdocument.profile.messages.children.indexOf(tmp);
                    if (index >= 0) {
                        $rootScope.igdocument.profile.messages.children.splice(index, 1);
                    }
                }

                $rootScope.messagesMap[$scope.messageToDelete.id] = null;
                $rootScope.references = [];
                if ($rootScope.message != null && $rootScope.message.id === $scope.messageToDelete.id) {
                    $rootScope.message = null;
                }
                $rootScope.msg().text = "messageDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $scope.loading = false;
                $modalInstance.close($scope.messageToDelete);
            }, function(error) {
                $rootScope.msg().text = error.data.text;
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $scope.loading = false;
            });
        }, function(error) {
            $rootScope.msg().text = error.data.text;
            $rootScope.msg().type = "danger";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loading = false;
        });
    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('AddSegmentCtrl', function($scope, $modalInstance, segments, place, $rootScope, $http, ngTreetableParams, SegmentService, MessageService, blockUI) {
    $scope.segmentParent = place;
    //console.log(place);


    // $scope.segmentss = result.filter(function(current) {
    //     return segments.filter(function(current_b) {
    //         return current_b.id == current.id;
    //     }).length == 0
    // });

    $scope.newSegment = {
        accountId: null,
        comment: "",
        conformanceStatements: [],
        date: null,
        hl7Version: null,
        id: "",
        libIds: [],
        max: "",
        min: "",
        participants: [],
        position: "",
        predicates: [],
        ref: {
            ext: null,
            id: "",
            label: "",
            name: ""
        },
        scope: null,
        status: null,
        type: "segmentRef",
        usage: "",
        version: null

    };
    $scope.$watch('newSeg', function() {
        if ($scope.newSeg) {
            $scope.newSegment.id = new ObjectId().toString();
            $scope.newSegment.ref.ext = $scope.newSeg.ext;
            $scope.newSegment.ref.id = $scope.newSeg.id;
            $scope.newSegment.ref.name = $scope.newSeg.name;

            if (place.type === "message") {

                $scope.newSegment.position = place.children[place.children.length - 1].position + 1;
            } else if (place.obj && place.obj.type === "group") {
                if (place.children.length !== 0) {

                    $scope.newSegment.position = place.children[place.children.length - 1].obj.position + 1;
                    console.log("position");
                    console.log($scope.newSegment.position);

                } else {
                    $scope.newSegment.position = 1;
                }

            }

        }

    }, true);
    $scope.isInSegs = function(segment) {
        console.log(segment);
        console.log(segments.indexOf(segment));
        if (segment && segments.indexOf(segment) === -1) {
            return false;
        } else {
            return true;
        }

    };
    $scope.selectUsage = function(usage) {
        console.log(usage);
        if (usage === 'X' || usage === 'W') {
            $scope.newSegment.max = 0;
            $scope.newSegment.min = 0;
            $scope.disableMin = true;
            $scope.disableMax = true;

        } else if (usage === 'R') {
            $scope.newSegment.min = 1;

            $scope.disableMin = true;
            $scope.disableMax = false;
        } else if (usage === 'RE' || usage === 'O') {
            $scope.newSegment.min = 0;

            $scope.disableMin = true;
            $scope.disableMax = false;

        } else {
            $scope.disableMin = false;
            $scope.disableMax = false;

        }

    };
    $scope.selectSeg = function(segment) {
        $scope.newSeg = segment;
    };
    $scope.selected = function() {
        return ($scope.newSeg !== undefined);
    };
    $scope.unselect = function() {
        $scope.newSeg = undefined;
    };
    $scope.isActive = function(id) {
        if ($scope.newSeg) {
            return $scope.newSeg.id === id;
        } else {
            return false;
        }
    };


    $scope.addSegment = function() {
        blockUI.start();
        if (place.type === "message") {


            $rootScope.message.children.push($scope.newSegment);
            MessageService.updatePosition(place.children, $scope.newSegment.position - 1, $scope.position - 1);

        } else if (place.obj && place.obj.type === "group") {

            $scope.path = place.path.replace(/\[[0-9]+\]/g, '');
            $scope.path = $scope.path.split(".");

            MessageService.addSegToPath($scope.path, $rootScope.message, $scope.newSegment, $scope.newSegment.position - 1, $scope.position - 1);
        }




        $rootScope.messageTree = null;
        $rootScope.processMessageTree($rootScope.message);
        //console.log($rootScope.messageTree);

        if ($scope.messagesParams) {
            $scope.messagesParams.refresh();
        }
        blockUI.stop();
        $modalInstance.close();

    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('AddGroupCtrl', function($scope, $modalInstance, segments, place, $rootScope, $http, ngTreetableParams, SegmentService, MessageService, blockUI) {
    $scope.groupParent = place;

    $scope.newGroup = {
        accountId: null,
        children: [],
        comment: "",
        conformanceStatements: [],
        date: null,
        hl7Version: null,
        id: "",
        libIds: [],
        max: "",
        min: "",
        name: "",
        participants: [],
        position: "",
        predicates: [],
        scope: null,
        status: null,
        type: "group",
        usage: "",
        version: null

    };
    $scope.selectUsage = function(usage) {
        console.log(usage);
        if (usage === 'X' || usage === 'W') {
            $scope.newGroup.max = 0;
            $scope.newGroup.min = 0;
            $scope.disableMin = true;
            $scope.disableMax = true;

        } else if (usage === 'R') {
            $scope.newGroup.min = 1;

            $scope.disableMin = true;
            $scope.disableMax = false;
        } else if (usage === 'RE' || usage === 'O') {
            $scope.newGroup.min = 0;

            $scope.disableMin = true;
            $scope.disableMax = false;

        } else {
            $scope.disableMin = false;
            $scope.disableMax = false;

        }

    };


    $scope.addGroup = function() {
        blockUI.start();

        $scope.newGroup.id = new ObjectId().toString();
        $scope.newGroup.name = $scope.grpName;
        if (place.children.length !== 0) {
            if (place.type === "message") {
                $scope.newGroup.position = place.children[place.children.length - 1].position + 1;


            } else {
                $scope.newGroup.position = place.children[place.children.length - 1].obj.position + 1;

            }

        } else {
            $scope.newGroup.position = 1;
        }


        if (place.type === "message") {
            $rootScope.message.children.push($scope.newGroup);
            MessageService.updatePosition(place.children, $scope.newGroup.position - 1, $scope.position - 1);

        } else if (place.obj && place.obj.type === "group") {
            $scope.path = place.path.replace(/\[[0-9]+\]/g, '');
            $scope.path = $scope.path.split(".");

            MessageService.addSegToPath($scope.path, $rootScope.message, $scope.newGroup, $scope.newGroup.position - 1, $scope.position - 1);

            //place.children.push($scope.newSegment);
        }


        $rootScope.messageTree = null;
        $rootScope.processMessageTree($rootScope.message);
        //console.log($rootScope.messageTree);

        if ($scope.messagesParams) {
            $scope.messagesParams.refresh();
        }
        blockUI.stop();
        $modalInstance.close();


    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('DeleteSegmentRefOrGrpCtrl', function($scope, $modalInstance, segOrGrpToDelete, $rootScope, MessageService, blockUI) {
    $scope.segOrGrpToDelete = segOrGrpToDelete;
    $scope.loading = false;
    $scope.updatePosition = function(node) {
        angular.forEach(node.children, function(child) {
            child.position = node.children.indexOf(child) + 1;

        })

    };
    $scope.delete = function() {
        $scope.loading = true;
        blockUI.start();
        $scope.path = segOrGrpToDelete.path.replace(/\[[0-9]+\]/g, '');
        $scope.path = $scope.path.split(".");
        MessageService.deleteSegFromPath($scope.path, $rootScope.message).then(function() {
            if (segOrGrpToDelete.obj.type === 'group') {
                $rootScope.msg().text = "GrpDeleteSuccess";
            } else {
                $rootScope.msg().text = "SegmentRefDeleteSuccess";
            }


            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loading = false;
            $scope.updatePosition($rootScope.parentGroup);
            $rootScope.messageTree = null;
            $rootScope.processMessageTree($rootScope.message);
            blockUI.stop();
            $modalInstance.close($scope.segOrGrpToDelete);
        }, function(error) {
            $rootScope.msg().text = error.data.text;
            $rootScope.msg().type = "danger";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loading = false;
            blockUI.stop();
        });


    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('OtoXCtrl', function($scope, $modalInstance, message, $rootScope, blockUI) {
    console.log(message);
    $scope.message = message;
    $scope.loading = false;

    $scope.confirm = function(message) {
        $scope.loading = true;
        blockUI.start();
        if ($scope.message.type === 'message') {
            for (var node = 0; node < message.children.length; node++) {
                if (message.children[node].usage === "O") {
                    message.children[node].usage = "X";
                    message.children[node].max = 0;
                    message.children[node].min = 0;

                }
                if (message.children[node].type === "group") {

                    $scope.confirm(message.children[node])
                }

            }
        } else if ($scope.message.type === 'segment') {
            for (var node = 0; node < message.fields.length; node++) {
                if (message.fields[node].usage === "O") {
                    message.fields[node].usage = "X";
                    message.fields[node].max = 0;
                    message.fields[node].min = 0;

                }




            }
        } else if ($scope.message.type === 'datatype') {
            for (var node = 0; node < message.components.length; node++) {
                if (message.components[node].usage === "O") {
                    message.components[node].usage = "X";
                    message.components[node].max = 0;
                    message.components[node].min = 0;

                }




            }
        }

        $rootScope.msg().text = "OtoXSuccess";
        $rootScope.msg().type = "success";
        $rootScope.msg().show = true;
        $rootScope.manualHandle = true;
        $scope.loading = false;
        $rootScope.messageTree = null;
        $rootScope.processMessageTree($rootScope.message);
        blockUI.stop();
        $modalInstance.close($scope.message);
    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('redirectCtrl', function($scope, $modalInstance, destination, $rootScope) {
    $scope.destination = destination;
    $scope.loading = false;

    $scope.confirm = function() {


        $modalInstance.close($scope.destination);



    };


    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };


});

angular.module('igl').controller('cmpMessageCtrl', function($scope, $modal, ObjectDiff, orderByFilter, $rootScope, $q, $interval, ngTreetableParams, $http, StorageService, userInfoService, IgDocumentService, SegmentService, DatatypeService, SegmentLibrarySvc, DatatypeLibrarySvc, TableLibrarySvc, CompareService) {

    $scope.msgChanged = false;
    var ctrl = this;
    this.messageId = -1;

    $scope.isDeltaCalled = false;
    $scope.setDeltaToF = function() {
        $scope.isDeltaCalled = false;
    }


    $scope.scopes = [{
        name: "USER",
        alias: "My IG"
    }, {
        name: "HL7STANDARD",
        alias: "Base HL7"
    }];
    var listHL7Versions = function() {
        return $http.get('api/igdocuments/findVersions', {
            timeout: 60000
        }).then(function(response) {
            var hl7Versions = [];
            var length = response.data.length;
            for (var i = 0; i < length; i++) {
                hl7Versions.push(response.data[i]);
            }
            return hl7Versions;
        });
    };

    var init = function() {
        $scope.isDeltaCalled = true;
        $rootScope.deltaMsgList = [];
        ctrl.messageId = -1;
        $scope.message1 = angular.copy($rootScope.message);
        $scope.version1 = angular.copy($rootScope.igdocument.profile.metaData.hl7Version);

        $scope.scope1 = "USER";
        $scope.ig1 = angular.copy($rootScope.igdocument.metaData.title);
        $scope.segList1 = angular.copy($rootScope.segments);
        $scope.dtList1 = angular.copy($rootScope.datatypes);
        $scope.version2 = angular.copy($scope.version1);
        console.log($scope.scopes);
        console.log($scope.scopes[1]);
        $scope.scope2 = "HL7STANDARD";
        listHL7Versions().then(function(versions) {

            $scope.versions = versions;

            if ($scope.dynamicMsg_params) {
                $scope.showDelta = true;
                $scope.status.isFirstOpen = true;
                $scope.dynamicMsg_params.refresh();
            }

        });
    };

    $scope.$on('event:loginConfirmed', function(event) {
        init();
    });
    $rootScope.$on('event:initMessage', function(event) {
        $scope.findAllGlobalConstraints();
        if ($scope.isDeltaCalled) {
            init();
        }
    });
    $rootScope.$on('event:openMsgDelta', function(event) {
        init();
    });

    //init();


    $scope.status = {
        isCustomHeaderOpen: false,
        isFirstOpen: true,
        isSecondOpen: true,
        isFirstDisabled: false
    };


    $scope.setVersion2 = function(vr) {
        $scope.version2 = vr;

    };
    $scope.setScope2 = function(scope) {

        $scope.scope2 = scope;
    };

    $scope.$watchGroup(['message1', 'message2'], function() {
        $scope.msgChanged = true;


    }, true);
    $scope.$watchGroup(['version2', 'scope2'], function() {
        $scope.igList2 = [];
        $scope.messages2 = [];
        $scope.ig2 = "";
        console.log("==============");
        if ($scope.scope2 && $scope.version2) {
            IgDocumentService.getIgDocumentsByScopesAndVersion([$scope.scope2], $scope.version2).then(function(result) {
                if (result) {
                    if ($scope.scope2 === "HL7STANDARD") {
                        $scope.igDisabled2 = true;
                        $scope.ig2 = {
                            id: result[0].id,
                            title: result[0].metaData.title
                        };
                        console.log($scope.ig2);
                        $scope.igList2.push($scope.ig2);
                        $scope.setIG2($scope.ig2);
                    } else {
                        $scope.igDisabled2 = false;
                        for (var i = 0; i < result.length; i++) {
                            $scope.igList2.push({
                                id: result[i].id,
                                title: result[i].metaData.title,
                            });
                        }
                    }
                }
            });

        }

    }, true);

    $scope.setMsg2 = function(msg) {

        if (msg === -1) {
            $scope.message2 = {};
        } else {
            $scope.message2 = $scope.messages2[msg];
            console.log($scope.message2);

        }
        //$scope.segment2 = segment;
    };
    $scope.setIG2 = function(ig) {
        if (ig) {
            IgDocumentService.getOne(ig.id).then(function(igDoc) {
                SegmentLibrarySvc.getSegmentsByLibrary(igDoc.profile.segmentLibrary.id).then(function(segments) {
                    DatatypeLibrarySvc.getDatatypesByLibrary(igDoc.profile.datatypeLibrary.id).then(function(datatypes) {
                        TableLibrarySvc.getTablesByLibrary(igDoc.profile.tableLibrary.id).then(function(tables) {
                            $scope.messages2 = [];
                            $scope.msg2 = "";
                            if (igDoc) {
                                $scope.segList2 = angular.copy(segments);
                                //$scope.segList2 = orderByFilter($scope.segList2, 'name');
                                $scope.dtList2 = angular.copy(datatypes);
                                $scope.tableList2 = angular.copy(tables);
                                $scope.messages2 = orderByFilter(igDoc.profile.messages.children, 'name');
                                $scope.segments2 = orderByFilter(segments, 'name');
                                $scope.datatypes2 = orderByFilter(datatypes, 'name');
                                $scope.tables2 = orderByFilter(tables, 'bindingIdentifier');
                            }
                        });
                    });
                });

            });

            //$scope.messages2 = ($scope.findIGbyID(JSON.parse(ig).id)).profile.messages.children;

        }

    };

    $scope.hideMsg = function(msg1, msg2) {

        if (msg2) {
            return !(msg1.structID === msg2.structID);
        } else {
            return false;
        }
    };
    $scope.disableMsg = function(msg1, msg2) {

        if (msg2) {
            return (msg1.id === msg2.id);
        } else {
            return false;
        }
    };




    $scope.dynamicMsg_params = new ngTreetableParams({
        getNodes: function(parent) {
            if ($rootScope.deltaMsgList !== undefined) {

                //return parent ? parent.fields : $scope.test;
                if (parent) {
                    if (parent.fields) {
                        return parent.fields;
                    } else if (parent.components) {
                        return parent.components;
                    } else if (parent.segments) {
                        return parent.segments;
                    } else if (parent.codes) {
                        return parent.codes;
                    }

                } else {
                    return $rootScope.deltaMsgList;
                }

            }
        },
        getTemplate: function(node) {
            return 'tree_node';
        }
    });

    $scope.cmpMessage = function(msg1, msg2) {
        $rootScope.deltaMap = {};
        $scope.loadingSelection = true;
        $scope.msgChanged = false;
        $scope.vsTemplate = false;
        $scope.loadingSelection = false;
        $rootScope.deltaMsgList = CompareService.cmpMessage(JSON.stringify(msg1), JSON.stringify(msg2), $scope.dtList1, $scope.dtList2, $scope.segList1, $scope.segList2);
        //$scope.dataList = result;
        console.log($rootScope.deltaMsgList);

        if ($scope.dynamicMsg_params) {
            console.log($rootScope.deltaMsgList);
            $scope.showDelta = true;
            $scope.status.isSecondOpen = true;
            $scope.dynamicMsg_params.refresh();
        }
    };
});

angular.module('igl').controller('GlobalPredicateCtrl', function($scope, segmentsMap, config, tables, selectedMessage, $rootScope, $q, $mdDialog, selectedNode) {
    $scope.dialogStep = 0;
    $scope.segmentsMap = segmentsMap;
    $scope.config = config;
    $scope.tables = tables;
    $scope.selectedMessage = angular.copy(selectedMessage);
    $scope.selectedMessage.pathInfoSet = [];
    $scope.selectedNode = selectedNode;
    $scope.constraints = [];
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = null;
    $scope.targetContext = null;
    $scope.treeDataForMessage = [];
    $scope.treeDataForContext = [];
    $scope.constraintType = 'Plain';
    $scope.firstNodeData = null;
    $scope.secondNodeData = null;
    $scope.changed = false;
    $scope.treeDataForMessage.push($scope.selectedMessage);
    $scope.draggingStatus = null;
    $scope.listGlobalPredicates = [];
    $scope.existingPredicate = null;
    $scope.existingContext = null;
    $scope.tempPredicates = [];
    $scope.contextKey = null;

    $scope.getDialogStyle = function(){
        if ($scope.dialogStep === 0) return "width: 70%";
        if ($scope.dialogStep === 1) return "width: 30%";
        if ($scope.dialogStep === 2) return "width: 90%";
        if ($scope.dialogStep === 3) return "width: 50%";
        return "width: 90%";
    };

    $scope.isEmptyConstraintID = function(newConstraint) {
        if (newConstraint && newConstraint.constraintId === null) return true;
        if (newConstraint && newConstraint.constraintId === '') return true;

        return false;
    };

    $scope.isEmptyConstraintVerb = function(newConstraint) {
        if (newConstraint && newConstraint.verb === null) return true;

        return false;
    };

    $scope.isEmptyConstraintPattern = function(newConstraint) {
        if (newConstraint && newConstraint.contraintType === null) return true;

        return false;
    };

    $scope.isEmptyConstraintValue = function(newConstraint) {
        if (newConstraint && newConstraint.value === null) return true;

        return false;
    };

    $scope.isEmptyConstraintValue2 = function(newConstraint) {
        if (newConstraint && newConstraint.value2 === null) return true;

        return false;
    };

    $scope.getUpdatedBindingIdentifier = function(table) {
        if (table.hl7Version && table.hl7Version !== '') {
            return table.bindingIdentifier + "_" + table.hl7Version.split(".").join("-");
        }
        return table.bindingIdentifier;
    };

    $scope.goNext = function() {
        $scope.dialogStep = $scope.dialogStep + 1;
    };

    $scope.goBack = function () {
        $scope.dialogStep = $scope.dialogStep - 1;
    };

    $scope.selectPredicate = function (c){
        angular.forEach($scope.tempPredicates, function(p) {
            p.selected = false;
        });
        c.selected = true;
        $scope.existingPredicate = c;
        $scope.existingContext = $scope.selectedContextNode;

        if (!$scope.existingContext.positionPath || $scope.existingContext.positionPath == '') {
            $scope.existingPredicate.constraintTarget = $scope.selectedNode.path;
        } else {
            $scope.existingPredicate.constraintTarget = $scope.selectedNode.path.replace($scope.existingContext.positionPath + '.', '');
        }
    };

    $scope.setChanged = function() {
        $scope.changed = true;
    };

    $scope.toggleChildren = function(data) {
        data.childrenVisible = !data.childrenVisible;
        data.folderClass = data.childrenVisible ? "fa-caret-down" : "fa-caret-right";
    };

    $scope.beforeNodeDrop = function() {
        var deferred = $q.defer();
        if ($scope.draggingStatus === 'ContextTreeNodeDragging') {
            deferred.resolve();
        } else {
            deferred.reject();
        }
        return deferred.promise;
    };

    $scope.selectContext = function(selectedContextNode) {
        $scope.contextKey = new ObjectId().toString();
        $scope.selectedContextNode = selectedContextNode;
        $scope.selectedContextNode.contextKey = $scope.contextKey;
        $scope.selectedContextNode.pathInfoSet = [];
        $scope.generatePathInfo($scope.selectedContextNode, ".", ".", "1", false, null);
        $scope.initPredicate();
        $scope.initComplexPredicate();
        $scope.treeDataForContext=[];
        $scope.treeDataForContext.push($scope.selectedContextNode);
    };

    $scope.afterFirstNodeDrop = function() {
        $scope.draggingStatus = null;
        $scope.newConstraint.pathInfoSet_1 = $scope.firstNodeData.pathInfoSet;
        $scope.generateFirstPositionAndLocationPath();
    };

    $scope.afterSecondNodeDrop = function() {
        $scope.draggingStatus = null;
        $scope.newConstraint.pathInfoSet_2 = $scope.secondNodeData.pathInfoSet;
        $scope.generateSecondPositionAndLocationPath();
    };

    $scope.generateFirstPositionAndLocationPath = function() {
        if ($scope.newConstraint.pathInfoSet_1) {
            var positionPath = '';
            var locationPath = '';
            for (var i in $scope.newConstraint.pathInfoSet_1) {
                if (i > 0) {
                    var pathInfo = $scope.newConstraint.pathInfoSet_1[i];
                    positionPath = positionPath + "." + pathInfo.positionNumber + "[" + pathInfo.instanceNumber + "]";
                    locationPath = locationPath + "." + pathInfo.locationName + "[" + pathInfo.instanceNumber + "]";

                    if (i == $scope.newConstraint.pathInfoSet_1.length - 1) {
                        locationPath = locationPath + " (" + pathInfo.nodeName + ")";
                    }
                }
            }

            $scope.newConstraint.position_1 = positionPath.substr(1);
            $scope.newConstraint.location_1 = locationPath.substr(1);
        }
    }

    $scope.generateSecondPositionAndLocationPath = function() {
        if ($scope.newConstraint.pathInfoSet_2) {
            var positionPath = '';
            var locationPath = '';
            for (var i in $scope.newConstraint.pathInfoSet_2) {
                if (i > 0) {
                    var pathInfo = $scope.newConstraint.pathInfoSet_2[i];
                    positionPath = positionPath + "." + pathInfo.positionNumber + "[" + pathInfo.instanceNumber + "]";
                    locationPath = locationPath + "." + pathInfo.locationName + "[" + pathInfo.instanceNumber + "]";

                    if (i == $scope.newConstraint.pathInfoSet_2.length - 1) {
                        locationPath = locationPath + " (" + pathInfo.nodeName + ")";
                    }
                }
            }

            $scope.newConstraint.position_2 = positionPath.substr(1);
            $scope.newConstraint.location_2 = locationPath.substr(1);
        }
    }

    $scope.draggingPredicate = function(event, ui, nodeData) {
        $scope.draggingStatus = 'PredicateDragging';
    };

    $scope.draggingNodeFromContextTree = function(event, ui, nodeData) {
        $scope.draggingStatus = 'ContextTreeNodeDragging';
    };

    $scope.generatePathInfo = function(current, positionNumber, locationName, instanceNumber, isInstanceNumberEditable, nodeName) {
        var pathInfo = {};
        pathInfo.positionNumber = positionNumber;
        pathInfo.locationName = locationName;
        pathInfo.nodeName = nodeName;
        pathInfo.instanceNumber = instanceNumber;
        pathInfo.isInstanceNumberEditable = isInstanceNumberEditable;
        current.pathInfoSet.push(pathInfo);

        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                var segGroup = current.children[i];
                segGroup.pathInfoSet = angular.copy(current.pathInfoSet);
                var childPositionNumber = segGroup.position;
                var childLocationName = '';
                var childNodeName = '';
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                if (segGroup.max != '1') {
                    childInstanceNumber = '*';
                    childisInstanceNumberEditable = true;
                }
                if (segGroup.type == 'group') {
                    childNodeName = segGroup.name;
                    childLocationName = segGroup.name.substr(segGroup.name.lastIndexOf('.') + 1);
                } else {
                    var s = angular.copy($rootScope.segmentsMap[segGroup.ref.id]);
                    s.id = new ObjectId().toString();
                    childLocationName = s.name;
                    childNodeName = s.name;
                    segGroup.segment = s;
                }
                $scope.generatePathInfo(segGroup, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        } else if (current.type == 'segmentRef') {
            var seg = current.segment;
            for (var i in seg.fields) {
                var f = seg.fields[i];
                f.pathInfoSet = angular.copy(current.pathInfoSet);

                var childPositionNumber = f.position;
                var childLocationName = f.position;
                var childNodeName = f.name;
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                if (f.max != '1') {
                    childInstanceNumber = '*';
                    childisInstanceNumberEditable = true;
                }
                var child = angular.copy($rootScope.datatypesMap[f.datatype.id]);
                child.id = new ObjectId().toString();
                f.child = child;
                $scope.generatePathInfo(f, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        } else if (current.type == 'field' || current.type == 'component') {
            var dt = current.child;
            for (var i in dt.components) {
                var c = dt.components[i];
                c.pathInfoSet = angular.copy(current.pathInfoSet);
                var childPositionNumber = c.position;
                var childLocationName = c.position;
                var childNodeName = c.name;
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                var child = angular.copy($rootScope.datatypesMap[c.datatype.id]);
                child.id = new ObjectId().toString();
                c.child = child;
                $scope.generatePathInfo(c, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        }
    };

    $scope.initComplexPredicate = function() {
        $scope.constraints = [];
        $scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
    }

    $scope.initPredicate = function() {
        $scope.newConstraint = angular.fromJson({
            pathInfoSet_1: null,
            pathInfoSet_2: null,
            position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            freeText: null,
            verb: null,
            ignoreCase: false,
            constraintId: null,
            contraintType: null,
            value: null,
            value2: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1',
            trueUsage: null,
            falseUsage: null,
        });
    };

    $scope.addFreeTextPredicate = function() {
        var cp = $rootScope.generateFreeTextPredicate('NOT Assigned', $scope.newConstraint);
        $scope.tempPredicates.push(cp);
        $scope.initPredicate();
    };

    $scope.addPredicate = function() {
        var cp = $rootScope.generatePredicate('NOT Assigned', $scope.newConstraint);
        $scope.tempPredicates.push(cp);
        $scope.initPredicate();
    };

    $scope.addComplexPredicate = function() {
        $scope.complexConstraint = $rootScope.generateCompositePredicate($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint, $scope.constraints);
        $scope.tempPredicates.push($scope.complexConstraint);
        $scope.initComplexPredicate();
    };

    $scope.deletePredicate = function() {
        $scope.existingPredicate = null;
        $scope.existingContext = null;
        $scope.setChanged();
    };

    $scope.deleteTempPredicate = function(predicate) {
        $scope.tempPredicates.splice($scope.tempPredicates.indexOf(predicate), 1);
    };

    $scope.cancel = function() {
        $mdDialog.hide();
    };

    $scope.save = function() {
        $scope.deleteExistingPredicate($scope.selectedMessage);
        if ($scope.existingPredicate != null) {
            $scope.addChangedPredicate($scope.selectedMessage);
        }
        $mdDialog.hide($scope.selectedMessage);
    };

    $scope.addChangedPredicate = function(current) {
        if (current.positionPath == $scope.existingContext.positionPath) {
            current.predicates.push($scope.existingPredicate);
        }

        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                $scope.addChangedPredicate(current.children[i]);
            }
        }
    }

    $scope.deleteExistingPredicate = function(current) {
        if (current.predicates && current.predicates.length > 0) {
            var toBeDeletePredicate = null;
            for (var i in current.predicates) {
                var positionPath = null;
                if (current.positionPath == null || current.positionPath == '') {
                    var positionPath = current.predicates[i].constraintTarget;
                } else {
                    var positionPath = current.positionPath + '.' + current.predicates[i].constraintTarget;
                }
                if (positionPath == $scope.selectedNode.path) {
                    toBeDeletePredicate = i;
                }
            }
            if (toBeDeletePredicate != null) current.predicates.splice(toBeDeletePredicate, 1);
        }
        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                $scope.deleteExistingPredicate(current.children[i]);
            }
        }
    };

    $scope.findAllGlobalPredicates = function() {
        $scope.listGlobalPredicates = [];
        $scope.travelMessage($scope.selectedMessage, '');
    };

    $scope.travelMessage = function(current, parrentPositionPath) {
        if (current.predicates && current.predicates.length > 0) {
            $scope.listGlobalPredicates.push(current);

            for (var i in current.predicates) {
                var positionPath = null;
                if (current.positionPath == null || current.positionPath == '') {
                    var positionPath = current.predicates[i].constraintTarget;
                } else {
                    var positionPath = current.positionPath + '.' + current.predicates[i].constraintTarget;
                }
                if (positionPath == $scope.selectedNode.path) {
                    $scope.existingPredicate = current.predicates[i];
                    $scope.existingContext = current;
                }
            }
        }

        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                var segGroup = current.children[i];

                if (parrentPositionPath == '') {
                    segGroup.positionPath = segGroup.position + '[1]';
                } else {
                    segGroup.positionPath = parrentPositionPath + '.' + segGroup.position + '[1]';
                }

                $scope.travelMessage(segGroup, segGroup.positionPath);
            }
        }
    };

    $scope.initPredicate();
    $scope.initComplexPredicate();
    $scope.findAllGlobalPredicates();
    $scope.generatePathInfo($scope.selectedMessage, ".", ".", "1", false, null, 'default');

});

angular.module('igl').controller('GlobalConformanceStatementCtrl', function($scope, segmentsMap, config, tables, selectedMessage, $rootScope, $q, $mdDialog) {
    $scope.dialogStep = 0;
    $scope.segmentsMap = segmentsMap;
    $scope.config = config;
    $scope.tables = tables;
    $scope.selectedMessage = angular.copy(selectedMessage);
    $scope.constraints = [];
    $scope.firstConstraint = null;
    $scope.secondConstraint = null;
    $scope.compositeType = null;
    $scope.complexConstraint = null;
    $scope.newComplexConstraintId = null;
    $scope.selectedContextNode = null;
    $scope.treeDataForMessage = [];
    $scope.treeDataForContext = [];
    $scope.constraintType = 'Plain';
    $scope.firstNodeData = null;
    $scope.secondNodeData = null;
    $scope.changed = false;
    $scope.selectedMessage.pathInfoSet = [];
    $scope.treeDataForMessage.push($scope.selectedMessage);
    $scope.draggingStatus = null;
    $scope.contextKey = null;

    $scope.setChanged = function() {
        $scope.changed = true;
    };

    $scope.toggleChildren = function(data) {
        data.childrenVisible = !data.childrenVisible;
        data.folderClass = data.childrenVisible ? "fa-caret-down" : "fa-caret-right";
    };

    $scope.beforeNodeDrop = function() {
        var deferred = $q.defer();
        if ($scope.draggingStatus === 'MessageTreeNodeDragging') {
            deferred.resolve();
        } else {
            deferred.reject();
        }
        return deferred.promise;
    };

    $scope.isEmptyConstraintID = function(newConstraint) {
        if (newConstraint && newConstraint.constraintId === null) return true;
        if (newConstraint && newConstraint.constraintId === '') return true;

        return false;
    };

    $scope.isEmptyConstraintVerb = function(newConstraint) {
        if (newConstraint && newConstraint.verb === null) return true;

        return false;
    };

    $scope.isEmptyConstraintPattern = function(newConstraint) {
        if (newConstraint && newConstraint.contraintType === null) return true;

        return false;
    };

    $scope.isEmptyConstraintValue = function(newConstraint) {
        if (newConstraint && newConstraint.value === null) return true;

        return false;
    };

    $scope.isEmptyConstraintValue2 = function(newConstraint) {
        if (newConstraint && newConstraint.value2 === null) return true;

        return false;
    };

    $scope.getUpdatedBindingIdentifier = function(table) {
        if (table.hl7Version && table.hl7Version !== '') {
            return table.bindingIdentifier + "_" + table.hl7Version.split(".").join("-");
        }
        return table.bindingIdentifier;
    };

    $scope.afterFirstNodeDrop = function() {
        $scope.draggingStatus = null;
        $scope.newConstraint.pathInfoSet_1 = $scope.firstNodeData.pathInfoSet;
        $scope.generateFirstPositionAndLocationPath();

    };

    $scope.afterSecondNodeDrop = function() {
        $scope.draggingStatus = null;
        $scope.newConstraint.pathInfoSet_2 = $scope.secondNodeData.pathInfoSet;
        $scope.generateSecondPositionAndLocationPath();
    };

    $scope.draggingNodeFromContextTree = function(event, ui, nodeData) {
        $scope.draggingStatus = 'MessageTreeNodeDragging';
    };


    $scope.selectContext = function(selectedContextNode) {
        $scope.treeDataForContext = [];
        $scope.contextKey = new ObjectId().toString();
        $scope.selectedContextNode = selectedContextNode;
        $scope.selectedContextNode.contextKey = $scope.contextKey;
        $scope.selectedContextNode.pathInfoSet = [];
        $scope.generatePathInfo($scope.selectedContextNode, ".", ".", "1", false, null);
        $scope.initConformanceStatement();
        $scope.treeDataForContext.push($scope.selectedContextNode);
    };

    $scope.goNext = function() {
        $scope.dialogStep = $scope.dialogStep + 1;
    };

    $scope.goBack = function () {
        $scope.dialogStep = $scope.dialogStep - 1;
    };

    $scope.generateFirstPositionAndLocationPath = function() {
        if ($scope.newConstraint.pathInfoSet_1) {
            var positionPath = '';
            var locationPath = '';
            for (var i in $scope.newConstraint.pathInfoSet_1) {
                if (i > 0) {
                    var pathInfo = $scope.newConstraint.pathInfoSet_1[i];
                    positionPath = positionPath + "." + pathInfo.positionNumber + "[" + pathInfo.instanceNumber + "]";
                    locationPath = locationPath + "." + pathInfo.locationName + "[" + pathInfo.instanceNumber + "]";

                    if (i == $scope.newConstraint.pathInfoSet_1.length - 1) {
                        locationPath = locationPath + " (" + pathInfo.nodeName + ")";
                    }
                }
            }

            $scope.newConstraint.position_1 = positionPath.substr(1);
            $scope.newConstraint.location_1 = locationPath.substr(1);
        }
    };

    $scope.generateSecondPositionAndLocationPath = function() {
        if ($scope.newConstraint.pathInfoSet_2) {
            var positionPath = '';
            var locationPath = '';
            for (var i in $scope.newConstraint.pathInfoSet_2) {
                if (i > 0) {
                    var pathInfo = $scope.newConstraint.pathInfoSet_2[i];
                    positionPath = positionPath + "." + pathInfo.positionNumber + "[" + pathInfo.instanceNumber + "]";
                    locationPath = locationPath + "." + pathInfo.locationName + "[" + pathInfo.instanceNumber + "]";

                    if (i == $scope.newConstraint.pathInfoSet_2.length - 1) {
                        locationPath = locationPath + " (" + pathInfo.nodeName + ")";
                    }
                }
            }

            $scope.newConstraint.position_2 = positionPath.substr(1);
            $scope.newConstraint.location_2 = locationPath.substr(1);
        }
    };

    $scope.draggingNodeFromMessageTree = function(event, ui, nodeData) {
        $scope.draggingStatus = 'MessageTreeNodeDragging';
    };

    $scope.generatePathInfo = function(current, positionNumber, locationName, instanceNumber, isInstanceNumberEditable, nodeName) {
        var pathInfo = {};
        pathInfo.positionNumber = positionNumber;
        pathInfo.locationName = locationName;
        pathInfo.nodeName = nodeName;
        pathInfo.instanceNumber = instanceNumber;
        pathInfo.isInstanceNumberEditable = isInstanceNumberEditable;
        current.pathInfoSet.push(pathInfo);

        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                var segGroup = current.children[i];
                segGroup.pathInfoSet = angular.copy(current.pathInfoSet);
                var childPositionNumber = segGroup.position;
                var childLocationName = '';
                var childNodeName = '';
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                if (segGroup.max != '1') {
                    childInstanceNumber = '*';
                    childisInstanceNumberEditable = true;
                }
                if (segGroup.type == 'group') {
                    childNodeName = segGroup.name;
                    childLocationName = segGroup.name.substr(segGroup.name.lastIndexOf('.') + 1);
                } else {
                    var s = angular.copy($rootScope.segmentsMap[segGroup.ref.id]);
                    s.id = new ObjectId().toString();
                    childLocationName = s.name;
                    childNodeName = s.name;
                    segGroup.segment = s;
                }
                $scope.generatePathInfo(segGroup, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        } else if (current.type == 'segmentRef') {
            var seg = current.segment;
            for (var i in seg.fields) {
                var f = seg.fields[i];
                f.pathInfoSet = angular.copy(current.pathInfoSet);

                var childPositionNumber = f.position;
                var childLocationName = f.position;
                var childNodeName = f.name;
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                if (f.max != '1') {
                    childInstanceNumber = '*';
                    childisInstanceNumberEditable = true;
                }
                var child = angular.copy($rootScope.datatypesMap[f.datatype.id]);
                child.id = new ObjectId().toString();
                f.child = child;
                $scope.generatePathInfo(f, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        } else if (current.type == 'field' || current.type == 'component') {
            var dt = current.child;
            for (var i in dt.components) {
                var c = dt.components[i];
                c.pathInfoSet = angular.copy(current.pathInfoSet);
                var childPositionNumber = c.position;
                var childLocationName = c.position;
                var childNodeName = c.name;
                var childInstanceNumber = "1";
                var childisInstanceNumberEditable = false;
                var child = angular.copy($rootScope.datatypesMap[c.datatype.id]);
                child.id = new ObjectId().toString();
                c.child = child;
                $scope.generatePathInfo(c, childPositionNumber, childLocationName, childInstanceNumber, childisInstanceNumberEditable, childNodeName);
            }
        }
    };

    $scope.initConformanceStatement = function() {
        $scope.newConstraint = angular.fromJson({
            pathInfoSet_1: null,
            pathInfoSet_2: null,
            position_1: null,
            position_2: null,
            location_1: null,
            location_2: null,
            freeText: null,
            verb: null,
            ignoreCase: false,
            constraintId: null,
            contraintType: null,
            value: null,
            value2: null,
            valueSetId: null,
            bindingStrength: 'R',
            bindingLocation: '1'
        });
    };

    $scope.initComplexStatement = function() {
        $scope.constraints = [];
        $scope.firstConstraint = null;
        $scope.secondConstraint = null;
        $scope.compositeType = null;
        $scope.complexConstraint = null;
        $scope.newComplexConstraintId = null;
    }

    $scope.addConformanceStatement = function() {
        var cs = $rootScope.generateConformanceStatement($scope.newConstraint);
        $scope.selectedContextNode.conformanceStatements.push(cs);
        $scope.changed = true;
        $scope.initConformanceStatement();
    };

    $scope.deleteConformanceStatement = function(conformanceStatement) {
        $scope.selectedContextNode.conformanceStatements.splice($scope.selectedContextNode.conformanceStatements.indexOf(conformanceStatement), 1);
        $scope.changed = true;
    };

    $scope.addFreeTextConformanceStatement = function() {
        var cs = $rootScope.generateFreeTextConformanceStatement($scope.newConstraint);
        $scope.selectedContextNode.conformanceStatements.push(cs);
        $scope.changed = true;
        $scope.initConformanceStatement();
    };

    $scope.addComplexConformanceStatement = function() {
        $scope.complexConstraint = $rootScope.generateCompositeConformanceStatement($scope.compositeType, $scope.firstConstraint, $scope.secondConstraint, $scope.constraints);
        $scope.complexConstraint.constraintId = $scope.newComplexConstraintId;
        $scope.selectedContextNode.conformanceStatements.push($scope.complexConstraint);
        $scope.initComplexStatement();
        $scope.changed = true;
    };

    $scope.cancel = function() {
        $mdDialog.hide();
    };

    $scope.save = function() {
        $rootScope.recordChanged();
        $mdDialog.hide($scope.selectedMessage);
    };

    $scope.initConformanceStatement();
    $scope.initComplexStatement();
    $scope.generatePathInfo($scope.selectedMessage, ".", ".", "1", false, null, 'default');

});

angular.module('igl').controller('DeleteMessagePredicateCtrl', function($scope, $modalInstance, position, message, $rootScope) {
    $scope.selectedMessage = message;
    $scope.position = position;
    $scope.delete = function() {
        $scope.deleteExistingPredicate($scope.selectedMessage);

        $modalInstance.close();
    };

    $scope.deleteExistingPredicate = function(current) {
        if (current.predicates && current.predicates.length > 0) {
            var toBeDeletePredicate = null;
            for (var i in current.predicates) {
                var positionPath = null;
                if (current.positionPath == null || current.positionPath == '') {
                    var positionPath = current.predicates[i].constraintTarget;
                } else {
                    var positionPath = current.positionPath + '.' + current.predicates[i].constraintTarget;
                }
                if (positionPath == $scope.position) {
                    toBeDeletePredicate = i;
                }
            }
            if (toBeDeletePredicate != null) current.predicates.splice(toBeDeletePredicate, 1);
        }
        if (current.type == 'message' || current.type == 'group') {
            for (var i in current.children) {
                $scope.deleteExistingPredicate(current.children[i]);
            }
        }
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('igl').controller('TableMappingMessageCtrl', function($scope, $modalInstance, currentNode, $rootScope, blockUI, TableService) {
    $scope.changed = false;
    $scope.currentNode = currentNode;
    $scope.isSingleValueSetAllowed = false;
    $scope.valueSetSelectedForSingleCode = null;
    $scope.mCode = null;
    $scope.mCodeSystem = null;

    $scope.singleCodeInit = function (){
        $scope.valueSetSelectedForSingleCode = null;
        $scope.mCode = null;
        $scope.mCodeSystem = null;
    };

    $scope.addManualCode = function () {
        $scope.selectedValueSetBindings = [];
        var code = {};
        code.value = $scope.mCode;
        code.codeSystem = $scope.mCodeSystem;
        $scope.selectedValueSetBindings.push({ tableId: null, location: positionPath, usage: $scope.currentNode.obj.usage, type: "singlecode", code : code});
        $scope.changed = true;
    };

    if(_.find($rootScope.config.singleValueSetDTs, function(singleValueSetDTs){
            return singleValueSetDTs == $rootScope.datatypesMap[$scope.currentNode.obj.datatype.id].name;
        })) $scope.isSingleValueSetAllowed = true;

    var pathArray = [];
    if($scope.currentNode.path) pathArray = $scope.currentNode.path.split('.');
    var positionPath = '';
    for (var i in pathArray) {
        var position = pathArray[i].split('[')[0];
        positionPath = positionPath + '.' + position;
    }

    if(positionPath != '') positionPath = positionPath.substr(1);
    $scope.selectedValueSetBindings = angular.copy(_.filter($rootScope.message.valueSetBindings, function(binding){ return binding.location == positionPath; }));
    $scope.listOfBindingLocations = null;

    if(_.find($rootScope.config.codedElementDTs, function(valueSetAllowedDT){
            return valueSetAllowedDT == $rootScope.datatypesMap[$scope.currentNode.obj.datatype.id].name;
        })) {
        for (var i = 0; i < $scope.selectedValueSetBindings.length; i++) {
            if (!$scope.selectedValueSetBindings[i].bindingLocation || $scope.selectedValueSetBindings[i].bindingLocation == '') {
                $scope.selectedValueSetBindings[i].bindingLocation = "1";
            }
        }

        var hl7Version = $rootScope.datatypesMap[$scope.currentNode.obj.datatype.id].hl7Version;
        if(!hl7Version) hl7Version = "2.5.1";

        $scope.listOfBindingLocations = $rootScope.config.bindingLocationListByHL7Version[hl7Version];
    };

    $scope.deleteBinding = function(binding){
        var index = $scope.selectedValueSetBindings.indexOf(binding);
        if (index >= 0) {
            $scope.selectedValueSetBindings.splice(index, 1);
        }
        $scope.changed = true;
    };

    $scope.isSelected = function (v){
        for (var i = 0; i < $scope.selectedValueSetBindings.length; i++) {
            if($scope.selectedValueSetBindings[i].tableId == v.id) return true;
        }
        return false;
    };

    $scope.selectValueSet = function (v){
        if($scope.isSingleValueSetAllowed) $scope.selectedValueSetBindings = [];
        if($scope.selectedValueSetBindings.length > 0 && $scope.selectedValueSetBindings[0].type == 'singlecode') $scope.selectedValueSetBindings = [];
        if($scope.listOfBindingLocations){
            $scope.selectedValueSetBindings.push({ tableId: v.id, bindingStrength: "R", location: positionPath, bindingLocation: "1", usage: $scope.currentNode.obj.usage, type: "valueset" });
        }else {
            $scope.selectedValueSetBindings.push({ tableId: v.id, bindingStrength: "R", location: positionPath, usage: $scope.currentNode.obj.usage, type: "valueset" });
        }
        $scope.changed = true;
    };

    $scope.unselectValueSet = function (v){
        var toBeDelBinding =_.find($scope.selectedValueSetBindings, function(binding){
            return binding.tableId == v.id;
        });
        var index = $scope.selectedValueSetBindings.indexOf(toBeDelBinding);
        if (index >= 0) {
            $scope.selectedValueSetBindings.splice(index, 1);
        }
        $scope.changed = true;
    };

    $scope.selectValueSetForSingleCode = function (v){
        TableService.getOne(v.id).then(function(tbl) {
            $scope.valueSetSelectedForSingleCode = tbl;
        }, function() {
        });
    };

    $scope.isCodeSelected = function (c){
        for (var i = 0; i < $scope.selectedValueSetBindings.length; i++) {
            if($scope.selectedValueSetBindings[i].code){
                if($scope.selectedValueSetBindings[i].code.id == c.id) return true;
            }
        }
        return false;
    };

    $scope.selectCode = function (c){
        $scope.selectedValueSetBindings = [];
        $scope.selectedValueSetBindings.push({ tableId: $scope.valueSetSelectedForSingleCode.id, location: positionPath, usage: $scope.currentNode.obj.usage, type: "singlecode", code : c});
        $scope.changed = true;
    };

    $scope.unselectCode = function(c){
        $scope.selectedValueSetBindings = [];
        $scope.changed = true;
    };

    $scope.saveMapping = function() {
        blockUI.start();
        var otherValueSetBindings = angular.copy(_.filter($rootScope.message.valueSetBindings, function(binding){ return binding.location != positionPath; }));
        $rootScope.message.valueSetBindings= $scope.selectedValueSetBindings.concat(otherValueSetBindings);
        blockUI.stop();

        $modalInstance.close();
    };

    $scope.ok = function() {
        $modalInstance.dismiss('cancel');
    };

});