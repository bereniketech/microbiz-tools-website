import * as React from "react";

interface ProposalEmailProps {
  proposalTitle: string;
  clientName: string;
  senderName: string;
  proposalUrl: string;
}

export function ProposalEmail({
  proposalTitle,
  clientName,
  senderName,
  proposalUrl,
}: ProposalEmailProps): React.ReactElement {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", color: "#111", maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <h2 style={{ marginBottom: "8px" }}>Proposal: {proposalTitle}</h2>
        <p>Hi {clientName},</p>
        <p>I&apos;ve sent you a proposal. Click below to review it.</p>
        <a href={proposalUrl} style={{ display: "inline-block", background: "#111", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" }}>
          View Proposal
        </a>
        <p style={{ marginTop: "24px", color: "#555" }}>Thanks,<br />{senderName}</p>
      </body>
    </html>
  );
}
