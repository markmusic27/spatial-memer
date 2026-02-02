# BEHAVIOR/OmniGibson Integration Progress

**Date**: February 2, 2026  
**Branch**: `behavior-experiment`

## Summary

Setting up OmniGibson (BEHAVIOR-1K simulator) for the Spatial-MemER project. The goal is to run robot simulations in OmniGibson and feed ground-truth poses into `SpatialContext` to generate BEV maps.

## What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| `behavior-experiment` branch | Created & pushed | Based on `main`, Python 3.10 |
| Conda environment `behavior` | Working | Python 3.10, all deps installed |
| OmniGibson 3.7.2 | Imports OK | Installed from BEHAVIOR-1K repo |
| IsaacSim 4.5.0 | Imports OK | Installed via pip |
| PyTorch 2.6.0 + CUDA 12.4 | Working | GPU compute works |
| spatial-memer code | Working | Compatible with Python 3.10 + numpy 1.x |
| BEHAVIOR-1K repo | Cloned | `/home/ubuntu/BEHAVIOR-1K` |

## What's NOT Working

### Running Simulations - BLOCKED

Isaac Sim requires **NVIDIA Vulkan drivers** for rendering/physics. The Thunder Compute instance has:
- NVIDIA compute drivers (CUDA works)
- **Missing**: NVIDIA Vulkan ICD (`libnvidia-gl`, `libvulkan_nvidia`)

**Error observed**:
```
vkCreateInstance failed. Vulkan 1.1 is not supported, or your driver requires an update.
```

**Root cause**: Thunder Compute mounts NVIDIA libraries from the host container. We cannot replace them with apt:
```
unable to make backup link of './usr/lib/x86_64-linux-gnu/libcuda.so.1': Invalid cross-device link
```

## Environment Details

- **GPU**: NVIDIA RTX A6000 (48GB VRAM)
- **Driver**: 580.95.05
- **CUDA**: 13.0
- **OS**: Ubuntu 22.04 (container)
- **GLIBC**: 2.35

## How to Reproduce Setup

### 1. Install Miniconda
```bash
curl -fsSL https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -o miniconda.sh
bash miniconda.sh -b -p $HOME/miniconda3
rm miniconda.sh
source ~/miniconda3/etc/profile.d/conda.sh
```

### 2. Clone BEHAVIOR-1K
```bash
cd ~
git clone https://github.com/StanfordVL/BEHAVIOR-1K.git
```

### 3. Run Setup Script
```bash
cd ~/BEHAVIOR-1K
./setup.sh --new-env --omnigibson --bddl --accept-conda-tos --accept-nvidia-eula
```

Or manually:
```bash
conda create -n behavior python=3.10 -y
conda activate behavior
pip install "numpy<2" "setuptools<=79"
pip install torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
pip install -e ~/BEHAVIOR-1K/bddl3
pip install -e ~/BEHAVIOR-1K/OmniGibson
pip install "isaacsim[all,extscache]==4.5.0" --extra-index-url https://pypi.nvidia.com
```

### 4. Verify Installation
```bash
conda activate behavior
export OMNI_KIT_ACCEPT_EULA=YES
python -c "import omnigibson; print('OmniGibson:', omnigibson.__version__)"
python -c "import isaacsim; print('IsaacSim OK')"
```

## Next Steps

### Option 1: Get Graphics-Enabled Instance
Contact Thunder Compute or use a different provider with full NVIDIA graphics drivers:
- **AWS**: `g5.xlarge` (A10G with graphics)
- **GCP**: A100/T4 with "Virtual Workstation" driver
- **Lambda Labs**, **RunPod**: Usually have full drivers

### Option 2: Local Development
Run on a local machine with NVIDIA GPU and proper driver installation.

### Option 3: Docker with nvidia-container-toolkit
If the host has proper NVIDIA drivers, run in Docker:
```bash
docker run --gpus all -it nvcr.io/nvidia/isaac-sim:4.5.0
```

## Files Changed

### `pyproject.toml`
- Changed `requires-python` from `>=3.13` to `>=3.10,<3.11`
- Changed `numpy` from `>=2.4.0` to `>=1.23.5,<2.0.0`
- Added: `omnigibson`, `isaacsim`, `torch`, `scipy`

### `.python-version`
- Changed from `3.13` to `3.10`

### New Files
- `scripts/test_behavior_bridge.py` - Integration test for OmniGibson + SpatialContext
- `results/test_spatial_context_output.png` - Test output (headless mode)

## Integration Test (Ready to Run)

Once simulations work, run:
```bash
conda activate behavior
export OMNI_KIT_ACCEPT_EULA=YES
cd ~/spatial-memer
python scripts/test_behavior_bridge.py
```

This will:
1. Create an OmniGibson environment with a Fetch robot
2. Drive randomly for 200 steps
3. Capture camera poses every 40 steps as keyframes
4. Generate a BEV map using `SpatialContext`
5. Save to `results/behavior_bridge_test.png`

## References

- [BEHAVIOR-1K Website](https://behavior.stanford.edu/)
- [OmniGibson Documentation](https://behavior.stanford.edu/omnigibson/)
- [Isaac Sim Installation](https://docs.isaacsim.omniverse.nvidia.com/latest/installation/install_python.html)
- [BEHAVIOR-1K GitHub](https://github.com/StanfordVL/BEHAVIOR-1K)
