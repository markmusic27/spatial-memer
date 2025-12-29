# test_integration.py
"""
Test spatial memory with MemER-style keyframe selection
"""

import numpy as np
from spatial_memory import SpatialMemoryModule, SpatialKeyframe


class MockMemERHighLevel:
    """Simulate MemER's high-level policy for testing"""

    def __init__(self, use_spatial: bool = False):
        self.spatial_mem = SpatialMemoryModule() if use_spatial else None
        self.keyframes = []  # Visual-only keyframes

    def should_select_keyframe(self, image, pose) -> bool:
        """
        Mock keyframe selection logic.
        With spatial: avoid redundant nearby keyframes
        Without spatial: simple time-based selection
        """
        if self.spatial_mem:
            # Spatial-aware: don't select if we already have one nearby
            return not self.spatial_mem.has_visited_location(pose, threshold=1.5)
        else:
            # Visual-only: select every 5 frames (naive)
            return len(self.keyframes) % 5 == 0

    def process_frame(self, image, pose):
        """Process incoming frame, potentially select as keyframe"""

        if self.should_select_keyframe(image, pose):
            if self.spatial_mem:
                # Spatial version
                kf = self.spatial_mem.add_keyframe(image, pose)
                print(
                    f"  [SPATIAL] Selected keyframe at {pose[:2]} (Room {kf.room_id})"
                )
            else:
                # Visual-only version
                self.keyframes.append({"image": image, "pose": pose})
                print(f"  [VISUAL]  Selected keyframe at {pose[:2]}")


def compare_spatial_vs_visual():
    """
    Compare spatial-aware vs visual-only keyframe selection.
    Simulates robot repeatedly visiting same locations.
    """

    print("COMPARISON: Spatial-Aware vs Visual-Only Keyframe Selection")
    print("=" * 60)

    # Trajectory: visit 3 locations, then revisit location 1 and 2
    trajectory = [
        (0.0, 0.0, 0.0),  # Location 1
        (0.1, 0.0, 0.0),  # Near location 1
        (5.0, 0.0, 1.57),  # Location 2
        (5.1, 0.0, 1.57),  # Near location 2
        (0.0, 5.0, 3.14),  # Location 3
        (0.0, 5.1, 3.14),  # Near location 3
        (0.2, 0.1, 0.0),  # REVISIT location 1
        (5.0, 0.1, 1.57),  # REVISIT location 2
    ]

    # Test both versions
    spatial_policy = MockMemERHighLevel(use_spatial=True)
    visual_policy = MockMemERHighLevel(use_spatial=False)

    print("\n--- SPATIAL-AWARE POLICY ---")
    for i, pose in enumerate(trajectory):
        image = np.zeros((224, 224, 3))
        spatial_policy.process_frame(image, pose)

    print("\n--- VISUAL-ONLY POLICY ---")
    for i, pose in enumerate(trajectory):
        image = np.zeros((224, 224, 3))
        visual_policy.process_frame(image, pose)

    # Compare results
    print("\n" + "=" * 60)
    print("RESULTS:")
    print(f"  Spatial-aware: {len(spatial_policy.spatial_mem.keyframes)} keyframes")
    print(f"  Visual-only:   {len(visual_policy.keyframes)} keyframes")
    print(
        f"  Reduction:     {len(visual_policy.keyframes) - len(spatial_policy.spatial_mem.keyframes)} redundant keyframes avoided"
    )

    # Show spatial memory structure
    print("\n" + spatial_policy.spatial_mem.visualize_memory())


if __name__ == "__main__":
    compare_spatial_vs_visual()
