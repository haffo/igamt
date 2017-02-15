/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified. Ismail Mellouli (NIST) Jan 31, 2017
 */

package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.io.InvalidObjectException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.math.NumberUtils;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Component;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Constant;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Datatype;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Field;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Group;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Message;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Segment;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Usage;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ValidationError;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ValidationResult;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ValidationType;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints.Predicate;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.DatatypeService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.SegmentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.ValidationService;

@Service
public class ValidationServiceImpl implements ValidationService {


  private static final Logger logger = Logger.getLogger(ValidationServiceImpl.class);
  private static final String USAGE_RULES_ROOT = "usageMap";
  private static final String UNSUPPORTED_SCHEMA_VERSION = "others";
  protected JsonNode root;

  @Autowired
  DatatypeService datatypeService;
  @Autowired
  SegmentService segmentService;

  public ValidationServiceImpl() {
    init();
  }

  public void init() {
    try {

      InputStream stream = getClass().getResourceAsStream("/validation/validationRules.txt");
      ObjectMapper mapper = new ObjectMapper();
      root = mapper.readTree(stream);
    } catch (IOException e) {
      logger.error("Failed to load the Rules file.");
      if (logger.isDebugEnabled()) {
        logger.debug(e, e);
      }
      throw new RuntimeException(e);
    }
  }

  public Set<String> getSegmentIds(List<SegmentRefOrGroup> segRefsOrGrps) {
    Set<String> segIds = new HashSet<String>();
    for (SegmentRefOrGroup segRefOrGrp : segRefsOrGrps) {
      if (segRefOrGrp.getType() == Constant.SEGMENTREF) {
        SegmentRef segRef = (SegmentRef) segRefOrGrp;
        segIds.add(segRef.getRef().getId());
      } else if (segRefOrGrp.getType() == Constant.GROUP) {
        Group grp = (Group) segRefOrGrp;

        segIds.addAll(getSegmentIds(grp.getChildren()));
      }
    }
    return segIds;

  }


  @Override
  public ValidationResult validateMessage(Message reference, Message toBeValidated,
      boolean validateChildren) throws InvalidObjectException {
    ValidationResult result = new ValidationResult();
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    HashMap<String, ValidationResult> blocks = new HashMap<String, ValidationResult>();
    Set<String> userSegIds = getSegmentIds(toBeValidated.getChildren());
    Set<String> referenceSegIds = getSegmentIds(reference.getChildren());
    List<Segment> userSegs = segmentService.findByIds(userSegIds);
    // List<Segment> referenceSegs = segmentService.findByIds(referenceSegIds);
    HashMap<String, Segment> userSegMap = new HashMap<String, Segment>();
    for (Segment seg : userSegs) {
      userSegMap.put(seg.getId(), seg);
    }
    // HashMap<String, Segment> referenceSegMap = new HashMap<String, Segment>();
    // for (Segment seg : referenceSegs) {
    // referenceSegMap.put(seg.getId(), seg);
    // }

    result.setTargetId(toBeValidated.getId());

    if (toBeValidated.getName().equals(reference.getName()) && toBeValidated.getChildren() != null
        && reference.getChildren() != null) {

      // Prerdicate Map
      Map<Integer, Predicate> predicatesMap = new HashMap<>();
      if (toBeValidated.getPredicates().size() > 0) {
        for (int j = 0; j < toBeValidated.getPredicates().size(); j++) {
          Integer target = Integer
              .parseInt(toBeValidated.getPredicates().get(j).getConstraintTarget().split("\\[")[0]);
          predicatesMap.put(target, toBeValidated.getPredicates().get(j));
        }
      }
      for (int i = 0; i < reference.getChildren().size(); i++) {

        if (i < toBeValidated.getChildren().size()) {
          HashMap<String, List<ValidationError>> valE = validateSegmentRefOrGroup(
              reference.getChildren().get(i), toBeValidated.getChildren().get(i),
              predicatesMap.get(toBeValidated.getChildren().get(i).getPosition()),
              toBeValidated.getHl7Version());
          if (valE != null) {
            items.putAll(valE);

          }
          if (toBeValidated.getChildren().get(i).getType() == Constant.SEGMENTREF) {
            SegmentRef segRef = (SegmentRef) toBeValidated.getChildren().get(i);

            // Segment childSegment = segmentService.findById(segRef.getRef().getId());
            Segment childSegment = userSegMap.get(segRef.getRef().getId());

            Segment childReference = segmentService.findByNameAndVersionAndScope(
                childSegment.getName(), childSegment.getHl7Version(), "HL7STANDARD");
            ValidationResult block = validateSegment(childReference, childSegment, false);
            if (result.getErrorCount() != null && block.getErrorCount() != null) {
              result.setErrorCount(result.getErrorCount() + block.getErrorCount());

            }
            if (!block.getBlocks().isEmpty() || !block.getItems().isEmpty()) {
              blocks.put(toBeValidated.getChildren().get(i).getId(), block);

            }


          } else if (toBeValidated.getChildren().get(i).getType() == Constant.GROUP) {

            Group userGrp = (Group) toBeValidated.getChildren().get(i);
            Group referenceGrp = (Group) reference.getChildren().get(i);


            ValidationResult block = validateGroup(referenceGrp, userGrp);
            if (result.getErrorCount() != null && block.getErrorCount() != null) {
              result.setErrorCount(result.getErrorCount() + block.getErrorCount());

            }

            if (!block.getBlocks().isEmpty() || !block.getItems().isEmpty()) {
              blocks.put(toBeValidated.getChildren().get(i).getId(), block);

            }
          }



        }



      }

    }


    result.setItems(items);
    Integer itemCount = 0;
    Integer blockCount = 0;
    for (Map.Entry<String, List<ValidationError>> entry : items.entrySet()) {
      String key = entry.getKey();
      List<ValidationError> value = entry.getValue();
      itemCount = itemCount + value.size();

    }
    for (Map.Entry<String, ValidationResult> entry : blocks.entrySet()) {
      String key = entry.getKey();
      ValidationResult value = entry.getValue();
      blockCount = blockCount + value.getErrorCount();

    }
    result.setErrorCount(itemCount + blockCount);
    result.setBlocks(blocks);

    return result;
  }


