package gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * 
 * @author Harold Affo (harold.affo@nist.gov) Feb 26, 2015
 * 
 */
@Document(collection = "table")
public class Table extends DataModel implements Serializable,
		Comparable<Table>, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 734059059225906039L;

	@Id
	private String id;

	private String mappingAlternateId;

	// @NotNull
	private String mappingId;

	// @NotNull
	private String name;

	private String version;
	private String codesys;
	private String oid;
	private String tableType;
	private String stability;
	private String extensibility;

	private List<Code> codes = new ArrayList<Code>();

	// @DBRef
	// private Tables tables;

	public Table() {
		super();
		this.type = Constant.TABLE;
		this.id = ObjectId.get().toString();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getMappingAlternateId() {
		return mappingAlternateId;
	}

	public void setMappingAlternateId(String mappingAlternateId) {
		this.mappingAlternateId = mappingAlternateId;
	}

	public String getMappingId() {
		return mappingId;
	}

	public void setMappingId(String mappingId) {
		this.mappingId = mappingId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public String getCodesys() {
		return codesys;
	}

	public void setCodesys(String codesys) {
		this.codesys = codesys;
	}

	public String getOid() {
		return oid;
	}

	public void setOid(String oid) {
		this.oid = oid;
	}

	public String getTableType() {
		return tableType;
	}

	public void setTableType(String tableType) {
		this.tableType = tableType;
	}

	public List<Code> getCodes() {
		return codes;
	}

	public void setCodes(List<Code> codes) {
		this.codes = codes;
	}

	public void addCode(Code c) {
		codes.add(c);
	}

	public boolean deleteCode(Code c) {
		return codes.remove(c);
	}

	public String getStability() {
		return stability;
	}

	public void setStability(String stability) {
		this.stability = stability;
	}

	public String getExtensibility() {
		return extensibility;
	}

	public void setExtensibility(String extensibility) {
		this.extensibility = extensibility;
	}

	public Code findOneCode(String id) {
		if (this.codes != null)
			for (Code m : this.codes) {
				if (id.equals(m.getId())) {
					return m;
				}
			}

		return null;
	}

	// public Tables getTables() {
	// return tables;
	// }
	//
	// public void setTables(Tables tables) {
	// this.tables = tables;
	// }

	@Override
	public String toString() {
		return "Table [id=" + id + ", mappingAlternateId=" + mappingAlternateId
				+ ", mappingId=" + mappingId + ", name=" + name + ", version="
				+ version + ", codesys=" + codesys + ", oid=" + oid + ", type="
				+ tableType + ", codes=" + codes + "]";
	}

	@Override
	public int compareTo(Table o) {
		int x = String.CASE_INSENSITIVE_ORDER.compare(this.mappingId,
				o.mappingId);
		if (x == 0) {
			x = this.mappingId.compareTo(o.mappingId);
		}
		return x;
	}

	@Override
	public Table clone() throws CloneNotSupportedException {
		Table clonedTable = new Table();
		for (Code c : this.codes) {
			clonedTable.addCode(c.clone());
		}

		clonedTable.setId(id);
		clonedTable.setCodesys(codesys);
		clonedTable.setExtensibility(extensibility);
		clonedTable.setMappingAlternateId(mappingAlternateId);
		clonedTable.setMappingId(mappingId);
		clonedTable.setName(name);
		clonedTable.setOid(oid);
		clonedTable.setStability(stability);
		clonedTable.setTableType(tableType);
		clonedTable.setVersion(version);

		return clonedTable;
	}
}