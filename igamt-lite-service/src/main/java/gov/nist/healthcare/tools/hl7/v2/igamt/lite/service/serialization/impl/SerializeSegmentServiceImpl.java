package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.impl;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.*;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.CCValue;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.CoConstraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.CoConstraints;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization.*;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.DatatypeService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.SegmentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.TableService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeConstraintService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeDatatypeService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeSegmentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeTableService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.util.ExportUtil;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.util.SerializationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
 * Created by Maxence Lefort on 12/13/16.
 */
@Service public class SerializeSegmentServiceImpl implements SerializeSegmentService {

    @Autowired SegmentService segmentService;

    @Autowired SerializationUtil serializationUtil;

    @Autowired DatatypeService datatypeService;

    @Autowired TableService tableService;

    @Autowired SerializeConstraintService serializeConstraintService;

    @Autowired SerializeDatatypeService serializeDatatypeService;

    @Autowired SerializeTableService serializeTableService;

    @Override
    public SerializableSection serializeSegment(SegmentLink segmentLink, String prefix, Integer position, Integer headerLevel, UsageConfig segmentUsageConfig) {
        Segment segment = segmentService.findById(segmentLink.getId());
        return this.serializeSegment(segment,segmentLink,prefix,position,headerLevel,segmentUsageConfig,null,null);
    }

    @Override public SerializableSection serializeSegment(SegmentLink segmentLink, String prefix,
        Integer position, Integer headerLevel, UsageConfig segmentUsageConfig,
        Map<String, Segment> compositeProfileSegments, Map<String, Datatype> compositeProfileDatatypes, Map<String, Table> compositeProfileTables) {
        Segment segment = compositeProfileSegments.get(segmentLink.getId());
        return this.serializeSegment(segment,segmentLink,prefix,position,headerLevel,segmentUsageConfig,compositeProfileDatatypes,compositeProfileTables);
    }

