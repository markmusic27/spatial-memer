"""
Localization module for camera pose estimation using DPVO.

This module provides real-time camera localization for robot spatial awareness.
It runs at a high frame rate (e.g., 30 Hz) to provide continuous pose estimates
that are consumed by the high-level policy at a lower rate (e.g., 1 Hz).

Coordinate Frames:
-----------------
1. Camera Frame: DPVO operates in camera coordinates
   - Origin: Camera optical center
   - Z-axis: Points along camera viewing direction
   - Pose output: Where camera is in world

2. World Frame: Global reference frame
   - Origin: Typically at robot base or fixed point in environment
   - Used by SpatialContext for map generation

3. Robot Frame: Robot base coordinate system
   - Used by RobotArm for forward kinematics
   - See robot_arm.py for details

Transformation Chain:
--------------------
camera_pose (from DPVO) @ camera_to_world = world_pose (for SpatialContext)

The world_pose is then used in SpatialContext:
world_pose @ ee_pose_robot_frame = final camera pose in world

Usage:
------
    # Initialize
    localizer = Localization(
        camera_intrinsics=K,
        camera_to_world=T_cam_to_world
    )

    # In high-rate loop (30 Hz)
    robot_pose = localizer.update(rgb_frame, timestamp)

    # In low-rate loop (1 Hz)
    if robot_pose is not None:
        frame_id = spatial_context.add_frame(robot_state, robot_pose)
"""

import numpy as np
import torch
from typing import Optional
from pathlib import Path

try:
    from dpvo.dpvo import DPVO
except ImportError:
    DPVO = None


def load_camera_intrinsics(calib_file: str) -> np.ndarray:
    """
    Load camera intrinsics from a calibration file.

    Supports formats like DPVO's calib files: fx fy cx cy

    Args:
        calib_file: Path to calibration file

    Returns:
        3x3 intrinsic matrix K = [[fx, 0, cx], [0, fy, cy], [0, 0, 1]]
    """
    calib_path = Path(calib_file)

    if not calib_path.exists():
        raise FileNotFoundError(f"Calibration file not found: {calib_file}")

    with open(calib_path, 'r') as f:
        line = f.readline().strip()
        values = [float(x) for x in line.split()]

    if len(values) != 4:
        raise ValueError(f"Expected 4 values (fx fy cx cy), got {len(values)}")

    fx, fy, cx, cy = values

    K = np.array([
        [fx,  0, cx],
        [ 0, fy, cy],
        [ 0,  0,  1]
    ], dtype=np.float32)

    return K


