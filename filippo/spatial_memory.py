# spatial_memory.py
"""
Spatial Memory Module - MVP for MemER Integration
Clean, minimal implementation for testing spatial context with visual keyframes.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import time


@dataclass
class SpatialKeyframe:
    """A keyframe with spatial metadata"""

    timestamp: float
    image: np.ndarray  # Or path to image
    pose: Tuple[float, float, float]  # (x, y, theta)
    room_id: int
    embedding: Optional[np.ndarray] = None  # CLIP embedding if available


class SpatialMemoryModule:
    """
    Lightweight spatial memory that tracks where keyframes were captured.

    Usage:
        spatial_mem = SpatialMemoryModule(room_threshold=2.0)

        # Every frame
        spatial_mem.update(image, pose)

        # When MemER selects a keyframe
        spatial_mem.add_keyframe(image, pose)

        # Retrieve with spatial awareness
        nearby = spatial_mem.get_nearby_keyframes(current_pose, radius=3.0)
    """

    def __init__(self, room_threshold: float = 2.0):
        """
        Args:
            room_threshold: Distance (meters) to consider same room
        """
        self.keyframes: List[SpatialKeyframe] = []
        self.pose_history: Dict[float, Tuple[float, float, float]] = {}
        self.room_threshold = room_threshold
        self.room_counter = 0
        self.room_centers: Dict[int, Tuple[float, float]] = {}

    def update(self, image: np.ndarray, pose: Tuple[float, float, float]):
        """Update pose history (call every frame)"""
        timestamp = time.time()
        self.pose_history[timestamp] = pose

    def add_keyframe(
        self,
        image: np.ndarray,
        pose: Tuple[float, float, float],
        embedding: Optional[np.ndarray] = None,
    ) -> SpatialKeyframe:
        """
        Add a keyframe with spatial context.
        Returns the created SpatialKeyframe.
        """
        timestamp = time.time()
        room_id = self._get_or_create_room(pose)

        kf = SpatialKeyframe(
            timestamp=timestamp,
            image=image,
            pose=pose,
            room_id=room_id,
            embedding=embedding,
        )

        self.keyframes.append(kf)
        return kf

    def get_nearby_keyframes(
        self, query_pose: Tuple[float, float, float], radius: float = 3.0
    ) -> List[SpatialKeyframe]:
        """Get keyframes within spatial radius of query pose"""
        nearby = []
        qx, qy, _ = query_pose

        for kf in self.keyframes:
            kx, ky, _ = kf.pose
            dist = np.sqrt((qx - kx) ** 2 + (qy - qy) ** 2)

            if dist <= radius:
                nearby.append(kf)

        return nearby

    def get_keyframes_in_room(self, room_id: int) -> List[SpatialKeyframe]:
        """Get all keyframes from a specific room"""
        return [kf for kf in self.keyframes if kf.room_id == room_id]

    def get_unvisited_rooms(
        self, current_pose: Tuple[float, float, float]
    ) -> List[int]:
        """Get room IDs that haven't been visited (no keyframes)"""
        visited_rooms = set(kf.room_id for kf in self.keyframes)
        all_rooms = set(self.room_centers.keys())

        # Add current room if new
        current_room = self._get_or_create_room(current_pose)
        all_rooms.add(current_room)

        return list(all_rooms - visited_rooms)

    def has_visited_location(
        self, query_pose: Tuple[float, float, float], threshold: float = 1.0
    ) -> bool:
        """Check if we've already captured a keyframe near this location"""
        nearby = self.get_nearby_keyframes(query_pose, radius=threshold)
        return len(nearby) > 0

    def get_spatial_coverage(self) -> Dict[str, float]:
        """Get metrics about spatial coverage"""
        if not self.keyframes:
            return {"num_keyframes": 0, "num_rooms": 0, "avg_keyframes_per_room": 0.0}

        rooms = defaultdict(int)
        for kf in self.keyframes:
            rooms[kf.room_id] += 1

        return {
            "num_keyframes": len(self.keyframes),
            "num_rooms": len(rooms),
            "avg_keyframes_per_room": np.mean(list(rooms.values())),
        }

    def _get_or_create_room(self, pose: Tuple[float, float, float]) -> int:
        """
        Assign room ID based on spatial clustering.
        Simple approach: if pose is far from all existing room centers, create new room.
        """
        x, y, _ = pose

        # Check if close to existing room
        for room_id, (cx, cy) in self.room_centers.items():
            dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if dist < self.room_threshold:
                return room_id

        # Create new room
        new_room_id = self.room_counter
        self.room_centers[new_room_id] = (x, y)
        self.room_counter += 1

        return new_room_id

    def visualize_memory(self) -> str:
        """Simple text visualization of spatial memory state"""
        if not self.keyframes:
            return "No keyframes stored."

        output = [
            f"Spatial Memory: {len(self.keyframes)} keyframes across {len(self.room_centers)} rooms\n"
        ]

        # Group by room
        by_room = defaultdict(list)
        for kf in self.keyframes:
            by_room[kf.room_id].append(kf)

        for room_id, kfs in sorted(by_room.items()):
            cx, cy = self.room_centers[room_id]
            output.append(
                f"  Room {room_id} (center: {cx:.1f}, {cy:.1f}): {len(kfs)} keyframes"
            )

        return "\n".join(output)


