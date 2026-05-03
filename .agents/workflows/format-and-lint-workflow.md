---
description: Automated process to run workspace-specific linting and resolve technical diagnostics like Svelte navigation or TypeScript types.
---

# Format and Lint Workflow

**Description**: Automated process to run workspace-specific linting and resolve technical diagnostics like Svelte navigation or TypeScript types.

## Steps

1. **Environmental Cleanup**: Identify the relevant package directory (e.g., `apps/web` or `apps/studio`).
2. **Execute Linting**:
   - Run `bun lint:fix` or `npm run lint:fix` in the specific workspace using PowerShell.
   - Check the output for any errors that couldn't be auto-fixed.
3. **Manual Resolution**:
   - Resolve any remaining `@typescript-eslint/no-explicit-any` errors.
   - Fix any `svelte/no-navigation-without-resolve` issues.
4. **Style Guarantee**:
   - Verify that `order/properties-alphabetical-order` is respected in all modified CSS files.
   - Ensure `selector-class-pattern` adheres to the BEM standard.
5. **Final Check**: Run a final lint check to confirm zero diagnostics before finishing.
6. **CI Verification**: Ensure all changes pass the remote CI pipeline (`git push` will trigger `build` and `check` workflows).
