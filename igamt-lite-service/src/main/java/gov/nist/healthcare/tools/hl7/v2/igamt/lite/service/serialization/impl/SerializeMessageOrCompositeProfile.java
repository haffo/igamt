package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.impl;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.*;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Constraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization.SerializableConstraint;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization.SerializableConstraints;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization.SerializableSection;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.serialization.SerializableSegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.SegmentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeConstraintService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.serialization.SerializeSegmentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.util.ExportUtil;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.util.SerializationUtil;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
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
 * Created by Maxence Lefort on 3/9/17.
 */
public abstract class SerializeMessageOrCompositeProfile {
    @Autowired SegmentService segmentService;
    @Autowired SerializeConstraintService serializeConstraintService;
    @Autowired SerializationUtil serializationUtil;

    @Autowired SerializeSegmentService serializeSegmentService;

    protected List<String> messageSegmentsNameList;

    protected Map<String,Segment> compositeProfileSegments;

    protected int segmentPosition = 1;

    protected void serializeSegment(SegmentRefOrGroup segmentRefOrGroup, String prefix, SerializableSection segmentsSection, UsageConfig segmentUsageConfig, UsageConfig fieldsUsageConfig) {
        serializeSegment(segmentRefOrGroup, prefix, segmentsSection, segmentUsageConfig, fieldsUsageConfig, null);
    }

    protected void serializeSegment(SegmentRefOrGroup segmentRefOrGroup, String prefix, SerializableSection segmentsSection, UsageConfig segmentUsageConfig, UsageConfig fieldsUsageConfig, Map<String,Segment> compositeProfileSegments) {
        this.compositeProfileSegments = compositeProfileSegments;
        if(ExportUtil.diplayUsage(segmentRefOrGroup.getUsage(),segmentUsageConfig)) {
            if (segmentRefOrGroup instanceof SegmentRef) {
                SegmentLink segmentLink = ((SegmentRef) segmentRefOrGroup).getRef();
                if (!messageSegmentsNameList.contains(segmentLink.getId())) {
                    segmentsSection.addSection(serializeSegmentService
                        .serializeSegment(segmentLink, prefix + String.valueOf(segmentPosition),
                            segmentPosition, 5, fieldsUsageConfig));
                    messageSegmentsNameList.add(segmentLink.getId());
                    segmentPosition++;
                }
            } else if (segmentRefOrGroup instanceof Group) {
            /*String id = UUID.randomUUID().toString();
            String headerLevel = String.valueOf(4);
            String title = ((Group) segmentRefOrGroup).getName();
            SerializableSection serializableSection = new SerializableSection(id,prefix,String.valueOf(position),headerLevel,title);*/
                for (SegmentRefOrGroup groupSegmentRefOrGroup : ((Group) segmentRefOrGroup)
                    .getChildren()) {
                    serializeSegment(groupSegmentRefOrGroup, prefix, segmentsSection,
                        segmentUsageConfig, fieldsUsageConfig);
                }
            }
        }
    }

    protected SerializableConstraints serializeConstraints(List<? extends Constraint> constraints,
        String name, int position, String type){
        List<SerializableConstraint> serializableConstraintList = new ArrayList<>();
        for(Constraint constraint : constraints){
            SerializableConstraint serializableConstraint = new SerializableConstraint(constraint, name);
            serializableConstraintList.add(serializableConstraint);
        }
        String id = UUID.randomUUID().toString();
        SerializableConstraints serializableConstraints = new SerializableConstraints(serializableConstraintList,id,String.valueOf(position),name,type);
        return serializableConstraints;
    }

    protected SerializableSegmentRefOrGroup serializeSegmentRefOrGroup(SegmentRefOrGroup segmentRefOrGroup, UsageConfig segmentUsageConfig, UsageConfig fieldUsageConfig){
        if(segmentRefOrGroup instanceof SegmentRef){
            SegmentRef segmentRef = (SegmentRef) segmentRefOrGroup;
            if(ExportUtil.diplayUsage(segmentRef.getUsage(), segmentUsageConfig)) {
                return serializeSegmentRef(segmentRef, fieldUsageConfig);
            }
        } else if (segmentRefOrGroup instanceof Group){
            return serializeGroup((Group) segmentRefOrGroup,segmentUsageConfig,fieldUsageConfig);
        }
        return null;
    }

    private SerializableSegmentRefOrGroup serializeSegmentRef(SegmentRef segmentRef, UsageConfig usageConfig){
        SerializableSegmentRefOrGroup serializableSegmentRefOrGroup;
        SegmentLink segmentLink = segmentRef.getRef();
        if(segmentLink != null) {
            Segment segment = segmentService.findById(segmentLink.getId());
            if(usageConfig != null && segment != null) {
                List<Field> filteredFieldList = new ArrayList<>();
                for (Field field : segment.getFields()) {
                    if (field != null && ExportUtil.diplayUsage(field.getUsage(), usageConfig)) {
                        filteredFieldList.add(field);
                    }
                }
                segment.setFields(filteredFieldList);
            }
            serializableSegmentRefOrGroup =
                new SerializableSegmentRefOrGroup(segmentRef, segment);
            return serializableSegmentRefOrGroup;
        }
        return null;
    }

    private SerializableSegmentRefOrGroup serializeGroup(Group group, UsageConfig segmentUsageConfig, UsageConfig fieldUsageConfig){
        SerializableSegmentRefOrGroup serializableGroup;
        List<SerializableSegmentRefOrGroup> serializableSegmentRefOrGroups = new ArrayList<>();
        for (SegmentRefOrGroup segmentRefOrGroup : group.getChildren()) {
            SerializableSegmentRefOrGroup serializableSegmentRefOrGroup = serializeSegmentRefOrGroup(
                segmentRefOrGroup, segmentUsageConfig, fieldUsageConfig);
            if(serializableSegmentRefOrGroup!=null) {
                serializableSegmentRefOrGroups.add(serializableSegmentRefOrGroup);
            }
        }
        List<SerializableConstraint> groupConstraints = serializeConstraintService.serializeConstraints(group,group.getName());
        serializableGroup = new SerializableSegmentRefOrGroup(group,serializableSegmentRefOrGroups,groupConstraints);
        return serializableGroup;
    }
}
