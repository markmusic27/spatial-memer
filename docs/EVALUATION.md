# Evaluation Strategy

## Overview

To demonstrate that Spatial-MemER meaningfully improves robot policies, we need to show that policies **actually use** the spatial information, not just the keyframe images.

## Core Hypothesis

**Hypothesis**: Robot policies equipped with spatial maps can solve tasks that require spatial reasoning, even when visual information is degraded or incomplete.

**Key Insight**: If we mask/degrade visual information but preserve spatial structure, a spatially-aware policy should still succeed while a baseline policy fails.

## Evaluation Framework

### Design Principle

Create tasks where:
1. Visual information alone is insufficient
2. Spatial memory is necessary for success
3. Performance difference is measurable

### Test Suite Structure

**10 Task Categories × 10 Examples Each = 100 Total Tests**

Each test compares:
- **Baseline**: Policy with keyframe images only (no spatial map)
- **Spatial-MemER**: Policy with spatial map + watermarked keyframes
- **Oracle**: Policy with full visual information (upper bound)

## Task Categories

### 1. Occluded Object Retrieval

**Task**: "Pick up the [object]"

**Challenge**:
- Object is currently out of view (occluded or outside FOV)
- Was visible in a previous keyframe
- Must use spatial memory to navigate to last known location

**Masking**:
- Blur current observation
- Object only visible in one keyframe
- Keyframe image shows object but not context

**Success Metric**: Robot navigates to correct location and retrieves object

**Example**:
```
Setup: Red cup placed on table (observed at t=5), then robot turns away
Task: "Get the red cup"
Baseline: Searches randomly (can't see cup now)
Spatial: Uses map to return to location where cup was seen
```

---

### 2. Relative Positioning

**Task**: "Move to the left of [object]"

