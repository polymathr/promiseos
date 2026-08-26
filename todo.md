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
- [x] Add standards-compliant calendar export for individual promises, including title, due date, participants, completion condition, and a privacy-respecting description.
- [x] Add a restrained success micro-interaction when a shared promise is accepted or a renegotiation is confirmed, with reduced-motion support.
- [x] Verify the GitHub connection, create a private PromiseOS repository under the user’s available account, and configure the `github` remote for future synchronization.
- [x] Test and visually verify calendar export and confirmation feedback on desktop and mobile.
- [x] Save a new checkpoint and deliver the enhanced PromiseOS app.
- [x] Review the newly provided content, extract its concrete PromiseOS requirements, and implement the approved changes with validation and GitHub synchronization.
- [x] Enforce legal PromiseOS state transitions in server-side event handling and add tests for rejected illegal paths.
- [x] Split the monolithic Home experience into route-level Today, Promise Detail, Capture, People, and Settings components while preserving responsive four-item navigation.
- [x] Remove unused AI chat and map scaffolding, remove associated unused dependencies, and regenerate the verified lockfile.
- [x] Add authenticated promise JSON export and privacy-preserving account deletion procedures with appropriate promise cleanup or anonymization rules.
- [x] Build a public token-based guest invitation confirmation page that collects a response before requesting sign-in.
- [x] Build the specified non-AI, no-gradient welcome onboarding page with the exact headline, CTAs, and dot-to-check visual motif.
- [x] Save the pasted-content implementation checkpoint, synchronize it to GitHub, and deliver the update.
- [x] Replace Today and Promises mock data with authenticated live promise queries, prioritization, client-side search, and the requested empty state.
- [x] Render live promise details, participants, events, amendments, and server-persisted response actions from the route parameter.
- [x] Replace People mock cards with private live reliability summaries and relationship-aware empty states.
- [x] Bind all reminder preferences, browser permission, data controls, and sign-out to authenticated tRPC operations in Settings.
- [x] Add responsive AppShell sign-in controls and accessible icon-plus-label status pills using the requested semantic palette.
- [x] Remove the now-unused Home page, verify checks and tests, then checkpoint and synchronize this live-data update to GitHub.

## Live-data follow-up

- [x] Include participant identity and confirmation data in the live promise detail response, and verify the loaded detail happy path against an existing record.
- [x] Add optimistic cache updates with rollback and refetch for accepting, counterproposing, and clarifying a promise.
- [x] Add a signed-in-only private personal reliability dashboard that transparently summarizes completed, acknowledged, renegotiated, blocked, and disputed commitments without public ranking or sharing.
- [x] Add server-side reliability-dashboard data and unit coverage for the transparent score calculation.
- [x] Verify optimistic interaction feedback, dashboard semantics, mobile responsiveness, type checks, tests, checkpointing, and GitHub synchronization.

## Known bugs

- [x] Initial baseline recorded; implementation defects are tracked below when discovered.
- [x] Fix navigation routes that currently send Promises, People, and Settings to the generic 404 page.
- [x] Fix the authenticated reminder-preferences query so a first-time user receives stable defaults rather than an undefined response.
- [x] Add the acknowledgment count to the visible private Reliability Ledger summary.
- [x] Confirm the repaired reminder-preferences flow produces no fresh browser-console query errors.
- [x] Remove the default compact-detail bar so the primary workspace begins with one intentional next action rather than an unrequested open detail.
- [x] Repair the nested interactive elements in Promise Cards so calendar export and detail opening remain valid, accessible controls.