  @Override
  public ValidationResult validateGroup(Group reference, Group toBeValidated)
      throws InvalidObjectException {
    ValidationResult result = new ValidationResult();
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    HashMap<String, ValidationResult> blocks = new HashMap<String, ValidationResult>();
    result.setTargetId(toBeValidated.getId());

    if (toBeValidated.getName().equals(reference.getName()) && toBeValidated.getChildren() != null
        && reference.getChildren() != null) {

      // Prerdicate Map
      Map<Integer, Predicate> predicatesMap = new HashMap<>();
      if (toBeValidated.getPredicates().size() > 0) {
        for (int j = 0; j < toBeValidated.getPredicates().size(); j++) {
          Integer target = Integer
              .parseInt(toBeValidated.getPredicates().get(j).getConstraintTarget().split("\\[")[0]);
          predicatesMap.put(target, toBeValidated.getPredicates().get(j));
        }
      }
      for (int i = 0; i < reference.getChildren().size(); i++) {

        if (i < toBeValidated.getChildren().size()) {
          HashMap<String, List<ValidationError>> valE = validateSegmentRefOrGroup(
              reference.getChildren().get(i), toBeValidated.getChildren().get(i),
              predicatesMap.get(toBeValidated.getChildren().get(i).getPosition()),
              toBeValidated.getHl7Version());
          if (valE != null) {
            items.putAll(valE);

          }
          if (toBeValidated.getChildren().get(i).getType() == Constant.SEGMENTREF) {
            SegmentRef segRef = (SegmentRef) toBeValidated.getChildren().get(i);

            Segment childSegment = segmentService.findById(segRef.getRef().getId());
            Segment childReference = segmentService.findByNameAndVersionAndScope(
                childSegment.getName(), childSegment.getHl7Version(), "HL7STANDARD");
            ValidationResult block = validateSegment(childReference, childSegment, false);
            if (result.getErrorCount() != null && block.getErrorCount() != null) {
              result.setErrorCount(result.getErrorCount() + block.getErrorCount());

            }
            if (!block.getBlocks().isEmpty() || !block.getItems().isEmpty()) {
              blocks.put(toBeValidated.getChildren().get(i).getId(), block);

            }


          } else if (toBeValidated.getChildren().get(i).getType() == Constant.GROUP) {
            Group userGrp = (Group) toBeValidated.getChildren().get(i);
            Group referenceGrp = (Group) reference.getChildren().get(i);

            ValidationResult block = validateGroup(userGrp, referenceGrp);
          }



        }



      }

    }


    result.setItems(items);
    Integer itemCount = 0;
    Integer blockCount = 0;
    for (Map.Entry<String, List<ValidationError>> entry : items.entrySet()) {
      String key = entry.getKey();
      List<ValidationError> value = entry.getValue();
      itemCount = itemCount + value.size();

    }
    for (Map.Entry<String, ValidationResult> entry : blocks.entrySet()) {
      String key = entry.getKey();
      ValidationResult value = entry.getValue();
      blockCount = blockCount + value.getErrorCount();

    }
    result.setErrorCount(itemCount + blockCount);
    result.setBlocks(blocks);

    return result;
  }

