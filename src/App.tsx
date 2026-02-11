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
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
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
          width: "min(720px, 96vw)",
          background: "black",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
          padding: 16,
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
          <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
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

  // Save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.category?.trim()) set.add(t.category.trim());
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tasks]);

  const sections: Section[] = ["Morning", "Midday", "AfterWork"];

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

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);
    if (!activeTask || !overTask) return;

    // simple: réordonne seulement dans la même section
    if (activeTask.section !== overTask.section) return;

    const section = activeTask.section;

    const sectionTasks = tasks
      .filter((t) => t.section === section)
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));

    const oldIndex = sectionTasks.findIndex((t) => t.id === activeId);
    const newIndex = sectionTasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const moved = arrayMove(sectionTasks, oldIndex, newIndex);
    const orderMap = new Map<string, number>();
    moved.forEach((t, idx) => orderMap.set(t.id, idx));

    setTasks((prev) =>
      prev.map((t) =>
        t.section === section ? { ...t, order: orderMap.get(t.id) ?? 0 } : t
      )
    );
  }

  return (
    <div
      style={{
        padding: 18,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        color: "rgba(0,0,0,0.88)",
        background: "rgba(0,0,0,0.02)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
            border: "1px solid rgba(101, 144, 44, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Journey Task Board</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Morning / Midday / After Work — tick tasks, add comments, track progress.
              </div>
            </div>
            <div style={{ color: "rgba(0,0,0,0.65)" }}>
              <ProgressRing value={globalProgress} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "white",
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
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(0,0,0,0.92)",
                color: "white",
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
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              onClick={clearAll}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,0,0,0.25)",
                background: "white",
                cursor: "pointer",
                color: "rgb(220, 38, 38)",
                fontWeight: 700,
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 12,
            }}
          >
            {sections.map((s) => {
              const list = filteredTasks.filter((t) => t.section === s);
              const st = sectionStats[s];

              return (
                <div
                  key={s}
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 360,
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
                      <div style={{ fontSize: 16, fontWeight: 900 }}>{sectionLabel(s)}</div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>
                        {st.done}/{st.total} done • {st.pct}%
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{st.pct}%</div>
                  </div>

                  {list.length === 0 ? (
                    <div style={{ fontSize: 13, opacity: 0.6, padding: 10 }}>
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
                                border: "1px solid rgba(0,0,0,0.10)",
                                borderRadius: 16,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                background: "white",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <input
                                  type="checkbox"
                                  checked={t.done}
                                  onChange={() => toggleDone(t.id)}
                                  style={{ marginTop: 4 }}
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
                                          border: "1px solid rgba(0,0,0,0.12)",
                                          opacity: 0.85,
                                        }}
                                      >
                                        {t.category}
                                      </span>
                                    ) : null}

                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
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
                                      border: "1px solid rgba(0,0,0,0.12)",
                                      background: "white",
                                      borderRadius: 10,
                                      padding: "6px 10px",
                                      cursor: "pointer",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeTask(t.id)}
                                    style={{
                                      border: "1px solid rgba(255,0,0,0.25)",
                                      background: "white",
                                      borderRadius: 10,
                                      padding: "6px 10px",
                                      cursor: "pointer",
                                      fontWeight: 700,
                                      color: "rgb(220, 38, 38)",
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

        <Modal
          open={modalOpen}
          title={editingId ? "Edit task" : "Add task"}
          onClose={closeModal}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Title *</div>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Gym / Study / Call…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Section</div>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value as Section)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "white",
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Midday">Midday</option>
                <option value="AfterWork">After Work</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Category</div>
              <input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Sport / Study / Work"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Comment</div>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Write a quick note about this task…"
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "white",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                style={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(0,0,0,0.92)",
                  color: "white",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {editingId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </Modal>

        <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", paddingBottom: 12 }}>
          Saved locally in your browser (localStorage).
        </div>
      </div>

      <style>
        {`
          @media (max-width: 980px) {
            div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  );
}