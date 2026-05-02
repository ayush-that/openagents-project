import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ZERO_G_ROUTER_URL,
  buildAgentZip,
  createAgentConfig,
  createManifest,
  downloadBlob,
  starterAgent,
} from "./agentPackage";
import type { AgentDraft, BlockKind, BuilderBlock, SkillDraft, WorkflowStep } from "./types";

type IconProps = {
  size?: number;
  className?: string;
};

function IconSvg({ size = 18, className = "", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function SoulSigilIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 3.4 18.8 7.3v7.8L12 20.9l-6.8-5.8V7.3L12 3.4Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.3 10.2c1.8-2.4 5.6-2.4 7.4 0M9.1 14.2c1.5 1.4 4.3 1.4 5.8 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M12 8.4v7.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </IconSvg>
  );
}

function ComputeOrbitIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.3 12c2.1-5.8 13.3-5.8 15.4 0-2.1 5.8-13.3 5.8-15.4 0Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4.2c5.8 2.1 5.8 13.5 0 15.6-5.8-2.1-5.8-13.5 0-15.6Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18.6" cy="8.1" fill="currentColor" r="1.2" />
    </IconSvg>
  );
}

function StorageShardIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 3.1 20 7.5v9L12 20.9 4 16.5v-9l8-4.4Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 11.9v8.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m8.2 5.5 7.6 4.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
    </IconSvg>
  );
}

function SkillSocketIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M7.2 6.8h4.1v4.1H7.2zM12.7 6.8h4.1v4.1h-4.1zM7.2 12.3h4.1v4.1H7.2zM12.7 12.3h4.1v4.1h-4.1z" stroke="currentColor" strokeWidth="1.55" />
      <path d="M4 12h3.2M16.8 12H20M12 4v2.8M12 16.4V20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
    </IconSvg>
  );
}

function WorkflowRailIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M6 7.2h5.2c2.2 0 4 1.8 4 4s-1.8 4-4 4H8.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="6" cy="7.2" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="11.2" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="15.2" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </IconSvg>
  );
}

function ExportCapsuleIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M5.2 13.1v4.6c0 1.1.9 2 2 2h9.6c1.1 0 2-.9 2-2v-4.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 3.8v10.1M8.2 10.1l3.8 3.8 3.8-3.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M7.4 6.2h9.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </IconSvg>
  );
}

function BuilderGlyphIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M4.8 17.8 15.9 6.7l1.4 1.4L6.2 19.2H4.8v-1.4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M15.2 3.8 20.2 8.8M5.5 5.7h3.2M7.1 4.1v3.2M17.2 15.9h2.8M18.6 14.5v2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </IconSvg>
  );
}

function PackageSealIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 2.9 19.6 7v8.8L12 21.1l-7.6-5.3V7L12 2.9Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.2 12.2 2.5 2.5 5-5.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="m4.9 7.3 7.1 4.1 7.1-4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </IconSvg>
  );
}

function DragHandleIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M8.2 5.2h7.6M8.2 12h7.6M8.2 18.8h7.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="m6.2 7.1 2-1.9-2-1.9M17.8 3.3l-2 1.9 2 1.9M6.2 20.7l2-1.9-2-1.9M17.8 16.9l-2 1.9 2 1.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" />
    </IconSvg>
  );
}

function AddNodeIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.35" />
    </IconSvg>
  );
}

function RemoveNodeIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="M7.2 7.2 16.8 16.8M16.8 7.2 7.2 16.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M4.8 6.8 12 2.9l7.2 3.9v10.4L12 21.1l-7.2-3.9V6.8Z" stroke="currentColor" strokeWidth="1.35" />
    </IconSvg>
  );
}

function ProofSparkIcon(props: IconProps) {
  return (
    <IconSvg {...props}>
      <path d="m12 3.3 1.5 5.2 5.2 1.5-5.2 1.5-1.5 5.2-1.5-5.2-5.2-1.5 5.2-1.5L12 3.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m18.6 15.4.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1Z" fill="currentColor" />
    </IconSvg>
  );
}

