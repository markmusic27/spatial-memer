#!/bin/bash
set -e

echo "=== DPVO Setup Script ==="

# Check for --download-only flag (for testing on non-CUDA machines)
DOWNLOAD_ONLY=false
if [ "$1" == "--download-only" ]; then
    DOWNLOAD_ONLY=true
    echo "Running in download-only mode (no CUDA installation)"
fi

# Clone DPVO if not present
if [ ! -d "external/DPVO" ]; then
    echo "Cloning DPVO..."
    mkdir -p external
    git clone https://github.com/princeton-vl/DPVO.git --recursive external/DPVO
else
    echo "DPVO directory already exists"
fi

cd external/DPVO

# Download Eigen if not present
if [ ! -d "thirdparty/eigen-3.4.0" ]; then
    echo "Downloading Eigen..."
    wget -nc https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.zip || true
    unzip -o eigen-3.4.0.zip -d thirdparty
else
    echo "Eigen already downloaded"
fi

# Exit here if download-only mode
if [ "$DOWNLOAD_ONLY" = true ]; then
    echo "=== Download complete (skipping CUDA installation) ==="
    exit 0
fi

# Check for CUDA
if ! command -v nvcc &> /dev/null; then
    echo "ERROR: CUDA not found. This script requires an NVIDIA GPU."
    echo "Run with --download-only to just download files without installing."
    exit 1
fi

# Install DPVO
echo "Installing DPVO..."
pip install .

# Download model weights if not present
if [ ! -f "dpvo.pth" ]; then
    echo "Downloading model weights..."
    ./download_models_and_data.sh
else
    echo "Model weights already downloaded"
fi

echo "=== DPVO Setup Complete ==="
echo "Test with: python -c 'from dpvo.dpvo import DPVO; print(\"DPVO OK\")'"