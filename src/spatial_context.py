from dataclasses import dataclass
import math
import numpy as np

from robot_arm import RobotArm
from transforms import compute_relative_pose, extract_displacement

"""
SpatialContext is the main class that directly interfaces with the MemER high-level policy.
It is responsible for:
    (1) Storing the camera poses for all frames and keyframes
    (2) Generating the egocentric BEV map thats fed to the pi-high policy
"""

class SpatialContext:
    def __init__(self, relocalization=False, image_size: int = 256, border_size: int = 8, outlier_std_threshold: int = 5):
        self.relocalization = relocalization
        self.image_size = image_size
        self.border_size = border_size
        self.outlier_std_threshold = outlier_std_threshold
        
        # maps frame_id to SE(3) pose
        self.keyframe_poses: dict[int, np.ndarray] = {}
        self.all_poses: dict[int, np.ndarray] = {}

        # track current frame for id assignment
        self._frame_count = 0

        # initialize utils for pose
        self.robot_arm = RobotArm()

    def _compute_pose(self, robot_state, robot_pose: np.ndarray = None) -> np.ndarray:
        """Compute world-frame camera pose from robot state."""
        if robot_pose is None:
            robot_pose = np.eye(4)

        ee_pose_robot_frame = self.robot_arm.forward_kinematics(robot_state)
        ee_pose_world_frame = robot_pose @ ee_pose_robot_frame

        return ee_pose_world_frame

    def add_frame(self, robot_state, robot_pose: np.ndarray = None) -> int:
        """
        Compute and store pose for a frame.
        
        Args:
            robot_state: Joint angles (7-DOF)
            robot_pose: Optional robot base pose from SLAM
            
        Returns:
            frame_id: The ID assigned to this frame
        """
        frame_id = self._frame_count
        self._frame_count += 1

        pose = self._compute_pose(robot_state, robot_pose)
        self.all_poses[frame_id] = pose

        return frame_id

    def promote_to_keyframe(self, frame_id: int):
        """Promote a frame to keyframe status."""
        if frame_id not in self.all_poses:
            raise ValueError(f"Frame {frame_id} not found")
        self.keyframe_poses[frame_id] = self.all_poses[frame_id]

    def remove_keyframe(self, frame_id: int):
        """Remove a keyframe."""
        self.keyframe_poses.pop(frame_id, None)

    def get_current_pose(self) -> np.ndarray:
        """Get the most recent pose (current robot position)."""
        if not self.all_poses:
            return np.eye(4)
        latest_id = max(self.all_poses.keys())
        return self.all_poses[latest_id]


    # def generate_watermarked_keyframes(): # TODO: Implement this later
    #     pass

    def _compute_scale(self, max_dist: float, margin: int = 10) -> float:
        """
        Compute pixels per meter so max_dist fits within canvas.
        
        Args:
            max_dist: Maximum distance to fit (meters)
            margin: Pixels to leave at edge of canvas
        
        Returns:
            scale: pixels per meter
        """
        canvas_size = self.image_size - (2 * self.border_size)
        usable_radius = (canvas_size / 2) - margin
        
        if max_dist < 1e-6:
            return 50.0  # Default scale when all points at origin
        
        return usable_radius / max_dist

    def _compute_map_layout(self, current_pose: np.ndarray) -> tuple[dict, float, set]:
        """
        Compute relative XY positions and determine scale + outliers.
        
        Returns:
            positions: dict[frame_id, (x, y)] for keyframes
            scale: pixels per meter
            outlier_ids: set of frame_ids that are outliers
        """
        positions = {}
        
        for frame_id, pose in self.keyframe_poses.items():
            rel_pose = compute_relative_pose(current_pose, pose)
            x, y = extract_displacement(rel_pose)[:-1]
            positions[frame_id] = (x, y)
        
        if len(positions) == 0:
            return {}, 50.0, set()
        
        # compute distances
        distances = {fid: np.sqrt(x**2 + y**2) for fid, (x, y) in positions.items()}
        dist_values = list(distances.values())
        
        MIN_SAMPLES_FOR_OUTLIER = 5
        
        if len(dist_values) < MIN_SAMPLES_FOR_OUTLIER:
            max_dist = max(dist_values) if dist_values else 1.0
            scale = self._compute_scale(max_dist)
            return positions, scale, set()
        
        # compute statistics
        mean_dist = np.mean(dist_values)
        std_dist = np.std(dist_values)
        
        if std_dist < 1e-6:
            scale = self._compute_scale(max(dist_values))
            return positions, scale, set()
        
        # threshold for outliers
        threshold = mean_dist + self.outlier_std_threshold * std_dist
        
        # identify outliers
        outlier_ids = {fid for fid, d in distances.items() if d > threshold}
        
        # scale based on inliers
        inlier_distances = [d for fid, d in distances.items() if fid not in outlier_ids]
        max_inlier_dist = max(inlier_distances) if inlier_distances else max(dist_values)
        
        scale = self._compute_scale(max_inlier_dist)
        
        return positions, scale, outlier_ids

    def _generate_colors(self, n: int) -> list[tuple[int, int, int]]:
        """Generate N distinct colors using HSV color space."""
        import cv2
        
        if n == 0:
            return []
        
        colors = []
        for i in range(n):
            hue = int(180 * i / n)  # opencv hue range is 0-180
            hsv = np.uint8([[[hue, 200, 230]]])
            rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0]
            colors.append(tuple(map(int, rgb)))
        
        return colors

    def generate_map(self) -> np.ndarray:
        """
        Generate egocentric BEV map showing current position and keyframes.
        
        Returns:
            RGB image (H, W, 3) uint8
        """
        import cv2

        current_pose = self.get_current_pose()
        positions, scale, outlier_ids = self._compute_map_layout(current_pose)

        canvas_size = self.image_size - 2 * self.border_size
        canvas = np.full((canvas_size, canvas_size, 3), 255, dtype=np.uint8)
        center = canvas_size // 2

        # generate colors
        keyframe_ids = list(self.keyframe_poses.keys())
        colors = self._generate_colors(len(keyframe_ids))

        print(colors)

    





