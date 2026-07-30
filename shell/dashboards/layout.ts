import { DashboardWidgetInstance } from '@shell/types/dashboards';

/** Number of columns every dashboard grid is divided into */
export const GRID_COLUMNS = 12;
/** Height of a single grid row, in pixels */
export const GRID_ROW_HEIGHT = 56;
/** Gutter between widgets, in pixels */
export const GRID_GUTTER = 12;

export function overlaps(a: DashboardWidgetInstance, b: DashboardWidgetInstance): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function byPosition(a: DashboardWidgetInstance, b: DashboardWidgetInstance): number {
  return a.y - b.y || a.x - b.x;
}

/**
 * Pull every widget as far up as it will go without colliding, so the grid never
 * ends up with holes above a widget once something is moved or removed.
 */
export function compact(widgets: DashboardWidgetInstance[]): DashboardWidgetInstance[] {
  const placed: DashboardWidgetInstance[] = [];

  [...widgets].sort(byPosition).forEach((widget) => {
    const next = { ...widget };

    while (next.y > 0 && !placed.some((p) => overlaps(p, { ...next, y: next.y - 1 }))) {
      next.y--;
    }

    placed.push(next);
  });

  return placed;
}

/**
 * Place `moved` at its new position and push anything it now sits on top of down
 * out of the way. Everything else keeps its relative order.
 */
export function resolveCollisions(widgets: DashboardWidgetInstance[], moved: DashboardWidgetInstance): DashboardWidgetInstance[] {
  const placed: DashboardWidgetInstance[] = [{ ...moved }];
  const others = widgets.filter((w) => w.id !== moved.id).sort(byPosition);

  others.forEach((widget) => {
    const next = { ...widget };
    let guard = 0;

    let hit = placed.find((p) => overlaps(p, next));

    while (hit && guard++ < 100) {
      next.y = hit.y + hit.h;
      hit = placed.find((p) => overlaps(p, next));
    }

    placed.push(next);
  });

  return placed;
}

/** Clamp a widget so it stays inside the grid */
export function clampToGrid(widget: DashboardWidgetInstance): DashboardWidgetInstance {
  const w = Math.max(1, Math.min(GRID_COLUMNS, widget.w));

  return {
    ...widget,
    w,
    h: Math.max(1, widget.h),
    x: Math.max(0, Math.min(GRID_COLUMNS - w, widget.x)),
    y: Math.max(0, widget.y),
  };
}

/** Number of rows the given layout occupies */
export function gridRows(widgets: DashboardWidgetInstance[]): number {
  return widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
}

/** First free position for a widget of the given size */
export function firstFreeSlot(widgets: DashboardWidgetInstance[], w: number, h: number): { x: number, y: number } {
  const maxY = gridRows(widgets);

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= GRID_COLUMNS - w; x++) {
      const candidate = {
        id: '', type: '', config: {}, x, y, w, h
      };

      if (!widgets.some((existing) => overlaps(existing, candidate))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: maxY };
}
