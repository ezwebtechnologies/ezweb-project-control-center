"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveRequirementsGatheringData } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  parseRequirementsGatheringData,
  type RequirementsGatheringData,
} from "@/lib/requirements-gathering";
import { cn } from "@/lib/utils";

const CHECKLIST: {
  key: keyof RequirementsGatheringData["checklist"];
  label: string;
  hint: string;
}[] = [
  {
    key: "notifications",
    label: "Notifications",
    hint: "Confirmed with the client (channels, consent, transactional vs marketing).",
  },
  {
    key: "integrations",
    label: "Integrations",
    hint: "Third-party systems, APIs, and data flows agreed with the client.",
  },
  {
    key: "clientDomain",
    label: "Client domain",
    hint: "Domain ownership, DNS, and go-live constraints clarified with the client.",
  },
  {
    key: "googleBusinessProfile",
    label: "Google Business Profile",
    hint: "Profile access, verification, and listing details aligned with the client.",
  },
];

type Props = {
  projectId: string;
  initialData: unknown;
  archived: boolean;
};

export function RequirementsGatheringPanel({ projectId, initialData, archived }: Props) {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<RequirementsGatheringData>(() =>
    parseRequirementsGatheringData(initialData)
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const snapshot = JSON.stringify(initialData ?? null);
  useEffect(() => {
    const parsed = parseRequirementsGatheringData(initialData);
    dataRef.current = parsed;
    setData(parsed);
  }, [snapshot, initialData]);

  function saveAndAdvanceToProposal() {
    if (archived) return;
    const prev = dataRef.current;
    const normalized: RequirementsGatheringData = {
      ...prev,
      pages: prev.pages.map((p) => ({
        ...p,
        title: p.title.trim() || "Untitled page",
        description: p.description.trim(),
      })),
    };
    dataRef.current = normalized;
    setData(normalized);
    startTransition(async () => {
      await saveRequirementsGatheringData({
        projectId,
        pages: normalized.pages,
        checklist: normalized.checklist,
        advanceToProposal: true,
      });
    });
  }

  function setChecklist(key: keyof RequirementsGatheringData["checklist"], checked: boolean) {
    if (archived) return;
    setData((prev) => {
      const next = {
        ...prev,
        checklist: { ...prev.checklist, [key]: checked },
      };
      dataRef.current = next;
      return next;
    });
  }

  function addPage() {
    if (archived) return;
    setData((prev) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const next = {
        ...prev,
        pages: [...prev.pages, { id, title: "New page", description: "" }],
      };
      dataRef.current = next;
      return next;
    });
  }

  function removePage(id: string) {
    if (archived) return;
    setData((prev) => {
      const next = { ...prev, pages: prev.pages.filter((p) => p.id !== id) };
      dataRef.current = next;
      return next;
    });
  }

  function updatePage(id: string, patch: Partial<{ title: string; description: string }>) {
    if (archived) return;
    setData((prev) => {
      const next = {
        ...prev,
        pages: prev.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      };
      dataRef.current = next;
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Site & scope pages</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add each page with a short description. Pricing is set after you move to Proposal
              approved.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            disabled={archived}
            onClick={addPage}
          >
            <Plus className="size-3.5" aria-hidden />
            Add page
          </Button>
        </div>

        {data.pages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No pages yet. Use <span className="font-medium text-foreground/80">Add page</span> to list
            key URLs or sections.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.pages.map((page, index) => (
              <li
                key={page.id}
                className="rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm dark:bg-background/30"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Page {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={archived}
                    onClick={() => removePage(page.id)}
                    aria-label={`Remove page ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`req-page-title-${page.id}`} className="text-xs">
                      Page name
                    </Label>
                    <Input
                      id={`req-page-title-${page.id}`}
                      value={page.title}
                      onChange={(e) => updatePage(page.id, { title: e.target.value })}
                      disabled={archived}
                      placeholder="e.g. Home, Pricing, Contact"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`req-page-desc-${page.id}`} className="text-xs">
                      Page description
                    </Label>
                    <Textarea
                      id={`req-page-desc-${page.id}`}
                      value={page.description}
                      onChange={(e) => updatePage(page.id, { description: e.target.value })}
                      disabled={archived}
                      placeholder="What this page should do, key sections, or client notes."
                      rows={3}
                      className="min-h-[4.5rem] resize-y text-sm"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator className="bg-border/50" />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Client confirmations</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tick each item once it has been discussed with the client. Billing uses these selections
            on the Proposal approved stage.
          </p>
        </div>

        <ul className="space-y-0 divide-y divide-border/50 rounded-xl border border-border/50 bg-muted/[0.06] dark:bg-muted/10">
          {CHECKLIST.map(({ key, label, hint }) => {
            const checked = data.checklist[key];
            return (
              <li key={key} className="flex gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <div className="flex shrink-0 items-start pt-0.5">
                  <input
                    id={`req-check-${key}`}
                    type="checkbox"
                    checked={checked}
                    disabled={archived}
                    onChange={(e) => setChecklist(key, e.target.checked)}
                    className={cn(
                      "size-4 rounded border-input bg-background shadow-sm transition-colors",
                      "accent-[hsl(var(--sidebar-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={`req-check-${key}`}
                    className={cn(
                      "cursor-pointer text-sm font-medium leading-none text-foreground",
                      archived && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {label}
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {!archived ? (
        <div className="flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            disabled={pending}
            onClick={saveAndAdvanceToProposal}
            className="flex w-full items-center justify-center gap-2 rounded-lg sm:w-auto"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save & go to proposal"
            )}
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:max-w-md sm:text-right">
            Saves scope and moves this project to <span className="font-medium">Proposal approved</span>.
            Unit prices and billing appear on the project card in that stage.
          </p>
        </div>
      ) : null}
    </div>
  );
}
