# Alert Details Text Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve readability of `AlertDetailsScreen` by decoding HTML entities and formatting text into distinct, styled paragraphs.

**Architecture:** Implement a text processing utility function and refactor the rendering logic to map over parsed paragraphs instead of rendering a single block of text.

**Tech Stack:** React Native.

**Spec:** User request to fix unescaped HTML entities and block-text rendering in `AlertDetailsScreen`.

## Global Constraints

- No pushing or committing.
- Maintain existing accessibility and theme integration.
- Ensure performance is not impacted by text processing on large advisories.

---

### Task 1: Implement Text Cleaning Utility

**Files:**
- Modify: `src/screens/AlertDetailScreen.js`

**Interfaces:**
- Produces: `cleanAndFormatText(text: string) => string`

- [ ] **Step 1: Create `cleanAndFormatText` helper**
  Implement function to handle:
  - `&#xD;` $\rightarrow$ `\n`
  - `&#xA;` $\rightarrow$ `\n`
  - `&#x201C;` $\rightarrow$ `"`
  - `&#x201D;` $\rightarrow$ `"`
  - Replace 3+ consecutive `\n` with exactly 2 `\n`.

- [ ] **Step 2: Verify utility logic**
  Test with sample raw API text containing the specified entities.

---

### Task 2: Refactor Text Rendering Logic

**Files:**
- Modify: `src/screens/AlertDetailScreen.js`

**Interfaces:**
- Consumes: `cleanAndFormatText`

- [ ] **Step 1: Update description rendering**
  Replace the single `<Text>` node rendering `alert.description` with a map over `cleanAndFormatText(alert.description).split('\n')`.

- [ ] **Step 2: Implement paragraph styling**
  Apply the following to each mapped `<Text>` component:
  - `lineHeight: 24`
  - `marginBottom: 12`
  - Conditional styling: If text is purely uppercase (excluding numbers/punctuation), set `fontWeight: '700'`.

- [ ] **Step 3: Update styles object**
  Add `descriptionParagraph` to `createStyles` to encapsulate these typography rules.

- [ ] **Step 4: Verify visual output**
  Ensure paragraphs are clearly separated and headers are bolded.
