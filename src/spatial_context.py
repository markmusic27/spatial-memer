import numpy as np

from pose import PoseUtils

"""
SpatialContext is the main class that directly interfaces with the MemER high-level policy.
It is responsible for:
    (1) Storing the camera poses for all frames and keyframes
    (2) Generating the egocentric BEV map thats fed to the pi-high policy
"""

class SpatialContext:
    def __init__(self, relocalization=False):
        self.relocalization = relocalization
        
        # maps frame_id to SE(3) pose
        self.keyframe_poses: dict[int, np.ndarray] = {}
        self.all_poses: dict[int, np.ndarray] = {}

        # track current frame for id assignment
        self._frame_count = 0

        # initialize utils for pose
        self.pose_utils = PoseUtils()

    def _compute_pose(self, robot_state, robot_pose: np.ndarray = None) -> np.ndarray:
        """Compute world-frame camera pose from robot state."""
        if robot_pose is None:
            robot_pose = np.eye(4)

        ee_pose_robot_frame = self.pose_utils.forward_kinematics(robot_state)
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

    def get_recent_poses(self, n: int) -> list[tuple[int, np.ndarray]]:
        """Get the last N poses."""
        recent_ids = sorted(self.all_poses.keys())[-n:]
        return [(fid, self.all_poses[fid]) for fid in recent_ids]

    def generate_map(self) -> np.ndarray:
        """
        Generate egocentric BEV map.

        Returns:
            RGB image (H, W, 3) uint8
        """
        pass