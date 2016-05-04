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

import java.util.Comparator;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Constant;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Constant.SCOPE;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentLibrary;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentLibraryMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo.SegmentLibraryRepository;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.SegmentLibraryService;

/**
 * @author gcr1
 *
 */
@Service
public class SegmentLibraryServiceImpl implements SegmentLibraryService {

	Logger log = LoggerFactory.getLogger(SegmentLibraryServiceImpl.class);

	@Autowired
	private SegmentLibraryRepository segmentLibraryRepository;
	
	@Override
	public List<SegmentLibrary> findAll() {
		List<SegmentLibrary> segmentLibrary = segmentLibraryRepository.findAll();
		log.debug("SegmentLibraryRepository.findAll segmentLibrary=" + segmentLibrary.size());
		return segmentLibrary;
	}
	
	@Override
	public List<SegmentLibrary> findByScopes(List<SCOPE> scopes) {
		List<SegmentLibrary> segmentLibrary = segmentLibraryRepository.findByScopes(scopes);
		log.debug("SegmentLibraryRepository.findByScopes segmentLibrary=" + segmentLibrary.size());
		return segmentLibrary;
	}
	
	@Override
	public List<String> findHl7Versions() {
		return segmentLibraryRepository.findHl7Versions();
	}
	
	@Override
	public SegmentLibrary findById(String id) {
		return segmentLibraryRepository.findById(id);
	}

	@Override
	public List<SegmentLibrary> findByScopesAndVersion(List<SCOPE> scopes, String hl7Version) {
		log.info("SegmentLibraryServiceImpl.findByScopesAndVersion. start");
		List<SegmentLibrary> segmentLibraries = segmentLibraryRepository.findScopesNVersion(scopes, hl7Version);
		log.info("SegmentLibraryServiceImpl.findByScopesAndVersion segmentLibraries=" + segmentLibraries.size());
		return segmentLibraries;
	}

	@Override
	public List<SegmentLibrary> findByAccountId(Long accountId, String hl7Version) {
		List<SegmentLibrary> segmentLibrary = segmentLibraryRepository.findByAccountId(accountId, hl7Version);
		log.info("segmentLibrary=" + segmentLibrary.size());
		return segmentLibrary;
	}

	@Override
	public SegmentLibrary save(SegmentLibrary library) {
		SegmentLibrary segmentLibrary = segmentLibraryRepository.save(library);
		return segmentLibrary;
	}

	SegmentLibraryMetaData defaultMetadata() {
		SegmentLibraryMetaData metaData = new SegmentLibraryMetaData();
		metaData.setName("Master data type library");
		metaData.setOrgName("NIST");
		metaData.setDate(Constant.mdy.format(new Date()));
		return metaData;
	}

	@Override
	public SegmentLibrary create(String name, String ext, SCOPE scope, String hl7Version, Long accountId) {
		SegmentLibraryMetaData metaData = defaultMetadata();
		metaData.setName(name);
		metaData.setHl7Version(hl7Version);
		metaData.setExt(ext);
		SegmentLibrary segmentLibrary = new SegmentLibrary();
		segmentLibrary.setMetaData(metaData);
		segmentLibrary.setScope(scope);
		segmentLibrary.setAccountId(accountId);
		segmentLibrary.setDate(Constant.mdy.format(new Date()));
		segmentLibrary.setSectionDescription("Default description");
		segmentLibrary.setSectionTitle("Default title");
		segmentLibrary.setSectionContents("Default contents");
		segmentLibrary = segmentLibraryRepository.insert(segmentLibrary);
		return segmentLibrary;
	}

	@Override
	public void delete(SegmentLibrary library) {
		segmentLibraryRepository.delete(library);
	}
	
	class SegmentByLabel implements Comparator<Segment> {

		@Override
		public int compare(Segment thisDt, Segment thatDt) {
			return thatDt.getLabel().compareTo(thisDt.getLabel());
		}
	}
}