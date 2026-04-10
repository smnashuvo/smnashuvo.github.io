---
title: "Project: Stable Diffusion WebUI Forge on Android (Termux/PRoot)"
description: "Documenting the successful deployment of SD WebUI Forge on a Snapdragon 860 using Termux, PRoot Ubuntu, and CPU-only patching."
pubDate: '2025-12-06'
heroImage: './stable-diffusion-v1-5.jpg'
domain: ['ai', 'android']
tags: [android, ai, linux, termux, stable-diffusion, magisk, forge webui]
---

# 🌟 Project: Stable Diffusion 1.5 WebUI Forge on Android

> **Device:** Xiaomi POCO X3 Pro (Codename: *vayu*)
> **SoC:** Snapdragon 860 (7nm, Kryo 485, 8 cores)
> **GPU:** Adreno 640 (Vulkan API Supported)
> **Memory:** 8GB Physical RAM + **8GB VRAM (Swap)**
> **Storage:** 256GB Internal (UFS 3.1)
> **OS:** Low level debloated and hardened MIUI 14.0.3 Android 13 (Magisk Rooted, FDE.ai patched kernel, Zygisk-LsPosed)
> **Environment:** Termux + PRoot (Ubuntu 22.04 LTS Jammy)

---

## 🛠 Device-Level Kernel Tweaks & Optimizations

Before installing Forge, I optimized the Android runtime environment to handle the heavy load of AI generation.

### 🔧 Kernel / System Optimizations
* **FDE.ai Kernel Tweaks:**
    * **Task Scheduling:** Adjusted `sched_min_granularity_ns` & `sched_wakeup_granularity_ns` for smoother task scheduling under high CPU load.
    * **Memory Management:** Enabled `zram` swap to improve RAM availability during large SD model generation (~3–5 mins per 512×512 image).
    * **Storage I/O:** Adjusted I/O scheduler to `mq-deadline` for faster storage access during model loads/downloads.
* **Magisk Root Access:**
    * Ensures full filesystem access inside the Termux PRoot environment.
    * Allows modification of `sysctl` parameters for real-time memory & swap tuning.

### 🎨 Vulkan GPU Readiness
* **Current Status:** GPU acceleration is **not** used in this CPU-only Forge build, but the device is Vulkan-capable.
* **Driver:** Adreno 640 (Vulkan API supported).
* **Future Plan:** Enable FDE.ai memory swap + Vulkan for faster image rendering. Vulkan readiness ensures a smooth fallback if GPU-based experiments are attempted later.

> **⚠ Note:** These tweaks are optional but highly recommended to improve stability/performance under CPU-only Forge runs.

---

> **Goal:** Run Stable Diffusion WebUI Forge locally on Android via Termux
> **Final Environment:** Ubuntu 22.04 LTS (PRoot) + Python 3.10 (Conda) + CPU-only PyTorch

---

## 🔥 Phase 0: Initial Setup & Ambition
* **Objective:** Install **AUTOMATIC1111 (A1111 WebUI)**
* **Environment:** Termux on Android → `proot-distro` Ubuntu install
* **Challenge:** Mobile architecture (`aarch64`), limited RAM, Android filesystem quirks

---

## 🚫 Phase 1: A1111 Attempt & Initial Failure
* **Problem:** Default Termux distros shipped **Ubuntu 24.04/25.10 → Python 3.12/3.13**
* **Impact:** PyTorch ARM64 wheels incompatible → **`torch not found`**, dependency conflicts.
* **Decision:** Abandon A1111 due to bloated backend & unsolvable dependency locks.
* **Pivot:** Switch to **SD-WebUI Forge**, better for CPU-only builds and modular environment.

---

## ⚡ Phase 2: Dependency Hell (OS & Filesystem)

### ❌ Failure 1: Ubuntu 25.10 & Python 3.13
* **Context:** PyTorch ARM64 wheels require **Python 3.10 or 3.11**.
* **Attempted:** Compile Python 3.10 from source.
* **Result:** **FAILED** (missing system libraries: `libbz2-dev`, `libsqlite3-dev`).
* ✅ **Solution:** **Downgrade OS to Ubuntu 22.04 LTS**, which natively supports Python 3.10.

### ❌ Failure 2: Ubuntu 22.04 Installation Hurdles
1.  **Dead Links (404 Errors)**
    * *Issue:* Standard Cloud Images were outdated or moved.
    * ✅ **Solution:** Use persistent releases URL: `releases.ubuntu.com/22.04`.

2.  **Base Image Too Minimal**
    * *Issue:* `ubuntu-base-22.04.tar.gz` → crash (`sed: can't read ./etc/locale.gen`).
    * ✅ **Solution:** Use **Ubuntu Cloud Image** (`ubuntu-22.04-server-cloudimg-arm64-root.tar.xz`).
3.  **Android Filesystem Block (Hard Links)**
    * *Error:* Extraction fails with `Cannot hard link … Permission denied`.
    * ✅ **Fix:** Use `bsdtar` or wrap in `proot --link2symlink` to convert hard links to symlinks.

