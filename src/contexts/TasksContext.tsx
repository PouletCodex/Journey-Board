import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Task, Section, CalendarEvent } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TasksContextType {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  completedDays: string[];
  addTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskDone: (id: string) => void;
  reorderTasks: (section: Section, tasks: Task[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  removeCalendarEvent: (id: string) => void;
  markDayComplete: (dateKey: string) => void;
  loadTasksFromStorage: () => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

const STORAGE_KEY = "journey_task_board_v1";

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasksData, setTasksData] = useLocalStorage<Task[]>(STORAGE_KEY + "_tasks", []);
  const [calendarEventsData, setCalendarEventsData] = useLocalStorage<CalendarEvent[]>(
    STORAGE_KEY + "_events",
    []
  );
  const [completedDaysData, setCompletedDaysData] = useLocalStorage<string[]>(
    STORAGE_KEY + "_completed_days",
    []
  );

  const value: TasksContextType = useMemo(() => ({
    tasks: tasksData,
    calendarEvents: calendarEventsData,
    completedDays: completedDaysData,

    addTask: (task: Task) => {
      setTasksData((prev) => [...prev, task]);
    },

    deleteTask: (id: string) => {
      setTasksData((prev) => prev.filter((t) => t.id !== id));
    },

    updateTask: (id: string, updates: Partial<Task>) => {
      setTasksData((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },

    toggleTaskDone: (id: string) => {
      setTasksData((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    },

    reorderTasks: (section: Section, sectionTasks: Task[]) => {
      setTasksData((prev) => {
        const nonSectionTasks = prev.filter((t) => t.section !== section);
        return [...nonSectionTasks, ...sectionTasks];
      });
    },

    addCalendarEvent: (event: CalendarEvent) => {
      setCalendarEventsData((prev) => [...prev, event]);
    },

    removeCalendarEvent: (id: string) => {
      setCalendarEventsData((prev) => prev.filter((e) => e.id !== id));
    },

    markDayComplete: (dateKey: string) => {
      setCompletedDaysData((prev) =>
        prev.includes(dateKey) ? prev : [...prev, dateKey]
      );
    },

    loadTasksFromStorage: () => {
      // This is handled by useLocalStorage internally
    },
  }), [tasksData, calendarEventsData, completedDaysData]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextType {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
}
