import numpy as np
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from spatial_context import SpatialContext


def test_spatial_context():
    """Test adding keyframes, recent frames, and generating map."""
    
    print("Initializing SpatialContext...")
    print("=" * 60)
    ctx = SpatialContext(relocalization=False, cutoff=5)
    
    # Add 3 keyframes with different joint configurations
    print("\nAdding 3 keyframes...")
    print("-" * 60)
    
    keyframe_configs = [
        np.array([0.0, -0.3, 0.0, -1.5, 0.0, 1.2, 0.0]),   # Keyframe 0
        np.array([0.5, -0.5, 0.3, -1.2, 0.2, 1.0, -0.3]),  # Keyframe 1
        np.array([-0.3, -0.4, -0.2, -1.8, -0.1, 1.4, 0.2]), # Keyframe 2
    ]
    
    for i, config in enumerate(keyframe_configs):
        ctx.add_keyframe(frame_id=i, robot_state=config)
        print(f"Keyframe {i}: joint angles = {config}")
        print(f"  EE position: {ctx.keyframe_poses[i][:3, 3]}")
    
    print(f"\nTotal keyframes stored: {len(ctx.keyframe_poses)}")
    
    # Add 10 recent frames (simulating a trajectory)
    print("\nAdding 10 recent frames...")
    print("-" * 60)
    
    # Generate a smooth trajectory between configurations
    start_config = np.array([0.0, -0.3, 0.0, -1.5, 0.0, 1.2, 0.0])
    end_config = np.array([0.8, -0.6, 0.5, -1.0, 0.4, 0.8, -0.5])
    
    for i in range(10):
        t = i / 9.0  # interpolation parameter [0, 1]
        config = start_config + t * (end_config - start_config)
        frame_id = ctx.add_recent_frame(robot_state=config)
        print(f"Recent frame {frame_id}: t={t:.2f}, EE pos = {ctx.recent_poses[-1][1][:3, 3]}")
    
    print(f"\nRecent frames stored (cutoff={ctx.cutoff}): {len(ctx.recent_poses)}")
    print(f"Recent frame IDs: {[fid for fid, _ in ctx.recent_poses]}")
    
    # Get current pose
    print("\nCurrent pose (most recent):")
    print("-" * 60)
    current_pose = ctx.get_current_pose()
    print(f"Position: {current_pose[:3, 3]}")
    print(f"Rotation matrix:\n{current_pose[:3, :3]}")
    
    # Generate map
    print("\nGenerating egocentric BEV map...")
    print("-" * 60)
    bev_map = ctx.generate_map()
    print(f"Map result: {bev_map}")
    print("(generate_map not yet implemented)")
    
    print("\n" + "=" * 60)
    print("Test completed!")


if __name__ == "__main__":
    test_spatial_context()

