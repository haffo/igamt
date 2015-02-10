package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain;

import java.util.LinkedHashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderColumn;
import javax.validation.constraints.NotNull;

import org.codehaus.jackson.map.annotate.JsonView;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Datatype implements java.io.Serializable {

	private static final long serialVersionUID = 1L;

	@JsonView({Views.Profile.class,Views.Field.class,Views.Component.class})
 	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long id;
	
	@JsonView({Views.Datatype.class})
	@NotNull
	@Column(nullable = false)
	private String label;
	
	@JsonView({Views.Datatype.class})
	@OneToMany(mappedBy = "datatype", cascade = CascadeType.ALL)
	@OrderColumn(name = "position", nullable = true)
	private final Set<Component> components = new LinkedHashSet<Component>();

	@JsonView({Views.Datatype.class})
	@NotNull
	@Column(nullable = false)
	private String name;
	
	@JsonView({Views.Datatype.class})
	@Column(nullable = true)
	private String description;

	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	private Datatypes datatypes;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public Set<Component> getComponents() {
		return components;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Datatypes getDatatypes() {
		return datatypes;
	}

	public void setDatatypes(Datatypes datatypes) {
		this.datatypes = datatypes;
	}

	public void addComponent(Component c) {
		if (c.getDatatype() != null)
			throw new IllegalArgumentException(
					"This component already belong to a datatype");
		components.add(c);
		c.setDatatype(this);
	}

	@Override
	public String toString() {
		return "Datatype [id=" + id + ", label=" + label + ", components="
				+ components + ", name=" + name + ", description="
				+ description + "]";
	}

}
