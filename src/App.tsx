import React, { useEffect, useMemo, useState } from "react";

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
import { PremiumThemes, type PremiumThemeName } from "./themes/premiumThemes";

// Utility function to format date keys consistently (YYYY-MM-DD)
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type Section = "Morning" | "Midday" | "AfterWork";
type Language = "en" | "fr" | "es" | "pt" | "de" | "it";
const SECTIONS: Section[] = ["Morning", "Midday", "AfterWork"];

type ThemeName = PremiumThemeName;
type ThemeTokens = typeof PremiumThemes[ThemeName];

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

const THEMES = PremiumThemes;

type CalendarEvent = {
  id: string;
  dateKey: string;
  time: string;
  title: string;
  createdAt: number;
};

type HabitTracker = {
  id: string;
  name: string;
  accentColor: string;
  createdAt: number;
};

const STORAGE_KEY = "journey_task_board_v1";
const LANGUAGE_STORAGE_KEY = "journey_language_v1";
const ALL_CATEGORIES = "__all__";
const CODE_MAP_ENTRIES = [
  ["1", "A"],
  ["2", "Z"],
  ["3", "E"],
  ["4", "R"],
  ["5", "T"],
  ["6", "Y"],
  ["7", "U"],
  ["8", "I"],
  ["9", "O"],
  ["0", "P"],
  ["-", "Q"],
  ["/", "S"],
  [":", "D"],
  [";", "F"],
  ["(", "G"],
  [")", "H"],
  ["€", "J"],
  ["&", "K"],
  ["@", "L"],
  ['"', "M"],
  [".", "W"],
  [",", "X"],
  ["?", "C"],
  ["!", "V"],
  ["'", "B"],
  ["''", "N"],
] as const;
const LETTER_TO_CODE = new Map<string, string>(CODE_MAP_ENTRIES.map(([code, letter]) => [letter, code]));
const CODE_TO_LETTER = new Map<string, string>(CODE_MAP_ENTRIES);
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
    journal: "Journal",
    codes: "Codes",
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
    codesTitle: "Coded Messages",
    codesSubtitle: "Write a normal message, encode it with your custom alphabet, or decode a secret message.",
    plainMessage: "Plain message",
    codedMessage: "Coded message",
    encode: "Encode",
    decode: "Decode",
    copy: "Copy",
    copied: "Copied",
    clear: "Clear",
    codeLegend: "Legend",
    codeLegendHint: "Your custom alphabet used for encoding and decoding.",
    openCodeLegend: "Open code legend",
    unlockCodeLegend: "Unlock code legend",
    codedPassword: "Coded password",
    codedPasswordHint: 'Use the coded version of "password" in the current language.',
    codePasswordPhrase: "PASSWORD",
    codedPasswordPlaceholder: "Enter the coded password...",
    unlock: "Unlock",
    wrongCodePassword: "Wrong coded password.",
    plainMessagePlaceholder: "Write your normal message here...",
    codedMessagePlaceholder: "Your coded message appears here...",
  },
  fr: {
    appTitle: "Tableau de taches",
    board: "Tableau",
    summary: "Resume",
    calendar: "Calendrier",
    journal: "Journal",
    codes: "Codes",
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
    codesTitle: "Messages codes",
    codesSubtitle: "Ecris un message normal, encode-le avec ton alphabet perso, ou decode un message secret.",
    plainMessage: "Message normal",
    codedMessage: "Message code",
    encode: "Encoder",
    decode: "Decoder",
    copy: "Copier",
    copied: "Copie",
    clear: "Vider",
    codeLegend: "Correspondance",
    codeLegendHint: "Ton alphabet personnalise pour encoder et decoder.",
    openCodeLegend: "Voir la correspondance",
    unlockCodeLegend: "Debloquer la correspondance",
    codedPassword: "Mot de passe code",
    codedPasswordHint: 'Utilise la version codee de "mot de passe" dans la langue actuelle.',
    codePasswordPhrase: "MOT DE PASSE",
    codedPasswordPlaceholder: "Ecris le mot de passe en code...",
    unlock: "Debloquer",
    wrongCodePassword: "Mot de passe code incorrect.",
    plainMessagePlaceholder: "Ecris ton message normal ici...",
    codedMessagePlaceholder: "Ton message code apparait ici...",
  },
  es: {
    appTitle: "Tablero de tareas",
    board: "Tablero",
    summary: "Resumen",
    calendar: "Calendario",
    journal: "Diario",
    codes: "Codigos",
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
    codesTitle: "Mensajes codificados",
    codesSubtitle: "Escribe un mensaje normal, codificalo con tu alfabeto personalizado o descifra un mensaje secreto.",
    plainMessage: "Mensaje normal",
    codedMessage: "Mensaje codificado",
    encode: "Codificar",
    decode: "Descifrar",
    copy: "Copiar",
    copied: "Copiado",
    clear: "Vaciar",
    codeLegend: "Leyenda",
    codeLegendHint: "Tu alfabeto personalizado para codificar y descifrar.",
    openCodeLegend: "Ver la leyenda",
    unlockCodeLegend: "Desbloquear la leyenda",
    codedPassword: "Contrasena codificada",
    codedPasswordHint: 'Usa la version codificada de "contrasena" en el idioma actual.',
    codePasswordPhrase: "CONTRASENA",
    codedPasswordPlaceholder: "Escribe la contrasena codificada...",
    unlock: "Desbloquear",
    wrongCodePassword: "Contrasena codificada incorrecta.",
    plainMessagePlaceholder: "Escribe tu mensaje normal aqui...",
    codedMessagePlaceholder: "Tu mensaje codificado aparece aqui...",
  },
  pt: {
    appTitle: "Quadro de tarefas",
    board: "Quadro",
    summary: "Resumo",
    calendar: "Calendario",
    journal: "Diário",
    codes: "Codigos",
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
    codesTitle: "Mensagens codificadas",
    codesSubtitle: "Escreve uma mensagem normal, codifica-a com o teu alfabeto personalizado ou descodifica uma mensagem secreta.",
    plainMessage: "Mensagem normal",
    codedMessage: "Mensagem codificada",
    encode: "Codificar",
    decode: "Descodificar",
    copy: "Copiar",
    copied: "Copiado",
    clear: "Limpar",
    codeLegend: "Legenda",
    codeLegendHint: "O teu alfabeto personalizado para codificar e descodificar.",
    openCodeLegend: "Ver a legenda",
    unlockCodeLegend: "Desbloquear a legenda",
    codedPassword: "Palavra-passe codificada",
    codedPasswordHint: 'Usa a versao codificada de "palavra passe" no idioma atual.',
    codePasswordPhrase: "PALAVRA PASSE",
    codedPasswordPlaceholder: "Escreve a palavra-passe codificada...",
    unlock: "Desbloquear",
    wrongCodePassword: "Palavra-passe codificada incorreta.",
    plainMessagePlaceholder: "Escreve a tua mensagem normal aqui...",
    codedMessagePlaceholder: "A tua mensagem codificada aparece aqui...",
  },
  de: {
    appTitle: "Aufgabenboard",
    board: "Board",
    summary: "Ubersicht",
    calendar: "Kalender",
    journal: "Tagebuch",
    codes: "Codes",
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
    codesTitle: "Codierte Nachrichten",
    codesSubtitle: "Schreibe eine normale Nachricht, kodiere sie mit deinem persoenlichen Alphabet oder entschluessle eine geheime Nachricht.",
    plainMessage: "Normale Nachricht",
    codedMessage: "Codierte Nachricht",
    encode: "Kodieren",
    decode: "Entschluesseln",
    copy: "Kopieren",
    copied: "Kopiert",
    clear: "Leeren",
    codeLegend: "Legende",
    codeLegendHint: "Dein persoenliches Alphabet zum Kodieren und Entschluesseln.",
    openCodeLegend: "Legende anzeigen",
    unlockCodeLegend: "Legende entsperren",
    codedPassword: "Codiertes Passwort",
    codedPasswordHint: 'Nutze die codierte Version von "passwort" in der aktuellen Sprache.',
    codePasswordPhrase: "PASSWORT",
    codedPasswordPlaceholder: "Gib das codierte Passwort ein...",
    unlock: "Entsperren",
    wrongCodePassword: "Falsches codiertes Passwort.",
    plainMessagePlaceholder: "Schreibe hier deine normale Nachricht...",
    codedMessagePlaceholder: "Deine codierte Nachricht erscheint hier...",
  },
  it: {
    appTitle: "Bacheca attivita",
    board: "Bacheca",
    summary: "Riepilogo",
    calendar: "Calendario",
    journal: "Diario",
    codes: "Codici",
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
    codesTitle: "Messaggi codificati",
    codesSubtitle: "Scrivi un messaggio normale, codificalo con il tuo alfabeto personalizzato o decodifica un messaggio segreto.",
    plainMessage: "Messaggio normale",
    codedMessage: "Messaggio codificato",
    encode: "Codifica",
    decode: "Decodifica",
    copy: "Copia",
    copied: "Copiato",
    clear: "Svuota",
    codeLegend: "Legenda",
    codeLegendHint: "Il tuo alfabeto personalizzato per codificare e decodificare.",
    openCodeLegend: "Vedi la legenda",
    unlockCodeLegend: "Sblocca la legenda",
    codedPassword: "Password codificata",
    codedPasswordHint: 'Usa la versione codificata di "password" nella lingua attuale.',
    codePasswordPhrase: "PASSWORD",
    codedPasswordPlaceholder: "Scrivi la password codificata...",
    unlock: "Sblocca",
    wrongCodePassword: "Password codificata non corretta.",
    plainMessagePlaceholder: "Scrivi qui il tuo messaggio normale...",
    codedMessagePlaceholder: "Il tuo messaggio codificato appare qui...",
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

function encodeCustomMessage(input: string) {
  return Array.from(input)
    .map((char) => LETTER_TO_CODE.get(char.toUpperCase()) ?? char)
    .join("");
}

function decodeCustomMessage(input: string) {
  let result = "";
  let index = 0;

  while (index < input.length) {
    const doubleChar = input.slice(index, index + 2);
    if (CODE_TO_LETTER.has(doubleChar)) {
      result += CODE_TO_LETTER.get(doubleChar);
      index += 2;
      continue;
    }

    const singleChar = input[index];
    result += CODE_TO_LETTER.get(singleChar) ?? singleChar;
    index += 1;
  }

  return result;
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
  accentColor,
}: {
  value: number;
  trackColor: string;
  accentColor?: string;
}) {
  const progColor = value === 100
    ? "#22c55e"
    : accentColor ?? "#6478ff";
  const r = 38;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          stroke={trackColor}
          strokeWidth="6"
          fill="none"
          strokeOpacity="0.3"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          stroke={progColor}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 48 48)"
        />
        <text
          x="48"
          y="53"
          textAnchor="middle"
          fontSize="17"
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

