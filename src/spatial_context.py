from dataclasses import dataclass
import math
import numpy as np
import cv2

from robot_arm import RobotArm
from transforms import compute_relative_pose, extract_displacement

"""
SpatialContext is the main class that directly interfaces with the MemER high-level policy.
It is responsible for:
    (1) Storing the camera poses for all frames and keyframes
    (2) Generating the egocentric BEV map thats fed to the pi-high policy
"""

@dataclass
class MapConfig:
    """Configuration for BEV map generation."""
    image_size: int = 512
    border_size: int = 4
    outlier_std_threshold: float = 2
    keyframe_radius: int = 16
    robot_radius: int = 18
    circle_border_size: int = 1
    font_scale: float = 0.6


DEFAULT_MAP_CONFIG = MapConfig()


class SpatialContext:
    def __init__(self, relocalization: bool = False, map_config: MapConfig = None):
        self.relocalization = relocalization
        self.map_config = map_config or DEFAULT_MAP_CONFIG
        
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
        cfg = self.map_config
        canvas_size = cfg.image_size - (2 * cfg.border_size)
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
        threshold = mean_dist + self.map_config.outlier_std_threshold * std_dist
        
        # identify outliers
        outlier_ids = {fid for fid, d in distances.items() if d > threshold}
        
        # scale based on inliers
        inlier_distances = [d for fid, d in distances.items() if fid not in outlier_ids]
        max_inlier_dist = max(inlier_distances) if inlier_distances else max(dist_values)
        
        scale = self._compute_scale(max_inlier_dist)
        
        return positions, scale, outlier_ids

    def _get_keyframe_color(self, index: int) -> tuple[int, int, int]:
        """
        Get color for keyframe by index (cycles through 8 colors).
        Colors are OpenCV BGR and lightly whitewashed for readability.
        """

        # Saturated base colors (BGR for OpenCV)
        base_colors = [
            ( 25,  25, 230),  # red
            ( 60, 180,  75),  # green
            (200, 130,   0),  # blue
            ( 48, 130, 245),  # orange
            (180,  30, 145),  # purple
            (240, 240,  70),  # cyan
            (230,  50, 240),  # magenta
            ( 60, 245, 210),  # yellow
        ]

        WHITEWASH = 0.45  # ↓ reduce if you want stronger colors

        b, g, r = base_colors[index % len(base_colors)]

        return (
            int(b + (255 - b) * WHITEWASH),
            int(g + (255 - g) * WHITEWASH),
            int(r + (255 - r) * WHITEWASH),
        )


    def _resolve_overlap(self, px: int, py: int, placed: list[tuple[int, int, int]], radius: int = 10) -> tuple[int, int]:
        """
        Resolve overlap by finding a nearby free position.
        
        Args:
            px, py: Initial position
            placed: List of (x, y, radius) for already placed circles
            radius: Radius of circle to place
            
        Returns:
            (px, py): Adjusted position that doesn't overlap
        """
        def has_collision(x: int, y: int) -> bool:
            for ox, oy, oradius in placed:
                dist = math.sqrt((x - ox)**2 + (y - oy)**2)
                min_dist = radius + oradius  # touching (no gap)
                if dist < min_dist:
                    return True
            return False
        
        if not has_collision(px, py):
            return px, py
        
        # Spiral outward to find free position
        step = radius
        for ring in range(1, 10):  # Try up to 10 rings out
            dist = ring * step
            num_points = max(8, ring * 8)  # More points for larger rings
            for i in range(num_points):
                angle = (2 * math.pi * i) / num_points
                nx = px + int(dist * math.cos(angle))
                ny = py + int(dist * math.sin(angle))
                if not has_collision(nx, ny):
                    return nx, ny
        
        # Fallback: just offset to the right
        return px + radius * 3, py

    def generate_map(self) -> np.ndarray:
        """
        Generate egocentric BEV map showing current position and keyframes.
        
        Returns:
            RGB image (H, W, 3) uint8
        """
        cfg = self.map_config
        current_pose = self.get_current_pose()
        positions, scale, outlier_ids = self._compute_map_layout(current_pose)
        
        # Create white canvas
        image = np.full((cfg.image_size, cfg.image_size, 3), 255, dtype=np.uint8)
        
        center = cfg.image_size // 2
        
        # track placed circles: (x, y, radius)
        placed_circles: list[tuple[int, int, int]] = [(center, center, cfg.robot_radius)]
        
        # draw keyframes
        keyframe_ids = list(self.keyframe_poses.keys())

        # track colors that were used for each keyframe
        colors: dict[int, tuple[int, int, int]] = {}
        
        for i, frame_id in enumerate(keyframe_ids):
            color = self._get_keyframe_color(i)
            colors[frame_id] = color
            x, y = positions[frame_id]
            
            px = center + int(x * scale)
            py = center - int(y * scale)
            
            # clamp to border edge
            px = int(np.clip(px, cfg.border_size + cfg.keyframe_radius, cfg.image_size - cfg.border_size - cfg.keyframe_radius))
            py = int(np.clip(py, cfg.border_size + cfg.keyframe_radius, cfg.image_size - cfg.border_size - cfg.keyframe_radius))
            
            # resolve overlaps with robot and other keyframes
            px, py = self._resolve_overlap(px, py, placed_circles, cfg.keyframe_radius)
            
            # clamp again after adjustment
            px = int(np.clip(px, cfg.border_size + cfg.keyframe_radius, cfg.image_size - cfg.border_size - cfg.keyframe_radius))
            py = int(np.clip(py, cfg.border_size + cfg.keyframe_radius, cfg.image_size - cfg.border_size - cfg.keyframe_radius))
            
            # add to placed circles
            placed_circles.append((px, py, cfg.keyframe_radius))
            
            # draw marker (square)
            half = cfg.keyframe_radius
            top_left = (px - half, py - half)
            bottom_right = (px + half, py + half)
            cv2.rectangle(image, top_left, bottom_right, color, -1)
            cv2.rectangle(image, top_left, bottom_right, (0, 0, 0), cfg.circle_border_size)
            
            # draw label
            label = str(i + 1)
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, cfg.font_scale, 1)[0]
            text_x = px - text_size[0] // 2
            text_y = py + text_size[1] // 2
            cv2.putText(image, label, (text_x-1, text_y - 1),
                        cv2.FONT_HERSHEY_SIMPLEX, cfg.font_scale, (0, 0, 0), 1, cv2.LINE_AA)
            cv2.putText(image, label, (text_x, text_y - 1),
                        cv2.FONT_HERSHEY_SIMPLEX, cfg.font_scale, (0, 0, 0), 1, cv2.LINE_AA)
        
        # draw robot at center
        cv2.circle(image, (center, center), cfg.robot_radius, (180, 180, 180), -1)
        cv2.circle(image, (center, center), cfg.robot_radius, (100, 100, 100), cfg.circle_border_size)
        cv2.arrowedLine(image, (center, center + 3), (center, center - 30),
                        (0, 0, 0), 2, tipLength=0.3)
        
        return image, colors


    





