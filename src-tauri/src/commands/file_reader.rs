use crate::models::{ChunkResult, FileInfo, LogLevel, LogLine};
use encoding_rs::GBK;
use std::io::SeekFrom;
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};

const CHUNK_SIZE: u64 = 524_288; // 512KB

fn parse_timestamp(line: &str) -> Option<String> {
    // Matches: yyyy-MM-dd HH:mm:ss (with optional milliseconds)
    let bytes = line.as_bytes();
    if bytes.len() < 19 {
        return None;
    }
    // Quick check: digit at positions 0-3, '-' at 4,7, ' ' at 10, ':' at 13,16
    if bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes[10] == b' '
        && bytes[13] == b':'
        && bytes[16] == b':'
    {
        let prefix = &line[..19];
        if prefix.chars().all(|c| c.is_ascii_digit() || "- :".contains(c)) {
            return Some(prefix.to_string());
        }
    }
    None
}

fn is_stack_frame(line: &str) -> bool {
    line.starts_with("\tat ") || line.starts_with("\tat ") || line.starts_with("    at ")
}

fn try_decode_utf8_or_gbk(raw: &[u8]) -> String {
    match std::str::from_utf8(raw) {
        Ok(s) => s.to_string(),
        Err(_) => {
            let (decoded, _, _) = GBK.decode(raw);
            decoded.into_owned()
        }
    }
}

#[tauri::command]
pub async fn read_log_chunk(path: String, offset: u64) -> Result<ChunkResult, String> {
    let file = File::open(&path).await.map_err(|e| e.to_string())?;
    let total_bytes = file.metadata().await.map_err(|e| e.to_string())?.len();

    if offset >= total_bytes {
        return Ok(ChunkResult {
            lines: vec![],
            next_offset: offset,
            is_eof: true,
            total_bytes,
        });
    }

    let mut reader = BufReader::new(file);
    reader
        .seek(SeekFrom::Start(offset))
        .await
        .map_err(|e| e.to_string())?;

    let mut lines = Vec::new();
    let mut bytes_read: u64 = 0;
    let mut line_no: u64 = if offset == 0 { 1 } else { 0 }; // caller should track
    let mut current_stack_group: u64 = 0;
    let mut in_stack_group = false;
    let mut buf = Vec::new();

    loop {
        if bytes_read >= CHUNK_SIZE {
            break;
        }

        buf.clear();
        let n = reader
            .read_until(b'\n', &mut buf)
            .await
            .map_err(|e| e.to_string())?;

        if n == 0 {
            break; // EOF
        }

        // Strip trailing \n or \r\n
        let raw_line = if buf.ends_with(b"\n") {
            if buf.ends_with(b"\r\n") {
                &buf[..buf.len() - 2]
            } else {
                &buf[..buf.len() - 1]
            }
        } else {
            &buf[..]
        };

        let line_str = try_decode_utf8_or_gbk(raw_line);
        bytes_read += n as u64;
        line_no += 1;

        let is_stack = is_stack_frame(&line_str);
        let stack_group_id = if is_stack {
            if !in_stack_group {
                current_stack_group += 1;
                in_stack_group = true;
            }
            Some(current_stack_group)
        } else {
            in_stack_group = false;
            None
        };

        lines.push(LogLine {
            id: line_no,
            level: LogLevel::from_line(&line_str),
            timestamp: parse_timestamp(&line_str),
            is_stack_frame: is_stack,
            stack_group_id,
            raw: line_str,
        });
    }

    let next_offset = offset + bytes_read;
    let is_eof = next_offset >= total_bytes;

    Ok(ChunkResult {
        lines,
        next_offset,
        is_eof,
        total_bytes,
    })
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = tokio::fs::metadata(&path)
        .await
        .map_err(|e| e.to_string())?;

    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let modified_at = metadata
        .modified()
        .map(|t| {
            let dt: chrono::DateTime<chrono::Utc> = t.into();
            dt.to_rfc3339()
        })
        .unwrap_or_default();

    Ok(FileInfo {
        name,
        size_bytes: metadata.len(),
        modified_at,
    })
}
