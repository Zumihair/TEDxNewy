Use this anywhere a date or time is picked — socials schedule dates, newsletter schedules, calendar notes. Never a native `datetime-local`.

```jsx
<Field label="Schedule date">
  <DateTimePicker value={when} onChange={setWhen} />
</Field>
<DateTimePicker value={day} onChange={setDay} withTime={false} name="day" />
```

Value shape matches the native input it replaced, so call sites store it unchanged. Monday-first calendar, red selected day, ring on today, am/pm segmented control, Now/Today shortcut. All date maths goes through `Date.UTC` so a DST jump can't shift a day.
