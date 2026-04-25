import { type ReactNode, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Brain,
  Boxes,
  Database,
  GripVertical,
  Layers3,
  Network,
  PackageCheck,
  Plus,
  Route,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  ZERO_G_ROUTER_URL,
  buildAgentZip,
  createAgentConfig,
  createManifest,
  downloadBlob,
  starterAgent,
} from "./agentPackage";
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
  soul: <Brain size={18} />,
  model: <Network size={18} />,
  memory: <Database size={18} />,
  skill: <Boxes size={18} />,
  workflow: <Route size={18} />,
};

const kindLabels: Record<BlockKind, string> = {
  soul: "Persona",
  model: "0G Model",
  memory: "Memory",
  skill: "Skill",
  workflow: "Workflow",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
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
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            ETHGlobal OpenAgents · 0G Track
          </div>
          <h1>Drag, drop, and export 0G-native OpenClaw agents.</h1>
          <p>
            ClawBuilder 0G is a FastClaw-style no-code builder for portable agents with
            <strong> 0G Compute</strong> as the OpenAI-compatible brain and
            <strong> 0G Storage</strong> as the package, memory, and run-log layer.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={exportPackage} disabled={exporting}>
              <ArrowDownToLine size={18} />
              {exporting ? "Building package..." : "Export agent package"}
            </button>
            <a className="secondary" href="#builder">
              <Wand2 size={18} />
              Customize builder
            </a>
          </div>
        </div>
        <div className="proof-card">
          <PackageCheck size={24} />
          <span>0G provider preset</span>
          <code>{ZERO_G_ROUTER_URL}</code>
          <span>Exports</span>
          <code>SOUL.md · MEMORY.md · SKILL.md · manifest.0g.json</code>
        </div>
      </section>

      <section className="grid">
        <aside className="panel palette">
          <div className="panel-title">
            <Layers3 size={18} />
            Drag blocks
          </div>
          {palette.map((block) => (
            <article
              className="drag-card"
              draggable
              key={block.id}
              onDragStart={() => setDraggedBlockId(block.id)}
              onDragEnd={() => setDraggedBlockId(null)}
            >
              <div className="drag-icon">{kindIcons[block.kind]}</div>
              <div>
                <h3>{block.title}</h3>
                <p>{block.summary}</p>
              </div>
            </article>
          ))}
        </aside>

        <section className="panel builder" id="builder">
          <div className="panel-title">
            <Wand2 size={18} />
            Agent builder canvas
          </div>
          <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(builderBlocks.length)}>
            {builderBlocks.map((block, index) => (
              <article
                className="builder-block"
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
                <div className="handle">
                  <GripVertical size={18} />
                </div>
                <div className="block-kind">{kindLabels[block.kind]}</div>
                <div>
                  <h3>{block.title}</h3>
                  <p>{block.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel preview">
          <div className="panel-title">
            <PackageCheck size={18} />
            Live export preview
          </div>
          <div className="tabs">
            <button className={activeTab === "manifest" ? "active" : ""} onClick={() => setActiveTab("manifest")}>
              manifest.0g.json
            </button>
            <button className={activeTab === "agent" ? "active" : ""} onClick={() => setActiveTab("agent")}>
              agent.json
            </button>
            <button className={activeTab === "storage" ? "active" : ""} onClick={() => setActiveTab("storage")}>
              0G Storage
            </button>
          </div>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </section>
      </section>

      <section className="editor-grid">
        <section className="panel editor-panel">
          <div className="panel-title">
            <Brain size={18} />
            Identity
          </div>
          <label>
            Agent name
            <input value={agent.name} onChange={(event) => updateAgent({ name: event.target.value })} />
          </label>
          <label>
            Description
            <input value={agent.description} onChange={(event) => updateAgent({ description: event.target.value })} />
          </label>
          <label>
            SOUL.md
            <textarea value={agent.soul} onChange={(event) => updateAgent({ soul: event.target.value })} rows={6} />
          </label>
        </section>

        <section className="panel editor-panel">
          <div className="panel-title">
            <Network size={18} />
            0G Compute
          </div>
          <label>
            Provider name
            <input value={agent.model.providerName} onChange={(event) => updateModel({ providerName: event.target.value })} />
          </label>
          <label>
            API base
            <input value={agent.model.apiBase} onChange={(event) => updateModel({ apiBase: event.target.value })} />
          </label>
          <label>
            Model
            <select value={agent.model.modelId} onChange={(event) => updateModel({ modelId: event.target.value })}>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
              <option value="qwen/qwen-2.5-7b-instruct">qwen/qwen-2.5-7b-instruct</option>
              <option value="google/gemma-3-27b-it">google/gemma-3-27b-it</option>
              <option value="custom/model">custom/model</option>
            </select>
          </label>
          <label>
            API key env
            <input value={agent.model.apiKeyEnv} onChange={(event) => updateModel({ apiKeyEnv: event.target.value })} />
          </label>
        </section>

        <section className="panel editor-panel">
          <div className="panel-title">
            <Database size={18} />
            0G Storage memory
          </div>
          <label>
            MEMORY.md
            <textarea value={agent.memory} onChange={(event) => updateAgent({ memory: event.target.value })} rows={8} />
          </label>
          <label>
            Package URI template
            <input value={agent.storage.packageUri} onChange={(event) => updateStorage({ packageUri: event.target.value })} />
          </label>
          <label>
            Memory URI template
            <input value={agent.storage.memoryUri} onChange={(event) => updateStorage({ memoryUri: event.target.value })} />
          </label>
          <label>
            Log URI template
            <input value={agent.storage.logUri} onChange={(event) => updateStorage({ logUri: event.target.value })} />
          </label>
        </section>
      </section>

      <section className="bottom-grid">
        <section className="panel">
          <div className="panel-title between">
            <span>
              <Boxes size={18} />
              Skills
            </span>
            <button className="small" onClick={addSkill}>
              <Plus size={16} />
              Add
            </button>
          </div>
          <div className="stack">
            {agent.skills.map((skill) => (
              <article className="editable-row" key={skill.id}>
                <input
                  value={skill.name}
                  onChange={(event) => updateSkill(skill.id, { name: slugify(event.target.value) })}
                />
                <input
                  value={skill.description}
                  onChange={(event) => updateSkill(skill.id, { description: event.target.value })}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={skill.enabled}
                    onChange={(event) => updateSkill(skill.id, { enabled: event.target.checked })}
                  />
                  enabled
                </label>
                <button className="icon-button" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`}>
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title between">
            <span>
              <Route size={18} />
              Workflow
            </span>
            <button className="small" onClick={addWorkflowStep}>
              <Plus size={16} />
              Add
            </button>
          </div>
          <div className="stack">
            {agent.workflow.map((step, index) => (
              <article className="editable-row workflow-row" key={step.id}>
                <span className="step-number">{index + 1}</span>
                <input value={step.title} onChange={(event) => updateWorkflowStep(step.id, { title: event.target.value })} />
                <textarea
                  value={step.instruction}
                  onChange={(event) => updateWorkflowStep(step.id, { instruction: event.target.value })}
                  rows={2}
                />
                <button className="icon-button" onClick={() => removeWorkflowStep(step.id)} aria-label={`Remove ${step.title}`}>
                  <Trash2 size={16} />
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
