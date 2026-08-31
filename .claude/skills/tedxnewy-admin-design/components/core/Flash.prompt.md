Inline banner for a **standing** notice, rendered at the top of the page content: a
capability that is not configured, a service that could not be reached, a state the
reader has to do something about. It stays on screen for as long as the condition
holds.

The result of an action is NOT this any more — that is `Toast`. Reach for `Flash`
only when the message has to still be there while the reader acts on it.

```jsx
<Flash tone="info">Mailchimp isn’t connected on this environment yet.</Flash>
<Flash tone="error">The email service isn’t connected, so activity can’t be pulled.</Flash>
```
