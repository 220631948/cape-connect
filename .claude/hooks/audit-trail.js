const fs = require('fs');
const input = JSON.parse(process.argv[2] || '{}');
const log = `${new Date().toISOString()} | ${input.tool}\n`;
fs.mkdirSync('.claude/audit', {recursive: true});
fs.appendFileSync('.claude/audit/commands.log', log);
console.log(JSON.stringify(input));