// ── Draggable wrapper for tracker cards (uses useSortable at component level) ──
function SortableTrackerWrapper({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>, isDragging: boolean) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms ease",
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  );
}

export default function JourneyTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    readStoredValue<Task[]>(STORAGE_KEY, [], Array.isArray)
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [onlyIncomplete, setOnlyIncomplete] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"board" | "summary" | "settings" | "calendar" | "codes" | "journal">("board");
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = readStoredString("journey_theme", "Obsidian");
    return saved in THEMES ? (saved as ThemeName) : "Obsidian";
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
  const [codeLegendModalOpen, setCodeLegendModalOpen] = useState(false);
  const [codeLegendUnlockModalOpen, setCodeLegendUnlockModalOpen] = useState(false);
  const [calendarSelectedDate] = useState<Date | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [plainCodeMessage, setPlainCodeMessage] = useState("");
  const [encodedCodeMessage, setEncodedCodeMessage] = useState("");
  const [copiedCodeMessage, setCopiedCodeMessage] = useState(false);
  const [codedLegendPassword, setCodedLegendPassword] = useState("");
  const [codeLegendError, setCodeLegendError] = useState("");
  const [headerTitle, setHeaderTitle] = useState(() =>
    readStoredString("journey_header_title", "Journey Task Board")
  );
  const [editingHeader, setEditingHeader] = useState(false);
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
  const [dayColors, setDayColors] = useState<Record<string, string>>(() =>
    readStoredValue<Record<string, string>>(
      "journey_day_colors",
      {},
      (v): v is Record<string, string> =>
        typeof v === "object" && v !== null && !Array.isArray(v)
    )
  );

  // ── Multi-tracker calendars ──────────────────────────────────────
  const [habitTrackers, setHabitTrackers] = useState<HabitTracker[]>(() => {
    const saved = readStoredValue<HabitTracker[]>(
      "journey_habit_trackers",
      [],
      Array.isArray
    );
    if (saved.length > 0) return saved;
    // Default trackers on first load
    return [
      { id: uid(), name: "Travail", accentColor: "#3b7a50", createdAt: Date.now() - 2000 },
      { id: uid(), name: "Sport", accentColor: "#4a5090", createdAt: Date.now() - 1000 },
    ];
  });
  const [trackerDayColors, setTrackerDayColors] = useState<Record<string, Record<string, string>>>(() =>
    readStoredValue<Record<string, Record<string, string>>>(
      "journey_tracker_day_colors",
      {},
      (v): v is Record<string, Record<string, string>> =>
        typeof v === "object" && v !== null && !Array.isArray(v)
    )
  );
  const [coloringCell, setColoringCell] = useState<{ trackerId: string; dateKey: string; x: number; y: number } | null>(null);
  const [trackerDayNotes, setTrackerDayNotes] = useState<Record<string, Record<string, string>>>(() =>
    readStoredValue<Record<string, Record<string, string>>>(
      "journey_tracker_day_notes",
      {},
      (v): v is Record<string, Record<string, string>> => typeof v === "object" && v !== null && !Array.isArray(v)
    )
  );
  // Daily journal
  const [journalEntries, setJournalEntries] = useState<Record<string, string>>(() =>
    readStoredValue<Record<string, string>>(
      "journey_journal_entries",
      {},
      (v): v is Record<string, string> => typeof v === "object" && v !== null && !Array.isArray(v)
    )
  );
  const [journalDate, setJournalDate] = useState<string>(() => formatDateKey(new Date()));

  // Multi-select: trackerId of the card in select-mode, + selected dateKeys per tracker
  const [multiSelectTracker, setMultiSelectTracker] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, string[]>>({});
  const [addingTracker, setAddingTracker] = useState(false);
  const [newTrackerName, setNewTrackerName] = useState("");
  const [newTrackerColor, setNewTrackerColor] = useState("#3b7a50");
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);
  const [editingTrackerName, setEditingTrackerName] = useState("");

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

  useEffect(() => {
    try {
      localStorage.setItem("journey_day_colors", JSON.stringify(dayColors));
    } catch { /* ignore */ }
  }, [dayColors]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_habit_trackers", JSON.stringify(habitTrackers));
    } catch { /* ignore */ }
  }, [habitTrackers]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_tracker_day_colors", JSON.stringify(trackerDayColors));
    } catch { /* ignore */ }
  }, [trackerDayColors]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_tracker_day_notes", JSON.stringify(trackerDayNotes));
    } catch { /* ignore */ }
  }, [trackerDayNotes]);

  useEffect(() => {
    try {
      localStorage.setItem("journey_journal_entries", JSON.stringify(journalEntries));
    } catch { /* ignore */ }
  }, [journalEntries]);
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
  const codeLegendPassword = encodeCustomMessage(t("codePasswordPhrase"));
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

  const isLight = T.isLight;
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
        border: T.border,
        borderRadius: T.radius,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: T.card,
        color: T.text,
        boxShadow: isOverlay
          ? "0 24px 60px rgba(0,0,0,0.45)"
          : T.shadow,
        position: "relative",
        backdropFilter: T.blur,
        WebkitBackdropFilter: T.blur,
        transform: isOverlay ? "scale(1.02)" : "none",
        transition: "transform 120ms ease",
        opacity: task.done ? 0.72 : 1,
      }}
    >
      {/* Left status stripe */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: T.radius === 0 ? 4 : 3,
          borderTopLeftRadius: T.radius,
          borderBottomLeftRadius: T.radius,
          background: task.done
            ? T.success.replace("0.18", "0.6").replace("0.16", "0.6").replace("0.15", "0.6")
            : T.accent,
          opacity: task.done ? 0.5 : 0.7,
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
    const dayKey = formatDateKey;

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
    const key = formatDateKey(today);
    const allDone = tasks.length > 0 && tasks.every((t) => t.done);
    if (!allDone) {
      if (!confirm(t("markAllDoneConfirm"))) return;
      setTasks((prev) => prev.map((t) => ({ ...t, done: true })));
    }
    setCompletedDays((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }


  function saveCalendarEvent() {
    if (!calendarSelectedDate) return;
    const title = clampStr(eventTitle);
    if (!title) return;
    const key = formatDateKey(calendarSelectedDate);
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

  // ── Habit tracker helpers ────────────────────────────────────────
  function setTrackerDayColor(trackerId: string, dateKey: string, color: string | null) {
    setTrackerDayColors((prev) => {
      const existing = { ...(prev[trackerId] ?? {}) };
      if (color === null) {
        delete existing[dateKey];
      } else {
        existing[dateKey] = color;
      }
      return { ...prev, [trackerId]: existing };
    });
    // Keep popup open so user can also add a note
  }

  function setTrackerDayNote(trackerId: string, dateKey: string, note: string) {
    setTrackerDayNotes((prev) => {
      const existing = { ...(prev[trackerId] ?? {}) };
      if (!note.trim()) {
        delete existing[dateKey];
      } else {
        existing[dateKey] = note;
      }
      return { ...prev, [trackerId]: existing };
    });
  }

  function reorderTrackers(fromId: string, toId: string) {
    setHabitTrackers((prev) => {
      const from = prev.findIndex((t) => t.id === fromId);
      const to = prev.findIndex((t) => t.id === toId);
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  function toggleDaySelection(trackerId: string, dateKey: string) {
    setSelectedDays((prev) => {
      const current = prev[trackerId] ?? [];
      const exists = current.includes(dateKey);
      return {
        ...prev,
        [trackerId]: exists ? current.filter((k) => k !== dateKey) : [...current, dateKey],
      };
    });
  }

  function applyColorToSelection(trackerId: string, color: string | null) {
    const keys = selectedDays[trackerId] ?? [];
    if (keys.length === 0) return;
    setTrackerDayColors((prev) => {
      const existing = { ...(prev[trackerId] ?? {}) };
      for (const k of keys) {
        if (color === null) delete existing[k];
        else existing[k] = color;
      }
      return { ...prev, [trackerId]: existing };
    });
    // Exit multi-select mode after applying
    setSelectedDays((prev) => ({ ...prev, [trackerId]: [] }));
    setMultiSelectTracker(null);
  }

  function exitMultiSelect() {
    setMultiSelectTracker(null);
    setSelectedDays({});
  }

  function addHabitTracker() {
    const name = newTrackerName.trim();
    if (!name) return;
    setHabitTrackers((prev) => [
      ...prev,
      { id: uid(), name, accentColor: newTrackerColor, createdAt: Date.now() },
    ]);
    setNewTrackerName("");
    setNewTrackerColor("#3b7a50");
    setAddingTracker(false);
  }

  function deleteHabitTracker(id: string) {
    if (!confirm("Supprimer ce traceur ?")) return;
    setHabitTrackers((prev) => prev.filter((t) => t.id !== id));
    setTrackerDayColors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function saveTrackerName(id: string) {
    const name = editingTrackerName.trim();
    if (!name) return;
    setHabitTrackers((prev) => prev.map((t) => t.id === id ? { ...t, name } : t));
    setEditingTrackerId(null);
  }


  function encodeCodeMessage() {
    setCopiedCodeMessage(false);
    setEncodedCodeMessage(encodeCustomMessage(plainCodeMessage));
  }

  function decodeCodeMessage() {
    setCopiedCodeMessage(false);
    setPlainCodeMessage(decodeCustomMessage(encodedCodeMessage));
  }

  async function copyEncodedMessage() {
    const value = encodedCodeMessage.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(encodedCodeMessage);
      setCopiedCodeMessage(true);
      window.setTimeout(() => {
        setCopiedCodeMessage(false);
      }, 1800);
    } catch {
      setCopiedCodeMessage(false);
    }
  }

  function clearCodeMessages() {
    setPlainCodeMessage("");
    setEncodedCodeMessage("");
    setCopiedCodeMessage(false);
  }

  function openCodeLegendUnlock() {
    setCodedLegendPassword("");
    setCodeLegendError("");
    setCodeLegendUnlockModalOpen(true);
  }

  function unlockCodeLegend() {
    const normalized = codedLegendPassword.trim();
    if (normalized !== codeLegendPassword) {
      setCodeLegendError(t("wrongCodePassword"));
      return;
    }
    setCodeLegendUnlockModalOpen(false);
    setCodeLegendModalOpen(true);
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
        fontFamily: T.fontFamily,
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
        {/* Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            alignSelf: "flex-start",
            borderBottom: T.border,
          }}
        >
          {([
            { key: "board", label: t("board") },
            { key: "summary", label: t("summary") },
            { key: "calendar", label: t("calendar") },
            { key: "journal", label: "📓 " + t("journal") },
            { key: "codes", label: t("codes") },
            { key: "settings", label: t("settings") },
          ] as const).map((tab) => {
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                style={{
                  border: "none",
                  borderBottom: isActive
                    ? `2px solid ${T.accent}`
                    : "2px solid transparent",
                  background: "transparent",
                  color: isActive ? T.accent : T.muted,
                  borderRadius: 0,
                  padding: "10px 18px",
                  marginBottom: "-1px",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  transition: "all 160ms ease",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Header */}
        <div
          style={{
            background: T.panel,
            borderRadius: T.radius,
            padding: "22px 24px",
            boxShadow: T.shadow,
            border: T.border,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 16,
            color: T.text,
            position: "relative",
            backdropFilter: T.blur,
            WebkitBackdropFilter: T.blur,
          }}
        >

          {/* Top row: title + progress ring + stats */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px", minWidth: 0, overflow: "hidden" }}>
              {editingHeader ? (
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onBlur={() => saveHeaderTitle(headerTitle)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); saveHeaderTitle(headerTitle); }
                    if (e.key === "Escape") { e.preventDefault(); setEditingHeader(false); }
                  }}
                  autoFocus
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    border: `1px solid ${T.accent}44`,
                    background: T.column,
                    color: T.text,
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    width: "100%",
                    outline: "none",
                  }}
                />
              ) : (
                <span
                  onClick={() => setEditingHeader(true)}
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    cursor: "text",
                    display: "block",
                    color: T.text,
                    letterSpacing: "-0.2px",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                  title={t("clickToRename")}
                >
                  {displayHeaderTitle}
                </span>
              )}
              <div style={{ fontSize: 12, opacity: 0.55, color: T.muted, letterSpacing: "0.1px" }}>
                {t("subtitle")}
              </div>
            </div>

            {/* Progress ring + stats cluster */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ opacity: 0.9 }}>
                <ProgressRing value={globalProgress} trackColor={T.muted} accentColor={T.accent} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  padding: "8px 14px",
                  borderRadius: T.radius,
                  background: T.accentLight,
                  border: `1px solid ${T.accent}40`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.accent,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {scoreStats.grandTotal}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 500, letterSpacing: "0.04em" }}>{t("points")}</div>
                </div>
                <div style={{
                  padding: "8px 14px",
                  borderRadius: T.radius,
                  background: T.warning,
                  border: T.warningBorder,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {streakDays}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 500, letterSpacing: "0.04em" }}>{t("dayStreak")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: actions */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                padding: "8px 12px",
                borderRadius: T.radius,
                border: T.border,
                background: "transparent",
                cursor: "pointer",
                color: T.muted,
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1,
                transition: "all 150ms ease",
                boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow,
              }}
              aria-label={t("openMenu")}
            >
              ≡
            </button>
            <button
              onClick={openCreate}
              style={{
                padding: "8px 16px",
                borderRadius: T.radius,
                border: `1px solid ${T.accent}`,
                background: "transparent",
                color: T.accent,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 150ms ease",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow,
              }}
            >
              {t("addTask")}
            </button>
            <button
              onClick={saveDayCompletion}
              style={{
                padding: "8px 16px",
                borderRadius: T.radius,
                border: T.warningBorder,
                background: "transparent",
                color: T.muted,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 150ms ease",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow,
              }}
            >
              {t("saveDay")}
            </button>

            <select
              value={themeName}
              onChange={(e) => setThemeName(e.target.value as ThemeName)}
              style={{
                padding: "8px 10px",
                borderRadius: T.radius,
                border: T.border,
                background: T.column,
                color: T.text,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: T.fontFamily,
                boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow,
              }}
              aria-label={t("theme")}
            >
              <optgroup label="Style">
                <option value="Minimalisme">Minimalisme</option>
                <option value="Brutalisme">Brutalisme</option>
                <option value="Constructivisme">Constructivisme</option>
                <option value="Style Suisse">Style Suisse</option>
                <option value="Éditorial">Éditorial</option>
                <option value="Dessiné à la main">Dessiné à la main</option>
                <option value="Rétro">Rétro</option>
                <option value="Plat">Plat</option>
                <option value="Bento">Bento</option>
                <option value="Obsidian">Obsidian</option>
              </optgroup>
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
                boxShadow: T.shadow,
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
                        borderRadius: T.radius,
                        padding: 0,
                        border: T.border,
                        boxShadow: T.shadow,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "clamp(420px, 68dvh, 760px)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Accent top bar */}
                      <div style={{
                        height: themeName === "Brutalisme" || themeName === "Constructivisme" || themeName === "Style Suisse" ? 3 : 2,
                        background: T.accent,
                        opacity: 0.85,
                      }} />
                      <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1 }}>
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
                      {editingSection === s ? (
                        <input
                          type="text"
                          value={editingSectionTitle}
                          onChange={(e) => setEditingSectionTitle(e.target.value)}
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
                          autoFocus
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: T.text,
                            border: `1px solid ${T.border}`,
                            background: T.card,
                            borderRadius: 6,
                            padding: "2px 6px",
                            fontFamily: "inherit",
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => startEditSectionTitle(s)}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.text,
                            borderRadius: 0,
                            padding: 0,
                            cursor: "text",
                            display: "inline-block",
                            letterSpacing: "0.01em",
                          }}
                          title={t("clickToRename")}
                        >
                          {displaySectionTitle(s)}
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.5,
                          color: T.muted,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {st.done}/{st.total}
                      </div>
                    </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => resetSectionToIncomplete(s)}
                          style={{
                            border: `1px solid ${T.accent}33`,
                            background: "transparent",
                            borderRadius: T.radius,
                            padding: "3px 8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            color: T.muted,
                            fontSize: 10,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            transition: "all 150ms ease",
                            boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow,
                          }}
                        >
                          {t("uncheckAll")}
                        </button>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: st.pct === 100 ? (isLight ? "#286838" : "#5aaa6a") : T.accent,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {st.pct}%
                      </div>
                    </div>
                  </div>

                    {/* Section progress bar */}
                    <div style={{
                      height: 4,
                      borderRadius: 2,
                      background: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)",
                      marginBottom: 10,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${st.pct}%`,
                        borderRadius: 2,
                        background: st.pct === 100 ? (isLight ? "#286838" : "#5aaa6a") : T.accent,
                        transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
                      }} />
                    </div>

                    {list.length === 0 ? (
                      <div
                        style={{
                          fontSize: 13,
                          padding: "24px 10px",
                          color: T.muted,
                          opacity: 0.5,
                          textAlign: "center",
                          fontStyle: "italic",
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
                  borderRadius: T.radius,
                  padding: 16,
                  border: T.border,
                  boxShadow: T.shadow,
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
        ) : activeView === "codes" ? (
          <div
            style={{
              background: T.panel,
              borderRadius: 20,
              padding: 18,
              border: T.border,
              boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
              color: T.text,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              backdropFilter: T.blur,
              WebkitBackdropFilter: T.blur,
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
                {t("codesTitle")}
              </div>
              <div style={{ fontSize: 13, opacity: 0.72 }}>{t("codesSubtitle")}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                {t("plainMessage")}
              </div>
              <textarea
                value={plainCodeMessage}
                onChange={(e) => setPlainCodeMessage(e.target.value)}
                placeholder={t("plainMessagePlaceholder")}
                rows={7}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={encodeCodeMessage}
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
                {t("encode")}
              </button>
              <button
                onClick={decodeCodeMessage}
                style={{
                  border: T.border,
                  background: T.panel,
                  color: T.text,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {t("decode")}
              </button>
              <button
                onClick={clearCodeMessages}
                style={{
                  border: T.border,
                  background: "transparent",
                  color: T.text,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {t("clear")}
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{t("codedMessage")}</div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={copyEncodedMessage}
                  disabled={!encodedCodeMessage.trim()}
                  aria-label={t("copy")}
                  title={copiedCodeMessage ? t("copied") : t("copy")}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    border: "none",
                    background: "transparent",
                    color: copiedCodeMessage ? "#22c55e" : T.text,
                    padding: 0,
                    cursor: encodedCodeMessage.trim() ? "pointer" : "not-allowed",
                    opacity: encodedCodeMessage.trim() ? 0.72 : 0.35,
                    zIndex: 1,
                  }}
                >
                  {copiedCodeMessage ? (
                    <span style={{ fontSize: 16, fontWeight: 900 }}>✓</span>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <textarea
                  value={encodedCodeMessage}
                  onChange={(e) => {
                    setEncodedCodeMessage(e.target.value);
                    setCopiedCodeMessage(false);
                  }}
                  placeholder={t("codedMessagePlaceholder")}
                  rows={7}
                  style={{
                    width: "100%",
                    padding: "12px 52px 12px 14px",
                    borderRadius: 14,
                    border: T.border,
                    background: T.card,
                    color: T.text,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
                    letterSpacing: "0.08em",
                  }}
                />
              </div>
            </div>
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(Object.keys(THEMES) as ThemeName[]).map((name) => (
                  <button
                    key={name}
                    onClick={() => setThemeName(name)}
                    style={{
                      border: themeName === name ? `2px solid ${T.accent}` : T.border,
                      background: themeName === name ? T.accentLight : "transparent",
                      color: T.text,
                      borderRadius: T.radius,
                      padding: "7px 12px",
                      cursor: "pointer",
                      fontWeight: themeName === name ? 700 : 500,
                      fontSize: 12,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    {name}
                  </button>
                ))}
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
              <button
                onClick={openCodeLegendUnlock}
                style={{
                  border: T.border,
                  background: T.card,
                  color: T.text,
                  borderRadius: 10,
                  padding: "9px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                  alignSelf: "flex-start",
                }}
              >
                {t("openCodeLegend")}
              </button>
            </div>
          </div>
        ) : activeView === "journal" ? (
          /* ── Journal view ────────────────────────────────────────── */
          (() => {
            const todayKey = formatDateKey(new Date());
            const [jy, jm, jd] = journalDate.split("-").map(Number);
            const journalDateObj = new Date(jy, jm - 1, jd);
            const isToday = journalDate === todayKey;
            const displayDate = journalDateObj.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            const filledEntries = Object.values(journalEntries).filter((v) => v.trim()).length;

            // All entry dates sorted desc for the sidebar
            const entryDates = Object.entries(journalEntries)
              .filter(([, v]) => v.trim())
              .sort(([a], [b]) => b.localeCompare(a));

            return (
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

                {/* ── Sidebar: past entries ───────────────── */}
                <div style={{
                  width: 200,
                  flexShrink: 0,
                  background: T.panel,
                  borderRadius: T.radius,
                  border: T.border,
                  boxShadow: T.shadow,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "10px 14px", borderBottom: T.border, fontSize: 11, fontWeight: 700, opacity: 0.5, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {filledEntries} entrée{filledEntries !== 1 ? "s" : ""}
                  </div>
                  <div style={{ maxHeight: 520, overflowY: "auto" }}>
                    {/* Today shortcut if no entry yet */}
                    {!journalEntries[todayKey]?.trim() && (
                      <button
                        onClick={() => setJournalDate(todayKey)}
                        style={{
                          width: "100%", textAlign: "left", padding: "9px 14px",
                          border: "none", background: journalDate === todayKey ? T.accentLight : "transparent",
                          color: journalDate === todayKey ? T.accent : T.muted,
                          cursor: "pointer", fontSize: 12, fontWeight: 600,
                          borderLeft: journalDate === todayKey ? `3px solid ${T.accent}` : "3px solid transparent",
                        }}
                      >✏️ Aujourd'hui</button>
                    )}
                    {entryDates.map(([dk, text]) => {
                      const [ey, em, ed] = dk.split("-").map(Number);
                      const dateLabel = new Date(ey, em - 1, ed).toLocaleDateString(locale, { day: "numeric", month: "short" });
                      const preview = text.trim().slice(0, 40).replace(/\n/g, " ");
                      const isActive = journalDate === dk;
                      return (
                        <button
                          key={dk}
                          onClick={() => setJournalDate(dk)}
                          style={{
                            width: "100%", textAlign: "left", padding: "9px 14px",
                            border: "none", background: isActive ? T.accentLight : "transparent",
                            color: T.text, cursor: "pointer",
                            borderLeft: isActive ? `3px solid ${T.accent}` : "3px solid transparent",
                            borderBottom: T.border,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: isActive ? T.accent : T.text }}>
                            {dk === todayKey ? "Aujourd'hui" : dateLabel}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {preview || "…"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Main writing area ───────────────────── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* Header */}
                  <div style={{
                    background: T.panel,
                    borderRadius: T.radius,
                    border: T.border,
                    boxShadow: T.shadow,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}>
                    <button
                      onClick={() => { const d = new Date(jy, jm - 1, jd - 1); setJournalDate(formatDateKey(d)); }}
                      style={{ border: T.border, background: "transparent", borderRadius: T.radius, padding: "5px 10px", cursor: "pointer", color: T.muted, fontSize: 13 }}
                    >←</button>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" }}>
                        {isToday ? "📝 Aujourd'hui" : "📅 " + displayDate}
                      </div>
                      {!isToday && <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{displayDate}</div>}
                    </div>
                    <button
                      onClick={() => { const d = new Date(jy, jm - 1, jd + 1); setJournalDate(formatDateKey(d)); }}
                      disabled={journalDate >= todayKey}
                      style={{ border: T.border, background: "transparent", borderRadius: T.radius, padding: "5px 10px", cursor: journalDate >= todayKey ? "not-allowed" : "pointer", color: T.muted, fontSize: 13, opacity: journalDate >= todayKey ? 0.3 : 1 }}
                    >→</button>
                    {!isToday && (
                      <button
                        onClick={() => setJournalDate(todayKey)}
                        style={{ border: `1px solid ${T.accent}`, background: "transparent", borderRadius: T.radius, padding: "5px 12px", cursor: "pointer", color: T.accent, fontSize: 12, fontWeight: 700 }}
                      >Aujourd'hui</button>
                    )}
                  </div>

                  {/* Writing area */}
                  <div style={{
                    background: T.panel,
                    borderRadius: T.radius,
                    border: T.border,
                    boxShadow: T.shadow,
                    padding: "20px 24px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <textarea
                      key={journalDate}
                      defaultValue={journalEntries[journalDate] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJournalEntries((prev) => {
                          if (!val.trim()) { const n = { ...prev }; delete n[journalDate]; return n; }
                          return { ...prev, [journalDate]: val };
                        });
                      }}
                      placeholder={isToday
                        ? "Raconte ta journée… Qu'est-ce que tu as fait ? Comment tu te sens ? Ce que tu as appris, accompli, ou raté."
                        : "Rien d'écrit pour ce jour. Tu peux écrire rétrospectivement."}
                      style={{
                        flex: 1,
                        minHeight: 400,
                        resize: "none",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: T.text,
                        fontSize: 15,
                        lineHeight: 1.8,
                        fontFamily: T.fontFamily,
                        padding: 0,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                    {/* Footer: word count + tracker statuses for that day */}
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: T.border, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, opacity: 0.35, fontWeight: 500 }}>
                        {(journalEntries[journalDate] ?? "").trim().split(/\s+/).filter(Boolean).length} mots
                      </span>
                      {/* Tracker status chips for that day */}
                      {habitTrackers.map((tracker) => {
                        const color = trackerDayColors[tracker.id]?.[journalDate];
                        const note = trackerDayNotes[tracker.id]?.[journalDate];
                        if (!color && !note) return null;
                        return (
                          <span key={tracker.id} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: color ? color + "22" : T.accentLight,
                            border: `1px solid ${color ?? T.accent}44`,
                            borderRadius: 20,
                            padding: "2px 9px",
                            fontSize: 11, fontWeight: 600,
                            color: T.text,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color ?? tracker.accentColor, display: "inline-block" }} />
                            {tracker.name}
                            {note && <span style={{ opacity: 0.55 }}>· {note.slice(0, 20)}{note.length > 20 ? "…" : ""}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* ── Multi-tracker calendar view ───────────────────────── */
          <div style={{ color: T.text }}>

            {/* ── Global fixed popup: color picker + note ─────────── */}
            {coloringCell && (() => {
              const activeTracker = habitTrackers.find((t) => t.id === coloringCell.trackerId);
              const trackerColors = trackerDayColors[coloringCell.trackerId] ?? {};
              const cellColor = trackerColors[coloringCell.dateKey] ?? null;
              const currentNote = trackerDayNotes[coloringCell.trackerId]?.[coloringCell.dateKey] ?? "";
              const COLOR_PRESETS: Array<{ color: string | null; label: string; title: string }> = [
                { color: "#2d7a40", label: "✓", title: "Réussi" },
                { color: "#c0392b", label: "✗", title: "Raté" },
                { color: "#d68910", label: "~", title: "Partiel" },
                { color: "#707080", label: "—", title: "Neutre" },
                { color: null, label: "×", title: "Effacer" },
              ];
              // Clamp position to stay inside viewport
              const popW = 220; const popH = 190;
              const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
              const vh = typeof window !== "undefined" ? window.innerHeight : 800;
              const px = Math.min(Math.max(coloringCell.x - popW / 2, 8), vw - popW - 8);
              const py = coloringCell.y + 12 + popH > vh ? coloringCell.y - popH - 8 : coloringCell.y + 12;
              return (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setColoringCell(null)} />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "fixed",
                      left: px,
                      top: py,
                      zIndex: 9999,
                      background: T.panel,
                      border: T.border,
                      borderRadius: T.radius,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
                      padding: "10px 12px",
                      width: popW,
                    }}
                  >
                    {/* Header */}
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 8, letterSpacing: "0.04em" }}>
                      {activeTracker?.name} — {coloringCell.dateKey.slice(8)} {calendarData.monthLabel.split(" ")[0]}
                    </div>
                    {/* Color presets row */}
                    <div style={{ display: "flex", gap: 5, marginBottom: 8, alignItems: "center" }}>
                      {COLOR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          title={preset.title}
                          onClick={() => setTrackerDayColor(coloringCell.trackerId, coloringCell.dateKey, preset.color)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: Math.max(T.radius - 2, 3),
                            border: cellColor === preset.color
                              ? `2px solid ${T.accent}`
                              : preset.color === null ? T.border : "2px solid transparent",
                            background: preset.color ?? T.card,
                            cursor: "pointer",
                            color: preset.color ? "rgba(255,255,255,0.95)" : T.text,
                            fontSize: 13,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >{preset.label}</button>
                      ))}
                      {/* Custom color */}
                      <label
                        title="Couleur libre"
                        style={{
                          width: 30, height: 30,
                          borderRadius: Math.max(T.radius - 2, 3),
                          border: T.border,
                          background: (cellColor && !COLOR_PRESETS.some(p => p.color === cellColor)) ? cellColor : T.card,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, color: T.muted, position: "relative",
                        }}
                      >
                        🎨
                        <input type="color" defaultValue={cellColor ?? "#3b7a50"}
                          onChange={(e) => setTrackerDayColor(coloringCell.trackerId, coloringCell.dateKey, e.target.value)}
                          style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                      </label>
                    </div>
                    {/* Note textarea */}
                    <textarea
                      value={currentNote}
                      onChange={(e) => setTrackerDayNote(coloringCell.trackerId, coloringCell.dateKey, e.target.value)}
                      placeholder="Note du jour…"
                      rows={3}
                      style={{
                        width: "100%",
                        resize: "none",
                        background: T.card,
                        border: T.border,
                        borderRadius: Math.max(T.radius - 2, 3),
                        color: T.text,
                        padding: "7px 9px",
                        fontSize: 12,
                        fontFamily: T.fontFamily,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {/* Close button */}
                    <button
                      onClick={() => setColoringCell(null)}
                      style={{ marginTop: 6, width: "100%", border: T.border, background: "transparent", color: T.muted, borderRadius: Math.max(T.radius - 2, 3), padding: "5px 0", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                    >Fermer</button>
                  </div>
                </>
              );
            })()}

            {/* Top bar: month nav + add tracker */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 20,
            }}>
              {/* Month navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setCalendarOffset((v) => v - 1)}
                  style={{ border: T.border, background: "transparent", borderRadius: T.radius, padding: "5px 10px", cursor: "pointer", color: T.muted, fontSize: 13 }}
                >←</button>
                <span style={{ fontWeight: 700, fontSize: 15, minWidth: 160, textAlign: "center" }}>
                  {calendarData.monthLabel}
                </span>
                <button
                  onClick={() => setCalendarOffset((v) => v + 1)}
                  style={{ border: T.border, background: "transparent", borderRadius: T.radius, padding: "5px 10px", cursor: "pointer", color: T.muted, fontSize: 13 }}
                >→</button>
                <button
                  onClick={() => setCalendarOffset(0)}
                  style={{ border: T.border, background: T.card, borderRadius: T.radius, padding: "5px 12px", cursor: "pointer", color: T.text, fontSize: 12, fontWeight: 600, boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow }}
                >{t("today")}</button>
              </div>

              {/* Add tracker button */}
              {!addingTracker && (
                <button
                  onClick={() => setAddingTracker(true)}
                  style={{ border: `1px solid ${T.accent}`, background: "transparent", borderRadius: T.radius, padding: "6px 14px", cursor: "pointer", color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow }}
                >+ Nouveau traceur</button>
              )}
            </div>

            {/* Tracker cards grid — wrapped in DndContext for drag-to-reorder */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  reorderTrackers(String(active.id), String(over.id));
                }
              }}
            >
              <SortableContext items={habitTrackers.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                  alignItems: "start",
                }}>
                  {habitTrackers.map((tracker) => {
                    const trackerColors = trackerDayColors[tracker.id] ?? {};
                    const trackerNotes = trackerDayNotes[tracker.id] ?? {};
                    const daysColored = Object.keys(trackerColors).length;
                    const DOW_LABELS = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];
                    const isSelectMode = multiSelectTracker === tracker.id;
                    const selection = selectedDays[tracker.id] ?? [];
                    const MULTI_PRESETS: Array<{ color: string | null; label: string; bg: string }> = [
                      { color: "#2d7a40", label: "✓", bg: "#2d7a40" },
                      { color: "#c0392b", label: "✗", bg: "#c0392b" },
                      { color: "#d68910", label: "~", bg: "#d68910" },
                      { color: "#707080", label: "—", bg: "#707080" },
                      { color: null,      label: "×", bg: "transparent" },
                    ];

                    return (
                      <SortableTrackerWrapper key={tracker.id} id={tracker.id}>
                        {(dragHandleProps, isDragging) => (
                          <div
                            style={{
                              background: T.panel,
                              borderRadius: T.radius,
                              border: isDragging ? `2px solid ${T.accent}` : isSelectMode ? `2px solid ${tracker.accentColor}` : T.border,
                              padding: 16,
                              boxShadow: isDragging ? "0 12px 32px rgba(0,0,0,0.3)" : T.shadow,
                              position: "relative",
                            }}
                          >
                            {/* Tracker header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                              {/* Drag handle — hidden in select mode */}
                              {!isSelectMode && (
                                <span
                                  {...dragHandleProps}
                                  style={{ cursor: "grab", opacity: 0.3, fontSize: 14, lineHeight: 1, flexShrink: 0, userSelect: "none", touchAction: "none" }}
                                  title="Glisser pour réorganiser"
                                >⠿</span>
                              )}

                              {/* Color dot */}
                              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: tracker.accentColor, flexShrink: 0 }} />

                              {/* Name (editable) */}
                              {editingTrackerId === tracker.id ? (
                                <input autoFocus value={editingTrackerName}
                                  onChange={(e) => setEditingTrackerName(e.target.value)}
                                  onBlur={() => saveTrackerName(tracker.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); saveTrackerName(tracker.id); }
                                    if (e.key === "Escape") { e.preventDefault(); setEditingTrackerId(null); }
                                  }}
                                  style={{ flex: 1, fontSize: 13, fontWeight: 700, background: T.card, border: T.border, borderRadius: T.radius, color: T.text, padding: "2px 8px", fontFamily: T.fontFamily }}
                                />
                              ) : (
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, cursor: isSelectMode ? "default" : "text" }}
                                  onClick={() => { if (!isSelectMode) { setEditingTrackerId(tracker.id); setEditingTrackerName(tracker.name); } }}
                                  title={isSelectMode ? "" : "Cliquer pour renommer"}
                                >{tracker.name}</span>
                              )}

                              {/* Select count badge */}
                              {isSelectMode && selection.length > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, background: tracker.accentColor, color: "#fff", borderRadius: 10, padding: "1px 7px" }}>
                                  {selection.length}
                                </span>
                              )}

                              {/* Stats — hidden in select mode */}
                              {!isSelectMode && <span style={{ fontSize: 10, opacity: 0.4, fontWeight: 500 }}>{daysColored}j</span>}

                              {/* Multi-select toggle */}
                              <button
                                onClick={() => {
                                  if (isSelectMode) exitMultiSelect();
                                  else { setMultiSelectTracker(tracker.id); setSelectedDays((p) => ({ ...p, [tracker.id]: [] })); setColoringCell(null); }
                                }}
                                style={{
                                  border: isSelectMode ? `1px solid ${tracker.accentColor}` : T.border,
                                  background: isSelectMode ? tracker.accentColor : "transparent",
                                  color: isSelectMode ? "#fff" : T.muted,
                                  borderRadius: Math.max(T.radius - 2, 3),
                                  padding: "2px 7px",
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  lineHeight: 1.4,
                                  flexShrink: 0,
                                }}
                                title={isSelectMode ? "Quitter la sélection" : "Sélection multiple"}
                              >{isSelectMode ? "✕ quitter" : "⊞"}</button>

                              {/* Accent color picker — hidden in select mode */}
                              {!isSelectMode && (
                                <label style={{ cursor: "pointer", opacity: 0.35, fontSize: 12, position: "relative" }} title="Couleur du traceur">
                                  ●
                                  <input type="color" value={tracker.accentColor}
                                    onChange={(e) => setHabitTrackers((prev) => prev.map((x) => x.id === tracker.id ? { ...x, accentColor: e.target.value } : x))}
                                    style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                                </label>
                              )}

                              {/* Delete — hidden in select mode */}
                              {!isSelectMode && (
                                <button onClick={() => deleteHabitTracker(tracker.id)}
                                  style={{ border: "none", background: "transparent", cursor: "pointer", color: T.muted, fontSize: 13, padding: "0 2px", opacity: 0.35, lineHeight: 1 }}
                                  title="Supprimer">✕</button>
                              )}
                            </div>

                            {/* Day-of-week labels */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
                              {DOW_LABELS.map((d) => (
                                <div key={d} style={{ fontSize: 9, opacity: 0.4, textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                  {d.slice(0, 1)}
                                </div>
                              ))}
                            </div>

                            {/* Day cells */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                              {calendarData.cells.map((cell) => {
                                const dateKey = cell.day
                                  ? formatDateKey(new Date(calendarData.year, calendarData.month, cell.day))
                                  : null;
                                const cellColor = dateKey ? trackerColors[dateKey] : null;
                                const hasNote = dateKey ? !!trackerNotes[dateKey] : false;
                                const isPickerOpen = coloringCell?.trackerId === tracker.id && coloringCell?.dateKey === dateKey;
                                const isChecked = isSelectMode && dateKey ? selection.includes(dateKey) : false;

                                return (
                                  <div
                                    key={cell.key}
                                    style={{
                                      aspectRatio: "1",
                                      borderRadius: Math.max(T.radius - 4, 2),
                                      background: !cell.day ? "transparent" : cellColor ?? T.card,
                                      border: cell.day
                                        ? isChecked
                                          ? `2px solid ${tracker.accentColor}`
                                          : isPickerOpen
                                            ? `2px solid ${T.accent}`
                                            : T.border
                                        : "none",
                                      cursor: cell.day ? "pointer" : "default",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: cellColor ? "rgba(255,255,255,0.92)" : T.text,
                                      position: "relative",
                                      transition: "border 80ms, box-shadow 80ms",
                                      boxShadow: isChecked ? `0 0 0 2px ${tracker.accentColor}44` : "none",
                                      outline: "none",
                                    }}
                                    onClick={(e) => {
                                      if (!cell.day || !dateKey) return;
                                      if (isSelectMode) {
                                        toggleDaySelection(tracker.id, dateKey);
                                      } else {
                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                        setColoringCell(isPickerOpen ? null : {
                                          trackerId: tracker.id,
                                          dateKey,
                                          x: rect.left + rect.width / 2,
                                          y: rect.bottom + 6,
                                        });
                                      }
                                    }}
                                  >
                                    {/* Checkmark overlay in select mode */}
                                    {isSelectMode && isChecked ? (
                                      <span style={{ fontSize: 10, color: cellColor ? "rgba(255,255,255,0.95)" : tracker.accentColor, fontWeight: 900 }}>✓</span>
                                    ) : (
                                      cell.day ?? ""
                                    )}
                                    {/* Note dot */}
                                    {!isSelectMode && hasNote && (
                                      <span style={{ position: "absolute", bottom: 2, right: 2, width: 4, height: 4, borderRadius: "50%", background: cellColor ? "rgba(255,255,255,0.7)" : T.accent }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* ── Multi-select color toolbar ────────────────── */}
                            {isSelectMode && (
                              <div style={{
                                marginTop: 10,
                                padding: "8px 10px",
                                borderRadius: Math.max(T.radius - 2, 3),
                                background: T.card,
                                border: T.border,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap",
                              }}>
                                <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, marginRight: 2 }}>
                                  {selection.length === 0 ? "Sélectionnez des jours" : `${selection.length} jour${selection.length > 1 ? "s" : ""} — appliquer :`}
                                </span>
                                {MULTI_PRESETS.map((p, i) => (
                                  <button
                                    key={i}
                                    title={p.label}
                                    disabled={selection.length === 0}
                                    onClick={() => applyColorToSelection(tracker.id, p.color)}
                                    style={{
                                      width: 28, height: 28,
                                      borderRadius: Math.max(T.radius - 3, 2),
                                      border: p.color === null ? T.border : "none",
                                      background: p.bg,
                                      color: p.color ? "rgba(255,255,255,0.95)" : T.text,
                                      cursor: selection.length === 0 ? "not-allowed" : "pointer",
                                      fontSize: 13, fontWeight: 700,
                                      opacity: selection.length === 0 ? 0.4 : 1,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      transition: "opacity 120ms",
                                    }}
                                  >{p.label}</button>
                                ))}
                                {/* Custom color for multi */}
                                <label
                                  title="Couleur libre"
                                  style={{
                                    width: 28, height: 28,
                                    borderRadius: Math.max(T.radius - 3, 2),
                                    border: T.border,
                                    background: T.card,
                                    cursor: selection.length === 0 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, color: T.muted, position: "relative",
                                    opacity: selection.length === 0 ? 0.4 : 1,
                                  }}
                                >
                                  🎨
                                  <input type="color" defaultValue="#3b7a50"
                                    disabled={selection.length === 0}
                                    onChange={(e) => applyColorToSelection(tracker.id, e.target.value)}
                                    style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                                </label>
                                {/* Select all button */}
                                <button
                                  onClick={() => {
                                    const allDays = calendarData.cells
                                      .filter((c) => c.day !== null)
                                      .map((c) => formatDateKey(new Date(calendarData.year, calendarData.month, c.day!)));
                                    const allSelected = allDays.every((dk) => selection.includes(dk));
                                    setSelectedDays((p) => ({ ...p, [tracker.id]: allSelected ? [] : allDays }));
                                  }}
                                  style={{
                                    marginLeft: "auto",
                                    border: T.border, background: "transparent", color: T.muted,
                                    borderRadius: Math.max(T.radius - 3, 2), padding: "3px 8px",
                                    cursor: "pointer", fontSize: 10, fontWeight: 600,
                                  }}
                                >
                                  {calendarData.cells.filter(c => c.day).every(c => {
                                    const dk = formatDateKey(new Date(calendarData.year, calendarData.month, c.day!));
                                    return selection.includes(dk);
                                  }) ? "Tout désélect." : "Tout sélect."}
                                </button>
                              </div>
                            )}

                            {/* Accent bar at bottom */}
                            <div style={{ marginTop: 12, height: 2, borderRadius: 1, background: tracker.accentColor, opacity: 0.4 }} />
                          </div>
                        )}
                      </SortableTrackerWrapper>
                    );
                  })}

              {/* Add tracker form / button */}
              {addingTracker ? (
                <div style={{
                  background: T.panel,
                  borderRadius: T.radius,
                  border: T.border,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: T.shadow,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>Nouveau traceur</div>
                  <input
                    autoFocus
                    value={newTrackerName}
                    onChange={(e) => setNewTrackerName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHabitTracker(); } if (e.key === "Escape") { e.preventDefault(); setAddingTracker(false); } }}
                    placeholder="Nom du traceur (ex: Sport, Lecture…)"
                    style={{ padding: "8px 12px", borderRadius: T.radius, border: T.border, background: T.card, color: T.text, fontSize: 14, fontFamily: T.fontFamily }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 12, opacity: 0.6, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <span>Couleur :</span>
                      <input
                        type="color"
                        value={newTrackerColor}
                        onChange={(e) => setNewTrackerColor(e.target.value)}
                        style={{ width: 32, height: 26, borderRadius: 4, border: T.border, cursor: "pointer", padding: 1 }}
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={addHabitTracker}
                      style={{ flex: 1, border: `1px solid ${T.accent}`, background: "transparent", color: T.accent, borderRadius: T.radius, padding: "8px 0", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: T.buttonShadow === "none" ? undefined : T.buttonShadow }}
                    >Créer</button>
                    <button
                      onClick={() => setAddingTracker(false)}
                      style={{ border: T.border, background: "transparent", color: T.muted, borderRadius: T.radius, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
                    >{t("cancel")}</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTracker(true)}
                  style={{
                    background: "transparent",
                    border: `1px dashed ${T.accent}55`,
                    borderRadius: T.radius,
                    padding: "32px 16px",
                    cursor: "pointer",
                    color: T.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: T.fontFamily,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18, opacity: 0.5 }}>+</span>
                  Nouveau traceur
                </button>
              )}
                </div>
              </SortableContext>
            </DndContext>
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
          {/* Day color picker */}
          {calendarSelectedDate && (() => {
            const selectedKey = formatDateKey(calendarSelectedDate);
            const currentColor = dayColors[selectedKey];
            const DAY_COLOR_PRESETS: Array<{ color: string; label: string } | null> = [
              { color: "#2a6e38", label: "Green" },
              { color: "#8a2424", label: "Red" },
              { color: "#7a5c14", label: "Amber" },
              { color: "#245080", label: "Blue" },
              { color: "#582a80", label: "Purple" },
              { color: "#7a3a18", label: "Orange" },
              null,
            ];
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Day color</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DAY_COLOR_PRESETS.map((preset, _idx) =>
                    preset === null ? (
                      <button
                        key="clear"
                        type="button"
                        onClick={() => {
                          setDayColors((prev) => {
                            const next = { ...prev };
                            delete next[selectedKey];
                            return next;
                          });
                        }}
                        style={{
                          width: 28, height: 28,
                          borderRadius: 4,
                          border: T.border,
                          background: T.card,
                          cursor: "pointer",
                          color: T.muted,
                          fontSize: 12,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: currentColor ? 1 : 0.4,
                        }}
                        title="Clear color"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setDayColors((prev) => ({ ...prev, [selectedKey]: preset.color }))}
                        style={{
                          width: 28, height: 28,
                          borderRadius: 4,
                          background: preset.color,
                          border: currentColor === preset.color
                            ? "2px solid rgba(255,255,255,0.8)"
                            : "2px solid transparent",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                        title={preset.label}
                      />
                    )
                  )}
                  {/* Native color input for custom color */}
                  <label
                    style={{
                      width: 28, height: 28,
                      borderRadius: 4,
                      border: T.border,
                      background: T.card,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, overflow: "hidden",
                    }}
                    title="Custom color"
                  >
                    <span style={{ opacity: 0.6 }}>+</span>
                    <input
                      type="color"
                      defaultValue={currentColor ?? "#444466"}
                      onChange={(e) => setDayColors((prev) => ({ ...prev, [selectedKey]: e.target.value }))}
                      style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                    />
                  </label>
                </div>
              </div>
            );
          })()}

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
                      e.dateKey === formatDateKey(calendarSelectedDate)
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
                    e.dateKey === formatDateKey(calendarSelectedDate)
                  ).length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{t("noEventsForDay")}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>
        </Modal>

        <Modal
          open={codeLegendUnlockModalOpen}
          title={t("unlockCodeLegend")}
          onClose={() => setCodeLegendUnlockModalOpen(false)}
          theme={T}
          closeLabel={t("close")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              unlockCodeLegend();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ fontSize: 12, opacity: 0.72 }}>{t("codedPassword")}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{t("codedPasswordHint")}</div>
            <input
              value={codedLegendPassword}
              onChange={(e) => {
                setCodedLegendPassword(e.target.value);
                if (codeLegendError) setCodeLegendError("");
              }}
              placeholder={t("codedPasswordPlaceholder")}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: T.border,
                background: T.card,
                color: T.text,
                boxSizing: "border-box",
                fontFamily: '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
                letterSpacing: "0.08em",
              }}
            />
            {codeLegendError ? (
              <div style={{ fontSize: 12, color: "rgb(248, 113, 113)" }}>{codeLegendError}</div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setCodeLegendUnlockModalOpen(false)}
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
                {t("cancel")}
              </button>
              <button
                type="submit"
                style={{
                  border: T.border,
                  background: T.card,
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 800,
                  color: T.text,
                }}
              >
                {t("unlock")}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          open={codeLegendModalOpen}
          title={t("codeLegend")}
          onClose={() => setCodeLegendModalOpen(false)}
          theme={T}
          closeLabel={t("close")}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, opacity: 0.72 }}>{t("codeLegendHint")}</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {CODE_MAP_ENTRIES.map(([code, letter]) => (
                <div
                  key={`${code}-${letter}`}
                  style={{
                    border: T.border,
                    background: T.card,
                    borderRadius: 14,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
                      fontWeight: 900,
                    }}
                  >
                    {code}
                  </span>
                  <span style={{ opacity: 0.55 }}>=</span>
                  <span style={{ fontWeight: 800 }}>{letter}</span>
                </div>
              ))}
            </div>
          </div>
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