    private SerializableSection serializeSegment(Segment segment, SegmentLink segmentLink, String prefix, Integer position, Integer headerLevel, UsageConfig fieldUsageConfig, Map<String, Datatype> compositeProfileDatatypes, Map<String, Table> compositeProfileTables) {
        if (segment != null) {
            //Create section node
            String id = segment.getId();
            String segmentPosition = String.valueOf(position);
            String sectionHeaderLevel = String.valueOf(headerLevel);
            String title = segmentLink.getLabel() + " - " + segment.getDescription();
            SerializableSection serializableSegmentSection = new SerializableSection(id,prefix,segmentPosition,sectionHeaderLevel,title);
            //create segment node
            id = segment.getId();
            String name = segmentLink.getName();
            String label = segmentLink.getExt() == null || segmentLink.getExt().isEmpty() ?
                segmentLink.getName() :
                segmentLink.getLabel();
            segmentPosition = "";
            sectionHeaderLevel = String.valueOf(headerLevel+1);
            title = segment.getName();
            String description = segment.getDescription();
            String comment = "";
            if (segment.getComment() != null && !segment.getComment().isEmpty()) {
                 comment = segment.getComment();
            }
            String defPreText, defPostText;
            defPostText = defPreText = "";

            if ((segment.getText1() != null && !segment.getText1().isEmpty()) || (
                segment.getText2() != null && !segment.getText2().isEmpty())) {
                if (segment.getText1() != null && !segment.getText1().isEmpty()) {
                    defPreText = serializationUtil.cleanRichtext(segment.getText1());
                }
                if (segment.getText2() != null && !segment.getText2().isEmpty()) {
                    defPostText = serializationUtil.cleanRichtext(segment.getText2());
                }
            }

            List<SerializableConstraint> constraints =
                serializeConstraintService.serializeConstraints(segment, segment.getName() + "-");
            Map<Field, Datatype> fieldDatatypeMap = new HashMap<>();
            Map<Field, List<ValueSetOrSingleCodeBinding>> fieldValueSetBindingsMap = new HashMap<>();
            Map<CCValue, Table> coConstraintValueTableMap = new HashMap<>();
            List<Table> tables = new ArrayList<>();
            for(ValueSetOrSingleCodeBinding valueSetOrSingleCodeBinding : segment.getValueSetBindings()){
                if(valueSetOrSingleCodeBinding.getTableId()!=null && !valueSetOrSingleCodeBinding.getTableId().isEmpty()){
                    Table table = null;
                    if(compositeProfileTables!=null && !compositeProfileTables.isEmpty()){
                        table = compositeProfileTables.get(valueSetOrSingleCodeBinding.getTableId());
                    }
                    if(table == null) {
                        table = tableService.findById(valueSetOrSingleCodeBinding.getTableId());
                    }
                    if(table!=null){
                        tables.add(table);
                    }
                }
            }
            List<Field> fieldsToBeRemoved = new ArrayList<>();
            for (Field field : segment.getFields()) {
                if(ExportUtil.diplayUsage(field.getUsage(),fieldUsageConfig)) {
                    if (field.getDatatype() != null) {
                        Datatype datatype = null;
                        if(compositeProfileDatatypes!=null && !compositeProfileDatatypes.isEmpty()){
                            datatype = findDatatypeInCompositeProfileDatatypes(field.getDatatype().getId(),compositeProfileDatatypes);
                        }
                        if(datatype == null) {
                            datatype = datatypeService.findById(field.getDatatype().getId());
                        }
                        if(datatype!=null) {
                            fieldDatatypeMap.put(field, datatype);
                        }
                    }
                    List<ValueSetOrSingleCodeBinding> fieldValueSetBindings = new ArrayList<>();
                    for(ValueSetOrSingleCodeBinding valueSetOrSingleCodeBinding : segment.getValueSetBindings()){
                        if(valueSetOrSingleCodeBinding.getLocation().equals(String.valueOf(field.getPosition()))){
                            fieldValueSetBindings.add(valueSetOrSingleCodeBinding);
                        }
                    }
                    fieldValueSetBindingsMap.put(field, fieldValueSetBindings);
                } else {
                    fieldsToBeRemoved.add(field);
                }
                if(field.getText()!=null && !"".equals(field.getText())){
                    field.setText(serializationUtil.cleanRichtext(field.getText()));
                }
            }
            for(Field field : fieldsToBeRemoved){
                segment.getFields().remove(field);
            }
            if (segment.getCoConstraints() != null) {
                CoConstraints coConstraints = segment.getCoConstraints();
                if (coConstraints.getConstraints() != null && !coConstraints.getConstraints()
                    .isEmpty()) {
                    for (CoConstraint coConstraint : coConstraints.getConstraints()) {
                        if (coConstraint.getValues() != null && !coConstraint.getValues()
                            .isEmpty()) {
                            for (CCValue ccValue : coConstraint.getValues()) {
                                Table table = null;
                                if(compositeProfileTables!=null && !compositeProfileTables.isEmpty()){
                                    table = compositeProfileTables.get(ccValue.getValue());
                                }
                                if(table == null) {
                                    table = tableService.findById(ccValue.getValue());
                                }
                                if (table != null) {
                                    coConstraintValueTableMap.put(ccValue, table);
                                }
                            }
                        }
                    }
                }
            }
            Boolean showConfLength = serializationUtil.isShowConfLength(segment.getHl7Version());
            SerializableSegment serializableSegment = new SerializableSegment(id, prefix, segmentPosition, sectionHeaderLevel, title, segment, name, label, description, comment, defPreText, defPostText, constraints, fieldDatatypeMap, fieldValueSetBindingsMap, tables, coConstraintValueTableMap,showConfLength);
            serializableSegmentSection.addSection(serializableSegment);
            return serializableSegmentSection;
        }
        return null;
    }

    private Datatype findDatatypeInCompositeProfileDatatypes(String id,
        Map<String, Datatype> compositeProfileDatatypes) {
        return compositeProfileDatatypes.get(id);
    }

}
