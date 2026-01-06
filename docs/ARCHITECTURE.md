# Spatial-MemER Architecture

## System Design

Spatial-MemER is designed as a modular spatial memory system that integrates with high-level robot policies. The architecture prioritizes precision, modularity, and ease of integration.

## Design Philosophy

1. **Precision over Approximation**: Use forward kinematics for exact pose (stationary robots)
2. **Modularity**: Each component is independent and testable
3. **Simplicity**: Three function calls for full integration
4. **Extensibility**: Support both stationary and mobile robots

## Module Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    High-Level Policy (MemER)                 │
│                         (1 Hz loop)                          │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ 3 function calls
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      SpatialContext                          │
│  • Pose tracking (all frames + keyframes)                   │
│  • Map generation (egocentric BEV)                           │
│  • Keyframe watermarking                                     │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  RobotArm    │    │  Transforms  │    │ Localization │
│              │    │              │    │  (optional)  │
│ • Forward    │    │ • SE(3) ops  │    │ • DPVO       │
│   kinematics │    │ • Validation │    │ • Mobile     │
│ • 7-DOF      │    │ • Inverse    │    │   robots     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Core Modules

### 1. RobotArm (`robot_arm.py`)

**Purpose**: Compute camera pose from robot joint angles using forward kinematics.

**Implementation**:
- 7-DOF robot arm (e.g., Franka Emika Panda)
- DH parameters for kinematic chain
- Camera mounted at end-effector
- Returns SE(3) transformation from base to camera

**Key Method**:
```python
def forward_kinematics(self, joint_angles: np.ndarray) -> np.ndarray:
    """
    Args:
        joint_angles: 7-element array [q1, q2, ..., q7] (radians)
    Returns:
        T: 4×4 SE(3) matrix (base → camera)
    """
```

**Coordinate Frame**:
- Origin: Robot base (fixed to table)
- Z-axis: Up (vertical)
- Camera frame: Computed from end-effector pose

**Why This Works**:
- Precise actuators (< 0.1° error)
- Stationary base (no drift)
- No SLAM needed

### 2. SpatialContext (`spatial_context.py`)

**Purpose**: Main interface for spatial memory. Tracks poses, generates maps, manages keyframes.

**State**:
```python
class SpatialContext:
    keyframe_poses: dict[int, np.ndarray]  # Selected important frames
    all_poses: dict[int, np.ndarray]       # Every frame observed
    robot_arm: RobotArm                    # FK module
    map_config: MapConfig                  # Visualization settings
```

**Three Essential Methods**:

#### 2.1 `add_frame(robot_state, robot_pose=None)`
Stores pose for current observation.

```python
# Computes: world_pose = robot_pose @ FK(robot_state)
# For stationary: robot_pose = I (identity)
# Returns: frame_id (unique identifier)
```

**Flow**:
1. Run forward kinematics: `ee_pose = FK(joint_angles)`
2. Transform to world: `world_pose = robot_pose @ ee_pose`
3. Store: `all_poses[frame_id] = world_pose`
4. Return `frame_id`

#### 2.2 `generate_map()`
Creates egocentric BEV spatial map.

```python
# Returns: (map_image, colors)
# map_image: 512×512 RGB showing robot + keyframes
# colors: dict[frame_id → (B,G,R)] for watermarking
```

**Algorithm**:
1. Get current pose (most recent)
2. Compute relative positions of all keyframes
3. Detect outliers (> 2σ from mean distance)
4. Scale to fit canvas (auto-zoom)
5. Resolve overlaps (spiral placement)
6. Draw robot (gray circle + arrow) at center
7. Draw keyframes (colored squares) at positions
8. Return image + color mapping

**Key Features**:
- Egocentric: Robot always at (0, 0)
- Forward direction: Arrow points "up" on map
- Auto-scaling: Zooms to fit all keyframes
- Outlier removal: Filters spurious poses
- Overlap resolution: Prevents marker collision

#### 2.3 `watermark_keyframes(keyframes, colors)`
Adds colored markers to keyframe images.

```python
# Args:
#   keyframes: list[(frame_id, image)]
#   colors: dict from generate_map()
# Returns: list[watermarked_images]
```

**Watermark**:
- Small colored square in top-left corner
- Matches map marker color exactly
- Numbered label (1, 2, 3...)
- Black border for visibility

**Additional Methods**:
- `promote_to_keyframe(frame_id)`: Mark frame as important
- `remove_keyframe(frame_id)`: Delete keyframe
- `get_current_pose()`: Latest robot pose

### 3. Transforms (`transforms.py`)

**Purpose**: Utilities for SE(3) transformations.

**Key Functions**:

```python
# Validate SE(3) matrix
transform_is_valid(T: np.ndarray) -> bool

# Invert SE(3) transformation
transform_inverse(T: np.ndarray) -> np.ndarray

# Compute relative pose: aTb given wTa and wTb
compute_relative_pose(a: np.ndarray, b: np.ndarray) -> np.ndarray

# Extract translation from SE(3)
extract_displacement(T: np.ndarray) -> np.ndarray  # [x, y, z]
```

