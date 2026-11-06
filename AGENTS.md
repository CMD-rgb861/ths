# Project safety rules

## Database safety
- Never run destructive database commands against the live app database.
- Never use commands such as `php artisan migrate:fresh`, `migrate:refresh`, `db:wipe`, or any reset command on the live project database unless there is explicit approval from the project owner.
- Never point Laravel tests at the live database (`itsms` / local dev DB) for validation.
- Always use an isolated database for testing, such as SQLite in-memory or a dedicated test database.
- Before any database-related command, verify the exact database target and confirm it is not the production or live local project database.

## Validation rules
- Prefer project tests that use the testing environment already configured in `phpunit.xml`.
- If a task involves DB changes, test against a disposable or isolated database first.
- If the requested change touches data or migrations, ask for confirmation before any command that could modify persisted data.

## Migration rules
- Do not create or run migrations against the live app database without explicit approval.
- If migration files are needed, make them additive and safe, and verify they are intended for a disposable environment first.
- Do not assume a local MySQL database is safe for a destructive test run.

## Scope of work
- Keep changes scoped to the requested feature.
- Do not modify unrelated database data or schema without explicit confirmation.
- If a database appears to have already been altered unexpectedly, stop and report it before making further changes.
