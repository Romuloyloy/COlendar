import React, { useEffect, useState } from "react";
import type { Profile } from "../types";
import { apiGet, apiPost } from "../api";

export function ProfilePicker(props: {
  value: Profile | null;
  onChange: (p: Profile) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState("");

  async function refresh() {
    const list = await apiGet<Profile[]>("/profiles");
    setProfiles(list);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  return (
    <div className="card">
      <div className="row">
        <div style={{ fontWeight: 700 }}>Who are you?</div>
        <select
          className="select"
          value={props.value?.id ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const p = profiles.find((x) => x.id === id);
            if (p) props.onChange(p);
          }}
        >
          <option value="" disabled>
            Select profile…
          </option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="small">or create:</span>
        <input
          className="input"
          value={name}
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn primary"
          onClick={async () => {
            const trimmed = name.trim();
            if (!trimmed) return;
            const created = await apiPost<Profile>("/profiles", { name: trimmed });
            setName("");
            await refresh();
            props.onChange(created);
          }}
        >
          Create
        </button>
      </div>
    </div>
  );
}
