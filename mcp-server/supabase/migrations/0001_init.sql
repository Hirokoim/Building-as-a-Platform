-- Building Context Layer: initial schema
-- Supabase の SQL Editor にそのまま貼り付けて実行してください。

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  rules_summary text not null default '',
  created_at timestamptz not null default now()
);

-- 設備は1ビルに複数あるため別テーブルに分離
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  type text not null,
  detail text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_facilities_building_id on facilities(building_id);
create index if not exists idx_requests_building_id on requests(building_id);

-- RLS を有効化。MCPサーバーは service_role キー（RLSを常にバイパスする特権キー）で
-- アクセスするため、現時点ではテナント向けの閲覧ポリシーは定義していない。
-- 将来「テナントがブラウザから直接自分のビルのデータだけを見る」機能を作る際は、
-- anon/authenticated 向けに building_id で絞るポリシーをここに追加する。
alter table buildings enable row level security;
alter table facilities enable row level security;
alter table requests enable row level security;

-- service_role は本来RLSを常にバイパスするが、テーブル自体への GRANT が
-- 無いと "permission denied" になるため明示的に付与する。
grant usage on schema public to service_role;
grant select, insert, update, delete on buildings, facilities, requests to service_role;

-- 動作確認用のサンプルデータ（mcp-server/src/store.ts のダミーデータと同内容）
insert into buildings (id, name, address, rules_summary)
values ('11111111-1111-1111-1111-111111111111', 'Sample Tower', '東京都千代田区丸の内1-1-1',
        '共用部の利用は9:00-22:00。会議室利用は前日17時までに要予約。')
on conflict (id) do nothing;

insert into facilities (building_id, name)
select '11111111-1111-1111-1111-111111111111', name
from (values ('会議室A'), ('会議室B'), ('ラウンジ')) as f(name)
where not exists (
  select 1 from facilities where building_id = '11111111-1111-1111-1111-111111111111'
);
