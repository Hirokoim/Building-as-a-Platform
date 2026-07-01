import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools.js";

const PORT = Number(process.env.PORT ?? 3900);

const app = express();
app.use(express.json());

// セッションごとにMCPサーバーとtransportを保持する。
// stateless(毎回新規)にしないのは、SDKのStreamable HTTPが
// セッション単位の初期化ハンドシェイクを前提にしているため。
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.header("mcp-session-id");
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    const server = new McpServer({ name: "building-context", version: "0.1.0" });
    registerTools(server);

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport!);
      },
    });
    transport.onclose = () => {
      if (transport!.sessionId) transports.delete(transport!.sessionId);
    };
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Building Context MCP server listening on http://localhost:${PORT}/mcp`);
});
