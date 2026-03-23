import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { formatCurrency, formatDate } from "@/lib/utils/formatters";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111827",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  muted: {
    marginTop: 4,
    color: "#6B7280",
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 9,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    borderBottomStyle: "solid",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colName: { width: "46%" },
  colQty: { width: "18%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totals: {
    marginTop: 12,
    marginLeft: "auto",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderTopStyle: "solid",
    fontSize: 12,
    fontWeight: 700,
  },
});

export interface PdfLineItem {
  name: string;
  qty: number;
  unit_price: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  issuedAt: string | null;
  dueDate: string | null;
  currency: string;
  timezone?: string;
  clientName: string;
  clientEmail?: string | null;
  brandName?: string | null;
  brandLogoUrl?: string | null;
  lineItems: PdfLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export function renderInvoicePdf(data: InvoicePdfData): ReactElement {
  const timezone = data.timezone ?? "UTC";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{data.brandName || "Business"}</Text>
            {data.brandLogoUrl ? <Image style={styles.logo} src={data.brandLogoUrl} /> : null}
          </View>
          <Text style={styles.muted}>Invoice {data.invoiceNumber}</Text>
          <Text style={styles.muted}>Status: {data.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.value}>{data.clientName}</Text>
          {data.clientEmail ? <Text style={styles.muted}>{data.clientEmail}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Dates</Text>
          <Text style={styles.value}>Issued: {formatDate(data.issuedAt, timezone)}</Text>
          <Text style={styles.value}>Due: {formatDate(data.dueDate, timezone)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {data.lineItems.map((item, index) => {
            const lineTotal = Number(item.qty) * Number(item.unit_price);

            return (
              <View key={`${item.name}-${index}`} style={styles.row}>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colQty}>{item.qty}</Text>
                <Text style={styles.colUnit}>{formatCurrency(item.unit_price, data.currency)}</Text>
                <Text style={styles.colTotal}>{formatCurrency(lineTotal, data.currency)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax ({data.taxRate}%)</Text>
            <Text>{formatCurrency(data.taxAmount, data.currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total</Text>
            <Text>{formatCurrency(data.totalAmount, data.currency)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
