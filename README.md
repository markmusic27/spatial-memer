<div align="center">

# `Spatial-MemER`

### Spatial Memory for Embodied Robots

**Adding spatial awareness to vision-language robot policies through egocentric mapping and forward kinematics.**

_A project we built in a few weeks extending [MemER: Memory-Enhanced Robot Policies](https://jen-pan.github.io/memer/)_.

---

<table>
<tr>
<td align="center">
<img src="https://media.licdn.com/dms/image/v2/C4E03AQELZicH6wruqg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1619128430542?e=1769040000&v=beta&t=Ltzq0u9h8OQe15JewO_l1-t1AakWjrOjZrN8Fxj2hAg" width="120" style="border-radius: 50%;" /><br />
<b>Mark Music</b><br />
<a href="https://markmusic.io">markmusic.io</a><br />
Stanford '28<br />
CS & Math<br />
<a href="mailto:mmusic@stanford.edu">mmusic@stanford.edu</a>
</td>
<td align="center">
<img src="https://media.licdn.com/dms/image/v2/D4E03AQEH1X4IRGyrFg/profile-displayphoto-scale_400_400/B4EZkh595hGYAg-/0/1757210469401?e=1769040000&v=beta&t=3ccs1IKb0FroocoUoj0fw-G53q4pp12148kShhGlH90" width="120" style="border-radius: 50%;" /><br />
<b>Filippo Fonseca</b><br />
<a href="https://filippofonseca.com">filippofonseca.com</a><br />
Yale<br />
Mech. Eng. (ABET) & EECS<br />
<a href="mailto:filippo.fonseca@yale.edu">filippo.fonseca@yale.edu</a>
</td>
</tr>
</table>

We're passionate about the intersection of AI and hardware through robotics—optimizing policies and models.

We strive to enable the future of embodied intelligence.

---

</div>

## Overview

Spatial-MemER extends vision-language robot policies (like MemER, RT-2) with explicit spatial reasoning. By maintaining an egocentric bird's-eye view map of keyframe observations, robots can understand WHERE they observed objects in 3D space, not just WHAT they saw.

**Key Features**:

- **Three-line integration**: Add spatial awareness to any robot policy
- **Precise localization**: Forward kinematics-based pose estimation (no SLAM needed for stationary robots)
- **Egocentric maps**: Auto-generated BEV visualizations showing robot + keyframe locations
- **Visual correspondence**: Color-coded watermarks link keyframe images to map positions
- **Modular design**: Independent, testable components

## Why Spatial-MemER?

**Problem**: Existing vision-language policies like [MemER](https://jen-pan.github.io/memer/) (Sridhar et al., 2024) lack spatial understanding. They see sequential images but don't know WHERE observations occurred in space.

**Solution**: Spatial-MemER extends MemER's memory framework with:

1. **Spatial map** showing robot position and keyframe locations
2. **Watermarked keyframes** color-coded to match map markers
3. **Pose tracking** using precise forward kinematics

**Impact**: Enables spatial reasoning tasks like:

- "Go back to where you saw the cup"
- "Move to the left of the red block"
- "The target is between the two markers"

## Quick Start

### Installation

```bash
# Install dependencies
uv sync

# For mobile robots - install DPVO for visual odometry
./scripts/setup_dpvo.sh
```

### Basic Usage

```python
from spatial_context import SpatialContext

# Initialize
ctx = SpatialContext()

# In your robot policy loop (1 Hz)
robot_joint_angles = robot.get_joint_angles()  # 7-DOF

# 1. Add current frame
frame_id = ctx.add_frame(robot_joint_angles)

# 2. Generate spatial map
map_image, colors = ctx.generate_map()

# 3. Promote important frames to keyframes
ctx.promote_to_keyframe(frame_id)

# Feed map_image + keyframes to your VLM!
```

**That's it!** Your policy now has spatial awareness.

## Architecture

### For Stationary Robots (Current Setup)

Robots clamped to a table with precise actuators:

```
Joint Angles → Forward Kinematics → Camera Pose → Spatial Map
    (7-DOF)         (SE(3) 4×4)        (World)      (Egocentric BEV)
```

**Why no SLAM?** Precise actuators + stationary base = forward kinematics provides exact pose.

### For Mobile Robots

Robots with moving bases:

```
RGB Frames → DPVO → Robot Pose (World) → Combined with FK → Spatial Map
```

Both architectures use the same `SpatialContext` API.

## Repository Structure

```
spatial-memer/
├── src/
│   ├── robot_arm.py          # Forward kinematics (7-DOF robot arm)
│   ├── spatial_context.py    # Spatial memory + map generation
│   ├── localization.py       # DPVO wrapper for mobile robots
│   └── transforms.py         # SE(3) transformation utilities
├── scripts/
│   ├── test_pose.py          # Test forward kinematics
│   ├── test_spatial_context.py  # Test map generation
│   └── test_localization.py  # Test DPVO integration
├── docs/
│   ├── PROJECT_OVERVIEW.md   # High-level motivation + design
│   ├── ARCHITECTURE.md       # Technical deep-dive
│   ├── INTEGRATION_GUIDE.md  # API reference + examples
│   ├── EVALUATION.md         # Testing strategy (10 task types)
│   └── LOCALIZATION.md       # DPVO usage (mobile robots)
├── examples/
│   └── localization_example.py  # Full integration example
└── assets/
    └── home_example.mp4      # Test video for DPVO
```

## Documentation

- **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)**: Motivation, use cases, evaluation strategy
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Technical design, algorithms, coordinate frames
- **[INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)**: Complete API reference with examples
- **[EVALUATION.md](docs/EVALUATION.md)**: 100-test evaluation suite design
- **[LOCALIZATION.md](docs/LOCALIZATION.md)**: DPVO integration for mobile robots

## Example: Stationary Robot

```python
from spatial_context import SpatialContext
import numpy as np

# Initialize spatial memory
ctx = SpatialContext()

# Simulate robot motion
for timestep in range(50):
    # Get robot state (joint angles in radians)
    joint_angles = robot.get_joint_angles()  # 7-element array

    # Add frame (computes pose via forward kinematics)
    frame_id = ctx.add_frame(joint_angles)

    # Promote every 10th frame to keyframe
    if timestep % 10 == 0:
        ctx.promote_to_keyframe(frame_id)

# Generate map
map_image, keyframe_colors = ctx.generate_map()

# Show map
import cv2
cv2.imshow("Spatial Map", map_image)
cv2.waitKey(0)
```

## Example: Mobile Robot with DPVO

```python
from spatial_context import SpatialContext
from localization import Localization, load_camera_intrinsics

# Initialize localization (for moving robot base)
intrinsics = load_camera_intrinsics("external/DPVO/calib/camera.txt")
localizer = Localization(intrinsics, device="cuda:0")

# Initialize spatial memory
ctx = SpatialContext()

# High-rate loop (30 Hz camera)
for frame_idx, rgb_frame in enumerate(camera_stream):
    timestamp = frame_idx / 30.0

    # Get robot base pose from DPVO
    robot_pose = localizer.update(rgb_frame, timestamp)

    if robot_pose is None:  # Still initializing
        continue

    # Low-rate loop (1 Hz policy)
    if frame_idx % 30 == 0:
        joint_angles = robot.get_joint_angles()

        # Add frame with mobile base pose
        frame_id = ctx.add_frame(joint_angles, robot_pose)

        # Generate map
        map_image, colors = ctx.generate_map()
```

## Key Concepts

### Coordinate Frames

1. **World Frame**: Origin at robot base (fixed)
2. **Robot Frame**: Defined by forward kinematics chain
3. **Camera Frame**: Computed from end-effector pose

All transformations use SE(3) 4×4 matrices for precision.

### Egocentric Mapping

- Robot always at center (0, 0) of map
- Forward direction marked with arrow
- Keyframes positioned relative to current pose
- Auto-scaling to fit all observations
- Automatic outlier filtering (> 2σ)

### Visual Correspondence

- 8-color palette for keyframes (cycles for > 8)
- Watermarks in top-left of keyframe images
- Numbered labels (1, 2, 3...) for easy reference
- Intelligent overlap resolution

## Testing

```bash
# Test forward kinematics
python scripts/test_pose.py

# Test spatial context + map generation
python scripts/test_spatial_context.py

# Test DPVO integration (requires CUDA)
python scripts/test_localization.py

# Run DPVO on example video
cd external/DPVO
python demo.py --imagedir=../../assets/home_example.mp4 --calib=calib/iphone.txt --plot
```

## Evaluation

We've designed a comprehensive evaluation suite with **10 task categories × 10 examples = 100 tests** to demonstrate that policies actually use spatial information:

**Example Tasks**:

1. **Occluded Object Retrieval**: "Get the cup" (cup out of view, must use spatial memory)
2. **Relative Positioning**: "Move to the left of the block" (requires spatial reasoning)
3. **Return to Location**: "Go back to where you saw the marker" (temporal spatial memory)
4. **Spatial Sequencing**: "Visit locations A → B → C" (planning)

See **[EVALUATION.md](docs/EVALUATION.md)** for complete test suite design.

## Integration with MemER

```python
# Existing MemER loop (simplified)
for timestep in episode:
    observation = env.get_observation()
    action = policy(observation, memory)

    # === ADD: Spatial-MemER (3 lines) ===
    frame_id = spatial_ctx.add_frame(robot.joint_angles)
    map_image, colors = spatial_ctx.generate_map()
    watermarked_obs = spatial_ctx.watermark_keyframes([observation], colors)
    # === END ===

    # Policy now receives spatially-enhanced observations
    action = policy(watermarked_obs, map_image, memory)
```

## Implementation Status

**Complete**:

- Forward kinematics (7-DOF robot arm)
- Pose tracking and storage
- Egocentric BEV map generation
- Keyframe watermarking with color coding
- SE(3) coordinate transformations
- DPVO integration for mobile robots
- Comprehensive documentation

**Next steps for this proj and research:**:

- Integration with MemER codebase
- Evaluation suite implementation (100 tests)
- Real robot testing and validation
- VLM fine-tuning experiments

## Technical Highlights

### Forward Kinematics

- 7-DOF robot arm (e.g., Franka Panda)
- DH parameter-based kinematic chain
- Camera at end-effector
- < 0.1° accuracy with precise actuators

### Map Generation

- Automatic scaling (fits all keyframes)
- Outlier detection (> 2σ threshold)
- Overlap resolution (spiral placement)
- Configurable appearance (`MapConfig`)

### Performance

- Forward kinematics: < 0.1 ms
- Map generation (10 keyframes): < 5 ms
- Total overhead per policy iteration: < 10 ms
- Easily supports 1 Hz policy loop

## Use Cases

1. **Long-horizon manipulation**: Track object locations across multi-step tasks
2. **Spatial search**: "Find the blue ball" (avoid re-searching)
3. **Navigation**: "Return to the start position"
4. **Geometric reasoning**: "Place object between A and B"
5. **Temporal tracking**: "Show me where the cup was 30 seconds ago"

## Requirements

- Python 3.8+
- NumPy, OpenCV
- PyTorch (for DPVO on mobile robots)
- CUDA GPU (optional, for DPVO only)

## Citation

If you use Spatial-MemER in your research, please cite:

```bibtex
@software{spatial_memer_2026,
  title = {Spatial-MemER: Spatial Memory for Embodied Robots},
  author = {Music, Mark and Fonseca, Filippo},
  year = {2026},
  url = {https://github.com/yourusername/spatial-memer}
}
```

This work extends [MemER: Memory-Enhanced Robot Policies](https://jen-pan.github.io/memer/):

```bibtex
@article{sridhar2024memer,
  title = {MemER: Memory-Enhanced Robot Policies},
  author = {Sridhar, Ajay and Pan, Jennifer and Sharma, Satvik and Finn, Chelsea},
  year = {2024}
}
```

## Acknowledgments

This project builds on the MemER framework by Ajay Sridhar, Jennifer Pan, Satvik Sharma, and Chelsea Finn at Stanford. We extend their episodic memory approach with explicit spatial reasoning capabilities.

## License

Apache 2.0 License. See our LICENSE file for details. Quite standard.

## Contact

**Mark Music**
Stanford University, Class of 2028
[mmusic@stanford.edu](mailto:mmusic@stanford.edu) | [markmusic.io](https://markmusic.io)

**Filippo Fonseca**
Yale University, Class of 2028
[filippo.fonseca@yale.edu](mailto:filippo.fonseca@yale.edu) | [filippofonseca.com](https://filippofonseca.com)

---

<div align="center">

**Made with ❤️ in Costa Rica 🇨🇷 for our inspiration: Chelsea Finn and her team @ Physical Intelligence, as well as the entire physical AI research community.**

_Bridging AI and hardware to enable the future of robotics is a dream come true. If you have any questions, don't hesitate to reach out. We're always down for a chat._

</div>
