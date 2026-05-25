use crate::models::{AiConfig, AiMessage, AppState};
use tauri::Emitter;
use tokio_util::sync::CancellationToken;

#[tauri::command]
pub async fn ai_chat_stream(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    _config: AiConfig,
    _messages: Vec<AiMessage>,
) -> Result<(), String> {
    let token = CancellationToken::new();
    {
        let mut cancel = state.ai_cancel_token.lock().map_err(|e| e.to_string())?;
        *cancel = Some(token.clone());
    }

    let app_handle = app.clone();

    tokio::spawn(async move {
        // Mock implementation: simulate streaming response
        let mock_response = "这是 AI 分析的模拟回复。\n\n**根本原因：**\n日志中出现了 NullPointerException，通常是因为某个对象未正确初始化。\n\n**修复建议：**\n1. 检查相关服务的依赖注入是否正确\n2. 确认配置文件中的参数是否完整\n3. 添加空值检查";

        for ch in mock_response.chars() {
            if token.is_cancelled() {
                let _ = app_handle.emit("ai-stream-error", serde_json::json!({ "message": "Cancelled" }));
                return;
            }

            let _ = app_handle.emit(
                "ai-stream-chunk",
                serde_json::json!({ "token": ch.to_string() }),
            );
            tokio::time::sleep(std::time::Duration::from_millis(20)).await;
        }

        let _ = app_handle.emit("ai-stream-done", ());
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_ai_stream(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut cancel = state.ai_cancel_token.lock().map_err(|e| e.to_string())?;
    if let Some(token) = cancel.take() {
        token.cancel();
    }
    Ok(())
}
