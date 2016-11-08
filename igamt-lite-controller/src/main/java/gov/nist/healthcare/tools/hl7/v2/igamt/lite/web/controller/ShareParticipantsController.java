package gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.inject.Inject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ShareParticipant;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.ShareParticipantPermission;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.IGDocumentException;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.service.IGDocumentService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.web.exception.UserAccountNotFoundException;

@RestController
public class ShareParticipantsController {
	
  Logger log = LoggerFactory.getLogger(ShareParticipantsController.class);

  @Inject
  private AccountRepository accountRepository;
  
  @Autowired
  private UserService userService;
  
  @Autowired
  private IGDocumentService igDocumentService;
  
  @Value("${server.email}")
  private String SERVER_EMAIL;

  @Value("${admin.email}")
  private String ADMIN_EMAIL;
  
  @Autowired
  private MailSender mailSender;

  @Autowired
  private SimpleMailMessage templateMessage;

  /**
   * List of Username for share feature
   */
  @RequestMapping(value = "/usernames", method = RequestMethod.GET, produces = "application/json")
  public @ResponseBody List<ShareParticipant> userList() {

    List<ShareParticipant> users = new ArrayList<ShareParticipant>();

    for (Account acc : accountRepository.findAll()) {
      if (!acc.isEntityDisabled() && !acc.isPending()) {
        ShareParticipant participant = new ShareParticipant(acc.getId());
        participant.setUsername(acc.getUsername());
        participant.setFullname(acc.getFullName());
        users.add(participant);
      }
    }

    return users;
  }

  /**
   * Get participants by ID
   */
  @RequestMapping(value = "/shareparticipants", method = RequestMethod.GET,
      produces = "application/json")
  public @ResponseBody List<ShareParticipant> getParticipantsListById(
      @RequestParam(value = "ids") Set<Long> ids) {
    List<ShareParticipant> users = new ArrayList<ShareParticipant>();
    List<Account> accounts = accountRepository.findAllInIds(ids);
    for (Account acc : accounts) {
      ShareParticipant share = new ShareParticipant(acc.getId());
      if (!acc.isPending() && !acc.isEntityDisabled()) {
        share.setUsername(acc.getUsername());
        share.setFullname(acc.getFullName());
        users.add(share);
      }
    }
    return users;
  }
  
  /**
   * Get one participant by ID
   */
  @RequestMapping(value = "/shareparticipant", method = RequestMethod.GET,
      produces = "application/json")
  public @ResponseBody ShareParticipant getParticipantById(@RequestParam(value = "id") Long id) {
    Account account = accountRepository.findOne(id);
    ShareParticipant user = null;
    if(account != null){
      user = new ShareParticipant(account.getId());
    user.setUsername(account.getUsername());
    user.setFullname(account.getFullName());
    }
    return user;
  }
  
  /**
   * Link for share confirmation email
   * @throws Exception 
   */
  @RequestMapping(value = "/shareconfimation/{id}", method = RequestMethod.GET,
      produces = "application/json")
  public @ResponseBody boolean confirmShare(@PathVariable("id") String id) throws Exception {
	// Get the user
	User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null)
        throw new UserAccountNotFoundException();
    IGDocument d = igDocumentService.findOne(id);
    
    try {
	    for(ShareParticipantPermission p : d.getShareParticipantIds()) {
	    	if(p.getAccountId() == account.getId()) {
	    		p.setPendingApproval(false);
	    		igDocumentService.save(d);
	    		// Find author
	    		Account acc = accountRepository.findOne(d.getAccountId());
	    		// Send share confirmation email
	    		sendShareConfirmationEmail(d, acc, account);
	    		return true;
	    	}
	    }
    } catch (Exception e) {
        log.error("", e);
        throw new Exception("Failed to share IG Document \n" + e.getMessage());
    }
    return false;
  }
  
  /**
   * Link for share confirmation email
   * @throws Exception 
   */
  @RequestMapping(value = "/sharereject/{id}", method = RequestMethod.GET,
      produces = "application/json")
  public @ResponseBody boolean rejectShare(@PathVariable("id") String id) throws Exception {
	// Get the user
	User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null)
        throw new UserAccountNotFoundException();
    IGDocument d = igDocumentService.findOne(id);
    
    try {
    	d.getShareParticipantIds().remove(new ShareParticipantPermission(account.getId()));
    	igDocumentService.save(d);
    	// Find author
		Account acc = accountRepository.findOne(d.getAccountId());
		// Send share confirmation email
		sendRejectEmail(d, acc, account);
	    return true;
    } catch (Exception e) {
        log.error("", e);
        throw new Exception("Failed to share IG Document \n" + e.getMessage());
    }
  }
  
  private void sendShareConfirmationEmail(IGDocument doc, Account target,Account source) {	  
	  
	    SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

	    msg.setSubject("NIST IGAMT IGDocument Share");
	    msg.setTo(target.getEmail());
	    msg.setText("Dear " + target.getUsername() + " \n\n"
	        + source.getFullName() + "(" + source.getUsername() +") accepted the share request for the IG Document " +  doc.getMetaData().getTitle()
	        + "\n\n"
	        + "P.S: If you need help, contact us at '" + ADMIN_EMAIL + "'");
	    try {
	      this.mailSender.send(msg);
	    } catch (MailException ex) {
	      log.error(ex.getMessage(), ex);
	    }
}
  
  private void sendRejectEmail(IGDocument doc, Account target,Account source) {	  
	  
	    SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

	    msg.setSubject("NIST IGAMT IGDocument Share");
	    msg.setTo(target.getEmail());
	    msg.setText("Dear " + target.getUsername() + " \n\n"
	    	+ source.getFullName() + "(" + source.getUsername() +") rejected the share request for the IG Document " +  doc.getMetaData().getTitle()
	        + "\n\n"
	        + "P.S: If you need help, contact us at '" + ADMIN_EMAIL + "'");
	    try {
	      this.mailSender.send(msg);
	    } catch (MailException ex) {
	      log.error(ex.getMessage(), ex);
	    }
  }


}
