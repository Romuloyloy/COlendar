import type { Widget } from "../types";
import { NoteWidget } from "./note/NoteWidget";

export type WidgetRenderProps = {
  widget: Widget;
  onUpdateConfig: (nextConfigObj: unknown) => void;
};

export type WidgetDefinition = {
  type: string;
  displayName: string;
  defaultTitle: string;
  defaultW: number;
  defaultH: number;
  defaultConfig: () => unknown;
  Render: (props: WidgetRenderProps) => JSX.Element;
};

export const widgetRegistry: Record<string, WidgetDefinition> = {
  note: {
    type: "note",
    displayName: "Note",
    defaultTitle: "Note",
    defaultW: 2,
    defaultH: 2,
    defaultConfig: () => ({ text: "" }),
    Render: NoteWidget,
  },
};

export function getWidgetDef(type: string): WidgetDefinition {
  return widgetRegistry[type] ?? widgetRegistry["note"];
}
