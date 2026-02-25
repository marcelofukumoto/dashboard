---
description: |
  Creates a backport or forwardport copy of a pull request on demand.
  Triggered by a "/backport <milestone> <target-branch> [#issue]" or
  "/forwardport <milestone> <target-branch> [#issue]" comment on a PR.
  Verifies org membership, milestone existence, and target branch existence,
  then cherry-picks the PR diff onto a new branch and opens a new pull request
  with metadata copied from the original.

on:
  slash_command:
    name: backport
    events: [pull_request_comment]
  reaction: "eyes"

permissions: read-all

network: defaults

safe-outputs:
  push-to-pull-request-branch:
  create-pull-request:
    title-prefix: ""
  add-comment:

tools:
  bash: true
  github:
    toolsets: [pull_requests, repos]
    lockdown: false

timeout-minutes: 20
---

# Port PR

You are an automation assistant that creates backport or forwardport copies of pull requests by cherry-picking their diff onto a new branch.

The user posted the following command on pull request #${{ github.event.issue.number }} in `${{ github.repository }}`:

> ${{ steps.sanitized.outputs.text }}

The command format is: `/<backport|forwardport> <milestone> <target-branch> [#issue]`

## Step 1 – Parse the command arguments

From the sanitized command text above, extract:
- **type** — the command word without the leading slash: `backport` or `forwardport`
- **milestone** — the second word; sanitize it to only alphanumeric characters, hyphens, and dots
- **target_branch** — the third word (e.g. `release/v2.9`)
- **issue_number** — the fourth word with any leading `#` stripped (optional; may be empty)

If type, milestone, or target_branch are missing, post a comment on the PR with the correct usage and **stop**:
> Usage: `/<backport|forwardport> <milestone> <target-branch> [#issue]`

## Step 2 – Verify org membership

Check whether `${{ github.actor }}` is a member of the `${{ github.repository_owner }}` GitHub organisation.

- If they are **not** a member, write a note to the step summary and post a comment on the PR, then **stop**.

## Step 3 – Validate the target milestone

Check whether the milestone exists and is open in `${{ github.repository }}`.

- If the milestone does **not** exist, post a comment on PR #${{ github.event.issue.number }} saying:
  > Not creating port PR, milestone `<milestone>` does not exist or is not an open milestone

  Write the failure to the step summary, then **stop**.

## Step 4 – Validate the target branch

Check whether `target_branch` exists in `${{ github.repository }}`.

- If it does **not** exist, post a comment on PR #${{ github.event.issue.number }} explaining the target branch was not found, then **stop**.

## Step 5 – Apply the patch to a new branch

1. Check out the repository at `target_branch` with full history.
2. Configure the git user as `github-actions[bot]`.
3. Download the diff of PR #${{ github.event.issue.number }} as a patch using `gh pr diff --patch`.
4. Create a new branch named `gha-portpr-${{ github.run_id }}-${{ github.run_number }}` off `target_branch`.
5. Apply the patch with `git am -3`.
   - If the patch **fails to apply**, capture the full error output and post a comment on the original PR:
     > Not creating port PR, there was an error running git am -3:
     > \`\`\`
     > <error output>
     > \`\`\`
     Then **stop**.
6. Push the new branch to origin.

## Step 6 – Create the port PR

Fetch the original PR's title, body, and assignees.

Build the new PR body:
```
This is an automated request to port PR #<original PR number> by @${{ github.actor }}

Original PR body:

<original PR body — with any "closes/fixes/resolves #NNN" references replaced by
"Original text redacted by port-pr">
```

If `issue_number` is non-empty, append `Fixes #<issue_number>` at the end of the body.

Determine assignees: include only those original assignees who are confirmed members of the `${{ github.repository_owner }}` org.

Create a new PR in `${{ github.repository }}` with:
- **Title**: `[<type> <milestone>] <original PR title>`
- **Body**: as built above
- **Head branch**: the new branch from Step 5
- **Base branch**: `target_branch`
- **Milestone**: the validated milestone
- **Assignees**: org-member assignees only (if any)

Write the new PR URL to the step summary:
```
Port PR created: <new PR URL>
```
