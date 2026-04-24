import * as React from "react";

interface InvoiceEmailProps {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  dueDate: string;
  senderName: string;
  invoiceUrl: string;
}

export function InvoiceEmail({
  invoiceNumber,
  clientName,
  amount,
  dueDate,
  senderName,
  invoiceUrl,
}: InvoiceEmailProps): React.ReactElement {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", color: "#111", maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <h2 style={{ marginBottom: "8px" }}>Invoice {invoiceNumber}</h2>
        <p>Hi {clientName},</p>
        <p>Please find your invoice attached.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0" }}>
          <tr>
            <td style={{ padding: "8px 0", color: "#555" }}>Amount due</td>
            <td style={{ padding: "8px 0", fontWeight: "bold", textAlign: "right" }}>{amount}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", color: "#555" }}>Due date</td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>{dueDate}</td>
          </tr>
        </table>
        <a href={invoiceUrl} style={{ display: "inline-block", background: "#111", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" }}>
          View Invoice
        </a>
        <p style={{ marginTop: "24px", color: "#555" }}>Thanks,<br />{senderName}</p>
      </body>
    </html>
  );
}
