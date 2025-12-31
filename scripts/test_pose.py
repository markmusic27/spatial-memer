#!/usr/bin/env python3
"""
Test script for Franka FR3 forward kinematics.
"""

import numpy as np
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pose import PoseUtils

def test_forward_kinematics():
    """Test forward kinematics with various joint configurations."""
    
    pose_utils = PoseUtils()
    
    # Test 1: Zero configuration (all joints at 0)
    print("Test 1: Zero configuration (all joints at 0)")
    joint_angles = np.zeros(7)
    transform = pose_utils.forward_kinematics(joint_angles)

if __name__ == "__main__":
    test_forward_kinematics()

