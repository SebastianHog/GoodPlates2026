---
name: GoodPlates
description: A social recipe feed where every post is a dish someone cooked, with the recipe included.
colors:
  garden-green: "#1a7a50"
  garden-green-deep: "#146140"
  paper: "#fdfbf5"
  surface: "#ffffff"
  ink: "#22261f"
  ink-muted: "#6b6a60"
  border: "#e8e4d8"
  border-strong: "#b8b3a6"
  error: "#dc2626"
  error-surface: "#fef2f2"
typography:
  headline:
    fontFamily: "Literata Variable, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Literata Variable, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
  meta:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "2px"
  md: "2px"
  lg: "2px"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
components:
  button-primary:
    backgroundColor: "{colors.garden-green}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
  button-primary-hover:
    backgroundColor: "{colors.garden-green-deep}"
    textColor: "{colors.surface}"
  icon-button:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "0.25rem"
  icon-button-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem 0.5rem 2.25rem"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  recipe-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.75rem"
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.md}"
    padding: "0.75rem 0.5rem 0.75rem 1rem"
---

# Design System: GoodPlates

## Overview

**Creative North Star: "The Kitchen Table"**

GoodPlates feels like a kitchen table where people pass dishes and recipes around: warm, everyday and unfussy. The surfaces are cream paper and white pages, the voice is a book serif for anything a cook wrote and a friendly sans for everything the app says, and a single garden green marks what you can act on. It is calm rather than editorial; the food photos bring the colour.

Density stays comfortable because people read recipes on phones while cooking. One post per row, generous tap areas, nothing competing with the dish. The signature form is the open booklet: two pages side by side, cream on the left, white on the right, with a soft shadow in the fold. It appears on login, in the editor, and in every feed row on wider screens.

**Key Characteristics:**
- Cream paper background, white pages, warm grey-green ink. Never blue.
- Literata for recipe and page titles only; Figtree for everything else.
- One accent colour: garden green for actions, links, focus and selection.
- Nearly square corners everywhere (2px), circles only for avatars.
- Pages rest on the table: soft shadows lift whole pages, never small controls.

## Colors

A warm, low-chroma neutral palette with one homegrown green accent.

### Primary
- **Garden Green** (`garden-green`): Primary buttons, links, the Edit action, the active like, step numbers, focus rings, text selection tint and the input caret. White text on it passes 4.5:1.
- **Garden Green, Deep** (`garden-green-deep`): Hover state for primary buttons.

### Neutral
- **Cream Paper** (`paper`): Page background, the left page of the booklet, the search field at rest and icon-button hover.
- **Page White** (`surface`): Cards, the right page of the booklet, the header, inputs and the toast.
- **Kitchen Ink** (`ink`): Body text and titles; a warm grey-green, not black.
- **Pencil Grey** (`ink-muted`): Meta lines, dates, placeholders, idle icons (about 5.3:1 on paper).
- **Flour Line** (`border`): Card borders, header rule, skeleton blocks.
- **Pantry Line** (`border-strong`): Dividers between posts on phones and input borders on forms.
- **Error Red** (`error`) on **Error Blush** (`error-surface`): Form errors and the alert icon in the toast. Never decorative.

### Named Rules
**The One Green Rule.** Garden green is the only accent. It marks what you can do or where you are; it never fills large areas or decorates.

**The Never Blue Rule.** No blue anywhere, including focus rings, links and text selection; these are themed green.

## Typography

**Display Font:** Literata Variable (with Georgia, serif)
**Body Font:** Figtree Variable (with ui-sans-serif, system-ui)

**Character:** A bookish serif for what cooks write (titles of recipes and pages) next to a friendly, open sans for the interface. The pairing makes a recipe title read like a cookbook heading and the app stay out of the way.

Both are self-hosted variable fonts (`@fontsource-variable`), loaded with `font-display: swap`, covering Latin and Latin Extended for all six UI languages.

### Hierarchy
- **Headline** (600, 1.5rem, 1.25): Page titles (feed intro, Bookmarks, New/Edit recipe, login) and recipe titles in the desktop feed row.
- **Title** (600, 1.25rem, 1.25): Recipe titles on phone cards and in Bookmarks rows; balanced wrapping.
- **Body** (400, 1rem, 1.5): Descriptions and running text, kept to 60ch; `text-wrap: pretty`.
- **Label** (500, 0.875rem): Buttons, header actions, field labels, the author's name (600).
- **Meta** (400, 0.875rem, Pencil Grey): The "ingredients · steps · time" line, dates, hints.

### Named Rules
**The Cook's Voice Rule.** Literata is only for words a cook or a page owns: recipe titles and page titles. Buttons, labels, meta and messages are always Figtree.

**The No Eyebrow Rule.** Nothing sits above a title as a label or kicker. The author byline goes below the title, never above it.

## Layout

Mobile first, with one breakpoint at 52em. The page content is capped at 72rem with 1.5rem side padding; the feed and Bookmarks are narrower reading columns of 48rem, centred.

