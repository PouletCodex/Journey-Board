import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type Section = "Morning" | "Midday" | "AfterWork";
type Language = "en" | "fr" | "es" | "pt" | "de" | "it";
const SECTIONS: Section[] = ["Morning", "Midday", "AfterWork"];

type ThemeName = "Dark Glass" | "Dark Matte" | "Light";
type ThemeTokens = {
  bg: string;
  panel: string;
  column: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  blur: string;
};

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

const THEMES: Record<ThemeName, ThemeTokens> = {
  "Dark Glass": {
    bg: "linear-gradient(160deg, #0c0f14 0%, #0a0c10 50%, #11151d 100%)",
    panel: "rgba(18, 22, 28, 0.72)",
    column: "rgba(18, 22, 28, 0.58)",
    card: "rgba(20, 24, 30, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    text: "rgba(245,245,245,0.95)",
    muted: "rgba(245,245,245,0.6)",
    blur: "blur(14px)",
  },
  "Dark Matte": {
    bg: "linear-gradient(160deg, #0f1116 0%, #0b0d12 100%)",
    panel: "#14171d",
    column: "#161a21",
    card: "#1a1f27",
    border: "1px solid rgba(255,255,255,0.06)",
    text: "rgba(245,245,245,0.95)",
    muted: "rgba(245,245,245,0.6)",
    blur: "none",
  },
  Light: {
    bg: "linear-gradient(160deg, #f3f4f7 0%, #e6e8ee 100%)",
    panel: "rgba(255,255,255,0.8)",
    column: "rgba(250,250,252,0.9)",
    card: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.08)",
    text: "rgba(20,20,20,0.92)",
    muted: "rgba(20,20,20,0.6)",
    blur: "none",
  },
};

type CalendarEvent = {
  id: string;
  dateKey: string;
  time: string;
  title: string;
  createdAt: number;
};

