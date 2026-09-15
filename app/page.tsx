"use client";

import { Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Grid2X2, GripVertical, Plus, Search, Settings, Sparkles, Trash2 } from "lucide-react";
import { addDays, addMonths, addWeeks, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { DragEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppDispatch, CalendarPost, calendarStore, Channel, deletePost, movePost, PostStatus, RootState, savePost } from "@/lib/calendar-store";

type View = "day" | "week" | "month";
const toneByChannel: Record<Channel, string> = { Instagram: "coral", LinkedIn: "blue", "X / Twitter": "cyan" };

function iso(date: Date) { return format(date, "yyyy-MM-dd"); }

function PostCard({ post, openEditor }: { post: CalendarPost; openEditor: (post: CalendarPost) => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const keyboardMove = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openEditor(post); return; }
    if (!event.shiftKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    dispatch(movePost({ id: post.id, date: iso(addDays(parseISO(post.date), event.key === "ArrowLeft" ? -1 : 1)) }));
  };
  return <article className={`post-card ${post.tone}`} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/post-id", post.id); }} onClick={() => openEditor(post)} onKeyDown={keyboardMove} tabIndex={0} role="button" aria-label={`${post.title}, ${post.time}. Press Enter to edit or Shift and arrow keys to move by one day.`}>
    <div><span>{post.time}</span><i>{post.status}</i></div>
    <h2>{post.title}</h2>
    <p>{post.channel}</p>
    <GripVertical className="drag-grip" aria-hidden="true" />
  </article>;
}

function PostDialog({ open, post, defaultDate, onClose }: { open: boolean; post: CalendarPost | null; defaultDate: string; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [draft, setDraft] = useState<CalendarPost>(() => post ?? { id: crypto.randomUUID(), title: "", caption: "", date: defaultDate, time: "09:00", channel: "Instagram", status: "Draft", tone: "coral" });
  const submit = (event: FormEvent) => { event.preventDefault(); dispatch(savePost({ ...draft, tone: toneByChannel[draft.channel] })); onClose(); };
  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="post-dialog">
    <form onSubmit={submit}>
      <DialogHeader><p className="dialog-kicker">{post ? "EDIT SCHEDULE" : "NEW POST"}</p><DialogTitle>{post ? "Update post" : "Schedule a post"}</DialogTitle><DialogDescription>Set the content, channel, and exact publishing time.</DialogDescription></DialogHeader>
      <div className="post-form">
        <label><span>Post title</span><Input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What are you sharing?" /></label>
        <label><span>Caption</span><Textarea value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} placeholder="Add a short caption or note" /></label>
        <div className="form-row"><label><span>Date</span><Input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label><span>Time</span><Input required type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label></div>
        <div className="form-row"><label><span>Channel</span><Select value={draft.channel} onValueChange={(value) => setDraft({ ...draft, channel: value as Channel })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="LinkedIn">LinkedIn</SelectItem><SelectItem value="X / Twitter">X / Twitter</SelectItem></SelectContent></Select></label><label><span>Status</span><Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as PostStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Review">Needs review</SelectItem><SelectItem value="Scheduled">Scheduled</SelectItem></SelectContent></Select></label></div>
      </div>
      <DialogFooter className="dialog-actions">{post && <Button type="button" variant="ghost" className="delete-button" onClick={() => { dispatch(deletePost(post.id)); onClose(); }}><Trash2 />Delete</Button>}<Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{post ? "Save changes" : "Schedule post"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}

function Planner() {
  const posts = useSelector((state: RootState) => state.posts);
  const dispatch = useDispatch<AppDispatch>();
  const [anchor, setAnchor] = useState(new Date(2026, 8, 16));
  const [view, setView] = useState<View>("week");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CalendarPost | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [viewMenu, setViewMenu] = useState(false);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    type ModelContext = { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* unsupported implementation */ } };
    register({ name: "list_calendar_posts", title: "List calendar posts", description: "Read the posts currently shown in the content calendar.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => calendarStore.getState().posts });
    register({ name: "create_calendar_post", title: "Create calendar post", description: "Create and schedule a post in the visible content calendar.", inputSchema: { type: "object", properties: { title: { type: "string" }, date: { type: "string", format: "date" }, time: { type: "string" }, channel: { type: "string", enum: ["Instagram", "LinkedIn", "X / Twitter"] }, status: { type: "string", enum: ["Draft", "Review", "Scheduled"] }, caption: { type: "string" } }, required: ["title", "date", "time", "channel", "status"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (raw) => {
      const input = raw as Partial<CalendarPost>; if (!input.title || !input.date || !input.time || !input.channel || !input.status || Number.isNaN(parseISO(input.date).getTime())) throw new Error("A valid title, date, time, channel, and status are required.");
      const post: CalendarPost = { id: crypto.randomUUID(), title: input.title, caption: input.caption ?? "", date: input.date, time: input.time, channel: input.channel, status: input.status, tone: toneByChannel[input.channel] }; calendarStore.dispatch(savePost(post)); return { id: post.id, status: "created", date: post.date };
    }});
    register({ name: "move_calendar_post", title: "Move calendar post", description: "Reschedule an existing post to a different date.", inputSchema: { type: "object", properties: { id: { type: "string" }, date: { type: "string", format: "date" } }, required: ["id", "date"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (raw) => {
      const input = raw as { id?: string; date?: string }; const exists = calendarStore.getState().posts.some((post) => post.id === input.id); if (!exists || !input.id || !input.date || Number.isNaN(parseISO(input.date).getTime())) throw new Error("A valid post id and date are required."); calendarStore.dispatch(movePost({ id: input.id, date: input.date })); return { id: input.id, status: "moved", date: input.date };
    }});
    return () => lifecycle.abort();
  }, []);

  const visibleDays = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor, { weekStartsOn: 1 }), i));
    const monthStart = startOfMonth(anchor); const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [anchor, view]);
  const filtered = posts.filter((post) => `${post.title} ${post.channel} ${post.status}`.toLowerCase().includes(query.toLowerCase()));
  const counts = { Scheduled: posts.filter((p) => p.status === "Scheduled").length, Draft: posts.filter((p) => p.status === "Draft").length, Review: posts.filter((p) => p.status === "Review").length };
  const shift = (amount: number) => setAnchor(view === "month" ? addMonths(anchor, amount) : view === "week" ? addWeeks(anchor, amount) : addDays(anchor, amount));
  const title = view === "month" ? format(anchor, "MMMM yyyy") : view === "day" ? format(anchor, "MMMM d, yyyy") : format(visibleDays[0], "MMMM yyyy");
  const range = view === "month" ? format(anchor, "MMMM yyyy") : view === "day" ? format(anchor, "EEEE, MMM d") : `${format(visibleDays[0], "MMM d")}–${format(visibleDays[6], "d")}`;
  const drop = (event: DragEvent, date: string) => { event.preventDefault(); const id = event.dataTransfer.getData("text/post-id"); if (id) dispatch(movePost({ id, date })); };

  return <main className="planner-shell">
    <aside className="rail"><a className="brand" href="#"><span><Sparkles size={18} /></span><b>Planora</b></a><nav aria-label="Main navigation"><a className="active" href="#"><CalendarDays />Calendar</a><a href="#"><Grid2X2 />Content library</a></nav><div className="rail-tip"><Clock3 /><p><b>Quick move</b>Drag a card to a new day, or focus it and press Shift + ← / →.</p></div><div className="rail-bottom"><a href="#"><Settings />Settings</a><button className="profile"><span>PS</span><div><b>Parth Shah</b><small>Content team</small></div><ChevronDown /></button></div></aside>
    <section className="workspace"><header className="topbar"><label className="search"><Search /><input aria-label="Search posts" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scheduled posts" /></label><button className="icon-button" aria-label="Notifications"><Bell /></button><button className="create-button" onClick={() => setCreateDate(iso(anchor))}><Plus />Create post</button></header>
      <div className="planner-content"><div className="page-heading"><div><p>CONTENT CALENDAR</p><h1>{title}</h1></div><div className="heading-actions"><button className="today-button" onClick={() => setAnchor(new Date(2026, 8, 16))}>Today</button><div className="stepper"><button onClick={() => shift(-1)} aria-label={`Previous ${view}`}><ChevronLeft /></button><button onClick={() => shift(1)} aria-label={`Next ${view}`}><ChevronRight /></button></div><div className="view-picker"><button className="view-button" onClick={() => setViewMenu(!viewMenu)} aria-haspopup="menu" aria-expanded={viewMenu}>{view[0].toUpperCase() + view.slice(1)} <ChevronDown /></button>{viewMenu && <div className="view-menu" role="menu">{(["day", "week", "month"] as View[]).map((item) => <button key={item} role="menuitem" className={view === item ? "selected" : ""} onClick={() => { setView(item); setViewMenu(false); }}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>}</div></div></div>
        <div className="summary-strip"><div><span className="summary-dot scheduled" /><b>{counts.Scheduled}</b><small>Scheduled</small></div><div><span className="summary-dot draft" /><b>{counts.Draft}</b><small>Drafts</small></div><div><span className="summary-dot review" /><b>{counts.Review}</b><small>Needs review</small></div><p>{range}</p></div>
        <section className={`calendar-board ${view}-view`} aria-label={`${view} content calendar`}><div className="calendar-grid">
          {visibleDays.map((date) => { const dateIso = iso(date); const dayPosts = filtered.filter((post) => post.date === dateIso).sort((a, b) => a.time.localeCompare(b.time)); return <div className={`day-column ${isSameDay(date, new Date(2026, 8, 16)) ? "today" : ""} ${!isSameMonth(date, anchor) ? "outside" : ""}`} key={dateIso} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, dateIso)}>
            <button className="day-head" onClick={() => { setAnchor(date); if (view === "month") setView("day"); }}><span>{format(date, "EEE").toUpperCase()}</span><strong>{format(date, "d")}</strong></button>
            <div className="day-body">{dayPosts.map((post) => <PostCard key={post.id} post={post} openEditor={setEditing} />)}<button className="empty-day" onClick={() => setCreateDate(dateIso)}><Plus />Add post</button></div>
          </div>; })}
        </div></section>
        {query && filtered.length === 0 && <div className="no-results"><Search /><h2>No posts found</h2><p>Try another title, channel, or status.</p></div>}
      </div>
    </section>
    {(editing || createDate) && <PostDialog key={editing?.id ?? createDate} open post={editing} defaultDate={createDate ?? editing!.date} onClose={() => { setEditing(null); setCreateDate(null); }} />}
  </main>;
}

export default function Home() { return <Provider store={calendarStore}><Planner /></Provider>; }
