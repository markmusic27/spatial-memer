import mujoco
import numpy as np

FR3_DEFINITION_PATH = "fr3v2/fr3v2.xml"

class PoseUtils:
    def __init__(self):
        self.model = mujoco.MjModel.from_xml_path(str(FR3_DEFINITION_PATH))
        self.data = mujoco.MjData(self.model)

    def forward_kinematics(self, robot_state: np.ndarray):
        if robot_state.shape != (7,):
            raise ValueError(f"robot_state must have shape (7,), but got {robot_state.shape}")

        # get which qpos corresponds to which joint
        hinge_qpos_addrs = []
        hinge_names = []
        for j in range(self.model.njnt):
            if self.model.jnt_type[j] == mujoco.mjtJoint.mjJNT_HINGE:
                hinge_qpos_addrs.append(self.model.jnt_qposadr[j])
                hinge_names.append(mujoco.mj_id2name(self.model, mujoco.mjtObj.mjOBJ_JOINT, j))

        if len(hinge_qpos_addrs) < 7:
            raise RuntimeError(f"Expected >=7 hinge joints, found {len(hinge_qpos_addrs)}")
        
        # set robot state values to the model
        for i in range(7):
            self.data.qpos[hinge_qpos_addrs[i]] = robot_state[i]

        # run forward kinematics
        mujoco.mj_forward(self.model, self.data)



