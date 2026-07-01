// Dummy data store shaped like the future Supabase tables (buildings / requests).
// Swap this module's internals for a Supabase client later — the function
// signatures below are the contract the MCP tools depend on, so callers
// (src/tools.ts) never need to change when the storage backend changes.

export type Building = {
  id: string;
  name: string;
  address: string;
  rules: string; // 館内ルールの要約（将来は別テーブルに分割）
  facilities: string[]; // 予約可能な設備
};

export type BuildingRequest = {
  id: string;
  buildingId: string;
  type: string; // 例: "meeting_room" | "renovation" | "complaint"
  detail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const buildings: Building[] = [
  {
    id: "bldg-001",
    name: "Sample Tower",
    address: "東京都千代田区丸の内1-1-1",
    rules: "共用部の利用は9:00-22:00。会議室利用は前日17時までに要予約。",
    facilities: ["会議室A", "会議室B", "ラウンジ"],
  },
];

const requests: BuildingRequest[] = [
  {
    id: "req-001",
    buildingId: "bldg-001",
    type: "meeting_room",
    detail: "会議室Aを7/3 10:00-11:00で利用したい",
    status: "pending",
    createdAt: "2026-07-01T09:00:00+09:00",
  },
];

export async function listBuildings(): Promise<Building[]> {
  return buildings;
}

export async function getBuilding(id: string): Promise<Building | undefined> {
  return buildings.find((b) => b.id === id);
}

export async function listRequests(buildingId?: string): Promise<BuildingRequest[]> {
  return buildingId ? requests.filter((r) => r.buildingId === buildingId) : requests;
}

export async function createRequest(input: {
  buildingId: string;
  type: string;
  detail: string;
}): Promise<BuildingRequest> {
  const request: BuildingRequest = {
    id: `req-${String(requests.length + 1).padStart(3, "0")}`,
    buildingId: input.buildingId,
    type: input.type,
    detail: input.detail,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.push(request);
  return request;
}
