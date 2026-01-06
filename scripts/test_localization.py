import numpy as np
import sys
import os
import cv2

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from localization import Localization, load_camera_intrinsics


def test_localization():
    """Test robot localization through DPVO."""

    print("=== Testing Localization Class ===")

    # Load camera intrinsics (example for iPhone)
    calib_file = "external/DPVO/calib/iphone.txt"

    if not os.path.exists(calib_file):
        print(f"Calibration file not found: {calib_file}")
        print("Please run ./scripts/setup_dpvo.sh first")
        return

    intrinsics = load_camera_intrinsics(calib_file)
    print(f"Camera intrinsics:\n{intrinsics}")

    # Create camera-to-world transformation
    # For now, use identity (camera frame = world frame)
    camera_to_world = np.eye(4)

    # Initialize localizer
    try:
        localizer = Localization(
            camera_intrinsics=intrinsics,
            camera_to_world=camera_to_world,
            device="cuda:0"  # Use "cpu" if no GPU
        )
        print("Localizer initialized successfully")
    except ImportError as e:
        print(f"Error: {e}")
        return

    # Test with a video file
    video_path = "assets/home_example.mp4"

    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}")
        print("Cannot test without video input")
        return

    cap = cv2.VideoCapture(video_path)
    frame_count = 0

    print("\nProcessing video frames...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Get timestamp (assuming 30 fps)
        timestamp = frame_count / 30.0

        # Update localization
        robot_pose = localizer.update(frame, timestamp)

        if robot_pose is not None:
            # Extract position
            position = robot_pose[:3, 3]
            print(f"Frame {frame_count}: Position = [{position[0]:.3f}, {position[1]:.3f}, {position[2]:.3f}]")
        else:
            print(f"Frame {frame_count}: Initializing...")

        frame_count += 1

        # Limit frames for testing
        if frame_count >= 30:
            break

    cap.release()

    # Get full trajectory
    trajectory = localizer.get_trajectory()
    if trajectory is not None:
        print(f"\nTotal trajectory length: {len(trajectory)} poses")

    print("\n=== Test Complete ===")


if __name__ == "__main__":
    test_localization()

