import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Define styles
const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10, fontFamily: "Helvetica" },
  section: { marginBottom: 15 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, marginTop: 10 },
  row: { flexDirection: "row" },
  header: { backgroundColor: "#4F81BD", fontWeight: "bold", color: "#FFFFFF" },
  cell: { borderWidth: 1, padding: 6, flex: 1, textAlign: "center" },
  alternateRow: { backgroundColor: "#f9f9f9" },
});

const PDFDocument = ({ data, branch }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Inventory History - {branch}</Text>
      </View>

      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.row, styles.header]}>
          <Text style={styles.cell}>Name</Text>
          <Text style={styles.cell}>Category</Text>
          <Text style={styles.cell}>Beg Inventory</Text>
          <Text style={styles.cell}>Delivered</Text>
          <Text style={styles.cell}>Waste</Text>
          <Text style={styles.cell}>Use</Text>
          <Text style={styles.cell}>Withdrawal</Text>
          <Text style={styles.cell}>Current</Text>
        </View>

        {/* Data Rows */}
        {data.map((item, index) => (
          <View key={index} style={[styles.row, index % 2 === 0 ? styles.alternateRow : null]}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.category}</Text>
            <Text style={styles.cell}>{item.begInventory}</Text>
            <Text style={styles.cell}>{item.delivered}</Text>
            <Text style={styles.cell}>{item.waste}</Text>
            <Text style={styles.cell}>{item.use}</Text>
            <Text style={styles.cell}>{item.withdrawal}</Text>
            <Text style={styles.cell}>{item.current}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default PDFDocument;
