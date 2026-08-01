const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
                walk(p);
            }
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            const content = fs.readFileSync(p, 'utf8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (/(console\.(log|error|warn)|debugger)/.test(l)) {
                    console.log(`${p}:${i + 1}: ${l.trim()}`);
                }
            });
        }
    }
}
walk('.');
