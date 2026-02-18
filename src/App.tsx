import React, { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type Section = "Morning" | "Midday" | "AfterWork";

type Task = {
  id: string;
  title: string;
  section: Section;
  category?: string;
  done: boolean;
  comment?: string;
  createdAt: number;
  order?: number;
};

const STORAGE_KEY = "journey_task_board_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sectionLabel(s: Section) {
  return s === "AfterWork" ? "After Work" : s;
}

function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function clampStr(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function IconX() {
  return (
    <span
      aria-label="Not done"
      title="Not done"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 6,
        border: "1px solid rgba(255,0,0,0.35)",
        color: "rgb(220, 38, 38)",
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      ✕
    </span>
  );
}

function IconCheck() {
  return (
    <span
      aria-label="Done"
      title="Done"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 6,
        border: "1px solid rgba(0,128,0,0.25)",
        color: "rgb(22, 163, 74)",
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      ✓
    </span>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Global progress</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{value}%</div>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
  theme,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  theme: {
    modalBg: string;
    modalBorder: string;
    modalText: string;
    neutralBtnBg: string;
    neutralBtnBorder: string;
    neutralBtnText: string;
  };
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(180deg,#0f1115 0%,#0a0c10 100%)",
        color: "rgba(255, 255, 255, 0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(860px, 94vw)",
          background: theme.modalBg,
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          padding: 22,
            border: theme.modalBorder,
            color: theme.modalText,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.01em" }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              border: theme.neutralBtnBorder,
              background: theme.neutralBtnBg,
              borderRadius: 10,
              padding: "7px 12px",
              cursor: "pointer",
              color: theme.neutralBtnText,
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SortableTaskCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function JourneyTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [onlyIncomplete, setOnlyIncomplete] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"board" | "summary" | "settings">("board");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formSection, setFormSection] = useState<Section>("Morning");
  const [formCategory, setFormCategory] = useState("");
  const [formComment, setFormComment] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        if (Array.isArray(parsed)) setTasks(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("journey_theme_mode");
      if (saved === "dark" || saved === "light") setThemeMode(saved);
    } catch {
      // ignore
    }
  }, []);

  // Save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_theme_mode", themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);
  const danger = useMemo(() => {
    if (themeMode === "light") {
      return {
        bg: "linear-gradient(180deg, rgba(210,70,70,0.95) 0%, rgba(170,40,40,0.98) 100%)",
        border: "1px solid rgba(160,30,30,0.45)",
        text: "rgba(255,245,245,0.98)",
      } as const;
    }

    return {
      bg: "linear-gradient(180deg, rgba(90,24,24,0.9) 0%, rgba(50,14,14,0.95) 100%)",
      border: "1px solid rgba(255,90,90,0.45)",
      text: "rgba(255,225,225,0.95)",
    } as const;
  }, [themeMode]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.category?.trim()) set.add(t.category.trim());
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tasks]);

  const sections: Section[] = ["Morning", "Midday", "AfterWork"];
  const theme = useMemo(() => {
    if (themeMode === "light") {
      return {
        pageBg: "rgba(235, 236, 240, 0.85)",
        headerBg: "linear-gradient(180deg, #f2f2f2 0%, #e6e6e6 100%)",
        headerBorder: "1px solid rgba(0,0,0,0.08)",
        headerShadow: "0 10px 26px rgba(0,0,0,0.12)",
        headerText: "rgba(20,20,20,0.92)",
        headerSubtext: "rgba(20,20,20,0.6)",
        chipBg: "rgba(0,0,0,0.06)",
        chipBorder: "1px solid rgba(0,0,0,0.12)",
        chipText: "rgba(20,20,20,0.9)",
        ringColor: "rgba(0,0,0,0.65)",
        selectBg: "linear-gradient(180deg, #f0f0f0 0%, #e2e2e2 100%)",
        selectBorder: "1px solid rgba(0,0,0,0.18)",
        selectText: "rgba(20,20,20,0.9)",
        primaryBtnBg: "linear-gradient(180deg, #2d2d2d 0%, #1e1e1e 100%)",
        neutralBtnBg: "linear-gradient(180deg, #f0f0f0 0%, #e2e2e2 100%)",
        neutralBtnBorder: "1px solid rgba(0,0,0,0.18)",
        neutralBtnText: "rgba(20,20,20,0.9)",
        cardBg: "linear-gradient(180deg, rgba(245,245,245,0.98) 0%, rgba(232,232,232,0.98) 100%)",
        cardBorder: "1px solid rgba(0,0,0,0.12)",
        cardText: "rgba(20,20,20,0.92)",
        badgeBg: "rgba(0,0,0,0.06)",
        badgeBorder: "1px solid rgba(0,0,0,0.18)",
        modalBg: "linear-gradient(180deg, rgba(248,248,248,0.98) 0%, rgba(230,230,230,0.98) 100%)",
        modalBorder: "1px solid rgba(0,0,0,0.12)",
        modalText: "rgba(20,20,20,0.92)",
        inputBg: "rgba(255,255,255,0.9)",
        inputBorder: "1px solid rgba(0,0,0,0.2)",
      } as const;
    }

    return {
      pageBg: "rgba(145, 116, 117, 0.24)",
      headerBg: "linear-gradient(180deg, #1f1f1f 0%, #151515 100%)",
      headerBorder: "1px solid rgba(255,255,255,0.08)",
      headerShadow: "0 12px 28px rgba(0,0,0,0.32)",
      headerText: "rgba(255,255,255,0.92)",
      headerSubtext: "rgba(255,255,255,0.7)",
      chipBg: "rgba(255,255,255,0.06)",
      chipBorder: "1px solid rgba(255,255,255,0.12)",
      chipText: "rgba(255,255,255,0.9)",
      ringColor: "rgba(255,255,255,0.75)",
      selectBg: "linear-gradient(180deg, rgba(52,52,52,0.95) 0%, rgba(26,26,26,0.98) 100%)",
      selectBorder: "1px solid rgba(255,255,255,0.16)",
      selectText: "rgba(240,240,240,0.95)",
      primaryBtnBg: "linear-gradient(180deg, rgba(72,72,72,0.98) 0%, rgba(36,36,36,0.98) 100%)",
      neutralBtnBg: "linear-gradient(180deg, rgba(58,58,58,0.95) 0%, rgba(30,30,30,0.98) 100%)",
      neutralBtnBorder: "1px solid rgba(255,255,255,0.12)",
      neutralBtnText: "rgba(240,240,240,0.95)",
      cardBg: "linear-gradient(180deg, rgba(36,36,36,0.98) 0%, rgba(22,22,22,0.98) 100%)",
      cardBorder: "1px solid rgba(255,255,255,0.08)",
      cardText: "rgba(255,255,255,0.88)",
      badgeBg: "rgba(255,255,255,0.06)",
      badgeBorder: "1px solid rgba(255,255,255,0.12)",
      modalBg: "linear-gradient(180deg, rgba(30,30,30,0.98) 0%, rgba(18,18,18,0.98) 100%)",
      modalBorder: "1px solid rgba(255,255,255,0.08)",
      modalText: "rgba(255,255,255,0.9)",
      inputBg: "rgba(255,255,255,0.06)",
      inputBorder: "1px solid rgba(255,255,255,0.12)",
    } as const;
  }, [themeMode]);
  const sectionBackgrounds: Record<Section, string> =
    themeMode === "light"
      ? {
          Morning: "linear-gradient(160deg, #f2f2f2 0%, #dcdcdc 100%)",
          Midday: "linear-gradient(160deg, #ededed 0%, #d6d6d6 100%)",
          AfterWork: "linear-gradient(160deg, #e9e9e9 0%, #d0d0d0 100%)",
        }
      : {
          Morning: "linear-gradient(160deg, #1a1a1a 0%, #4a4a4a 100%)",
          Midday: "linear-gradient(160deg, #121212 0%, #5a5a5a 100%)",
          AfterWork: "linear-gradient(160deg, #0f0f0f 0%, #3f3f3f 100%)",
        };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => (categoryFilter === "All" ? true : t.category === categoryFilter))
      .filter((t) => (onlyIncomplete ? !t.done : true))
      .sort((a, b) => {
        const ao = a.order ?? 999999;
        const bo = b.order ?? 999999;
        if (ao !== bo) return ao - bo;
        return b.createdAt - a.createdAt;
      });
  }, [tasks, categoryFilter, onlyIncomplete]);

  const sectionStats = useMemo(() => {
    const stats: Record<Section, { done: number; total: number; pct: number }> = {
      Morning: { done: 0, total: 0, pct: 0 },
      Midday: { done: 0, total: 0, pct: 0 },
      AfterWork: { done: 0, total: 0, pct: 0 },
    };
    for (const s of sections) {
      const list = filteredTasks.filter((t) => t.section === s);
      const total = list.length;
      const done = list.filter((t) => t.done).length;
      stats[s] = { done, total, pct: pct(done, total) };
    }
    return stats;
  }, [filteredTasks]);

  const globalProgress = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.done).length;
    return pct(done, total);
  }, [filteredTasks]);

  const summaryStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek
    ).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    function buildStats(fromTs: number) {
      const list = tasks.filter((t) => t.createdAt >= fromTs);
      const total = list.length;
      const done = list.filter((t) => t.done).length;
      const notDone = total - done;
      const bySection = sections.map((s) => {
        const sectionList = list.filter((t) => t.section === s);
        const sectionTotal = sectionList.length;
        const sectionDone = sectionList.filter((t) => t.done).length;
        return { section: s, total: sectionTotal, done: sectionDone };
      });
      return { total, done, notDone, pct: pct(done, total), bySection };
    }

    return {
      day: buildStats(startOfDay),
      week: buildStats(startOfWeek),
      month: buildStats(startOfMonth),
    };
  }, [tasks, sections]);

  const streakDays = useMemo(() => {
    if (tasks.length === 0) return 0;

    const byDay = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const entry = byDay.get(key) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (t.done) entry.done += 1;
      byDay.set(key, entry);
    }

    const today = new Date();
    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    let streak = 0;
    let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (true) {
      const key = dayKey(cursor);
      const entry = byDay.get(key);
      if (!entry || entry.total === 0 || entry.done !== entry.total) break;
      streak += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }

    return streak;
  }, [tasks]);

  function openCreate() {
    setEditingId(null);
    setFormTitle("");
    setFormSection("Morning");
    setFormCategory("");
    setFormComment("");
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setFormTitle(task.title);
    setFormSection(task.section);
    setFormCategory(task.category ?? "");
    setFormComment(task.comment ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function submitForm() {
    const title = clampStr(formTitle);
    if (!title) return;

    const category = clampStr(formCategory);
    const comment = formComment.trim();

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title,
                section: formSection,
                category: category || undefined,
                comment: comment || undefined,
              }
            : t
        )
      );
    } else {
      const nextOrder =
        tasks
          .filter((x) => x.section === formSection)
          .reduce((m, x) => Math.max(m, x.order ?? -1), -1) + 1;

      const newTask: Task = {
        id: uid(),
        title,
        section: formSection,
        category: category || undefined,
        done: false,
        comment: comment || undefined,
        createdAt: Date.now(),
        order: nextOrder,
      };

      setTasks((prev) => [newTask, ...prev]);
    }

    closeModal();
  }

  function toggleDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function clearAll() {
    if (!confirm("Delete all tasks?")) return;
    setTasks([]);
  }

  function resetAllToIncomplete() {
    if (!confirm("Mark all tasks as incomplete?")) return;
    setTasks((prev) => prev.map((t) => ({ ...t, done: false })));
  }

  function resetSectionToIncomplete(section: Section) {
    if (!confirm(`Mark all ${sectionLabel(section)} tasks as incomplete?`)) return;
    setTasks((prev) =>
      prev.map((t) => (t.section === section ? { ...t, done: false } : t))
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeId);
      const overTask = prev.find((t) => t.id === overId);
      if (!activeTask || !overTask) return prev;

      const sourceSection = activeTask.section;
      const targetSection = overTask.section;

      const sourceTasks = prev
        .filter((t) => t.section === sourceSection)
        .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
      const targetTasks = prev
        .filter((t) => t.section === targetSection)
        .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));

      if (sourceSection === targetSection) {
        const oldIndex = sourceTasks.findIndex((t) => t.id === activeId);
        const newIndex = sourceTasks.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const moved = arrayMove(sourceTasks, oldIndex, newIndex);
        const orderMap = new Map<string, number>();
        moved.forEach((t, idx) => orderMap.set(t.id, idx));

        return prev.map((t) =>
          t.section === sourceSection ? { ...t, order: orderMap.get(t.id) ?? 0 } : t
        );
      }

      const sourceIndex = sourceTasks.findIndex((t) => t.id === activeId);
      const targetIndex = targetTasks.findIndex((t) => t.id === overId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const nextSource = sourceTasks.filter((t) => t.id !== activeId);
      const nextTarget = [...targetTasks];
      nextTarget.splice(targetIndex, 0, { ...activeTask, section: targetSection });

      const orderMap = new Map<string, number>();
      nextSource.forEach((t, idx) => orderMap.set(t.id, idx));
      nextTarget.forEach((t, idx) => orderMap.set(t.id, idx));

      return prev.map((t) => {
        if (t.id === activeId) {
          return {
            ...t,
            section: targetSection,
            order: orderMap.get(t.id) ?? 0,
          };
        }
        if (t.section === sourceSection || t.section === targetSection) {
          return { ...t, order: orderMap.get(t.id) ?? t.order ?? 0 };
        }
        return t;
      });
    });
  }

  return (
    <div
      style={{
        padding: "22px clamp(12px, 2.2vw, 30px)",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        color: theme.headerText,
        background: theme.pageBg,
        minHeight: "100dvh",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.08,
        }}
      >
        <div
          style={{
            fontSize: "min(78vw, 78vh)",
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.45)",
            transform: "translateY(4vh)",
            userSelect: "none",
          }}
        >
          MT
        </div>
      </div>
      <div
        style={{
          width: "100%",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: theme.headerBg,
            borderRadius: 18,
            padding: "20px 22px",
            boxShadow: theme.headerShadow,
            border: theme.headerBorder,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 18,
            color: theme.headerText,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>Journey Task Board</div>
              <div style={{ fontSize: 13, opacity: 0.7, color: theme.headerSubtext }}>
                Morning / Midday / After Work — tick tasks, add comments, track progress.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: theme.chipBg,
                  border: theme.chipBorder,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: theme.chipText }}>
                  {streakDays}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>day streak</div>
              </div>
              <div style={{ color: theme.ringColor }}>
                <ProgressRing value={globalProgress} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                gap: 6,
                padding: 4,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <button
                onClick={() => setActiveView("board")}
                style={{
                  border: theme.chipBorder,
                  background:
                    activeView === "board"
                      ? theme.primaryBtnBg
                      : "transparent",
                  color: theme.chipText,
                  borderRadius: 10,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Board
              </button>
              <button
                onClick={() => setActiveView("summary")}
                style={{
                  border: theme.chipBorder,
                  background:
                    activeView === "summary"
                      ? theme.primaryBtnBg
                      : "transparent",
                  color: theme.chipText,
                  borderRadius: 10,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveView("settings")}
                style={{
                  border: theme.chipBorder,
                  background:
                    activeView === "settings"
                      ? theme.primaryBtnBg
                      : "transparent",
                  color: theme.chipText,
                  borderRadius: 10,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Settings
              </button>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: theme.selectBorder,
                background: theme.selectBg,
                color: theme.selectText,
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={onlyIncomplete}
                onChange={(e) => setOnlyIncomplete(e.target.checked)}
              />
              Show only incomplete
            </label>

            <button
              onClick={openCreate}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: theme.chipBorder,
                background: theme.primaryBtnBg,
                color: theme.chipText,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Task
            </button>

            <button
              onClick={resetAllToIncomplete}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: theme.neutralBtnBorder,
                background: theme.neutralBtnBg,
                cursor: "pointer",
                color: theme.neutralBtnText,
              }}
            >
              Reset
            </button>

            <button
              onClick={clearAll}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: danger.border,
                background: danger.bg,
                cursor: "pointer",
                color: danger.text,
                fontWeight: 700,
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {activeView === "board" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
                alignItems: "start",
              }}
            >
              {sections.map((s) => {
                const list = filteredTasks.filter((t) => t.section === s);
                const st = sectionStats[s];

                return (
                  <div
                    key={s}
                    style={{
                      background: sectionBackgrounds[s],
                      borderRadius: 18,
                      padding: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "clamp(420px, 68dvh, 760px)",
                    }}
                  >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: themeMode === "light" ? "rgba(30,30,30,0.9)" : "rgba(255,255,255,0.95)",
                        }}
                      >
                        {sectionLabel(s)}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.85,
                          color: themeMode === "light" ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.85)",
                        }}
                      >
                        {st.done}/{st.total} done • {st.pct}%
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => resetSectionToIncomplete(s)}
                        style={{
                          border: theme.neutralBtnBorder,
                          background: theme.neutralBtnBg,
                          borderRadius: 10,
                          padding: "5px 8px",
                          cursor: "pointer",
                          fontWeight: 700,
                          color: theme.neutralBtnText,
                          fontSize: 12,
                        }}
                      >
                        Uncheck all
                      </button>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: themeMode === "light" ? "rgba(30,30,30,0.9)" : "rgba(255,255,255,0.95)",
                        }}
                      >
                        {st.pct}%
                      </div>
                    </div>
                  </div>

                    {list.length === 0 ? (
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.85,
                          padding: 10,
                          color: themeMode === "light" ? "rgba(30,30,30,0.7)" : "rgba(255,255,255,0.8)",
                        }}
                      >
                        No tasks here (with current filters).
                      </div>
                    ) : (
                      <SortableContext
                        items={list.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {list.map((t) => (
                            <SortableTaskCard key={t.id} id={t.id}>
                            <div
                              style={{
                                border: t.done
                                  ? theme.cardBorder
                                  : themeMode === "light"
                                    ? "1px solid rgba(180,60,60,0.35)"
                                    : "1px solid rgba(255,120,120,0.35)",
                                borderRadius: 16,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                background: t.done
                                  ? theme.cardBg
                                  : themeMode === "light"
                                    ? "linear-gradient(180deg, rgba(255,230,230,0.98) 0%, rgba(245,210,210,0.98) 100%)"
                                    : "linear-gradient(180deg, rgba(46,26,26,0.98) 0%, rgba(26,16,16,0.98) 100%)",
                                color: t.done
                                  ? theme.cardText
                                  : themeMode === "light"
                                    ? "rgba(60,20,20,0.9)"
                                    : theme.cardText,
                                boxShadow: t.done
                                  ? themeMode === "light"
                                    ? "0 10px 22px rgba(0,0,0,0.12)"
                                    : "0 12px 26px rgba(0,0,0,0.35)"
                                  : themeMode === "light"
                                    ? "0 12px 26px rgba(160,40,40,0.18)"
                                    : "0 14px 30px rgba(120,40,40,0.25)",
                                position: "relative",
                              }}
                            >
                              <div
                                aria-hidden="true"
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 6,
                                  borderTopLeftRadius: 16,
                                  borderBottomLeftRadius: 16,
                                  background: t.done
                                    ? "linear-gradient(180deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.4) 100%)"
                                    : themeMode === "light"
                                      ? "linear-gradient(180deg, rgba(185,28,28,0.6) 0%, rgba(127,29,29,0.5) 100%)"
                                      : "linear-gradient(180deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.6) 100%)",
                                  opacity: t.done ? 0.45 : 0.9,
                                }}
                              />
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <input
                                  type="checkbox"
                                  checked={t.done}
                                  onChange={() => toggleDone(t.id)}
                                  style={{
                                    marginTop: 4,
                                    width: 20,
                                    height: 20,
                                    accentColor: t.done ? "#22c55e" : "#ef4444",
                                    cursor: "pointer",
                                  }}
                                />

                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        textDecoration: t.done ? "line-through" : "none",
                                        opacity: t.done ? 0.65 : 1,
                                      }}
                                    >
                                      {t.title}
                                    </div>

                                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                      {t.category ? (
                                        <span
                                          style={{
                                            fontSize: 12,
                                            padding: "3px 8px",
                                            borderRadius: 999,
                                            border: theme.badgeBorder,
                                            background: theme.badgeBg,
                                            opacity: 0.9,
                                          }}
                                        >
                                          {t.category}
                                        </span>
                                      ) : null}

                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: t.done
                                          ? "rgba(34,197,94,0.12)"
                                          : themeMode === "light"
                                            ? "rgba(239,68,68,0.16)"
                                            : "rgba(239,68,68,0.14)",
                                        border: t.done
                                          ? "1px solid rgba(34,197,94,0.25)"
                                          : themeMode === "light"
                                            ? "1px solid rgba(185,28,28,0.35)"
                                            : "1px solid rgba(239,68,68,0.3)",
                                      }}
                                    >
                                      {t.done ? <IconCheck /> : <IconX />}
                                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                                        {t.done ? "Completed" : "Not done"}
                                      </span>
                                    </span>
                                    </div>

                                    {t.comment ? (
                                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                                        💬 {t.comment}
                                      </div>
                                    ) : (
                                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.5 }}>
                                        💬 No comment
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <button
                                    onClick={() => openEdit(t)}
                                    style={{
                                      border: theme.neutralBtnBorder,
                                      background: theme.neutralBtnBg,
                                      borderRadius: 10,
                                      padding: "6px 10px",
                                      cursor: "pointer",
                                      fontWeight: 700,
                                      color: theme.neutralBtnText,
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeTask(t.id)}
                                    style={{
                                      border: danger.border,
                                      background: danger.bg,
                                      borderRadius: 10,
                                      padding: "6px 10px",
                                      cursor: "pointer",
                                      fontWeight: 700,
                                      color: danger.text,
                                    }}
                                  >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </SortableTaskCard>
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </div>
                );
              })}
            </div>
          </DndContext>
        ) : activeView === "summary" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {(
              [
                { key: "day", label: "Today", data: summaryStats.day },
                { key: "week", label: "This Week", data: summaryStats.week },
                { key: "month", label: "This Month", data: summaryStats.month },
              ] as const
            ).map((p) => (
              <div
                key={p.key}
                style={{
                  background: "linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(16,16,16,0.98) 100%)",
                  borderRadius: 18,
                  padding: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
                  color: "rgba(255,255,255,0.9)",
                  minHeight: 260,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{p.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{p.data.pct}%</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Done</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{p.data.done}</div>
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Not done</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{p.data.notDone}</div>
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>By section</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.data.bySection.map((row) => (
                      <div
                        key={row.section}
                        style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                      >
                        <span>{sectionLabel(row.section)}</span>
                        <span>
                          {row.done}/{row.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: themeMode === "light"
                  ? "linear-gradient(180deg, rgba(248,248,248,0.98) 0%, rgba(236,236,236,0.98) 100%)"
                  : "linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(16,16,16,0.98) 100%)",
                borderRadius: 18,
                padding: 16,
                border: themeMode === "light"
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: themeMode === "light"
                  ? "0 12px 26px rgba(0,0,0,0.12)"
                  : "0 12px 26px rgba(0,0,0,0.35)",
                color: themeMode === "light" ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.9)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>Theme</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Choose light or dark mode for the whole app.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setThemeMode("dark")}
                  style={{
                    border: theme.chipBorder,
                    background: themeMode === "dark" ? theme.primaryBtnBg : "transparent",
                    color: theme.chipText,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Dark mode
                </button>
                <button
                  onClick={() => setThemeMode("light")}
                  style={{
                    border: theme.chipBorder,
                    background: themeMode === "light" ? theme.primaryBtnBg : "transparent",
                    color: theme.chipText,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Light mode
                </button>
              </div>
            </div>

            <div
              style={{
                background: themeMode === "light"
                  ? "linear-gradient(180deg, rgba(248,248,248,0.98) 0%, rgba(236,236,236,0.98) 100%)"
                  : "linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(16,16,16,0.98) 100%)",
                borderRadius: 18,
                padding: 16,
                border: themeMode === "light"
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: themeMode === "light"
                  ? "0 12px 26px rgba(0,0,0,0.12)"
                  : "0 12px 26px rgba(0,0,0,0.35)",
                color: themeMode === "light" ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.9)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>Preferences</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                More settings will appear here.
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Examples: notifications, reminders, weekly goals.
              </div>
            </div>
          </div>
        )}

        <Modal
          open={modalOpen}
          title={editingId ? "Edit task" : "Add task"}
          onClose={closeModal}
          theme={theme}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitForm();
            }}
            onKeyDown={(e) => {
              const target = e.target as HTMLElement;
              if (e.key === "Enter" && target.tagName !== "TEXTAREA") {
                e.preventDefault();
                submitForm();
              }
              if (e.key === "Enter" && target.tagName === "TEXTAREA" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitForm();
              }
            }}
            style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Title *</div>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Gym / Study / Call…"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: theme.inputBorder,
                  background: theme.inputBg,
                  color: theme.modalText,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Section</div>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value as Section)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: theme.inputBorder,
                  background: theme.inputBg,
                  color: theme.modalText,
                  boxSizing: "border-box",
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Midday">Midday</option>
                <option value="AfterWork">After Work</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Category</div>
              <input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Sport / Study / Work"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: theme.inputBorder,
                  background: theme.inputBg,
                  color: theme.modalText,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Comment</div>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Write a quick note about this task…"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: theme.inputBorder,
                  background: theme.inputBg,
                  color: theme.modalText,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  border: theme.neutralBtnBorder,
                  background: theme.neutralBtnBg,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  color: theme.neutralBtnText,
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  border: theme.chipBorder,
                  background: theme.primaryBtnBg,
                  color: theme.chipText,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 800,
                  
                }}
              >
                {editingId ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </Modal>

        <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", paddingBottom: 12 }}>
          Saved locally in your browser (localStorage).
        </div>
      </div>

      <style>
        {`
          @media (max-width: 1300px) {
            div[style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 860px) {
            div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  );
}
