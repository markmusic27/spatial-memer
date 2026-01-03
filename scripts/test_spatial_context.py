import numpy as np
import random
import sys
sys.path.insert(0, "src")

import cv2
from spatial_context import SpatialContext

def main():
    ctx = SpatialContext()

    # Add 8 frames with different joint configurations
    joint_states = [
        np.array([0.0, -0.5, 0.0, -2.0, 0.0, 1.5, 0.8]),
        np.array([0.2, -0.3, 0.1, -1.8, 0.1, 1.7, 0.6]),
        np.array([-0.1, -0.6, -0.1, -2.2, -0.1, 1.3, 0.9]),
        np.array([0.3, -0.4, 0.2, -1.9, 0.2, 1.6, 0.7]),
        np.array([-0.2, -0.7, -0.2, -2.3, -0.2, 1.2, 1.0]),
        np.array([0.1, -0.2, 0.0, -1.7, 0.0, 1.8, 0.5]),
        np.array([-0.3, -0.8, -0.3, -2.4, -0.3, 1.1, 1.1]),
        np.array([0.4, -0.1, 0.3, -1.6, 0.3, 1.9, 0.4]),
    ]

    frame_ids = []
    for i, joints in enumerate(joint_states):
        fid = ctx.add_frame(joints)
        frame_ids.append(fid)

    # Promote all 8 frames to keyframes
    for fid in frame_ids:
        ctx.promote_to_keyframe(fid)

    img, colors = ctx.generate_map()

    print(colors)

    # Display the map
    cv2.imshow("Spatial Map", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # print(f"\nAll poses: {list(ctx.all_poses.keys())}")
    # print(f"Keyframes: {list(ctx.keyframe_poses.keys())}")

if __name__ == "__main__":
    main()

