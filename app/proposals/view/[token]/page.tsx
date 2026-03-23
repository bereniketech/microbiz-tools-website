import { PublicProposalView } from "@/components/proposals/PublicProposalView";

export default function PublicProposalPage({ params }: { params: { token: string } }) {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <PublicProposalView token={params.token} />
    </main>
  );
}