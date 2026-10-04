# Changelog

Notable changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 1.0.0 - 2026-10-03

First open source release.

- A GitHub Actions workflow that checks every target about every five minutes
  and publishes the page and its status document to GitHub Pages.
- Targets checked by status code, expected text and response time, with one
  retry before a target counts as down.
- 90 days of daily history and incidents kept in the published `status.json`,
  with nothing committed for each check.
- A status page with a 90 day bar for each target, uptime, recent incidents,
  and a delayed state when checks stop arriving.
- Sources, to show status documents from other monitors, including Firestore
  REST API documents, with a tab for each.
- `status.config.json` checked against its schema, with every problem listed
  at once.
