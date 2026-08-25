Form controls. Labels are mono caps; inputs are 12/16px padded, 12px radius, with a red focus ring.

```jsx
<Field label="Organisation" hint="Shown on the public sponsors page.">
  <Input placeholder="Newcastle Permanent" />
</Field>
<Field label="Stage" error="Pick a stage before saving.">
  <Select options={[{ value: "early", label: "Early draft" }]} />
</Field>
<AdvancedToggle>{rareFields}</AdvancedToggle>
```

House rule: rare or advanced options fold behind `AdvancedToggle` instead of stretching the form. Never a native `date`/`datetime-local` input — use `DateTimePicker`.