4.  **Symlink Recursion Loop (Infinite Loop)**
    * *Error:* Repacking tarball using `proot --link2symlink` caused Proot to try converting its own symlinks recursively.
    * ✅ **Fix:** Use **raw `bsdtar`** (without Proot) for repacking, while Proot is used **only for extraction**.

5.  **Dangling symlink (/etc/resolv.conf)**
    * *Error:* Broken symlink → DNS writes fail (No Internet).
    * ✅ **Fix:** `rm -f /etc/resolv.conf` + add nameserver manually (`8.8.8.8`).

---

## 🐍 Phase 3: Python & PIP Conflicts

### ❌ Failure 3: pip inside PRoot
* **Problem:** Android env variables (`ANDROID_DATA`) leaked into the container → pip crashes.
* ✅ **Fix 1:** `unset ANDROID_DATA` (partial workaround).
* ✅ **Fix 2:** Install **Miniforge (Conda)** → created an isolated Python 3.10 environment.

### ❌ Failure 4: Bad Interpreter Shebangs
* **Error:** Conda executables use absolute paths → `bad interpreter: No such file or directory`.
* ✅ **Fix:** Run modules directly: use `python -m pip install …` instead of `pip install …`.

---

## ⚙️ Phase 4: Forge Launch Errors & CPU Patch

### ❌ Failure 5: Wrong Repo Near-Miss
* **Mistake:** Initially cloned `Stability-AI/StableStudio-Forge` (This is an IDE, not the WebUI).
* ✅ **Fix:** Pivoted to correct repository: `lllyasviel/stable-diffusion-webui-forge`.

### ❌ Failure 6: CUDA AssertionError
* **Crash:** Forge launch crashed with: `Torch not compiled with CUDA enabled`.
* **Cause:** The backend file `memory_management.py` checks for an NVIDIA GPU and panicked because it's on a CPU-only build.

### ❌ Failure 7: UnboundLocalError in Patch
* **Error:** First patch attempt failed with `UnboundLocalError: local variable 'torch' referenced before assignment`.
* **Reason:** Python scope issue when patching a function.
* ✅ **Fix:** Inject `import torch` **inside the patched function scope**.

### ✅ Solution: The "Lobotomy Patch"
I modified `memory_management.py` to trick Forge into thinking the Snapdragon CPU was a valid render device.

```python
# The Fix for UnboundLocalError
def get_torch_device():
    import torch  # <--- Crucial import inside scope
    return "cpu"

def should_use_fp16():
    return False

# Monkey-patch CUDA check to avoid crash
torch.cuda.is_available = lambda: False
```

---

## 💾 Phase 5: Model Download & Setup
* **Target Model:** SD 1.5 pruned (`v1-5-pruned-emaonly.safetensors`, 3.97GB).
* **Disk Check:** >150GB available → safe to download.
* **Download Command:**

```bash
cd ~/AI/forge_webui_cpu/models/Stable-diffusion/
wget -O v1-5-pruned-emaonly.safetensors \
[https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors](https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors)
```

* **Download Result:** 3.97GB saved in **~15m 54s** at **~4.26MB/s**.

---

## 🧪 Phase 6: Testing & Validation

**Launch Command for Forge:**
```bash
export FORCE_CPU=1
export CUDA_VISIBLE_DEVICES=""
python launch.py --skip-torch-cuda-test --listen --lowram --no-half --precision full
```

* **UI:** `http://127.0.0.1:7860` accessible
* **CPU-only generation:** ~3–5 minutes per 512×512 image (Poco X3 Pro, 8GB RAM)
* **Optional:** Later test fde.ai memory swap & Vulkan GPU for acceleration

---

## 📊 Phase 7: Summary of Hurdles & Solutions

| Hurdle | Error / Failure | Solution |
| :--- | :--- | :--- |
| **A1111 on Python 3.13** | Torch not found | Switched to Forge, Python 3.10 |
| **Ubuntu 25.10** | PyTorch incompatible | Downgrade to 22.04 LTS |
| **Symlink Recursion** | Infinite Loop | Use raw `bsdtar` for repacking |
| **Android Hard Links** | Extraction failed | `--link2symlink` |
| **Dangling DNS** | DNS config fail | Remove symlink, add nameserver manually |
| **pip inside PRoot** | OSError / Android path | Unset ANDROID_DATA / use Miniforge Conda |
| **Conda shebang** | bad interpreter | Use `python -m pip` |
| **Wrong Repo** | Clone error | Switch to `lllyasviel` repo |
| **Forge CUDA check** | AssertionError | **Lobotomy Patch** (CPU-only patch) |
| **Patch Scope Error** | UnboundLocalError | Import torch *inside* function |

---

## 🔥 Phase 8: Final Success

* **OS:** Ubuntu 22.04 Cloud Image (Patched)
* **Python:** Miniforge 3.10 isolated environment
* **Forge:** Running CPU-only, low RAM, patched for no CUDA
* **Model:** SD 1.5 pruned (3.97GB) loaded successfully
* **UI:** Accessible at `http://127.0.0.1:7860`
* **Performance:** ~3–5 minutes per image, memory-safe

> **Note:** This document tracks all 22 days of errors, fixes, downloads, and patches.