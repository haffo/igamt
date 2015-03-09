package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints;

import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.Usage;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "PREDICATE")
public class Predicate extends Constraint implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5723342171557075960L;

	@Column(name = "TRUEUSAGE")
	private Usage trueUsage;

	@Column(name = "FALSEUSAGE")
	private Usage falseUsage;

	public Usage getTrueUsage() {
		return trueUsage;
	}

	public void setTrueUsage(Usage trueUsage) {
		this.trueUsage = trueUsage;
	}

	public Usage getFalseUsage() {
		return falseUsage;
	}

	public void setFalseUsage(Usage falseUsage) {
		this.falseUsage = falseUsage;
	}

	@Override
	public String toString() {
		return "Constraint [id=" + id + ", constraintId=" + constraintId
				+ ", constraintTarget=" + constraintTarget + ", reference="
				+ reference + ", description=" + description + ", assertion="
				+ assertion + "]";
	}

}