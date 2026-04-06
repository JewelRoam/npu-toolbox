#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod npu_detector;
mod openvino;
mod ps;
mod python_env;

use log::info;
use tauri::Manager;

fn main() {
    // Initialize logger with debug level
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug"))
        .format_timestamp_millis()
        .init();
    
    info!("NPU Toolbox starting...");
    info!("Current working directory: {:?}", std::env::current_dir());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Hardware info
            commands::get_hardware_info,
            commands::get_npu_status,
            commands::detect_npu,
            commands::get_system_info,
            commands::get_storage_info,
            // Tool management
            commands::get_tools_list,
            commands::download_tool,
            commands::launch_tool,
            // Cache management
            commands::cleanup_cache,
            commands::get_cache_size,
            // Settings management
            commands::save_settings,
            commands::load_settings,
            // Ollama proxy
            commands::ollama_check,
            commands::ollama_list_models,
            commands::ollama_chat,
            commands::ollama_stop_generation,
            // OpenVINO
            openvino::detect_openvino,
            openvino::install_openvino,
            openvino::uninstall_openvino,
            openvino::get_recommended_models,
            openvino::get_install_instructions,
            openvino::test_openvino_inference,
            // Python env
            python_env::get_env_status,
            python_env::init_env,
            python_env::remove_env,
        ])
        .setup(|app| {
            info!("Application initialized");
            
            // Setup window
            if let Some(window) = app.get_webview_window("main") {
                window.set_title("NPU Toolbox").ok();
                #[cfg(debug_assertions)]
                {
                    window.open_devtools();
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Failed to start application");
}