**Challenge**:
- Requires understanding spatial relationship
- Object may be out of current view
- "Left" is egocentric (depends on robot's current orientation)

**Masking**:
- Object location shown on map
- Current view doesn't show object
- Must compute relative position from map

**Success Metric**: Robot moves to correct relative position

**Example**:
```
Setup: Blue block on table, robot facing away
Task: "Move to the left of the blue block"
Baseline: No understanding of "left" without seeing block
Spatial: Uses map to compute where "left of block" is from current pose
```

---

### 3. Spatial Sequencing

**Task**: "Visit locations in order: A → B → C"

**Challenge**:
- Must track which locations already visited
- Locations may not be simultaneously visible
- Requires planning path through space

**Masking**:
- Locations shown on map as keyframes
- Current view doesn't show all targets
- Must sequence using spatial structure

**Success Metric**: Robot visits locations in correct order

**Example**:
```
Setup: Three marked zones on floor
Task: "Touch zone 1, then 2, then 3"
Baseline: Forgets which zones already visited
Spatial: Uses map to track progress and navigate to next zone
```

---

### 4. Return to Previous Location

**Task**: "Go back to where you saw [object]"

**Challenge**:
- Must remember spatial location from past
- Object no longer visible
- Requires spatial memory, not just object recognition

**Masking**:
- Object was in keyframe at time T
- Object removed or occluded by time T+N
- Must use stored spatial information

**Success Metric**: Robot navigates to within 10cm of original observation location

**Example**:
```
Setup: Robot observes green marker at location L, then moves away, marker is removed
Task: "Return to where you saw the green marker"
Baseline: Cannot locate L (marker gone)
Spatial: Uses keyframe pose from map to return to L
```

---

### 5. Spatial Disambiguation

**Task**: "Pick up the [object] on the left"

**Challenge**:
- Multiple instances of same object type
- Must distinguish by spatial location
- "Left" requires spatial reasoning

**Masking**:
- Both objects visible in keyframes
- Current view shows neither clearly
- Must use map to identify "left" vs "right"

**Success Metric**: Robot picks up correct instance

**Example**:
```
Setup: Two red cups, one left, one right
Task: "Pick up the red cup on the left"
Baseline: Random choice (50% accuracy)
Spatial: Uses map to identify left cup's location
```

---

### 6. Multi-Step Spatial Planning

**Task**: "Put the block in the bin, then return to the start"

**Challenge**:
- Two spatial goals: bin location + start location
- Start location may not be visible from bin
- Requires remembering starting pose

**Masking**:
- Bin location shown on map
- Start location only in first keyframe
- No direct visual path from bin to start

**Success Metric**: Completes both sub-tasks

**Example**:
```
Setup: Robot starts at origin, bin is 1m away
Task: "Place block in bin and come back"
Baseline: Places block but cannot return to start
Spatial: Uses map to navigate back to origin pose
```

---

### 7. Spatial Search

**Task**: "Find [object] - I saw it somewhere in this room"

**Challenge**:
- Object location uncertain
- Must search systematically
- Previous observations constrain search space

**Masking**:
- Map shows previously explored regions
- Some keyframes show "not here" observations
- Must avoid re-searching

**Success Metric**: Finds object with minimal redundant searching

**Example**:
```
Setup: Target object in unknown location, some areas already searched
Task: "Find the blue ball"
Baseline: Random search (inefficient)
Spatial: Avoids already-searched regions shown on map
```

---

### 8. Geometric Reasoning

**Task**: "The target is halfway between the red and blue markers"

**Challenge**:
- Must compute spatial midpoint
- Markers may not be co-visible
- Requires geometric calculation from map

**Masking**:
- Marker positions shown on map
- Current view shows neither marker
- Must use coordinate information

**Success Metric**: Robot moves to within 10cm of actual midpoint

**Example**:
```
Setup: Red marker at (0.5, 0), blue at (0.5, 1.0)
Task: "Move to the point between red and blue"
Baseline: Cannot solve (doesn't see markers)
Spatial: Computes (0.5, 0.5) from map and navigates there
```

---

### 9. Temporal Spatial Memory

**Task**: "Show me where the [object] was 30 seconds ago"

**Challenge**:
- Object has moved since observation
- Must recall past spatial state
- Current observation is misleading

**Masking**:
- Object currently in different location
- Past location only in keyframe + map
- Must distinguish past vs present

**Success Metric**: Robot navigates to past location, not current

**Example**:
```
Setup: Cup initially on table, then moved to counter
Task: "Point to where the cup was at the start"
Baseline: Points to current location (counter)
Spatial: Uses timestamped keyframe to identify original table location
```

---

### 10. Spatial Constraints

**Task**: "Place object in the empty space between A and B"

**Challenge**:
- Must identify negative space (where nothing is)
- Requires understanding spatial relationships
- Cannot be solved from single image

**Masking**:
- Objects A and B in keyframes
- Current view doesn't show both
- Must use map to identify gap

**Success Metric**: Places object in correct empty region

**Example**:
```
Setup: Box A at (0, 0), Box B at (1, 0)
Task: "Put the block in the space between the boxes"
Baseline: Random placement
Spatial: Uses map to identify (0.5, 0) as midpoint gap
```

---

## Metrics

### Primary Metrics

1. **Task Success Rate (TSR)**:
   ```
   TSR = (# tasks completed successfully) / (# tasks attempted)
   ```

2. **Spatial Dependency Index (SDI)**:
   ```
   SDI = TSR(Spatial-MemER) - TSR(Baseline)
   ```
   Measures how much spatial information helps.

3. **Efficiency**:
   ```
   Efficiency = Distance traveled to goal / Optimal path length
   ```
   Lower = better (less wandering).

### Secondary Metrics

4. **Localization Error**:
   ```
   Error = ||Final Position - Target Position||₂
   ```

5. **Planning Time**:
   Time from task start to first movement.

6. **Keyframe Utilization**:
   % of keyframes referenced during task execution.

---

## Experimental Protocol

### Setup

**Robot**: 7-DOF arm, clamped to table, camera at end-effector

**Environment**: 1m × 1m workspace with various objects

**Condition**: Each task run 10 times with different:
- Object positions (randomized)
- Initial robot poses (randomized)
- Distractor objects (randomized)

### Procedure

For each task:

1. **Initialization**:
   - Place objects randomly
   - Reset robot to start pose
   - Clear spatial memory

2. **Exploration Phase** (15 seconds):
   - Robot moves to random poses
   - Observes workspace
   - Builds spatial map (3-5 keyframes)

3. **Task Execution Phase**:
   - Provide task instruction
   - Baseline: Policy receives keyframe images only
   - Spatial-MemER: Policy receives map + watermarked keyframes
   - Record success/failure

4. **Analysis**:
   - Measure metrics
   - Log trajectory
   - Save visualizations

### Conditions

**Three experimental conditions**:

1. **Baseline (No Spatial)**:
   - Input: Current RGB + keyframe images
   - No spatial map
   - No pose information

2. **Spatial-MemER (Full System)**:
   - Input: Current RGB + spatial map + watermarked keyframes
   - Full spatial context
   - All pose information

3. **Oracle (Upper Bound)**:
   - Input: Current RGB (high quality, no masking)
   - Full visual information
   - Represents "perfect vision" baseline

---

## Implementation

### Data Collection

```python
def evaluate_task(task_id, condition, trial_num):
    """
    Run one trial of a task.

    Args:
        task_id: Which task (1-10)
        condition: "baseline", "spatial", or "oracle"
        trial_num: Trial number (0-9)

    Returns:
        results: Dict with metrics
    """
    # Setup
    env = setup_environment(task_id, trial_num)
    robot = Robot()
    policy = load_policy(condition)

    if condition == "spatial":
        spatial_ctx = SpatialContext()

    # Exploration phase
    for t in range(15):  # 15 seconds at 1 Hz
        robot.move_to_random_pose()
        rgb = robot.get_observation()

        if condition == "spatial":
            frame_id = spatial_ctx.add_frame(robot.get_joint_angles())
            if should_save_keyframe(t):
                spatial_ctx.promote_to_keyframe(frame_id)

    # Task execution
    task = get_task_description(task_id, trial_num)
    start_time = time.time()

    success = False
    trajectory = []

    for t in range(100):  # Max 100 steps
        rgb = robot.get_observation()

        if condition == "spatial":
            map_img, colors = spatial_ctx.generate_map()
            action = policy(rgb, map_img, keyframes, task)
        elif condition == "baseline":
            action = policy(rgb, keyframes, task)
        else:  # oracle
            action = policy(rgb, task)

        robot.execute(action)
        trajectory.append(robot.get_pose())

        if task_completed(env, task_id):
            success = True
            break

    # Compute metrics
    results = {
        'task_id': task_id,
        'condition': condition,
        'trial_num': trial_num,
        'success': success,
        'time': time.time() - start_time,
        'trajectory': trajectory,
        'efficiency': compute_efficiency(trajectory, env),
        'error': compute_localization_error(robot, env, task_id)
    }

    return results
```

### Analysis

```python
import pandas as pd
import matplotlib.pyplot as plt

def analyze_results(all_results):
    """Analyze evaluation results."""

    df = pd.DataFrame(all_results)

    # Success rates by condition
    success_rates = df.groupby('condition')['success'].mean()

    print("Success Rates:")
    print(success_rates)

    # SDI for each task
    for task_id in range(1, 11):
        task_data = df[df['task_id'] == task_id]
        baseline_sr = task_data[task_data['condition'] == 'baseline']['success'].mean()
        spatial_sr = task_data[task_data['condition'] == 'spatial']['success'].mean()
        sdi = spatial_sr - baseline_sr
        print(f"Task {task_id} SDI: {sdi:.2f}")

    # Plot
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))

    # Success rates
    success_rates.plot(kind='bar', ax=axes[0, 0])
    axes[0, 0].set_title("Success Rate by Condition")
    axes[0, 0].set_ylabel("Success Rate")

    # SDI per task
    sdi_data = []
    for task_id in range(1, 11):
        task_df = df[df['task_id'] == task_id]
        baseline = task_df[task_df['condition'] == 'baseline']['success'].mean()
        spatial = task_df[task_df['condition'] == 'spatial']['success'].mean()
        sdi_data.append(spatial - baseline)

    axes[0, 1].bar(range(1, 11), sdi_data)
    axes[0, 1].set_title("Spatial Dependency Index by Task")
    axes[0, 1].set_xlabel("Task ID")
    axes[0, 1].set_ylabel("SDI")

    # Efficiency
    df.boxplot(column='efficiency', by='condition', ax=axes[1, 0])
    axes[1, 0].set_title("Path Efficiency")

    # Localization error
    df[df['success']].boxplot(column='error', by='condition', ax=axes[1, 1])
    axes[1, 1].set_title("Localization Error (successful trials)")

    plt.tight_layout()
    plt.savefig("evaluation_results.png")

    return df
```

---

## Expected Results

### Hypothesis 1: Spatial-MemER Improves Task Success

**Prediction**:
- Baseline TSR: 30-40% (limited by lack of spatial info)
- Spatial-MemER TSR: 70-85% (benefits from spatial reasoning)
- Oracle TSR: 85-95% (upper bound with perfect vision)

**Statistical Test**: Paired t-test comparing Spatial vs Baseline TSR across 10 tasks.

### Hypothesis 2: Spatial Tasks Show Highest SDI

**Prediction**: Tasks 1-4 (occluded objects, relative positioning) show SDI > 0.4.

**Rationale**: These tasks fundamentally require spatial memory.

### Hypothesis 3: Spatial-MemER Enables Efficient Navigation

**Prediction**: Spatial-MemER trajectories 20-30% shorter than baseline.

**Rationale**: Direct navigation vs random search.

---

## Ablation Studies

Test individual components:

### Ablation 1: Map Only (No Keyframes)

Policy receives spatial map but not keyframe images.

**Tests**: Is visual memory necessary, or is spatial structure sufficient?

### Ablation 2: Keyframes Only (No Map)

Policy receives keyframe images but not spatial map.

**Tests**: Baseline condition (current approaches).

### Ablation 3: Map Without Colors

Map shows positions but keyframes not watermarked.

**Tests**: Is color correspondence helpful?

### Ablation 4: Degraded Pose Accuracy

Add noise to forward kinematics (simulate imprecise actuators).

**Tests**: Sensitivity to pose errors.

---

## Qualitative Analysis

### Visualization

For each trial, save:
1. Spatial map at task start
2. Keyframe images (watermarked)
3. Robot trajectory (3D plot)
4. Success/failure label

### Case Studies

Manually analyze:
- **Hard failures**: Where Spatial-MemER failed (what went wrong?)
- **Surprising successes**: Where Spatial-MemER succeeded despite challenges
- **Comparison**: Side-by-side Baseline vs Spatial-MemER on same trial

---

## Validation Without MemER Finetuning

Since we don't have MemER training data, we can still validate:

### Simulation-Based Validation

Use scripted policies that explicitly use spatial information:

```python
def scripted_spatial_policy(map, keyframes, task):
    """
    Hand-coded policy that demonstrates spatial reasoning.
    """
    if "go to" in task:
        # Extract target from task
        target = parse_target(task)

        # Find target in keyframes
        target_frame_id = identify_object_in_keyframes(target, keyframes)

        if target_frame_id is None:
            return "search"

        # Get target location from map
        target_pos = get_keyframe_position(map, target_frame_id)

        # Navigate there
        return navigate_to(target_pos)
```

**Value**: Proves the architecture can support spatial reasoning (even if VLM doesn't).

### Human Study

Have humans perform tasks using:
1. Keyframe images only
2. Keyframe images + spatial map

**Prediction**: Humans perform better with spatial map.

**Implication**: Spatial map contains useful information for the task.

---

## Timeline

**Week 1**: Implement evaluation harness (data collection + metrics)

**Week 2**: Collect data for all 10 task categories (100 trials total)

**Week 3**: Analysis + visualization

**Week 4**: Write-up + prepare demo

---

## Deliverables

1. **Evaluation Code**: `scripts/evaluate.py` (run all tests)
2. **Results Dataset**: CSV with all trial data
3. **Analysis Notebook**: Jupyter notebook with plots
4. **Qualitative Report**: Case studies + failure analysis
5. **Demo Video**: Side-by-side comparisons

---

## Presentation to Physical Intelligence

### Key Talking Points

1. **Problem**: Existing policies lack spatial understanding
2. **Solution**: Modular spatial memory system
3. **Evidence**: 100-trial evaluation showing SDI > 0.4 on spatial tasks
4. **Integration**: Three lines of code to add spatial awareness
5. **Next Steps**: Finetune VLM to natively use spatial information

### Demo Structure

1. **Live Demo** (5 min):
   - Show robot building spatial map
   - Run spatial retrieval task
   - Compare with/without spatial map

2. **Results Presentation** (5 min):
   - Show success rate plots
   - Highlight key tasks (SDI > 0.5)
   - Trajectory visualizations

3. **Code Walkthrough** (5 min):
   - Show integration (3 lines)
   - Explain architecture
   - Discuss extensibility

4. **Q&A** (10 min):
   - Technical deep-dive
   - Future directions
   - Collaboration opportunities

---

## Future Work

1. **End-to-End Training**: Finetune VLM with spatial map as input
2. **3D Spatial Maps**: Extend to full 3D (not just BEV)
3. **Semantic Mapping**: Associate object labels with locations
4. **Multi-Robot**: Shared spatial maps for collaboration
5. **Active Exploration**: Policy suggests where to observe next

---

## References

- MemER: Memory-Enhanced Robot Policies (arXiv:XXXX.XXXXX)
- RT-2: Vision-Language-Action Models (arXiv:2307.15818)
- SpatialVLM: Spatial Reasoning for VLMs (arXiv:2401.12168)

## Contact

Questions about evaluation? Reach out to discuss experimental design.
