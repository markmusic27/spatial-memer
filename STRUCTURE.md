# Spatial-MemER File Structure

This document describes the complete file structure of the Spatial-MemER project, which extends MemER to add spatial memory context for hierarchical VLA policies.

## Overview

```
spatial-memer/
├── src/                    # Core Python library
├── scripts/                # Utility and test scripts
├── fr3v2/                  # Franka FR3 robot model (MuJoCo)
├── dataset/                # Test video data
├── results/                # Output results from tests
├── assets/                 # Test images and videos
├── landing-page/           # Next.js project website
├── external/               # External dependencies (git submodule)
└── configuration files
```

---

## src/

Core Python library for spatial context management.

| File | Description |
|------|-------------|
| `spatial_context.py` | Main API for pose storage and BEV map generation. Contains `SpatialContext` class for managing frames/keyframes and `MapConfig` for customizing map output. |
| `robot_arm.py` | Forward kinematics computation for Franka Emika Panda (FR3) using MuJoCo. Takes 7-DOF joint angles and returns SE(3) camera pose. |
| `localization.py` | DPVO wrapper for visual odometry on mobile robots. Processes RGB frames and returns camera poses in world frame. |
| `transforms.py` | SE(3) transformation utilities including quaternion conversion, pose composition, and validation functions. |

---

## scripts/

Utility scripts for testing and setup.

| File | Description |
|------|-------------|
| `test_pose.py` | Tests forward kinematics validity and SE(3) constraint validation. |
| `test_spatial_context.py` | Demonstrates spatial map generation with synthetic frames. |
| `test_localization.py` | Tests DPVO integration with camera calibration and video input. |
| `test_approach.py` | Main demo script that generates BEV map visualization videos from pre-computed poses. |
| `setup_dpvo.sh` | Installation script for DPVO (clones repo, downloads weights, applies patches). |
| `patch_dpvo.sh` | Applies PyTorch 2.x compatibility patches to DPVO source. |

---

## fr3v2/

MuJoCo model files for the Franka Emika Panda FR3v2 robot arm.

| File/Dir | Description |
|----------|-------------|
| `fr3v2.xml` | Main MuJoCo model definition (7-DOF arm with full geometry). |
| `scene.xml` | Scene configuration for visualization. |
| `assets/` | 50+ mesh files (.obj, .stl) for 3D visual and collision geometry. |

---

## dataset/

Test video data for demonstrations.

| File | Description |
|------|-------------|
| `kitchen_body.mp4` | Egocentric video of a kitchen task (30 fps). |
| `numbers_body.mp4` | Egocentric video of a number recognition task (30 fps). |

---

## results/

Output results from test scripts.

```
results/
├── kitchen/
│   ├── keyframes/              # Watermarked keyframe images (PNG)
│   ├── kitchen_poses.txt       # DPVO pose trajectories (sparse)
│   ├── kitchen_trajectory.pdf  # 3D trajectory visualization
│   ├── spatial_map.mp4         # BEV map video
│   └── spatial_map_orientation.mp4  # BEV map with orientation arrows
└── numbers/
    └── (same structure as kitchen/)
```

**Pose file format:** `idx tx ty tz qx qy qz qw` (index, translation, quaternion)

---

## assets/

Test images and videos for development.

| File | Description |
|------|-------------|
| `example_keyframe.png` | Sample image for testing watermarking functionality. |
| `home_example.mp4` | Example video for localization testing. |

---

## landing-page/

Next.js website for project documentation and demos.

```
landing-page/
├── app/
│   ├── page.tsx            # Main landing page
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles
│   └── components/
│       ├── sticky-nav.tsx      # Fixed navigation header
│       ├── video-player.tsx    # Embedded video player
│       ├── author-card.tsx     # Team member profiles
│       ├── theme-toggle.tsx    # Dark/light mode switcher
│       ├── cursor-scale.tsx    # Custom cursor animation
│       └── ui/                 # Reusable UI components
│           ├── glossy-card.tsx
│           ├── glossy-pill.tsx
│           ├── code-block.tsx
│           ├── section-heading.tsx
│           └── section-divider.tsx
├── public/                 # Static assets (images, demos)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS config
├── package.json            # Node dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Landing page documentation
```

---

## external/

External dependencies (git submodule, not committed).

| Dir | Description |
|-----|-------------|
| `DPVO/` | Direct Visual-Inertial Odometry library from Princeton. Contains camera calibration files, Python source, pre-trained weights, and visualization tools. |

---

## Configuration Files

| File | Description |
|------|-------------|
| `pyproject.toml` | Python project metadata and dependencies (mujoco, numpy, opencv-python). |
| `uv.lock` | Lock file for uv package manager. |
| `.python-version` | Python version specification (3.13+). |
| `.gitignore` | Git ignore patterns (caches, venv, external). |
| `.gitmodules` | Git submodule configuration for DPVO. |
| `LICENSE` | Apache 2.0 license. |
| `README.md` | Main project documentation. |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│                    (landing-page/)                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Integration Layer                         │
│                   (scripts/test_*.py)                       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│               Spatial Memory Layer                          │
│               (src/spatial_context.py)                      │
│   • Pose storage    • BEV map generation    • Watermarking  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────┴───────┐                         ┌─────────┴─────────┐
│  Kinematics   │                         │    Perception     │
│  (robot_arm)  │                         │  (localization)   │
│ Forward kin.  │                         │      DPVO         │
└───────────────┘                         └───────────────────┘
        │                                           │
┌───────┴───────┐                         ┌─────────┴─────────┐
│ Hardware/Phys │                         │     External      │
│   (fr3v2/)    │                         │     (DPVO/)       │
│   MuJoCo      │                         │  Visual odometry  │
└───────────────┘                         └───────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                            │
│                  (src/transforms.py)                        │
│        SE(3) algebra • Quaternions • Validation             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Workflows

**Stationary Robot (arm-mounted camera):**
```
Joint Angles (7-DOF) → MuJoCo FK → Camera Pose → SpatialContext → BEV Map
```

**Mobile Robot (body-mounted camera):**
```
RGB Frames → DPVO → Base Pose → FK @ robot_pose → SpatialContext → BEV Map
```