  @Override
  public HashMap<String, List<ValidationError>> validateSegmentRefOrGroup(
      SegmentRefOrGroup reference, SegmentRefOrGroup toBeValidated, Predicate predicate,
      String hl7Version) throws InvalidObjectException {
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    List<ValidationError> validationErrors = new ArrayList<ValidationError>();

    if (reference.getUsage() != null) {

      String usageValidation =
          validateUsage(reference.getUsage(), toBeValidated.getUsage(), predicate, hl7Version);
      if (usageValidation != null) {
        ValidationError valError = new ValidationError();
        valError.setErrorMessage(usageValidation);
        valError.setPosition(toBeValidated.getPosition());
        valError.setTargetId(toBeValidated.getId());
        valError.setType("Error");
        valError.setTargetType(toBeValidated.getType());
        valError.setValidationType(ValidationType.USAGE);
        validationErrors.add(valError);
      }

    }

    if (!validationErrors.isEmpty()) {
      items.put(toBeValidated.getId(), validationErrors);

    } else {
      return null;
    }


    return items;
  }

  public Set<String> getDatatypeIdsFromSegment(Segment seg) {

    Set<String> dtIds = new HashSet<String>();
    for (Field field : seg.getFields()) {
      dtIds.add(field.getDatatype().getId());

    }
    return dtIds;

  }

  @Override
  public ValidationResult validateSegment(Segment reference, Segment toBeValidated,
      boolean validateChildren) throws InvalidObjectException {

    ValidationResult result = new ValidationResult();
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    HashMap<String, ValidationResult> blocks = new HashMap<String, ValidationResult>();
    result.setTargetId(toBeValidated.getId());

    Set<String> referenceDtIds = getDatatypeIdsFromSegment(reference);
    Set<String> toBeValidatedDtIds = getDatatypeIdsFromSegment(toBeValidated);
    List<Datatype> referenceDts = datatypeService.findByIds(referenceDtIds);
    List<Datatype> toBeValidatedDts = datatypeService.findByIds(toBeValidatedDtIds);
    HashMap<String, Datatype> userDtMap = new HashMap<String, Datatype>();
    for (Datatype dt : toBeValidatedDts) {
      userDtMap.put(dt.getId(), dt);
    }
    HashMap<String, Datatype> referenceDtMap = new HashMap<String, Datatype>();
    for (Datatype dt : referenceDts) {
      referenceDtMap.put(dt.getId(), dt);
    }

    if (toBeValidated.getName().equals(reference.getName()) && toBeValidated.getFields() != null
        && reference.getFields() != null) {

      // Prerdicate Map
      Map<Integer, Predicate> predicatesMap = new HashMap<>();
      if (toBeValidated.getPredicates().size() > 0) {
        for (int j = 0; j < toBeValidated.getPredicates().size(); j++) {
          Integer target = Integer
              .parseInt(toBeValidated.getPredicates().get(j).getConstraintTarget().split("\\[")[0]);
          predicatesMap.put(target, toBeValidated.getPredicates().get(j));
        }
      }
      for (int i = 0; i < reference.getFields().size(); i++) {
        // items.putAll(validateField(reference.getFields().get(i),
        // toBeValidated.getFields().get(i),
        // predicatesMap.get(toBeValidated.getFields().get(i).getPosition()),
        // toBeValidated.getHl7Version()));
        if (i < toBeValidated.getFields().size()) {
          HashMap<String, List<ValidationError>> valE =
              validateField(reference.getFields().get(i), toBeValidated.getFields().get(i),
                  predicatesMap.get(toBeValidated.getFields().get(i).getPosition()),
                  toBeValidated.getHl7Version(), toBeValidated.getId());
          if (valE != null) {
            items.putAll(valE);

          }
          if (!userDtMap.get(toBeValidated.getFields().get(i).getDatatype().getId()).getComponents()
              .isEmpty()) {


            Datatype childDatatype =
                userDtMap.get(toBeValidated.getFields().get(i).getDatatype().getId());
            Datatype childReference =
                referenceDtMap.get(reference.getFields().get(i).getDatatype().getId());
            ValidationResult block = validateDatatype(childReference, childDatatype,
                toBeValidated.getFields().get(i).getId());


            if (result.getErrorCount() != null && block.getErrorCount() != null) {
              result.setErrorCount(result.getErrorCount() + block.getErrorCount());

            }
            if (!block.getBlocks().isEmpty() || !block.getItems().isEmpty()) {
              blocks.put(toBeValidated.getFields().get(i).getId(), block);

            }


          } else {

          }

        }



      }

    }


    result.setItems(items);
    Integer itemCount = 0;
    Integer blockCount = 0;
    for (Map.Entry<String, List<ValidationError>> entry : items.entrySet()) {
      String key = entry.getKey();
      List<ValidationError> value = entry.getValue();
      itemCount = itemCount + value.size();

    }
    for (Map.Entry<String, ValidationResult> entry : blocks.entrySet()) {
      String key = entry.getKey();
      ValidationResult value = entry.getValue();
      blockCount = blockCount + value.getErrorCount();

    }
    result.setErrorCount(itemCount + blockCount);
    result.setBlocks(blocks);

    return result;
  }



