# REST API × MulmoClaude 連携設計

## 全体構成

```
あなたのREST API          MulmoClaude
┌─────────────────┐       ┌──────────────────────────┐
│ GET /buildings  │  ←──  │ Claude がツールとして呼ぶ  │
│ GET /requests   │       │ コレクションUIに表示       │
│ POST /requests  │  ──→  │ 申請フォームで入力・送信   │
└─────────────────┘       └──────────────────────────┘
```

## ステップ別手順

### Step 1: REST APIを作る

```
GET  /api/buildings        → ビル一覧
GET  /api/buildings/:id    → ビル詳細
GET  /api/requests         → 申請一覧
POST /api/requests         → 申請作成
```

### Step 2: MCPサーバーを作る（APIのラッパー）

```js
// my-building-mcp-server.js
const server = new McpServer({ name: "building-api" });

server.tool("getBuildings", "ビル一覧を取得", {}, async () => {
  const res = await fetch("http://localhost:3001/api/buildings");
  return { content: [{ type: "text", text: JSON.stringify(await res.json()) }] };
});

server.tool("createRequest", "申請を作成",
  { buildingId: z.string(), type: z.string(), detail: z.string() },
  async ({ buildingId, type, detail }) => {
    const res = await fetch("http://localhost:3001/api/requests", {
      method: "POST",
      body: JSON.stringify({ buildingId, type, detail })
    });
    return { content: [{ type: "text", text: "申請を作成しました" }] };
  }
);
```

### Step 3: config/mcp.json に登録

```json
{
  "mcpServers": {
    "building-api": {
      "command": "node",
      "args": ["C:/path/to/my-building-mcp-server.js"]
    }
  }
}
```

### Step 4: コレクションを定義する

JSONスキーマでコレクションを定義し、チャットから操作できるようにする。

## 次のステップ

- [ ] REST APIの設計を確定する
- [ ] MCPサーバーのコードを書く
- [ ] config/mcp.json に登録する
- [ ] コレクションスキーマを定義する
