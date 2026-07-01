import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createRequest, getBuilding, listBuildings, listRequests } from "./store.js";

export function registerTools(server: McpServer) {
  server.registerTool(
    "getBuildings",
    {
      title: "ビル一覧を取得",
      description: "管理下にあるビルの一覧（名称・住所・館内ルール概要・設備）を返す",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await listBuildings()) }],
    }),
  );

  server.registerTool(
    "getBuildingDetail",
    {
      title: "ビル詳細を取得",
      description: "指定したビルIDの詳細（館内ルール・設備一覧）を返す",
      inputSchema: { buildingId: z.string() },
    },
    async ({ buildingId }) => {
      const building = await getBuilding(buildingId);
      if (!building) {
        return { content: [{ type: "text", text: `ビルが見つかりません: ${buildingId}` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(building) }] };
    },
  );

  server.registerTool(
    "getRequests",
    {
      title: "申請一覧を取得",
      description: "指定したビルの申請一覧を返す（buildingId省略時は全件）",
      inputSchema: { buildingId: z.string().optional() },
    },
    async ({ buildingId }) => ({
      content: [{ type: "text", text: JSON.stringify(await listRequests(buildingId)) }],
    }),
  );

  server.registerTool(
    "createRequest",
    {
      title: "申請を作成",
      description: "テナントからの申請（会議室利用・改修・苦情など）を新規作成する",
      inputSchema: {
        buildingId: z.string(),
        type: z.string().describe("申請種別。例: meeting_room, renovation, complaint"),
        detail: z.string().describe("申請内容の詳細"),
      },
    },
    async ({ buildingId, type, detail }) => {
      const request = await createRequest({ buildingId, type, detail });
      return { content: [{ type: "text", text: JSON.stringify(request) }] };
    },
  );
}
