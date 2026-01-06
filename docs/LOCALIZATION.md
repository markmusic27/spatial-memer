# Localization Module

The `Localization` class provides real-time camera pose estimation using DPVO (Deep Patch Visual Odometry).

## Overview

- Runs at **high frame rate** (e.g., 30 Hz) to process camera frames
- Provides pose estimates for the **high-level policy** running at lower rate (e.g., 1 Hz)
- Transforms poses from camera coordinates to world coordinates
- Returns `None` during initialization (first ~5 frames)

## Coordinate Frames

```
DPVO Camera Frame → camera_to_world → World Frame → SpatialContext
```

1. **Camera Frame**: DPVO's internal coordinate system
2. **World Frame**: Global reference frame (typically robot base)
3. **Robot Frame**: Used by RobotArm for kinematics

## Quick Start

### 1. Installation

First, install DPVO:

```bash
./scripts/setup_dpvo.sh
```

### 2. Basic Usage

```python
from localization import Localization, load_camera_intrinsics

# Load camera calibration
intrinsics = load_camera_intrinsics("external/DPVO/calib/iphone.txt")

# Define camera-to-world transform (if camera is at robot base)
camera_to_world = np.eye(4)  # Identity if camera frame = world frame

# Initialize
localizer = Localization(
    camera_intrinsics=intrinsics,
    camera_to_world=camera_to_world,
    device="cuda:0"  # or "cpu"
)

# Process frames
for frame_idx, rgb_frame in enumerate(camera_stream):
    timestamp = frame_idx / 30.0  # assuming 30 fps

    robot_pose = localizer.update(rgb_frame, timestamp)

    if robot_pose is None:
        # Still initializing
        continue

    # Use pose in your application
    position = robot_pose[:3, 3]
    print(f"Camera position: {position}")
```

### 3. Integration with SpatialContext

```python
from spatial_context import SpatialContext

ctx = SpatialContext()

# High-rate loop (30 Hz)
robot_pose = localizer.update(rgb_frame, timestamp)

if robot_pose is None:
    continue

# Low-rate loop (1 Hz) - every 30 frames
if frame_idx % 30 == 0:
    robot_state = get_robot_joint_angles()  # 7-DOF

    # Add frame with pose from localization
    frame_id = ctx.add_frame(robot_state, robot_pose)

    # Generate map
    map_image, colors = ctx.generate_map()
```

## API Reference

### `Localization.__init__()`

```python
def __init__(
    self,
    camera_intrinsics: np.ndarray,
    camera_to_world: Optional[np.ndarray] = None,
    weights_path: str = "external/DPVO/dpvo.pth",
    device: str = "cuda:0"
)
```

**Parameters:**
- `camera_intrinsics`: 3×3 camera matrix (fx, fy, cx, cy)
- `camera_to_world`: 4×4 SE(3) transform from camera to world frame
- `weights_path`: Path to DPVO model weights
- `device`: PyTorch device ("cuda:0", "cpu", etc.)

### `Localization.update()`

```python
def update(
    self,
    rgb: np.ndarray,
    timestamp: float
) -> Optional[np.ndarray]
```

**Parameters:**
- `rgb`: RGB image (H, W, 3) uint8
- `timestamp`: Frame timestamp in seconds

**Returns:**
- `robot_pose`: 4×4 SE(3) matrix in world coordinates, or `None` if initializing

### Helper Functions

#### `load_camera_intrinsics(calib_file)`

Load calibration from DPVO format (single line: `fx fy cx cy`)

#### `create_camera_to_world_transform(translation, rotation)`

Create transformation matrix from translation and rotation.

```python
# Camera 0.1m above robot base
T = Localization.create_camera_to_world_transform(
    translation=np.array([0, 0, 0.1]),
    rotation=np.eye(3)
)
```

## Camera Calibration

DPVO requires camera intrinsics. Create a calibration file:

```
# iphone.txt
1234.5 1234.5 960.0 540.0
```

Format: `fx fy cx cy` (one line)

To get these values:
- Use camera manufacturer specs
- Or run camera calibration (OpenCV, MATLAB, etc.)

## Testing

```bash
# Test localization on example video
python scripts/test_localization.py
```

## Notes

- DPVO requires **CUDA** (NVIDIA GPU)
- Initialization takes ~5 frames before returning poses
- Works best with **smooth camera motion** (not rapid shaking)
- For best results, provide accurate camera intrinsics

## Troubleshooting

**ImportError: DPVO not found**
- Run `./scripts/setup_dpvo.sh` to install DPVO

**Slow performance**
- Ensure running on GPU (`device="cuda:0"`)
- Check CUDA installation: `nvidia-smi`

**Poor pose estimates**
- Verify camera intrinsics are correct
- Ensure good lighting and texture in scene
- Avoid rapid camera motion during initialization
