"""
Example showing how to use Localization with SpatialContext.

This demonstrates the full pipeline:
1. Localization provides robot_pose at high frame rate
2. SpatialContext uses robot_pose to track camera positions
3. Map generation and keyframe management
"""

import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from localization import Localization, load_camera_intrinsics
from spatial_context import SpatialContext


def example_integration():
    """
    Example of how Localization integrates with the high-level policy.

    The workflow is:
    1. Localization runs at high frame rate (e.g., 30 Hz) from camera
    2. High-level policy runs at lower rate (e.g., 1 Hz)
    3. Each HLP iteration uses the latest robot_pose from Localization
    """

    # Initialize localization
    intrinsics = load_camera_intrinsics("external/DPVO/calib/iphone.txt")

    # Camera is at the base of the robot arm
    # If you need a specific transformation, define it here
    camera_to_world = np.eye(4)

    localizer = Localization(
        camera_intrinsics=intrinsics, camera_to_world=camera_to_world, device="cuda:0"
    )

    # Initialize spatial context
    spatial_context = SpatialContext()

    # Simulated main loop
    # In practice, this would be your robot control loop

    hlp_rate = 1.0  # Hz (high-level policy rate)
    camera_rate = 30.0  # Hz (camera frame rate)

    hlp_interval = int(camera_rate / hlp_rate)  # Run HLP every N frames

    # Get frames from camera (simulated here)
    for frame_idx in range(100):
        # Get RGB frame from camera
        rgb_frame = get_camera_frame()  # Your camera API
        timestamp = frame_idx / camera_rate

        # Update localization at camera rate (30 Hz)
        robot_pose = localizer.update(rgb_frame, timestamp)

        if robot_pose is None:
            # Still initializing
            continue

        # Run high-level policy at lower rate (1 Hz)
        if frame_idx % hlp_interval == 0:
            # Get robot state (joint angles)
            robot_state = get_robot_state()  # Your robot API

            # Add frame to spatial context with latest robot_pose
            frame_id = spatial_context.add_frame(robot_state, robot_pose)

            # Generate map for visualization
            map_image, colors = spatial_context.generate_map()

            # VLM processing would happen here
            # selected_keyframes = vlm.process(map_image, keyframes)

            # Promote frames to keyframes based on VLM output
            # spatial_context.promote_to_keyframe(selected_id)

            print(f"HLP iteration at frame {frame_idx}")
            print(f"  Robot pose:\n{robot_pose}")
            print(f"  Frame ID: {frame_id}")


def get_camera_frame():
    """Placeholder for camera API."""
    # In practice, this would be:
    # rgb, depth = zed_camera.get_frame()
    # return rgb
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


def get_robot_state():
    """Placeholder for robot state API."""
    # In practice, this would be:
    # return robot.get_joint_angles()
    return np.zeros(7)  # 7-DOF robot arm, as we specified in our call


if __name__ == "__main__":
    print(__doc__)
    # example_integration()  # Uncomment to run
