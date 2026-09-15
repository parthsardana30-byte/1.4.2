"use client";

import { Check, ChevronLeft, Clock3, Cloud, FilePenLine, Inbox, LoaderCircle, Menu, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";

type Draft = { id: string; title: string; content: string; category: "Article" | "Social" | "Newsletter" | "Notes"; createdAt: string; updatedAt: string };
type SaveState = "idle" | "saving" | "saved";
type DraftToolInput = { id?: string; title?: string; content?: string; category?: Draft["category"] };
type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: DraftToolInput) => unknown }, options: { signal: AbortSignal }) => void | Promise<void> };
const STORAGE_KEY = "draftly-post-drafts-v1";
const seedDrafts: Draft[] = [
  { id: "launch-story", title: "The story behind our spring launch", content: "A product launch is never just one big moment. It is hundreds of small decisions, thoughtful conversations, and quiet breakthroughs that finally meet the world together.\n\nFor our spring collection, we started with one question: what would it look like to make everyday work feel lighter?", category: "Article", createdAt: "2026-09-12T10:00:00.000Z", updatedAt: "2026-09-15T07:45:00.000Z" },
  { id: "community-update", title: "September community update", content: "A quick look at what our community made, learned, and shared this month.", category: "Newsletter", createdAt: "2026-09-11T12:00:00.000Z", updatedAt: "2026-09-14T16:20:00.000Z" },
  { id: "process-notes", title: "Design process notes", content: "Keep the first review focused on direction, not polish. Collect decisions in one place.", category: "Notes", createdAt: "2026-09-10T09:00:00.000Z", updatedAt: "2026-09-13T11:05:00.000Z" },
];
const wait = (milliseconds = 520) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
function blankDraft(): Draft { const now = new Date().toISOString(); return { id: crypto.randomUUID(), title: "", content: "", category: "Article", createdAt: now, updatedAt: now }; }

