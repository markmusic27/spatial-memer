"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  StickyNav,
  actionLinks,
  VideoPlayer,
  AuthorCard,
  GlossyPill,
  FeatureCard,
  InfoCard,
  UseCaseCard,
  SectionHeading,
  SectionDivider,
  CodeBlock,
  CodeIcon,
  LocationIcon,
  MapIcon,
  PaletteIcon,
  WarningIcon,
  LightbulbIcon,
  BoltIcon,
  ArchiveIcon,
  ClipboardCheckIcon,
  ClockIcon,
  SearchIcon,
  ArrowCircleRightIcon,
  LayoutIcon,
  EyeIcon,
  CheckCircleIcon,
  ChatIcon,
} from "./components";

export default function Home() {
  const [showStickyNav, setShowStickyNav] = useState(false);
  const linkRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateStickyNav = () => {
      if (!linkRowRef.current) {
        return;
      }
      const { bottom } = linkRowRef.current.getBoundingClientRect();
      setShowStickyNav(bottom <= 0);
    };

    updateStickyNav();
    window.addEventListener("scroll", updateStickyNav, { passive: true });
    window.addEventListener("resize", updateStickyNav);
    return () => {
      window.removeEventListener("scroll", updateStickyNav);
      window.removeEventListener("resize", updateStickyNav);
    };
  }, []);


  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <StickyNav isVisible={showStickyNav} />

      {/* Hero Section */}
      <HeroSection linkRowRef={linkRowRef} />

      {/* Demo Video Section */}
      <DemoSection />

      <SectionDivider />

      {/* Why Section */}
      <WhySection />

      <SectionDivider />

      {/* Architecture */}
      <ArchitectureSection />

      <SectionDivider />

      {/* Quick Start Code */}
      <QuickStartSection />

      <SectionDivider />

      {/* More Code Examples */}
      <CodeExamplesSection />

      <SectionDivider />

      {/* Use Cases */}
      <UseCasesSection />

      <SectionDivider />

      {/* Testing & Validation */}
      <TestingSection />

      <SectionDivider />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

// ============================================================================
// Hero Section
// ============================================================================

interface HeroSectionProps {
  linkRowRef: React.RefObject<HTMLDivElement | null>;
}

