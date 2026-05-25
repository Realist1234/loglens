export type LogLevel =
  | "ERROR"
  | "FATAL"
  | "WARN"
  | "INFO"
  | "DEBUG"
  | "TRACE"
  | "UNKNOWN";

export interface LogLine {
  id: number;
  raw: string;
  level: LogLevel;
  timestamp?: string;
  is_stack_frame: boolean;
  stack_group_id?: number;
}

export interface ChunkResult {
  lines: LogLine[];
  next_offset: number;
  is_eof: boolean;
  total_bytes: number;
}

export interface FileInfo {
  name: string;
  size_bytes: number;
  modified_at: string;
}

export interface AiConfig {
  api_key: string;
  base_url: string;
  model: string;
  proxy_url?: string;
}

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface FilterState {
  keyword: string;
  isRegex: boolean;
  levels: Set<LogLevel>;
}
