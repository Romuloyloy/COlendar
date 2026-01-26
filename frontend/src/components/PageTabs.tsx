import React, { useEffect, useState } from "react";
import type { Page } from "../types";
import { apiGet, apiPost } from "../api";

export function PageTabs(props: {
  profileId: number;
  value: Page | null;
  onChange: (p: Page) => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState("");

  async function refresh() {
    const list = await apiGet<Page[]>(`/profiles/${props.profileId}/pages`);
    setPages(list);
    if (!props.value && list.length > 0) props.onChange(list[0]);
  }

  useEffect(() => {
    refresh().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.profileId]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="tabs">
          {pages.map((p) => (
            <button
              key={p.id}
              className={`tab ${props.value?.id === p.id ? "active" : ""}`}
              onClick={() => props.onChange(p)}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="row">
          <input
            className="input"
            value={title}
            placeholder="New page title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className="btn"
            onClick={async () => {
              const t = title.trim();
              if (!t) return;
              const created = await apiPost<Page>("/pages", {
                profile_id: props.profileId,
                title: t,
                order_index: pages.length,
              });
              setTitle("");
              await refresh();
              props.onChange(created);
            }}
          >
            Add page
          </button>
        </div>
      </div>
    </div>
  );
}