const STORAGE_KEY = "journey_task_board_v1";
const LANGUAGE_STORAGE_KEY = "journey_language_v1";
const ALL_CATEGORIES = "__all__";

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "es", label: "Espanol" },
  { value: "pt", label: "Portugues" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

const LOCALES: Record<Language, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  de: "de-DE",
  it: "it-IT",
};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    appTitle: "Journey Task Board",
    board: "Board",
    summary: "Summary",
    calendar: "Calendar",
    settings: "Settings",
    subtitle: "Morning / Midday / After Work - tick tasks, add comments, track progress.",
    points: "points",
    dayStreak: "day streak",
    openMenu: "Open menu",
    addTask: "+ Add Task",
    saveDay: "Save Day",
    theme: "Theme",
    language: "Language",
    menu: "Menu",
    close: "Close",
    filters: "Filters",
    all: "All",
    showOnlyIncomplete: "Show only incomplete",
    actions: "Actions",
    resetAll: "Reset all",
    clearAll: "Clear all",
    completed: "Completed",
    notDone: "Not done",
    noComment: "No comment",
    edit: "Edit",
    delete: "Delete",
    doneStatus: "Done",
    notDoneStatus: "Not done",
    sectionMorning: "Morning",
    sectionMidday: "Midday",
    sectionAfterWork: "After Work",
    tasksDone: "done",
    uncheckAll: "Uncheck all",
    noTasksFiltered: "No tasks here (with current filters).",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    done: "Done",
    bySection: "By section",
    daysCompleted: "Days completed",
    preferences: "Preferences",
    themeDescription: "Choose light or dark mode for the whole app.",
    pointsSystemInfo: "The app now includes a point system on top of streak tracking.",
    completedTask: "Completed task",
    commentBonus: "Comment bonus",
    savedDay: "Saved day",
    streakBonus: "Streak bonus",
    cappedAtDays: "capped at",
    days: "days",
    totalScore: "Total score",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Plan events and track streaks",
    prev: "Prev",
    next: "Next",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
    editTask: "Edit task",
    addTaskModal: "Add task",
    titleField: "Title *",
    titlePlaceholder: "e.g. Gym / Study / Call...",
    sectionField: "Section",
    categoryField: "Category",
    categoryPlaceholder: "e.g. Sport / Study / Work",
    commentField: "Comment",
    commentPlaceholder: "Write a quick note about this task...",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    newEvent: "New event",
    eventTitle: "Event title",
    addEvent: "Add event",
    events: "Events",
    noEventsForDay: "No events for this day.",
    savedLocally: "Saved locally in your browser (localStorage).",
    clickToRename: "Click to rename",
    markAllDoneConfirm: "Not all tasks are done. Mark all as done and save the day?",
    deleteAllConfirm: "Delete all tasks?",
    resetAllConfirm: "Mark all tasks as incomplete?",
    resetSectionConfirm: "Mark all {section} tasks as incomplete?",
  },
  fr: {
    appTitle: "Tableau de taches",
    board: "Tableau",
    summary: "Resume",
    calendar: "Calendrier",
    settings: "Parametres",
    subtitle: "Matin / Midi / Apres le travail - coche les taches, ajoute des commentaires, suis ta progression.",
    points: "points",
    dayStreak: "jours de serie",
    openMenu: "Ouvrir le menu",
    addTask: "+ Ajouter une tache",
    saveDay: "Sauvegarder la journee",
    theme: "Theme",
    language: "Langue",
    menu: "Menu",
    close: "Fermer",
    filters: "Filtres",
    all: "Tout",
    showOnlyIncomplete: "Afficher seulement les taches non terminees",
    actions: "Actions",
    resetAll: "Tout reinitialiser",
    clearAll: "Tout supprimer",
    completed: "Terminee",
    notDone: "Non terminee",
    noComment: "Pas de commentaire",
    edit: "Modifier",
    delete: "Supprimer",
    doneStatus: "Terminee",
    notDoneStatus: "Non terminee",
    sectionMorning: "Matin",
    sectionMidday: "Midi",
    sectionAfterWork: "Apres le travail",
    tasksDone: "faites",
    uncheckAll: "Tout decocher",
    noTasksFiltered: "Aucune tache ici avec les filtres actuels.",
    today: "Aujourd'hui",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois-ci",
    done: "Faites",
    bySection: "Par section",
    daysCompleted: "Jours valides",
    preferences: "Preferences",
    themeDescription: "Choisis le mode clair ou sombre pour toute l'application.",
    pointsSystemInfo: "L'application inclut maintenant un systeme de points en plus du streak.",
    completedTask: "Tache terminee",
    commentBonus: "Bonus commentaire",
    savedDay: "Journee sauvegardee",
    streakBonus: "Bonus de serie",
    cappedAtDays: "plafonne a",
    days: "jours",
    totalScore: "Score total",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Planifie des evenements et suis tes series",
    prev: "Prec.",
    next: "Suiv.",
    mon: "Lun",
    tue: "Mar",
    wed: "Mer",
    thu: "Jeu",
    fri: "Ven",
    sat: "Sam",
    sun: "Dim",
    editTask: "Modifier la tache",
    addTaskModal: "Ajouter une tache",
    titleField: "Titre *",
    titlePlaceholder: "ex. Sport / Etude / Appel...",
    sectionField: "Section",
    categoryField: "Categorie",
    categoryPlaceholder: "ex. Sport / Etude / Travail",
    commentField: "Commentaire",
    commentPlaceholder: "Ecris une note rapide sur cette tache...",
    cancel: "Annuler",
    save: "Enregistrer",
    create: "Creer",
    newEvent: "Nouvel evenement",
    eventTitle: "Titre de l'evenement",
    addEvent: "Ajouter l'evenement",
    events: "Evenements",
    noEventsForDay: "Aucun evenement pour cette journee.",
    savedLocally: "Sauvegarde locale dans ton navigateur (localStorage).",
    clickToRename: "Clique pour renommer",
    markAllDoneConfirm: "Toutes les taches ne sont pas terminees. Les marquer comme faites et sauvegarder la journee ?",
    deleteAllConfirm: "Supprimer toutes les taches ?",
    resetAllConfirm: "Marquer toutes les taches comme non terminees ?",
    resetSectionConfirm: "Marquer toutes les taches de {section} comme non terminees ?",
  },
  es: {
    appTitle: "Tablero de tareas",
    board: "Tablero",
    summary: "Resumen",
    calendar: "Calendario",
    settings: "Ajustes",
    subtitle: "Manana / Mediodia / Despues del trabajo - marca tareas, agrega comentarios y sigue tu progreso.",
    points: "puntos",
    dayStreak: "dias seguidos",
    openMenu: "Abrir menu",
    addTask: "+ Agregar tarea",
    saveDay: "Guardar dia",
    theme: "Tema",
    language: "Idioma",
    menu: "Menu",
    close: "Cerrar",
    filters: "Filtros",
    all: "Todo",
    showOnlyIncomplete: "Mostrar solo incompletas",
    actions: "Acciones",
    resetAll: "Reiniciar todo",
    clearAll: "Borrar todo",
    completed: "Completada",
    notDone: "Sin completar",
    noComment: "Sin comentario",
    edit: "Editar",
    delete: "Eliminar",
    doneStatus: "Hecha",
    notDoneStatus: "Sin hacer",
    sectionMorning: "Manana",
    sectionMidday: "Mediodia",
    sectionAfterWork: "Despues del trabajo",
    tasksDone: "hechas",
    uncheckAll: "Desmarcar todo",
    noTasksFiltered: "No hay tareas aqui con los filtros actuales.",
    today: "Hoy",
    thisWeek: "Esta semana",
    thisMonth: "Este mes",
    done: "Hechas",
    bySection: "Por seccion",
    daysCompleted: "Dias completados",
    preferences: "Preferencias",
    themeDescription: "Elige modo claro u oscuro para toda la app.",
    pointsSystemInfo: "La app ahora incluye un sistema de puntos ademas de la racha.",
    completedTask: "Tarea completada",
    commentBonus: "Bonus por comentario",
    savedDay: "Dia guardado",
    streakBonus: "Bonus de racha",
    cappedAtDays: "limitado a",
    days: "dias",
    totalScore: "Puntuacion total",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Planifica eventos y sigue tus rachas",
    prev: "Ant.",
    next: "Sig.",
    mon: "Lun",
    tue: "Mar",
    wed: "Mie",
    thu: "Jue",
    fri: "Vie",
    sat: "Sab",
    sun: "Dom",
    editTask: "Editar tarea",
    addTaskModal: "Agregar tarea",
    titleField: "Titulo *",
    titlePlaceholder: "ej. Gym / Estudio / Llamada...",
    sectionField: "Seccion",
    categoryField: "Categoria",
    categoryPlaceholder: "ej. Deporte / Estudio / Trabajo",
    commentField: "Comentario",
    commentPlaceholder: "Escribe una nota rapida sobre esta tarea...",
    cancel: "Cancelar",
    save: "Guardar",
    create: "Crear",
    newEvent: "Nuevo evento",
    eventTitle: "Titulo del evento",
    addEvent: "Agregar evento",
    events: "Eventos",
    noEventsForDay: "No hay eventos para este dia.",
    savedLocally: "Guardado localmente en tu navegador (localStorage).",
    clickToRename: "Haz clic para renombrar",
    markAllDoneConfirm: "No todas las tareas estan hechas. Marcarlas todas como hechas y guardar el dia?",
    deleteAllConfirm: "Eliminar todas las tareas?",
    resetAllConfirm: "Marcar todas las tareas como incompletas?",
    resetSectionConfirm: "Marcar todas las tareas de {section} como incompletas?",
  },
  pt: {
    appTitle: "Quadro de tarefas",
    board: "Quadro",
    summary: "Resumo",
    calendar: "Calendario",
    settings: "Definicoes",
    subtitle: "Manha / Meio-dia / Depois do trabalho - marca tarefas, adiciona comentarios e acompanha o progresso.",
    points: "pontos",
    dayStreak: "dias seguidos",
    openMenu: "Abrir menu",
    addTask: "+ Adicionar tarefa",
    saveDay: "Guardar dia",
    theme: "Tema",
    language: "Idioma",
    menu: "Menu",
    close: "Fechar",
    filters: "Filtros",
    all: "Tudo",
    showOnlyIncomplete: "Mostrar apenas incompletas",
    actions: "Acoes",
    resetAll: "Repor tudo",
    clearAll: "Apagar tudo",
    completed: "Concluida",
    notDone: "Por fazer",
    noComment: "Sem comentario",
    edit: "Editar",
    delete: "Eliminar",
    doneStatus: "Feita",
    notDoneStatus: "Por fazer",
    sectionMorning: "Manha",
    sectionMidday: "Meio-dia",
    sectionAfterWork: "Depois do trabalho",
    tasksDone: "feitas",
    uncheckAll: "Desmarcar tudo",
    noTasksFiltered: "Nao ha tarefas aqui com os filtros atuais.",
    today: "Hoje",
    thisWeek: "Esta semana",
    thisMonth: "Este mes",
    done: "Feitas",
    bySection: "Por secao",
    daysCompleted: "Dias concluidos",
    preferences: "Preferencias",
    themeDescription: "Escolhe o modo claro ou escuro para toda a app.",
    pointsSystemInfo: "A app inclui agora um sistema de pontos alem do streak.",
    completedTask: "Tarefa concluida",
    commentBonus: "Bonus de comentario",
    savedDay: "Dia guardado",
    streakBonus: "Bonus de streak",
    cappedAtDays: "limitado a",
    days: "dias",
    totalScore: "Pontuacao total",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Planeia eventos e acompanha streaks",
    prev: "Ant.",
    next: "Seg.",
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sab",
    sun: "Dom",
    editTask: "Editar tarefa",
    addTaskModal: "Adicionar tarefa",
    titleField: "Titulo *",
    titlePlaceholder: "ex. Ginasio / Estudo / Chamada...",
    sectionField: "Secao",
    categoryField: "Categoria",
    categoryPlaceholder: "ex. Desporto / Estudo / Trabalho",
    commentField: "Comentario",
    commentPlaceholder: "Escreve uma nota rapida sobre esta tarefa...",
    cancel: "Cancelar",
    save: "Guardar",
    create: "Criar",
    newEvent: "Novo evento",
    eventTitle: "Titulo do evento",
    addEvent: "Adicionar evento",
    events: "Eventos",
    noEventsForDay: "Sem eventos para este dia.",
    savedLocally: "Guardado localmente no teu navegador (localStorage).",
    clickToRename: "Clica para renomear",
    markAllDoneConfirm: "Nem todas as tarefas estao feitas. Marcar tudo como feito e guardar o dia?",
    deleteAllConfirm: "Apagar todas as tarefas?",
    resetAllConfirm: "Marcar todas as tarefas como incompletas?",
    resetSectionConfirm: "Marcar todas as tarefas de {section} como incompletas?",
  },
  de: {
    appTitle: "Aufgabenboard",
    board: "Board",
    summary: "Ubersicht",
    calendar: "Kalender",
    settings: "Einstellungen",
    subtitle: "Morgen / Mittag / Nach der Arbeit - hake Aufgaben ab, fuege Kommentare hinzu und verfolge deinen Fortschritt.",
    points: "Punkte",
    dayStreak: "Tage Serie",
    openMenu: "Menue oeffnen",
    addTask: "+ Aufgabe hinzufugen",
    saveDay: "Tag speichern",
    theme: "Thema",
    language: "Sprache",
    menu: "Menue",
    close: "Schliessen",
    filters: "Filter",
    all: "Alle",
    showOnlyIncomplete: "Nur unvollstaendige anzeigen",
    actions: "Aktionen",
    resetAll: "Alles zuruecksetzen",
    clearAll: "Alles loeschen",
    completed: "Erledigt",
    notDone: "Nicht erledigt",
    noComment: "Kein Kommentar",
    edit: "Bearbeiten",
    delete: "Loeschen",
    doneStatus: "Erledigt",
    notDoneStatus: "Nicht erledigt",
    sectionMorning: "Morgen",
    sectionMidday: "Mittag",
    sectionAfterWork: "Nach der Arbeit",
    tasksDone: "erledigt",
    uncheckAll: "Alle abwaehlen",
    noTasksFiltered: "Keine Aufgaben hier mit den aktuellen Filtern.",
    today: "Heute",
    thisWeek: "Diese Woche",
    thisMonth: "Dieser Monat",
    done: "Erledigt",
    bySection: "Nach Bereich",
    daysCompleted: "Abgeschlossene Tage",
    preferences: "Einstellungen",
    themeDescription: "Waehle hellen oder dunklen Modus fuer die ganze App.",
    pointsSystemInfo: "Die App hat jetzt ein Punktesystem zusaetzlich zur Serie.",
    completedTask: "Erledigte Aufgabe",
    commentBonus: "Kommentarbonus",
    savedDay: "Gespeicherter Tag",
    streakBonus: "Serienbonus",
    cappedAtDays: "begrenzt auf",
    days: "Tage",
    totalScore: "Gesamtpunktzahl",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Plane Ereignisse und verfolge Serien",
    prev: "Zurueck",
    next: "Weiter",
    mon: "Mo",
    tue: "Di",
    wed: "Mi",
    thu: "Do",
    fri: "Fr",
    sat: "Sa",
    sun: "So",
    editTask: "Aufgabe bearbeiten",
    addTaskModal: "Aufgabe hinzufugen",
    titleField: "Titel *",
    titlePlaceholder: "z. B. Fitness / Lernen / Anruf...",
    sectionField: "Bereich",
    categoryField: "Kategorie",
    categoryPlaceholder: "z. B. Sport / Lernen / Arbeit",
    commentField: "Kommentar",
    commentPlaceholder: "Schreibe eine kurze Notiz zu dieser Aufgabe...",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Erstellen",
    newEvent: "Neues Ereignis",
    eventTitle: "Ereignistitel",
    addEvent: "Ereignis hinzufugen",
    events: "Ereignisse",
    noEventsForDay: "Keine Ereignisse fuer diesen Tag.",
    savedLocally: "Lokal im Browser gespeichert (localStorage).",
    clickToRename: "Klicken zum Umbenennen",
    markAllDoneConfirm: "Nicht alle Aufgaben sind erledigt. Alle als erledigt markieren und den Tag speichern?",
    deleteAllConfirm: "Alle Aufgaben loeschen?",
    resetAllConfirm: "Alle Aufgaben als unvollstaendig markieren?",
    resetSectionConfirm: "Alle Aufgaben im Bereich {section} als unvollstaendig markieren?",
  },
  it: {
    appTitle: "Bacheca attivita",
    board: "Bacheca",
    summary: "Riepilogo",
    calendar: "Calendario",
    settings: "Impostazioni",
    subtitle: "Mattina / Mezzogiorno / Dopo il lavoro - spunta le attivita, aggiungi commenti e monitora i progressi.",
    points: "punti",
    dayStreak: "giorni di streak",
    openMenu: "Apri menu",
    addTask: "+ Aggiungi task",
    saveDay: "Salva giornata",
    theme: "Tema",
    language: "Lingua",
    menu: "Menu",
    close: "Chiudi",
    filters: "Filtri",
    all: "Tutto",
    showOnlyIncomplete: "Mostra solo incomplete",
    actions: "Azioni",
    resetAll: "Resetta tutto",
    clearAll: "Cancella tutto",
    completed: "Completata",
    notDone: "Non completata",
    noComment: "Nessun commento",
    edit: "Modifica",
    delete: "Elimina",
    doneStatus: "Fatta",
    notDoneStatus: "Non fatta",
    sectionMorning: "Mattina",
    sectionMidday: "Mezzogiorno",
    sectionAfterWork: "Dopo il lavoro",
    tasksDone: "fatte",
    uncheckAll: "Deseleziona tutto",
    noTasksFiltered: "Nessuna attivita qui con i filtri attuali.",
    today: "Oggi",
    thisWeek: "Questa settimana",
    thisMonth: "Questo mese",
    done: "Fatte",
    bySection: "Per sezione",
    daysCompleted: "Giorni completati",
    preferences: "Preferenze",
    themeDescription: "Scegli la modalita chiara o scura per tutta l'app.",
    pointsSystemInfo: "L'app ora include un sistema di punti oltre allo streak.",
    completedTask: "Task completata",
    commentBonus: "Bonus commento",
    savedDay: "Giornata salvata",
    streakBonus: "Bonus streak",
    cappedAtDays: "limitato a",
    days: "giorni",
    totalScore: "Punteggio totale",
    plus: "+",
    equals: "=",
    calendarSubtitle: "Pianifica eventi e traccia gli streak",
    prev: "Prec.",
    next: "Succ.",
    mon: "Lun",
    tue: "Mar",
    wed: "Mer",
    thu: "Gio",
    fri: "Ven",
    sat: "Sab",
    sun: "Dom",
    editTask: "Modifica task",
    addTaskModal: "Aggiungi task",
    titleField: "Titolo *",
    titlePlaceholder: "es. Palestra / Studio / Chiamata...",
    sectionField: "Sezione",
    categoryField: "Categoria",
    categoryPlaceholder: "es. Sport / Studio / Lavoro",
    commentField: "Commento",
    commentPlaceholder: "Scrivi una nota rapida su questa task...",
    cancel: "Annulla",
    save: "Salva",
    create: "Crea",
    newEvent: "Nuovo evento",
    eventTitle: "Titolo evento",
    addEvent: "Aggiungi evento",
    events: "Eventi",
    noEventsForDay: "Nessun evento per questo giorno.",
    savedLocally: "Salvato localmente nel browser (localStorage).",
    clickToRename: "Clicca per rinominare",
    markAllDoneConfirm: "Non tutti i task sono completati. Segnare tutto come fatto e salvare la giornata?",
    deleteAllConfirm: "Eliminare tutti i task?",
    resetAllConfirm: "Segnare tutti i task come incompleti?",
    resetSectionConfirm: "Segnare tutti i task di {section} come incompleti?",
  },
};

