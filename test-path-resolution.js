// Test script to verify path resolution logic
const testCases = [
  // Test case: [input_path, expected_file_path]
  ['quick-guides/overview', 'quick-guides/quick-guides/overview.tsx'],
  ['mcp/get-started', 'mcp/mcp/get-started.tsx'],
  ['large-language-models/local-models', 'large-language-models/local-models.tsx'],
  ['glossary', 'glossary.tsx'],
  ['getting-started', 'getting-started.tsx']
];

function generatePathsToTry(path) {
  const pathSegments = path.split('/');
  const pathsToTry = [];
  
  // Strategy 1: Direct path mapping
  pathsToTry.push(path);
  
  // Strategy 2: For paths with only one segment, try the nested duplicate pattern
  // e.g., "quick-guides/overview" -> "quick-guides/quick-guides/overview"
  if (pathSegments.length >= 2) {
    const [firstSegment, ...rest] = pathSegments;
    pathsToTry.push(`${firstSegment}/${firstSegment}/${rest.join('/')}`);
  }
  
  // Strategy 3: For single segment paths, try adding the duplicate
  // e.g., "quick-guides" -> "quick-guides/quick-guides"
  if (pathSegments.length === 1) {
    pathsToTry.push(`${path}/${path}`);
  }
  
  // Strategy 4: Handle special cases
  if (path === 'getting-started') {
    pathsToTry.unshift('getting-started');
  }
  
  return pathsToTry.map(p => `${p}.tsx`);
}

console.log('Testing path resolution logic:');
console.log('=====================================');

testCases.forEach(([inputPath, expectedPath]) => {
  const generatedPaths = generatePathsToTry(inputPath);
  const isCorrect = generatedPaths.includes(expectedPath);
  
  console.log(`\nInput: ${inputPath}`);
  console.log(`Expected: ${expectedPath}`);
  console.log(`Generated paths: ${generatedPaths.join(', ')}`);
  console.log(`✅ Correct: ${isCorrect ? 'YES' : 'NO'}`);
  
  if (!isCorrect) {
    console.log(`❌ ERROR: Expected path not found in generated paths!`);
  }
});

console.log('\n=====================================');
console.log('Testing complete!');