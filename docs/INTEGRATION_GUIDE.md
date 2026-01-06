# Integration Guide

This guide shows how to integrate Spatial-MemER into your robot policy in **three simple steps**.

## Quick Start (5 minutes)

### Prerequisites

```bash
# Install dependencies
uv sync

# For mobile robots (optional)
./scripts/setup_dpvo.sh
```

### Minimal Example

```python
import numpy as np
from spatial_context import SpatialContext

# Initialize (once)
ctx = SpatialContext()

# In your policy loop
robot_joint_angles = get_robot_state()  # Your robot API

# Step 1: Add current frame
frame_id = ctx.add_frame(robot_joint_angles)

# Step 2: Generate map
map_image, colors = ctx.generate_map()

# Step 3: Promote important frames
ctx.promote_to_keyframe(frame_id)

# Now feed map_image to your VLM!
```

That's it. You now have spatial awareness.

## Full Integration

### Step 1: Import Modules

```python
from spatial_context import SpatialContext, MapConfig
import numpy as np
```

### Step 2: Initialize SpatialContext

```python
# Option A: Default configuration
spatial_ctx = SpatialContext()

# Option B: Custom map settings
config = MapConfig(
    image_size=1024,      # Higher resolution
    keyframe_radius=20    # Larger markers
)
spatial_ctx = SpatialContext(map_config=config)
```

### Step 3: Main Policy Loop

```python
def robot_policy_loop():
    """Example high-level policy with spatial awareness."""

    spatial_ctx = SpatialContext()
    episode_memory = []  # Your existing episodic memory

    for timestep in range(max_timesteps):
        # Get current observation
        rgb_image = camera.get_frame()
        robot_state = robot.get_joint_angles()  # 7-element array

        # === SPATIAL-MEMER INTEGRATION (3 lines) ===

        # 1. Add current frame to spatial memory
        frame_id = spatial_ctx.add_frame(robot_state)

        # 2. Generate spatial map
        map_image, keyframe_colors = spatial_ctx.generate_map()

        # 3. Watermark any keyframe images you want to show
        if len(episode_memory) > 0:
            keyframe_data = [(mem['frame_id'], mem['image'])
                           for mem in episode_memory]
            watermarked_imgs = spatial_ctx.watermark_keyframes(
                keyframe_data,
                keyframe_colors
            )
        else:
            watermarked_imgs = []

        # === END SPATIAL-MEMER ===

        # Feed to VLM
        prompt = construct_prompt(watermarked_imgs, map_image)
        action = vlm.predict(prompt)

        # Execute action
        robot.execute(action)

        # Decide if this frame should be a keyframe
        if should_save_as_keyframe(timestep):  # Your logic
            spatial_ctx.promote_to_keyframe(frame_id)
            episode_memory.append({
                'frame_id': frame_id,
                'image': rgb_image,
                'action': action
            })

    return episode_memory
```

## API Reference

### SpatialContext

#### `__init__(relocalization=False, map_config=None)`

Initialize spatial memory system.

**Parameters**:
- `relocalization` (bool): Enable re-localization mode (future feature)
- `map_config` (MapConfig): Custom visualization settings

**Example**:
```python
ctx = SpatialContext()
```

---

#### `add_frame(robot_state, robot_pose=None) -> int`

Store pose for current frame.

**Parameters**:
- `robot_state` (np.ndarray): Joint angles, shape (7,), radians
- `robot_pose` (np.ndarray, optional): 4×4 SE(3) robot base pose. Default: identity (stationary robot)

**Returns**:
- `frame_id` (int): Unique identifier for this frame

**Example**:
```python
joint_angles = np.array([0.0, -0.3, 0.0, -2.2, 0.0, 2.0, 0.8])
frame_id = ctx.add_frame(joint_angles)
print(f"Frame ID: {frame_id}")  # Frame ID: 0
```

**Notes**:
- For stationary robots (clamped to table), omit `robot_pose`
- For mobile robots, provide `robot_pose` from SLAM/DPVO

---

#### `promote_to_keyframe(frame_id)`

Mark a frame as important (keyframe).

**Parameters**:
- `frame_id` (int): Frame to promote

**Raises**:
- `ValueError`: If frame_id doesn't exist

**Example**:
```python
ctx.promote_to_keyframe(frame_id)
```

**When to use**: After policy decides this observation is important (e.g., saw target object, completed subgoal).

---

#### `remove_keyframe(frame_id)`

Delete a keyframe.

