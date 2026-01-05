#!/bin/bash
# Patch DPVO for PyTorch 2.x compatibility
# The original DPVO code uses deprecated .type() API which was removed in newer PyTorch versions.
# This script replaces .type() with .scalar_type() in the affected files.

set -e

DPVO_DIR="${1:-external/DPVO}"

if [ ! -d "$DPVO_DIR" ]; then
    echo "ERROR: DPVO directory not found at $DPVO_DIR"
    exit 1
fi

echo "Patching DPVO for PyTorch 2.x compatibility..."

# File 1: dpvo/altcorr/correlation_kernel.cu
CORR_KERNEL="$DPVO_DIR/dpvo/altcorr/correlation_kernel.cu"
if [ -f "$CORR_KERNEL" ]; then
    # Replace .type() with .scalar_type() in AT_DISPATCH macros
    sed -i 's/fmap1\.type()/fmap1.scalar_type()/g' "$CORR_KERNEL"
    sed -i 's/net\.type()/net.scalar_type()/g' "$CORR_KERNEL"
    echo "  Patched: $CORR_KERNEL"
else
    echo "  WARNING: $CORR_KERNEL not found"
fi

# File 2: dpvo/lietorch/src/lietorch_gpu.cu
LIETORCH_GPU="$DPVO_DIR/dpvo/lietorch/src/lietorch_gpu.cu"
if [ -f "$LIETORCH_GPU" ]; then
    # Replace tensor.type() with tensor.scalar_type() in DISPATCH macros
    # Be careful not to replace .device().type() which is valid
    sed -i 's/a\.type()/a.scalar_type()/g' "$LIETORCH_GPU"
    sed -i 's/X\.type()/X.scalar_type()/g' "$LIETORCH_GPU"
    echo "  Patched: $LIETORCH_GPU"
else
    echo "  WARNING: $LIETORCH_GPU not found"
fi

# File 3: dpvo/lietorch/src/lietorch_cpu.cpp
LIETORCH_CPU="$DPVO_DIR/dpvo/lietorch/src/lietorch_cpu.cpp"
if [ -f "$LIETORCH_CPU" ]; then
    # Replace tensor.type() with tensor.scalar_type() in DISPATCH macros
    sed -i 's/a\.type()/a.scalar_type()/g' "$LIETORCH_CPU"
    sed -i 's/X\.type()/X.scalar_type()/g' "$LIETORCH_CPU"
    echo "  Patched: $LIETORCH_CPU"
else
    echo "  WARNING: $LIETORCH_CPU not found"
fi

echo "DPVO patching complete!"

