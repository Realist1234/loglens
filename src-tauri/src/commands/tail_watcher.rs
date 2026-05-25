use crate::models::LogLine;
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tauri::Emitter;
use tokio::sync::Mutex;

struct WatchState {
    _watcher: RecommendedWatcher,
    stopped: Arc<Mutex<bool>>,
}

static WATCH_STATE: Mutex<Option<WatchState>> = Mutex::const_new(None);

#[tauri::command]
pub async fn watch_file_tail(
    app: tauri::AppHandle,
    path: String,
    _from_offset: u64,
) -> Result<(), String> {
    // Stop any existing watcher
    stop_existing_watcher().await;

    let path_clone = path.clone();
    let stopped = Arc::new(Mutex::new(false));
    let stopped_clone = stopped.clone();

    let (tx, _rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                if event.kind.is_modify() {
                    // Debounce handled by notify internally
                    let _ = tx.send(());
                }
            }
        },
        notify::Config::default().with_poll_interval(Duration::from_millis(50)),
    )
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&path_clone), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    let app_handle = app.clone();
    let path_for_task = path.clone();

    tokio::spawn(async move {
        let mut last_size = tokio::fs::metadata(&path_for_task)
            .await
            .map(|m| m.len())
            .unwrap_or(0);

        loop {
            tokio::time::sleep(Duration::from_millis(100)).await;

            if *stopped_clone.lock().await {
                break;
            }

            let current_size = tokio::fs::metadata(&path_for_task)
                .await
                .map(|m| m.len())
                .unwrap_or(0);

            if current_size > last_size {
                // Read new content
                if let Ok(new_lines) =
                    read_new_lines(&path_for_task, last_size, current_size).await
                {
                    if !new_lines.is_empty() {
                        let _ = app_handle.emit("log-tail-update", &new_lines);
                    }
                }
                last_size = current_size;
            }
        }
    });

    let state = WatchState {
        _watcher: watcher,
        stopped,
    };

    *WATCH_STATE.lock().await = Some(state);
    Ok(())
}

#[tauri::command]
pub async fn stop_watch() -> Result<(), String> {
    stop_existing_watcher().await;
    Ok(())
}

async fn stop_existing_watcher() {
    if let Some(state) = WATCH_STATE.lock().await.take() {
        *state.stopped.lock().await = true;
    }
}

async fn read_new_lines(
    path: &str,
    from_offset: u64,
    to_offset: u64,
) -> Result<Vec<LogLine>, String> {
    use crate::models::LogLevel;
    use encoding_rs::GBK;
    use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};

    let file = tokio::fs::File::open(path).await.map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(file);
    reader
        .seek(std::io::SeekFrom::Start(from_offset))
        .await
        .map_err(|e| e.to_string())?;

    let mut lines = Vec::new();
    let mut bytes_to_read = to_offset - from_offset;
    let mut line_no = from_offset;

    while bytes_to_read > 0 {
        let mut buf = Vec::new();
        let n = reader
            .read_until(b'\n', &mut buf)
            .await
            .map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        bytes_to_read = bytes_to_read.saturating_sub(n as u64);

        let raw_line = if buf.ends_with(b"\n") {
            if buf.ends_with(b"\r\n") {
                &buf[..buf.len() - 2]
            } else {
                &buf[..buf.len() - 1]
            }
        } else {
            &buf[..]
        };

        let line_str = match std::str::from_utf8(raw_line) {
            Ok(s) => s.to_string(),
            Err(_) => {
                let (decoded, _, _) = GBK.decode(raw_line);
                decoded.into_owned()
            }
        };

        line_no += 1;
        lines.push(LogLine {
            id: line_no,
            level: LogLevel::from_line(&line_str),
            timestamp: None,
            is_stack_frame: false,
            stack_group_id: None,
            raw: line_str,
        });
    }

    Ok(lines)
}
