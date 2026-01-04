Spatial extension of MemER paper. Imbuing robot policies with a notion of space.


Example flow as of right now

```python
# At 1Hz (in high-level policy):
# 1. Store current pose
frame_id = spatial_context.add_frame(robot_state, robot_pose)

# 2. Generate map and watermark keyframes
map, colors = spatial_context.generate_map()
watermarked_keyframes = ctx.watermark_keyframes(keyframe_images, colors)

# 3. VLM runs... (VLM is fed the map and watermarked keyframes)

# 4. Promote selected keyframes (clustering selects a keyframe, there can be none)
for selected_id in selected_keyframe_ids:
    spatial_context.promote_to_keyframe(selected_id)
```