"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ds";
import { useToast } from "../Toaster";
import { setAccessFlags } from "./actions";

/** Two switches on an access row. They save the moment they are flipped. */
export default function AccessToggles({
  email,
  label,
  canEdit,
  admin,
  disabled,
}: {
  email: string;
  label: string;
  canEdit: boolean;
  admin: boolean;
  disabled?: boolean;
}) {
  const [edit, setEdit] = useState(canEdit || admin);
  const [adm, setAdm] = useState(admin);
  const [pending, start] = useTransition();
  const toast = useToast();

  const save = (nextEdit: boolean, nextAdmin: boolean) => {
    const prev = { edit, adm };
    setEdit(nextEdit || nextAdmin);
    setAdm(nextAdmin);
    start(async () => {
      const err = await setAccessFlags(email, label, nextEdit, nextAdmin);
      if (err) {
        setEdit(prev.edit);
        setAdm(prev.adm);
        toast.error(err);
      }
    });
  };

  return (
    <div className="adm-access__switches">
      <Switch label="Can edit" checked={edit} disabled={disabled || pending || adm} onChange={(v) => save(v, adm)} />
      <Switch label="Admin" checked={adm} disabled={disabled || pending} onChange={(v) => save(edit, v)} />
    </div>
  );
}
