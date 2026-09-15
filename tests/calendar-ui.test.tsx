import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { Planner, deriveCalendarData } from "@/app/page";
import { createCalendarStore, initialPosts } from "@/lib/calendar-store";

describe("optimized calendar", () => {
  it("groups filtered posts once and sorts each day by time", () => {
    const result = deriveCalendarData(initialPosts, "instagram");
    expect(result.filtered.every((post) => post.channel === "Instagram")).toBe(true);
    expect(result.postsByDay.get("2026-09-14")?.map((post) => post.time)).toEqual(["09:30"]);
    expect(result.counts).toEqual({ Scheduled: 5, Draft: 2, Review: 1 });
  });

  it("filters posts through the search interaction", async () => {
    const user = userEvent.setup();
    render(<Provider store={createCalendarStore()}><Planner /></Provider>);

    await user.type(screen.getByRole("textbox", { name: /search posts/i }), "community");
    expect(screen.getByRole("button", { name: /community spotlight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /monday momentum/i })).not.toBeInTheDocument();
  });

  it("moves a focused post one day with the keyboard", () => {
    const store = createCalendarStore();
    render(<Provider store={store}><Planner /></Provider>);
    const card = screen.getByRole("button", { name: /community spotlight/i });

    fireEvent.keyDown(card, { key: "ArrowRight", shiftKey: true });
    expect(store.getState().posts.find((post) => post.id === "p4")?.date).toBe("2026-09-17");
  });

  it("moves a post with drag and drop", () => {
    const store = createCalendarStore();
    render(<Provider store={store}><Planner /></Provider>);
    const transferred = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "none",
      setData: (type: string, value: string) => transferred.set(type, value),
      getData: (type: string) => transferred.get(type) ?? "",
    };

    fireEvent.dragStart(screen.getByRole("button", { name: /community spotlight/i }), { dataTransfer });
    fireEvent.drop(screen.getByLabelText("Thursday, September 17, 2026"), { dataTransfer });
    expect(store.getState().posts.find((post) => post.id === "p4")?.date).toBe("2026-09-17");
  });

  it("opens and updates a post through the editor", async () => {
    const user = userEvent.setup();
    const store = createCalendarStore();
    render(<Provider store={store}><Planner /></Provider>);

    await user.click(screen.getByRole("button", { name: /community spotlight/i }));
    const title = screen.getByRole("textbox", { name: "Post title" });
    await user.clear(title);
    await user.type(title, "Updated community spotlight");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(store.getState().posts.find((post) => post.id === "p4")?.title).toBe("Updated community spotlight");
  });

  it("changes from week to month view", async () => {
    const user = userEvent.setup();
    render(<Provider store={createCalendarStore()}><Planner /></Provider>);

    await user.click(screen.getByRole("button", { name: /^week$/i }));
    await user.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: "Month" }));
    expect(screen.getByRole("region", { name: /month content calendar/i })).toBeInTheDocument();
  });
});
