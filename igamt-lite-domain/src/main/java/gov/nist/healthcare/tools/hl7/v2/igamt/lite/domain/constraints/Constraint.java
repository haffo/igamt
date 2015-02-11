package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;

@Entity
public class Constraint implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5723342171557075960L;

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long id;

	@NotNull
	@Column(nullable = false)
	private String constraintId;

	private String constraintTag;

	private Reference reference;

	@NotNull
	@Column(nullable = false)
	private String description;

	@NotNull
	@Column(nullable = false)
	private String assertion;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getConstraintId() {
		return constraintId;
	}

	public void setConstraintId(String constraintId) {
		this.constraintId = constraintId;
	}

	public String getConstraintTag() {
		return constraintTag;
	}

	public void setConstraintTag(String constraintTag) {
		this.constraintTag = constraintTag;
	}

	public Reference getReference() {
		return reference;
	}

	public void setReference(Reference reference) {
		this.reference = reference;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getAssertion() {
		return assertion;
	}

	public void setAssertion(String assertion) {
		this.assertion = assertion;
	}

	@Override
	public String toString() {
		return "Constraint [id=" + id + ", constraintId=" + constraintId
				+ ", constraintTag=" + constraintTag + ", reference="
				+ reference + ", description=" + description + ", assertion="
				+ assertion + "]";
	}
	
	@Override
    public Constraint clone() throws CloneNotSupportedException {
		Constraint clonedConstraint = (Constraint) super.clone();
		clonedConstraint.setId(null);
		clonedConstraint.setReference(reference.clone());
        return clonedConstraint;
    }

}
