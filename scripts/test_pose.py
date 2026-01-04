#!/usr/bin/env python3
"""
Test script for Franka FR3 forward kinematics.
"""

import numpy as np
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from robot_arm import RobotArm

def test_forward_kinematics():
    """Test forward kinematics with various joint configurations."""
    
    arm = RobotArm()
    
    # Test 1: Zero configuration (all joints at 0)
    print("Test 1: Zero configuration (all joints at 0)")
    print("=" * 60)
    joint_angles = np.zeros(7)
    transform = arm.forward_kinematics(joint_angles)
    print(f"Joint angles: {joint_angles}")
    print(f"End-effector position: {transform[:3, 3]}")
    print(f"Transformation matrix:\n{transform}\n")
    
    # Test 2: Non-zero configuration (example joint angles)
    print("Test 2: Non-zero configuration")
    print("=" * 60)
    joint_angles = np.array([0.5, -0.3, 0.7, -1.2, 0.4, 1.0, -0.6])
    transform = arm.forward_kinematics(joint_angles)
    print(f"Joint angles: {joint_angles}")
    print(f"End-effector position: {transform[:3, 3]}")
    print(f"Transformation matrix:\n{transform}\n")
    
    # Test 3: Validate transformation matrix properties (SE(3) constraints)
    print("Test 3: Validate SE(3) transformation matrix properties")
    print("=" * 60)
    joint_angles = np.array([0.2, -0.5, 0.8, -0.9, 0.3, 0.6, -0.4])
    transform = arm.forward_kinematics(joint_angles)
    
    R = transform[:3, :3]  # Rotation matrix
    t = transform[:3, 3]   # Translation vector
    
    # Check rotation matrix is orthogonal (R @ R.T should be identity)
    RRT = R @ R.T
    identity_error = np.linalg.norm(RRT - np.eye(3))
    print(f"Rotation matrix orthogonality error: {identity_error:.2e}")
    assert identity_error < 1e-10, "Rotation matrix should be orthogonal"
    
    # Check determinant is +1 (proper rotation)
    det_R = np.linalg.det(R)
    print(f"Determinant of rotation matrix: {det_R:.6f}")
    assert abs(det_R - 1.0) < 1e-10, "Rotation matrix determinant should be +1"
    
    # Check bottom row is [0, 0, 0, 1]
    bottom_row = transform[3, :]
    expected_bottom = np.array([0, 0, 0, 1])
    bottom_error = np.linalg.norm(bottom_row - expected_bottom)
    print(f"Bottom row error: {bottom_error:.2e}")
    assert bottom_error < 1e-10, "Bottom row should be [0, 0, 0, 1]"
    
    print(f"End-effector position: {t}")
    print(f"All SE(3) constraints satisfied! ✓\n")

if __name__ == "__main__":
    test_forward_kinematics()

