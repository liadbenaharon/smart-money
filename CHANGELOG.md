# Smart Money Changelog

## v0.2.0 — 2026-08-25

### Added
- New Month flow that archives the current plan and carries recurring expenses forward.
- Editing existing expenses without deleting them first.
- Optional charge day (1–31) for every expense.
- Monthly history with salary, expenses, recommendation, actual saving and ending balances.
- Actual planned saving versus recommended saving.
- Local JSON backup export and restore.
- Local notification permission and reminders for expenses due within 3 days while the PWA is opened or active.
- Upcoming charges section.

### Changed
- Summary cards now distinguish recommended saving from actual planned saving.
- Existing v0.1 data is migrated automatically.

### Limitation
- Reliable notifications while the PWA is fully closed require a remote Web Push service; v0.2.0 only performs local checks when the app is launched or active.

## v0.1.0 — 2026-08-25

Initial alpha release.

### Added
- Monthly planning based on current bank balance and expected salary.
- Expected expenses by Credit, Debit, or bank account.
- Recurring monthly expenses.
- Target amount to remain in the bank account after all expenses.
- Current savings balance and projected savings after the recommended transfer.
- Automatic savings recommendation.
- Light and dark themes with saved preference.
- Hebrew RTL mobile-first interface.
- PWA installation support with offline cache and app icons.
- LocalStorage-only personal data storage.
- Automatic next-month title.
