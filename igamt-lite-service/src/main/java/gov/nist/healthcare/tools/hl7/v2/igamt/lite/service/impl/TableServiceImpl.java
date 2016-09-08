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
 */
package gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.impl;

import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Constant.SCOPE;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Table;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.repo.TableRepository;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.TableService;

/**
 * @author gcr1
 *
 */
@Service
public class TableServiceImpl implements TableService {

  Logger log = LoggerFactory.getLogger(TableServiceImpl.class);

  @Autowired
  private TableRepository tableRepository;

  @Override
  public List<Table> findAll() {
    return tableRepository.findAll();
  }

  @Override
  public Table findById(String id) {
    if (id != null) {
      log.info("TableServiceImpl.findById=" + id);
      return tableRepository.findOne(id);
    }
    return null;
  }

  @Override
  public List<Table> findByScopesAndVersion(List<SCOPE> scopes, String hl7Version) {
    List<Table> tables = tableRepository.findByScopesAndVersion(scopes, hl7Version);
    log.info("TableServiceImpl.findByScopeAndVersion=" + tables.size());
    return tables;
  }

  @Override
  public Table save(Table table) {
    log.info("TableServiceImpl.save=" + table.getBindingIdentifier());
    return tableRepository.save(table);
  }

  @Override
  public void delete(Table table) {
    log.info("TableServiceImpl.delete=" + table.getBindingIdentifier());
    tableRepository.delete(table);
  }

  @Override
  public void delete(String id) {
    log.info("TableServiceImpl.delete=" + id);
    tableRepository.delete(id);
  }

  @Override
  public void save(List<Table> tables) {
    // TODO Auto-generated method stub
    tableRepository.save(tables);
  }


  @Override
  public List<Table> findAllByIds(Set<String> ids) {
    // TODO Auto-generated method stub
    return tableRepository.findAllByIds(ids);
  }

  @Override
  public List<Table> findShortAllByIds(Set<String> ids) {
    // TODO Auto-generated method stub
    return tableRepository.findShortAllByIds(ids);
  }



}