**Parameters**:
- `frame_id` (int): Keyframe to remove

**Example**:
```python
ctx.remove_keyframe(old_frame_id)
```

**When to use**: Keyframe no longer relevant (e.g., object moved, old observation).

---

#### `generate_map() -> (np.ndarray, dict)`

Create egocentric BEV spatial map.

**Returns**:
- `map_image` (np.ndarray): RGB image, shape (H, W, 3), uint8
- `colors` (dict): {frame_id → (B, G, R)} color mapping

**Example**:
```python
map_img, colors = ctx.generate_map()
cv2.imshow("Spatial Map", map_img)
```

**Map Features**:
- Robot at center (gray circle + forward arrow)
- Keyframes as colored squares with numbers
- Auto-scaled to fit all keyframes
- Outliers filtered automatically

---

#### `watermark_keyframes(keyframes, colors) -> list`

Add colored markers to keyframe images.

**Parameters**:
- `keyframes` (list): List of (frame_id, image) tuples
- `colors` (dict): Color mapping from `generate_map()`

**Returns**:
- List of watermarked images (np.ndarray)

**Example**:
```python
map_img, colors = ctx.generate_map()
keyframes = [(0, img1), (5, img2), (12, img3)]
watermarked = ctx.watermark_keyframes(keyframes, colors)
```

**Watermark Appearance**:
- Small colored square in top-left
- Number label (1, 2, 3...)
- Matches map marker color

---

#### `get_current_pose() -> np.ndarray`

Get most recent camera pose.

**Returns**:
- 4×4 SE(3) transformation matrix

**Example**:
```python
current_pose = ctx.get_current_pose()
position = current_pose[:3, 3]
print(f"Current position: {position}")
```

---

### MapConfig

Configuration for map visualization.

```python
from dataclasses import dataclass

@dataclass
class MapConfig:
    image_size: int = 512              # Map dimensions (pixels)
    border_size: int = 4               # Edge padding
    outlier_std_threshold: float = 2   # Outlier detection threshold (σ)
    keyframe_radius: int = 16          # Marker size
    robot_radius: int = 18             # Robot circle radius
    circle_border_size: int = 1        # Border thickness
    font_scale: float = 0.6            # Label text size
```

**Example**:
```python
config = MapConfig(image_size=1024, keyframe_radius=24)
ctx = SpatialContext(map_config=config)
```

---

## Integration Patterns

### Pattern 1: Fixed-Frequency Keyframes

Save keyframe every N timesteps.

```python
KEYFRAME_INTERVAL = 10  # Every 10 steps

for t in range(max_steps):
    frame_id = ctx.add_frame(robot_state)

    if t % KEYFRAME_INTERVAL == 0:
        ctx.promote_to_keyframe(frame_id)
```

### Pattern 2: Event-Based Keyframes

Save keyframe when something important happens.

```python
for t in range(max_steps):
    frame_id = ctx.add_frame(robot_state)
    action = policy(observation)

    # Save if observed target object
    if "target" in vlm_response:
        ctx.promote_to_keyframe(frame_id)

    # Save if reached subgoal
    if subgoal_reached():
        ctx.promote_to_keyframe(frame_id)
```

### Pattern 3: VLM-Selected Keyframes

Let VLM decide what's important.

```python
for t in range(max_steps):
    frame_id = ctx.add_frame(robot_state)
    map_img, colors = ctx.generate_map()

    # Ask VLM if current view is important
    vlm_response = vlm.predict(
        image=observation,
        map=map_img,
        prompt="Is this view important for the task? (yes/no)"
    )

    if vlm_response == "yes":
        ctx.promote_to_keyframe(frame_id)
```

### Pattern 4: Memory Management

Limit number of keyframes to prevent overflow.

```python
MAX_KEYFRAMES = 20

for t in range(max_steps):
    frame_id = ctx.add_frame(robot_state)

    if should_add_keyframe():
        # Remove oldest if at capacity
        if len(ctx.keyframe_poses) >= MAX_KEYFRAMES:
            oldest_id = min(ctx.keyframe_poses.keys())
            ctx.remove_keyframe(oldest_id)

        ctx.promote_to_keyframe(frame_id)
```

---

## Advanced Usage

### Mobile Robot Integration

For robots with moving bases (not clamped), integrate with DPVO:

