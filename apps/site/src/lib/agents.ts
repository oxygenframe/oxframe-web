// The /agents pages: how to set oxframe up in each coding agent. The skills
// themselves come from oxframe-sdk (skills.json, written by sync-skills).
import skillsData from './skills.json';

export interface Skill {
  name: string;
  description: string;
  html: string;
}

// Descriptions are frontmatter text with `code` marks; pages show them plain.
export const skills: Skill[] = skillsData.map((s) => ({
  ...s,
  description: s.description.replace(/`/g, ''),
}));

export interface AgentPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  /** How the agent reads project instructions. */
  instructions: string;
  /** The MCP server for this agent: file and content, or a command. */
  mcp: { label: string; code: string; lang: 'json' | 'toml' | 'shellscript' };
  /** Extra setup only this agent has (plugins). */
  extra?: { label: string; code: string };
}

export const INSTALL_SKILLS = 'npx skills add oxygenframe/oxframe-sdk';
export const INSTALL_CLI = 'cargo install oxframe-cli';

export const agents: AgentPage[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    title: 'oxframe in Claude Code: videos your agent checks',
    description:
      'Set up oxframe in Claude Code: the plugin with skills and the MCP server, or npx skills add. Claude writes Rust scenes and fixes what oxframe check reports.',
    instructions:
      'oxframe init writes CLAUDE.md (pointing at AGENTS.md) and the skill in .claude/skills/oxframe, so a new project needs nothing else.',
    mcp: {
      label: 'MCP server',
      code: 'claude mcp add oxframe -- oxframe mcp',
      lang: 'shellscript',
    },
    extra: {
      label: 'Or the plugin (skills and MCP server together)',
      code: '/plugin marketplace add oxygenframe/oxframe-sdk\n/plugin install oxframe@oxframe',
    },
  },
  {
    slug: 'codex',
    name: 'Codex',
    title: 'oxframe in OpenAI Codex: video from code',
    description:
      'Set up oxframe in OpenAI Codex: AGENTS.md from oxframe init, the skills, and the oxframe MCP server in config.toml for check, inspect and frame renders.',
    instructions: 'Codex reads AGENTS.md, which oxframe init writes into every project.',
    mcp: {
      label: 'MCP server in ~/.codex/config.toml',
      code: '[mcp_servers.oxframe]\ncommand = "oxframe"\nargs = ["mcp"]',
      lang: 'toml',
    },
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    title: 'oxframe in Cursor: animations your agent can see',
    description:
      'Set up oxframe in Cursor: skills with npx skills add, AGENTS.md, and the oxframe MCP server in .cursor/mcp.json so the agent checks its own frames.',
    instructions: 'Cursor reads AGENTS.md, which oxframe init writes into every project.',
    mcp: {
      label: 'MCP server in .cursor/mcp.json',
      code: '{\n  "mcpServers": {\n    "oxframe": { "command": "oxframe", "args": ["mcp"] }\n  }\n}',
      lang: 'json',
    },
  },
  {
    slug: 'copilot',
    name: 'GitHub Copilot',
    title: 'oxframe with GitHub Copilot: video from code',
    description:
      'Set up oxframe for GitHub Copilot agent mode in VS Code: the skills, project instructions, and the oxframe MCP server in .vscode/mcp.json.',
    instructions:
      'Point Copilot at the project notes: add a line to .github/copilot-instructions.md that says to follow AGENTS.md.',
    mcp: {
      label: 'MCP server in .vscode/mcp.json',
      code: '{\n  "servers": {\n    "oxframe": { "type": "stdio", "command": "oxframe", "args": ["mcp"] }\n  }\n}',
      lang: 'json',
    },
  },
];

export const agent = (slug: string) => agents.find((a) => a.slug === slug);
export const skill = (name: string) => skills.find((s) => s.name === name);
