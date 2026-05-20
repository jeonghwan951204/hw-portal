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

- Do not run build, compile, lint, test, package install, migration, or deployment commands unless explicitly requested by the user.
- Do not run commands such as `npm install`, `pnpm install`, `yarn install`, `./gradlew build`, `./gradlew test`, Docker commands, database migration commands, or deployment scripts unless explicitly requested.
- If a command would be useful, suggest the command and explain why, but do not execute it without confirmation.
- For normal code modification requests, edit the code only and skip build/test verification.
- If commands were not run, say: "Build, compile, lint, and tests were not run because they were not requested."

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
4. Whether build, compile, lint, or tests were run.