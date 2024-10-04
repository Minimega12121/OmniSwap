const fs = require('fs');

async function checkContractSize() {
    const Token1 = require('./build/Token1.json');
    const Token2 = require('./build/Token2.json');
    const TokenSwapper = require('./build/TokenSwapper.json');

    console.log(`Token1 Bytecode Size: ${Token1.evm.bytecode.object.length / 2} bytes`);
    console.log(`Token2 Bytecode Size: ${Token2.evm.bytecode.object.length / 2} bytes`);
    console.log(`TokenSwapper Bytecode Size: ${TokenSwapper.evm.bytecode.object.length / 2} bytes`);
}

checkContractSize();
