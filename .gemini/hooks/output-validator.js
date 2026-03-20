#!/usr/bin/env node
/**
 * Output Validator (AfterAgent)
 * 
 * - Validate response structure.
 * - Detect malformed outputs.
 * - Force automatic retry once if invalid.
 * - Prevent infinite retry loops.
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

  if (event.type === 'AfterAgent') {
    const { response, session_id } = event;
    const sessionPath = path.join('.gemini', 'session.json');

    // --- Validation logic ---
    let invalidReason = null;

    // Check for malformed markdown blocks (e.g., unclosed code blocks)
    const codeBlocksCount = (response.match(/```/g) || []).length;
    if (codeBlocksCount % 2 !== 0) {
      invalidReason = 'Response contains an unclosed markdown code block';
    }

    // Check for "I don't know" or "As an AI" responses without attempting tools 
    // when tool use was expected (optional, but requested for some workflows).
    // Not strictly enforced here.

    // --- Retry logic ---
    if (invalidReason && fs.existsSync(sessionPath)) {
      try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        const retryCount = session.retry_count || 0;

        if (retryCount < 1) { // Force retry ONLY ONCE
          session.retry_count = retryCount + 1;
          fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

          console.log(JSON.stringify({ 
            status: 'retry', 
            retry: true, 
            reason: `${invalidReason}. Please correct the output and try again.`,
            retry_message: `Your previous output was invalid: ${invalidReason}. Please fix it and respond with the correct output.`
          }));
          process.exit(0);
        } else {
          // Reset retry count for next session/turn
          session.retry_count = 0;
          fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
        }
      } catch (e) {
        // Ignore malformed session file
      }
    }

    // --- Validated output ---
    console.log(JSON.stringify({ status: 'success' }));
    process.exit(0);
  }

  // Fallback
  console.log(JSON.stringify({ status: 'ignored' }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