function readStoredValue<T>(key: string, fallback: T, validate?: (value: unknown) => value is T) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function readStoredString(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function clampStr(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

const POINTS = {
  taskDone: 10,
  commentedTaskBonus: 5,
  completedDay: 30,
  streakPerDay: 3,
  streakCap: 7,
} as const;

function taskPoints(task: Task) {
  if (!task.done) return 0;
  return POINTS.taskDone + (task.comment?.trim() ? POINTS.commentedTaskBonus : 0);
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

function ProgressRing({
  value,
  trackColor,
}: {
  value: number;
  trackColor: string;
}) {
  const hue = Math.round(8 + (Math.max(0, Math.min(100, value)) / 100) * 120);
  const progColor = `hsl(${hue} 75% 55%)`;
  const r = 45;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="124" height="124" viewBox="0 0 124 124">
        <circle
          cx="62"
          cy="62"
          r={r}
          stroke={trackColor}
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="62"
          cy="62"
          r={r}
          stroke={progColor}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 62 62)"
        />
        <text
          x="62"
          y="66"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill={progColor}
        >
          {value}
        </text>
      </svg>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
  theme,
  closeLabel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  theme: ThemeTokens;
  closeLabel: string;
}) {
  if (!open) return null;
  const T = theme;
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
          background: T.panel,
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          padding: 22,
          border: T.border,
          color: T.text,
          boxSizing: "border-box",
          backdropFilter: T.blur,
          WebkitBackdropFilter: T.blur,
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
              border: T.border,
              background: T.panel,
              borderRadius: 10,
              padding: "7px 12px",
              cursor: "pointer",
              color: T.text,
              fontWeight: 700,
              backdropFilter: T.blur,
              WebkitBackdropFilter: T.blur,
            }}
          >
            {closeLabel}
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

