# AI Agent Prompt — Klaro `/scan` UI/UX-First Workflow

## Goal

Build a polished `/scan` experience with a strong **UI/UX-first** flow: front camera capture, **multiple image drag-and-drop**, clear document previews, accessible microcopy, and a calm medical-grade visual hierarchy.

This prompt is for an implementation agent that should prioritize the screen design and interaction flow before deeper backend or model work.

## What the agent must optimize first

1. **Visual clarity**
   - Show users exactly where to drop files.
   - Make the camera area the primary focal point.
   - Keep supporting content secondary and uncluttered.

2. **Document intake UX**
   - Allow **multiple image uploads** via drag-and-drop and file picker.
   - Show a preview gallery with remove controls.
   - Support reordering or replacing selected pages later if feasible.

3. **Camera capture UX**
   - Use the device camera by default.
   - Prefer the front camera when the goal is to capture a person.
   - Keep a clear capture button and visible state changes.

4. **State feedback**
   - Never leave the page silent.
   - Show idle, hover, dragging, capturing, uploading, and processing states.
   - Use concise, reassuring copy.

5. **Accessibility and comfort**
   - Large tap targets.
   - Strong contrast.
   - Keyboard support for upload and drop areas.
   - Clear labels for preview items and destructive actions.

## Primary UX flow

### Stage 1 — Idle

- Display camera as the main hero region.
- Show one clear CTA for camera capture.
- Show a secondary CTA for upload / drag-and-drop.
- Use helper copy that tells users what to do next.

### Stage 2 — Dragging

- Highlight the drop zone.
- Make the target obvious with border glow, tint, or overlay.
- Show a short message like “Drop 1 or more images here”.

### Stage 3 — Selection

- Show selected images in a gallery.
- Include file name, thumbnail, and remove button.
- Allow multiple files at once.
- Keep the first image visually prominent.

### Stage 4 — Review

- Show a calm review state before scanning.
- Display the number of selected images.
- Offer a clear “clear all” or “remove page” action.
- Avoid visual noise.

### Stage 5 — Capture / Process

- Keep the camera preview stable.
- Show progress copy during scan processing.
- Preserve a non-blocking, informative tone.

## Layout requirements

### Hero area

- Camera or image preview should occupy the top visual priority.
- Use a centered capture action.
- Keep supporting guidance beneath the hero.

### Dropzone / gallery area

- Make the dropzone large enough for easy drag-and-drop.
- Use dashed borders, soft background tint, and hover states.
- Display previews in a grid or horizontal strip.
- Show thumbnail cards with quick remove controls.

### Supporting panels

- Keep explanatory cards short and scannable.
- Group scan categories into clear tiles.
- Avoid crowded text blocks.

## Content rules

- Use plain, friendly language.
- Avoid medical jargon in onboarding and helper copy.
- Keep confirmations brief.
- If scanning is in progress, state that clearly.
- If the scheduler or side panel is still loading, say so without alarming the user.

## Interaction rules

- Drag-and-drop must accept multiple images.
- File picker must also allow multiple image selection.
- Dropped non-image files should be rejected gracefully.
- Selected images should be removable individually.
- “Clear all” should reset the queue without breaking the page state.
- Camera capture should remain available even when images are queued.

## Accessibility rules

- Every action must have an accessible label.
- Preview thumbnails need clear alt text.
- The dropzone must be keyboard-friendly.
- Focus states should be visible.
- Buttons must be large enough for mobile use.

## Motion and feedback

- Use gentle transitions for state changes.
- Avoid abrupt swaps where possible.
- Use subtle hover feedback on cards and thumbnails.
- Prefer calm, low-friction animation.

## AI / processing handoff

Once the UI/UX flow is solid, the implementation agent may wire the queue into the scan process:

- Convert selected images into the scan request format.
- Preserve upload order.
- Keep request metadata clear and stable.
- Normalize output into the existing `/scan` result flow.

## Acceptance criteria

The task is complete when:

- The `/scan` page feels intentional and premium.
- Multiple images can be dropped and previewed.
- The camera is the primary interaction path.
- The upload area feels clear and forgiving.
- The UI remains readable, calm, and helpful.
- The final scan flow still works with the existing result screen.

## Ready-to-use implementation prompt

You are the Scan UI/UX Implementation Agent for Klaro. Your mission is to improve the `/scan` experience with a polished front camera, multiple image drag-and-drop, preview gallery, clear selection states, and accessible medical-grade UI. Focus on the visual hierarchy, user guidance, interaction states, and calm microcopy before deep backend or AI changes.

Requirements:

- Make the camera area the primary focal point.
- Allow multiple image drag-and-drop and multiple file selection.
- Show an obvious dropzone and a selected-pages gallery.
- Provide remove and clear-all actions for selected images.
- Keep copy short, reassuring, and easy to scan.
- Preserve accessible labels, keyboard support, and strong contrast.
- Keep scan processing states visible and non-blocking.

Output expectations:

- A more complete `/scan` UI with clear document intake flow.
- Multi-image drag-and-drop that feels natural.
- A stable preview/review state before scanning.
- Camera capture that remains the dominant action.
- A foundation that can later connect to multi-page AI processing.
