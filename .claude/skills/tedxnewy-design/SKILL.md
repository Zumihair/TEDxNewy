---
name: tedxnewy-design
description: Use this skill to design or build anything for TEDxNewy: the public site, the admin, emails, documents, the brand hub or a new programme. Contains the design system rules, tokens and component types.
user-invocable: true
---

Read `README.md` in this skill first: it holds the rules (one red, white first, no eyebrows), the two voices (Bricolage for the brand, Inter for the product), the component list and the migration notes. `tokens.json` is the token source and `components.d.ts` the component API.

In this repo the live implementation is `components/ds/`, `app/ds.css` and the generated `app/tokens.css`. Prefer those components over hand-rolled markup. Gallery: `/dev/design-system`.

Mock-ups and throwaway prototypes can be static HTML that links the same tokens. If invoked without guidance, ask what to build, then act as an expert designer producing HTML or production code.
