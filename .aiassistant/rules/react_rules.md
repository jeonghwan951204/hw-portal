---
apply: always
---

# React Project Rules

## Project Context

- This is a React project.
- Follow the existing React project structure and coding style.
- The project may use JavaScript or TypeScript.
- The project may use fetch, axios, React Query, Zustand, Redux, Context API, CSS modules, Tailwind, styled-components, or another existing project pattern.
- Use the existing project patterns instead of introducing new ones.

## Project Structure

- Keep page components focused on page composition.
- Extract complex UI into components.
- Extract reusable stateful logic into custom hooks when appropriate.
- Extract formatting, parsing, validation, and other pure logic into utility functions.
- Keep API-related logic in the existing service, api, client, or hooks layer if one exists.
- When adding new files, place them in the most appropriate existing directory.
- Do not reorganize folders unless explicitly requested.
- Do not rename components, files, routes, or public APIs unless explicitly requested.

## Component Rules

- Keep components small and focused.
- Avoid creating overly generic components too early.
- Do not duplicate component logic if a clear reusable pattern already exists.
- Preserve existing props and behavior unless the requested change requires otherwise.
- Use clear and descriptive prop names.
- Avoid deeply nested conditional rendering when a clearer structure is possible.
- Consider loading, error, and empty states when rendering API-based data.
- Avoid unnecessary re-renders where it is reasonably easy to do so.
- Use memoization only when it is useful and not just for decoration.

## State Management

- Follow the existing state management approach.
- Do not introduce a new state management library unless explicitly requested.
- Keep state as local as possible.
- Lift state only when it is actually shared.
- Avoid unnecessary global state.
- Use existing hooks and patterns before creating new ones.
- Keep derived state as derived values instead of duplicating it in state when possible.

## API Rules

- Follow the existing API calling pattern, such as fetch, axios, React Query, or existing service modules.
- Do not introduce a new API client pattern unless explicitly requested.
- Handle API loading, success, error, and empty states where appropriate.
- Avoid hardcoding API URLs.
- Use existing environment variable patterns for API base URLs and configuration values.
- Keep request and response handling consistent with existing code.
- Avoid exposing tokens or sensitive values in client-side code unless the existing architecture intentionally uses public-safe values.

## Styling Rules

- Follow the existing styling approach.
- Do not introduce a new UI library, CSS framework, or styling system unless explicitly requested.
- Preserve existing layout and visual behavior unless the requested change requires otherwise.
- Consider responsive behavior when modifying layouts.
- Avoid unnecessary inline styles if the project uses CSS modules, styled-components, Tailwind, or another existing styling pattern.
- Reuse existing components, classes, design tokens, and layout patterns where possible.

## TypeScript Rules

- If the project uses TypeScript, keep types explicit where they improve readability and safety.
- Avoid using `any` unless there is a clear reason.
- Prefer existing shared types when available.
- Keep type definitions close to their usage unless the type is shared across multiple files.
- Avoid unsafe type assertions unless necessary.
- Preserve existing type naming conventions.

## JavaScript Rules

- If the project uses JavaScript, follow the existing JavaScript style.
- Do not convert files to TypeScript unless explicitly requested.
- Use clear runtime checks where necessary.
- Keep code readable and consistent with nearby files.

## Forms and Validation

- Follow the existing form handling approach.
- Validate user input where appropriate.
- Preserve existing validation behavior unless the requested change requires otherwise.
- Show user-friendly error messages when adding validation.
- Avoid adding a new form library unless explicitly requested.
- Keep form state and validation logic maintainable.

## Routing

- Follow the existing routing pattern.
- Do not change route paths unless explicitly requested.
- Preserve existing navigation behavior.
- Consider authorization or guard behavior if modifying protected routes.

## Testing and Verification

- Do not run `npm run build`, `npm test`, `npm install`, `pnpm build`, `pnpm test`, `pnpm install`, `yarn build`, `yarn test`, `yarn install`, or deployment commands unless explicitly requested.
- Do not modify lock files unless package installation was explicitly requested and performed.
- If verification would be useful, suggest the relevant build, lint, or test command without executing it.
- If code was modified but not built or tested, clearly state that verification commands were not run because they were not requested.