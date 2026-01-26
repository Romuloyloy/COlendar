import React, { useState } from "react";
import type { Page, Profile } from "./types";
import { ProfilePicker } from "./components/ProfilePicker";
import { PageTabs } from "./components/PageTabs";
import { GridCanvas } from "./components/GridCanvas";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [page, setPage] = useState<Page | null>(null);

  return (
    <div className="container">
      <h1 style={{ margin: "6px 0 10px 0" }}>COlendar</h1>
      <div className="small" style={{ marginBottom: 14 }}>
        Super customizable 4×4 dashboard calendar.
      </div>

      <ProfilePicker
        value={profile}
        onChange={(p) => {
          setProfile(p);
          setPage(null);
        }}
      />

      {profile && (
        <div style={{ marginTop: 12 }}>
          <PageTabs
            profileId={profile.id}
            value={page}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}

      {page && (
        <div style={{ marginTop: 12 }}>
          <GridCanvas page={page} />
        </div>
      )}

      {!profile && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Quick start</div>
          <div className="small">
            Create a profile → add a page → add a Note widget → drag/resize.
          </div>
        </div>
      )}
    </div>
  );
}
