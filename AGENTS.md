# Agent Instructions

This repository is developed using a **spec-driven approach**.
Agents must treat the specifications in the `specs/` directory as the **single source of truth**.

---

## General Rules

- ALWAYS read the relevant specification file(s) in `specs/` before writing or modifying code.
- DO NOT implement functionality that is not explicitly described in a specification.
- DO NOT infer requirements from code comments or incomplete implementations.
- If a requirement is unclear or missing, STOP and report the ambiguity instead of guessing.

---

## Workflow Expectations

When working on a feature, the agent MUST follow this sequence:

1. **Restate Requirements**
   - Summarize the feature requirements from the referenced spec file
   - List assumptions explicitly

2. **Propose a Plan**
   - Describe the implementation approach
   - Identify affected components, files, or modules
   - Highlight any risks or open questions

3. **Implement**
   - Implement only what is defined in the spec
   - Follow existing project conventions
   - Keep changes minimal and focused

4. **Self-Verification**
   - Verify the implementation against the Acceptance Criteria in the spec
   - Explicitly state whether each criterion is satisfied

---

## Specification Usage Rules

- Each agent run SHOULD focus on **one spec file only**
- Specs are immutable unless explicitly instructed to update them
- If implementation reveals a missing rule, propose a **spec change**, not a code workaround

---

## Security & Authorization

- Users may ONLY modify their own data
- Team-based actions MUST verify team membership and role
- Unauthorized actions MUST fail safely

---

## Bingo Domain Rules (Critical)

Agents MUST enforce the following domain invariants:

- A bingo game can only start when:
  - All team members have created resolutions for all other members
- Bingo cards:
  - Have a fixed size
  - Include a Joker in the center with the team resolution
  - Are generated once and immutable afterward (except state updates)
- Duplicate resolutions in a bingo card:
  - Can be reported
  - Must be replaced according to the spec rules
- Empty resolutions:
  - Cannot be marked as completed

---

## State Management

- Resolution states:
  - `to_complete`
  - `completed`
- Proof states:
  - `pending`
  - `approved`
  - `declined`

State transitions MUST follow the rules in the specs.

---

## Non-Goals

Agents must NOT:
- Add features not described in specs
- Optimize prematurely
- Change game rules for convenience
- Introduce speculative abstractions

---

## Definition of Done

A task is considered complete ONLY IF:

- All acceptance criteria in the relevant spec are satisfied
- No unrelated files were modified
- No new requirements were invented
- Behavior matches the domain rules exactly