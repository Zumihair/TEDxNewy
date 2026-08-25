Labels a section: 40x2px rule plus 10.5px/600 uppercase text at 0.22em tracking.

```jsx
<SectionKicker label="On the horizon" />
<SectionKicker label="Just wrapped · 7 August 2026" inverted showRule={false} />
```

Every major section on the site opens with one. On dark maroon sections the site often drops the rule and colours the text `--red-blush` (#ff9b8f) — pass `inverted` with `showRule={false}` and override colour via `style`.
