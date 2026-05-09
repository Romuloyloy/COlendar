"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_DASHBOARD_WIDGET_DEFINITIONS,
  getDashboardWidgetDefinition,
} from "./dashboard-widget-registry";
import {
  resetDashboardWidgetLayout,
  updateDashboardWidgetLayout,
} from "./api";
import type {
  DashboardWidgetLayout,
  DashboardWidgetPreference,
} from "./types";
import {
  AppButton,
  ErrorState,
  LoadingState,
  NoticeState,
} from "@/components/ui";

type DraftWidgetPreference = {
  widget_key: string;
  is_visible: boolean;
  config_json: Record<string, unknown>;
};

export function DashboardCustomizeModal({
  isOpen,
  layout,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  layout: DashboardWidgetLayout | null;
  onClose: () => void;
  onSaved: (layout: DashboardWidgetLayout) => void;
}) {
  const initialDraft = useMemo(() => createDraftLayout(layout), [layout]);
  const [draftWidgets, setDraftWidgets] = useState(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftWidgets(initialDraft);
      setError(null);
      setNotice(null);
    }
  }, [initialDraft, isOpen]);

  if (!isOpen) {
    return null;
  }

  function toggleWidget(widgetKey: string) {
    setDraftWidgets((current) =>
      current.map((widget) =>
        widget.widget_key === widgetKey
          ? { ...widget, is_visible: !widget.is_visible }
          : widget,
      ),
    );
  }

  function moveWidget(widgetKey: string, direction: -1 | 1) {
    setDraftWidgets((current) => {
      const index = current.findIndex((widget) => widget.widget_key === widgetKey);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [widget] = next.splice(index, 1);
      next.splice(nextIndex, 0, widget);
      return next;
    });
  }

  async function saveLayout() {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const savedLayout = await updateDashboardWidgetLayout({
        widgets: draftWidgets.map((widget) => ({
          widget_key: widget.widget_key,
          is_visible: widget.is_visible,
          config_json: widget.config_json,
        })),
      });
      onSaved(savedLayout);
      setNotice("Dashboard layout saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetLayout() {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const savedLayout = await resetDashboardWidgetLayout();
      onSaved(savedLayout);
      setDraftWidgets(createDraftLayout(savedLayout));
      setNotice("Dashboard layout reset to default.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#2c2925]/35 px-6 py-16 backdrop-blur-sm">
      <div className="sheet-floating-panel w-full max-w-3xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded6ca] px-5 py-4">
          <div>
            <p className="app-eyebrow">
              Dashboard Customization
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2c2925]">
              Arrange dashboard widgets
            </h2>
          </div>
          <AppButton
            className="min-h-8 px-3 py-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            Close
          </AppButton>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {error ? <ErrorState message={error} /> : null}
          {notice ? (
            <div className="mt-3">
              <NoticeState message={notice} />
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {draftWidgets.length === 0 ? (
              <LoadingState message="Loading dashboard widgets..." />
            ) : (
              draftWidgets.map((widget, index) => {
                const definition = getDashboardWidgetDefinition(widget.widget_key);
                if (!definition) {
                  return null;
                }

                return (
                  <div
                    className="flex flex-col gap-3 rounded-xl border border-[#ded6ca] bg-[#fffdf8]/72 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    key={widget.widget_key}
                  >
                    <label className="flex min-w-0 items-start gap-3">
                      <input
                        checked={widget.is_visible}
                        className="mt-1"
                        disabled={isSaving}
                        onChange={() => toggleWidget(widget.widget_key)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#2c2925]">
                          {definition.displayName}
                        </span>
                        <span className="app-muted mt-1 block text-xs leading-5">
                          {definition.description}
                        </span>
                      </span>
                    </label>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
                        disabled={isSaving || index === 0}
                        onClick={() => moveWidget(widget.widget_key, -1)}
                        type="button"
                      >
                        Move up
                      </button>
                      <button
                        className="app-button-secondary min-h-8 px-3 py-1.5 text-xs"
                        disabled={isSaving || index === draftWidgets.length - 1}
                        onClick={() => moveWidget(widget.widget_key, 1)}
                        type="button"
                      >
                        Move down
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ded6ca] px-5 py-4">
          <AppButton
            disabled={isSaving}
            onClick={resetLayout}
            type="button"
          >
            Reset to default
          </AppButton>
          <AppButton
            disabled={isSaving}
            onClick={saveLayout}
            variant="primary"
            type="button"
          >
            {isSaving ? "Saving..." : "Save layout"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function createDraftLayout(
  layout: DashboardWidgetLayout | null,
): DraftWidgetPreference[] {
  const validSavedWidgets = (layout?.widgets ?? [])
    .filter((widget) => getDashboardWidgetDefinition(widget.widget_key))
    .sort((left, right) => left.sort_order - right.sort_order);

  const draftWidgets: DraftWidgetPreference[] = validSavedWidgets.map((widget) =>
    draftFromPreference(widget),
  );
  const savedKeys = new Set(draftWidgets.map((widget) => widget.widget_key));

  for (const definition of DEFAULT_DASHBOARD_WIDGET_DEFINITIONS) {
    if (!savedKeys.has(definition.id)) {
      draftWidgets.push({
        widget_key: definition.id,
        is_visible: true,
        config_json: {},
      });
    }
  }

  if (draftWidgets.length > 0) {
    return draftWidgets;
  }

  return DEFAULT_DASHBOARD_WIDGET_DEFINITIONS.map((definition) => ({
    widget_key: definition.id,
    is_visible: true,
    config_json: {},
  }));
}

function draftFromPreference(
  preference: DashboardWidgetPreference,
): DraftWidgetPreference {
  return {
    widget_key: preference.widget_key,
    is_visible: preference.is_visible,
    config_json: preference.config_json ?? {},
  };
}
