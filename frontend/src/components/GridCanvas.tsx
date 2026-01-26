import React, { useEffect, useMemo, useState } from "react";
import GridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout"; // type-only import (safe)

import type { Page, Widget } from "../types";
import { apiGet, apiPost } from "../api";
import { useMeasureWidth } from "../hooks/useMeasureWidth";
import { getWidgetDef } from "../widgets/registry";

function widgetToLayoutItem(w: Widget): Layout {
  return { i: String(w.id), x: w.x, y: w.y, w: w.w, h: w.h };
}

export function GridCanvas(props: { page: Page }) {
  const { ref, width } = useMeasureWidth<HTMLDivElement>();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saving, setSaving] = useState<string>("");

  async function refresh() {
    const list = await apiGet<Widget[]>(`/pages/${props.page.id}/widgets`);
    setWidgets(list);
  }

  useEffect(() => {
    refresh().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.page.id]);

  const layout = useMemo(() => widgets.map(widgetToLayoutItem), [widgets]);

  // Basic v1 rule: 4 columns fixed, rowHeight fixed.
  const cols = 4;
  const rowHeight = 150;
  const margin: [number, number] = [10, 10];

  async function addNote() {
    const def = getWidgetDef("note");
    // naive placement: put at top-left; RGL will compact it down if occupied
    const created = await apiPost<Widget>("/widgets", {
      page_id: props.page.id,
      type: def.type,
      title: def.defaultTitle,
      x: 0,
      y: 0,
      w: def.defaultW,
      h: def.defaultH,
      config_json: JSON.stringify(def.defaultConfig()),
    });
    setWidgets((prev) => [...prev, created]);
  }

  function updateWidgetLocal(id: number, patch: Partial<Widget>) {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  // v1: We only persist layout changes by creating a "layout snapshot" behavior later.
  // For now: keep layout in state only (so it’s usable), and you can add a PUT route later.
  // If you want persistence now, add a backend PUT /widgets/{id} endpoint.
  function onLayoutChange(next: Layout[]) {
    // Update local positions/sizes
    for (const li of next) {
      const id = Number(li.i);
      updateWidgetLocal(id, { x: li.x, y: li.y, w: li.w, h: li.h });
    }
  }

  async function updateConfig(widget: Widget, nextConfigObj: unknown) {
    // v1 persistence for config also needs PUT endpoint.
    // For now, we store locally so you can build UX immediately.
    updateWidgetLocal(widget.id, { config_json: JSON.stringify(nextConfigObj) });
    setSaving("config changed (not persisted yet)");
    window.setTimeout(() => setSaving(""), 1200);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700 }}>Page: {props.page.title}</div>
        <div className="row">
          <button className="btn primary" onClick={addNote}>
            + Note
          </button>
          <span className="small">
            width: {width}px • grid: 4×4 • {saving}
          </span>
        </div>
      </div>

      <div ref={ref} className="gridWrap">
        <GridLayout
          width={width}
          cols={cols}
          rowHeight={rowHeight}
          margin={margin}
          compactType="vertical"
          preventCollision={false}
          layout={layout}
          onLayoutChange={onLayoutChange}
          isResizable={true}
          isDraggable={true}
        >
          {widgets.map((w) => {
            const def = getWidgetDef(w.type);
            return (
              <div key={String(w.id)} className="rglItem">
                <div className="widgetFrame">
                  <div className="widgetHeader">
                    <div className="widgetTitle">{w.title || def.displayName}</div>
                    <div className="small">{def.type}</div>
                  </div>
                  <div className="widgetBody">
                    <def.Render
                      widget={w}
                      onUpdateConfig={(cfg) => updateConfig(w, cfg)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </GridLayout>
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        v1 note: layout/config persistence needs a backend PUT endpoint (easy next step).
      </div>
    </div>
  );
}
