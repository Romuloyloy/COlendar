import React, { useMemo } from "react";
import type { NoteConfig, Widget } from "../../types";
import { safeJsonParse } from "../../types";
import type { WidgetRenderProps } from "../registry";

export function NoteWidget({ widget, onUpdateConfig }: WidgetRenderProps) {
  const cfg = useMemo<NoteConfig>(
    () => safeJsonParse<NoteConfig>(widget.config_json, { text: "" }),
    [widget.config_json]
  );

  return (
    <textarea
      className="noteTextarea"
      value={cfg.text}
      placeholder="Write anything…"
      onChange={(e) => {
        onUpdateConfig({ ...cfg, text: e.target.value });
      }}
    />
  );
}
