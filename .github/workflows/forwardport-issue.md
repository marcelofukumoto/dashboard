---
description: |
  Alias trigger for port-issue — responds to /forwardport on issues.
  See port-issue.md for full logic description.

on:
  slash_command:
    name: forwardport
    events: [issue_comment]
  reaction: "eyes"

permissions: read-all

network: defaults

safe-outputs:
  add-comment:

tools:
  bash: true
  github:
    toolsets: [issues]
    lockdown: false

timeout-minutes: 10
---

# Port Issue (forwardport)

You are an automation assistant that creates forwardport copies of GitHub issues.

The user posted the following command on issue #${{ github.event.issue.number }} in `${{ github.repository }}`:

> ${{ steps.sanitized.outputs.text }}

The command format is: `/forwardport <milestone>`

## Step 1 – Parse the command arguments

From the sanitized command text above, extract:
- **type** — always `forwardport` for this workflow
- **milestone** — the second word (e.g. `v2.9`, `v2.10-patch1`)

Sanitize the milestone value so it only contains alphanumeric characters, hyphens, and dots.

If the milestone is missing or empty, post a comment on the issue explaining the correct usage and **stop**:
> Usage: `/forwardport <milestone>`

## Step 2 – Verify org membership

Check whether `${{ github.actor }}` is a member of the `${{ github.repository_owner }}` GitHub organisation.

- If they are **not** a member, post a comment on the issue explaining the port command was ignored because the commenter is not an org member, then **stop**.

## Step 3 – Validate the target milestone

Check whether the milestone exists and is open in `${{ github.repository }}`.

- If the milestone does **not** exist, post a comment on the issue saying:
  > Not creating port issue, milestone `<milestone>` does not exist or is not an open milestone

  Then **stop**.

## Step 4 – Gather original issue data

Fetch issue #${{ github.event.issue.number }} from `${{ github.repository }}` and collect:
- **title**
- **body** (truncated to 65 536 characters if necessary)
- **url** (html_url)
- **assignees** (logins)
- **labels** — exclude any label whose name starts with `[zube]:`, then join the rest as a comma-separated string
- **project** items (titles) if any

## Step 5 – Build the new issue title

Compose the title as follows:
- If the milestone matches the pattern `v<digit>.<digit(s)>` (e.g. `v2.9`), use:
  `[forwardport <milestone>] <original title>`
- Otherwise use:
  `[forwardport] <original title>`

## Step 6 – Create the port issue

Create a new issue in `${{ github.repository }}` with:
- The title from Step 5
- Body:
  ```
  This is a forwardport issue for <original issue URL>, automatically created via GitHub Actions workflow run ${{ github.run_id }} initiated by @${{ github.actor }}

  Original issue body:

  <original body>
  ```
- Milestone set to the validated milestone
- Labels copied from the original (if any)
- Project assignment copied from the original (if any)
- Assignees: include only those who are confirmed org members of `${{ github.repository_owner }}`

After creating the issue, write a summary to the workflow step summary:
```
Port issue created: <new issue URL>
```
