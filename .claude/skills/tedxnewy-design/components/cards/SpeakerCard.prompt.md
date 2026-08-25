Speaker tile: a 4:5 portrait with the name and role beneath. Frameless — the photo is the card.

```jsx
<SpeakerCard name="Harry Garside" title="Olympic boxer" image="/images/speakers/harry-garside.webp" onClick={open} />
```

Names go red on hover and the photo zooms 3%. Lay them out in a `SpeakerCarousel` (swipe on mobile, grid from tablet). Clicking should open a bio modal on the current page, never navigate away.