**SE(3) Matrix Format**:
```
T = [R | t]  where R ∈ SO(3), t ∈ ℝ³
    [0 | 1]

    [r11  r12  r13  tx]
    [r21  r22  r23  ty]
    [r31  r32  r33  tz]
    [ 0    0    0    1]
```

**Validation Checks**:
- Shape: 4×4
- Orthogonality: R^T R = I
- Determinant: det(R) = 1
- Bottom row: [0, 0, 0, 1]

### 4. Localization (`localization.py`)

**Purpose**: DPVO wrapper for mobile robot scenarios (optional).

**When to Use**:
- Robot base can move (not clamped)
- Need to track global position
- Less precise actuators

**Architecture**:
```
RGB frames → DPVO → camera_pose → transform → world_pose
                    (camera frame)          (world frame)
```

**Key Method**:
```python
def update(rgb: np.ndarray, timestamp: float) -> Optional[np.ndarray]:
    # Returns: 4×4 SE(3) world pose (or None if initializing)
```

**Note**: For stationary robots (current setup), this module is **not needed**. Just use forward kinematics with `robot_pose = np.eye(4)`.

## Coordinate Frames

### Frame Definitions

```
World Frame (W):
  Origin: Robot base
  Z: Up (vertical)
  X, Y: Horizontal plane

Robot Frame (R):
  Defined by DH parameters
  Coincides with base for joint 1

End-Effector Frame (EE):
  Computed via forward kinematics
  Camera attached here

Camera Frame (C):
  May have fixed offset from EE
  (Currently assumed coincident)
```

### Transformation Chain

**Stationary Robot**:
```
Joint Angles → FK → T_base_to_camera
T_world = T_base_to_camera  (since base IS world origin)
```

**Mobile Robot**:
```
Joint Angles → FK → T_base_to_camera
DPVO → T_world_to_base
T_world = T_world_to_base @ T_base_to_camera
```

### Relative Pose Computation

To display keyframe K relative to current pose C:

```python
# Both in world frame
world_T_current = spatial_context.get_current_pose()
world_T_keyframe = spatial_context.keyframe_poses[K]

# Compute current_T_keyframe
current_T_keyframe = inverse(world_T_current) @ world_T_keyframe

# Extract x, y for map
x, y, z = extract_displacement(current_T_keyframe)
# Display at (x, y) on map (ignore z for BEV)
```

## Map Generation Algorithm

### Input
- `current_pose`: Latest SE(3) pose
- `keyframe_poses`: Dict of important frame poses

### Output
- `map_image`: 512×512 RGB image
- `colors`: Dict mapping frame_id → (B,G,R) color

### Steps

#### 1. Compute Relative Positions
```python
for frame_id, world_pose in keyframe_poses:
    relative_pose = inverse(current_pose) @ world_pose
    x, y, z = extract_displacement(relative_pose)
    positions[frame_id] = (x, y)
```

#### 2. Outlier Detection
```python
distances = [sqrt(x² + y²) for (x,y) in positions]
mean_dist = mean(distances)
std_dist = std(distances)
threshold = mean_dist + 2 * std_dist
outliers = {id for id in positions if distance[id] > threshold}
```

#### 3. Scaling
```python
max_inlier_dist = max(dist for id, dist in distances if id not in outliers)
canvas_radius = (512 - 2*border) / 2 - margin
scale = canvas_radius / max_inlier_dist  # pixels per meter
```

#### 4. Pixel Coordinate Conversion
```python
center = 256  # Image center
for frame_id, (x, y) in positions:
    px = center + int(x * scale)
    py = center - int(y * scale)  # Flip y (image coords)
```

#### 5. Overlap Resolution
```python
# Spiral search for collision-free position
if collision(px, py, placed_circles):
    for radius in [1, 2, 3, ...]:
        for angle in [0°, 45°, 90°, ...]:
            new_px = px + radius * step * cos(angle)
            new_py = py + radius * step * sin(angle)
            if not collision(new_px, new_py):
                return (new_px, new_py)
```

#### 6. Drawing
```python
# Draw robot (gray circle + arrow)
cv2.circle(image, (center, center), robot_radius, gray)
cv2.arrowedLine(image, (center, center+3), (center, center-30), black)

# Draw keyframes (colored squares)
for i, frame_id in enumerate(keyframe_ids):
    color = get_color(i)  # 8-color palette
    cv2.rectangle(image, top_left, bottom_right, color)
    cv2.putText(image, str(i+1), position, font)
```

## Color Scheme

8-color palette (cycles for > 8 keyframes):

```python
base_colors = [
    (25, 25, 230),      # Red
    (60, 180, 75),      # Green
    (200, 130, 0),      # Blue
    (48, 130, 245),     # Orange
    (180, 30, 145),     # Purple
    (240, 240, 70),     # Cyan
    (230, 50, 240),     # Magenta
    (60, 245, 210)      # Yellow
]

# Whitewashed (45%) for readability
final_color = base + (255 - base) * 0.45
```

