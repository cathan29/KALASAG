# Alert Card Text Sanitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix unparsed HTML entities and improve typography in `AlertCard` to ensure clean, readable preview text in the alerts feed.

**Architecture:** Create a centralized text sanitation utility for "preview-style" strings (converting newlines to spaces) and apply it to the `AlertCard` fields.

**Tech Stack:** React Native.

**Spec:** User request to decode entities (`&#x201C;`, `&#xB0;`, etc.), remove newlines in previews, and optimize card typography.

## Global Constraints

- No pushing or committing.
- Must not introduce regression in `AlertDetailScreen` formatting (which requires newlines).
- Must maintain theme consistency.

---

### Task 1: Implement Global Preview Sanitizer

**Files:**
- Create: `src/services/textUtils.js` (or add to existing utility file)

**Interfaces:**
- Produces: `sanitizePreviewText(text: string) => string`

- [ ] **Step 1: Create `sanitizePreviewText` helper**
  Implement function to handle:
  - `&#x201C;`, `&#x201D;` $\rightarrow$ `"`
  - `&#xB0;` $\rightarrow$ `°`
  - `&#xD;`, `&#xA;`, `\n` $\rightarrow$ ` ` (single space)
  - Replace multiple spaces (`  +`) with a single space.
  - Trim leading/trailing whitespace.

---

### Task 2: Apply Sanitation and Typography to AlertCard

**Files:**
- Modify: `src/components/ui/AlertCard.js`

**Interfaces:**
- Consumes: `sanitizePreviewText` from `src/services/textUtils.js`

- [ ] **Step 1: Integrate sanitizer**
  Import `sanitizePreviewText` and apply it to `item.title` and `item.description` before rendering.

- [ ] **Step 2: Update summary typography**
  Update the description `<Text>` component:
  - Add `numberOfLines={3}`
  - Add `ellipsizeMode="tail"`
  - Apply updated styles (see Step 3).

- [ ] **Step 3: Update styles for readability**
  Modify `description` style in `createStyles`:
  - `lineHeight: 20`
  - Use `theme.colors.text.secondary` (or similar muted tone).
  - Ensure `fontSize` is consistent with design (e.g., 13).

- [ ] **Step 4: Verify layout**
  Check that the text flows smoothly without raw entities and that the 3-line limit is respected.
