"""
test_approach.py - Demonstration script for Spatial MemER algorithm

Generates a side-by-side video showing:
  - Left: POV video (you as the "robot")
  - Right: Live spatial map with keyframes appearing as they're promoted

Usage:
    python scripts/test_approach.py

Keyframes are hardcoded as timestamps in "MM:SS" format.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import cv2
import numpy as np
from pathlib import Path

from spatial_context import SpatialContext, MapConfig
from transforms import pose_from_translation_quaternion


# ============================================================================
# CONFIGURATION - Edit these for each test
# ============================================================================

TESTS = {
    "kitchen": {
        "video": "dataset/kitchen_body.mp4",
        "poses": "results/kitchen/dpvo_poses.txt",
        "keyframes": ["00:23", "01:04", "01:30"],
    },
    "numbers": {
        "video": "dataset/numbers_body.mp4",
        "poses": "results/numbers/dpvo_poses.txt",
        "keyframes": ["00:18", "00:48", "01:17", "01:34"],
    },
}

VIDEO_FPS = 30  # Input video FPS
OUTPUT_FPS = 30  # Output at same rate as input video

# ============================================================================


def parse_timestamp(ts: str) -> int:
    """Convert 'MM:SS' to seconds."""
    parts = ts.split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid timestamp format: {ts}. Expected 'MM:SS'")
    minutes, seconds = int(parts[0]), int(parts[1])
    return minutes * 60 + seconds


def load_dpvo_poses(pose_file: str) -> list[np.ndarray]:
    """
    Load DPVO poses from file as ordered list.
    
    Format: pose_idx tx ty tz qx qy qz qw
    
    Note: DPVO poses may be sparse (generated with stride), so pose indices
    don't necessarily map 1:1 to video frame indices.
    
    Returns:
        List of SE(3) pose matrices in order
    """
    poses = []
    with open(pose_file, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 8:
                continue
            
            tx, ty, tz = float(parts[1]), float(parts[2]), float(parts[3])
            qx, qy, qz, qw = float(parts[4]), float(parts[5]), float(parts[6]), float(parts[7])
            
            pose = pose_from_translation_quaternion(tx, ty, tz, qx, qy, qz, qw)
            poses.append(pose)
    
    return poses


def run_test(test_name: str, config: dict, output_dir: Path, project_root: Path):
    """
    Run a single test: generate video with spatial map visualization.
    
    Args:
        test_name: Name of the test (e.g., "kitchen")
        config: Test configuration dict
        output_dir: Directory to save outputs
        project_root: Project root directory
    """
    print(f"\n{'='*60}")
    print(f"Running test: {test_name}")
    print(f"{'='*60}")
    
    # Parse keyframe timestamps to seconds
    keyframe_seconds = set(parse_timestamp(ts) for ts in config["keyframes"])
    print(f"Keyframe timestamps: {config['keyframes']}")
    print(f"Keyframe seconds: {sorted(keyframe_seconds)}")
    
    # Load video
    video_path = project_root / config["video"]
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / VIDEO_FPS
    print(f"Video: {total_frames} frames, {video_duration:.1f}s duration")
    
    # Load DPVO poses
    poses_path = project_root / config["poses"]
    dpvo_poses = load_dpvo_poses(str(poses_path))
    num_poses = len(dpvo_poses)
    
    # Calculate pose-to-frame mapping
    # DPVO was likely run with a stride, so poses are sparse
    poses_per_frame = num_poses / total_frames
    effective_pose_fps = num_poses / video_duration
    print(f"Loaded {num_poses} DPVO poses ({effective_pose_fps:.1f} poses/sec, ratio: {poses_per_frame:.3f})")
    
    # Initialize spatial context
    ctx = SpatialContext()
    
    # Setup output video (map only)
    map_size = 512  # Output map size
    
    output_path = output_dir / f"{test_name}_approach.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_path), fourcc, OUTPUT_FPS, (map_size, map_size))
    
    # Track watermarked keyframes
    watermarked_keyframes = []
    promoted_frame_ids = []  # Track which frames were promoted
    keyframe_images = {}  # frame_id -> original image
    promoted_seconds = set()  # Track which seconds already had keyframe promoted
    
    # Process video at OUTPUT_FPS Hz
    frame_step = VIDEO_FPS // OUTPUT_FPS  # Frames to skip between samples
    output_frame_idx = 0
    
    while True:
        # Seek to frame
        frame_idx = output_frame_idx * frame_step
        if frame_idx >= total_frames:
            break
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break
        
        # Current time in seconds
        current_second = frame_idx // VIDEO_FPS
        
        # Get corresponding DPVO pose
        # Map video frame index to pose index using the ratio
        pose_idx = int(frame_idx * poses_per_frame)
        pose_idx = min(pose_idx, num_poses - 1)  # Clamp to valid range
        pose = dpvo_poses[pose_idx]
        
        # Add frame to spatial context
        frame_id = ctx.add_frame_with_pose(pose)
        
        # Check if this second should be a keyframe (only promote once per second)
        is_keyframe = current_second in keyframe_seconds and current_second not in promoted_seconds
        if is_keyframe:
            ctx.promote_to_keyframe(frame_id)
            promoted_frame_ids.append(frame_id)
            keyframe_images[frame_id] = frame.copy()
            promoted_seconds.add(current_second)
            print(f"  [+] Promoted keyframe at {current_second}s (frame_id={frame_id})")
        
        # Generate map
        spatial_map, colors = ctx.generate_map()
        
        # Resize map to output size
        map_resized = cv2.resize(spatial_map, (map_size, map_size))
        
        # Generate watermarked keyframes for newly promoted frame
        if is_keyframe:
            keyframes_list = [(fid, keyframe_images[fid]) for fid in promoted_frame_ids]
            watermarked = ctx.watermark_keyframes(keyframes_list, colors)
            
            # Save the latest watermarked keyframe
            latest_watermarked = watermarked[-1]
            kf_path = output_dir / f"{test_name}_keyframe_{len(watermarked):02d}_{current_second}s.png"
            cv2.imwrite(str(kf_path), latest_watermarked)
            watermarked_keyframes.append(kf_path)
            print(f"      Saved watermarked keyframe: {kf_path.name}")
        
        # Write frame (map only)
        out.write(map_resized)
        
        output_frame_idx += 1
    
    # Cleanup
    cap.release()
    out.release()
    
    print(f"\nOutput video saved: {output_path}")
    print(f"Watermarked keyframes: {len(watermarked_keyframes)}")
    for kf in watermarked_keyframes:
        print(f"  - {kf}")
    
    return output_path, watermarked_keyframes


def main():
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / "results"
    output_dir.mkdir(exist_ok=True)
    
    print("Spatial MemER - Approach Demonstration")
    print(f"Output directory: {output_dir}")
    
    results = {}
    
    for test_name, config in TESTS.items():
        # Create test-specific output directory
        test_output_dir = output_dir / test_name
        test_output_dir.mkdir(exist_ok=True)
        
        try:
            video_path, keyframes = run_test(test_name, config, test_output_dir, project_root)
            results[test_name] = {
                "video": video_path,
                "keyframes": keyframes,
                "success": True,
            }
        except Exception as e:
            print(f"\nError running test '{test_name}': {e}")
            results[test_name] = {"success": False, "error": str(e)}
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for test_name, result in results.items():
        if result["success"]:
            print(f"✓ {test_name}: {result['video']}")
        else:
            print(f"✗ {test_name}: {result['error']}")


if __name__ == "__main__":
    main()

