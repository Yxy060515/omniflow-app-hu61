CREATE TABLE IF NOT EXISTS crowd_feedback (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  bus_id TEXT,
  stop_name TEXT,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crowd_feedback_route_time_idx ON crowd_feedback (route_id, created_at);
CREATE INDEX IF NOT EXISTS crowd_feedback_client_idx ON crowd_feedback (client_id, created_at);
