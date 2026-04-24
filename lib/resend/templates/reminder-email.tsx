import * as React from "react";

interface ReminderEmailProps {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  dueDate: string;
  senderName: string;
  invoiceUrl: string;
  daysOverdue: number;
}

export function ReminderEmail({
  invoiceNumber,
  clientName,
  amount,
  dueDate,
  senderName,
  invoiceUrl,
  daysOverdue,
}: ReminderEmailProps): React.ReactElement {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", color: "#111", maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <h2 style={{ marginBottom: "8px", color: "#c53030" }}>Payment Reminder — Invoice {invoiceNumber}</h2>
        <p>Hi {clientName},</p>
        <p>This is a friendly reminder that invoice {invoiceNumber} for <strong>{amount}</strong> was due on {dueDate} ({daysOverdue} day{daysOverdue !== 1 ? "s" : ""} ago).</p>
        <a href={invoiceUrl} style={{ display: "inline-block", background: "#c53030", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" }}>
          View Invoice
        </a>
        <p style={{ marginTop: "24px", color: "#555" }}>Thanks,<br />{senderName}</p>
      </body>
    </html>
  );
}
