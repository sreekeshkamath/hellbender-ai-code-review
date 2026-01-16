# Agents

This document describes the available agents that can be used with opencode.

## General Agent

**Type:** `general`

A general-purpose agent for researching complex questions and executing multi-step tasks.

### Capabilities
- Complex multi-step task execution
- Research and investigation
- Code analysis and problem-solving
- File operations and modifications
- Shell command execution

### Usage
```json
{
  "subagent_type": "general",
  "description": "Short description of the task",
  "prompt": "Detailed instructions for the agent"
}
```

## Explore Agent

**Type:** `explore`

Fast agent specialized for exploring codebases.

### Capabilities
- Quick file searches by patterns
- Code content searches
- Codebase analysis
- Finding specific patterns and implementations
- Answering questions about codebase structure

### Thoroughness Levels
- **quick:** Basic searches for common patterns
- **medium:** Moderate exploration across multiple locations
- **very thorough:** Comprehensive analysis across multiple naming conventions

### Usage
```json
{
  "subagent_type": "explore",
  "description": "Analyze codebase structure",
  "prompt": "Find all React components and explain their relationships",
  "thoroughness": "medium"
}
```

## Custom Agents

To add custom agents:

1. Define the agent type and description in your configuration
2. Implement the agent's capabilities
3. Document the agent in this file

## Agent Communication

Agents return results in their final message. Results are not automatically shown to the user - you should summarize them in a text response.

Agents are stateless between calls unless you provide a `session_id` parameter.
