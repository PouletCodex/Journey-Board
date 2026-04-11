import type { Task, CalendarEvent } from '../constants';

interface ExportData {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  completedDays: string[];
  exportedAt: string;
  appVersion: string;
}

/**
 * Export tasks and calendar events as JSON
 */
export function exportData(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  completedDays: string[]
): string {
  const data: ExportData = {
    tasks,
    calendarEvents,
    completedDays,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import tasks and calendar events from JSON
 */
export function importData(jsonString: string): ExportData | null {
  try {
    const data = JSON.parse(jsonString) as unknown;

    if (!isValidExportData(data)) {
      console.error('Invalid export data format');
      return null;
    }

    return data as ExportData;
  } catch (error) {
    console.error('Failed to parse export data:', error);
    return null;
  }
}

/**
 * Validate export data structure
 */
function isValidExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    Array.isArray(obj.tasks) &&
    Array.isArray(obj.calendarEvents) &&
    Array.isArray(obj.completedDays) &&
    typeof obj.exportedAt === 'string' &&
    typeof obj.appVersion === 'string'
  );
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: string, filename: string = 'journey-board-export.json') {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger file input to select a JSON file
 */
export function selectJSONFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(null);
      };

      reader.readAsText(file);
    };

    input.click();
  });
}
