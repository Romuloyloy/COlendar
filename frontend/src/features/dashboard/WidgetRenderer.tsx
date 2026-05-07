import type {
  DashboardWidgetDefinition,
  DashboardWidgetProps,
} from "./widget-types";

export function WidgetRenderer({
  definition,
  props,
}: {
  definition: DashboardWidgetDefinition;
  props: DashboardWidgetProps;
}) {
  const Widget = definition.component;

  return <Widget {...props} />;
}
