export type BlockKind = "soul" | "model" | "memory" | "skill" | "workflow";

export interface BuilderBlock {
  id: string;
  kind: BlockKind;
  title: string;
  summary: string;
}

export interface SkillDraft {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category?: string;
  sourceUrl?: string;
  packId?: string;
}

export interface SkillPack {
  id: string;
  name: string;
  category: string;
  summary: string;
  recommendedFor: string;
  source: string;
  skills: Array<{
    name: string;
    description: string;
    sourceUrl: string;
  }>;
}

export interface WorkflowStep {
  id: string;
  title: string;
  instruction: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  soul: string;
  memory: string;
  skillPackIds: string[];
  workflow: WorkflowStep[];
}

export interface AgentDraft {
  name: string;
  description: string;
  soul: string;
  memory: string;
  model: {
    providerName: string;
    apiBase: string;
    modelId: string;
    apiKeyEnv: string;
  };
  skills: SkillDraft[];
  workflow: WorkflowStep[];
  storage: {
    packageUri: string;
    memoryUri: string;
    logUri: string;
  };
}

export interface AgentManifest {
  schema: "clawbuilder.0g.agent.v1";
  name: string;
  description: string;
  provider: {
    name: string;
    apiBase: string;
    apiType: "openai-chat";
    authType: "bearer-token";
    apiKeyEnv: string;
    models: Array<{
      id: string;
      name: string;
      input: string[];
      contextWindow: number;
      maxTokens: number;
    }>;
  };
  files: string[];
  skills: Array<{
    name: string;
    description: string;
    path: string;
    category?: string;
    sourceUrl?: string;
  }>;
  workflow: WorkflowStep[];
  storage: {
    network: "0g-storage";
    packageUri: string;
    memoryUri: string;
    logUri: string;
  };
}
