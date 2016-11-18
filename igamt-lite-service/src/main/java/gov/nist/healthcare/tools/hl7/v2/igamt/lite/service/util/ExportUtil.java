package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.util;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.DocumentMetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.MetaData;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Profile;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.input.NullInputStream;
import org.docx4j.jaxb.Context;
import org.docx4j.model.fields.FieldUpdater;
import org.docx4j.openpackaging.contenttype.ContentType;
import org.docx4j.openpackaging.exceptions.Docx4JException;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.PartName;
import org.docx4j.openpackaging.parts.WordprocessingML.AlternativeFormatInputPart;
import org.docx4j.relationships.Relationship;
import org.docx4j.wml.CTAltChunk;
import org.docx4j.wml.ObjectFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.tidy.Tidy;

import javax.imageio.ImageIO;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.Map;
import java.util.UUID;

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
 * Created by Maxence Lefort on 11/01/16.
 */

@Service
public class ExportUtil {

    Logger logger = LoggerFactory.getLogger(ExportUtil.class);


    @Autowired
    private DocxExportUtil docxExportUtil;

    public InputStream exportAsDocxFromXml(String xmlString, String xmlPath, ExportParameters exportParameters, Profile p, MetaData metaData) {

        try {
            File tmpHtmlFile = doTransformToTempHtml(xmlString,xmlPath,exportParameters);

            String html = FileUtils.readFileToString(tmpHtmlFile);

            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage
                .load(this.getClass().getResourceAsStream("/rendering/lri_template.dotx"));

            ObjectFactory factory = Context.getWmlObjectFactory();

            docxExportUtil.createCoverPageForDocx4j(wordMLPackage, factory, p, metaData);

            if (exportParameters.isIncludeTOC()) {
                docxExportUtil.createTableOfContentForDocx4j(wordMLPackage, factory);
            }

            FieldUpdater updater = new FieldUpdater(wordMLPackage);
            try {
                updater.update(true);
            } catch (Docx4JException e1) {
                e1.printStackTrace();
            }

            AlternativeFormatInputPart afiPart = new AlternativeFormatInputPart(new PartName("/hw.html"));
            afiPart.setBinaryData(html.getBytes());
            afiPart.setContentType(new ContentType("text/html"));
            Relationship altChunkRel = wordMLPackage.getMainDocumentPart().addTargetPart(afiPart);

            // .. the bit in document body
            CTAltChunk ac = Context.getWmlObjectFactory().createCTAltChunk();
            ac.setId(altChunkRel.getId());
            wordMLPackage.getMainDocumentPart().addObject(ac);

            // .. content type
            wordMLPackage.getContentTypeManager().addDefaultContentType("html", "text/html");

            docxExportUtil.loadTemplateForDocx4j(wordMLPackage); // Repeats the lines above but necessary; don't delete

            File tmpFile;
            tmpFile = File.createTempFile("IgDocument" + UUID.randomUUID().toString(), ".docx");
            wordMLPackage.save(tmpFile);

            return FileUtils.openInputStream(tmpFile);

        } catch (TransformerException | IOException | Docx4JException e) {
            e.printStackTrace();
            return new NullInputStream(1L);
        }
    }

    public InputStream exportAsHtmlFromXsl(String xmlString, String xslPath, ExportParameters exportParameters) {

        try {
            File tmpHtmlFile = doTransformToTempHtml(xmlString,xslPath,exportParameters);
            Tidy tidy = new Tidy();
            tidy.setWraplen(Integer.MAX_VALUE);
            tidy.setXHTML(true);
            tidy.setShowWarnings(false); // to hide errors
            tidy.setQuiet(true); // to hide warning
            tidy.setMakeClean(true);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            tidy.parseDOM(FileUtils.openInputStream(tmpHtmlFile), outputStream);
            return new ByteArrayInputStream(outputStream.toByteArray());

        } catch (TransformerException | IOException e) {
            e.printStackTrace();
            return new NullInputStream(1L);
        }
    }

    public ExportParameters setExportParameters(String documentTitle,boolean includeTOC, boolean inlineConstraints, String targetFormat){
        ExportParameters exportParameters = new ExportParameters();
        exportParameters.setDocumentTitle(documentTitle);
        exportParameters.setIncludeTOC(includeTOC);
        exportParameters.setInlineConstraints(inlineConstraints);
        exportParameters.setTargetFormat(targetFormat);
        return exportParameters;
    }

    //Private methods, alphabetically ordered



    private File doTransformToTempHtml(String xmlString,String xslPath, ExportParameters exportParameters) throws IOException, TransformerException {
        File tmpHtmlFile = File.createTempFile("temp" + UUID.randomUUID().toString(), ".html");
        // Generate xml file containing profile
        File tmpXmlFile = File.createTempFile("temp" + UUID.randomUUID().toString(), ".xml");
        // File tmpXmlFile = new File("temp + UUID.randomUUID().toString().xml");
        FileUtils.writeStringToFile(tmpXmlFile, xmlString, Charset.forName("UTF-8"));
        TransformerFactory factoryTf = TransformerFactory.newInstance();
        factoryTf.setURIResolver(new XsltIncludeUriResover());
        Source xslt = new StreamSource(this.getClass().getResourceAsStream(xslPath));
        Transformer transformer;
        // Apply XSL transformation on xml file to generate html
        transformer = factoryTf.newTransformer(xslt);
        //Set the parameters
        for(Map.Entry<String,String> param:exportParameters.toMap().entrySet()){
            transformer.setParameter(param.getKey(),param.getValue());
        }
        transformer.transform(new StreamSource(tmpXmlFile), new StreamResult(tmpHtmlFile));
        return tmpHtmlFile;
    }



}
