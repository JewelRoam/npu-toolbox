//! OpenVINO inference engine management — venv-aware.
//!
//! Supports multiple install variants for future extensibility:
//! - `"npu"`  — installs openvino + openvino-genai (current default, NPU-focused)
//! - `"gpu"`  — reserved for future GPU-optimized OpenVINO packages
//! - `"cpu"`  — reserved for minimal CPU-only installation

use serde::{Deserialize, Serialize};
use std::path::Path;
use log::info;
use crate::python_env;

/// Install variant — determines which packages are installed.
/// Extend this enum when GPU-specific or CPU-only packages become available.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "lowercase")]
pub enum OpenVINOVariant {
    /// Default: full OpenVINO + genai, includes NPU plugin when hardware present
    #[default]
    Npu,
    /// Future: GPU-optimized build (e.g., openvino-gpu extras or Intel GPU runtime)
    Gpu,
    /// Future: minimal CPU-only build for low-resource machines
    Cpu,
}

impl OpenVINOVariant {
    /// Return the list of pip packages for this variant.
    fn packages(&self) -> Vec<&'static str> {
        match self {
            Self::Npu => vec!["openvino", "openvino-genai"],
            Self::Gpu => vec!["openvino", "openvino-genai"], // TODO: add GPU-specific extras when available
            Self::Cpu => vec!["openvino"],                   // TODO: slim CPU-only when available
        }
    }

    /// Human-readable label for UI display.
    pub fn label(&self) -> &'static str {
        match self {
            Self::Npu => "NPU 版",
            Self::Gpu => "GPU 版",
            Self::Cpu => "CPU 版",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenVINOStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub python_available: bool,
    pub python_version: Option<String>,
    pub npu_plugin_available: bool,
    pub gpu_plugin_available: bool,
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
    pub message: String,
    pub trials: Vec<f64>,
    pub warmup_ms: f64,
    pub avg_ms: f64,
    pub min_ms: f64,
    pub max_ms: f64,
    pub p50_ms: f64,
    pub p95_ms: f64,
}

// ── Pure parsing ───────────────────────────────────────────────────────

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

// ── Detection ──────────────────────────────────────────────────────────

fn detect_via_venv() -> (bool, Option<String>, bool, bool, Vec<String>) {
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

    let stdout = match python_env::run_venv_script(script) {
        Some(s) => s,
        None => return (false, None, false, false, Vec::new()),
    };

    let parsed = parse_python_output(&stdout);
    let npu_available = parsed.devices.iter().any(|d| d.contains("NPU"));
    let gpu_available = parsed.devices.iter().any(|d| d.contains("GPU"));
    (parsed.installed, parsed.version, npu_available, gpu_available, parsed.devices)
}

fn detect_via_filesystem() -> (bool, Option<String>, bool, bool, Vec<String>) {
    let candidates = [
        r"C:\Program Files (x86)\Intel\openvino",
        r"C:\Program Files\Intel\openvino",
        r"C:\intel\openvino",
    ];

    for base in &candidates {
        let version_file = Path::new(base).join("version.txt");
        if !version_file.exists() { continue; }

        let version = std::fs::read_to_string(&version_file).ok().map(|v| v.trim().to_string());

        let plugin_patterns = [
            Path::new(base).join("runtime").join("lib").join("intel64").join("openvino_npu_plugin.dll"),
            Path::new(base).join("runtime").join("lib").join("intel64").join("plugins").join("openvino_npu_plugin.dll"),
            Path::new(base).join("runtime").join("lib").join("intel64").join("plugins").join("intel").join("openvino_npu_plugin.dll"),
        ];
        let npu_available = plugin_patterns.iter().any(|p| p.exists());
        return (true, version, npu_available, false, Vec::new());
    }

    (false, None, false, false, Vec::new())
}

// ── Public Tauri commands ──────────────────────────────────────────────

#[tauri::command]
pub fn detect_openvino() -> OpenVINOStatus {
    let env = python_env::get_env_status();
    let python_available = env.python_available;
    let python_version = env.python_version.clone();

    let (installed, version, npu_available, gpu_available, devices) = if env.exists {
        detect_via_venv()
    } else {
        detect_via_filesystem()
    };

    info!(
        "OpenVINO: installed={}, version={:?}, npu={}, gpu={}, devices={:?}",
        installed, version, npu_available, gpu_available, devices
    );

    OpenVINOStatus {
        installed,
        version,
        python_available,
        python_version,
        npu_plugin_available: npu_available,
        gpu_plugin_available: gpu_available,
        available_devices: devices,
        install_path: if env.exists { Some(env.venv_path) } else { None },
    }
}

#[tauri::command]
pub fn install_openvino(app: tauri::AppHandle, variant: Option<OpenVINOVariant>) -> Result<python_env::PipResult, String> {
    let v = variant.unwrap_or_default();
    let packages: Vec<String> = v.packages().into_iter().map(String::from).collect();
    python_env::pip_install(app, packages)
}

