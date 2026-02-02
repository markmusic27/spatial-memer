"""Test that OmniGibson ground truth poses feed into SpatialContext correctly."""
import numpy as np
import sys
sys.path.insert(0, "src")

from spatial_context import SpatialContext
from scipy.spatial.transform import Rotation

# Helper: convert OmniGibson pose to SE(3) matrix
def pose_to_se3(position, orientation):
    """
    position: [x, y, z]
    orientation: quaternion — CHECK CONVENTION (Isaac Sim may use wxyz, scipy uses xyzw)
    """
    T = np.eye(4)
    # Try xyzw first. If the map looks wrong, swap to wxyz: orientation[[1,2,3,0]]
    T[:3, :3] = Rotation.from_quat(orientation).as_matrix()
    T[:3, 3] = position
    return T

try:
    import omnigibson as og
    from omnigibson.macros import gm
    gm.USE_FLATCACHE = True

    cfg = {
        "scene": {
            "type": "InteractiveTraversableScene",
            "scene_model": "Rs_int",
        },
        "robots": [{
            "type": "Fetch",
            "obs_modalities": ["rgb", "proprio"],
            "controller_config": {
                "base": {"name": "DifferentialDriveController"},
                "arm_0": {"name": "InverseKinematicsController"},
                "gripper_0": {"name": "MultiFingerGripperController"},
            }
        }]
    }

    env = og.Environment(configs=cfg)
    obs, info = env.reset()
    robot = env.robots[0]

    ctx = SpatialContext()

    # Drive around randomly, collect ground truth poses
    for step in range(200):
        action = env.action_space.sample()
        obs, reward, done, truncated, info = env.step(action)

        cam_pos, cam_ori = robot.links["eyes"].get_position_orientation()
        T = pose_to_se3(cam_pos.numpy(), cam_ori.numpy())
        frame_id = ctx.add_frame_with_pose(T)

        if step % 40 == 0:
            ctx.promote_to_keyframe(frame_id)
            print(f"Step {step}: keyframe added at position {cam_pos[:2].numpy()}")

    map_img, colors = ctx.generate_map()
    
    import cv2
    cv2.imwrite("results/behavior_bridge_test.png", map_img)
    print(f"\nMap saved to results/behavior_bridge_test.png")
    print(f"Total frames: {len(ctx.all_poses)}, Keyframes: {len(ctx.keyframe_poses)}")

    env.close()

except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure omnigibson is installed: uv add omnigibson")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
