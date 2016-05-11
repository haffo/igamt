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
package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.impl;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Constant.SCOPE;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo.MessageRepository;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.MessageService;

/**
 * @author gcr1
 *
 */
@Service
public class MessageServiceImpl implements MessageService {
	
	Logger log = LoggerFactory.getLogger(MessageServiceImpl.class);

	@Autowired
	private MessageRepository segmentRepository;
 	 
	
	@Override 
	public Message findById(String id) {
		log.info("MessageServiceImpl.findById=" + id);
		return segmentRepository.findOne(id);
	}
	
	@Override
	public Message save(Message segment) {
 		return segmentRepository.save(segment);
	}

	@Override
	public void delete(Message segment) {
		segmentRepository.delete(segment);
	}
	
	@Override
	public void delete(String id) {
		segmentRepository.delete(id);
	}
}