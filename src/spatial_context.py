import numpy as np

from pose import PoseUtils

"""
SpatialContext is the main class that directly interfaces with the MemER high-level policy.
It is responsible for:
    (1) Storing the camera poses for the recent frames and the keyframes
    (2) Generating the egocentric BEV map thats fed to the pi-high policy
"""

class SpatialContext:
    def __init__(self, relocalization=False, cutoff=20):
        self.relocalization = relocalization
        self.cutoff = cutoff
        
        # maps frame_id to SE(3) pose 
        self.keyframe_poses: dict[int, np.ndarray] = {}

        # stores poses as ordered list of (frame_id, pose) tuple
        # maintains temporal order capped at cutoff
        self.recent_poses: list[tuple[int, np.ndarray]] = []

        # track current frame for id assignment
        self._frame_count = 0

        # initialize utils for pose
        self.pose_utils = PoseUtils()

    def _compute_pose(self, robot_state, robot_pose: np.ndarray = None):
        """Compute world-frame camera pose from robot state"""
        # if not passed, the relocalization is assumed off
        if robot_pose is None:
            robot_pose = np.eye(4) # default pose is the identity

        ee_pose_robot_frame = self.pose_utils.forward_kinematics(robot_state) #  (bTc)
        ee_pose_world_frame = robot_pose @ ee_pose_robot_frame # (wTc) from (wTb) @ (bTc)

        return ee_pose_world_frame

    def add_keyframe(self, frame_id: int, robot_state, robot_pose: np.ndarray = None):
        """
        Compute and store pose for keyframe.

        Args:
            robot_state: Joint angles of the robot arm (7-DOF), defined as q_t in MemER paper.
            robot_pose: SE(3) transform of robot base in world frame (wTb). Obtained from 
                DROID-SLAM via an exocentric camera when relocalization is enabled.
                If None, assumes robot base is at world origin.
        """

        pose = self._compute_pose(robot_state, robot_pose)
        self.keyframe_poses[frame_id] = pose

    def add_recent_frame(self, robot_state, robot_pose: np.ndarray = None):
        """
        Store pose for a recent frame. Returns the assigned frame ID.
        
        Args:
            robot_state: Joint angles (7-DOF)
            robot_pose: Optional robot base pose from SLAM
            
        Returns:
            frame_id: The ID assigned to this frame
        """

        frame_id = self._frame_counter
        self._frame_counter += 1

        pose = self._compute_pose(robot_state, robot_pose)
        self.recent_poses.appent((frame_id, pose))

        # enforce cutoff
        if len(self.recent_poses) > self.cutoff:
            self.recent_poses.pop(0)

        return frame_id

    def remove_keyframe(self, frame_id: int):
        """Remove a keyframe (once implemented in MemER...)"""
        self.keyframe_poses.pop(frame_id, None)

    def get_current_pose(self):
        """Get the most recent pose (current robot position)."""

        if self.recent_poses:
            return self.recent_poses[-1][1]

        return np.eye(4)

 
    def generate_map(self):
        """
        Returns the egocentric BEV map for the current state of the robot.
        """
        
        pass
    