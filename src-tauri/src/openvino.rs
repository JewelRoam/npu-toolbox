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
    pub available_devices: Vec<String>,
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
    pub recommended_device: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InferenceTestResult {
    pub success: bool,
    pub device: String,
    pub latency_ms: f64,
    pub message: String,
}

// ── Pure parsing (testable without I/O) ───────────────────────────────

#[derive(Default)]
struct PythonOutput {
    installed: bool,
    version: Option<String>,
    devices: Vec<String>,
}

fn parse_python_output(stdout: &str) -> PythonOutput {
    let mut result = PythonOutput::default();
    for line in stdout.lines() {
        if let Some(v) = line.strip_prefix("VERSION=") {
            result.version = Some(v.trim().to_string());
            result.installed = true;
        } else if let Some(d) = line.strip_prefix("DEVICES=") {
            result.devices = d.split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
        } else if line == "INSTALLED=false" {
            result.installed = false;
        }
    }
    result
}

// ── I/O helpers ───────────────────────────────────────────────────────

fn command_exists(cmd: &str) -> bool {
    Command::new("where").arg(cmd).output().map(|o| o.status.success()).unwrap_or(false)
}

fn get_python_version() -> Option<String> {
    Command::new("python").args(["--version"]).output().ok().and_then(|o| {
        String::from_utf8_lossy(&o.stdout).trim().strip_prefix("Python ").map(|s| s.to_string())
    })
}

fn run_python_script(script: &str) -> Option<String> {
    let output = Command::new("python").args(["-c", script]).output().ok()?;
    if !output.status.success() {
        warn!("Python script stderr: {}", String::from_utf8_lossy(&output.stderr));
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Detect OpenVINO via Python import (primary path)
fn detect_via_python() -> (bool, Option<String>, bool, Vec<String>) {
    let script = r#"
import sys
try:
    import openvino as ov
    print(f"VERSION={ov.__version__}")
    try:
        core = ov.Core()
        devices = core.available_devices
        print(f"DEVICES={','.join(devices)}")
    except Exception as e:
        print(f"DEVICES=")
        print(f"ERR_CORE={e}", file=sys.stderr)
except ImportError:
    print("INSTALLED=false")
"#;

    let stdout = match run_python_script(script) {
        Some(s) => s,
        None => return (false, None, false, Vec::new()),
    };

    let parsed = parse_python_output(&stdout);
    // NPU available only when actually listed in devices
    let npu_available = parsed.devices.iter().any(|d| d.contains("NPU"));

    (parsed.installed, parsed.version, npu_available, parsed.devices)
}

/// Detect OpenVINO via filesystem (fallback when no Python)
fn detect_via_filesystem() -> (bool, Option<String>, bool, Vec<String>) {
    let candidates = [
        r"C:\Program Files (x86)\Intel\openvino",
        r"C:\Program Files\Intel\openvino",
        r"C:\intel\openvino",
    ];

    for base in &candidates {
        let version_file = Path::new(base).join("version.txt");
        if !version_file.exists() {
            continue;
        }

        let version = std::fs::read_to_string(&version_file).ok().map(|v| v.trim().to_string());

        // Check multiple possible plugin locations across OpenVINO versions
        let plugin_patterns = [
            Path::new(base).join("runtime").join("lib").join("intel64").join("openvino_npu_plugin.dll"),
            Path::new(base).join("runtime").join("lib").join("intel64").join("plugins").join("openvino_npu_plugin.dll"),
            Path::new(base).join("runtime").join("lib").join("intel64").join("plugins").join("intel").join("openvino_npu_plugin.dll"),
        ];
        let npu_available = plugin_patterns.iter().any(|p| p.exists());

        return (true, version, npu_available, Vec::new());
    }

    (false, None, false, Vec::new())
}

// ── Public Tauri commands ──────────────────────────────────────────────

#[tauri::command]
pub fn detect_openvino() -> OpenVINOStatus {
    let python_available = command_exists("python");
    let python_version = python_available.then(get_python_version).flatten();

    let (installed, version, npu_available, devices) = if python_available {
        detect_via_python()
    } else {
        detect_via_filesystem()
    };

    info!(
        "OpenVINO: installed={}, version={:?}, npu={}, devices={:?}",
        installed, version, npu_available, devices
    );

    OpenVINOStatus {
        installed,
        version,
        python_available,
        python_version,
        npu_plugin_available: npu_available,
        available_devices: devices,
        install_path: None,
    }
}

#[tauri::command]
pub fn get_recommended_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            name: "Qwen2.5-0.5B-Instruct".into(),
            task: "文本生成".into(),
            framework: "OpenVINO IR".into(),
            description: "轻量级中文对话模型，适合 NPU 推理".into(),
            download_url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct".into(),
            size_mb: 400.0,
            recommended_device: "NPU / CPU".into(),
        },
        ModelInfo {
            name: "Phi-3-mini-4k-instruct".into(),
            task: "文本生成".into(),
            framework: "OpenVINO IR".into(),
            description: "Microsoft 小型高效模型".into(),
            download_url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-openvino".into(),
            size_mb: 2300.0,
            recommended_device: "GPU / CPU".into(),
        },
        ModelInfo {
            name: "stable-diffusion-xl-base-1.0".into(),
            task: "文生图".into(),
            framework: "OpenVINO IR".into(),
            description: "SDXL 基础模型，高质量图片生成".into(),
            download_url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0-openvino".into(),
            size_mb: 6500.0,
            recommended_device: "GPU".into(),
        },
        ModelInfo {
            name: "whisper-base".into(),
            task: "语音识别".into(),
            framework: "OpenVINO IR".into(),
            description: "OpenAI 语音转文字模型".into(),
            download_url: "https://huggingface.co/openai/whisper-base".into(),
            size_mb: 150.0,
            recommended_device: "NPU / CPU".into(),
        },
    ]
}

