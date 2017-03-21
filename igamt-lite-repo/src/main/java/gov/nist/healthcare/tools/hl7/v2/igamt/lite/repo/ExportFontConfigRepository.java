package gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ExportFontConfig;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified.
 * <p/>
 * Created by Maxence Lefort on 2/23/17.
 */
public interface ExportFontConfigRepository extends
    MongoRepository<ExportFontConfig, Long> {
    @Query("select e from ExportFontConfig e where e.accountId = ?1")
    ExportFontConfig findOneByAccountId(Long accountId);

    @Query("select e from ExportFontConfig e where e.defaultConfig = ?1")
    ExportFontConfig findByDefaultConfig(Boolean defaultConfig);
}