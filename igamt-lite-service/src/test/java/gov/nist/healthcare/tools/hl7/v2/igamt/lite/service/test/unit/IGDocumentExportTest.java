package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.test.unit;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DatatypeLibraryDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.IGDocumentExportService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.IGDocumentService;
import org.apache.commons.io.FileUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.io.File;
import java.io.IOException;

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
 * <p>
 * Created by Maxence Lefort on 11/14/16.
 */

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {PersistenceContextUnit.class})
public class IGDocumentExportTest {

    //57450d2ed4c6f57e6980e821

    @Autowired IGDocumentService igDocumentService;
    @Autowired IGDocumentExportService igDocumentExportService;

    @Test
    public void testHtmlExport(){
        IGDocument igDocument = igDocumentService.findById("57450d11d4c6f57e6950bfea");
        try {
            //File htmlFile = new File("tmp/dtLib_"+new Date().toString()+".html");
            File htmlFile = new File("tmp/ig_test.html");
            if(htmlFile.exists()){
                htmlFile.delete();
            }
            if(htmlFile.createNewFile()) {
                FileUtils.copyInputStreamToFile(igDocumentExportService
                    .exportAsHtml(igDocument), htmlFile);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    @Test
    public void testDocxExport(){
        IGDocument igDocument = igDocumentService.findById("57450d11d4c6f57e6950bfea");
        try {
            File wordFile = new File("tmp/ig_test.docx");
            if(wordFile.exists()){
                wordFile.delete();
            }
            if(wordFile.createNewFile()) {
                FileUtils.copyInputStreamToFile(igDocumentExportService.exportAsDocx(igDocument), wordFile);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
