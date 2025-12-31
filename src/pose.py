import mujoco
import numpy as np

FR3_DEFINITION_PATH = "fr3v2/fr3v2.xml"

class PoseUtils:
    def __init__(self):
        self.model = mujoco.MjModel.from_xml_path(str(FR3_DEFINITION_PATH))
        self.data = mujoco.MjData(self.model)

    def forward_kinematics(self, robot_state):
        print("hello world")


