mod commands;
mod models;

use models::AppState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState {
            ai_cancel_token: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_reader::read_log_chunk,
            commands::file_reader::get_file_info,
            commands::tail_watcher::watch_file_tail,
            commands::tail_watcher::stop_watch,
            commands::ai_proxy::ai_chat_stream,
            commands::ai_proxy::cancel_ai_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
