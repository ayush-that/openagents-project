import { type DragEvent as ReactDragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  CircleStackIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  PlusIcon,
  QueueListIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import * as THREE from "three";
import {
  ZERO_G_ROUTER_URL,
  buildAgentZip,
  createAgentConfig,
  createManifest,
  downloadBlob,
  starterAgent,
} from "./agentPackage";
import { skillPacks } from "./skillPacks";
import type { AgentDraft, BlockKind, BuilderBlock, SkillDraft, WorkflowStep } from "./types";

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
  soul: <UserCircleIcon className="size-[18px]" />,
  model: <CpuChipIcon className="size-[18px]" />,
  memory: <CircleStackIcon className="size-[18px]" />,
  skill: <WrenchScrewdriverIcon className="size-[18px]" />,
  workflow: <QueueListIcon className="size-[18px]" />,
};

const kindLabels: Record<BlockKind, string> = {
  soul: "Persona",
  model: "0G Model",
  memory: "Memory",
  skill: "Skill",
  workflow: "Workflow",
};

type BuilderNodeData = BuilderBlock & Record<string, unknown>;
type BuilderNode = Node<BuilderNodeData, "builderBlock">;
type BuilderEdge = Edge;

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
  "grid place-items-center rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(103,232,249,0.07)_45%,rgba(255,255,255,0.03))] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-14px_24px_rgba(103,232,249,0.05),0_10px_18px_rgba(0,0,0,0.42)] backdrop-blur-md";
const panelIconClass = `${iconTileClass} size-9 shrink-0`;
const buttonIconClass = `${iconTileClass} size-7 rounded-full text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_5px_0_rgba(0,0,0,0.36)]`;
const buttonDepthClass =
  "shadow-[0_6px_0_rgba(0,0,0,0.72)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_rgba(0,0,0,0.72)] active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.72)]";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function createCanvasBlock(block: BuilderBlock): BuilderBlock {
  return { ...block, id: `canvas-${block.kind}-${crypto.randomUUID()}` };
}

function createBuilderNodeData(block: BuilderBlock): BuilderNodeData {
  return {
    id: block.id,
    kind: block.kind,
    title: block.title,
    summary: block.summary,
  };
}

function createFlowNode(block: BuilderBlock, index: number): BuilderNode {
  return {
    id: block.id,
    type: "builderBlock",
    position: { x: 72 + (index % 2) * 280, y: 40 + index * 132 },
    data: createBuilderNodeData(block),
  };
}

function createFlowEdge(source: string, target: string): BuilderEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    animated: true,
    style: { stroke: "rgba(103, 232, 249, 0.55)", strokeWidth: 1.5 },
  };
}

function createFlowEdges(nodes: BuilderNode[]): BuilderEdge[] {
  return nodes.slice(0, -1).map((node, index) => createFlowEdge(node.id, nodes[index + 1].id));
}

function createSkillId(skillName: string) {
  return `${slugify(skillName) || "skill"}-${crypto.randomUUID()}`;
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
    const ringGeometries: THREE.TorusGeometry[] = [];
    for (const [index, rotation] of [
      [0, 0],
      [Math.PI / 2.7, Math.PI / 5],
      [-Math.PI / 3.2, Math.PI / 1.8],
    ].entries()) {
      const ringGeometry = new THREE.TorusGeometry(2.2 + index * 0.18, 0.01, 12, 120);
      ringGeometries.push(ringGeometry);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
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
      ringGeometries.forEach((geometry) => geometry.dispose());
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

function BuilderFlowNode({ data }: { data: BuilderNodeData }) {
  return (
    <div className={`${glassRowClass} w-[230px] rounded-[1.25rem] p-3.5`}>
      <Handle className="!size-3 !border !border-cyan-200/70 !bg-cyan-300" position={Position.Top} type="target" />
      <div className="grid grid-cols-[36px_1fr] gap-3">
        <div className={`${iconTileClass} size-9`}>{kindIcons[data.kind]}</div>
        <div>
          <div className="mb-1 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100">
            {kindLabels[data.kind]}
          </div>
          <h3 className="mb-1 text-sm font-black text-white">{data.title}</h3>
          <p className="m-0 text-xs leading-5 text-slate-400">{data.summary}</p>
        </div>
      </div>
      <Handle className="!size-3 !border !border-cyan-200/70 !bg-cyan-300" position={Position.Bottom} type="source" />
    </div>
  );
}

const nodeTypes = {
  builderBlock: BuilderFlowNode,
};

type BuilderFlowCanvasProps = {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  onNodesChange: OnNodesChange<BuilderNode>;
  onEdgesChange: OnEdgesChange<BuilderEdge>;
  onConnect: (connection: Connection) => void;
  onPaletteDrop: (block: BuilderBlock, position: { x: number; y: number }) => void;
  draggedBlockId: string | null;
  setDraggedBlockId: (value: string | null) => void;
};

function BuilderFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onPaletteDrop,
  draggedBlockId,
  setDraggedBlockId,
}: BuilderFlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedBlockId = event.dataTransfer.getData("application/x-clawbuilder-block") || draggedBlockId;
    const paletteBlock = palette.find((block) => block.id === droppedBlockId);
    if (!paletteBlock) return;

    onPaletteDrop(
      paletteBlock,
      screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
    );
    setDraggedBlockId(null);
  }

  return (
    <div className="relative z-10 h-[560px] overflow-hidden rounded-3xl border border-dashed border-white/15 bg-black" ref={wrapperRef}>
      <ReactFlow
        colorMode="dark"
        connectionLineStyle={{ stroke: "rgba(103, 232, 249, 0.7)", strokeWidth: 1.5 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "rgba(103, 232, 249, 0.55)", strokeWidth: 1.5 },
        }}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
        nodes={nodes}
        onConnect={onConnect}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(103, 232, 249, 0.2)" gap={24} size={1} variant={BackgroundVariant.Dots} />
        <MiniMap
          className="!border !border-white/10 !bg-black/80"
          maskColor="rgba(0, 0, 0, 0.5)"
          nodeColor="rgba(103, 232, 249, 0.5)"
          nodeStrokeColor="rgba(255, 255, 255, 0.25)"
          pannable
          zoomable
        />
        <Controls className="!border !border-white/10 !bg-black/80 !shadow-[0_8px_0_rgba(0,0,0,0.55)] [&_button]:!border-white/10 [&_button]:!bg-black [&_button]:!text-cyan-100" />
      </ReactFlow>
    </div>
  );
}

