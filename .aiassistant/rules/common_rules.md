---
apply: always
---

# Common AI Assistant Rules

## Communication

- Respond in Korean.
- Explain code changes in Korean.
- Summarize modified files and key changes after editing.
- If build, compile, lint, test, migration, deployment, or package install commands were not run, clearly state that they were not run.

## Code Reading

- Use `rg` when searching or reading code because ripgrep is installed.
- Prefer `rg` over slower recursive search commands.
- Use targeted searches before making changes.
- Before editing, inspect related files, existing usages, naming conventions, and nearby implementation patterns.
- Do not rely only on the currently opened file if the change may affect other files.
- When searching for symbols, check usages, definitions, configuration, tests, and related types when relevant.

## General Working Rules

- Follow the existing code style, naming conventions, formatting, and folder structure.
- Keep changes minimal and focused on the user's request.
- Do not perform unnecessary refactoring.
- Do not rewrite unrelated code.
- Do not modify files outside the requested scope unless it is clearly necessary.
- Do not add new dependencies unless explicitly requested or confirmed by the user.
- Prefer simple, maintainable solutions over overly abstract or clever implementations.
- Preserve existing behavior unless the requested change requires otherwise.
- If there are multiple possible approaches, choose the one that best matches the existing project style.
- If a requested change is risky or ambiguous, explain the risk and make the safest reasonable change.

## Command Execution

- Dev deploys follow `/srv/docker/hw-project/AGENTS.md` → "dev 배포 절차":
  - Frontend: when the work is done, redeploy the `frontend` container to dev right away (no confirmation needed).
  - Backend: when the feature is done, redeploy the `backend` container to dev. If the schema changed (new Flyway migration or stale jOOQ code), get the user's confirmation first, then run `hw-db-gradle flywayMigrate jooqCodegen` (wrapper in `~/.local/bin`; uses JDK 25 and the DB credentials in `~/.config/hw-db/dev.env`), and deploy only after that.
- Other build, compile, lint, test, package install, migration, or deployment commands (`npm install`, `./gradlew build`, `./gradlew test`, deployment scripts, production deploys, etc.) run only when explicitly requested by the user.
- If a command would be useful, suggest the command and explain why, but do not execute it without confirmation.
- For normal code modification requests, skip separate build/test runs; the dev deploy above is the verification step.
- If commands were not run, say: "Build, compile, lint, and tests were not run because they were not requested."

## Docker (home server)

- The `orca` user is not in the `docker` group, so plain `docker` commands fail with "permission denied". Use `sudo -n` with one of the whitelisted commands in `/etc/sudoers.d/orca-docker` and `/etc/sudoers.d/orca-docker-frontend`.
- The command must match the whitelist exactly (absolute `/usr/bin/docker`, `-f` with the absolute compose path, same argument order). Any other form is refused by sudo.
- Allowed commands (`<service>` is `backend` or `frontend`):
  - `sudo -n /usr/bin/docker compose -f /srv/docker/hw-project/docker-compose.yml up -d --build --no-deps --force-recreate <service>` (rebuild and redeploy)
  - `sudo -n /usr/bin/docker compose -f /srv/docker/hw-project/docker-compose.yml ps <service>`
  - `sudo -n /usr/bin/docker compose -f /srv/docker/hw-project/docker-compose.yml logs <service>`
  - `sudo -n /usr/bin/docker compose -f /srv/docker/hw-project/docker-compose.yml logs --tail 200 <service>`
  - `sudo -n /usr/bin/docker compose -f /srv/docker/hw-project/docker-compose.yml restart <service>`
  - `sudo -n /usr/bin/docker image prune -f`
- Other Docker commands (`exec`, `down`, `logs -f`, other services, etc.) are not allowed. Ask the user to run them.
- When to run them: see Command Execution above.
- The image is built from the current working tree of `/srv/docker/hw-project/hw-back` (backend) or `/srv/docker/hw-project/hw-portal` (frontend), not from the remote. Make sure the working tree has the intended code before redeploying.

## Security

- Never hardcode secrets, API keys, access tokens, refresh tokens, passwords, database credentials, private IPs, or environment-specific values.
- Use environment variables or existing configuration patterns for sensitive or environment-specific values.
- Do not commit `.env` files, secret files, local configuration files, certificates, or private keys.
- Do not log sensitive values.
- If existing code exposes secrets or risky configuration, point it out before making related changes.
- Be careful when modifying authentication, authorization, CORS, cookies, sessions, tokens, or security-related configuration.

## File Changes

- Prefer small, focused changes.
- When adding new files, place them in the most appropriate existing directory.
- Match existing file naming conventions.
- Do not move files or rename public APIs unless explicitly requested.
- Do not modify generated files unless the project clearly expects generated files to be edited manually.
- Do not modify lock files unless package installation was explicitly requested and performed.

## Output Format

After making changes, provide:

1. A brief summary of what changed.
2. A list of modified files.
3. Any important notes or assumptions.
4. The dev deploy result (deployed service, whether `flywayMigrate`/`jooqCodegen` ran, container status).
5. Whether any other build, compile, lint, or tests were run.