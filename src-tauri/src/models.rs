use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogLevel {
    Error,
    Fatal,
    Warn,
    Info,
    Debug,
    Trace,
    Unknown,
}

impl LogLevel {
    pub fn from_line(line: &str) -> Self {
        let upper = line.to_uppercase();
        if upper.contains("ERROR") || upper.contains("FATAL") {
            if upper.contains("FATAL") {
                LogLevel::Fatal
            } else {
                LogLevel::Error
            }
        } else if upper.contains("WARN") {
            LogLevel::Warn
        } else if upper.contains("INFO") {
            LogLevel::Info
        } else if upper.contains("DEBUG") {
            LogLevel::Debug
        } else if upper.contains("TRACE") {
            LogLevel::Trace
        } else {
            LogLevel::Unknown
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogLine {
    pub id: u64,
    pub raw: String,
    pub level: LogLevel,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    pub is_stack_frame: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_group_id: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkResult {
    pub lines: Vec<LogLine>,
    pub next_offset: u64,
    pub is_eof: bool,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub size_bytes: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiMessage {
    pub role: String,
    pub content: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiStreamChunk {
    pub token: String,
}

use std::sync::Mutex;
use tokio_util::sync::CancellationToken;

pub struct AppState {
    pub ai_cancel_token: Mutex<Option<CancellationToken>>,
}
