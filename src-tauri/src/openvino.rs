use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use log::{info, warn};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenVINOStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub python_available: bool,
    pub python_version: Option<String>,
    pub npu_plugin_available: bool,
    pub install_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelInfo {
    pub name: String,
    pub task: String,
    pub framework: String,
    pub description: String,
    pub download_url: String,
    pub size_mb: f32,
}

/// Check if a command exists on PATH
fn command_exists(cmd: &str) -> bool {
    Command::new("where")
        .arg(cmd)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Detect OpenVINO installation status
pub fn detect_openvino() -> OpenVINOStatus {
    // Check Python availability
    let python_available = command_exists("python");
    let python_version = if python_available {
        get_python_version()
    } else {
        None
    };

    // Try to detect OpenVINO via Python package
    let (installed, version, npu_available, install_path) = if python_available {
        detect_via_python()
    } else {
        // Fallback: check common install paths
        detect_via_filesystem()
    };

    OpenVINOStatus {
        installed,
        version,
        python_available,
        python_version,
        npu_plugin_available: npu_available,
        install_path,
    }
}

fn get_python_version() -> Option<String> {
    Command::new("python")
        .args(["--version"])
        .output()
        .ok()
        .and_then(|o| {
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            stdout.trim().strip_prefix("Python ").map(|s| s.to_string())
        })
}

fn detect_via_python() -> (bool, Option<String>, bool, Option<String>) {
    let script = r#"
        try {
            import openvino as ov
            print(f"VERSION={ov.__version__}")
            try:
                core = ov.Core()
                devices = core.available_devices
                print(f"DEVICES={','.join(devices)}")
            except:
                print("DEVICES=")
            try:
                import openvino.properties
                print("NPU_PLUGIN=true")
            except:
                print("NPU_PLUGIN=false")
        except ImportError:
            print("INSTALLED=false")
    "#;

    let output = Command::new("python")
        .args(["-c", script])
        .output()
        .ok();

    match output {
        Some(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            let mut version = None;
            let mut npu_available = false;
            let mut installed = false;

            for line in stdout.lines() {
                if let Some(v) = line.strip_prefix("VERSION=") {
                    version = Some(v.to_string());
                    installed = true;
                } else if let Some(d) = line.strip_prefix("DEVICES=") {
                    npu_available = d.contains("NPU");
                } else if line == "NPU_PLUGIN=true" {
                    npu_available = true;
                } else if line == "INSTALLED=false" {
                    installed = false;
                }
            }

            (installed, version, npu_available, None)
        }
        _ => (false, None, false, None),
    }
}

fn detect_via_filesystem() -> (bool, Option<String>, bool, Option<String>) {
    // Check common OpenVINO install paths on Windows
    let common_paths = [
        r"C:\Program Files (x86)\Intel\openvino",
        r"C:\Program Files\Intel\openvino",
        r"C:\intel\openvino",
    ];

    for base in &common_paths {
        let version_file = Path::new(base).join("version.txt");
        if version_file.exists() {
            let version = std::fs::read_to_string(&version_file)
                .ok()
                .map(|v| v.trim().to_string());

            // Check for NPU plugin
            let npu_plugin = Path::new(base)
                .join("runtime")
                .join("lib")
                .join("intel64")
                .join("openvino_npu_plugin.dll")
                .exists();

            return (true, version, npu_plugin, Some(base.to_string()));
        }
    }

    (false, None, false, None)
}

/// Get recommended models for OpenVINO
pub fn get_recommended_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            name: "Qwen2.5-0.5B".to_string(),
            task: "文本生成".to_string(),
            framework: "OpenVINO IR".to_string(),
            description: "轻量级中文对话模型，适合 NPU 推理".to_string(),
            download_url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct".to_string(),
            size_mb: 400.0,
        },
        ModelInfo {
            name: "Phi-3-mini-4k".to_string(),
            task: "文本生成".to_string(),
            framework: "OpenVINO IR".to_string(),
            description: "Microsoft 小型高效模型".to_string(),
            download_url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-openvino".to_string(),
            size_mb: 2300.0,
        },
        ModelInfo {
            name: "stable-diffusion-xl-base".to_string(),
            task: "文生图".to_string(),
            framework: "OpenVINO IR".to_string(),
            description: "SDXL 基础模型，高质量图片生成".to_string(),
            download_url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0-openvino".to_string(),
            size_mb: 6500.0,
        },
        ModelInfo {
            name: "whisper-base".to_string(),
            task: "语音识别".to_string(),
            framework: "OpenVINO IR".to_string(),
            description: "OpenAI 语音转文字模型".to_string(),
            download_url: "https://huggingface.co/openai/whisper-base".to_string(),
            size_mb: 150.0,
        },
    ]
}

/// Get install instructions based on current environment
pub fn get_install_instructions() -> String {
    let python_available = command_exists("python");
    if python_available {
        r#"pip install openvino
pip install openvino-genai  # For LLM support"#.to_string()
    } else {
        r#"请先安装 Python 3.9+，然后执行：
pip install openvino
pip install openvino-genai  # For LLM support

或下载 OpenVINO Runtime：
https://docs.openvino.ai/latest/get_started.html"#.to_string()
    }
}