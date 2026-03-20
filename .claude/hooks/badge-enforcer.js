const input = JSON.parse(process.argv[2] || '{}');
const path = input.tool_input?.file_path || '';
const content = input.tool_input?.content || '';
if (path.includes('components') && /Layer|Map|Data/i.test(content)) {
  if (!content.includes('SourceBadge')) {
    console.warn(`⚠️  Missing source badge in ${path}`);
  }
}
console.log(JSON.stringify(input));