  public Set<String> getDatatypeIdsFromDatatype(Datatype dt) {

    Set<String> dtIds = new HashSet<String>();
    for (Component comp : dt.getComponents()) {
      dtIds.add(comp.getDatatype().getId());

    }
    return dtIds;

  }

  @Override
  public ValidationResult validateDatatype(Datatype reference, Datatype toBeValidated,
      String parentId) throws InvalidObjectException {

    ValidationResult result = new ValidationResult();
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    HashMap<String, ValidationResult> blocks = new HashMap<String, ValidationResult>();
    Set<String> referenceDtIds = getDatatypeIdsFromDatatype(reference);
    Set<String> toBeValidatedDtIds = getDatatypeIdsFromDatatype(toBeValidated);
    List<Datatype> referenceDts = datatypeService.findByIds(referenceDtIds);
    List<Datatype> toBeValidatedDts = datatypeService.findByIds(toBeValidatedDtIds);
    HashMap<String, Datatype> userDtMap = new HashMap<String, Datatype>();
    for (Datatype dt : toBeValidatedDts) {
      userDtMap.put(dt.getId(), dt);
    }
    HashMap<String, Datatype> referenceDtMap = new HashMap<String, Datatype>();
    for (Datatype dt : referenceDts) {
      referenceDtMap.put(dt.getId(), dt);
    }

    if (toBeValidated.getName().equals(reference.getName()) && toBeValidated.getComponents() != null
        && reference.getComponents() != null) {
      // Build predicates Map
      Map<Integer, Predicate> predicatesMap = new HashMap<>();
      if (toBeValidated.getPredicates().size() > 0) {
        for (int j = 0; j < toBeValidated.getPredicates().size(); j++) {
          Integer target = Integer
              .parseInt(toBeValidated.getPredicates().get(j).getConstraintTarget().split("\\[")[0]);
          predicatesMap.put(target, toBeValidated.getPredicates().get(j));
        }
      }

      for (int i = 0; i < reference.getComponents().size(); i++) {
        HashMap<String, List<ValidationError>> valE = validateComponent(
            reference.getComponents().get(i), toBeValidated.getComponents().get(i),
            predicatesMap.get(toBeValidated.getComponents().get(i).getPosition()),
            toBeValidated.getHl7Version(), toBeValidated.getId());
        items.putAll(valE);
        // if (result.getErrorCount() != null) {
        // result.setErrorCount(items.size() + result.getErrorCount());
        // } else {
        // result.setErrorCount(items.size());
        // }
        // if (!datatypeService.findById(toBeValidated.getComponents().get(i).getDatatype().getId())
        // .getComponents().isEmpty()) {
        if (!userDtMap.get(toBeValidated.getComponents().get(i).getDatatype().getId())
            .getComponents().isEmpty()) {
          // Datatype childDatatype =
          // datatypeService.findById(toBeValidated.getComponents().get(i).getDatatype().getId());
          // Datatype childReference = datatypeService.findByNameAndVersionAndScope(
          // childDatatype.getName(), childDatatype.getHl7Version(), "HL7STANDARD");
          Datatype childDatatype =
              userDtMap.get(toBeValidated.getComponents().get(i).getDatatype().getId());
          Datatype childReference =
              referenceDtMap.get(reference.getComponents().get(i).getDatatype().getId());
          ValidationResult block = validateDatatype(childReference, childDatatype,
              toBeValidated.getComponents().get(i).getId());
          block.setParentId(toBeValidated.getId());
          if (result.getErrorCount() != null && block.getErrorCount() != null) {
            result.setErrorCount(result.getErrorCount() + block.getErrorCount());

          }
          if (!block.getBlocks().isEmpty() || !block.getItems().isEmpty()) {
            blocks.put(toBeValidated.getComponents().get(i).getId(), block);

          }


        } else {

        }



      }
    }
    result.setTargetId(toBeValidated.getId());
    result.setItems(items);
    Integer itemCount = 0;
    Integer blockCount = 0;
    for (Map.Entry<String, List<ValidationError>> entry : items.entrySet()) {
      String key = entry.getKey();
      List<ValidationError> value = entry.getValue();
      itemCount = itemCount + value.size();

    }
    for (Map.Entry<String, ValidationResult> entry : blocks.entrySet()) {
      String key = entry.getKey();
      ValidationResult value = entry.getValue();
      blockCount = blockCount + value.getErrorCount();

    }
    result.setErrorCount(itemCount + blockCount);
    result.setBlocks(blocks);

    return result;
  }

