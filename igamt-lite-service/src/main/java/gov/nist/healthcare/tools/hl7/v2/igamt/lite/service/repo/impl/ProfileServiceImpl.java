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

package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.impl;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Component;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Field;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Group;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ProfileSummary;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Usage;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.tables.Code;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo.ProfileRepository;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.clone.ProfileClone;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.CodeService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.ComponentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.FieldService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.GroupService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.MessageService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.repo.SegmentRefService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.exception.ProfileNotFoundException;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map.Entry;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class ProfileServiceImpl implements ProfileService {

	@Autowired
	private ProfileRepository profileRepository;

	@Autowired
	private MessageService messageService;

	@Autowired
	private SegmentRefService segmentRefService;

	@Autowired
	private GroupService groupService;

	@Autowired
	private ComponentService componentService;

	@Autowired
	private FieldService fieldService;

	@Autowired
	private CodeService codeService;

	private ProfileClone profileClone;

	@Override
	@Transactional
	public Profile save(Profile p) {
		return profileRepository.save(p);
	}

	@Override
	@Transactional
	public void delete(Long id) {
		profileRepository.delete(id);
	}

	@Override
	public Profile findOne(Long id) {
		return profileRepository.findOne(id);
	}

	@Override
	public Iterable<ProfileSummary> findAllPreloadedSummaries() {
		return profileRepository.findAllPreloadedSummaries();
	}

	@Override
	public Iterable<ProfileSummary> findAllSummariesByUser(Long userId) {
		return profileRepository.findAllSummariesByUserId(userId);
	}

	@Override
	public Profile clone(Profile p) {
		return profileClone.clone(p);
	}

	/*
	 * { "component": { "59": { "usage": "C" }, "303": { "maxLength": "27" } } }
	 */
	@Override
	public String[] apply(String jsonChanges) {
		String[] errorList = new String[]{};

		try {
			Long id;
			Iterator<Entry<String, JsonNode>> nodes;
			Entry<String, JsonNode> node;
			JsonNode individualChanges;
			Entry<String, JsonNode> newValue;


			JsonFactory f = new JsonFactory();
			JsonParser jp = f.createJsonParser(jsonChanges);
			ObjectMapper mapper = new ObjectMapper();
			JsonNode rootNode = mapper.readTree(jp);

			//profile
			nodes = rootNode.get("profile").getFields();

			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();
				Profile p = this.findOne(id);
				if (p == null) {
					throw new ProfileNotFoundException(id);
				}
				BeanWrapper metadata = new BeanWrapperImpl(p.getMetaData());

				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					metadata.setPropertyValue(newValue.getKey(), newValue.getValue());
				}
				this.save(p);
			}

			//message
			nodes = rootNode.get("message").getFields();
			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();

				Message m = messageService.findOne(id);
				BeanWrapper message = new BeanWrapperImpl(m);
				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					message.setPropertyValue(newValue.getKey(), newValue.getValue());
				}
				messageService.save(m);
			}

			//segmentRef
			nodes = rootNode.get("segmentRef").getFields();

			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();

				SegmentRef s = segmentRefService.findOne(id);
				BeanWrapper segmentRef = new BeanWrapperImpl(s);

				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					if (newValue.getKey() == "usage"){
						((SegmentRefOrGroup) segmentRef).setUsage(Usage.fromValue(newValue.getValue().asText()));
					} else {
						segmentRef.setPropertyValue(newValue.getKey(), newValue.getValue());
					}
				}
				segmentRefService.save(s);
			}

			//group
			nodes = rootNode.get("group").getFields();
			while (nodes.hasNext()){
				node = nodes.next();
				//Group has a String id; node.getKey() is used directly
				individualChanges = node.getValue();

				Group g = groupService.findOne(node.getKey()); 
				BeanWrapper group = new BeanWrapperImpl(g);

				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					if (newValue.getKey() == "usage"){
						((SegmentRefOrGroup) group).setUsage(Usage.fromValue(newValue.getValue().asText()));
					} else {
						group.setPropertyValue(newValue.getKey(), newValue.getValue());
					}
				}
				groupService.save(g);
			}

			//component
			nodes = rootNode.get("component").getFields();
			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();

				Component c = componentService.findOne(id); 
				BeanWrapper component = new BeanWrapperImpl(c);

				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					if (newValue.getKey() == "usage"){
						((Component) component).setUsage(Usage.fromValue(newValue.getValue().asText()));
					} else {
						component.setPropertyValue(newValue.getKey(), newValue.getValue());
					}
				}
				componentService.save(c);
			}

			//field
			nodes = rootNode.get("field").getFields();
			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();

				Field f1 = fieldService.findOne(id); 
				BeanWrapper field = new BeanWrapperImpl(f1);

				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					if (newValue.getKey() == "usage"){
						((Field) field).setUsage(Usage.fromValue(newValue.getValue().asText()));
					} else {
						field.setPropertyValue(newValue.getKey(), newValue.getValue());
					}
				}
				fieldService.save(f1);
			}

			//code
			nodes = rootNode.get("code").getFields();
			while (nodes.hasNext()){
				node = nodes.next();
				id = Long.valueOf(node.getKey());
				individualChanges = node.getValue();

				Code c1 = codeService.findOne(id);
				BeanWrapper code = new BeanWrapperImpl(c1);
				Iterator<Entry<String, JsonNode>> newValues = individualChanges.getFields();
				while (newValues.hasNext()){
					newValue = newValues.next();
					code.setPropertyValue(newValue.getKey(), newValue.getValue());
				}
				codeService.save(c1);
			}

		}
		catch (JsonParseException | IOException e)
		{

		}


		//profileService.save(profile);
		return errorList;
		return new String[1];
	}
}