#[tauri::command]
pub fn get_install_instructions() -> String {
    if command_exists("python") {
        r#"pip install openvino
pip install openvino-genai    # LLM 支持（推荐）"#.into()
    } else {
        r#"1. 安装 Python 3.9+ (推荐 3.10-3.12)
   https://www.python.org/downloads/

2. 安装 OpenVINO：
   pip install openvino
   pip install openvino-genai    # LLM 支持（推荐）

3. 验证安装：
   python -c "import openvino as ov; print(ov.__version__)"

详细文档：https://docs.openvino.ai/latest/get_started.html"#.into()
    }
}

#[tauri::command]
pub fn test_openvino_inference(device: Option<String>) -> InferenceTestResult {
    let device = device.unwrap_or_else(|| "CPU".into());

    let script = r#"
import time, sys
try:
    import openvino as ov
    import numpy as np

    core = ov.Core()
    devices = core.available_devices
    print(f"DEVICES={','.join(devices)}")

    target = sys.argv[1]
    if "NPU" in target and not any("NPU" in d for d in devices):
        print(f"RESULT=error:device {target} not available ({','.join(devices)})")
        sys.exit(0)

    # Build a trivial identity model [1,10] -> [1,10]
    data = np.random.rand(1, 10).astype(np.float32)
    ov_model = ov.convert_model(np.expand_dims(np.eye(10, dtype=np.float32), axis=0))
    compiled = core.compile_model(ov_model, target)

    start = time.perf_counter()
    compiled.infer([ov.Tensor(data)])
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(f"RESULT=ok:{elapsed_ms:.2f}ms")
except Exception as e:
    print(f"RESULT=error:{e}")
"#;

    match run_python_script(&format!("{} {}", script, device)) {
        Some(stdout) => {
            for line in stdout.lines() {
                if let Some(r) = line.strip_prefix("RESULT=ok:") {
                    let latency: f64 = r.trim_end_matches("ms").parse().unwrap_or(0.0);
                    return InferenceTestResult {
                        success: true,
                        device: device.clone(),
                        latency_ms: latency,
                        message: format!("推理测试成功，延迟 {}ms", latency),
                    };
                }
                if let Some(r) = line.strip_prefix("RESULT=error:") {
                    return InferenceTestResult {
                        success: false,
                        device: device.clone(),
                        latency_ms: 0.0,
                        message: r.to_string(),
                    };
                }
            }
            InferenceTestResult {
                success: false, device, latency_ms: 0.0,
                message: "无法解析测试结果".into(),
            }
        }
        None => InferenceTestResult {
            success: false, device, latency_ms: 0.0,
            message: "Python 脚本执行失败，请确认 OpenVINO 已正确安装".into(),
        },
    }
}

// ── Unit tests ─────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_installed_with_npu() {
        let out = parse_python_output("VERSION=2024.4.0\nDEVICES=CPU,GPU.0,NPU.0\n");
        assert!(out.installed);
        assert_eq!(out.version.as_deref(), Some("2024.4.0"));
        assert_eq!(out.devices, vec!["CPU", "GPU.0", "NPU.0"]);
    }

    #[test]
    fn parse_installed_cpu_only() {
        let out = parse_python_output("VERSION=2024.3.0\nDEVICES=CPU\n");
        assert!(out.installed);
        assert_eq!(out.devices, vec!["CPU"]);
    }

    #[test]
    fn parse_not_installed() {
        let out = parse_python_output("INSTALLED=false\n");
        assert!(!out.installed);
        assert!(out.version.is_none());
        assert!(out.devices.is_empty());
    }

    #[test]
    fn parse_empty_devices() {
        let out = parse_python_output("VERSION=2024.4.0\nDEVICES=\n");
        assert!(out.devices.is_empty());
    }

    #[test]
    fn parse_no_match() {
        let out = parse_python_output("some random\noutput\n");
        assert!(!out.installed);
        assert!(out.devices.is_empty());
    }

    #[test]
    fn parse_whitespace_in_devices() {
        let out = parse_python_output("VERSION=2024.4.0\nDEVICES= CPU , GPU.0 , NPU \n");
        assert_eq!(out.devices, vec!["CPU", "GPU.0", "NPU"]);
    }

    #[test]
    fn npu_detected_only_from_devices() {
        let out = parse_python_output("VERSION=2024.4.0\nDEVICES=CPU,GPU.0\n");
        assert!(!out.devices.iter().any(|d| d.contains("NPU")));
    }

    #[test]
    fn recommended_models_has_entries() {
        let models = get_recommended_models();
        assert_eq!(models.len(), 4);
        assert!(models.iter().all(|m| !m.recommended_device.is_empty()));
    }

    #[test]
    fn install_instructions_includes_python() {
        let instructions = get_install_instructions();
        assert!(!instructions.is_empty());
    }
}