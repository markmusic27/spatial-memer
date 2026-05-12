# NVIDIA Vulkan Setup on Headless Lambda Labs Instances

## The Problem

On Lambda Labs GPU instances (Ubuntu 22.04 with Lambda Stack), NVIDIA GPUs like the A10 work correctly with `nvidia-smi` for compute workloads, but Vulkan (`vulkaninfo`) only shows the CPU-based llvmpipe software renderer instead of the GPU.

### Root Causes

1. **Missing Graphics Libraries**: Lambda Stack installs the "headless" NVIDIA driver (`nvidia-headless-570-server-open`) which lacks OpenGL/Vulkan libraries
2. **Blacklisted DRM Modules**: The `nvidia-drm` and `nvidia-modeset` kernel modules are blacklisted in `/etc/modprobe.d/nvidia-drm-blacklist.conf`
3. **No Display Context**: NVIDIA's Vulkan ICD requires a display (X11/Xvfb) to initialize, even for headless rendering

## Solution Steps

### Step 1: Install NVIDIA GL/Vulkan Libraries

```bash
# Install the GL package matching your driver version
sudo apt-get update
sudo apt-get install -y libnvidia-gl-570-server
```

This installs:
- `libGLX_nvidia.so.0` - GLX library (also contains Vulkan ICD)
- `/usr/share/vulkan/icd.d/nvidia_icd.json` - Vulkan ICD manifest
- Supporting libraries for EGL, GLES, etc.

### Step 2: Enable NVIDIA DRM Modules

```bash
# Remove the blacklist
sudo mv /etc/modprobe.d/nvidia-drm-blacklist.conf /etc/modprobe.d/nvidia-drm-blacklist.conf.bak

# Reload nvidia-drm with modeset enabled
sudo modprobe -r nvidia_drm
sudo modprobe nvidia_drm modeset=1
```

### Step 3: Set Up Virtual Display

NVIDIA's Vulkan ICD needs a display context. Install and run Xvfb:

```bash
# Install Xvfb
sudo apt-get install -y xvfb

# Start virtual framebuffer
Xvfb :99 -screen 0 1920x1080x24 &

# Set display environment variable
export DISPLAY=:99
```

### Step 4: Make Settings Persistent

Add to `~/.bashrc`:

```bash
# Virtual display for headless Vulkan
export DISPLAY=:99

# Start Xvfb if not running
if ! pgrep -x Xvfb > /dev/null; then
    Xvfb :99 -screen 0 1920x1080x24 &
fi
```

## Verification

```bash
# Should show NVIDIA GPU as primary device
vulkaninfo --summary
```

Expected output:
```
Devices:
========
GPU0:
    deviceName         = NVIDIA A10
    deviceType         = PHYSICAL_DEVICE_TYPE_DISCRETE_GPU
    driverName         = NVIDIA
    driverInfo         = 570.195.03
```

## Quick One-Liner Setup

For automation or scripts:

```bash
sudo apt-get update && \
sudo apt-get install -y libnvidia-gl-570-server xvfb && \
sudo mv /etc/modprobe.d/nvidia-drm-blacklist.conf /etc/modprobe.d/nvidia-drm-blacklist.conf.bak 2>/dev/null; \
sudo modprobe -r nvidia_drm 2>/dev/null; \
sudo modprobe nvidia_drm modeset=1 && \
Xvfb :99 -screen 0 1920x1080x24 & \
export DISPLAY=:99 && \
sleep 2 && \
vulkaninfo --summary | grep -A5 "GPU0:"
```

## Troubleshooting

### Check if libraries are installed
```bash
ldconfig -p | grep libGLX_nvidia
```

### Check if nvidia-drm has modeset enabled
```bash
sudo cat /sys/module/nvidia_drm/parameters/modeset
# Should return "Y"
```

### Check kernel module status
```bash
lsmod | grep nvidia
# Should show: nvidia, nvidia_modeset, nvidia_drm, nvidia_uvm
```

### Debug Vulkan loader
```bash
VK_LOADER_DEBUG=all vulkaninfo --summary 2>&1 | grep -i nvidia
```

## Notes

- The driver version (570 in this case) must match between packages. Check with `nvidia-smi`
- For different driver versions, replace `570-server` with the appropriate version
- This setup is required for applications like OmniGibson, Isaac Sim, or any Vulkan-based rendering