function SectionDropZone({
  id,
  isLight,
  children,
}: {
  id: string;
  isLight: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative",
        borderRadius: 18,
        ...(isOver
          ? {
              boxShadow: isLight
                ? "0 0 0 2px rgba(0,0,0,0.18), 0 12px 30px rgba(0,0,0,0.18)"
                : "0 0 0 2px rgba(255,255,255,0.18), 0 12px 30px rgba(0,0,0,0.35)",
              border: isLight
                ? "1px dashed rgba(0,0,0,0.25)"
                : "1px dashed rgba(255,255,255,0.25)",
              background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
            }
          : {}),
      }}
    >
      {children}
    </div>
  );
}

export default function JourneyTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    readStoredValue<Task[]>(STORAGE_KEY, [], Array.isArray)
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [onlyIncomplete, setOnlyIncomplete] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"board" | "summary" | "settings" | "calendar">("board");
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = readStoredString("journey_theme", "Dark Glass");
    return saved in THEMES ? (saved as ThemeName) : "Dark Glass";
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = readStoredString(LANGUAGE_STORAGE_KEY, "fr");
    return saved in TRANSLATIONS ? (saved as Language) : "fr";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedDays, setCompletedDays] = useState<string[]>(() =>
    readStoredValue<string[]>("journey_completed_days", [], Array.isArray)
  );
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() =>
    readStoredValue<CalendarEvent[]>("journey_calendar_events", [], Array.isArray)
  );
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [headerTitle, setHeaderTitle] = useState(() =>
    readStoredString("journey_header_title", "Journey Task Board")
  );
  const [editingHeader, setEditingHeader] = useState(false);
  const headerTitleRef = useRef<HTMLSpanElement | null>(null);
  const [sectionTitles, setSectionTitles] = useState<Record<Section, string>>(() => {
    const fallback: Record<Section, string> = {
      Morning: "Morning",
      Midday: "Midday",
      AfterWork: "After Work",
    };
    const parsed = readStoredValue<Partial<Record<Section, string>>>(
      "journey_section_titles",
      {},
      (value): value is Partial<Record<Section, string>> =>
        typeof value === "object" && value !== null
    );
    return {
      Morning: parsed.Morning ?? fallback.Morning,
      Midday: parsed.Midday ?? fallback.Midday,
      AfterWork: parsed.AfterWork ?? fallback.AfterWork,
    };
  });
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formSection, setFormSection] = useState<Section>("Morning");
  const [formCategory, setFormCategory] = useState("");
  const [formComment, setFormComment] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Save
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_theme", themeName);
    } catch {
      // ignore
    }
  }, [themeName]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_completed_days", JSON.stringify(completedDays));
    } catch {
      // ignore
    }
  }, [completedDays]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_calendar_events", JSON.stringify(calendarEvents));
    } catch {
      // ignore
    }
  }, [calendarEvents]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_header_title", headerTitle);
    } catch {
      // ignore
    }
  }, [headerTitle]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_section_titles", JSON.stringify(sectionTitles));
    } catch {
      // ignore
    }
  }, [sectionTitles]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.category?.trim()) set.add(t.category.trim());
    return [
      { value: ALL_CATEGORIES, label: TRANSLATIONS[language].all },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({ value: category, label: category })),
    ];
  }, [tasks, language]);
  const T = THEMES[themeName];
  const locale = LOCALES[language];
  const t = (key: string) => TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key;
  const sectionName = (s: Section) =>
    s === "Morning" ? t("sectionMorning") : s === "Midday" ? t("sectionMidday") : t("sectionAfterWork");
  const displayHeaderTitle =
    headerTitle === "Journey Task Board" ? t("appTitle") : headerTitle;
  const displaySectionTitle = (section: Section) => {
    const value = sectionTitles[section];
    if (section === "Morning" && value === "Morning") return t("sectionMorning");
    if (section === "Midday" && value === "Midday") return t("sectionMidday");
    if (section === "AfterWork" && value === "After Work") return t("sectionAfterWork");
    return value;
  };

  const isLight = themeName === "Light";
  const danger = isLight
    ? {
        bg: "linear-gradient(180deg, rgba(210,70,70,0.95) 0%, rgba(170,40,40,0.98) 100%)",
        border: "1px solid rgba(160,30,30,0.45)",
        text: "rgba(255,245,245,0.98)",
      }
    : {
        bg: "linear-gradient(180deg, rgba(90,24,24,0.9) 0%, rgba(50,14,14,0.95) 100%)",
        border: "1px solid rgba(255,90,90,0.45)",
        text: "rgba(255,225,225,0.95)",
      };

  const renderTaskCard = (task: Task, isOverlay = false) => (
    <div
      style={{
        border: task.done
          ? T.border
          : isLight
            ? "1px solid rgba(180,60,60,0.35)"
            : "1px solid rgba(255,120,120,0.35)",
        borderRadius: 16,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: task.done
          ? T.card
          : isLight
            ? "linear-gradient(180deg, rgba(255,230,230,0.98) 0%, rgba(245,210,210,0.98) 100%)"
            : "linear-gradient(180deg, rgba(46,26,26,0.98) 0%, rgba(26,16,16,0.98) 100%)",
        color: task.done
          ? T.text
          : isLight
            ? "rgba(60,20,20,0.9)"
            : T.text,
        boxShadow: isOverlay
          ? "0 24px 60px rgba(0,0,0,0.45)"
          : task.done
            ? isLight
              ? "0 10px 22px rgba(0,0,0,0.12)"
              : "0 12px 26px rgba(0,0,0,0.35)"
            : isLight
              ? "0 12px 26px rgba(160,40,40,0.18)"
              : "0 14px 30px rgba(120,40,40,0.25)",
        position: "relative",
        backdropFilter: T.blur,
        WebkitBackdropFilter: T.blur,
        transform: isOverlay ? "scale(1.02)" : "none",
        transition: "transform 120ms ease",
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
          background: task.done
            ? "linear-gradient(180deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.4) 100%)"
            : isLight
              ? "linear-gradient(180deg, rgba(185,28,28,0.6) 0%, rgba(127,29,29,0.5) 100%)"
              : "linear-gradient(180deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.6) 100%)",
          opacity: task.done ? 0.45 : 0.9,
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleDone(task.id)}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 4,
            width: 20,
            height: 20,
            accentColor: task.done ? "#22c55e" : "#ef4444",
            cursor: "pointer",
          }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              textDecoration: task.done ? "line-through" : "none",
              opacity: task.done ? 0.65 : 1,
            }}
          >
            {task.title}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {task.category ? (
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: T.border,
                  background: T.panel,
                  opacity: 0.9,
                }}
              >
                {task.category}
              </span>
            ) : null}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 8px",
                borderRadius: 999,
                background: task.done
                  ? "rgba(34,197,94,0.12)"
                  : isLight
                    ? "rgba(239,68,68,0.16)"
                    : "rgba(239,68,68,0.14)",
                border: task.done
                  ? "1px solid rgba(34,197,94,0.25)"
                  : isLight
                    ? "1px solid rgba(185,28,28,0.35)"
                    : "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {task.done ? <IconCheck /> : <IconX />}
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                {task.done ? t("completed") : t("notDone")}
              </span>
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 8px",
                borderRadius: 999,
                background: task.done
                  ? "rgba(250,204,21,0.16)"
                  : isLight
                    ? "rgba(0,0,0,0.06)"
                    : "rgba(255,255,255,0.06)",
                border: task.done ? "1px solid rgba(234,179,8,0.32)" : T.border,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              +{taskPoints(task)} pts
            </span>
          </div>

          {task.comment ? (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              💬 {task.comment}
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.5 }}>
              💬 {t("noComment")}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => openEdit(task)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              border: T.border,
              background: T.panel,
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 700,
              color: T.text,
            }}
          >
            {t("edit")}
          </button>
          <button
            onClick={() => removeTask(task.id)}
            onPointerDown={(e) => e.stopPropagation()}
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
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => (categoryFilter === ALL_CATEGORIES ? true : task.category === categoryFilter))
      .filter((task) => (onlyIncomplete ? !task.done : true))
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
    for (const s of SECTIONS) {
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
    const completedSet = new Set(completedDays);

    function buildStats(fromTs: number) {
      const list = tasks.filter((t) => t.createdAt >= fromTs);
      const total = list.length;
      const done = list.filter((t) => t.done).length;
      const notDone = total - done;
      const daysCompleted = Array.from(completedSet).filter((key) => {
        const [y, m, d] = key.split("-").map((v) => Number(v));
        const ts = new Date(y, m, d).getTime();
        return ts >= fromTs;
      }).length;
      const bySection = SECTIONS.map((s) => {
        const sectionList = list.filter((t) => t.section === s);
        const sectionTotal = sectionList.length;
        const sectionDone = sectionList.filter((t) => t.done).length;
        return { section: s, total: sectionTotal, done: sectionDone };
      });
      return { total, done, notDone, pct: pct(done, total), bySection, daysCompleted };
    }

    return {
      day: buildStats(startOfDay),
      week: buildStats(startOfWeek),
      month: buildStats(startOfMonth),
    };
  }, [tasks, completedDays]);

  const streakDays = useMemo(() => {
    if (completedDays.length === 0) return 0;

    const completedSet = new Set(completedDays);
    const today = new Date();
    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    let streak = 0;
    let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (true) {
      const key = dayKey(cursor);
      if (!completedSet.has(key)) break;
      streak += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }

    return streak;
  }, [completedDays]);

  const scoreStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek
    ).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    function scoreForPeriod(fromTs: number) {
      const taskScore = tasks
        .filter((t) => t.createdAt >= fromTs)
        .reduce((sum, task) => sum + taskPoints(task), 0);

      const dayScore = completedDays.reduce((sum, key) => {
        const [y, m, d] = key.split("-").map(Number);
        const ts = new Date(y, m, d).getTime();
        return ts >= fromTs ? sum + POINTS.completedDay : sum;
      }, 0);

      return taskScore + dayScore;
    }

    const baseTotal = scoreForPeriod(0);
    const streakBonus = Math.min(streakDays, POINTS.streakCap) * POINTS.streakPerDay;

    return {
      today: scoreForPeriod(startOfDay),
      week: scoreForPeriod(startOfWeek),
      month: scoreForPeriod(startOfMonth),
      total: baseTotal,
      streakBonus,
      grandTotal: baseTotal + streakBonus,
    };
  }, [tasks, completedDays, streakDays]);

  const calendarData = useMemo(() => {
    const base = new Date();
    const view = new Date(base.getFullYear(), base.getMonth() + calendarOffset, 1);
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ day: null, key: `e-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ day: d, key: `d-${d}` });
    }

    const completedSet = new Set(completedDays);
    const isCompleted = (day: number) =>
      completedSet.has(`${year}-${month}-${day}`);

    const eventsForMonth = calendarEvents.filter((e) => {
      const [y, m] = e.dateKey.split("-").map((v) => Number(v));
      return y === year && m === month;
    });
    const eventsCountByDay = new Map<number, number>();
    for (const e of eventsForMonth) {
      const parts = e.dateKey.split("-");
      const d = Number(parts[2]);
      eventsCountByDay.set(d, (eventsCountByDay.get(d) ?? 0) + 1);
    }

    return {
      year,
      month,
      monthLabel: view.toLocaleString(locale, { month: "long", year: "numeric" }),
      cells,
      isCompleted,
      eventsCountByDay,
    };
  }, [calendarOffset, completedDays, calendarEvents, locale]);

  function saveDayCompletion() {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const allDone = tasks.length > 0 && tasks.every((t) => t.done);
    if (!allDone) {
      if (!confirm(t("markAllDoneConfirm"))) return;
      setTasks((prev) => prev.map((t) => ({ ...t, done: true })));
    }
    setCompletedDays((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }

  function openCalendarDay(year: number, month: number, day: number) {
    const selected = new Date(year, month, day);
    setCalendarSelectedDate(selected);
    setEventTitle("");
    setEventTime("09:00");
    setCalendarModalOpen(true);
  }

  function saveCalendarEvent() {
    if (!calendarSelectedDate) return;
    const title = clampStr(eventTitle);
    if (!title) return;
    const key = `${calendarSelectedDate.getFullYear()}-${calendarSelectedDate.getMonth()}-${calendarSelectedDate.getDate()}`;
    const newEvent: CalendarEvent = {
      id: uid(),
      dateKey: key,
      time: eventTime || "00:00",
      title,
      createdAt: Date.now(),
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    setEventTitle("");
  }

  function removeCalendarEvent(id: string) {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function saveHeaderTitle(next?: string) {
    const value = clampStr(next ?? headerTitle);
    if (!value) return;
    setHeaderTitle(value);
    setEditingHeader(false);
  }

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
    if (!confirm(t("deleteAllConfirm"))) return;
    setTasks([]);
  }

  function resetAllToIncomplete() {
    if (!confirm(t("resetAllConfirm"))) return;
    setTasks((prev) => prev.map((t) => ({ ...t, done: false })));
  }

  function resetSectionToIncomplete(section: Section) {
    if (!confirm(t("resetSectionConfirm").replace("{section}", sectionName(section)))) return;
    setTasks((prev) =>
      prev.map((t) => (t.section === section ? { ...t, done: false } : t))
    );
  }

  function startEditSectionTitle(section: Section) {
    setEditingSection(section);
    setEditingSectionTitle(sectionTitles[section]);
  }

  function saveSectionTitle() {
    if (!editingSection) return;
    const nextTitle = clampStr(editingSectionTitle);
    if (!nextTitle) return;
    setSectionTitles((prev) => ({ ...prev, [editingSection]: nextTitle }));
    setEditingSection(null);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      if (overId.startsWith("section:")) {
        const targetSection = overId.replace("section:", "") as Section;
        const sourceSection = activeTask.section;

        const sourceTasks = prev
          .filter((t) => t.section === sourceSection)
          .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
        const targetTasks = prev
          .filter((t) => t.section === targetSection)
          .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));

        const nextSource = sourceTasks.filter((t) => t.id !== activeId);
        const nextTarget = [...targetTasks];
        nextTarget.push({ ...activeTask, section: targetSection });

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
      }

      const overTask = prev.find((t) => t.id === overId);
      if (!overTask) return prev;

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
    setActiveId(null);
  }

  function onDragCancel() {
    setActiveId(null);
  }

  return (
    <div
      style={{
        padding: "22px clamp(12px, 2.2vw, 30px)",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        color: T.text,
        background: T.bg,
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
            color: T.muted,
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
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: 4,
            borderRadius: 12,
            border: T.border,
            background: T.panel,
            alignSelf: "flex-start",
            backdropFilter: T.blur,
            WebkitBackdropFilter: T.blur,
          }}
        >
          {([
            { key: "board", label: t("board") },
            { key: "summary", label: t("summary") },
            { key: "calendar", label: t("calendar") },
            { key: "settings", label: t("settings") },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              style={{
                border: T.border,
                background: activeView === tab.key ? T.card : "transparent",
                color: T.text,
                borderRadius: 10,
                padding: "7px 12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div
          style={{
            background: T.panel,
            borderRadius: 18,
            padding: "20px 22px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
            border: T.border,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 18,
            color: T.text,
            position: "relative",
            backdropFilter: T.blur,
            WebkitBackdropFilter: T.blur,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              color: T.text,
              opacity: 0.85,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ProgressRing value={globalProgress} trackColor={T.muted} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                ref={headerTitleRef}
                contentEditable={editingHeader}
                suppressContentEditableWarning
                onClick={() => setEditingHeader(true)}
                onBlur={() => saveHeaderTitle(headerTitleRef.current?.textContent ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveHeaderTitle(headerTitleRef.current?.textContent ?? "");
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingHeader(false);
                  }
                }}
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  outline: "none",
                  cursor: "text",
                  display: "inline-block",
                }}
                title={t("clickToRename")}
              >
                {displayHeaderTitle}
              </span>
              <div style={{ fontSize: 13, opacity: 0.7, color: T.muted }}>
                {t("subtitle")}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: T.panel,
                  border: T.border,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backdropFilter: T.blur,
                  WebkitBackdropFilter: T.blur,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>
                  {scoreStats.grandTotal}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t("points")}</div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: T.panel,
                  border: T.border,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backdropFilter: T.blur,
                  WebkitBackdropFilter: T.blur,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>
                  {streakDays}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t("dayStreak")}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: T.border,
                background: T.panel,
                cursor: "pointer",
                color: T.text,
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
              aria-label={t("openMenu")}
            >
              ≡
            </button>
            <button
              onClick={openCreate}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: T.border,
                background: T.card,
                color: T.text,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("addTask")}
            </button>
            <button
              onClick={saveDayCompletion}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: "1px solid rgba(234,179,8,0.32)",
                background:
                  "linear-gradient(180deg, rgba(250,204,21,0.22) 0%, rgba(234,179,8,0.14) 100%)",
                color: T.text,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t("saveDay")}
            </button>

            <select
              value={themeName}
              onChange={(e) => setThemeName(e.target.value as ThemeName)}
              style={{
                padding: "9px 10px",
                borderRadius: 12,
                border: T.border,
                background: T.panel,
                color: T.text,
                cursor: "pointer",
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
              }}
              aria-label={t("theme")}
            >
              <option value="Dark Glass">Dark Glass</option>
              <option value="Dark Matte">Dark Matte</option>
              <option value="Light">Light</option>
            </select>

          </div>
        </div>

        {menuOpen ? (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(0,0,0,0.35)" }}
            />
            <div
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                width: "min(320px, 82vw)",
                zIndex: 21,
                padding: 16,
                background: T.panel,
                borderRight: T.border,
                color: T.text,
                boxShadow: isLight
                  ? "0 18px 40px rgba(0,0,0,0.18)"
                  : "0 22px 48px rgba(0,0,0,0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{t("menu")}</div>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    border: T.border,
                    background: T.panel,
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    color: T.text,
                    fontWeight: 700,
                  }}
                >
                  {t("close")}
            </button>
          </div>

              <div style={{ fontSize: 12, opacity: 0.7 }}>{t("language")}</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: T.border,
                  background: T.panel,
                  color: T.text,
                }}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: 12, opacity: 0.7 }}>{t("filters")}</div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: T.border,
                  background: T.panel,
                  color: T.text,
                }}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={onlyIncomplete}
                  onChange={(e) => setOnlyIncomplete(e.target.checked)}
                />
                {t("showOnlyIncomplete")}
              </label>

              <div style={{ fontSize: 12, opacity: 0.7 }}>{t("actions")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    saveDayCompletion();
                    setMenuOpen(false);
                  }}
                  style={{
                    border: T.border,
                    background: T.card,
                    borderRadius: 10,
                    padding: "7px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: T.text,
                    fontSize: 12,
                  }}
                >
                  {t("saveDay")}
                </button>
                <button
                  onClick={() => {
                    resetAllToIncomplete();
                    setMenuOpen(false);
                  }}
                  style={{
                    border: T.border,
                    background: T.panel,
                    borderRadius: 10,
                    padding: "7px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: T.text,
                    fontSize: 12,
                  }}
                >
                  {t("resetAll")}
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setMenuOpen(false);
                  }}
                  style={{
                    border: danger.border,
                    background: danger.bg,
                    borderRadius: 10,
                    padding: "7px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: danger.text,
                    fontSize: 12,
                  }}
                >
                  {t("clearAll")}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {activeView === "board" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
                alignItems: "start",
              }}
            >
              {SECTIONS.map((s) => {
                const list = filteredTasks.filter((t) => t.section === s);
                const st = sectionStats[s];

                return (
                  <SectionDropZone key={s} id={`section:${s}`} isLight={isLight}>
                    <div
                      style={{
                        background: T.column,
                        backdropFilter: T.blur,
                        WebkitBackdropFilter: T.blur,
                        borderRadius: 18,
                        padding: 12,
                        border: T.border,
                        boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
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
                      <span
                        contentEditable={editingSection === s}
                        suppressContentEditableWarning
                        onClick={() => startEditSectionTitle(s)}
                        onInput={(e) => {
                          if (editingSection === s) {
                            setEditingSectionTitle((e.currentTarget.textContent ?? "").trim());
                          }
                        }}
                        onBlur={() => saveSectionTitle()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveSectionTitle();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingSection(null);
                          }
                        }}
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: T.text,
                          outline: "none",
                          borderRadius: 6,
                          padding: editingSection === s ? "2px 6px" : 0,
                          cursor: "text",
                          display: "inline-block",
                        }}
                        title={t("clickToRename")}
                      >
                        {displaySectionTitle(s)}
                      </span>
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.85,
                          color: T.muted,
                        }}
                      >
                        {st.done}/{st.total} {t("tasksDone")} • {st.pct}%
                      </div>
                    </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => resetSectionToIncomplete(s)}
                          style={{
                            border: T.border,
                          background: T.panel,
                          borderRadius: 10,
                          padding: "5px 8px",
                          cursor: "pointer",
                          fontWeight: 700,
                          color: T.text,
                          fontSize: 12,
                        }}
                      >
                        {t("uncheckAll")}
                      </button>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: T.text,
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
                          color: T.muted,
                        }}
                      >
                        {t("noTasksFiltered")}
                      </div>
                    ) : (
                      <SortableContext
                        items={list.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {list.map((t) => (
                            <SortableTaskCard key={t.id} id={t.id}>
                              {renderTaskCard(t)}
                            </SortableTaskCard>
                          ))}
                        </div>
                      </SortableContext>
                    )}
                    </div>
                  </SectionDropZone>
                );
              })}
            </div>
            <DragOverlay>
              {activeId ? (() => {
                const t = tasks.find((x) => x.id === activeId);
                return t ? renderTaskCard(t, true) : null;
              })() : null}
            </DragOverlay>
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
                { key: "day", label: t("today"), data: summaryStats.day },
                { key: "week", label: t("thisWeek"), data: summaryStats.week },
                { key: "month", label: t("thisMonth"), data: summaryStats.month },
              ] as const
            ).map((p) => (
              <div
                key={p.key}
                style={{
                  background: T.panel,
                  borderRadius: 18,
                  padding: 16,
                  border: T.border,
                  boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
                  color: T.text,
                  minHeight: 260,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  backdropFilter: T.blur,
                  WebkitBackdropFilter: T.blur,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{p.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{p.data.pct}%</div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    background:
                      "linear-gradient(180deg, rgba(250,204,21,0.2) 0%, rgba(234,179,8,0.12) 100%)",
                    border: "1px solid rgba(234,179,8,0.3)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.72 }}>{t("points")}</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>
                    {p.key === "day"
                      ? scoreStats.today
                      : p.key === "week"
                        ? scoreStats.week
                        : scoreStats.month}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: T.card,
                      border: T.border,
                      backdropFilter: T.blur,
                      WebkitBackdropFilter: T.blur,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{t("done")}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{p.data.done}</div>
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: T.card,
                      border: T.border,
                      backdropFilter: T.blur,
                      WebkitBackdropFilter: T.blur,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{t("notDone")}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{p.data.notDone}</div>
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: T.card,
                    border: T.border,
                    backdropFilter: T.blur,
                    WebkitBackdropFilter: T.blur,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{t("bySection")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.data.bySection.map((row) => (
                      <div
                        key={row.section}
                        style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                      >
                        <span>{sectionName(row.section)}</span>
                        <span>
                          {row.done}/{row.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {t("daysCompleted")}: {p.data.daysCompleted}
                </div>
              </div>
            ))}
          </div>
        ) : activeView === "settings" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: T.panel,
                borderRadius: 18,
                padding: 16,
                border: T.border,
                boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
                color: T.text,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{t("theme")}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {t("themeDescription")}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setThemeName("Dark Glass")}
                  style={{
                    border: T.border,
                    background: themeName === "Dark Glass" ? T.card : "transparent",
                    color: T.text,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Dark Glass
                </button>
                <button
                  onClick={() => setThemeName("Dark Matte")}
                  style={{
                    border: T.border,
                    background: themeName === "Dark Matte" ? T.card : "transparent",
                    color: T.text,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Dark Matte
                </button>
                <button
                  onClick={() => setThemeName("Light")}
                  style={{
                    border: T.border,
                    background: themeName === "Light" ? T.card : "transparent",
                    color: T.text,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Light
                </button>
              </div>
            </div>

            <div
              style={{
                background: T.panel,
                borderRadius: 18,
                padding: 16,
                border: T.border,
                boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
                color: T.text,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>{t("preferences")}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {t("pointsSystemInfo")}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                {t("completedTask")}: +{POINTS.taskDone}
                <br />
                {t("commentBonus")}: +{POINTS.commentedTaskBonus}
                <br />
                {t("savedDay")}: +{POINTS.completedDay}
                <br />
                {t("streakBonus")}: +{POINTS.streakPerDay}/{t("dayStreak")}, {t("cappedAtDays")} {POINTS.streakCap} {t("days")}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {t("totalScore")}: {scoreStats.total} {t("plus")} {scoreStats.streakBonus} {t("equals")}{" "}
                {scoreStats.grandTotal} {t("points")}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: T.panel,
              borderRadius: 20,
              padding: 18,
              border: T.border,
              boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
              color: T.text,
              backdropFilter: T.blur,
              WebkitBackdropFilter: T.blur,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: T.card,
                    border: T.border,
                    fontWeight: 900,
                  }}
                >
                  📅
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{t("calendar")}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{t("calendarSubtitle")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setCalendarOffset((v) => v - 1)}
                  style={{
                    border: T.border,
                    background: T.panel,
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  {t("prev")}
                </button>
                <button
                  onClick={() => setCalendarOffset(0)}
                  style={{
                    border: T.border,
                    background: T.panel,
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  {t("today")}
                </button>
                <button
                  onClick={() => setCalendarOffset((v) => v + 1)}
                  style={{
                    border: T.border,
                    background: T.panel,
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  {t("next")}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={`${calendarData.year}-${calendarData.month}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split("-").map((v) => Number(v));
                  const now = new Date();
                  const diff = (y - now.getFullYear()) * 12 + (m - now.getMonth());
                  setCalendarOffset(diff);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: T.border,
                  background: T.panel,
                  color: T.text,
                }}
              >
                {Array.from({ length: 36 }).map((_, idx) => {
                  const base = new Date();
                  const d = new Date(base.getFullYear(), base.getMonth() - 12 + idx, 1);
                  const value = `${d.getFullYear()}-${d.getMonth()}`;
                  return (
                    <option key={value} value={value}>
                      {d.toLocaleString(locale, { month: "long", year: "numeric" })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 8,
                padding: 10,
                borderRadius: 14,
                background: T.panel,
                border: T.border,
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
              }}
            >
              {([t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")] as const).map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    textAlign: "center",
                    letterSpacing: "0.08em",
                  }}
                >
                  {d}
                </div>
              ))}
              {calendarData.cells.map((cell) => (
                <div
                  key={cell.key}
                  style={{
                    height: 42,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: cell.day
                      ? calendarData.isCompleted(cell.day)
                        ? "linear-gradient(180deg, rgba(34,197,94,0.5) 0%, rgba(22,163,74,0.35) 100%)"
                        : T.card
                      : "transparent",
                    border: cell.day ? T.border : "none",
                    color: T.text,
                    fontWeight: 700,
                    fontSize: 12,
                    position: "relative",
                    cursor: cell.day ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (cell.day) openCalendarDay(calendarData.year, calendarData.month, cell.day);
                  }}
                >
                  {cell.day ?? ""}
                  {cell.day && (calendarData.eventsCountByDay.get(cell.day) ?? 0) > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        right: 6,
                        top: 4,
                        fontSize: 10,
                        opacity: 0.75,
                      }}
                    >
                      {calendarData.eventsCountByDay.get(cell.day)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal
          open={modalOpen}
          title={editingId ? t("editTask") : t("addTaskModal")}
          onClose={closeModal}
          theme={T}
          closeLabel={t("close")}
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
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{t("titleField")}</div>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{t("sectionField")}</div>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value as Section)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  boxSizing: "border-box",
                }}
              >
                <option value="Morning">{t("sectionMorning")}</option>
                <option value="Midday">{t("sectionMidday")}</option>
                <option value="AfterWork">{t("sectionAfterWork")}</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{t("categoryField")}</div>
              <input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder={t("categoryPlaceholder")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{t("commentField")}</div>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  border: T.border,
                  background: T.panel,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  color: T.text,
                }}
                type="button"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                style={{
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 800,
                  
                }}
              >
                {editingId ? t("save") : t("create")}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          open={calendarModalOpen}
          title={
            calendarSelectedDate
              ? calendarSelectedDate.toLocaleDateString(locale, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : t("newEvent")
          }
          onClose={() => setCalendarModalOpen(false)}
          theme={T}
          closeLabel={t("close")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCalendarEvent();
            }}
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder={t("eventTitle")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  boxSizing: "border-box",
                }}
              />
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 10px",
                  borderRadius: 12,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                style={{
                  border: T.border,
                  background: T.panel,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  color: T.text,
                }}
              >
                {t("close")}
              </button>
              <button
                type="submit"
                style={{
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {t("addEvent")}
              </button>
            </div>

            {calendarSelectedDate ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{t("events")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {calendarEvents
                    .filter((e) =>
                      e.dateKey ===
                      `${calendarSelectedDate.getFullYear()}-${calendarSelectedDate.getMonth()}-${calendarSelectedDate.getDate()}`
                    )
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((e) => (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: T.border,
                          background: T.card,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>{e.time}</div>
                          <div style={{ fontWeight: 700 }}>{e.title}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCalendarEvent(e.id)}
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
                          {t("delete")}
                        </button>
                      </div>
                    ))}
                  {calendarEvents.filter((e) =>
                    e.dateKey ===
                    `${calendarSelectedDate.getFullYear()}-${calendarSelectedDate.getMonth()}-${calendarSelectedDate.getDate()}`
                  ).length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{t("noEventsForDay")}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>
        </Modal>

        <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", paddingBottom: 12 }}>
          {t("savedLocally")}
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
