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

package gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.config;

import java.util.List;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.AppInfo;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocumentScope;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo.AppInfoRepository;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.IGDocumentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.impl.ProfileSerializationImpl;

@Service
@PropertySource(value = "classpath:app-web-config.properties")
public class Bootstrap implements InitializingBean {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	ProfileService profileService;

	@Autowired
	IGDocumentService documentService;

	@Autowired
	private Environment env;

	@Autowired
	AppInfoRepository appInfoRepository;

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * org.springframework.beans.factory.InitializingBean#afterPropertiesSet()
	 */
	@Override
	public void afterPropertiesSet() throws Exception {
		// loadPreloadedIGDocuments();
		// loadDocumentsFromProfiles();
		loadAppInfo();
	}

	private void loadIGDocumentsFromProfiles() throws Exception {
		List<Profile> profiles = profileService.findAllProfiles();

		for (Profile p : profiles) {
			IGDocument d = new IGDocument();
			d.addProfile(p);
			documentService.save(d);
		}
	}

	private void loadPreloadedIGDocuments() throws Exception {
		String p = IOUtils.toString(this.getClass().getResourceAsStream("/profiles/VXU-Z22_Profile.xml"));
		String v = IOUtils.toString(this.getClass().getResourceAsStream("/profiles/VXU-Z22_ValueSetLibrary.xml"));
		String c = IOUtils.toString(this.getClass().getResourceAsStream("/profiles/VXU-Z22_Constraints.xml"));
		Profile profile = new ProfileSerializationImpl().deserializeXMLToProfile(p, v, c);
		profile.setScope(IGDocumentScope.PRELOADED);
		profileService.save(profile);
	}

	private void loadAppInfo() throws Exception {
		appInfoRepository.deleteAll();
		AppInfo appInfo = new AppInfo();
		appInfo.setAdminEmail(env.getProperty("admin.email"));
		appInfo.setDate(env.getProperty("app.date"));
		appInfo.setVersion(env.getProperty("app.version"));
		appInfoRepository.save(appInfo);
	}
}
