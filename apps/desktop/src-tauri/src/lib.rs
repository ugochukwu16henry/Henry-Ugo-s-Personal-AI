// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Request permission to write a file
/// Note: File operations in Tauri v2 are handled via the fs plugin
/// which respects the capabilities configuration
#[tauri::command]
async fn request_file_write_permission(
    _file_path: String,
    _diff_preview: String,
) -> Result<bool, String> {
    // Permission is handled by Tauri's capabilities system
    // The frontend should show a confirmation dialog before calling this
    // This just returns true to indicate the request is valid
    Ok(true)
}

/// Apply a file edit after permission has been granted
#[tauri::command]
async fn apply_file_edit(file_path: String, content: String) -> Result<(), String> {
    use std::fs;
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {}: {}", file_path, e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init()) // Shell plugin for terminal execution
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            request_file_write_permission,
            apply_file_edit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
