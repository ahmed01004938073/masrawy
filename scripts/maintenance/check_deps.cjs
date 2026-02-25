const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');
const packageJsonPath = path.join(__dirname, 'package.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

const missingDeps = new Set();

if (fs.existsSync(uiDir)) {
    const files = fs.readdirSync(uiDir);

    files.forEach(file => {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(path.join(uiDir, file), 'utf8');
            const lines = content.split('\n');
            lines.forEach(line => {
                const match = line.match(/from "(@radix-ui\/[^"]+)"/);
                if (match) {
                    const dep = match[1];
                    if (!dependencies[dep]) {
                        missingDeps.add(dep);
                    }
                }
            });
        }
    });
}

if (missingDeps.size > 0) {
    console.log('Missing dependencies found:');
    console.log(Array.from(missingDeps).join(' '));
} else {
    console.log('No missing @radix-ui dependencies found.');
}
