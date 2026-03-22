"use client";

import { SnippetPicker as SharedSnippetPicker } from "@/components/snippets/SnippetPicker";

interface SnippetPickerProps {
  open: boolean;
  contactName: string;
  onClose: () => void;
  onSnippetSelected: (resolvedText: string) => void;
}

export function SnippetPicker({ open, contactName, onClose, onSnippetSelected }: SnippetPickerProps) {
  return <SharedSnippetPicker open={open} clientName={contactName} onClose={onClose} onInsert={onSnippetSelected} />;
}
