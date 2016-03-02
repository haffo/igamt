'use strict';

/**
 * @ngdoc function
 * @description
 * 
 * This service enables the MessageEvents structure to be accessed from both the
 * controllers of the Create IG Dialog.
 */

angular.module('igl').factory('MessageEventsSvc', function($http, ngTreetableParams) {
	
	var svc = this;
	
//	svc.messagesByVersion = {};
	
//	svc.state = {};
//	
//	svc.getState = function() {
//		return svc.state; 
//	}
//	
//	svc.putState = function(state) {
//		svc.state = state; 
//	}
	
	svc.getMessageEvents = function(hl7Version, messageIds) {
		return new ngTreetableParams( {
			getNodes: function(parent) {
				return parent ? parent.children : mes(hl7Version, messageIds);
			},
	        getTemplate: function(node) {
	            return 'MessageEventsNode.html';
	        },
	        options: {
	            onNodeExpand: function() {
	                console.log('A node was expanded!');
	            }
	        }
		});
	};
	
function mes(hl7Version, messageIds) {
	console.log("hl7Version=" + JSON.stringify(hl7Version));
	console.log("messageIds=" + JSON.stringify(messageIds));
	return $http.post(
			'api/igdocuments/messageListByVersion', angular.fromJson({
				"hl7Version" : hl7Version,
				"messageIds" : messageIds
			})).then(function(response) {
			return angular.fromJson(response.data)});
		};

	return svc;
});