const palette: BuilderBlock[] = [
  {
    id: "palette-soul",
    kind: "soul",
    title: "SOUL.md",
    summary: "Agent identity, tone, goals, and operating principles.",
  },
  {
    id: "palette-model",
    kind: "model",
    title: "0G Compute model",
    summary: "OpenAI-compatible route through the 0G router.",
  },
  {
    id: "palette-memory",
    kind: "memory",
    title: "MEMORY.md",
    summary: "Long-term memory file mapped to 0G Storage.",
  },
  {
    id: "palette-skill",
    kind: "skill",
    title: "SKILL.md",
    summary: "OpenClaw/FastClaw-compatible capability module.",
  },
  {
    id: "palette-workflow",
    kind: "workflow",
    title: "Workflow step",
    summary: "A no-code instruction stage in the agent runbook.",
  },
];

const kindIcons: Record<BlockKind, ReactNode> = {
  soul: <SoulSigilIcon size={18} />,
  model: <ComputeOrbitIcon size={18} />,
  memory: <StorageShardIcon size={18} />,
  skill: <SkillSocketIcon size={18} />,
  workflow: <WorkflowRailIcon size={18} />,
};

const kindLabels: Record<BlockKind, string> = {
  soul: "Persona",
  model: "0G Model",
  memory: "Memory",
  skill: "Skill",
  workflow: "Workflow",
};

const heroStats = [
  { label: "Router", value: "0G Compute" },
  { label: "Package", value: "OpenClaw zip" },
  { label: "Memory", value: "0G Storage" },
];

const proofSteps = ["SOUL.md", "MEMORY.md", "SKILL.md", "manifest.0g.json"];

const panelClass =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-black p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)]";
const panelTitleClass = "relative z-10 mb-4 flex items-center gap-2.5 font-black text-slate-50";
const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black px-3 py-2.5 text-slate-50 outline-none transition focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10";
const labelClass = "relative z-10 mb-3 grid gap-2 text-xs font-black uppercase tracking-[0.08em] text-slate-400";
const glassRowClass =
  "relative z-10 border border-white/10 bg-[#050505] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-300/30 hover:bg-[#080808]";
const iconTileClass =
  "grid place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/10 text-cyan-100";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    const mountElement: HTMLDivElement = currentMount;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountElement.append(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      new THREE.MeshStandardMaterial({
        color: 0x101827,
        emissive: 0x0e7490,
        emissiveIntensity: 0.28,
        metalness: 0.42,
        roughness: 0.24,
      }),
    );
    group.add(core);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 1),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.08, wireframe: true }),
    );
    group.add(shell);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.38 });
    for (const [index, rotation] of [
      [0, 0],
      [Math.PI / 2.7, Math.PI / 5],
      [-Math.PI / 3.2, Math.PI / 1.8],
    ].entries()) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 + index * 0.18, 0.01, 12, 120), ringMaterial);
      ring.rotation.set(rotation[0], rotation[1], index * 0.42);
      group.add(ring);
    }

    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(140 * 3);
    for (let i = 0; i < 140; i += 1) {
      const radius = 2.8 + Math.random() * 1.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.025, transparent: true, opacity: 0.65 }),
    );
    group.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const cyanLight = new THREE.PointLight(0x67e8f9, 18, 12);
    cyanLight.position.set(3, 2, 4);
    scene.add(cyanLight);
    const violetLight = new THREE.PointLight(0xa78bfa, 16, 12);
    violetLight.position.set(-3, -2, 3);
    scene.add(violetLight);

    let frame = 0;
    let animationId = 0;

    function resize() {
      const { clientWidth, clientHeight } = mountElement;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    }

    function animate() {
      frame += 0.01;
      group.rotation.y = frame * 0.55;
      group.rotation.x = Math.sin(frame * 0.7) * 0.18;
      shell.rotation.y = -frame * 0.85;
      particles.rotation.y = frame * 0.16;
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(mountElement);
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
      renderer.dispose();
      pointsGeometry.dispose();
      core.geometry.dispose();
      shell.geometry.dispose();
      core.material.dispose();
      shell.material.dispose();
      ringMaterial.dispose();
      particles.material.dispose();
      mountElement.removeChild(renderer.domElement);
    };
  }, []);

  return <div aria-hidden="true" className="absolute inset-0" ref={mountRef} />;
}

