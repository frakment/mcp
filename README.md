# @frakment/mcp

[![npm](https://img.shields.io/npm/v/@frakment/mcp?style=for-the-badge&color=000)](https://www.npmjs.com/package/@frakment/mcp)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)

Model Context Protocol server for the [Frakment](https://github.com/frakment/ui) component registry.

Frakment-authored MCP server code is licensed under MIT, which permits commercial use, modification, distribution, and sublicensing. Third-party dependencies retain their own licenses.

Exposes registry search, component source, compositions, and CLI install commands as MCP tools.

The MCP server does not write files into a project or execute the returned commands.

The MCP server exposes the web registry only. Use the Expo registry endpoints and the CLI `--expo` option for native components.

## Install

```bash
npx -y @frakment/mcp
```

Or run it with pnpm:

```bash
pnpm dlx @frakment/mcp
```

Requires Node.js >= 22.18.0.

Or pin it as a dev dependency:

```bash
npm install --save-dev @frakment/mcp
# or
pnpm add --save-dev @frakment/mcp
```

## Configure your MCP client

<!-- context-drift-ignore-next-line CD001 -->
Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "frakment": {
      "command": "npx",
      "args": ["-y", "@frakment/mcp"]
    }
  }
}
```

For Cursor, add the same block to `~/.cursor/mcp.json`.

<!-- context-drift-ignore-next-line CD001 -->
For VS Code with GitHub Copilot, save this as `.vscode/mcp.json`:

```json
{
  "servers": {
    "frakment": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@frakment/mcp"]
    }
  }
}
```

## Tools

| Tool                  | Input                    | Output                                                                       |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `list_components`     | none                     | List of every web component with name and description.                       |
| `view_component`      | `{ "name": "button" }`   | Source files and dependency metadata; binary assets are labeled base64 text. |
| `search_components`   | `{ "query": "chat" }`    | Web components matching name or description.                                 |
| `get_install_command` | `{ "name": "button" }`   | The exact web component install command.                                     |
| `list_scenarios`      | none                     | Ready-made compositions of web components.                                   |
| `compose`             | `{ "scenario": "chat" }` | Curated components, install command, and dependency note.                    |

`get_install_command` formats the supplied name without validating it; call `list_components` first to choose a valid slug.

## Environment

| Variable            | Default                           | Purpose                                                    |
| ------------------- | --------------------------------- | ---------------------------------------------------------- |
| `FRAKMENT_REGISTRY` | `https://www.arrafi.dev/frakment` | Registry root URL. Do not include the registry API suffix. |

## Development

From the repository root:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

You can use pnpm instead:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run typecheck
pnpm run build
```

The server speaks JSON-RPC over stdin/stdout and works with MCP clients that support stdio subprocess servers.

Clients without MCP support can use the registry HTTPS endpoints and CLI directly.

User-facing documentation is deployed from [`frakment/ui`](https://github.com/frakment/ui). When a change affects the MCP server's behavior, setup, tools, or public configuration, update the [MCP documentation](https://github.com/frakment/ui/blob/main/apps/web/content/docs/utilities/mcp.mdx) in a linked pull request.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution workflow, validation commands, release guidance, and cross-repository documentation requirements.

## License

The MCP server's own source is MIT licensed; see [LICENSE](./LICENSE). Third-party dependencies retain their respective licenses.
