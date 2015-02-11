package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.constraints;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;

@Embeddable
public class ConstraintMetaData implements java.io.Serializable, Cloneable {

	private static final long serialVersionUID = 1L;

	@NotNull
	@Column(nullable = false)
	private String description;

	private Standard standard;

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Standard getStandard() {
		return standard;
	}

	public void setStandard(Standard standard) {
		this.standard = standard;
	}

	@Override
	public String toString() {
		return "MetaData [description=" + description + ", standard="
				+ standard + "]";
	}
	
	@Override
    public ConstraintMetaData clone() throws CloneNotSupportedException {
		ConstraintMetaData clonedConstraintMetaData = (ConstraintMetaData) super.clone();
		clonedConstraintMetaData.setStandard(standard.clone());
        return clonedConstraintMetaData;
    }

}