export default function Home() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Draft["category"]>("All");
  const [isReady, setIsReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const nextDrafts = stored ? (JSON.parse(stored) as Draft[]) : seedDrafts;
        setDrafts(nextDrafts); setActiveId(nextDrafts[0]?.id ?? "");
      } catch {
        setDrafts(seedDrafts); setActiveId(seedDrafts[0].id);
        toast.error("Saved drafts could not be read", { description: "A fresh local workspace has been opened." });
      } finally { setIsReady(true); }
    }, 420);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const categories = ["Article", "Social", "Newsletter", "Notes"] as const;
    const persist = (nextDrafts: Draft[]) => { setDrafts(nextDrafts); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts)); };
    const tools = [
      {
        name: "list_drafts", title: "List drafts", description: "List the post drafts currently saved in this browser.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => ({ drafts: drafts.map(({ id, title, category, updatedAt }) => ({ id, title: title || "Untitled draft", category, updatedAt })) }),
      },
      {
        name: "create_draft", title: "Create draft", description: "Create and save a new post draft, then open it in the editor.",
        inputSchema: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, category: { type: "string", enum: categories } }, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: DraftToolInput) => { if (input.category && !categories.includes(input.category)) throw new Error("Choose a valid draft category."); const next = { ...blankDraft(), title: input.title ?? "", content: input.content ?? "", category: input.category ?? "Article" }; persist([next, ...drafts]); setActiveId(next.id); setSaveState("saved"); return { created: true, id: next.id }; },
      },
      {
        name: "update_draft", title: "Update draft", description: "Update and save the title, content, or category of an existing draft.",
        inputSchema: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, content: { type: "string" }, category: { type: "string", enum: categories } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: DraftToolInput) => { const found = drafts.some((draft) => draft.id === input.id); if (!found) throw new Error("Draft not found."); if (input.category && !categories.includes(input.category)) throw new Error("Choose a valid draft category."); const updatedAt = new Date().toISOString(); const nextDrafts = drafts.map((draft) => draft.id === input.id ? { ...draft, ...(input.title !== undefined && { title: input.title }), ...(input.content !== undefined && { content: input.content }), ...(input.category !== undefined && { category: input.category }), updatedAt } : draft); persist(nextDrafts); setActiveId(input.id!); setSaveState("saved"); return { updated: true, id: input.id, updatedAt }; },
      },
      {
        name: "delete_draft", title: "Delete draft", description: "Permanently delete one locally saved draft by its ID.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: DraftToolInput) => { if (!drafts.some((draft) => draft.id === input.id)) throw new Error("Draft not found."); const nextDrafts = drafts.filter((draft) => draft.id !== input.id); persist(nextDrafts); if (activeId === input.id) setActiveId(nextDrafts[0]?.id ?? ""); return { deleted: true, id: input.id }; },
      },
    ];
    tools.forEach((tool) => { void Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); });
    return () => lifecycle.abort();
  }, [activeId, drafts, isReady]);

  const activeDraft = drafts.find((draft) => draft.id === activeId);
  const filteredDrafts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return drafts.filter((draft) => (filter === "All" || draft.category === filter) && (!needle || `${draft.title} ${draft.content}`.toLocaleLowerCase().includes(needle)));
  }, [drafts, filter, query]);

  function updateActive(patch: Partial<Draft>) { setSaveState("idle"); setDrafts((current) => current.map((draft) => draft.id === activeId ? { ...draft, ...patch } : draft)); }
  function createDraft() { const draft = blankDraft(); setDrafts((current) => [draft, ...current]); setActiveId(draft.id); setQuery(""); setFilter("All"); setSaveState("idle"); setMobileListOpen(false); toast.info("Blank draft created"); }
  async function saveDraft() {
    if (!activeDraft || (!activeDraft.title.trim() && !activeDraft.content.trim())) { toast.error("Add a title or some content first"); return; }
    setSaveState("saving"); await wait();
    const updatedAt = new Date().toISOString();
    const nextDrafts = drafts.map((draft) => draft.id === activeId ? { ...draft, updatedAt } : draft);
    setDrafts(nextDrafts); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts)); setSaveState("saved"); toast.success("Draft saved to this device");
  }
  async function deleteDraft() {
    if (!activeDraft) return;
    const deletedTitle = activeDraft.title || "Untitled draft"; setSaveState("saving"); await wait(430);
    const remaining = drafts.filter((draft) => draft.id !== activeId);
    setDrafts(remaining); setActiveId(remaining[0]?.id ?? ""); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining)); setDeleteOpen(false); setSaveState("idle"); toast.success(`“${deletedTitle}” deleted`);
  }
  const words = activeDraft?.content.trim() ? activeDraft.content.trim().split(/\s+/).length : 0;
  const characters = activeDraft?.content.length ?? 0;

  return <main className="draft-app">
    <Toaster position="top-right" />
    <header className="app-header">
      <a className="brand" href="#workspace" aria-label="Draftly home"><span className="brand-symbol"><FilePenLine size={19} /></span><span>draftly</span></a>
      <div className="header-status"><Cloud size={15} /><span>Stored on this device</span></div>
      <div className="header-actions"><button className="mobile-menu" type="button" aria-label="Show drafts" onClick={() => setMobileListOpen(true)}><Menu size={20} /></button><span className="avatar" aria-label="Personal workspace">P</span></div>
    </header>
    <section className="workspace" id="workspace">
      <aside className="rail" aria-label="Workspace navigation"><div className="rail-mark"><Sparkles size={18} /></div><nav><button className="active" type="button" aria-label="Drafts"><FilePenLine size={19} /><span>Drafts</span></button></nav><div className="rail-footer"><span>PD</span></div></aside>
      <aside className={mobileListOpen ? "draft-sidebar mobile-open" : "draft-sidebar"}>
        <div className="sidebar-top">
          <div className="title-row"><div><p className="eyebrow">Workspace</p><h1>Your drafts</h1></div><button className="close-list" type="button" aria-label="Close drafts" onClick={() => setMobileListOpen(false)}><X size={19} /></button></div>
          <button className="new-draft" type="button" onClick={createDraft}><Plus size={17} /> New draft</button>
          <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search drafts" aria-label="Search drafts" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>}</label>
          <div className="filter-row" aria-label="Filter drafts">{(["All", "Article", "Social", "Newsletter", "Notes"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div>
        </div>
        <div className="draft-list" aria-live="polite">
          {!isReady ? Array.from({ length: 3 }).map((_, index) => <div className="draft-skeleton" key={index}><span /><span /><span /></div>) : filteredDrafts.length ? filteredDrafts.map((draft) => <button key={draft.id} className={draft.id === activeId ? "draft-card active" : "draft-card"} type="button" onClick={() => { setActiveId(draft.id); setSaveState("idle"); setMobileListOpen(false); }}><div className="draft-card-top"><span className={`category-dot ${draft.category.toLowerCase()}`} /><span>{draft.category}</span><time dateTime={draft.updatedAt}>{formatDate(draft.updatedAt)}</time></div><strong>{draft.title || "Untitled draft"}</strong><p>{draft.content || "No content yet"}</p></button>) : <div className="empty-list"><Search size={22} /><strong>No drafts found</strong><p>Try another search or start a new draft.</p></div>}
        </div><p className="draft-count">{drafts.length} draft{drafts.length === 1 ? "" : "s"} stored locally</p>
      </aside>
      <section className="editor-shell">
        {activeDraft ? <div className="editor-page">
          <div className="editor-toolbar"><button className="back-button" type="button" onClick={() => setMobileListOpen(true)}><ChevronLeft size={18} /> All drafts</button><div className={`save-indicator ${saveState}`} aria-live="polite">{saveState === "saving" ? <><LoaderCircle className="spin" size={15} /> Saving…</> : saveState === "saved" ? <><Check size={15} /> Saved</> : <><Clock3 size={15} /> Unsaved changes</>}</div><span /></div>
          <div className="editor-content">
            <label className="category-control">Type<select value={activeDraft.category} onChange={(event) => updateActive({ category: event.target.value as Draft["category"] })}><option>Article</option><option>Social</option><option>Newsletter</option><option>Notes</option></select></label>
            <input className="title-input" value={activeDraft.title} onChange={(event) => updateActive({ title: event.target.value })} placeholder="Untitled draft" aria-label="Draft title" />
            <div className="meta-line"><span>Created {formatDate(activeDraft.createdAt)}</span><i /><span>{words} words</span><i /><span>{characters} characters</span></div><div className="paper-rule" />
            <textarea className="content-input" value={activeDraft.content} onChange={(event) => updateActive({ content: event.target.value })} placeholder="Start writing. Your ideas are safe here…" aria-label="Draft content" />
          </div>
          <footer className="editor-footer"><p><Inbox size={16} /> Drafts stay in this browser until you delete them.</p><div><button className="delete-button" type="button" onClick={() => setDeleteOpen(true)} disabled={saveState === "saving"}><Trash2 size={17} /> Delete</button><button className="save-button" type="button" onClick={saveDraft} disabled={saveState === "saving"}>{saveState === "saving" ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} Save draft</button></div></footer>
        </div> : isReady ? <div className="empty-editor"><span><FilePenLine size={28} /></span><h2>Your next idea starts here</h2><p>Create a draft to begin writing.</p><button type="button" onClick={createDraft}><Plus size={17} /> New draft</button></div> : <div className="loading-editor"><LoaderCircle className="spin" size={25} /><span>Opening your drafts…</span></div>}
      </section>
    </section>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="delete-dialog"><AlertDialogHeader><AlertDialogTitle>Delete this draft?</AlertDialogTitle><AlertDialogDescription>“{activeDraft?.title || "Untitled draft"}” will be permanently removed from this device.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep draft</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteDraft}>Delete draft</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
