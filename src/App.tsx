import { type DragEvent as ReactDragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
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
import { agentTemplates } from "./agentTemplates";
import { skillPacks } from "./skillPacks";
import type { AgentDraft, AgentTemplate, BlockKind, BuilderBlock, SkillDraft, SkillPack, WorkflowStep } from "./types";

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

type CanvasNodeKind = BlockKind | "skillPack";
type NucleoIconName =
  | "app-stack"
  | "circle-arrow-down"
  | "circle-copy-plus"
  | "cloud-bolt"
  | "cloud-download"
  | "cube"
  | "gear"
  | "grid"
  | "hammer"
  | "layers"
  | "magic-wand-sparkle"
  | "sparkle"
  | "tab-close"
  | "tasks"
  | "user"
  | "window";

function NucleoIcon({ name, className = "size-6" }: { name: NucleoIconName; className?: string }) {
  return <img alt="" aria-hidden="true" className={`${className} object-contain`} src={`/nucleo-glass/${name}.svg`} />;
}

const kindIcons: Record<CanvasNodeKind, ReactNode> = {
  soul: <NucleoIcon className="size-[22px]" name="user" />,
  model: <NucleoIcon className="size-[22px]" name="gear" />,
  memory: <NucleoIcon className="size-[22px]" name="layers" />,
  skill: <NucleoIcon className="size-[22px]" name="hammer" />,
  workflow: <NucleoIcon className="size-[22px]" name="tasks" />,
  skillPack: <NucleoIcon className="size-[22px]" name="grid" />,
};

const kindLabels: Record<CanvasNodeKind, string> = {
  soul: "Persona",
  model: "0G Model",
  memory: "Memory",
  skill: "Skill",
  workflow: "Workflow",
  skillPack: "Pack",
};

type BuilderNodeData = {
  id: string;
  kind: CanvasNodeKind;
  title: string;
  summary: string;
  category?: string;
  count?: number;
  packId?: string;
} & Record<string, unknown>;
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
const ctaIconClass = "grid size-6 shrink-0 place-items-center rounded-full";
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

function createPackNodeData(pack: SkillPack): BuilderNodeData {
  return {
    id: `pack-${pack.id}`,
    kind: "skillPack",
    title: pack.name,
    summary: pack.summary,
    category: pack.category,
    count: pack.skills.length,
    packId: pack.id,
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

function createPackFlowNode(pack: SkillPack, index: number, position?: { x: number; y: number }): BuilderNode {
  return {
    id: `pack-${pack.id}`,
    type: "builderBlock",
    position: position ?? { x: 330 + (index % 2) * 270, y: 330 + Math.floor(index / 2) * 132 },
    data: createPackNodeData(pack),
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

function findBuilderNodeId(nodeList: BuilderNode[], kind: CanvasNodeKind) {
  return nodeList.find((node) => node.data.kind === kind)?.id;
}

function createFlowEdges(nodes: BuilderNode[]): BuilderEdge[] {
  return nodes.slice(0, -1).map((node, index) => createFlowEdge(node.id, nodes[index + 1].id));
}

function createSkillId(skillName: string) {
  return `${slugify(skillName) || "skill"}-${crypto.randomUUID()}`;
}

function createSkillsFromPacks(packIds: string[], existingSkills: SkillDraft[] = []): SkillDraft[] {
  const existingNames = new Set(existingSkills.map((skill) => skill.name));
  const skills: SkillDraft[] = [];

  for (const packId of packIds) {
    const pack = skillPacks.find((candidate) => candidate.id === packId);
    if (!pack) continue;

    for (const skill of pack.skills) {
      if (existingNames.has(skill.name)) continue;
      existingNames.add(skill.name);
      skills.push({
        id: createSkillId(skill.name),
        name: skill.name,
        description: skill.description,
        enabled: true,
        category: pack.category,
        sourceUrl: skill.sourceUrl,
        packId: pack.id,
      });
    }
  }

  return skills;
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
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100">
            {kindLabels[data.kind]}
            </span>
            {data.count ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-300">
                {data.count} skills
              </span>
            ) : null}
          </div>
          <h3 className="mb-1 text-sm font-black text-white">{data.title}</h3>
          <p className="m-0 text-xs leading-5 text-slate-400">{data.summary}</p>
          {data.category ? <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200">{data.category}</p> : null}
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
  onPackDrop: (packId: string, position: { x: number; y: number }) => void;
  draggedBlockId: string | null;
  setDraggedBlockId: (value: string | null) => void;
  draggedPackId: string | null;
  setDraggedPackId: (value: string | null) => void;
};

function BuilderFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onPaletteDrop,
  onPackDrop,
  draggedBlockId,
  setDraggedBlockId,
  draggedPackId,
  setDraggedPackId,
}: BuilderFlowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedBlockId = event.dataTransfer.getData("application/x-clawbuilder-block") || draggedBlockId;
    const droppedPackId = event.dataTransfer.getData("application/x-clawbuilder-pack") || draggedPackId;
    const paletteBlock = palette.find((block) => block.id === droppedBlockId);
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (droppedPackId) {
      onPackDrop(droppedPackId, position);
      setDraggedPackId(null);
      setDraggedBlockId(null);
      return;
    }

    if (!paletteBlock) return;

    onPaletteDrop(paletteBlock, position);
    setDraggedBlockId(null);
  }

  return (
    <div className="relative z-10 h-[680px] overflow-hidden rounded-3xl border border-dashed border-white/15 bg-black" ref={wrapperRef}>
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
      </ReactFlow>
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/75 p-1.5 shadow-[0_7px_0_rgba(0,0,0,0.58)] backdrop-blur-md">
        <button
          aria-label="Zoom in"
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] hover:border-cyan-300/40"
          onClick={() => void zoomIn()}
          type="button"
        >
          <NucleoIcon className="size-6" name="circle-copy-plus" />
        </button>
        <button
          aria-label="Zoom out"
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] hover:border-cyan-300/40"
          onClick={() => void zoomOut()}
          type="button"
        >
          <NucleoIcon className="size-6" name="tab-close" />
        </button>
        <button
          aria-label="Fit view"
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] hover:border-cyan-300/40"
          onClick={() => void fitView({ padding: 0.18 })}
          type="button"
        >
          <NucleoIcon className="size-6" name="window" />
        </button>
      </div>
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
  const [draggedPackId, setDraggedPackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"manifest" | "agent" | "storage">("manifest");
  const [skillPackQuery, setSkillPackQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  const manifest = useMemo(() => createManifest(agent), [agent]);
  const agentConfig = useMemo(() => createAgentConfig(agent), [agent]);
  const installedPackIds = useMemo(
    () =>
      Array.from(new Set(agent.skills.map((skill) => skill.packId).filter((packId): packId is string => Boolean(packId)))),
    [agent.skills],
  );
  const canvasSkills = useMemo(() => manifest.skills.length, [manifest.skills.length]);
  const templateCount = installedPackIds.length;
  const filteredSkillPacks = useMemo(() => {
    const query = skillPackQuery.trim().toLowerCase();
    if (!query) return skillPacks;

    return skillPacks.filter((pack) =>
      [pack.name, pack.category, pack.summary, pack.recommendedFor, ...pack.skills.map((skill) => `${skill.name} ${skill.description}`)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [skillPackQuery]);

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
      const skillsToAdd = createSkillsFromPacks([pack.id], current.skills);

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

  function addSkillPackToCanvas(packId: string, position?: { x: number; y: number }) {
    const pack = skillPacks.find((candidate) => candidate.id === packId);
    if (!pack) return;

    addSkillPack(pack.id);
    setNodes((currentNodes) => {
      if (currentNodes.some((node) => node.id === `pack-${pack.id}`)) return currentNodes;

      const packNodes = currentNodes.filter((node) => node.data.kind === "skillPack").length;
      const node = createPackFlowNode(pack, packNodes, position);
      return currentNodes.concat(node);
    });
    setEdges((currentEdges) => {
      const source = findBuilderNodeId(nodes, "skill") ?? nodes.at(-1)?.id;
      if (!source || currentEdges.some((edge) => edge.target === `pack-${pack.id}`)) return currentEdges;
      return currentEdges.concat(createFlowEdge(source, `pack-${pack.id}`));
    });
  }

  function addAllVisibleSkillPacks() {
    setAgent((current) => {
      const visiblePackIds = filteredSkillPacks.map((pack) => pack.id);
      const memoryNotes: string[] = [];
      const skillsToAdd = createSkillsFromPacks(visiblePackIds, current.skills);

      for (const pack of filteredSkillPacks) {
        if (!current.memory.includes(pack.name) && skillsToAdd.some((skill) => skill.packId === pack.id)) {
          memoryNotes.push(`- Skill pack installed: ${pack.name} (${pack.category}).`);
        }
      }

      if (skillsToAdd.length === 0) return current;

      const notes = memoryNotes.length > 0 ? `\n${memoryNotes.join("\n")}\n` : "";
      return {
        ...current,
        skills: current.skills.concat(skillsToAdd),
        memory: `${current.memory.trimEnd()}${notes}`,
      };
    });
  }

  function addAllVisibleSkillPacksToCanvas() {
    addAllVisibleSkillPacks();
    setNodes((currentNodes) => {
      const existingIds = new Set(currentNodes.map((node) => node.id));
      const packNodes = currentNodes.filter((node) => node.data.kind === "skillPack").length;
      const nodesToAdd = filteredSkillPacks
        .filter((pack) => !existingIds.has(`pack-${pack.id}`))
        .map((pack, index) => createPackFlowNode(pack, packNodes + index));

      return currentNodes.concat(nodesToAdd);
    });
    setEdges((currentEdges) => {
      const source = findBuilderNodeId(nodes, "skill");

      if (!source) return currentEdges;
      const existingTargets = new Set(currentEdges.map((edge) => edge.target));
      return currentEdges.concat(
        filteredSkillPacks
          .filter((pack) => !existingTargets.has(`pack-${pack.id}`))
          .map((pack) => createFlowEdge(source, `pack-${pack.id}`)),
      );
    });
  }

  function applyAgentTemplate(template: AgentTemplate) {
    const baseSkills = starterAgent.skills.map((skill) => ({
      ...skill,
      id: createSkillId(skill.name),
    }));
    const templateSkills = createSkillsFromPacks(template.skillPackIds, baseSkills);

    const templateSlug = slugify(template.name) || "agent";
    setAgent({
      ...starterAgent,
      name: template.name,
      description: template.description,
      soul: template.soul,
      memory: `${template.memory.trimEnd()}\n${template.skillPackIds
        .map((packId) => {
          const pack = skillPacks.find((candidate) => candidate.id === packId);
          return pack ? `- Template pack: ${pack.name} (${pack.category}).` : "";
        })
        .filter(Boolean)
        .join("\n")}\n`,
      skills: baseSkills.concat(templateSkills),
      workflow: template.workflow.map((step) => ({ ...step, id: `${slugify(step.title) || "step"}-${crypto.randomUUID()}` })),
      storage: {
        packageUri: `0g://package/${templateSlug}/{rootHash}`,
        memoryUri: `0g://memory/${templateSlug}/MEMORY.md`,
        logUri: `0g://logs/${templateSlug}/{sessionId}.jsonl`,
      },
    });
    setNodes((currentNodes) => {
      const baseNodes = currentNodes.filter((node) => node.data.kind !== "skillPack");
      return baseNodes.concat(
        template.skillPackIds
          .map((packId) => skillPacks.find((candidate) => candidate.id === packId))
          .filter((pack): pack is SkillPack => Boolean(pack))
          .map((pack, index) => createPackFlowNode(pack, index)),
      );
    });
    setEdges((currentEdges) => {
      const source = findBuilderNodeId(nodes, "skill");
      const baseEdges = currentEdges.filter((edge) => !edge.target.startsWith("pack-"));
      if (!source) return baseEdges;
      return baseEdges.concat(template.skillPackIds.map((packId) => createFlowEdge(source, `pack-${packId}`)));
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

  function handlePackDragStart(event: ReactDragEvent<HTMLElement>, packId: string) {
    event.dataTransfer.setData("application/x-clawbuilder-pack", packId);
    event.dataTransfer.effectAllowed = "copy";
    setDraggedPackId(packId);
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

    if (block.kind === "skill") addSkill();
    if (block.kind === "workflow") addWorkflowStep();
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
        <div className="flex items-center gap-4">
          <div className={`${iconTileClass} size-11 rounded-full`}>
            <NucleoIcon className="size-7" name="sparkle" />
          </div>
          <span className="text-base font-black tracking-[-0.02em] sm:text-lg">ClawBuilder 0G</span>
        </div>
        <div className="hidden items-center gap-7 text-sm font-extrabold text-slate-400 sm:flex">
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
              className={`${buttonDepthClass} inline-flex items-center justify-center gap-2.5 rounded-full border border-cyan-200/60 bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-200`}
              href="#builder"
            >
              <span className={`${ctaIconClass} bg-cyan-100/55`}>
                <NucleoIcon className="size-5" name="sparkle" />
              </span>
              Open builder
            </a>
            <button
              className={`${buttonDepthClass} inline-flex items-center justify-center gap-2.5 rounded-full border border-white/12 bg-[#040404] px-5 py-2.5 text-sm font-extrabold text-slate-100 hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-70`}
              onClick={exportPackage}
              disabled={exporting}
            >
              <span className={`${ctaIconClass} border border-cyan-200/20 bg-cyan-300/10`}>
                <NucleoIcon className="size-5" name="circle-arrow-down" />
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
                  <NucleoIcon className="size-7" name="cube" />
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

      <section className={`${panelClass} mb-4`} id="templates">
        <div className={panelTitleClass}>
          <span className={panelIconClass}>
            <NucleoIcon className="size-6" name="cube" />
          </span>
          One-click agent templates
        </div>
        <div className="relative z-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {agentTemplates.map((template) => (
            <article className={`${glassRowClass} grid gap-3 rounded-2xl p-4`} key={template.id}>
              <div>
                <h3 className="m-0 text-lg font-black tracking-[-0.03em] text-white">{template.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{template.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.skillPackIds.map((packId) => {
                  const pack = skillPacks.find((candidate) => candidate.id === packId);
                  return pack ? (
                    <span
                      className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100"
                      key={packId}
                    >
                      {pack.name}
                    </span>
                  ) : null;
                })}
              </div>
              <button
                className={`${buttonDepthClass} mt-auto rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-sm font-black text-white`}
                onClick={() => applyAgentTemplate(template)}
                type="button"
              >
                Load template
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(560px,1fr)_360px]">
        <section className={`${panelClass} min-h-[760px]`} id="builder">
          <div className={`${panelTitleClass} items-start justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="magic-wand-sparkle" />
              </span>
              <span>
                Combo builder canvas
                <span className="mt-1 block text-xs font-semibold text-slate-500">Drop packs onto the graph to assemble the agent&apos;s capability stack.</span>
              </span>
            </span>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-[#050505] text-center">
              {[
                ["packs", installedPackIds.length],
                ["skills", canvasSkills],
                ["steps", agent.workflow.length],
              ].map(([label, value]) => (
                <div className="border-r border-white/10 px-3 py-2 last:border-r-0" key={label}>
                  <div className="text-base font-black text-white">{value}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <ReactFlowProvider>
            <BuilderFlowCanvas
              draggedBlockId={draggedBlockId}
              draggedPackId={draggedPackId}
              edges={edges}
              nodes={nodes}
              onConnect={handleConnect}
              onEdgesChange={onEdgesChange}
              onNodesChange={onNodesChange}
              onPackDrop={addSkillPackToCanvas}
              onPaletteDrop={addFlowBlock}
              setDraggedBlockId={setDraggedBlockId}
              setDraggedPackId={setDraggedPackId}
            />
          </ReactFlowProvider>
          <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#050505] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Current agent</p>
              <p className="mt-1 truncate text-sm font-black text-white">{agent.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#050505] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Template packs</p>
              <p className="mt-1 text-sm font-black text-white">{templateCount} loaded</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#050505] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Export target</p>
              <p className="mt-1 truncate text-sm font-black text-white">{agent.storage.packageUri}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:sticky xl:top-4">
          <aside className={panelClass}>
            <div className={panelTitleClass}>
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="grid" />
              </span>
              Base blocks
            </div>
            {palette.map((block) => (
              <article
                className={`${glassRowClass} mt-2.5 grid cursor-grab grid-cols-[40px_1fr] gap-3 rounded-[1.25rem] p-3 first:mt-0`}
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

          <section className={panelClass} id="export-preview">
            <div className={panelTitleClass}>
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="cube" />
              </span>
              Live export preview
            </div>
            <div className="relative z-10 mb-3 flex flex-wrap gap-2">
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
            <pre className="relative z-10 m-0 max-h-[350px] min-h-[350px] overflow-auto rounded-3xl border border-white/10 bg-black p-4 text-xs text-cyan-100">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </section>
        </section>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3" id="config">
        <section className={panelClass}>
          <div className={panelTitleClass}>
            <span className={panelIconClass}>
              <NucleoIcon className="size-6" name="user" />
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
              <NucleoIcon className="size-6" name="gear" />
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
              <NucleoIcon className="size-6" name="layers" />
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

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)]">
        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="grid" />
              </span>
              Prebuilt skill packs
            </span>
            <button
              className={`${buttonDepthClass} rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-xs font-black text-white`}
              onClick={addAllVisibleSkillPacksToCanvas}
              type="button"
            >
              Add visible to canvas
            </button>
          </div>
          <p className="relative z-10 mb-4 text-sm leading-6 text-slate-400">
            Curated from VoltAgent&apos;s awesome-openclaw-skills categories and exported as normal OpenClaw-compatible
            <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5 text-cyan-100">SKILL.md</code>
            folders.
          </p>
          <input
            className={`${inputClass} relative z-10 mb-3`}
            onChange={(event) => setSkillPackQuery(event.target.value)}
            placeholder="Search packs, categories, skills..."
            value={skillPackQuery}
          />
          <div className="relative z-10 grid gap-2.5">
            {filteredSkillPacks.map((pack) => {
              const installed = hasSkillPack(pack.id);
              const installedCount = pack.skills.filter((skill) => agent.skills.some((agentSkill) => agentSkill.name === skill.name)).length;
              return (
                <article
                  className={`${glassRowClass} grid cursor-grab gap-3 rounded-2xl p-3.5`}
                  draggable
                  key={pack.id}
                  onDragStart={(event) => handlePackDragStart(event, pack.id)}
                  onDragEnd={() => setDraggedPackId(null)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-base font-black text-white">{pack.name}</h3>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-100">
                          {pack.category}
                        </span>
                      </div>
                      <p className="m-0 text-sm leading-6 text-slate-400">{pack.summary}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">Best for: {pack.recommendedFor}</p>
                    </div>
                    <button
                      className={`${buttonDepthClass} shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-black ${
                        installed ? "bg-cyan-300 text-slate-950" : "bg-[#050505] text-white"
                      }`}
                      onClick={() => addSkillPackToCanvas(pack.id)}
                      type="button"
                    >
                      {installed ? `${installedCount}/${pack.skills.length} added` : `Drop / add ${pack.skills.length}`}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="rounded-full border border-white/10 bg-[#050505] px-2.5 py-1 text-[11px] font-bold text-cyan-100 transition hover:border-cyan-300/30"
                      href={pack.source}
                      rel="noreferrer"
                      target="_blank"
                    >
                      source category
                    </a>
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
                <NucleoIcon className="size-6" name="hammer" />
              </span>
              Skills
            </span>
            <button className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-sm font-extrabold text-white`} onClick={addSkill}>
              <span className={buttonIconClass}>
                <NucleoIcon className="size-5" name="circle-copy-plus" />
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
                  <NucleoIcon className="size-5" name="tab-close" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="tasks" />
              </span>
              Workflow
            </span>
            <button className={`${buttonDepthClass} inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#050505] px-3 py-2 text-sm font-extrabold text-white`} onClick={addWorkflowStep}>
              <span className={buttonIconClass}>
                <NucleoIcon className="size-5" name="circle-copy-plus" />
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
                  <NucleoIcon className="size-5" name="tab-close" />
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
