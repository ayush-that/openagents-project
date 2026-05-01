import { type DragEvent as ReactDragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
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
    summary: "Identity, tone, goals, operating rules.",
  },
  {
    id: "palette-model",
    kind: "model",
    title: "0G Compute model",
    summary: "OpenAI-compatible 0G router target.",
  },
  {
    id: "palette-memory",
    kind: "memory",
    title: "MEMORY.md",
    summary: "Durable memory mapped to 0G Storage.",
  },
  {
    id: "palette-skill",
    kind: "skill",
    title: "SKILL.md",
    summary: "OpenClaw/FastClaw capability module.",
  },
  {
    id: "palette-workflow",
    kind: "workflow",
    title: "Runbook step",
    summary: "Ordered execution step for every run.",
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

function BrandMark({ className = "size-10" }: { className?: string }) {
  return <img alt="ClawBuilder 0G logo" className={`${className} object-contain`} src={logoSrc} />;
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
  workflow: "Runbook",
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

const logoSrc = "/brand/clawbuilder-logo.svg";

const panelClass =
  "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.98),rgba(0,0,0,0.96))] p-5 shadow-[0_14px_0_rgba(255,255,255,0.035),inset_0_1px_0_rgba(255,255,255,0.08)]";
const panelTitleClass = "relative z-10 mb-4 flex items-center gap-2.5 font-semibold text-[#fafafa]";
const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black px-3 py-2.5 text-[#fafafa] outline-none transition placeholder:text-zinc-500 focus:border-white/45 focus:ring-4 focus:ring-white/8";
const labelClass = "mono-font relative z-10 mb-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400";
const glassRowClass =
  "relative z-10 border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.92),rgba(0,0,0,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-white/25 hover:bg-[#0b0b0b]";
const iconTileClass =
  "grid place-items-center rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(250,250,250,0.13),rgba(250,250,250,0.035))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_0_rgba(255,255,255,0.035)] backdrop-blur-md";
const panelIconClass = `${iconTileClass} size-9 shrink-0`;
const buttonIconClass = `${iconTileClass} size-7 rounded-full text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_5px_0_rgba(0,0,0,0.36)]`;
const ctaIconClass = "grid size-6 shrink-0 place-items-center";
const buttonDepthClass =
  "shadow-[0_6px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_rgba(255,255,255,0.08)] active:translate-y-1 active:shadow-[0_2px_0_rgba(255,255,255,0.08)]";
const primaryButtonClass =
  "border border-white bg-[#fafafa] text-black hover:bg-white";
const heroSecondaryButtonClass =
  "border border-white/70 bg-[#fafafa] text-black hover:bg-white";
const secondaryButtonClass =
  "border border-white/15 bg-black text-[#fafafa] hover:border-white/40";
const chipClass =
  "mono-font rounded-full border border-white/12 bg-white/[0.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-100";
const flowEdgeStroke = "rgba(250, 250, 250, 0.58)";
const flowEdgeActiveStroke = "rgba(250, 250, 250, 0.72)";

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
    style: { stroke: flowEdgeStroke, strokeWidth: 1.75 },
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

const tesseractVertices = [
  [-1, -1, -1, -1],
  [1, -1, -1, -1],
  [-1, 1, -1, -1],
  [1, 1, -1, -1],
  [-1, -1, 1, -1],
  [1, -1, 1, -1],
  [-1, 1, 1, -1],
  [1, 1, 1, -1],
  [-1, -1, -1, 1],
  [1, -1, -1, 1],
  [-1, 1, -1, 1],
  [1, 1, -1, 1],
  [-1, -1, 1, 1],
  [1, -1, 1, 1],
  [-1, 1, 1, 1],
  [1, 1, 1, 1],
] as const;

const tesseractEdges = Array.from({ length: tesseractVertices.length }, (_, index) =>
  [1, 2, 4, 8]
    .map((bit) => [index, index ^ bit] as const)
    .filter(([source, target]) => source < target),
).flat();

function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    const mountElement: HTMLDivElement = currentMount;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.08, 8.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountElement.append(renderer.domElement);

    const tesseractGeometry = new THREE.BufferGeometry();
    const tesseractPositions = new Float32Array(tesseractEdges.length * 2 * 3);
    tesseractGeometry.setAttribute("position", new THREE.BufferAttribute(tesseractPositions, 3));
    const tesseract = new THREE.LineSegments(
      tesseractGeometry,
      new THREE.LineBasicMaterial({ color: 0xfafafa, transparent: true, opacity: 0.78 }),
    );
    scene.add(tesseract);

    const shadowGeometry = new THREE.BufferGeometry();
    const shadowPositions = new Float32Array(tesseractEdges.length * 2 * 3);
    shadowGeometry.setAttribute("position", new THREE.BufferAttribute(shadowPositions, 3));
    const shadow = new THREE.LineSegments(
      shadowGeometry,
      new THREE.LineBasicMaterial({ color: 0x71717a, transparent: true, opacity: 0.24 }),
    );
    shadow.scale.setScalar(1.08);
    scene.add(shadow);

    const vertexGeometry = new THREE.BufferGeometry();
    const vertexPositions = new Float32Array(tesseractVertices.length * 3);
    vertexGeometry.setAttribute("position", new THREE.BufferAttribute(vertexPositions, 3));
    const vertices = new THREE.Points(
      vertexGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.92 }),
    );
    scene.add(vertices);

    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(96 * 3);
    for (let i = 0; i < 96; i += 1) {
      const radius = 2.6 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.48 }),
    );
    scene.add(particles);

    function rotate4d(vertex: readonly number[], angleA: number, angleB: number) {
      let [x, y, z, w] = vertex;
      const cosA = Math.cos(angleA);
      const sinA = Math.sin(angleA);
      const xyX = x * cosA - y * sinA;
      const xyY = x * sinA + y * cosA;
      x = xyX;
      y = xyY;
      const cosB = Math.cos(angleB);
      const sinB = Math.sin(angleB);
      const zwZ = z * cosB - w * sinB;
      const zwW = z * sinB + w * cosB;
      z = zwZ;
      w = zwW;
      const depth = 2.8 / (3.8 - w);
      return new THREE.Vector3(x * depth * 1.12, y * depth * 1.12, z * depth * 1.12);
    }

    function updateTesseract(angle: number) {
      const projected = tesseractVertices.map((vertex) => rotate4d(vertex, angle, angle * 0.72));
      tesseractEdges.forEach(([source, target], index) => {
        const sourceVertex = projected[source];
        const targetVertex = projected[target];
        const offset = index * 6;
        tesseractPositions.set([sourceVertex.x, sourceVertex.y, sourceVertex.z, targetVertex.x, targetVertex.y, targetVertex.z], offset);
        shadowPositions.set(
          [sourceVertex.x + 0.08, sourceVertex.y - 0.08, sourceVertex.z - 0.1, targetVertex.x + 0.08, targetVertex.y - 0.08, targetVertex.z - 0.1],
          offset,
        );
      });
      projected.forEach((vertex, index) => {
        vertexPositions.set([vertex.x, vertex.y, vertex.z], index * 3);
      });
      tesseractGeometry.attributes.position.needsUpdate = true;
      shadowGeometry.attributes.position.needsUpdate = true;
      vertexGeometry.attributes.position.needsUpdate = true;
    }

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
      updateTesseract(frame * 0.95);
      tesseract.rotation.y = Math.sin(frame * 0.42) * 0.22;
      shadow.rotation.copy(tesseract.rotation);
      vertices.rotation.copy(tesseract.rotation);
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
      tesseractGeometry.dispose();
      shadowGeometry.dispose();
      vertexGeometry.dispose();
      tesseract.material.dispose();
      shadow.material.dispose();
      vertices.material.dispose();
      particles.material.dispose();
      mountElement.removeChild(renderer.domElement);
    };
  }, []);

  return <div aria-hidden="true" className="absolute inset-0" ref={mountRef} />;
}

