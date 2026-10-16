"use client";

import { useState } from "react";
import { Segmented, Switch } from "@/components/ds";

export function DemoControls() {
  const [view, setView] = useState("calendar");
  const [on, setOn] = useState(true);
  return (
    <>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "calendar", label: "Calendar", icon: "calendar" },
          { value: "newsletter", label: "Newsletter", count: 3 },
          { value: "socials", label: "Socials" },
        ]}
      />
      <Switch checked={on} onChange={setOn} label="Show on the website" hint="Saves straight away." />
    </>
  );
}
