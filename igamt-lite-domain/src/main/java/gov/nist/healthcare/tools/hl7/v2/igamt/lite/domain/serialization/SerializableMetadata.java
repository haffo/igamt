package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DocumentMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ProfileMetaData;
import nu.xom.Attribute;
import nu.xom.Element;

import java.util.Date;

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
 * Created by Maxence Lefort on 12/7/16.
 */
public class SerializableMetadata extends SerializableElement{

    private DocumentMetaData documentMetaData;
    private Date dateUpdated;

    public SerializableMetadata(DocumentMetaData documentMetaData,
        Date dateUpdated) {
        this.documentMetaData = documentMetaData;
        this.dateUpdated = dateUpdated;
    }

    @Override
    public Element serializeElement() {
        Element elmMetaData = new Element("MetaData");
        if(this.documentMetaData!=null){
            if (documentMetaData.getTitle() != null)
                elmMetaData.addAttribute(new Attribute("Name", documentMetaData.getTitle()));
            if (documentMetaData.getSubTitle() != null)
                elmMetaData.addAttribute(new Attribute("Subtitle", documentMetaData.getSubTitle()));
            if (documentMetaData.getVersion() != null)
                elmMetaData.addAttribute(new Attribute("DocumentVersion", documentMetaData.getVersion()));
            if (this.dateUpdated != null)
                elmMetaData.addAttribute(new Attribute("Date", this.format(this.dateUpdated)));
            if (documentMetaData.getExt() != null)
                elmMetaData.addAttribute(new Attribute("Ext", documentMetaData.getExt()));
            if (this.documentMetaData.getOrgName() != null)
                elmMetaData.addAttribute(new Attribute("OrgName", this.documentMetaData.getOrgName()));
            if (this.documentMetaData.getStatus() != null)
                elmMetaData.addAttribute(new Attribute("Status", this.documentMetaData.getStatus()));
            if (this.documentMetaData.getTopics() != null)
                elmMetaData.addAttribute(new Attribute("Topics", this.documentMetaData.getTopics()));
            if (this.documentMetaData.getHl7Version() != null)
                elmMetaData.addAttribute(new Attribute("HL7Version", this.documentMetaData.getHl7Version()));
        }
        return elmMetaData;
    }
}