---

# BEHAVIOR-1K Installation

After setting up Vulkan (steps above), install BEHAVIOR-1K with OmniGibson and Isaac Sim.

## Prerequisites

- Vulkan working with NVIDIA GPU (follow steps above)
- At least 32GB RAM
- NVIDIA GPU with 8GB+ VRAM (RTX 2070 or better)

## Step 1: Install Miniconda

```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh -b -p $HOME/miniconda3
rm Miniconda3-latest-Linux-x86_64.sh

# Initialize conda
~/miniconda3/bin/conda init bash
source ~/.bashrc
```

## Step 2: Clone BEHAVIOR-1K Repository

```bash
cd ~
git clone -b v3.7.2 https://github.com/StanfordVL/BEHAVIOR-1K.git
cd BEHAVIOR-1K
```

## Step 3: Run Automated Setup

This installs everything: conda environment, OmniGibson, Isaac Sim 4.5, BDDL, and downloads datasets.

```bash
./setup.sh --new-env --omnigibson --bddl --dataset \
    --accept-conda-tos --accept-nvidia-eula --accept-dataset-tos
```

**Note**: This can take 15-30 minutes depending on network speed (large downloads).

### Optional Components

Add these flags for additional features:
- `--joylo` - Teleoperation interface
- `--primitives` - Primitive actions support
- `--eval` - Evaluation dependencies (requires `--joylo`)

Full installation:
```bash
./setup.sh --new-env --omnigibson --bddl --joylo --dataset --eval --primitives \
    --accept-conda-tos --accept-nvidia-eula --accept-dataset-tos
```

## Step 4: Activate and Verify

```bash
conda activate behavior

# Verify installation
python -c "import omnigibson; print('OmniGibson version:', omnigibson.__version__)"
```

Expected output:
```
OmniGibson version: 3.7.2
```

## Step 5: First Run Test

The first run downloads additional Omniverse components (can take up to 5 minutes):

```bash
# Make sure DISPLAY is set for Vulkan
export DISPLAY=:99

# Test with quickstart example
python -m omnigibson.examples.robots.robot_control_example --quickstart
```

## Quick One-Liner Installation

For fresh Lambda instance after Vulkan is set up:

```bash
# Install miniconda
wget -qO- https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh | bash -b -p $HOME/miniconda3 && \
source $HOME/miniconda3/etc/profile.d/conda.sh && \

# Clone and install BEHAVIOR-1K
git clone -b v3.7.2 https://github.com/StanfordVL/BEHAVIOR-1K.git ~/BEHAVIOR-1K && \
cd ~/BEHAVIOR-1K && \
./setup.sh --new-env --omnigibson --bddl --dataset \
    --accept-conda-tos --accept-nvidia-eula --accept-dataset-tos
```

## Troubleshooting

### OmniGibson fails at GPU initialization
```bash
# Manually specify GPU
export OMNIGIBSON_GPU_ID=0

# Verify GPU is visible
nvidia-smi
```

### PyTorch import errors (undefined symbol: iJIT_NotifyEvent)
This happens when mixing incompatible PyTorch/Intel MKL installations. Solution: use the fresh `behavior` conda environment created by setup.sh, don't try to use an existing environment.

### Vulkan not initialized
Make sure Xvfb is running and DISPLAY is set:
```bash
export DISPLAY=:99
if ! pgrep -x Xvfb > /dev/null; then
    Xvfb :99 -screen 0 1920x1080x24 &
    sleep 2
fi
vulkaninfo --summary | grep "NVIDIA"
```

## Directory Structure After Installation

```
~/BEHAVIOR-1K/           # Repository with source code
~/miniconda3/envs/behavior/  # Conda environment with all dependencies
~/.omnigibson/           # OmniGibson data directory (assets, datasets)
```

## Useful Commands

```bash
# Activate environment
conda activate behavior

# List available BEHAVIOR tasks
python -c "from bddl import get_all_activities; print(get_all_activities())"

# Run robot control example
python -m omnigibson.examples.robots.robot_control_example

# Check OmniGibson configuration
python -c "import omnigibson as og; print(og.get_global_config())"
```
