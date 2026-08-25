# PromiseOS — Implementation Tracker

- [x] Establish the PromiseOS visual foundation with warm-neutral surfaces, deep-teal actions, accessible semantic states, typography, responsive primitives, focus states, and reduced-motion support.
- [x] Replace the template shell with the PromiseOS application layout and responsive navigation for Today, Promises, People, and Settings.
- [x] Build the Today workspace with one prioritized next action, compact upcoming commitments, fast capture, and empty/loading states.
- [x] Build Promise Cards and detail panels that expose action, participants, due date, completion condition, context, status, and append-only timeline.
- [x] Build the creation and shared-invitation flow with recipient accept, counterproposal, decline, and clarification interactions.
- [x] Model users, promises, participants, amendments, events, reminder preferences, and relationship summaries in the database with ownership-aware access controls.
- [x] Implement authenticated tRPC procedures for promise creation, retrieval, mutation, mutual confirmation, event history, and relationship ledger summaries.
- [x] Add in-app reminder preference controls and a browser-notification permission flow; document email delivery as a future integration pending a configured provider.
- [x] Add the private relationship-specific Reliability Ledger with completed, renegotiated, blocked, open, and acknowledgment summaries; exclude all public rankings and global trust scores.
- [x] Add sample/demo onboarding states that are clearly local preview data and never presented as user activity or testimonials.
- [x] Write unit tests for core server-side promise and summary behavior.
- [x] Run type checks and tests, inspect runtime logs, and fix implementation issues.
- [x] Verify desktop and mobile layouts visually, confirm accessibility affordances, and refine motion and attention hierarchy.
- [x] Review this tracker, save the completed project checkpoint, and deliver the working app.

## Known bugs

- [x] Initial baseline recorded; implementation defects are tracked below when discovered.
- [x] Fix navigation routes that currently send Promises, People, and Settings to the generic 404 page.
- [x] Fix the authenticated reminder-preferences query so a first-time user receives stable defaults rather than an undefined response.
- [x] Add the acknowledgment count to the visible private Reliability Ledger summary.
- [x] Confirm the repaired reminder-preferences flow produces no fresh browser-console query errors.
- [x] Remove the default compact-detail bar so the primary workspace begins with one intentional next action rather than an unrequested open detail.
