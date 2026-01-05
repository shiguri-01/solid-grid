import type { GridPlugin } from "../plugin";

type EditingPluginOptions = {
  triggerKeys?: string[];
};

/** Starts editing via double click or configured keys. */
export function editingPlugin<T>(
  options: EditingPluginOptions = {},
): GridPlugin<T> {
  const triggerKeys = options.triggerKeys ?? ["Enter"];
  return {
    name: "editing",
    onEvent(ev, api) {
      if (ev.type === "cell:dblclick") {
        if (api.isEditing()) return true;
        api.beginEdit(ev.pos);
        return true;
      }

      if (ev.type === "key:down") {
        const e = ev.e;
        if (e.isComposing || api.isEditing()) return;
        if (!triggerKeys.includes(e.key)) return;

        const ac = api.activeCell();
        if (!ac) return true;

        e.preventDefault();
        api.beginEdit(ac);
        return true;
      }
    },
  };
}
