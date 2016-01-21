/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgement if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 */

/**
 * 
 * @author Olivier MARIE-ROSE
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile;

import java.util.List;

public interface IGDocumentCreationService {
	
	List<String> findHl7Versions();
	
	List<Profile> findProfilesByHl7Versions();
	
	List<String[]> summary(String hl7Version, List<String> messageIds);
	
	IGDocument createIntegratedProfile(List<String> msgIds, String hl7Version, Long accountId) throws IGDocumentException;

	IGDocument updateIntegratedProfile(List<String> msgIds, Profile pTarget) throws IGDocumentException;
	
}