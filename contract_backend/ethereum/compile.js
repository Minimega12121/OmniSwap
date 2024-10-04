const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

// Define the build path and remove any existing build folder
const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

// Define the path to the contract and read the source code
const contractPath = path.resolve(__dirname, 'contracts', 'TokenSwapper.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Custom import handler to resolve dependencies from node_modules
function findImports(importPath) {
  if (importPath.startsWith('@openzeppelin')) {
    try {
      const openZeppelinPath = path.resolve(__dirname, '..', 'node_modules', importPath);
      const content = fs.readFileSync(openZeppelinPath, 'utf8');
      return { contents: content };
    } catch (error) {
      return { error: `Could not find ${importPath}` };
    }
  } else {
    return { error: `File ${importPath} not found` };
  }
}

// Create input object for solc
const input = {
  language: 'Solidity',
  sources: {
    'TokenSwapper.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],  // Specify the desired output
      },
    },
  },
};

// Compile the contract using solc with the custom import handler
let output;
try {
  output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
} catch (err) {
  console.error('Compilation failed:', err);
  process.exit(1);
}

// Check if there are errors in the compilation output
if (output.errors) {
  output.errors.forEach(err => {
    console.error(err.formattedMessage);
  });
  process.exit(1);
}

// Ensure build directory exists
fs.ensureDirSync(buildPath);

// Loop through compiled contracts and save the output as JSON files
for (let contract in output.contracts['TokenSwapper.sol']) {
  const contractName = contract.replace(':', ''); // Remove colon if present
  const contractData = output.contracts['TokenSwapper.sol'][contract];

  fs.outputJsonSync(
    path.resolve(buildPath, `${contractName}.json`),
    contractData
  );
}

console.log('Contracts compiled and output to the build folder');