Colors are in BGR format (OpenCV convention).

## Configuration

All visualization parameters in `MapConfig`:

```python
@dataclass
class MapConfig:
    image_size: int = 512              # Map image dimensions
    border_size: int = 4               # Edge padding
    outlier_std_threshold: float = 2   # Outlier detection (σ)
    keyframe_radius: int = 16          # Marker size
    robot_radius: int = 18             # Robot circle size
    circle_border_size: int = 1        # Border thickness
    font_scale: float = 0.6            # Label text size
```

## Performance Considerations

### Computational Complexity

- **Forward Kinematics**: O(7) - 7 matrix multiplications
- **Pose Storage**: O(1) - dict insertion
- **Map Generation**: O(K) where K = number of keyframes
- **Overlap Resolution**: O(K²) worst case (typically O(K))

### Memory Usage

- Each pose: 4×4 × 8 bytes = 128 bytes
- For 1000 frames: ~125 KB
- Map image: 512×512×3 = 768 KB
- Total: < 1 MB (negligible)

### Timing

On typical hardware:
- Forward kinematics: < 0.1 ms
- Add frame: < 0.2 ms
- Generate map (10 keyframes): < 5 ms
- Watermark keyframes: < 2 ms per image

**Total overhead per HLP iteration**: < 10 ms (easily supports 1 Hz policy)

## Error Handling

### Invalid Inputs

```python
# SE(3) validation
if not transform_is_valid(pose):
    raise ValueError("Invalid SE(3) matrix")

# Frame ID validation
if frame_id not in all_poses:
    raise ValueError(f"Frame {frame_id} not found")
```

### Numerical Stability

- Check for near-zero distances before scaling
- Clamp pixel coordinates to image bounds
- Handle empty keyframe lists gracefully

### Edge Cases

- **No keyframes**: Show only robot on blank map
- **Single keyframe**: Place at actual position (no outlier detection)
- **< 5 keyframes**: Skip outlier detection (too few samples)
- **All keyframes at origin**: Use default scale (50 px/m)

## Extension Points

### Custom Robot Geometries

Modify `RobotArm.forward_kinematics()` with your DH parameters:

```python
# Example: 6-DOF robot
def forward_kinematics(self, joint_angles: np.ndarray) -> np.ndarray:
    # Implement your kinematic chain
    T = np.eye(4)
    for i, (a, alpha, d, theta) in enumerate(dh_params):
        T = T @ dh_transform(a, alpha, d, theta + joint_angles[i])
    return T
```

### Custom Map Styles

Modify `MapConfig` for different visualization:

```python
config = MapConfig(
    image_size=1024,           # Higher resolution
    keyframe_radius=24,        # Larger markers
    outlier_std_threshold=3    # More lenient outlier detection
)
spatial_context = SpatialContext(map_config=config)
```

### 3D Maps

Current implementation is 2D BEV. For 3D:

```python
# Use z-coordinate for color intensity or size
z = extract_displacement(relative_pose)[2]
intensity = int(255 * (z / max_z))  # Encode height as brightness
```

### Multiple Robots

Track multiple robots with separate `SpatialContext` instances:

```python
robot1_ctx = SpatialContext()
robot2_ctx = SpatialContext()

# Merge maps if needed
combined_map = overlay_maps([robot1_ctx.generate_map()[0],
                              robot2_ctx.generate_map()[0]])
```

## Testing Strategy

### Unit Tests

- `test_robot_arm.py`: FK correctness, joint limit checks
- `test_transforms.py`: SE(3) validation, inverse, composition
- `test_spatial_context.py`: Pose storage, map generation

### Integration Tests

- End-to-end: Joint angles → map generation
- Keyframe promotion and removal
- Color consistency across map and watermarks

### Validation

- Compare FK against URDF simulation (PyBullet)
- Verify map scaling with known trajectories
- Check color accuracy (visual inspection)

## Production Deployment

### Checklist

- [ ] Calibrate robot DH parameters
- [ ] Verify joint angle units (radians/degrees)
- [ ] Test with real robot poses
- [ ] Validate map scale (measure actual distances)
- [ ] Profile performance on target hardware
- [ ] Add logging for debugging

### Integration with MemER

See `INTEGRATION_GUIDE.md` for step-by-step instructions.

## Future Enhancements

1. **Semantic Mapping**: Associate object labels with spatial locations
2. **Temporal Decay**: Fade old keyframes over time
3. **Active Exploration**: Suggest poses for better spatial coverage
4. **Multi-Modal Maps**: Combine visual + depth + semantic info
5. **Shared Maps**: Multi-robot coordination

## References

- MemER Paper: [Memory-Enhanced Robot Policies]
- DPVO: [Deep Patch Visual Odometry]
- Forward Kinematics: Craig, J. "Introduction to Robotics"
- SE(3) Geometry: Murray, Li, Sastry. "A Mathematical Introduction to Robotic Manipulation"
