import { ProposalEditor } from "@/components/proposals/ProposalEditor";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return <ProposalEditor proposalId={params.id} />;
}