#[tauri::command]
pub fn uninstall_openvino() -> Result<python_env::PipResult, String> {
    let mut results = vec![];
    for pkg in ["openvino-genai", "openvino"] {
        results.push(python_env::pip_uninstall(pkg)?);
    }
    let all_ok = results.iter().all(|r| r.success);
    Ok(python_env::PipResult {
        success: all_ok,
        message: if all_ok { "OpenVINO 已完全卸载".into() } else { "部分卸载失败，请查看日志".into() },
    })
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
    "软件会自动管理 Python 虚拟环境，点击上方「一键安装」按钮即可。".into()
}

#[tauri::command]
pub fn test_openvino_inference(device: Option<String>) -> InferenceTestResult {
    let device = device.unwrap_or_else(|| "CPU".into());

    // Inject device name directly into the script (run_venv_script only accepts a script string, no args).
    let script = format!(r#"
import time, sys
try:
    import openvino as ov
    import numpy as np

    core = ov.Core()
    devices = core.available_devices
    print(f"DEVICES={{','.join(devices)}}")

    target = "{device}"
    if "NPU" in target and not any("NPU" in d for d in devices):
        print(f"RESULT=error:device {{target}} not available ({{','.join(devices)}})")
        sys.exit(0)

    import openvino.opset13 as opset
    data_shape = [1, 10]
    X = opset.parameter(data_shape, dtype=np.float32, name="X")
    add = opset.add(X, opset.constant(np.ones(data_shape, dtype=np.float32), name="bias"), name="add")
    model = ov.Model([add], [X], "test_model")
    compiled = core.compile_model(model, target)

    dummy = np.random.rand(*data_shape).astype(np.float32)

    # Warmup (3 runs, report last)
    for _ in range(2):
        compiled([ov.Tensor(dummy)])
    start = time.perf_counter()
    compiled([ov.Tensor(dummy)])
    warmup_ms = (time.perf_counter() - start) * 1000
    print(f"WARMUP={{warmup_ms:.2f}}ms")

    # Timed trials (10 runs)
    NUM_TRIALS = 10
    for _ in range(NUM_TRIALS):
        start = time.perf_counter()
        compiled([ov.Tensor(dummy)])
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"TRIAL={{elapsed_ms:.3f}}ms")

    print("RESULT=ok:benchmark complete")
except Exception as e:
    print(f"RESULT=error:{{e}}")
"#);

    match python_env::run_venv_script(&script) {
        Some(stdout) => {
            let mut warmup_ms: f64 = 0.0;
            let mut trials: Vec<f64> = Vec::new();
            for line in stdout.lines() {
                if let Some(w) = line.strip_prefix("WARMUP=") {
                    warmup_ms = w.trim_end_matches("ms").parse().unwrap_or(0.0);
                }
                if let Some(t) = line.strip_prefix("TRIAL=") {
                    if let Ok(ms) = t.trim_end_matches("ms").parse::<f64>() {
                        trials.push(ms);
                    }
                }
                if let Some(r) = line.strip_prefix("RESULT=error:") {
                    return InferenceTestResult {
                        success: false, device: device.clone(), message: r.to_string(),
                        trials: vec![], warmup_ms: 0.0, avg_ms: 0.0,
                        min_ms: 0.0, max_ms: 0.0, p50_ms: 0.0, p95_ms: 0.0,
                    };
                }
            }
            if trials.is_empty() {
                return InferenceTestResult {
                    success: false, device, message: "无法解析测试结果".into(),
                    trials: vec![], warmup_ms: 0.0, avg_ms: 0.0,
                    min_ms: 0.0, max_ms: 0.0, p50_ms: 0.0, p95_ms: 0.0,
                };
            }
            let mut sorted = trials.clone();
            sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let avg: f64 = trials.iter().sum::<f64>() / trials.len() as f64;
            let min = sorted[0];
            let max = sorted[sorted.len() - 1];
            let p50 = sorted[sorted.len() * 50 / 100];
            let p95 = sorted[sorted.len() * 95 / 100];
            InferenceTestResult {
                success: true,
                device: device.clone(),
                message: format!("推理测试完成 · {} 次试验 · 平均 {:.2}ms", trials.len(), avg),
                trials, warmup_ms, avg_ms: avg, min_ms: min, max_ms: max, p50_ms: p50, p95_ms: p95,
            }
        }
        None => InferenceTestResult {
            success: false, device, message: "Python 脚本执行失败，请确认 OpenVINO 已在虚拟环境中安装".into(),
            trials: vec![], warmup_ms: 0.0, avg_ms: 0.0,
            min_ms: 0.0, max_ms: 0.0, p50_ms: 0.0, p95_ms: 0.0,
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
    fn recommended_models_has_entries() {
        let models = get_recommended_models();
        assert_eq!(models.len(), 4);
    }
}