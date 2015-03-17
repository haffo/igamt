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
package gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.controller;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.DatatypeService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.exception.ProfileNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author Harold Affo (harold.affo@nist.gov) Mar 17, 2015
 */

@RestController
@RequestMapping("/datatypes")
public class DatatypeController extends CommonController {

	Logger logger = LoggerFactory.getLogger(ProfileController.class);

	@Autowired
	private DatatypeService datatypeService;

	@RequestMapping(value = "/{targetId}", method = RequestMethod.POST)
	public Datatype clone(@PathVariable("targetId") Long targetId)
			throws ProfileNotFoundException {
		logger.info("Clone datatype with id=" + targetId);
		Datatype p = datatypeService.findOne(targetId);
		if (p == null) {
			throw new ProfileNotFoundException(targetId);
		}
		Datatype clone = null; // FIXME: clone datatype
		datatypeService.save(clone);
		return clone;
	}
}