The feed is always one post per row. On phones a post is a full-width photo with the text below and a divider line between posts. Once a post has at least 36rem of room (a container query, not a viewport query), it becomes a small booklet row: photo page at 2fr, text page at 3fr. Narrow placements of the same card, like the editor's preview, keep the stacked layout.

Spacing follows a 4px-based scale (0.25, 0.5, 0.75, 1, 1.5, 2, 3rem). Groups are tight (byline name and date touch), and separate posts get 1.5–2rem between them.

### Named Rules
**The One Per Row Rule.** Posts in a feed are uniform and one per row. No featured or oversized lead post.

## Elevation & Depth

Paper on a table. Surfaces are flat; shadows only lift whole pages as if they rest on the table: the booklet, feed cards and the toast. Controls such as buttons and inputs never cast shadows. The booklet's fold is drawn with two soft linear gradients meeting at the spine, darker on the left page.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px rgb(0 0 0 / 5%)`): Feed cards on wider screens.
- **Lifted booklet** (`box-shadow: 0 1px 2px rgb(0 0 0 / 6%), 0 16px 40px -12px rgb(0 0 0 / 20%)`): The open booklet on login and in the editor.
- **Floating toast** (`box-shadow: 0 1px 2px rgb(0 0 0 / 6%), 0 12px 32px -12px rgb(0 0 0 / 25%)`): The message box at the top of the screen.
- **Focus glow** (`box-shadow: 0 0 0 3px` garden green at 20%): Text inputs on focus.

### Named Rules
**The Table Rule.** Only whole pages get a shadow. If it is smaller than a card, it stays flat.

## Shapes

Nearly square: every corner is 2px, which reads as cut paper rather than an app tile. The only round shapes are avatars and the carousel dots. Photos are square crops (1:1). Borders are 1px hairlines in Flour Line.

### Named Rules
**The Cut Paper Rule.** No corner above 2px unless a design explicitly calls for it. Circles are reserved for people (avatars) and position dots.

## Components

### Buttons
- **Shape:** Nearly square (2px).
- **Primary:** Garden green with white Figtree label text, `0.5rem 0.75rem` in the header; the auth form's full-width submit is taller (`0.75rem 1rem`, 600).
- **Hover / Focus:** Deepens to garden-green-deep; keyboard focus shows a 2px garden green outline, 2px offset.
- **Quiet text button:** Ink text, no background, turns green on hover (header "Log in").
- **Icon button:** Borderless, Pencil Grey icon (and count), hover fills with Cream Paper and darkens to ink. Used for like, bookmark, close.

### Cards / Containers
- **Recipe card:** Page White with a Flour Line hairline and the resting-card shadow on wider screens; the photo sits inside a 0.75rem page margin. In rows it becomes a booklet: cream photo page, white text page, fold shadow.
- **Phone card:** No frame; full-width photo, text below, a Pantry Line divider between posts.
- **Footer:** Byline on the left (avatar, name over date), actions on the right; they wrap rather than squeeze.

### Inputs / Fields
- **Search:** Cream Paper fill with a hairline border and a leading search icon; on focus it turns white with a green border and focus glow.
- **Form fields:** White with a Pantry Line border; the same green border and glow on focus; the caret is green.
- **Error:** A blush box with red text and a red hairline, named in plain words.

### Navigation
- **Header:** White bar with a hairline under it. Logo and wordmark ("Good" regular, "Plates" bold) on the left, search in the middle on wide screens (its own row on phones), Log in and Sign up or New post and the account menu on the right.
- **Segmented tabs:** A cream track with a white sliding pill for the selected tab (log in / sign up).

### Booklet (signature)
Two pages side by side with a shadow in the fold: cream left page, white right page, 2rem page padding, the lifted-booklet shadow. Stacks into one column on phones. Used for login (featured post + form), the editor (form + preview) and feed rows (photo + post).

### Toast
A white box that slides down from the top of the screen and eases to a stop (400ms, `cubic-bezier(0.16, 1, 0.3, 1)`), leaving faster (200ms). Errors carry a red alert icon; info messages carry none and may have one green action button (for example "Log in"). It stays for a configurable `duration` (5000ms in the layout), pauses while hovered or focused, and is announced politely to screen readers. One message at a time.

### Skeleton
Placeholders in the exact shape of the content they stand in for, in Flour Line blocks with a slow 1.6s opacity pulse; static under reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep garden green (#1a7a50) as the only accent, and theme focus rings, selection and carets with it.
- **Do** set recipe and page titles in Literata 600 and everything else in Figtree.
- **Do** keep corners at 2px; use circles only for avatars and dots.
- **Do** keep feed posts uniform, one per row, switching to the booklet row by container width (≥36rem).
- **Do** reuse the booklet for any two-part page (photo and post, form and preview).
- **Do** respect reduced motion: animations fall back to fades or nothing.

### Don't:
- **Don't** use blue anywhere, including links and focus.
- **Don't** round corners above 2px.
- **Don't** make one post bigger than the others in a feed.
- **Don't** put a label or eyebrow above a title, or the byline above the title.
- **Don't** put shadows on buttons, inputs or other small controls.
- **Don't** use Literata for interface text such as buttons, labels or messages.
