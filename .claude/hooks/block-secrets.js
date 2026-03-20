const patterns = [/sk-[a-zA-Z0-9]{48}/, /ghp_[a-zA-Z0-9]{36}/, /AKIA[0-9A-Z]{16}/];
const input = JSON.parse(process.argv[2] || '{}');
const cmd = input.tool_input?.command || '';
for (const p of patterns) {
  if (p.test(cmd)) {
    console.error('❌ Secret detected!');
    process.exit(2);
  }
}
console.log(JSON.stringify(input));
