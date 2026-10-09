const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'hands-dispatch-001.json'), 'utf8'));

assert.equal(contract.id, 'HANDS-DISPATCH-001');
assert.equal(contract.repository, 'amasvole/WFE-Next');
assert.equal(contract.authority, 'github.workflow.dispatch');
assert.equal(contract.execution.checkout, 'exact-sha-detached');
assert.equal(contract.execution.effect, 'read-only');
assert.deepEqual(contract.execution.commands, [['npm', 'test'], ['npm', 'run', 'test:product']]);
assert.deepEqual(contract.forbidden, ['generic-shell', 'merge', 'deploy', 'working-tree-mutation']);

console.log('hands-dispatch-contract.test.js: PASS');
