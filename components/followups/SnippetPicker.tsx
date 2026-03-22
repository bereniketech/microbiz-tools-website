"use client";

import { Button } from "@/components/ui/button";

interface SnippetPickerProps {
  open: boolean;
  contactName: string;
  onClose: () => void;
  onSnippetSelected: (resolvedText: string) => void;
}

const STUB_SNIPPETS = [
  {
    id: "gentle-checkin",
    title: "Gentle check-in",
    body: "Hi {client_name}, just checking in on this. Is there anything you need from me to move forward?",
  },
  {
    id: "quick-bump",
    title: "Quick bump",
    body: "Hey {client_name}, bumping this to the top of your inbox. Happy to answer any questions.",
  },
  {
    id: "final-followup",
    title: "Final follow-up",
    body: "Hi {client_name}, this is my final follow-up for now. If the timing changes, I can jump back in quickly.",
  },
];

function resolveSnippetBody(body: string, contactName: string): string {
  return body.replaceAll("{client_name}", contactName);
}

export function SnippetPicker({ open, contactName, onClose, onSnippetSelected }: SnippetPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Choose a snippet</h2>
            <p className="text-sm text-muted-foreground">Task-007 placeholder picker. Select one to copy resolved text.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {STUB_SNIPPETS.map((snippet) => {
            const resolvedBody = resolveSnippetBody(snippet.body, contactName);

            return (
              <div key={snippet.id} className="rounded-md border p-3">
                <p className="font-medium">{snippet.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{resolvedBody}</p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      onSnippetSelected(resolvedBody);
                      onClose();
                    }}
                  >
                    Use snippet
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}