  @Override
  public HashMap<String, List<ValidationError>> validateComponent(Component reference,
      Component toBeValidated, Predicate predicate, String hl7Version, String parentId)
      throws InvalidObjectException {
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    List<ValidationError> validationErrors = new ArrayList<ValidationError>();
    if (reference.getUsage() != null) {
      ValidationError valError = new ValidationError();

      String usageValidation =
          validateUsage(reference.getUsage(), toBeValidated.getUsage(), predicate, hl7Version);
      if (usageValidation != null) {
        valError.setErrorMessage(usageValidation);
        valError.setPosition(toBeValidated.getPosition());
        valError.setTargetId(toBeValidated.getId());
        valError.setTargetName(toBeValidated.getName());
        valError.setParentId(parentId);
        valError.setTargetType(toBeValidated.getType());
        valError.setType("Error");
        valError.setValidationType(ValidationType.USAGE);
        validationErrors.add(valError);
      }

    }
    String lengthValidation = validateLength(reference.getMinLength(), reference.getMaxLength(),
        toBeValidated.getMinLength(), toBeValidated.getMaxLength());
    if (lengthValidation != null) {
      ValidationError valErr = new ValidationError();
      valErr.setErrorMessage(lengthValidation);
      valErr.setPosition(toBeValidated.getPosition());
      valErr.setTargetId(toBeValidated.getId());
      valErr.setTargetName(toBeValidated.getName());
      valErr.setParentId(parentId);
      valErr.setTargetType(toBeValidated.getType());
      valErr.setType("Error");
      valErr.setValidationType(ValidationType.LENGTH);
      validationErrors.add(valErr);

    }
    if (!validationErrors.isEmpty()) {
      items.put(toBeValidated.getId(), validationErrors);

    }

    return items;
  }



