---
description: Autonomously execute every unfinished task in prd.json, committing each one to dev
argument-hint: "[epic-id | task-id | --dry-run]  (optional; default = all pending tasks)"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# /goal — Claro autonomous PRD execution loop

Execute the tasks in `prd.json` one at a time until none are left. `prd.json` is the durable state
manager: everything needed to resume lives in that file.

**Scope filter:** `$ARGUMENTS` — if it names an epic (`EPIC-3`) run only that epic's tasks; if it
names a task (`T-3.2`) run only that task; if it is `--dry-run` print the execution plan and stop;
if empty, run every pending task.

Read `.agents/prompts/CLARO_PRD_AGENT_PROMPT.md` first — it holds the product definition, the
commit convention (§5.4), and the compliance invariants (§7) you must not break.

---

## Step 0 — Preflight (once)

```bash
git rev-parse --abbrev-ref HEAD
git worktree list
git status --porcelain
```

1. **Working tree must be clean.** If it is dirty, stop and report — do not commit someone else's
   in-progress work.
2. **Resolve the branch.** The target is `dev`.
   - If `dev` is checked out in **another worktree**, `git checkout dev` will fail. Do **not** force
     it. Instead stay on the current branch, state clearly that you are accumulating commits here
     for later merge into `dev`, and record that choice in your final report.
   - Else if `dev` exists locally: `git checkout dev`.
   - Else if `origin/dev` exists: `git checkout -b dev origin/dev`.
   - Else: `git checkout -b dev`.
   - **Never run this loop on `main`.**
3. **Load `prd.json`.** If it does not exist, stop and say so — run the audit/PRD generation phase
   first (see the master prompt, Phases 1–2). Report the task counts: total, done, pending, blocked.

   **Do not `Read` the whole file — it is ~400KB and will flood your context.** Query it instead:

   ```bash
   node -e "const p=require('./prd.json'),t=p.epics.flatMap(e=>e.tasks),d=new Set(t.filter(x=>x.passes).map(x=>x.task_id));console.log('done',d.size,'of',t.length);const n=t.filter(x=>!x.passes&&!x.blocked_reason&&x.depends_on.every(y=>d.has(y)));console.log('eligible now:',n.length);console.log(JSON.stringify(n[0],null,2))"
   ```

   That prints progress plus the full next task. Re-run it after each completed task.
4. **Order the work.** Respect `depends_on`; within that, order by epic then task id. A task whose
   dependency is not `passes: true` is not eligible yet.

---

## Step 1 — Per-task loop

For each eligible task where `"passes": false`:

1. **Announce** — `▶ T-x.y — <description first line>`.
2. **Read before writing** — open every path in `files_to_modify` and every path in
   `reuses_existing`. Never edit a file you have not read this session.
3. **Implement** — satisfy every entry in `acceptance_criteria`.
   - **Reuse first.** This repo's dominant defect is good code that nothing imports. If
     `reuses_existing` names a module, wire that module in rather than writing a new one.
   - Match the surrounding file's style, naming, and comment density.
   - Respect the compliance invariants — especially **zero-storage** for medical documents and PHI.
4. **Verify** — run the task's own `verification` command, then the repo gate:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```
5. **Gate on green.**
   - Failing? Fix the root cause and re-run.
   - **Never** weaken or delete a test, loosen an assertion, add a blanket `eslint-disable`, or cast
     to `any` to get green.
   - After **3** failed attempts: leave `"passes": false`, add `"blocked_reason": "<what failed and
     why>"`, commit nothing for this task, and move to the next one.
6. **Commit the work** — stage only this task's files:
   ```bash
   git add <files_to_modify>
   git commit -m "<git_commit_message verbatim from prd.json>"
   ```
   The message must be the exact string in the task. One line, lowercase, ≤120 chars.
7. **Record the state** — flip `"passes": true` for that task without rewriting the file by hand:
   ```bash
   node -e "const f='./prd.json',p=require(f);p.epics.flatMap(e=>e.tasks).find(t=>t.task_id===process.argv[1]).passes=true;require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')" T-x.y
   git add prd.json
   git commit -m "chore(prd): mark T-x.y complete"
   ```
   Commit it separately so the code commit stays clean.
8. **Continue** immediately to the next task. Do not pause for confirmation.

---

## Step 2 — Stop conditions

Halt when any of these is true:

- every in-scope task is `passes: true`;
- every remaining task is blocked;
- proceeding would require breaking a compliance invariant (§7 of the master prompt);
- the working tree is in a state you cannot verify.

---

## Step 3 — Final report

Print:

- **Completed** — task ids with their commit subjects.
- **Blocked** — task ids with `blocked_reason`.
- **Remaining** — count of tasks still `passes: false`.
- **Gate status** — the result of `pnpm typecheck && pnpm lint && pnpm test`.
- **Branch** — which branch received the commits, and whether a merge into `dev` is still needed.
- **Next command** — e.g. `/goal EPIC-4`.

---

## Guardrails

- Do not `git push`, open a PR, force-push, or touch `main` unless explicitly asked.
- Do not `git stash` — this repo uses shared worktrees and the stash stack is shared.
- Do not edit `prd.json` beyond flipping `passes` and adding `blocked_reason`. Re-scoping the plan
  is a separate, explicit request.
- Do not commit `.env`, keys, or generated caches.
- If a task's acceptance criteria turn out to be wrong or impossible given the real code, stop on
  that task, explain the conflict, and leave it blocked. Do not silently redefine the task.
