//! Managed Python virtual environment for pip-based package management.

use serde::{Deserialize, Serialize};
use std::io::BufRead;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use log::{info, warn, error};
use tauri::Emitter;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// ── Paths ──────────────────────────────────────────────────────────────

fn app_data_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("NPUToolbox")
}

fn venv_dir() -> PathBuf {
    app_data_dir().join("venv")
}

fn venv_python() -> PathBuf {
    venv_dir().join("Scripts").join("python.exe")
}

fn venv_pip() -> PathBuf {
    venv_dir().join("Scripts").join("pip.exe")
}

// ── Data types ─────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnvStatus {
    pub exists: bool,
    pub python_available: bool,
    pub python_version: Option<String>,
    pub pip_version: Option<String>,
    pub venv_path: String,
    pub packages: Vec<PackageInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageInfo {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PipResult {
    pub success: bool,
    pub message: String,
}

// ── Internal helpers ───────────────────────────────────────────────────

fn command_exists(cmd: &str) -> bool {
    let mut c = Command::new("where");
    c.arg(cmd);
    #[cfg(target_os = "windows")]
    c.creation_flags(CREATE_NO_WINDOW);
    c.output().map(|o| o.status.success()).unwrap_or(false)
}

/// Run a command, return (success, stdout, stderr).
fn run_cmd(cmd: &Path, args: &[&str]) -> Result<(bool, String, String), String> {
    let mut c = Command::new(cmd);
    c.args(args);
    #[cfg(target_os = "windows")]
    c.creation_flags(CREATE_NO_WINDOW);

    let output = c.output().map_err(|e| format!("Failed to run {:?}: {}", cmd, e))?;
    Ok((
        output.status.success(),
        String::from_utf8_lossy(&output.stdout).to_string(),
        String::from_utf8_lossy(&output.stderr).to_string(),
    ))
}

fn get_installed_packages_inner() -> Vec<PackageInfo> {
    let pip = venv_pip();
    if !pip.exists() {
        return Vec::new();
    }
    let (ok, stdout, _) = match run_cmd(&pip, &["list", "--format=json"]) {
        Ok(r) => r,
        Err(_) => return Vec::new(),
    };
    if !ok {
        return Vec::new();
    }
    serde_json::from_str(&stdout).unwrap_or_default()
}

/// Ensure venv exists; create it if missing.
fn ensure_env() -> Result<(), String> {
    if venv_python().exists() {
        return Ok(());
    }
    init_env_inner().map(|_| ())
}

/// Create the virtual environment if it doesn't exist (internal).
fn init_env_inner() -> Result<EnvStatus, String> {
    if venv_python().exists() {
        info!("Venv already exists at {:?}", venv_dir());
        return Ok(get_env_status());
    }

    if !command_exists("python") {
        return Err("系统未安装 Python。请先从 python.org 下载安装 Python 3.9+".to_string());
    }

    let vpath = venv_dir();
    let parent = vpath.parent().unwrap();
    std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;

    info!("Creating venv at {:?}", vpath);
    let venv_arg = vpath.to_str().unwrap_or("");
    let (ok, _, stderr) = run_cmd(Path::new("python"), &["-m", "venv", venv_arg])?;

    if !ok {
        let msg = format!("创建虚拟环境失败: {}", stderr.trim());
        error!("{}", msg);
        return Err(msg);
    }

    // Upgrade pip silently
    let pip = venv_pip();
    if pip.exists() {
        let _ = run_cmd(&pip, &["install", "--upgrade", "pip", "-q"]);
    }

    info!("Venv created successfully");
    Ok(get_env_status())
}

// ── Public Tauri commands ──────────────────────────────────────────────

#[tauri::command]
pub fn get_env_status() -> EnvStatus {
    let vpath = venv_dir();
    let py = venv_python();
    let exists = py.exists();
    let python_available = command_exists("python");

    let (python_version, pip_version) = if exists {
        let pv = run_cmd(&py, &["--version"])
            .ok()
            .and_then(|(ok, out, _)| {
                if ok { out.trim().strip_prefix("Python ").map(String::from) } else { None }
            });
        let pp = run_cmd(&venv_pip(), &["--version"])
            .ok()
            .and_then(|(ok, out, _)| {
                if ok { out.trim().split_whitespace().nth(1).map(String::from) } else { None }
            });
        (pv, pp)
    } else {
        (None, None)
    };

    let packages = if exists { get_installed_packages_inner() } else { Vec::new() };

    EnvStatus {
        exists,
        python_available,
        python_version,
        pip_version,
        venv_path: vpath.to_string_lossy().to_string(),
        packages,
    }
}

#[tauri::command]
pub fn init_env() -> Result<EnvStatus, String> {
    init_env_inner()
}

#[tauri::command]
pub fn pip_install(app: tauri::AppHandle, packages: Vec<String>) -> Result<PipResult, String> {
    ensure_env()?;

    let pip = venv_pip();
    let pkg_display = packages.join(", ");
    info!("pip install {} (venv)", pkg_display);

    // Build args: install pkg1 pkg2 ... --progress-bar off
    let mut args: Vec<String> = vec!["install".to_string(), "--progress-bar".to_string(), "off".to_string()];
    args.extend(packages.iter().cloned());

    let mut child = Command::new(&pip)
        .args(&args)
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start pip: {}", e))?;

    // Stream stderr in a background thread -> Tauri events
    let app_clone = app.clone();
    if let Some(stderr) = child.stderr.take() {
        thread::spawn(move || {
            let reader = std::io::BufReader::new(stderr);
            for line in reader.lines().flatten() {
                let _ = app_clone.emit("pip-progress", serde_json::json!({ "line": line }));
            }
        });
    }

    let status = child.wait().map_err(|e| format!("pip wait failed: {}", e))?;

    Ok(PipResult {
        success: status.success(),
        message: if status.success() {
            format!("{} 安装成功", pkg_display)
        } else {
            format!("{} 安装失败，请查看日志", pkg_display)
        },
    })
}

#[tauri::command]
pub fn pip_uninstall(package: &str) -> Result<PipResult, String> {
    if !venv_python().exists() {
        return Ok(PipResult {
            success: true,
            message: format!("{} 未安装（环境不存在）", package),
        });
    }

    info!("pip uninstall {} (venv)", package);
    let pip = venv_pip();
    let (ok, _, stderr) = run_cmd(&pip, &["uninstall", "-y", package])?;

    Ok(PipResult {
        success: ok,
        message: if ok {
            format!("{} 已卸载", package)
        } else {
            format!("卸载失败: {}", stderr.trim())
        },
    })
}

#[tauri::command]
pub fn remove_env() -> Result<(), String> {
    let path = venv_dir();
    if !path.exists() {
        return Ok(());
    }
    std::fs::remove_dir_all(&path).map_err(|e| format!("删除虚拟环境失败: {}", e))?;
    info!("Venv removed at {:?}", path);
    Ok(())
}

/// Run a Python script inside the managed venv; returns stdout on success.
pub fn run_venv_script(script: &str) -> Option<String> {
    if !venv_python().exists() {
        return None;
    }
    let (ok, stdout, stderr) = run_cmd(&venv_python(), &["-c", script]).ok()?;
    if !ok {
        warn!("Venv script stderr: {}", stderr.trim());
        return None;
    }
    Some(stdout)
}

/// Check if a specific package is installed in the venv.
pub fn is_package_installed(package_name: &str) -> bool {
    get_installed_packages_inner()
        .iter()
        .any(|p| p.name.eq_ignore_ascii_case(package_name))
}

/// Resolve the venv python path (for external use).
pub fn venv_python_path() -> String {
    venv_python().to_string_lossy().to_string()
}