# Contributing to Frakment MCP

Thanks for contributing to the Frakment MCP server.

## How the repositories fit together

This repository contains the source for `@frakment/mcp`, which connects AI clients to the Frakment web registry.

The deployed website, registry, and public documentation are maintained in [`frakment/ui`](https://github.com/frakment/ui).

When a change affects MCP behavior, setup, tools, or public configuration, update the [MCP documentation](https://github.com/frakment/ui/blob/main/apps/web/content/docs/utilities/mcp.mdx) in a linked UI contribution.

Internal tests, CI, and refactors that do not change user-facing behavior do not require a documentation update.

## Development

Use Node.js 22.18.0 or newer.

Install dependencies and run the checks with npm:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

Or use pnpm:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run typecheck
pnpm run build
```

When dependencies change, update both `package-lock.json` and `pnpm-lock.yaml` with `npm install` and `pnpm install`.

## Releases

Use Changesets for user-facing changes to the published package.

Create a changeset with `npm run changeset` or `pnpm changeset`.

## Contributions

All changes to `main` must be submitted through a pull request, including changes from Developers and Maintainers.

The owner reviews every pull request and is the only person who merges to `main`.

Maintainers and Developers may help review, but only the owner merges changes to the protected default branch.

See the [Frakment contributor governance guide](https://github.com/frakment/.github/blob/main/GOVERNANCE.md) for contributor levels, promotion, and repository access.

Link the UI documentation pull request to the MCP source pull request so both changes can be reviewed and released together.