function BuilderFlowNode({ data }: { data: BuilderNodeData }) {
  return (
    <div className={`${glassRowClass} w-[230px] rounded-[1.25rem] p-3.5`}>
      <Handle className="!size-3 !border !border-white/80 !bg-white" position={Position.Top} type="target" />
      <div className="grid grid-cols-[36px_1fr] gap-3">
        <div className={`${iconTileClass} size-9`}>{kindIcons[data.kind]}</div>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className={chipClass}>
              {kindLabels[data.kind]}
            </span>
            {data.count ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-200">
                {data.count} skills
              </span>
            ) : null}
          </div>
          <h3 className="mb-1 text-lg leading-none text-[#fafafa]">{data.title}</h3>
          <p className="m-0 text-xs font-medium leading-4 tracking-[-0.015em] text-zinc-400">{data.summary}</p>
          {data.category ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-200">{data.category}</p> : null}
        </div>
      </div>
      <Handle className="!size-3 !border !border-white/80 !bg-white" position={Position.Bottom} type="source" />
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
    <div
      className="relative z-10 h-[520px] overflow-hidden rounded-3xl border border-dashed border-white/14 bg-[radial-gradient(circle,rgba(255,255,255,0.10)_1px,transparent_1.2px),linear-gradient(180deg,#050505,#000)] bg-[size:18px_18px,auto] xl:h-auto xl:flex-1"
      ref={wrapperRef}
    >
      <ReactFlow
        colorMode="dark"
        connectionLineStyle={{ stroke: flowEdgeActiveStroke, strokeWidth: 1.5 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: flowEdgeStroke, strokeWidth: 1.5 },
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
        <Background color="rgba(255, 255, 255, 0.16)" gap={24} size={1} variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/12 bg-black/80 p-1.5 shadow-[0_7px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
        <button
          aria-label="Zoom in"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/[0.05] hover:border-white/40"
          onClick={() => void zoomIn()}
          title="Zoom into the agent canvas."
          type="button"
        >
          <NucleoIcon className="size-6" name="circle-copy-plus" />
        </button>
        <button
          aria-label="Zoom out"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/[0.05] hover:border-white/40"
          onClick={() => void zoomOut()}
          title="Zoom out to see more of the agent graph."
          type="button"
        >
          <NucleoIcon className="size-6" name="tab-close" />
        </button>
        <button
          aria-label="Fit view"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/[0.05] hover:border-white/40"
          onClick={() => void fitView({ padding: 0.18 })}
          title="Fit every block and pack into view."
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
          style: { stroke: flowEdgeActiveStroke, strokeWidth: 1.75 },
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
    <main className="relative mx-auto grid w-[min(1180px,calc(100vw-32px))] gap-10 px-0 py-6 text-[#f4fbff] lg:gap-12">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_28rem),linear-gradient(180deg,#000_0%,#030303_45%,#000_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.13)_1px,transparent_1.2px)] bg-[size:18px_18px] opacity-30 [mask-image:radial-gradient(circle_at_50%_0%,black,transparent_78%)]" />

      <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/80 px-4 py-3 shadow-[0_10px_0_rgba(255,255,255,0.035),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <BrandMark className="size-12" />
          <span className="text-base font-semibold tracking-[-0.03em] text-[#fafafa] sm:text-lg">ClawBuilder 0G</span>
        </div>
        <div className="hidden items-center gap-7 text-sm font-semibold text-zinc-500 sm:flex">
          <a className="transition hover:text-white" href="#builder">Builder</a>
          <a className="transition hover:text-white" href="#config">Config</a>
          <a className="transition hover:text-white" href="#export-preview">Export</a>
        </div>
      </nav>

      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
        <div className="py-8">
          <div className="mono-font mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-200">
            <span className="size-2 rounded-full bg-white" />
            ClawBuilder 0G · agent foundry
          </div>
          <h1 className="display-font max-w-4xl text-[clamp(44px,7.4vw,92px)] leading-[0.9] text-[#fafafa]">
            Build 0G agents without runtime work.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-7 tracking-[-0.025em] text-zinc-300 sm:text-lg">
            Compose persona, model, memory, skills, and runbook on one canvas. Export a clean
            OpenClaw/FastClaw package with 0G Compute and Storage wired in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className={`${buttonDepthClass} ${primaryButtonClass} inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-black`}
              href="#builder"
              title="Jump to the drag-and-drop builder canvas."
            >
              <span className={ctaIconClass}>
                <NucleoIcon className="size-5" name="sparkle" />
              </span>
              Open builder
            </a>
            <button
              className={`${buttonDepthClass} ${heroSecondaryButtonClass} inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-70`}
              onClick={exportPackage}
              disabled={exporting}
              title="Download the current agent as an OpenClaw-style 0G package zip."
            >
              <span className={ctaIconClass}>
                <NucleoIcon className="size-5" name="circle-arrow-down" />
              </span>
              {exporting ? "Building package..." : "Export starter package"}
            </button>
          </div>
        </div>

        <div className="relative min-h-[340px] overflow-hidden sm:min-h-[380px]">
          <HeroScene />
        </div>
      </section>

      <section className={panelClass} id="templates">
        <div className={panelTitleClass}>
          <span className={panelIconClass}>
            <NucleoIcon className="size-6" name="cube" />
          </span>
          Agent templates
        </div>
        <div className="relative z-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {agentTemplates.map((template) => (
            <article className={`${glassRowClass} grid gap-3 rounded-2xl p-4`} key={template.id}>
              <div>
                <h3 className="m-0 text-2xl leading-none text-[#fafafa]">{template.name}</h3>
                <p className="mt-2 text-sm font-medium leading-5 tracking-[-0.02em] text-zinc-400">{template.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.skillPackIds.map((packId) => {
                  const pack = skillPacks.find((candidate) => candidate.id === packId);
                  return pack ? (
                    <span
                      className={chipClass}
                      key={packId}
                    >
                      {pack.name}
                    </span>
                  ) : null;
                })}
              </div>
              <button
                className={`${buttonDepthClass} ${secondaryButtonClass} mt-auto rounded-full px-3 py-2 text-sm font-black`}
                onClick={() => applyAgentTemplate(template)}
                title={`Load ${template.name} with its recommended packs, memory, and runbook.`}
                type="button"
              >
                Load template
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] xl:gap-10">
        <section className={`${panelClass} flex flex-col xl:h-[680px] xl:min-h-0`} id="builder">
          <div className={`${panelTitleClass} items-start justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="magic-wand-sparkle" />
              </span>
              <span>
                Agent combo canvas
                <span className="mt-1 block text-xs font-medium tracking-[-0.015em] text-zinc-400">
                  Drop packs, tune the stack, export the runtime files.
                </span>
              </span>
            </span>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black text-center">
              {[
                ["packs", installedPackIds.length],
                ["skills", canvasSkills],
                ["steps", agent.workflow.length],
              ].map(([label, value]) => (
                <div className="border-r border-white/10 px-3 py-2 last:border-r-0" key={label}>
                  <div className="text-base font-semibold text-[#fafafa]">{value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{label}</div>
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
            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <p className="mono-font text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Current agent</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#fafafa]" title="The exported agent package name.">{agent.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <p className="mono-font text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Template packs</p>
              <p className="mt-1 text-sm font-semibold text-[#fafafa]" title="Unique prebuilt skill packs currently installed.">{templateCount} loaded</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <p className="mono-font text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Export target</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#fafafa]" title="0G Storage package URI template written into manifest.0g.json.">{agent.storage.packageUri}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:h-[680px] xl:min-h-0 xl:grid-rows-2">
          <aside className={`${panelClass} flex min-h-0 flex-col`}>
            <div className={panelTitleClass}>
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="grid" />
              </span>
              Base blocks
            </div>
            <div className="relative z-10 grid flex-1 content-start gap-3.5 overflow-y-auto pr-1.5">
              {palette.map((block) => (
                <article
                  className={`${glassRowClass} grid cursor-grab grid-cols-[40px_1fr] gap-3 rounded-[1.25rem] p-3`}
                  draggable
                  key={block.id}
                  onDragStart={(event) => handleDragStart(event, block.id)}
                  onDragEnd={() => setDraggedBlockId(null)}
                  title={
                    block.kind === "workflow"
                      ? "Runbook steps are ordered instructions the exported agent follows during each run."
                      : `Drag ${block.title} onto the canvas.`
                  }
                >
                  <div className={`${iconTileClass} size-10`}>{kindIcons[block.kind]}</div>
                  <div>
                    <h3 className="mb-1 text-lg leading-none text-[#fafafa]">{block.title}</h3>
                    <p className="m-0 text-xs font-medium leading-4 tracking-[-0.015em] text-zinc-400">{block.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>

          <section className={`${panelClass} flex min-h-0 flex-col`} id="export-preview">
            <div className={panelTitleClass} title="Inspect the exact files and metadata that will be written into the exported package.">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="cube" />
              </span>
              Live export preview
            </div>
            <div className="relative z-10 mb-3 flex flex-wrap gap-2">
              <button
                className={`${buttonDepthClass} rounded-full px-3 py-2 ${
                  activeTab === "manifest"
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500"
                }`}
                onClick={() => setActiveTab("manifest")}
                title="Show manifest.0g.json provider, storage, skill, and runbook metadata."
              >
                manifest.0g.json
              </button>
              <button
                className={`${buttonDepthClass} rounded-full px-3 py-2 ${
                  activeTab === "agent"
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500"
                }`}
                onClick={() => setActiveTab("agent")}
                title="Show the portable agent runtime configuration."
              >
                agent.json
              </button>
              <button
                className={`${buttonDepthClass} rounded-full px-3 py-2 ${
                  activeTab === "storage"
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500"
                }`}
                onClick={() => setActiveTab("storage")}
                title="Show the 0G Storage package, memory, and log URI targets."
              >
                0G Storage
              </button>
            </div>
            <pre className="mono-font relative z-10 m-0 min-h-[260px] flex-1 overflow-auto rounded-3xl border border-white/10 bg-black p-4 text-xs text-zinc-100 xl:min-h-0">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </section>
        </section>
      </section>

      <section className="grid gap-8 lg:grid-cols-3 xl:gap-10" id="config">
        <section className={panelClass}>
          <div className={panelTitleClass}>
            <span className={panelIconClass}>
              <NucleoIcon className="size-6" name="user" />
            </span>
            Identity
          </div>
          <label className={labelClass}>
            Agent name
            <input className={inputClass} title="Used as the package and manifest agent name." value={agent.name} onChange={(event) => updateAgent({ name: event.target.value })} />
          </label>
          <label className={labelClass}>
            Description
            <input className={inputClass} value={agent.description} onChange={(event) => updateAgent({ description: event.target.value })} />
          </label>
          <label className={labelClass}>
            SOUL.md
            <textarea className={inputClass} title="Persona, tone, goals, and operating principles exported to SOUL.md." value={agent.soul} onChange={(event) => updateAgent({ soul: event.target.value })} rows={6} />
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
            <input className={inputClass} title="OpenAI-compatible 0G Compute router URL." value={agent.model.apiBase} onChange={(event) => updateModel({ apiBase: event.target.value })} />
          </label>
          <label className={labelClass}>
            Model
            <select className={inputClass} title="Model id written into agent.json and manifest.0g.json." value={agent.model.modelId} onChange={(event) => updateModel({ modelId: event.target.value })}>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
              <option value="qwen/qwen-2.5-7b-instruct">qwen/qwen-2.5-7b-instruct</option>
              <option value="google/gemma-3-27b-it">google/gemma-3-27b-it</option>
              <option value="custom/model">custom/model</option>
            </select>
          </label>
          <label className={labelClass}>
            API key env
            <input className={inputClass} title="Environment variable name the exported agent reads for provider auth." value={agent.model.apiKeyEnv} onChange={(event) => updateModel({ apiKeyEnv: event.target.value })} />
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
            <textarea className={inputClass} title="Long-term memory content exported to MEMORY.md." value={agent.memory} onChange={(event) => updateAgent({ memory: event.target.value })} rows={8} />
          </label>
          <label className={labelClass}>
            Package URI template
            <input className={inputClass} title="0G Storage URI template for the exported package root." value={agent.storage.packageUri} onChange={(event) => updateStorage({ packageUri: event.target.value })} />
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

      <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-10">
        <section className={`${panelClass} flex flex-col xl:h-[680px] xl:min-h-0`}>
          <div className={`${panelTitleClass} justify-between`}>
            <span className="flex items-center gap-2.5">
              <span className={panelIconClass}>
                <NucleoIcon className="size-6" name="grid" />
              </span>
              Skill Book
            </span>
            <button
              className={`${buttonDepthClass} ${secondaryButtonClass} rounded-full px-3 py-2 text-xs font-black`}
              onClick={addAllVisibleSkillPacksToCanvas}
              title="Add every currently visible skill pack to the canvas and export manifest."
              type="button"
            >
              Add shown
            </button>
          </div>
          <p className="relative z-10 mb-4 text-sm font-medium leading-5 tracking-[-0.02em] text-zinc-400">
            Curated packs from VoltAgent&apos;s OpenClaw catalog. Exported as standard
            <code className="mx-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-100">SKILL.md</code>
            folders.
          </p>
          <input
            className={`${inputClass} relative z-10 mb-3`}
            onChange={(event) => setSkillPackQuery(event.target.value)}
            placeholder="Search packs, categories, skills..."
            value={skillPackQuery}
          />
          <div className="relative z-10 grid content-start gap-3.5 overflow-y-auto pr-1.5 xl:flex-1">
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
                  title={`Drag ${pack.name} onto the canvas or use the add button.`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-xl leading-none text-[#fafafa]">{pack.name}</h3>
                        <span className={chipClass}>{pack.category}</span>
                      </div>
                      <p className="m-0 text-sm font-medium leading-5 tracking-[-0.02em] text-zinc-400">{pack.summary}</p>
                      <p className="mt-2 text-xs font-medium tracking-[-0.015em] text-zinc-500">Best for {pack.recommendedFor}</p>
                    </div>
                    <button
                      className={`${buttonDepthClass} shrink-0 rounded-full border border-white/12 px-3 py-2 text-xs font-semibold ${
                        installed ? "bg-white text-black" : "bg-black text-[#fafafa]"
                      }`}
                      onClick={() => addSkillPackToCanvas(pack.id)}
                      title={installed ? `${installedCount} of ${pack.skills.length} skills already added.` : `Add ${pack.skills.length} skills from ${pack.name}.`}
                      type="button"
                    >
                      {installed ? `${installedCount}/${pack.skills.length} added` : `Drop / add ${pack.skills.length}`}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="mono-font rounded-full border border-white/12 bg-black px-2.5 py-1 text-[11px] font-medium text-zinc-100 transition hover:border-white/35"
                      href={pack.source}
                      rel="noreferrer"
                      target="_blank"
                    >
                      source category
                    </a>
                    {pack.skills.map((skill) => (
                      <a
                        className="mono-font rounded-full border border-white/12 bg-black px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-white/35 hover:text-white"
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

        <div className="grid gap-6 xl:h-[680px] xl:min-h-0 xl:grid-rows-2">
          <section className={`${panelClass} flex min-h-0 flex-col`}>
            <div className={`${panelTitleClass} justify-between`}>
              <span className="flex items-center gap-2.5">
                <span className={panelIconClass}>
                  <NucleoIcon className="size-6" name="hammer" />
                </span>
                Skills
              </span>
              <button
                className={`${buttonDepthClass} ${secondaryButtonClass} inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold`}
                onClick={addSkill}
                title="Add one custom SKILL.md capability to the exported package."
              >
                <span className={buttonIconClass}>
                  <NucleoIcon className="size-5" name="circle-copy-plus" />
                </span>
                Add
              </button>
            </div>
            <div className="relative z-10 grid flex-1 content-start gap-3.5 overflow-y-auto pr-1.5">
              {agent.skills.map((skill) => (
                <article className={`${glassRowClass} grid items-center gap-2.5 rounded-2xl p-3 md:grid-cols-[180px_1fr_auto_auto_auto]`} key={skill.id}>
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
                      className={`${chipClass} transition hover:border-white/35`}
                      href={skill.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {skill.category}
                    </a>
                  ) : null}
                  <label className="mono-font m-0 flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    <input
                      className="min-h-0 w-auto accent-white"
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={(event) => updateSkill(skill.id, { enabled: event.target.checked })}
                    />
                    enabled
                  </label>
                  <button
                    aria-label={`Remove ${skill.name}`}
                    className="mono-font rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:border-red-200/35 hover:text-red-100"
                    onClick={() => removeSkill(skill.id)}
                    title={`Remove ${skill.name}`}
                    type="button"
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className={`${panelClass} flex min-h-0 flex-col`}>
            <div className={`${panelTitleClass} justify-between`}>
              <span className="flex items-center gap-2.5">
                <span className={panelIconClass}>
                  <NucleoIcon className="size-6" name="tasks" />
                </span>
                Runbook
              </span>
              <button
                className={`${buttonDepthClass} ${secondaryButtonClass} inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold`}
                onClick={addWorkflowStep}
                title="Add one ordered execution step to workflow.json."
              >
                <span className={buttonIconClass}>
                  <NucleoIcon className="size-5" name="circle-copy-plus" />
                </span>
                Add
              </button>
            </div>
            <p className="relative z-10 mb-4 text-sm font-medium leading-5 tracking-[-0.02em] text-zinc-400">
              Runbook steps define the exact execution order. Exported as
              <code className="mx-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-100">workflow.json</code>
              for runtime replay.
            </p>
            <div className="relative z-10 grid flex-1 content-start gap-3.5 overflow-y-auto pr-1.5">
              {agent.workflow.map((step, index) => (
                <article
                  className={`${glassRowClass} grid items-center gap-2.5 rounded-2xl p-3 md:grid-cols-[34px_160px_1fr_36px]`}
                  key={step.id}
                  title="This row becomes one ordered workflow.json runbook step."
                >
                  <span className={`${iconTileClass} size-[34px]`}>{index + 1}</span>
                  <input className={inputClass} title="Short runbook step name." value={step.title} onChange={(event) => updateWorkflowStep(step.id, { title: event.target.value })} />
                  <textarea
                    className={inputClass}
                    title="Instruction the agent follows during this runbook step."
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
        </div>
      </section>
      <footer className="overflow-hidden rounded-[2rem] border border-white/10 bg-black px-5 py-6 shadow-[0_14px_0_rgba(255,255,255,0.035),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div>
          <div>
            <p className="mono-font mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">A product by ClawBuilder</p>
            <h2 className="display-font text-[clamp(48px,12vw,150px)] leading-[0.78] tracking-[-0.01em] text-[#fafafa]">
              ClawBuilder 0G
            </h2>
          </div>
        </div>
        <div className="mono-font mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          <span>© 2026 ClawBuilder 0G</span>
          <span>No-code agents · OpenClaw export · 0G ready</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