# ============================================================================
# SIMPLE TEST
# ============================================================================


def test_spatial_memory():
    """Quick test to verify everything works"""

    spatial_mem = SpatialMemoryModule(room_threshold=2.0)

    # Simulate robot moving through 3 rooms and taking keyframes
    print("Simulating robot movement...\n")

    # Room 1: Take 2 keyframes
    print("Room 1:")
    spatial_mem.add_keyframe(image=np.zeros((224, 224, 3)), pose=(0.0, 0.0, 0.0))
    print("  Added keyframe at (0.0, 0.0)")

    spatial_mem.add_keyframe(image=np.zeros((224, 224, 3)), pose=(0.5, 0.5, 0.3))
    print("  Added keyframe at (0.5, 0.5)")

    # Room 2: Take 1 keyframe
    print("\nRoom 2:")
    spatial_mem.add_keyframe(image=np.zeros((224, 224, 3)), pose=(5.0, 0.0, 1.57))
    print("  Added keyframe at (5.0, 0.0)")

    # Room 3: Take 1 keyframe
    print("\nRoom 3:")
    spatial_mem.add_keyframe(image=np.zeros((224, 224, 3)), pose=(0.0, 5.0, 3.14))
    print("  Added keyframe at (0.0, 5.0)")

    # Test spatial queries
    print("\n" + "=" * 50)
    print("Testing spatial queries...\n")

    # Check if location already visited
    test_pose = (0.2, 0.3, 0.0)
    visited = spatial_mem.has_visited_location(test_pose, threshold=1.0)
    print(f"Has visited (0.2, 0.3)? {visited}")

    # Get nearby keyframes
    nearby = spatial_mem.get_nearby_keyframes(test_pose, radius=2.0)
    print(f"Keyframes within 2.0m: {len(nearby)}")

    # Get keyframes in specific room
    room_0_kfs = spatial_mem.get_keyframes_in_room(0)
    print(f"Keyframes in room 0: {len(room_0_kfs)}")

    # Check unvisited rooms
    unvisited = spatial_mem.get_unvisited_rooms(test_pose)
    print(f"Unvisited rooms from current pose: {unvisited}")

    # Get coverage stats
    print("\n" + "=" * 50)
    coverage = spatial_mem.get_spatial_coverage()
    print("Coverage Statistics:")
    for k, v in coverage.items():
        print(f"  {k}: {v}")

    # Visualize
    print("\n" + "=" * 50)
    print(spatial_mem.visualize_memory())


if __name__ == "__main__":
    test_spatial_memory()
