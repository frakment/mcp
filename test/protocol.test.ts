import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registry = "https://registry.test";
const fixtures: Record<string, unknown> = {
  [`${registry}/r/index.json`]: {
    components: [
      { name: "button", description: "Clickable action" },
      { name: "avatar", description: "Profile image" },
    ],
  },
  [`${registry}/r/button.json`]: {
    name: "button",
    description: "Clickable action",
    dependencies: ["react"],
    registryDependencies: ["icons"],
    files: [
      { path: "components/ui/button.tsx", content: "export {};" },
      { path: "public/button.avif", content: "AAAA", encoding: "base64" },
    ],
  },
};

describe("MCP tool protocol", () => {
  let client: Client;
  let clientTransport: InMemoryTransport | undefined;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!Object.hasOwn(fixtures, url)) {
        throw new Error(`Unexpected registry URL: ${url}`);
      }
      return new Response(JSON.stringify(fixtures[url]), {
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FRAKMENT_REGISTRY", `${registry}/`);

    const pair = InMemoryTransport.createLinkedPair();
    clientTransport = pair[0];
    const serverTransport = pair[1];
    vi.doMock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
      StdioServerTransport: vi.fn(function () {
        return serverTransport;
      }),
    }));

    await import("../src/index.ts");
    client = new Client({ name: "protocol-test", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    try {
      // Closing one linked endpoint also closes its peer, even if setup failed.
      await clientTransport?.close();
    } finally {
      clientTransport = undefined;
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.doUnmock("@modelcontextprotocol/sdk/server/stdio.js");
      vi.resetModules();
    }
  });

  async function expectText(
    name: string,
    args: Record<string, unknown>,
    text: string,
    paths: string[] = []
  ) {
    const result = await client.callTool({ name, arguments: args });
    expect(result.content).toEqual([{ type: "text", text }]);
    expect(result.isError).not.toBe(true);
    expect(fetchMock.mock.calls).toEqual(
      paths.map((path) => [`${registry}${path}`])
    );
  }

  it("lists exactly six tools with their input schemas", async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(6);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(6);
    expect(
      Object.fromEntries(tools.map((tool) => [tool.name, tool.inputSchema]))
    ).toEqual({
      list_components: { type: "object", properties: {} },
      view_component: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
      search_components: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
      get_install_command: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
      list_scenarios: { type: "object", properties: {} },
      compose: {
        type: "object",
        properties: { scenario: { type: "string" } },
        required: ["scenario"],
      },
    });
    for (const tool of tools) {
      expect(tool.description).toEqual(expect.stringMatching(/\S/u));
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists registry components", async () => {
    await expectText(
      "list_components",
      {},
      "Frakment components (2):\n\n- button: Clickable action\n- avatar: Profile image",
      ["/r/index.json"]
    );
  });

  it("returns component source, dependencies, and labeled binary assets", async () => {
    await expectText(
      "view_component",
      { name: "button" },
      "# button\n\nClickable action\n\nDependencies: react\nRegistry dependencies: icons\n\n--- components/ui/button.tsx ---\nexport {};\n\n--- public/button.avif (encoding: base64) ---\nAAAA",
      ["/r/button.json"]
    );
  });

  it.each([
    ["name", "BuTtOn", 'Found 1 for "BuTtOn":\n\n- button: Clickable action'],
    ["description", "PROFILE", 'Found 1 for "PROFILE":\n\n- avatar: Profile image'],
  ])("searches by %s without case sensitivity", async (_field, query, text) => {
    await expectText("search_components", { query }, text, ["/r/index.json"]);
  });

  it("returns an ordinary text response for an empty search result", async () => {
    await expectText(
      "search_components",
      { query: "no-match" },
      'Found 0 for "no-match":\n\n(none)',
      ["/r/index.json"]
    );
  });

  it("returns the install command without fetching the registry", async () => {
    await expectText(
      "get_install_command",
      { name: "button" },
      "npx frakment@latest add button"
    );
  });

  it("lists the available scenarios without fetching the registry", async () => {
    await expectText(
      "list_scenarios",
      {},
      "Frakment scenarios (7):\n\n" +
        "- agent-timeline: Agent activity view with trace steps and code output\n" +
        "- chat: Chat interface with auto-scroll and animated turns\n" +
        "- code-output: Syntax-highlighted code with copy actions and line diffs\n" +
        "- empty-state: Zero-data placeholder with optional call-to-action\n" +
        "- login-form: Accessible login form with remember-me toggle\n" +
        "- search-input: Search input with inline button and loading state\n" +
        "- settings-panel: Settings panel with boolean toggles and grouped options\n\n" +
        "Use compose with a scenario name to get the full component set."
    );
  });

  it("composes a scenario without case sensitivity or registry requests", async () => {
    await expectText(
      "compose",
      { scenario: "CHAT" },
      "# chat\n\nChat interface with auto-scroll and animated turns\n\n" +
        "Components: message, avatar\n\nInstall: npx frakment@latest add message\n\n" +
        "message includes the message, bubble, scroll, and animated message primitives. Add avatar separately."
    );
  });

  it("returns an ordinary text response for an unknown scenario", async () => {
    await expectText(
      "compose",
      { scenario: "missing" },
      'Unknown scenario: "missing".\n\n' +
        "Available: agent-timeline, chat, code-output, empty-state, login-form, search-input, settings-panel"
    );
  });
});
