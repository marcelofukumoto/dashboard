---
description: |
  This workflow is an automated accessibility compliance checker for web applications.
  Reviews websites against WCAG 2.2 guidelines using Playwright browser automation.
  Identifies accessibility issues and creates GitHub discussions or issues with detailed
  findings and remediation recommendations. Helps maintain accessibility standards
  continuously throughout the development cycle.

on:
  schedule: daily
  workflow_dispatch:

permissions: read-all

network: defaults

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-discussion:
    title-prefix: "${{ github.workflow }}"
    category: "q-a"
    max: 5
  add-comment:
    max: 5

tools:
  playwright:
    args: ["--ignore-https-errors"]
  web-fetch:
  github:
    toolsets: [all]

timeout-minutes: 15

steps:
  - name: Checkout repository
    uses: actions/checkout@v6
    with:
      fetch-depth: 1
      persist-credentials: false
  - name: Setup env
    uses: actions/setup-node@v4
    with:
      node-version-file: '.nvmrc'
  - name: Install packages
    run: yarn install --frozen-lockfile --ignore-engines
  - name: Run Rancher
    run: |
      # Same as .github/workflows/test.yaml -> yarn e2e:docker -> scripts/e2e-docker-start
      # Ports 80/443 are reserved by the MCP Gateway, so we remap to 8080/8443
      RANCHER_HOST_HTTP_PORT=8080 RANCHER_HOST_HTTPS_PORT=8443 RANCHER_CONTAINER_NAME=rancher RANCHER_VERSION_E2E=head yarn e2e:docker
  - name: Pre-create MCP logs directory
    run: |
      # The Playwright MCP container needs write access to the mcp-logs directory.
      # Pre-create it with world-writable permissions to avoid EACCES errors
      # when the container process (running as a different UID) tries to write logs.
      mkdir -p /tmp/gh-aw/mcp-logs/playwright
      chmod 777 /tmp/gh-aw/mcp-logs/playwright
---

# Daily Accessibility Review

Your name is ${{ github.workflow }}.  Your job is to review a website for accessibility best
practices.  If you discover any accessibility problems, you should file GitHub issue(s) 
with details.

Our team uses the Web Content Accessibility Guidelines (WCAG) 2.2.  You may 
refer to these as necessary by browsing to https://www.w3.org/TR/WCAG22/ using
the WebFetch tool.  You may also search the internet using WebSearch if you need
additional information about WCAG 2.2.

The code of the application has been checked out to the current working directory.

Important notes about the runtime environment:
- The Rancher Dashboard is running at `https://127.0.0.1:8443/dashboard/` (started by a prior workflow step).
- You are running inside a sandboxed container. The Docker socket is NOT available, so do NOT run `docker ps`, `docker logs`, or any docker commands — they will fail.
- If Playwright fails to connect, try waiting a few seconds and retrying. The server uses a self-signed certificate, which is already handled by `--ignore-https-errors`.

Steps:

1. Use the Playwright MCP tool to browse to `https://127.0.0.1:8443/dashboard/`. Review the website for accessibility problems by navigating around, clicking
  links, pressing keys, taking snapshots and/or screenshots to review, etc. using the appropriate Playwright MCP commands.

2. Review the source code of the application to look for accessibility issues in the code.  Use the Grep, LS, Read, etc. tools.

3. Use the GitHub MCP tool to create discussions for any accessibility problems you find.  Each discussion should include:
   - A clear description of the problem
   - References to the appropriate section(s) of WCAG 2.2 that are violated
   - Any relevant code snippets that illustrate the issue