function App() {
  const [agent, setAgent] = useState<AgentDraft>(starterAgent);
  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([
    palette[0],
    palette[1],
    palette[2],
    palette[3],
    palette[4],
  ]);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"manifest" | "agent" | "storage">("manifest");
  const [exporting, setExporting] = useState(false);

  const manifest = useMemo(() => createManifest(agent), [agent]);
  const agentConfig = useMemo(() => createAgentConfig(agent), [agent]);

  function updateAgent(patch: Partial<AgentDraft>) {
    setAgent((current) => ({ ...current, ...patch }));
  }

  function updateModel(patch: Partial<AgentDraft["model"]>) {
    setAgent((current) => ({ ...current, model: { ...current.model, ...patch } }));
  }

  function updateStorage(patch: Partial<AgentDraft["storage"]>) {
    setAgent((current) => ({ ...current, storage: { ...current.storage, ...patch } }));
  }

  function addSkill() {
    setAgent((current) => ({
      ...current,
      skills: [
        ...current.skills,
        {
          id: crypto.randomUUID(),
          name: "custom-skill",
          description: "Describe the agent capability this skill should add.",
          enabled: true,
        },
      ],
    }));
  }

  function updateSkill(id: string, patch: Partial<SkillDraft>) {
    setAgent((current) => ({
      ...current,
      skills: current.skills.map((skill) => (skill.id === id ? { ...skill, ...patch } : skill)),
    }));
  }

  function removeSkill(id: string) {
    setAgent((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.id !== id),
    }));
  }

  function addWorkflowStep() {
    setAgent((current) => ({
      ...current,
      workflow: [
        ...current.workflow,
        {
          id: crypto.randomUUID(),
          title: "New step",
          instruction: "Describe what the agent should do in this stage.",
        },
      ],
    }));
  }

  function updateWorkflowStep(id: string, patch: Partial<WorkflowStep>) {
    setAgent((current) => ({
      ...current,
      workflow: current.workflow.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    }));
  }

  function removeWorkflowStep(id: string) {
    setAgent((current) => ({
      ...current,
      workflow: current.workflow.filter((step) => step.id !== id),
    }));
  }

  function handleDrop(targetIndex: number) {
    if (!draggedBlockId) return;
    const existingIndex = builderBlocks.findIndex((block) => block.id === draggedBlockId);
    const paletteBlock = palette.find((block) => block.id === draggedBlockId);

    if (existingIndex >= 0) {
      const next = [...builderBlocks];
      const [moved] = next.splice(existingIndex, 1);
      const adjustedIndex = targetIndex > existingIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedIndex, 0, moved);
      setBuilderBlocks(next);
    } else if (paletteBlock) {
      setBuilderBlocks((current) => [
        ...current.slice(0, targetIndex),
        { ...paletteBlock, id: `${paletteBlock.kind}-${crypto.randomUUID()}` },
        ...current.slice(targetIndex),
      ]);
    }

    setDraggedBlockId(null);
  }

  async function exportPackage() {
    setExporting(true);
    try {
      const blob = await buildAgentZip(agent);
      downloadBlob(blob, `${slugify(agent.name) || "clawbuilder-0g-agent"}.zip`);
    } finally {
      setExporting(false);
    }
  }

  const preview =
    activeTab === "manifest"
      ? manifest
      : activeTab === "agent"
        ? agentConfig
        : {
            "0gStorageUpload": {
              sdk: "@0gfoundation/0g-ts-sdk",
              env: ["OG_STORAGE_PRIVATE_KEY", "OG_STORAGE_RPC_URL", "OG_STORAGE_INDEXER"],
              files: manifest.files.concat(manifest.skills.map((skill) => skill.path)),
              outputs: manifest.storage,
            },
          };

  return (
    <main className="relative mx-auto w-[min(1180px,calc(100vw-32px))] px-0 py-6 text-slate-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_34rem)]" />

      <nav className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <BuilderGlyphIcon size={18} />
          </div>
          <span className="text-sm font-black tracking-[-0.02em]">ClawBuilder 0G</span>
        </div>
        <div className="hidden items-center gap-5 text-xs font-bold text-slate-400 sm:flex">
          <a className="transition hover:text-white" href="#builder">Builder</a>
          <a className="transition hover:text-white" href="#config">Config</a>
          <a className="transition hover:text-white" href="#export-preview">Export</a>
        </div>
      </nav>

      <section className="mb-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="py-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-cyan-100">
            <span className="size-2 rounded-full bg-emerald-400" />
            ClawBuilder 0G · no-code agent foundry
          </div>
          <h1 className="max-w-4xl text-[clamp(44px,7vw,80px)] font-bold leading-[0.96] tracking-[-0.075em] text-white">
            Build 0G agents without touching runtime files.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A focused visual builder for OpenClaw/FastClaw-style agent packages. Configure persona,
            model, memory, skills, and workflow, then export a ready-to-run 0G package.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200"
              href="#builder"
            >
              <BuilderGlyphIcon size={18} />
              Open builder
            </a>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-5 py-3 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={exportPackage}
              disabled={exporting}
            >
              <ExportCapsuleIcon size={18} />
              {exporting ? "Building package..." : "Export starter package"}
            </button>
          </div>
        </div>

        <div className={`${panelClass} p-4`}>
          <div className="relative min-h-[330px] overflow-hidden rounded-[1.55rem] border border-cyan-300/10 bg-[radial-gradient(circle_at_50%_22%,rgba(103,232,249,0.14),transparent_42%),linear-gradient(180deg,rgba(0,0,0,1),rgba(0,0,0,0.82))]">
            <HeroScene />
            <div className="absolute left-4 top-4 rounded-full border border-cyan-300/20 bg-black/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100 backdrop-blur-md">
              0G-native export stack
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <PackageSealIcon size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Generated package</p>
                  <h2 className="text-lg font-black tracking-[-0.03em] text-white">OpenClaw files, 0G defaults</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#050505] p-4">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Provider preset</span>
              <code className="mt-2 block">{ZERO_G_ROUTER_URL}</code>
            </div>
            {heroStats.map((stat) => (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#050505] px-4 py-3" key={stat.label}>
                <span className="text-sm font-bold text-slate-400">{stat.label}</span>
                <strong className="text-sm text-white">{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {proofSteps.map((step) => (
              <span className="rounded-full border border-white/10 bg-[#050505] px-3 py-1.5 text-xs font-bold text-slate-300" key={step}>
                {step}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[260px_minmax(420px,1fr)_390px]">
        <aside className={`${panelClass} xl:sticky xl:top-4`}>
          <div className={panelTitleClass}>
            <SkillSocketIcon size={18} />
            Drag blocks
          </div>
          {palette.map((block) => (
            <article
              className={`${glassRowClass} mt-2.5 grid cursor-grab grid-cols-[40px_1fr] gap-3 rounded-[1.25rem] p-3.5 first:mt-0`}
              draggable
              key={block.id}
              onDragStart={() => setDraggedBlockId(block.id)}
              onDragEnd={() => setDraggedBlockId(null)}
            >
              <div className={`${iconTileClass} size-10`}>{kindIcons[block.kind]}</div>
              <div>
                <h3 className="mb-1 text-sm font-black text-white">{block.title}</h3>
                <p className="m-0 text-xs leading-5 text-slate-400">{block.summary}</p>
              </div>
            </article>
          ))}
        </aside>

        <section className={panelClass} id="builder">
          <div className={panelTitleClass}>
            <BuilderGlyphIcon size={18} />
            Agent builder canvas
          </div>
          <div
            className="relative z-10 min-h-[520px] rounded-3xl border border-dashed border-white/15 bg-black p-2.5"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(builderBlocks.length)}
          >
            {builderBlocks.map((block, index) => (
              <article
                className={`${glassRowClass} mt-2.5 grid cursor-grab items-center gap-3 rounded-[1.25rem] p-4 first:mt-0 md:grid-cols-[34px_110px_1fr]`}
                draggable
                key={block.id}
                onDragStart={() => setDraggedBlockId(block.id)}
                onDragEnd={() => setDraggedBlockId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.stopPropagation();
                  handleDrop(index);
                }}
              >
                <div className={`${iconTileClass} size-[34px]`}>
                  <DragHandleIcon size={18} />
                </div>
                <div className="inline-flex justify-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1.5 text-xs font-black uppercase text-cyan-100">
                  {kindLabels[block.kind]}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-black text-white">{block.title}</h3>
                  <p className="m-0 text-xs leading-5 text-slate-400">{block.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${panelClass} xl:sticky xl:top-4`} id="export-preview">
          <div className={panelTitleClass}>
            <PackageSealIcon size={18} />
            Live export preview
          </div>
          <div className="relative z-10 mb-3 flex gap-2">
            <button
              className={`rounded-full px-3 py-2 transition hover:-translate-y-0.5 ${
                activeTab === "manifest"
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-[#050505] text-slate-400"
              }`}
              onClick={() => setActiveTab("manifest")}
            >
              manifest.0g.json
            </button>
            <button
              className={`rounded-full px-3 py-2 transition hover:-translate-y-0.5 ${
                activeTab === "agent"
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-[#050505] text-slate-400"
              }`}
              onClick={() => setActiveTab("agent")}
            >
              agent.json
            </button>
            <button
              className={`rounded-full px-3 py-2 transition hover:-translate-y-0.5 ${
                activeTab === "storage"
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-[#050505] text-slate-400"
              }`}
              onClick={() => setActiveTab("storage")}
            >
              0G Storage
            </button>
          </div>
          <pre className="relative z-10 m-0 max-h-[512px] min-h-[512px] overflow-auto rounded-3xl border border-white/10 bg-black p-4 text-xs text-cyan-100">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </section>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3" id="config">
        <section className={panelClass}>
          <div className={panelTitleClass}>
            <SoulSigilIcon size={18} />
            Identity
          </div>
          <label className={labelClass}>
            Agent name
            <input className={inputClass} value={agent.name} onChange={(event) => updateAgent({ name: event.target.value })} />
          </label>
          <label className={labelClass}>
            Description
            <input className={inputClass} value={agent.description} onChange={(event) => updateAgent({ description: event.target.value })} />
          </label>
          <label className={labelClass}>
            SOUL.md
            <textarea className={inputClass} value={agent.soul} onChange={(event) => updateAgent({ soul: event.target.value })} rows={6} />
          </label>
        </section>

        <section className={panelClass}>
          <div className={panelTitleClass}>
            <ComputeOrbitIcon size={18} />
            0G Compute
          </div>
          <label className={labelClass}>
            Provider name
            <input className={inputClass} value={agent.model.providerName} onChange={(event) => updateModel({ providerName: event.target.value })} />
          </label>
          <label className={labelClass}>
            API base
            <input className={inputClass} value={agent.model.apiBase} onChange={(event) => updateModel({ apiBase: event.target.value })} />
          </label>
          <label className={labelClass}>
            Model
            <select className={inputClass} value={agent.model.modelId} onChange={(event) => updateModel({ modelId: event.target.value })}>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
              <option value="qwen/qwen-2.5-7b-instruct">qwen/qwen-2.5-7b-instruct</option>
              <option value="google/gemma-3-27b-it">google/gemma-3-27b-it</option>
              <option value="custom/model">custom/model</option>
            </select>
          </label>
          <label className={labelClass}>
            API key env
            <input className={inputClass} value={agent.model.apiKeyEnv} onChange={(event) => updateModel({ apiKeyEnv: event.target.value })} />
          </label>
        </section>

        <section className={panelClass}>
          <div className={panelTitleClass}>
            <StorageShardIcon size={18} />
            0G Storage memory
          </div>
          <label className={labelClass}>
            MEMORY.md
            <textarea className={inputClass} value={agent.memory} onChange={(event) => updateAgent({ memory: event.target.value })} rows={8} />
          </label>
          <label className={labelClass}>
            Package URI template
            <input className={inputClass} value={agent.storage.packageUri} onChange={(event) => updateStorage({ packageUri: event.target.value })} />
          </label>
          <label className={labelClass}>
            Memory URI template
            <input className={inputClass} value={agent.storage.memoryUri} onChange={(event) => updateStorage({ memoryUri: event.target.value })} />
          </label>
          <label className={labelClass}>
            Log URI template
            <input className={inputClass} value={agent.storage.logUri} onChange={(event) => updateStorage({ logUri: event.target.value })} />
          </label>
        </section>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <SkillSocketIcon size={18} />
              Skills
            </span>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/25 px-3 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5" onClick={addSkill}>
              <AddNodeIcon size={16} />
              Add
            </button>
          </div>
          <div className="relative z-10 grid gap-2.5">
            {agent.skills.map((skill) => (
              <article className={`${glassRowClass} grid items-center gap-2.5 rounded-2xl p-3 md:grid-cols-[180px_1fr_auto_36px]`} key={skill.id}>
                <input
                  className={inputClass}
                  value={skill.name}
                  onChange={(event) => updateSkill(skill.id, { name: slugify(event.target.value) })}
                />
                <input
                  className={inputClass}
                  value={skill.description}
                  onChange={(event) => updateSkill(skill.id, { description: event.target.value })}
                />
                <label className="m-0 flex items-center gap-2 whitespace-nowrap text-xs font-black uppercase tracking-[0.08em] text-slate-400">
                  <input
                    className="min-h-0 w-auto accent-cyan-300"
                    type="checkbox"
                    checked={skill.enabled}
                    onChange={(event) => updateSkill(skill.id, { enabled: event.target.checked })}
                  />
                  enabled
                </label>
                <button
                  className="grid size-9 place-items-center rounded-full bg-red-500/15 text-red-200 transition hover:-translate-y-0.5"
                  onClick={() => removeSkill(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                >
                  <RemoveNodeIcon size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <WorkflowRailIcon size={18} />
              Workflow
            </span>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/25 px-3 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5" onClick={addWorkflowStep}>
              <AddNodeIcon size={16} />
              Add
            </button>
          </div>
          <div className="relative z-10 grid gap-2.5">
            {agent.workflow.map((step, index) => (
              <article className={`${glassRowClass} grid items-center gap-2.5 rounded-2xl p-3 md:grid-cols-[34px_160px_1fr_36px]`} key={step.id}>
                <span className={`${iconTileClass} size-[34px]`}>{index + 1}</span>
                <input className={inputClass} value={step.title} onChange={(event) => updateWorkflowStep(step.id, { title: event.target.value })} />
                <textarea
                  className={inputClass}
                  value={step.instruction}
                  onChange={(event) => updateWorkflowStep(step.id, { instruction: event.target.value })}
                  rows={2}
                />
                <button
                  className="grid size-9 place-items-center rounded-full bg-red-500/15 text-red-200 transition hover:-translate-y-0.5"
                  onClick={() => removeWorkflowStep(step.id)}
                  aria-label={`Remove ${step.title}`}
                >
                  <RemoveNodeIcon size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
