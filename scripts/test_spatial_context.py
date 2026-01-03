import numpy as np
import random
import sys
sys.path.insert(0, "src")

from spatial_context import SpatialContext

def main():
    ctx = SpatialContext()

    # Add three frames with different joint configurations
    joint_states = [
        np.array([0.0, -0.5, 0.0, -2.0, 0.0, 1.5, 0.8]),
        np.array([0.2, -0.3, 0.1, -1.8, 0.1, 1.7, 0.6]),
        np.array([-0.1, -0.6, -0.1, -2.2, -0.1, 1.3, 0.9]),
    ]

    frame_ids = []
    for i, joints in enumerate(joint_states):
        fid = ctx.add_frame(joints)
        frame_ids.append(fid)
        # print(f"Added frame {fid}")

    # Promote two random frames to keyframes
    promoted = random.sample(frame_ids, 2)
    for fid in promoted:
        ctx.promote_to_keyframe(fid)
        # print(f"Promoted frame {fid} to keyframe")

    img = ctx.generate_map()


    # print(f"\nAll poses: {list(ctx.all_poses.keys())}")
    # print(f"Keyframes: {list(ctx.keyframe_poses.keys())}")

if __name__ == "__main__":
    main()

