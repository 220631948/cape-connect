#!/usr/bin/env node
/**
 * Context Injector (SessionStart + BeforeAgent)
 * 
 * - SessionStart: Initializes .gemini/session.json.
 * - BeforeAgent: Injects repo rules (CLAUDE.md, GEMINI.md) and task_plan.md status.
 */

const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

async function main() {
  const inputData = await readStdin();
  if (!inputData) {
    console.error('No input data received');
    process.exit(1);
  }

  let event;
  try {
    event = JSON.parse(inputData);
  } catch (e) {
    console.error('Failed to parse input data as JSON');
    process.exit(1);
  }

  const sessionPath = path.join('.gemini', 'session.json');

  if (event.type === 'SessionStart') {
    // Initialize session memory
    const sessionData = {
      session_id: event.session_id,
      start_time: new Date().toISOString(),
      project_root: event.project_root,
      agents_seen: [],
      milestone_at_start: await getMilestoneStatus()
    };
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log(JSON.stringify({ status: 'success' }));
    process.exit(0);
  }

  if (event.type === 'BeforeAgent') {
    // Inject repo intelligence
    const claudeMd = getFileContent('CLAUDE.md');
    const geminiMd = getFileContent('GEMINI.md');
    const taskPlan = getFileContent('task_plan.md');

    let extraContext = `

--- [SYSTEM CONTEXT INJECTED BY HOOK] ---
`;
    extraContext += `[OPERATING CONSTITUTION (CLAUDE.md)]
${claudeMd}

`;
    extraContext += `[PROJECT RULES (GEMINI.md)]
${geminiMd}

`;
    extraContext += `[TASK PLAN STATUS]
${taskPlan}
`;
    extraContext += `-------------------------------------------
`;

    // Mutate agent prompt
    if (event.agent_prompt) {
      event.agent_prompt = extraContext + event.agent_prompt;
    } else {
      event.agent_prompt = extraContext;
    }

    // Add session memory info if it exists
    if (fs.existsSync(sessionPath)) {
      try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        if (session.learned_context) {
          event.agent_prompt += `
[LEARNED CONTEXT FROM PREVIOUS STEPS]
${session.learned_context}
`;
        }
      } catch (e) {
        // Ignore malformed session file
      }
    }

    console.log(JSON.stringify(event));
    process.exit(0);
  }

  // Fallback
  console.log(JSON.stringify({ status: 'ignored' }));
}

async function getMilestoneStatus() {
  try {
    const taskPlan = fs.readFileSync('task_plan.md', 'utf8');
    const milestoneMatch = taskPlan.match(/Milestone: M(\d+)/i);
    return milestoneMatch ? `M${milestoneMatch[1]}` : 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}

function getFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return `[File ${filePath} not found]`;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
