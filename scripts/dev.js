// =====================================================
// `npm run dev`: enciende la API (Express, puerto 3002) y la tienda
// (Vite, puerto 5173) al mismo tiempo. Ctrl+C apaga las dos.
// =====================================================
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const procesos = [
    ['api', ['run', 'dev', '--prefix', path.join(root, 'backend')]],
    ['tienda', ['run', 'dev', '--prefix', path.join(root, 'frontend')]]
].map(([name, args]) => {
    const child = spawn(npm, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    const prefix = (text) => text.toString().split(/\r?\n/).filter(Boolean).map((line) => `[${name}] ${line}`).join('\n');
    child.stdout.on('data', (d) => console.log(prefix(d)));
    child.stderr.on('data', (d) => console.error(prefix(d)));
    child.on('exit', (code) => console.log(`[${name}] terminó (código ${code})`));
    return child;
});

console.log('Tienda en http://localhost:5173/sala/  ·  API en http://localhost:3002/api/health');

process.on('SIGINT', () => {
    procesos.forEach((p) => p.kill());
    process.exit(0);
});