class Localization:
    """
    Wraps around DPVO API (https://github.com/princeton-vl/DPVO) to predict robot pose.

    Also exposes methods to modify DPVO to handle robot arm occlusions.
    """
    def __init__(
        self,
        camera_intrinsics: np.ndarray,
        camera_to_world: Optional[np.ndarray] = None,
        weights_path: str = "external/DPVO/dpvo.pth",
        device: str = "cuda:0"
    ):
        """
        Initialize the localization system.

        Args:
            camera_intrinsics: 3x3 camera intrinsic matrix [fx, fy, cx, cy]
            camera_to_world: Optional 4x4 SE(3) transformation from camera to world frame.
                           If None, uses identity (camera frame = world frame)
            weights_path: Path to DPVO model weights
            device: Device to run DPVO on (cuda:0, cpu, etc.)
        """
        if DPVO is None:
            raise ImportError(
                "DPVO not found. Please install it using scripts/setup_dpvo.sh"
            )

        self.intrinsics = camera_intrinsics
        self.camera_to_world = camera_to_world if camera_to_world is not None else np.eye(4)
        self.device = device

        # Initialize DPVO
        self.dpvo = DPVO(weights=weights_path, device=device)

        # Track initialization state
        self.is_initialized = False
        self.frame_count = 0

        # Minimum frames needed for DPVO to initialize
        self.min_init_frames = 5

    def update(self, rgb: np.ndarray, timestamp: float) -> Optional[np.ndarray]:
        """
        Process a new frame and return the camera pose.

        This method runs at a faster refresh rate than the high-level policy.

        Args:
            rgb: RGB image (H, W, 3) uint8
            timestamp: Frame timestamp in seconds

        Returns:
            robot_pose: 4x4 SE(3) transformation matrix in world coordinates,
                       or None if DPVO is still initializing
        """
        # Convert to torch tensor and prepare for DPVO
        # DPVO expects CHW format, normalized to [0, 1]
        if isinstance(rgb, np.ndarray):
            rgb_tensor = torch.from_numpy(rgb).permute(2, 0, 1).float() / 255.0
            rgb_tensor = rgb_tensor.to(self.device)
        else:
            rgb_tensor = rgb

        # Add batch dimension
        rgb_tensor = rgb_tensor.unsqueeze(0)

        # Create intrinsics tensor
        intrinsics_tensor = torch.from_numpy(self.intrinsics).float().to(self.device)
        intrinsics_tensor = intrinsics_tensor.unsqueeze(0)

        # Process frame through DPVO
        with torch.no_grad():
            self.dpvo(timestamp, rgb_tensor, intrinsics_tensor)

        self.frame_count += 1

        # Check if initialized
        if not self.is_initialized:
            if self.frame_count >= self.min_init_frames:
                self.is_initialized = True
            else:
                return None

        # Get current pose from DPVO (in camera coordinate frame)
        # DPVO returns poses as a list of 4x4 matrices
        poses = self.dpvo.get_poses()

        if poses is None or len(poses) == 0:
            return None

        # Get the most recent pose (last in the list)
        camera_pose = poses[-1]

        # Convert from torch to numpy if needed
        if isinstance(camera_pose, torch.Tensor):
            camera_pose = camera_pose.cpu().numpy()

        # Transform from camera coordinates to world coordinates
        # robot_pose = camera_to_world @ camera_pose
        world_pose = self.camera_to_world @ camera_pose

        return world_pose

    def reset(self):
        """Reset the localization system."""
        self.dpvo = DPVO(weights=self.dpvo.weights, device=self.device)
        self.is_initialized = False
        self.frame_count = 0

    def get_trajectory(self) -> Optional[np.ndarray]:
        """
        Get the full trajectory of camera poses.

        Returns:
            trajectory: Nx4x4 array of SE(3) poses in world coordinates,
                       or None if not initialized
        """
        if not self.is_initialized:
            return None

        poses = self.dpvo.get_poses()

        if poses is None:
            return None

        # Convert to numpy and transform to world frame
        if isinstance(poses, torch.Tensor):
            poses = poses.cpu().numpy()
        elif isinstance(poses, list):
            poses = np.array([p.cpu().numpy() if isinstance(p, torch.Tensor) else p
                            for p in poses])

        # Transform all poses to world frame
        world_poses = np.array([self.camera_to_world @ p for p in poses])

        return world_poses

    @staticmethod
    def create_camera_to_world_transform(
        translation: np.ndarray = None,
        rotation: np.ndarray = None
    ) -> np.ndarray:
        """
        Create a camera-to-world transformation matrix.

        Useful when the camera is mounted at a fixed position on the robot base.

        Args:
            translation: 3D translation vector [x, y, z] (meters)
            rotation: 3x3 rotation matrix, or None for identity rotation

        Returns:
            4x4 SE(3) transformation matrix

        Example:
            >>> # Camera is 0.1m above robot base, facing forward
            >>> T = Localization.create_camera_to_world_transform(
            ...     translation=np.array([0, 0, 0.1]),
            ...     rotation=np.eye(3)
            ... )
        """
        T = np.eye(4)

        if translation is not None:
            if len(translation) != 3:
                raise ValueError("Translation must be a 3D vector")
            T[:3, 3] = translation

        if rotation is not None:
            if rotation.shape != (3, 3):
                raise ValueError("Rotation must be a 3x3 matrix")
            T[:3, :3] = rotation

        return T