```python
from localization import Localization, load_camera_intrinsics

# Initialize localization
intrinsics = load_camera_intrinsics("calib/camera.txt")
localizer = Localization(intrinsics, device="cuda:0")

# Initialize spatial context
ctx = SpatialContext()

# High-rate loop (30 Hz)
for frame in camera_stream:
    timestamp = get_timestamp()

    # Get robot base pose from DPVO
    robot_pose = localizer.update(frame, timestamp)

    if robot_pose is None:  # Still initializing
        continue

    # Low-rate loop (1 Hz)
    if frame_count % 30 == 0:
        robot_state = robot.get_joint_angles()

        # Add frame with mobile base pose
        frame_id = ctx.add_frame(robot_state, robot_pose)
```

### Custom Robot Configuration

For different robot geometries, modify `RobotArm`:

```python
from robot_arm import RobotArm

# Subclass for your robot
class MyRobotArm(RobotArm):
    def __init__(self):
        # Your DH parameters
        self.dh_params = [...]

    def forward_kinematics(self, joint_angles):
        # Your FK implementation
        return T_base_to_camera

# Use custom robot
ctx = SpatialContext()
ctx.robot_arm = MyRobotArm()
```

### Visualization Customization

```python
import cv2

map_img, colors = ctx.generate_map()

# Add custom annotations
cv2.putText(map_img, "Goal: Kitchen", (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

# Draw path (if you have trajectory)
for i in range(len(trajectory) - 1):
    pt1 = trajectory_to_pixel(trajectory[i])
    pt2 = trajectory_to_pixel(trajectory[i+1])
    cv2.line(map_img, pt1, pt2, (255, 0, 0), 2)

cv2.imshow("Custom Map", map_img)
```

---

## Debugging Tips

### Verify Poses

```python
# Check if poses look reasonable
pose = ctx.get_current_pose()
print("Current pose:\n", pose)
print("Position:", pose[:3, 3])

# Should be valid SE(3)
from transforms import transform_is_valid
assert transform_is_valid(pose), "Invalid pose!"
```

### Visualize Trajectory

```python
import matplotlib.pyplot as plt

# Collect positions over time
positions = []
for t in range(100):
    frame_id = ctx.add_frame(robot_state)
    pose = ctx.get_current_pose()
    positions.append(pose[:3, 3])

# Plot XY trajectory
positions = np.array(positions)
plt.plot(positions[:, 0], positions[:, 1])
plt.xlabel("X (m)")
plt.ylabel("Y (m)")
plt.title("Robot Trajectory")
plt.show()
```

### Check Map Scale

```python
map_img, colors = ctx.generate_map()

# Print map metadata
print(f"Number of keyframes: {len(ctx.keyframe_poses)}")
print(f"Map image shape: {map_img.shape}")
print(f"Colors: {colors}")

# Save for inspection
cv2.imwrite("debug_map.png", map_img)
```

### Validate Joint Angles

```python
# Ensure joint angles are in radians
joint_angles = robot.get_joint_angles()
print("Joint angles (rad):", joint_angles)

# Check range
assert np.all(np.abs(joint_angles) < 3.14), "Angles too large (degrees?)"
```

---

## Common Issues

### Issue: Map shows no keyframes

**Cause**: Forgot to promote frames to keyframes.

**Solution**:
```python
frame_id = ctx.add_frame(robot_state)
ctx.promote_to_keyframe(frame_id)  # Don't forget this!
```

---

### Issue: Watermark colors don't match map

**Cause**: Using different color dict than from `generate_map()`.

**Solution**: Always use colors from the same `generate_map()` call:
```python
map_img, colors = ctx.generate_map()  # Get both together
watermarked = ctx.watermark_keyframes(keyframes, colors)
```

---

### Issue: All keyframes at same location

**Cause**: Robot not moving, or joint angles not changing.

**Solution**: Verify robot is actually moving:
```python
angles_t0 = robot.get_joint_angles()
robot.move()
angles_t1 = robot.get_joint_angles()
print("Change:", angles_t1 - angles_t0)  # Should be non-zero
```

---

### Issue: Map is all white

**Cause**: No keyframes added, or they're all at current position.

**Solution**: Ensure keyframes are from different poses:
```python
# Bad: Save keyframe at same position
frame_id = ctx.add_frame(robot_state)
ctx.promote_to_keyframe(frame_id)  # Shows nothing (current pose)

# Good: Save keyframe, then move, then generate map
frame_id = ctx.add_frame(robot_state)
ctx.promote_to_keyframe(frame_id)
robot.move_to_different_pose()
ctx.add_frame(new_robot_state)  # Update current pose
map_img, colors = ctx.generate_map()  # Now shows keyframe
```

