import type { SkillPack } from "./types";

const SOURCE_REPO = "https://github.com/VoltAgent/awesome-openclaw-skills";

export const skillPacks: SkillPack[] = [
  {
    id: "research-intel",
    name: "Research Intel",
    category: "Search & Research",
    summary: "Deep research, paper collection, and citation-ready synthesis for scouting agents.",
    source: `${SOURCE_REPO}/blob/main/categories/search-and-research.md`,
    skills: [
      {
        name: "academic-deep-research",
        description: "Transparent, rigorous research with traceable source collection and synthesis.",
        sourceUrl: "https://clawskills.sh/skills/kesslerio-academic-deep-research",
      },
      {
        name: "arxiv-search-collector",
        description: "Model-driven arXiv retrieval workflow for building focused paper sets.",
        sourceUrl: "https://clawskills.sh/skills/xukp20-arxiv-search-collector",
      },
      {
        name: "airadar",
        description: "Distill signal around AI-native tools, GitHub projects, hype, and funding.",
        sourceUrl: "https://clawskills.sh/skills/lopushok9-airadar",
      },
    ],
  },
  {
    id: "agent-security",
    name: "Agent Security",
    category: "Security & Skill Trust",
    summary: "Vetting, prompt-injection screening, trust scoring, and agentic security audits.",
    source: `${SOURCE_REPO}/blob/main/categories/security-and-passwords.md`,
    skills: [
      {
        name: "aegis-shield",
        description: "Prompt-injection and data-exfiltration screening for untrusted text.",
        sourceUrl: "https://clawskills.sh/skills/deegerwalker-aegis-shield",
      },
      {
        name: "arc-trust-verifier",
        description: "Verify skill provenance and build trust scores for ClawHub skills.",
        sourceUrl: "https://clawskills.sh/skills/trypto1019-arc-trust-verifier",
      },
      {
        name: "agentic-security-audit",
        description: "Audit codebases, infrastructure, and agentic AI systems for security issues.",
        sourceUrl: "https://clawskills.sh/skills/kingrubic-agentic-security-audit",
      },
    ],
  },
  {
    id: "web-operator",
    name: "Web Operator",
    category: "Browser & Automation",
    summary: "Browser control, screenshots, scraping, web analytics, and service interaction.",
    source: `${SOURCE_REPO}/blob/main/categories/browser-and-automation.md`,
    skills: [
      {
        name: "actionbook",
        description: "Interact with websites through browser automation, scraping, screenshots, and forms.",
        sourceUrl: "https://clawskills.sh/skills/adcentury-actionbook",
      },
      {
        name: "agentic-browser",
        description: "Browser automation for AI agents using a dedicated inference-backed browser flow.",
        sourceUrl: "https://clawskills.sh/skills/xyny89-agentic-browser-0-1-2",
      },
      {
        name: "agent-analytics",
        description: "Simple website analytics your AI agent controls end-to-end.",
        sourceUrl: "https://clawskills.sh/skills/dannyshmueli-agent-analytics",
      },
    ],
  },
  {
    id: "gitops-builder",
    name: "GitOps Builder",
    category: "Git & GitHub",
    summary: "PR workflows, repo automation, agent lifecycle, and skill version operations.",
    source: `${SOURCE_REPO}/blob/main/categories/git-and-github.md`,
    skills: [
      {
        name: "agent-team-orchestration",
        description: "Orchestrate multi-agent teams with roles, task lifecycles, handoffs, and reviews.",
        sourceUrl: "https://clawskills.sh/skills/arminnaimi-agent-team-orchestration",
      },
      {
        name: "arc-skill-gitops",
        description: "Automated deployment, rollback, and version management for agent workflows and skills.",
        sourceUrl: "https://clawskills.sh/skills/trypto1019-arc-skill-gitops",
      },
      {
        name: "azure-devops",
        description: "List projects, repositories, and branches; create PRs; manage work items; check builds.",
        sourceUrl: "https://clawskills.sh/skills/pals-software-azure-devops",
      },
    ],
  },
  {
    id: "cloud-deploy",
    name: "Cloud Deploy",
    category: "DevOps & Cloud",
    summary: "Deploy apps, run cloud/self-hosted operations, and notify on long-running work.",
    source: `${SOURCE_REPO}/blob/main/categories/devops-and-cloud.md`,
    skills: [
      {
        name: "agentscale",
        description: "Deploy web apps and APIs to a public URL with a single command.",
        sourceUrl: "https://clawskills.sh/skills/jpbonch-agentscale",
      },
      {
        name: "arc-agent-lifecycle",
        description: "Manage the lifecycle of autonomous agents and their skills.",
        sourceUrl: "https://clawskills.sh/skills/trypto1019-arc-agent-lifecycle",
      },
      {
        name: "gotify",
        description: "Send push notifications via Gotify when long-running tasks complete.",
        sourceUrl: "https://clawskills.sh/skills/jmagar-gotify",
      },
    ],
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    category: "Data & Analytics",
    summary: "BI reports, structured extraction, dashboards, and data-backed decision loops.",
    source: `${SOURCE_REPO}/blob/main/categories/data-and-analytics.md`,
    skills: [
      {
        name: "biz-reporter",
        description: "Automated business intelligence reports from analytics, search, and revenue data.",
        sourceUrl: "https://clawskills.sh/skills/ariktulcha-biz-reporter",
      },
      {
        name: "amazon-product-api-skill",
        description: "Extract structured product listings including titles, ASINs, prices, and ratings.",
        sourceUrl: "https://clawskills.sh/skills/phheng-amazon-product-api-skill",
      },
      {
        name: "aeo-analytics-free",
        description: "Track whether a brand is mentioned and cited by AI assistants.",
        sourceUrl: "https://clawskills.sh/skills/psyduckler-aeo-analytics-free",
      },
    ],
  },
];