  @Override
  public HashMap<String, List<ValidationError>> validateField(Field reference, Field toBeValidated,
      Predicate predicate, String hl7Version, String parentId) throws InvalidObjectException {
    HashMap<String, List<ValidationError>> items = new HashMap<String, List<ValidationError>>();
    List<ValidationError> validationErrors = new ArrayList<ValidationError>();


    if (reference.getUsage() != null) {
      String usageValidation =
          validateUsage(reference.getUsage(), toBeValidated.getUsage(), predicate, hl7Version);
      if (usageValidation != null) {
        ValidationError valError = new ValidationError();
        valError.setErrorMessage(usageValidation);
        valError.setPosition(toBeValidated.getPosition());
        valError.setTargetId(toBeValidated.getId());
        valError.setParentId(parentId);
        valError.setTargetName(toBeValidated.getName());
        valError.setType("Error");
        valError.setTargetType(toBeValidated.getType());
        valError.setValidationType(ValidationType.USAGE);
        validationErrors.add(valError);
      }

    }
    String lengthValidation = validateLength(reference.getMinLength(), reference.getMaxLength(),
        toBeValidated.getMinLength(), toBeValidated.getMaxLength());
    if (lengthValidation != null) {
      ValidationError valErr = new ValidationError();
      valErr.setErrorMessage(lengthValidation);
      valErr.setPosition(toBeValidated.getPosition());
      valErr.setTargetId(toBeValidated.getId());
      valErr.setTargetName(toBeValidated.getName());
      valErr.setTargetType(toBeValidated.getType());
      valErr.setParentId(parentId);
      valErr.setType("Error");
      valErr.setValidationType(ValidationType.LENGTH);
      validationErrors.add(valErr);
    }
    if (!validationErrors.isEmpty()) {
      items.put(toBeValidated.getId(), validationErrors);

    } else {
      return null;
    }


    return items;
  }



  @Override
  public String validateUsage(Usage reference, Usage newValueForUsage, Predicate predicate,
      String hl7Version) {
    if (!Usage.X.toString().equalsIgnoreCase(newValueForUsage.name())) {
      String validationResult = null;

      if (predicate != null && newValueForUsage != Usage.C) {
        return "Usage must be conditional when a predicate is defined";
      } else if (predicate == null && newValueForUsage == Usage.C) {
        return "Predicate is missing for conditional usage " + newValueForUsage.value();

      }

      JsonNode node = getRulesNodeBySchemaVersion(hl7Version).path("constrainable")
          .get(USAGE_RULES_ROOT).get(reference.value());
      List<String> usages = new ArrayList<String>();
      if (node != null && !node.isMissingNode()) {
        ArrayNode array = (ArrayNode) node;
        Iterator<JsonNode> it = array.iterator();
        while (it.hasNext()) {
          usages.add(it.next().textValue());
        }
      }
      if (predicate != null) {
        // C({{p.trueUsage}}/{{p.falseUsage}})
        String predicateUsage =
            "C(" + predicate.getTrueUsage() + "/" + predicate.getFalseUsage() + ")";
        if (!usages.contains(predicateUsage)) {
          validationResult = "Selected usage of " + predicateUsage
              + " is non-compatible with base usage " + reference.value();
          return validationResult;
        } else {
          return null;
        }
      }
      if (!newValueForUsage.name().equals(Usage.C)) {
        if (!usages.contains(newValueForUsage.value())) {
          validationResult = "Selected usage of " + newValueForUsage.value()
              + " is non-compatible with base usage " + reference.value();
          return validationResult;
        } else {
          return null;
        }
      }



    }
    return null;
  }

  @Override
  public String validateLength(int referenceMinLen, String referenceMaxLen, int toBeMinLen,
      String toBeMaxLen) {
    String result = null;
    if (!NumberUtils.isNumber(toBeMaxLen)) {
      if (!"*".equalsIgnoreCase(toBeMaxLen)) {
        result = "Max Length has to be * or a numerical value.";
      }
      return result;
    }
    int toBeMaxLenT = Integer.valueOf(toBeMaxLen.trim());

    if (toBeMaxLenT < toBeMinLen) {
      result = "Max Length cannot be less than Min Length.";
    }

    return result;
  }


  /***************************************************************************************************
   * HELPER METHODS
   ***************************************************************************************************/

  private JsonNode getRulesNodeBySchemaVersion(String schemaVersion) {

    JsonNode node = root.path(schemaVersion);
    return node.isMissingNode() ? root.path(UNSUPPORTED_SCHEMA_VERSION) : node;

  }



}