function HeroSection({ linkRowRef }: HeroSectionProps) {
  return (
    <section className="pt-16 pb-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-medium mb-4 text-[#1a1a1a] tracking-tight leading-[1.1]">
          Spatial-MemER
        </h1>
        <h2 className="text-2xl md:text-3xl font-light mb-6 text-[#4a4a4a] leading-[1.3]">
          Spatial memory for hierarchical VLA policies.
        </h2>
        <p className="text-lg md:text-xl text-[#2a2a2a] mb-4 leading-relaxed font-light">
          MemER's keyframes capture <em>what</em> the robot saw — but not <em>where</em>. 
          We add egocentric spatial context by computing camera poses via{" "}
          <a
            href="https://arxiv.org/abs/2208.04726"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-1 underline-offset-2"
          >
            DPVO
          </a>{" "}
          and forward kinematics, rendered as a bird's-eye map the high-level policy (VLM) can directly perceive.
        </p>
        <p className="text-base text-[#6a6a6a] mb-8 italic">
          Extending{" "}
          <a
            href="https://jen-pan.github.io/memer/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a1a1a] underline hover:text-[#4a4a4a] transition-colors"
          >
            MemER: Scaling Up Memory for Robot Control via Experience Retrieval
          </a>
        </p>

        {/* Authors */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-5 mb-8 text-base">
          <AuthorCard
            name="Mark Music"
            imageUrl="https://markmusic.notion.site/image/attachment%3Aa0fd4fee-5d6a-4c90-b9e0-b69387933ebd%3AFrame_2.png?id=1ceb37de-b65d-801a-ac5c-d1c7314f1a35&table=block&spaceId=1836a043-9d61-47b3-af19-484cf61d0f91&width=250&userId=&cache=v2"
            linkedInUrl="https://www.linkedin.com/in/markmusic27/"
            school="Stanford"
            schoolLogo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1341px-Stanford_Cardinal_logo.svg.png"
            schoolYear="28"
            major="CS (AI track) + Math"
            websiteUrl="https://markmusic.io"
            githubUrl="https://github.com/markmusic27"
          />
          <AuthorCard
            name="Filippo Fonseca"
            imageUrl="https://media.licdn.com/dms/image/v2/D4E03AQEH1X4IRGyrFg/profile-displayphoto-scale_400_400/B4EZkh595hGYAg-/0/1757210469401?e=1769040000&v=beta&t=3ccs1IKb0FroocoUoj0fw-G53q4pp12148kShhGlH90"
            linkedInUrl="https://www.linkedin.com/in/filippo-fonseca/"
            school="Yale"
            schoolLogo="https://logos-world.net/wp-content/uploads/2021/11/Yale-Symbol.png"
            schoolYear="28"
            major="MechE (ABET) + EECS"
            websiteUrl="https://filippofonseca.com"
            githubUrl="https://github.com/filippo-fonseca"
          />
        </div>

        {/* Links */}
        <div ref={linkRowRef} className="flex flex-wrap justify-center gap-2 md:gap-2 w-[115%] -ml-[7.5%]">
          {actionLinks.map((link) => (
            <GlossyPill
              key={link.label}
              href={link.href}
              icon={link.icon}
              label={link.label}
              mobileLabel={link.mobileLabel}
              newTab={link.newTab}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Demo Section
// ============================================================================

function DemoSection() {
  return (
    <section id="demo" className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <VideoPlayer src="/demo.mp4" />
        <p className="text-center text-[#4a4a4a] text-base font-light max-w-2xl mx-auto leading-relaxed">
        We didn't have a robot... so we used a chest-mounted iPhone 16 Pro running DPVO for localization, constrained Mark's arm to a single DOF with 45° discretized joint angles, and computed FK manually from video. Keyframes and subtasks are simulated based on what we expect MemER would output.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Overview Section
// ============================================================================

function OverviewSection() {
  return (
    <section id="overview" className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-medium mb-6 text-[#1a1a1a] text-center">
          Overview
        </h2>
        <p className="text-lg text-[#2a2a2a] mb-8 leading-relaxed font-light text-center">
          Spatial-MemER extends vision-language robot policies (like MemER,
          RT-2) with explicit spatial reasoning. By maintaining an egocentric
          bird&apos;s-eye view map of keyframe observations, robots can
          understand <strong className="font-medium">WHERE</strong> they
          observed objects in 3D space, not just{" "}
          <strong className="font-medium">WHAT</strong> they saw.
        </p>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<CodeIcon />}
            title="Three-line integration"
            description="Add spatial awareness to any robot policy with minimal code changes"
          />
          <FeatureCard
            icon={<LocationIcon />}
            title="Precise localization"
            description="Forward kinematics-based pose estimation (no SLAM needed)"
          />
          <FeatureCard
            icon={<MapIcon />}
            title="Egocentric maps"
            description="Auto-generated BEV visualizations showing robot + keyframe locations"
          />
          <FeatureCard
            icon={<PaletteIcon />}
            title="Visual correspondence"
            description="Color-coded watermarks link keyframe images to map positions"
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Why Section
// ============================================================================

function WhySection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-[810px] mx-auto px-1 md:px-6">
        <h2 className="text-3xl font-medium mb-8 text-[#1a1a1a] text-center">
          Why Spatial-MemER?
        </h2>
        
        <div className="text-[#2a2a2a] text-lg leading-[1.85] space-y-4">
          <p>
            Humans don't just remember <em>what</em> they saw — they remember <em>where</em> they saw it. 
            Think about making a sandwich: you recall the pan, but also that it's in the cabinet left 
            of the stove. Spatial context is inseparable from visual memory.
          </p>

          <p>
            MemER partially captures this through its exocentric camera, which observes the robot arm from 
            a third-person view. But this approach has limits:
          </p>

          <ol className="list-none space-y-3 pl-1">
            <li className="flex gap-3">
              <span className="text-[#9A9A9A] font-medium shrink-0">1.</span>
              <span>
                VLMs struggle with 3D spatial reasoning, particularly in multi-view contexts where reasoning 
                complexity increases and models become more prone to hallucinations{" "}
                <a
                  href="https://arxiv.org/abs/2509.18905"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a1a1a] underline decoration-1 underline-offset-2 hover:text-[#4a4a4a] transition-colors"
                >(Yu et al., 2025)</a>. This extends to occlusions and viewpoint-dependent relations like 
                "behind" or "in front of."
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#9A9A9A] font-medium shrink-0">2.</span>
              <span>
                It breaks down entirely when the robot can move and explore: the exocentric frame 
                no longer anchors anything.
              </span>
            </li>
          </ol>

          <p>
            We wanted to give the policy explicit spatial context through an egocentric map — a direct 
            visual representation of where keyframes were captured relative to the robot's current pose.{" "}
            <a
              href="#overview"
              className="text-[#1a1a1a] underline decoration-1 underline-offset-2 hover:text-[#4a4a4a] transition-colors"
            >More on the mechanism below.</a>
          </p>

          <p>
            <strong className="font-semibold text-[#1a1a1a]">This is a starting point.</strong> Explicit 
            maps are interpretable and easy to integrate, but we're ultimately interested in whether spatial 
            context could be encoded implicitly — analogous to how positional embeddings like RoPE encode 
            token position in text. Could we learn spatial encodings over visual tokens?
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Quick Start Section
// ============================================================================

function QuickStartSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading icon={<BoltIcon className="w-7 h-7" />} title="Quick Start" />

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            Installation
          </h3>
          <CodeBlock>{`# Install dependencies
uv sync

# For mobile robots - install DPVO for visual odometry
./scripts/setup_dpvo.sh`}</CodeBlock>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            Basic Usage
          </h3>
          <CodeBlock>{`from spatial_context import SpatialContext

# Initialize
ctx = SpatialContext()

# In your robot policy loop (1 Hz)
robot_joint_angles = robot.get_joint_angles()  # 7-DOF

# 1. Add current frame
frame_id = ctx.add_frame(robot_joint_angles)

# 2. Generate spatial map
map_image, colors = ctx.generate_map()

# 3. Promote important frames to keyframes
ctx.promote_to_keyframe(frame_id)

# Feed map_image + keyframes to your VLM!`}</CodeBlock>
        </div>

        <p className="text-center text-lg font-light text-[#2a2a2a] italic">
          That&apos;s it! Your policy now has spatial awareness.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Architecture Section
// ============================================================================

function ArchitectureSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading icon={<ArchiveIcon />} title="Architecture" />

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            For Stationary Robots
          </h3>
          <p className="text-base text-[#4a4a4a] mb-4 font-light leading-relaxed">
            Robots clamped to a table with precise actuators:
          </p>
          <CodeBlock centered>{`Joint Angles → Forward Kinematics → Camera Pose → Spatial Map
    (7-DOF)         (SE(3) 4×4)        (World)      (Egocentric BEV)`}</CodeBlock>
          <p className="text-sm text-[#6a6a6a] italic font-light leading-relaxed mt-3">
            Why no SLAM? Precise actuators + stationary base = forward
            kinematics provides exact pose.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            For Mobile Robots
          </h3>
          <p className="text-base text-[#4a4a4a] mb-4 font-light leading-relaxed">
            Robots with moving bases:
          </p>
          <CodeBlock centered>{`RGB Frames → DPVO (Deep Patch Visual Odometry) → Robot Pose (World) + FK → Spatial Map`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Code Examples Section
// ============================================================================

function CodeExamplesSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading icon={<CodeIcon className="w-7 h-7" />} title="Code Examples" />

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            Stationary Robot Example
          </h3>
          <CodeBlock>{`from spatial_context import SpatialContext
import numpy as np

# Initialize spatial memory
ctx = SpatialContext()

# Simulate robot motion
for timestep in range(50):
    # Get robot state (joint angles in radians)
    joint_angles = robot.get_joint_angles()  # 7-element array

    # Add frame (computes pose via forward kinematics)
    frame_id = ctx.add_frame(joint_angles)

    # Promote every 10th frame to keyframe
    if timestep % 10 == 0:
        ctx.promote_to_keyframe(frame_id)

# Generate map
map_image, keyframe_colors = ctx.generate_map()

# Show map
import cv2
cv2.imshow("Spatial Map", map_image)
cv2.waitKey(0)`}</CodeBlock>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-4 text-[#1a1a1a]">
            Integration with MemER
          </h3>
          <CodeBlock>{`# Existing MemER loop (simplified)
for timestep in episode:
    observation = env.get_observation()
    action = policy(observation, memory)

    # === ADD: Spatial-MemER (3 lines) ===
    frame_id = spatial_ctx.add_frame(robot.joint_angles)
    map_image, colors = spatial_ctx.generate_map()
    watermarked_obs = spatial_ctx.watermark_keyframes([observation], colors)
    # === END ===

    # Policy now receives spatially-enhanced observations
    action = policy(watermarked_obs, map_image, memory)`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Use Cases Section
// ============================================================================

function UseCasesSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading icon={<ClipboardCheckIcon />} title="Use Cases" />

        <div className="grid md:grid-cols-2 gap-4">
          <UseCaseCard
            icon={<ClockIcon />}
            title="Long-horizon manipulation"
            description="Track object locations across multi-step tasks"
          />
          <UseCaseCard
            icon={<SearchIcon />}
            title="Spatial search"
            description={`"Find the blue ball" (avoid re-searching)`}
          />
          <UseCaseCard
            icon={<ArrowCircleRightIcon />}
            title="Navigation"
            description={`"Return to the start position"`}
          />
          <UseCaseCard
            icon={<LayoutIcon />}
            title="Geometric reasoning"
            description={`"Place object between A and B"`}
          />
          <UseCaseCard
            icon={<ClockIcon />}
            title="Temporal tracking"
            description={`"Show me where the cup was 30 seconds ago"`}
          />
          <UseCaseCard
            icon={<EyeIcon />}
            title="Occluded retrieval"
            description="Get objects out of current view using spatial memory"
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Testing Section
// ============================================================================

function TestingSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          icon={<CheckCircleIcon />}
          title="Testing & Validation"
        />

        <p className="text-lg text-[#2a2a2a] mb-6 leading-relaxed font-light text-center">
          We evaluate Spatial-MemER across controlled table-top setups and
          longer-horizon tasks that stress spatial recall, landmark re-finding,
          and geometric reasoning. Our goal is to make spatial memory tests as
          repeatable as classic manipulation benchmarks.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <FeatureCard
            icon={<></>}
            title="Spatial Recall"
            description="Return-to-location tasks and occluded object retrieval to measure memory persistence and drift."
          />
          <FeatureCard
            icon={<></>}
            title="Map Consistency"
            description="Keyframe-map alignment checks and inter-keyframe distance stability under repeated viewpoints."
          />
          <FeatureCard
            icon={<></>}
            title="Policy Impact"
            description="Task success and sample efficiency comparisons vs. baselines without spatial memory augmentation."
          />
        </div>

        <div className="glossy-card p-6 bg-[#FAFAF8] border border-[#e8e7e0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-(family-name:--font-eb-garamond) rounded-lg">
          <h3 className="text-xl font-medium text-[#1a1a1a] mb-3 text-center">
            A Call for Benchmarking
          </h3>
          <p className="text-base text-[#2a2a2a] font-light leading-relaxed text-center">
            Spatial memory needs standardized, community-driven benchmarks. We
            propose suites spanning tabletop manipulation, navigation, and
            long-horizon rearrangement with shared metrics for localization
            drift, revisit accuracy, and memory decay. A concerted effort will
            make results comparable across labs and accelerate reliable embodied
            AI.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Citation Section
// ============================================================================

function CitationSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeading icon={<ChatIcon />} title="Citation" />

        <div className="mb-8">
          <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
            If you use Spatial-MemER in your research, please cite:
          </p>
          <CodeBlock>{`@software{spatial_memer_2026,
  title = {Spatial-MemER: Spatial Memory for Embodied Robots},
  author = {Music, Mark and Fonseca, Filippo},
  year = {2026},
  url = {https://github.com/yourusername/spatial-memer}
}`}</CodeBlock>
        </div>

        <div>
          <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
            This work extends{" "}
            <a
              href="https://jen-pan.github.io/memer/"
              className="text-[#1a1a1a] underline hover:text-[#4a4a4a] transition-colors"
            >
              MemER: Memory-Enhanced Robot Policies
            </a>
            :
          </p>
          <CodeBlock>{`@article{sridhar2024memer,
  title = {MemER: Memory-Enhanced Robot Policies},
  author = {Sridhar, Ajay and Pan, Jennifer and Sharma, Satvik and Finn, Chelsea},
  year = {2024}
}`}</CodeBlock>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Footer Section
// ============================================================================

function FooterSection() {
  return (
    <footer className="py-10 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-5 text-[#1a1a1a]">
            Contact us.
          </h3>
          <p className="text-base text-[#2a2a2a] mb-4 font-light leading-relaxed">
            We&apos;re always down for a chat about our ideas, future
            iterations, or collaboration.
          </p>
          <div className="space-y-2 text-base">
            <div>
              <a
                href="mailto:mmusic@stanford.edu"
                className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
              >
                mmusic@stanford.edu
              </a>{" "}
              ·{" "}
              <a
                href="https://markmusic.io"
                className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
              >
                markmusic.io
              </a>
            </div>
            <div>
              <a
                href="mailto:filippo.fonseca@yale.edu"
                className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
              >
                filippo.fonseca@yale.edu
              </a>{" "}
              ·{" "}
              <a
                href="https://filippofonseca.com"
                className="text-[#1a1a1a] hover:text-[#4a4a4a] transition-colors border-b border-[#1a1a1a]"
              >
                filippofonseca.com
              </a>
            </div>
          </div>
        </div>

        <div className="text-sm text-[#6a6a6a] space-y-2 font-light leading-relaxed">
          <p>
            This project builds on the MemER framework by Ajay Sridhar, Jennifer
            Pan, Satvik Sharma, and Chelsea Finn at Stanford.
          </p>
          <p>
            Apache 2.0 License · Made with ❤️ in Costa Rica 🇨🇷 for the physical
            AI research community.
          </p>
        </div>
      </div>
    </footer>
  );
}