function App() {
  const [agent, setAgent] = useState<AgentDraft>(starterAgent);
  const initialNodes = useMemo(() => palette.map((block, index) => createFlowNode(createCanvasBlock(block), index)), []);
  const initialEdges = useMemo(() => createFlowEdges(initialNodes), [initialNodes]);
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>(initialEdges);
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
          id: createSkillId("custom-skill"),
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

  function hasSkillPack(packId: string) {
    return agent.skills.some((skill) => skill.packId === packId);
  }

  function addSkillPack(packId: string) {
    const pack = skillPacks.find((candidate) => candidate.id === packId);
    if (!pack) return;

    setAgent((current) => {
      const existingNames = new Set(current.skills.map((skill) => skill.name));
      const skillsToAdd: SkillDraft[] = pack.skills
        .filter((skill) => !existingNames.has(skill.name))
        .map((skill) => ({
          id: createSkillId(skill.name),
          name: skill.name,
          description: skill.description,
          enabled: true,
          category: pack.category,
          sourceUrl: skill.sourceUrl,
          packId: pack.id,
        }));

      if (skillsToAdd.length === 0) return current;

      return {
        ...current,
        skills: current.skills.concat(skillsToAdd),
        memory: current.memory.includes(pack.name)
          ? current.memory
          : `${current.memory.trimEnd()}\n- Skill pack installed: ${pack.name} (${pack.category}).\n`,
      };
    });
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

  function handleDragStart(event: ReactDragEvent<HTMLElement>, blockId: string) {
    event.dataTransfer.setData("application/x-clawbuilder-block", blockId);
    event.dataTransfer.effectAllowed = "copyMove";
    setDraggedBlockId(blockId);
  }

  function addFlowBlock(block: BuilderBlock, position: { x: number; y: number }) {
    const canvasBlock = createCanvasBlock(block);
    const previousNode = nodes.at(-1);
    const node: BuilderNode = {
      id: canvasBlock.id,
      type: "builderBlock",
      position,
      data: createBuilderNodeData(canvasBlock),
    };

    setNodes((currentNodes) => currentNodes.concat(node));
    if (previousNode) {
      setEdges((currentEdges) => currentEdges.concat(createFlowEdge(previousNode.id, node.id)));
    }
  }

  function handleConnect(connection: Connection) {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: "rgba(103, 232, 249, 0.65)", strokeWidth: 1.5 },
        },
        currentEdges,
      ),
    );
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
          <div className={`${iconTileClass} size-9 rounded-full`}>
            <SparklesIcon className="size-[18px]" />
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
              className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200`}
              href="#builder"
            >
              <span className={buttonIconClass}>
                <SparklesIcon className="size-[14px]" />
              </span>
              Open builder
            </a>
            <button
              className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-5 py-3 text-sm font-bold text-slate-100 hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-70`}
              onClick={exportPackage}
              disabled={exporting}
            >
              <span className={buttonIconClass}>
                <ArrowDownTrayIcon className="size-[14px]" />
              </span>
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
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-[0_18px_0_rgba(0,0,0,0.55)] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className={`${iconTileClass} size-10`}>
                  <CubeTransparentIcon className="size-5" />
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
            <span className={panelIconClass}>
              <Squares2X2Icon className="size-[18px]" />
            </span>
            Drag blocks
          </div>
          {palette.map((block) => (
            <article
              className={`${glassRowClass} mt-2.5 grid cursor-grab grid-cols-[40px_1fr] gap-3 rounded-[1.25rem] p-3.5 first:mt-0`}
              draggable
              key={block.id}
              onDragStart={(event) => handleDragStart(event, block.id)}
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
            <span className={panelIconClass}>
              <SparklesIcon className="size-[18px]" />
            </span>
            React Flow agent canvas
          </div>
          <ReactFlowProvider>
            <BuilderFlowCanvas
              draggedBlockId={draggedBlockId}
              edges={edges}
              nodes={nodes}
              onConnect={handleConnect}
              onEdgesChange={onEdgesChange}
              onNodesChange={onNodesChange}
              onPaletteDrop={addFlowBlock}
              setDraggedBlockId={setDraggedBlockId}
            />
          </ReactFlowProvider>
        </section>

        <section className={`${panelClass} xl:sticky xl:top-4`} id="export-preview">
          <div className={panelTitleClass}>
            <span className={panelIconClass}>
              <CubeTransparentIcon className="size-[18px]" />
            </span>
            Live export preview
          </div>
          <div className="relative z-10 mb-3 flex gap-2">
            <button
              className={`${buttonDepthClass} rounded-full px-3 py-2 ${
                activeTab === "manifest"
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-[#050505] text-slate-400"
              }`}
              onClick={() => setActiveTab("manifest")}
            >
              manifest.0g.json
            </button>
            <button
              className={`${buttonDepthClass} rounded-full px-3 py-2 ${
                activeTab === "agent"
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-[#050505] text-slate-400"
              }`}
              onClick={() => setActiveTab("agent")}
            >
              agent.json
            </button>
            <button
              className={`${buttonDepthClass} rounded-full px-3 py-2 ${
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
            <span className={panelIconClass}>
              <UserCircleIcon className="size-[18px]" />
            </span>
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
            <span className={panelIconClass}>
              <CpuChipIcon className="size-[18px]" />
            </span>
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
            <span className={panelIconClass}>
              <CircleStackIcon className="size-[18px]" />
            </span>
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
          <div className={panelTitleClass}>
            <span className={panelIconClass}>
              <Squares2X2Icon className="size-[18px]" />
            </span>
            Prebuilt skill packs
          </div>
          <p className="relative z-10 mb-4 text-sm leading-6 text-slate-400">
            Curated from VoltAgent&apos;s awesome-openclaw-skills categories and exported as normal OpenClaw-compatible
            <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5 text-cyan-100">SKILL.md</code>
            folders.
          </p>
          <div className="relative z-10 grid gap-2.5">
            {skillPacks.map((pack) => {
              const installed = hasSkillPack(pack.id);
              return (
                <article className={`${glassRowClass} grid gap-3 rounded-2xl p-3.5`} key={pack.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-base font-black text-white">{pack.name}</h3>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100">
                          {pack.category}
                        </span>
                      </div>
                      <p className="m-0 text-sm leading-6 text-slate-400">{pack.summary}</p>
                    </div>
                    <button
                      className={`${buttonDepthClass} shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-black ${
                        installed ? "bg-cyan-300 text-slate-950" : "bg-[#050505] text-white"
                      }`}
                      onClick={() => addSkillPack(pack.id)}
                      type="button"
                    >
                      {installed ? "Added" : `Add ${pack.skills.length}`}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pack.skills.map((skill) => (
                      <a
                        className="rounded-full border border-white/10 bg-black px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
                        href={skill.sourceUrl}
                        key={skill.name}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {skill.name}
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <WrenchScrewdriverIcon className="size-[18px]" />
              </span>
              Skills
            </span>
            <button className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-sm font-extrabold text-white`} onClick={addSkill}>
              <span className={buttonIconClass}>
                <PlusIcon className="size-[13px]" />
              </span>
              Add
            </button>
          </div>
          <div className="relative z-10 grid gap-2.5">
            {agent.skills.map((skill) => (
              <article className={`${glassRowClass} grid items-center gap-2.5 rounded-2xl p-3 md:grid-cols-[180px_1fr_auto_auto_36px]`} key={skill.id}>
                <input
                  className={inputClass}
                  value={skill.name}
                  onChange={(event) => updateSkill(skill.id, { name: event.target.value })}
                />
                <input
                  className={inputClass}
                  value={skill.description}
                  onChange={(event) => updateSkill(skill.id, { description: event.target.value })}
                />
                {skill.category ? (
                  <a
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:border-cyan-200/50"
                    href={skill.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {skill.category}
                  </a>
                ) : null}
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
                  className={`${buttonDepthClass} ${iconTileClass} size-9 rounded-full text-red-200`}
                  onClick={() => removeSkill(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                >
                  <TrashIcon className="size-4" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <QueueListIcon className="size-[18px]" />
              </span>
              Workflow
            </span>
            <button className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-sm font-extrabold text-white`} onClick={addWorkflowStep}>
              <span className={buttonIconClass}>
                <PlusIcon className="size-[13px]" />
              </span>
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
                  className={`${buttonDepthClass} ${iconTileClass} size-9 rounded-full text-red-200`}
                  onClick={() => removeWorkflowStep(step.id)}
                  aria-label={`Remove ${step.title}`}
                >
                  <TrashIcon className="size-4" />
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
