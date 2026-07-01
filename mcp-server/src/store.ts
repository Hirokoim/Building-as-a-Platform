// Supabase-backed data store. Function signatures are the contract the MCP
// tools depend on (src/tools.ts) — this module can be swapped again later
// (e.g. for a custom DB) without touching the tools.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see mcp-server/.env)");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export type Building = {
  id: string;
  name: string;
  address: string;
  rules: string;
  facilities: string[];
};

export type BuildingRequest = {
  id: string;
  buildingId: string;
  type: string; // 例: "meeting_room" | "renovation" | "complaint"
  detail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type BuildingRow = {
  id: string;
  name: string;
  address: string;
  rules_summary: string;
  facilities: { name: string }[];
};

function toBuilding(row: BuildingRow): Building {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    rules: row.rules_summary,
    facilities: row.facilities.map((f) => f.name),
  };
}

type RequestRow = {
  id: string;
  building_id: string;
  type: string;
  detail: string;
  status: BuildingRequest["status"];
  created_at: string;
};

function toRequest(row: RequestRow): BuildingRequest {
  return {
    id: row.id,
    buildingId: row.building_id,
    type: row.type,
    detail: row.detail,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listBuildings(): Promise<Building[]> {
  const { data, error } = await supabase.from("buildings").select("id, name, address, rules_summary, facilities(name)");
  if (error) throw new Error(`listBuildings failed: ${error.message}`);
  return (data as BuildingRow[]).map(toBuilding);
}

export async function getBuilding(id: string): Promise<Building | undefined> {
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name, address, rules_summary, facilities(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getBuilding failed: ${error.message}`);
  return data ? toBuilding(data as BuildingRow) : undefined;
}

export async function listRequests(buildingId?: string): Promise<BuildingRequest[]> {
  let query = supabase.from("requests").select("id, building_id, type, detail, status, created_at");
  if (buildingId) query = query.eq("building_id", buildingId);
  const { data, error } = await query;
  if (error) throw new Error(`listRequests failed: ${error.message}`);
  return (data as RequestRow[]).map(toRequest);
}

export async function createRequest(input: {
  buildingId: string;
  type: string;
  detail: string;
}): Promise<BuildingRequest> {
  const { data, error } = await supabase
    .from("requests")
    .insert({ building_id: input.buildingId, type: input.type, detail: input.detail })
    .select("id, building_id, type, detail, status, created_at")
    .single();
  if (error) throw new Error(`createRequest failed: ${error.message}`);
  return toRequest(data as RequestRow);
}
