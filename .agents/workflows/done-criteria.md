---
description: Comprehensive quality checklist to verify "Premium" UI standards, BEM compliance, and code cleanliness before task finalization.
---

# Done Criteria Workflow

**Description**: Comprehensive quality checklist to verify "Premium" UI standards, BEM compliance, and code cleanliness before task finalization.

## Steps

1. **Rule Validation**:
   - Check that all CSS follows the **BEM** convention.
   - Verify **Geist** typography (200 weight, 0.34% tracking) has been applied.
   - Ensure all state transitions use **GSAP** for fluid, organic motion.
2. **Technical Polish**:
   - Run `/format-and-lint` to ensure all diagnostics are resolved.
   - Confirm that no hex codes or literal pixels are hardcoded (use design tokens).
   - Ensure `each` blocks have unique keys.
3. **Data Sync**:
   - If the change involves CMS content, verify the Sanity schema and GROQ queries match.
   - Use the /sync skill if needed to verify data flow.
4. **Cleanup**:
   - Remove placeholder images or generic "red/blue" colors.
   - Delete any temporary console logs or commented-out code blocks.
5. **Final Review**: Confirm the solution is KISS and DRY before proceeding to /commit-convention.
