"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Save, Send } from "lucide-react";
import {
  validateBlocks,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";
import BlockCanvas from "../_blocks/BlockCanvas";
import PreviewPane from "../_blocks/PreviewPane";
import {
  Card,
  Field,
  SecondaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import { previewStep, saveStep, sendTestStep } from "./actions";

export type StepRow = {
  id: string;
  position: number;
  name: string;
  enabled: boolean;
  delay_days: number;
  subject: string;
  preheader: string;
  from_address: string;
  blocks: unknown;
};

export default function StepEditor({
  step,
  fromOptions,
}: {
  step: StepRow;
  fromOptions: string[];
}) {
  const [name, setName] = useState(step.name);
  const [subject, setSubject] = useState(step.subject);
  const [preheader, setPreheader] = useState(step.preheader);
  const [fromAddress, setFromAddress] = useState(
    fromOptions.includes(step.from_address)
      ? step.from_address
      : fromOptions[0] ?? step.from_address,
  );
  const [delayDays, setDelayDays] = useState(String(step.delay_days));
  const [enabled, setEnabled] = useState(step.enabled);
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(
    validateBlocks(step.blocks),
  );

  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentData = () => ({
    name,
    subject,
    preheader,
    from_address: fromAddress,
    delay_days: Number(delayDays) || 0,
    enabled,
    blocks,
  });

  const onSave = () => {
    setSaved(false);
    setFeedback(null);
    startSave(async () => {
      try {
        await saveStep(step.id, currentData());
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setFeedback(`Could not save: ${String(err).slice(0, 200)}`);
      }
    });
  };

  const onSendTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await sendTestStep({
        subject,
        preheader,
        blocks,
        from_address: fromAddress,
      });
      setFeedback(
        res.ok
          ? "Test email sent to you."
          : `Test failed: ${res.error ?? "unknown error"}`,
      );
    } catch (err) {
      setFeedback(`Test failed: ${String(err).slice(0, 200)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {/* Settings */}
        <Card className="space-y-5 p-6">
          <SectionLabel>Step settings</SectionLabel>

          <Field label="Step name" hint="For your reference in the flow list.">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Subject">
            <input
              className={inputCls}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Welcome to TEDxNewy"
            />
          </Field>

          <Field
            label="Preheader"
            hint="The preview line shown after the subject in most inboxes."
          >
            <input
              className={inputCls}
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </Field>

          <Field label="Send as">
            <select
              className={inputCls}
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            >
              {fromOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Delay (days)"
              hint="Days after subscribing. 0 means instantly, only for the first step."
            >
              <input
                type="number"
                min={0}
                className={inputCls}
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
              />
            </Field>
            <Field label="Enabled">
              <label className="mt-1 inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-[#141210]">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(20,18,16,0.25)] text-[#e02214] focus:ring-[#e02214]/30"
                />
                {enabled ? "On" : "Off"}
              </label>
            </Field>
          </div>
        </Card>

        {/* Blocks */}
        <Card className="space-y-4 p-6">
          <SectionLabel>Email content</SectionLabel>
          <BlockCanvas blocks={blocks} onChange={setBlocks} />
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : saved ? (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Save className="h-4 w-4" strokeWidth={2.25} />
            )}
            {saved ? "Saved" : "Save"}
          </button>
          <SecondaryButton
            type="button"
            disabled={testing}
            onClick={onSendTest}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.25} />
            )}
            Send test to me
          </SecondaryButton>
          {feedback && (
            <span className="text-[13px] text-[#6b6459]">{feedback}</span>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <SectionLabel>Preview</SectionLabel>
        <div className="mt-3">
          <PreviewPane
            getHtml={() => previewStep({ subject, preheader, blocks })}
          />
        </div>
      </div>
    </div>
  );
}
