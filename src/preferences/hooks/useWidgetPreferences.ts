/**
 * useWidgetPreferences Hook
 *
 * React hook for widget-specific preferences management
 */

import { useWidgetPreferencesContext } from '../context/PreferencesContext.js';
import type {
  WidgetPreferences,
  WidgetPreferencesUpdatePayload,
  WidgetPosition,
} from '../types.js';

/**
 * Widget preferences hook return value
 */
export interface UseWidgetPreferencesReturn {
  /** Get widget preferences */
  getWidgetPreferences: (widgetId: string) => WidgetPreferences | null;
  /** Update widget preferences */
  updateWidgetPreferences: (
    widgetId: string,
    updates: WidgetPreferencesUpdatePayload
  ) => Promise<void>;
  /** Toggle widget visibility */
  toggleWidgetVisibility: (widgetId: string) => Promise<void>;
  /** Update widget position */
  updateWidgetPosition: (widgetId: string, position: WidgetPosition) => Promise<void>;
  /** Update widget settings */
  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) => Promise<void>;
}

/**
 * Hook for widget-specific preferences management
 *
 * @example
 * ```tsx
 * function CalendarWidget({ widgetId }: { widgetId: string }) {
 *   const {
 *     getWidgetPreferences,
 *     updateWidgetSettings,
 *     toggleWidgetVisibility
 *   } = useWidgetPreferences();
 *
 *   const prefs = getWidgetPreferences(widgetId);
 *
 *   if (!prefs?.visible) return null;
 *
 *   return (
 *     <div>
 *       <h2>Calendar Widget</h2>
 *       <button onClick={() => toggleWidgetVisibility(widgetId)}>
 *         Hide Widget
 *       </button>
 *       <button onClick={() => updateWidgetSettings(widgetId, { showWeekends: false })}>
 *         Hide Weekends
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWidgetPreferences(): UseWidgetPreferencesReturn {
  const context = useWidgetPreferencesContext();

  return {
    getWidgetPreferences: context.getWidgetPreferences,
    updateWidgetPreferences: context.updateWidgetPreferences,
    toggleWidgetVisibility: context.toggleWidgetVisibility,
    updateWidgetPosition: context.updateWidgetPosition,
    updateWidgetSettings: context.updateWidgetSettings,
  };
}