---

### Issue: Keyframes placed incorrectly

**Cause**: Wrong coordinate frame or invalid SE(3) matrix.

**Solution**: Validate transforms:
```python
from transforms import transform_is_valid

for fid, pose in ctx.keyframe_poses.items():
    if not transform_is_valid(pose):
        print(f"Invalid pose for frame {fid}!")
```

---

## Performance Optimization

### Minimize Map Regeneration

```python
# Bad: Generate map every frame
for t in range(1000):
    frame_id = ctx.add_frame(robot_state)
    map_img, colors = ctx.generate_map()  # Slow!

# Good: Generate map only when needed
for t in range(1000):
    frame_id = ctx.add_frame(robot_state)

    if t % 10 == 0:  # Only every 10 frames
        map_img, colors = ctx.generate_map()
```

### Limit Keyframes

```python
# Keep only most recent N keyframes
MAX_KEYFRAMES = 10

if len(ctx.keyframe_poses) > MAX_KEYFRAMES:
    oldest = min(ctx.keyframe_poses.keys())
    ctx.remove_keyframe(oldest)
```

### Batch Watermarking

```python
# Watermark all keyframes at once (faster than individually)
all_keyframes = [(fid, images[fid]) for fid in ctx.keyframe_poses]
watermarked = ctx.watermark_keyframes(all_keyframes, colors)
```

---

## Example: Complete MemER Integration

```python
"""
Full example integrating Spatial-MemER with MemER-style policy.
"""

import numpy as np
from spatial_context import SpatialContext
from your_robot_api import Robot, Camera
from your_vlm_api import VLM

def run_episode(task_description: str):
    """Execute one episode with spatial memory."""

    # Initialize
    robot = Robot()
    camera = Camera()
    vlm = VLM()
    spatial_ctx = SpatialContext()

    # Episode memory
    keyframes = []

    for t in range(100):  # Max 100 timesteps
        # Observation
        rgb = camera.get_frame()
        robot_state = robot.get_joint_angles()

        # Spatial memory update
        frame_id = spatial_ctx.add_frame(robot_state)
        map_img, colors = spatial_ctx.generate_map()

        # Watermark previous keyframes
        if keyframes:
            keyframe_data = [(kf['id'], kf['img']) for kf in keyframes]
            watermarked = spatial_ctx.watermark_keyframes(
                keyframe_data, colors
            )
        else:
            watermarked = []

        # Construct VLM prompt
        prompt = f"""
Task: {task_description}

You have access to:
1. Current observation (shown below)
2. Spatial map showing your position and past keyframes
3. {len(watermarked)} watermarked keyframe images

Spatial map (you are the gray circle in the center):
[MAP IMAGE]

Previous keyframes:
[WATERMARKED IMAGES]

Current observation:
[CURRENT RGB]

What action should you take?
"""

        # Query VLM
        response = vlm.predict(
            prompt=prompt,
            images=[map_img] + watermarked + [rgb]
        )

        # Parse action
        action = parse_action(response)

        # Execute
        robot.execute(action)

        # Decide if keyframe
        if should_save(response, t):
            spatial_ctx.promote_to_keyframe(frame_id)
            keyframes.append({'id': frame_id, 'img': rgb})

        # Check termination
        if is_task_complete(response):
            print(f"Task completed in {t} steps!")
            break

    return keyframes

# Run
run_episode("Pick up the red block and place it in the bin")
```

---

## Testing Your Integration

```python
# Minimal integration test
def test_integration():
    from spatial_context import SpatialContext
    import numpy as np

    ctx = SpatialContext()

    # Add 5 frames with random poses
    for i in range(5):
        angles = np.random.randn(7) * 0.1  # Small random motion
        frame_id = ctx.add_frame(angles)

        if i % 2 == 0:  # Promote every other frame
            ctx.promote_to_keyframe(frame_id)

    # Generate map
    map_img, colors = ctx.generate_map()

    # Checks
    assert map_img.shape == (512, 512, 3), "Wrong map shape"
    assert len(colors) == 3, "Should have 3 keyframes"  # 0, 2, 4

    print("✓ Integration test passed!")

if __name__ == "__main__":
    test_integration()
```

---

## Next Steps

1. Read `ARCHITECTURE.md` for technical details
2. Read `EVALUATION.md` for testing strategy
3. Check `examples/` for more usage examples
4. Join our demo session to see it in action!

## Support

Issues or questions? Open an issue on GitHub or contact the team.
