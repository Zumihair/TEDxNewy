How the admin reports **the result of an action**: a card that rises from the bottom
edge of the screen, holds for a few seconds, and goes. Green it worked, red it did
not, yellow it needs attention (a partial result, a warning, a "nothing to do here").

Use it for anything that answers "what happened when I pressed that": saved, deleted,
sent, published, imported, failed. Do NOT use it for a standing condition ("Mailchimp
isn't connected", "this needs a database update") or for a validation message bound to
a field — both of those have to stay on screen while the reader acts on them, so they
are a `Flash` or a `Field` error.

```jsx
// In the app: useToast() inside a client component,
// <FlashToast> in a server page reading a ?saved=1 redirect.
toast.success("Draft saved.");
toast.warning("Accepted for 12 recipients, but 3 failed to send.");
toast.error("Buffer refused the post.");
```

**The compiled `_ds_bundle.js` predates the toaster and exports no `Toast`**, and
its `Flash` still carries the retired `ok` tone. A click-through kit that needs a
toast carries its own minimal stand-in for now (see `ui_kits/admin/QuickEmail.jsx`);
the bundle only matters again on a `/design-sync` back to the Design System pane.

Stacked bottom-centre, newest nearest the edge, four at most; success clears after
4.5s, warning 6s, error 9s, and hover or focus holds one open. Copy follows the house
voice: short, second person, sentence case, and an error says what to do next.
