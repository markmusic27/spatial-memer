import numpy as np


def quaternion_to_rotation_matrix(qx: float, qy: float, qz: float, qw: float) -> np.ndarray:
    """
    Convert quaternion to 3x3 rotation matrix.
    
    Args:
        qx, qy, qz, qw: Quaternion components (Hamilton convention)
        
    Returns:
        R: 3x3 rotation matrix
    """
    # Normalize quaternion
    norm = np.sqrt(qx*qx + qy*qy + qz*qz + qw*qw)
    qx, qy, qz, qw = qx/norm, qy/norm, qz/norm, qw/norm
    
    # Rotation matrix from quaternion
    R = np.array([
        [1 - 2*(qy*qy + qz*qz), 2*(qx*qy - qz*qw), 2*(qx*qz + qy*qw)],
        [2*(qx*qy + qz*qw), 1 - 2*(qx*qx + qz*qz), 2*(qy*qz - qx*qw)],
        [2*(qx*qz - qy*qw), 2*(qy*qz + qx*qw), 1 - 2*(qx*qx + qy*qy)]
    ])
    
    return R


def pose_from_translation_quaternion(tx: float, ty: float, tz: float,
                                      qx: float, qy: float, qz: float, qw: float) -> np.ndarray:
    """
    Create SE(3) pose matrix from translation and quaternion.
    
    Args:
        tx, ty, tz: Translation components
        qx, qy, qz, qw: Quaternion components (Hamilton convention, scalar-last)
        
    Returns:
        T: 4x4 SE(3) transformation matrix
    """
    T = np.eye(4)
    T[:3, :3] = quaternion_to_rotation_matrix(qx, qy, qz, qw)
    T[:3, 3] = [tx, ty, tz]
    
    return T


def extract_displacement(T: np.ndarray):
    """
    Given a transformation matrix, extract the (x,y,z) points
    """

    if not transform_is_valid(T):
            raise ValueError(f"Transformation {T} is invalid")

    return T[:-1, -1]

def compute_relative_pose(a: np.ndarray, b: np.ndarray):
        """
        Given two poses in the same frame, this algorithm returns the pose of b in the frame of a (aTb)

        Args:
            a: SE(3) matrix wTa
            b: SE(3) matrix wTb
        
        Returns:
            c: SE(3) matrix aTb
        """
        if not transform_is_valid(a):
            raise ValueError(f"Pose {a} is invalid")
        
        if not transform_is_valid(b):
            raise ValueError(f"Pose {b} is invalid")

        a_inv = transform_inverse(a)

        return a_inv @ b

def transform_is_valid(t: np.ndarray, tolerance: float = 1e-3) -> bool:
    """Check if array is a valid transform.

    Args:
        t (numpy.array [4, 4]): Transform candidate.
        tolerance (float, optional): maximum absolute difference
            for two numbers to be considered close enough to each
            other. Defaults to 1e-3.

    Returns:
        bool: True if array is a valid transform else False.

    """
    # check shape
    if t.shape != (4,4):
        return False

    # check all elements are real
    real_check = np.all(np.isreal(t))

    # calc intermediates
    rtr = np.matmul(t[:3, :3].T, t[:3, :3])
    rrt = np.matmul(t[:3, :3], t[:3, :3].T)

    # make rtr and rrt are identity
    inverse_check = np.isclose(np.eye(3), rtr, atol=tolerance).all() and np.isclose(np.eye(3), rrt, atol=tolerance).all()

    # check det
    det_check = np.isclose(np.linalg.det(t[:3, :3]), 1.0, atol=tolerance).all()

    # make sure last row is correct
    last_row_check = np.isclose(t[3, :3], np.zeros((1, 3)), atol=tolerance).all() and np.isclose(t[3, 3], 1.0, atol=tolerance).all()

    return real_check and inverse_check and det_check and last_row_check

def transform_inverse(t: np.ndarray) -> np.ndarray:
    """Find the inverse of the transfom.

    Args:
        t (numpy.array [4, 4]): SE3 transform.

    Raises:
        ValueError: If t is not a valid transform.

    Returns:
        numpy.array [4, 4]: Inverse of the input transform.
    """
    if not transform_is_valid(t):
        raise ValueError("t is not a valid transform")
    
    R = t[:3, :3] # 3x3
    p = t[:3, 3] # 3x1
    
    R_inv = R.T
    p_inv = -R_inv @ p
    
    t_inv = np.identity(4)
    t_inv[:3, :3] = R_inv
    t_inv[:3, 3] = p_inv
     
    
    return t_inv