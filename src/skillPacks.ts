import type { SkillPack } from "./types";

const SOURCE_REPO = "https://github.com/VoltAgent/awesome-openclaw-skills";

export const skillPacks: SkillPack[] = [
  {
    id: "research-intel",
    name: "Research Intel",
    category: "Search & Research",
    summary: "Deep research, paper collection, and citation-ready synthesis for scouting agents.",
    recommendedFor: "research scouts, market maps, diligence agents",
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
    recommendedFor: "safe tool use, skill-store agents, enterprise review",
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
    recommendedFor: "website operators, QA agents, growth agents",
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
    recommendedFor: "engineering copilots, release agents, repo maintainers",
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
    recommendedFor: "deployment copilots, infra agents, uptime workflows",
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
    recommendedFor: "BI agents, revenue ops, product analytics",
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
  {
    id: "0g-native-runtime",
    name: "0G Native Runtime",
    category: "Coding Agents & IDEs",
    summary: "0G provider wiring plus cost, audit, config, and persistent context controls.",
    recommendedFor: "0G-first personal agents, verifiable inference, portable memory",
    source: `${SOURCE_REPO}/blob/main/categories/coding-agents-and-ides.md`,
    skills: [
      {
        name: "0g-compute",
        description: "Use cheap, TEE-verified AI models from the 0G Compute Network as OpenClaw providers.",
        sourceUrl: "https://clawskills.sh/skills/in-liberty420-0g-compute",
      },
      {
        name: "agent-config",
        description: "Intelligently modify agent core context files.",
        sourceUrl: "https://clawskills.sh/skills/thatguysizemore-agent-config",
      },
      {
        name: "agent-context",
        description: "A persistent local-only memory system for AI coding agents.",
        sourceUrl: "https://clawskills.sh/skills/andreagriffiths11-agent-context",
      },
      {
        name: "agent-cost-monitor",
        description: "Real-time token usage and cost tracking across OpenClaw agents.",
        sourceUrl: "https://clawskills.sh/skills/neal-collab-agent-cost-monitor",
      },
      {
        name: "agent-audit-trail",
        description: "Tamper-evident, hash-chained audit logging for AI agents.",
        sourceUrl: "https://clawskills.sh/skills/roosch269-agent-audit-trail",
      },
    ],
  },
  {
    id: "autonomous-ops",
    name: "Autonomous Ops",
    category: "Productivity & Tasks",
    summary: "Long-running execution, task orchestration, adaptive reasoning, and progress loops.",
    recommendedFor: "personal operators, async agents, founder workflows",
    source: `${SOURCE_REPO}/blob/main/categories/productivity-and-tasks.md`,
    skills: [
      {
        name: "adaptive-reasoning",
        description: "Automatically assess task complexity and adjust reasoning level.",
        sourceUrl: "https://clawskills.sh/skills/enzoricciulli-adaptive-reasoning",
      },
      {
        name: "agent-autopilot",
        description: "Self-driving workflow with heartbeat execution, reports, and long-term memory.",
        sourceUrl: "https://clawskills.sh/skills/edoserbia-agent-autopilot",
      },
      {
        name: "agent-task-manager",
        description: "Manage and orchestrate multi-step, stateful agent tasks.",
        sourceUrl: "https://clawskills.sh/skills/dobbybud-agent-task-manager",
      },
      {
        name: "async-task",
        description: "Execute long-running tasks without HTTP timeouts.",
        sourceUrl: "https://clawskills.sh/skills/enderfga-async-task",
      },
      {
        name: "autonomous-execution",
        description: "Execute tasks end-to-end while respecting safety boundaries.",
        sourceUrl: "https://clawskills.sh/skills/pouyakhodadust-eng-autonomous-execution",
      },
    ],
  },
  {
    id: "agent-ui-control",
    name: "Agent UI Control",
    category: "Coding Agents & IDEs",
    summary: "Agent control panels, chat UX, topology maps, and visual product operations.",
    recommendedFor: "dashboard agents, no-code builders, team agent consoles",
    source: `${SOURCE_REPO}/blob/main/categories/coding-agents-and-ides.md`,
    skills: [
      {
        name: "agent-chat-ux-v1-4-0",
        description: "Multi-agent UX with selectors, per-agent sessions, and searchable history.",
        sourceUrl: "https://clawskills.sh/skills/maverick-software-agent-chat-ux-v1-4-0",
      },
      {
        name: "agent-dashboard",
        description: "Real-time agent dashboard for OpenClaw.",
        sourceUrl: "https://clawskills.sh/skills/tahseen137-agent-dashboard",
      },
      {
        name: "agent-topology-visualizer",
        description: "Generate interactive SVG architecture diagrams for AI agent systems.",
        sourceUrl: "https://clawskills.sh/skills/gavinnn-m-agent-topology-visualizer",
      },
      {
        name: "figma",
        description: "Professional Figma design analysis and asset export.",
        sourceUrl: "https://clawskills.sh/skills/maddiedreese-figma",
      },
    ],
  },
  {
    id: "memory-knowledge",
    name: "Memory Knowledge",
    category: "Notes & PKM",
    summary: "Personal knowledge capture, retrieval, markdown conversion, and durable notes.",
    recommendedFor: "second-brain agents, note copilots, durable memory packages",
    source: `${SOURCE_REPO}/blob/main/categories/notes-and-pkm.md`,
    skills: [
      {
        name: "2nd-brain",
        description: "Personal knowledge base for capturing and retrieving remembered context.",
        sourceUrl: "https://clawskills.sh/skills/coderaven-2nd-brain",
      },
      {
        name: "airweave",
        description: "Context retrieval layer for AI agents across users' applications.",
        sourceUrl: "https://clawskills.sh/skills/lennertjansen-airweave",
      },
      {
        name: "markdown-converter",
        description: "Convert documents and files to Markdown.",
        sourceUrl: "https://clawskills.sh/skills/steipete-markdown-converter",
      },
      {
        name: "markdown-formatter",
        description: "Format and beautify markdown documents.",
        sourceUrl: "https://clawskills.sh/skills/michael-laffin-markdown-formatter",
      },
    ],
  },
  {
    id: "comms-scheduler",
    name: "Comms Scheduler",
    category: "Communication",
    summary: "Email, calendars, reminders, briefs, and team communication primitives.",
    recommendedFor: "executive assistants, meeting agents, daily briefers",
    source: `${SOURCE_REPO}/blob/main/categories/communication.md`,
    skills: [
      {
        name: "calendar-scheduling",
        description: "Schedule and book across Google, Outlook, and CalDAV.",
        sourceUrl: "https://clawskills.sh/skills/billylui-calendar-scheduling",
      },
      {
        name: "clippy",
        description: "Microsoft 365 and Outlook CLI for calendar and email.",
        sourceUrl: "https://clawskills.sh/skills/foeken-clippy",
      },
      {
        name: "gmail-last5",
        description: "Show the last five unique emails in the inbox.",
        sourceUrl: "https://clawskills.sh/skills/neuralshift1-gmail-last5",
      },
      {
        name: "ai-daily-briefing",
        description: "Start every day focused with an agent-generated briefing.",
        sourceUrl: "https://clawskills.sh/skills/jeffjhunter-ai-daily-briefing",
      },
    ],
  },
];
