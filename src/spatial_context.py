import numpy as np

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
        self.keyframe_poses = {}
        self.recent_poses = {}

    def add_keyframe(self, robot_state, pose: np.darray = None):
        """
        Compute and store pose for keyframe.

        Args:
            robot_state: The state of the robot at the keyframe (defined as q_t in MemER paper)
            pose: The pose of the robot arm in world frame (when relocalization is True)
        """
        if pose is None:
            pose = np.eye(4) # default pose is the identity
        else:
            # TODO: implement relocalization function
            pass


    def add_recent_frame(self, robot_state, pose: np.darray = None):
        """
        Compute and store pose for recent frame. Capped at cutoff frames.

        Args:
            robot_state: The state of the robot at the keyframe (defined as q_t in MemER paper)
            pose: The pose of the robot arm in world frame (when relocalization is True)
        """
        if pose is None:
            pose = np.eye(4) # default pose is the identity
        else:
            # TODO: implement relocalization function
            pass

    def generate_map(self):
        """
        Returns the egocentric BEV map for the current state of the robot.
        """
        
        pass
    