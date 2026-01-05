# Spatial-MemER (from tnr)

Spatial extension of MemER paper. Imbuing robot policies with a notion of space.

## Installation

### DPVO (Visual Odometry)

DPVO is used for camera localization. It requires an NVIDIA GPU with CUDA.

```bash
# On a CUDA-enabled machine (e.g., Thunder Compute)
./scripts/setup_dpvo.sh

# To test downloads only (no CUDA required)
./scripts/setup_dpvo.sh --download-only
```

## Example Flow

```python
# Loop at 1Hz (in high-level policy):
# 0. Get camera pose from DPVO
rgb, depth = zed_camera.get_frame()
robot_pose = localizer.update(rgb, depth, timestamp)

if robot_pose is None: # None while DPVO initializes
    continue

# 1. Store current pose
frame_id = spatial_context.add_frame(robot_state, robot_pose.as_matrix())

# 2. Generate map and watermark keyframes
map, colors = spatial_context.generate_map()
watermarked_keyframes = ctx.watermark_keyframes(keyframe_images, colors)

# 3. VLM runs... (VLM is fed the map and watermarked keyframes)

# 4. Promote selected keyframes (clustering selects a keyframe, there can be none)
for selected_id in selected_keyframe_ids:
    spatial_context.promote_to_keyframe(selected_id)
```