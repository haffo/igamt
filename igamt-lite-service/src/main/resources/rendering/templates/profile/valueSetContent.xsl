<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template name="ValueSetContent">

        <xsl:element name="tr">
            <xsl:attribute name="class">
                <xsl:text>contentTr</xsl:text>
            </xsl:attribute>
            <xsl:element name="td">
                <xsl:value-of select="@Value"/>
            </xsl:element>
            <xsl:element name="td">
                <xsl:value-of select="@CodeSystem"/>
            </xsl:element>
            <xsl:element name="td">
                <xsl:value-of select="@Usage"/>
            </xsl:element>
            <xsl:element name="td">
                <xsl:value-of select="@Label"/>
            </xsl:element>
        </xsl:element>
    </xsl:template>

</xsl:stylesheet>
