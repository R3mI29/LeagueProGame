import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function waitForHttpUrl(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) {
        return true;
      }
    } catch {
      // DNS pas encore propagé ou réseau en attente
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('\n🚀 Préparation de la session en ligne...\n');

  // 1. Vérifier si dist existe, sinon build
  if (!fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
    console.log('📦 Compilation du frontend (npm run build)...');
    await new Promise((resolve, reject) => {
      const buildProc = spawn('npm.cmd', ['run', 'build'], { cwd: rootDir, stdio: 'inherit' });
      buildProc.on('close', code => (code === 0 ? resolve() : reject(new Error('Build failed'))));
    });
  }

  // 2. Vérifier si le serveur écoute déjà sur le port 3001
  const serverRunning = await checkPort(3001);
  let serverProc = null;

  if (!serverRunning) {
    console.log('⚡ Démarrage du serveur de jeu (port 3001)...');
    serverProc = spawn('node', ['server/index.js'], { cwd: rootDir, stdio: 'inherit' });
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await checkPort(3001)) break;
    }
  } else {
    console.log('ℹ️ Le serveur de jeu tourne déjà sur le port 3001.');
  }

  // 3. Lancer Cloudflare Tunnel
  const cloudflaredPath = path.join(rootDir, 'cloudflared.exe');
  if (!fs.existsSync(cloudflaredPath)) {
    console.error('❌ cloudflared.exe non trouvé dans le répertoire racine.');
    process.exit(1);
  }

  console.log('🌐 Création du lien public sécurisé...');
  const tunnelProc = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:3001'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let detectedUrl = null;
  let isActivating = false;

  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

  const handleOutput = async (data) => {
    const text = data.toString();
    if (!detectedUrl && !isActivating) {
      const match = text.match(urlRegex);
      if (match) {
        detectedUrl = match[0];
        isActivating = true;
        console.log(`🔗 Lien généré : ${detectedUrl}`);
        console.log('⏳ Attente de la propagation DNS (environ 5-10 secondes)...');

        await waitForHttpUrl(detectedUrl);

        console.log('\n' + '='.repeat(70));
        console.log('🎮 PARTIE EN LIGNE PRÊTE !');
        console.log('='.repeat(70));
        console.log('\n👉 ENVOIE CE LIEN À TON AMI(E) :');
        console.log(`\n    ${detectedUrl}\n`);
        console.log('Tu peux aussi cliquer dessus ou l\'ouvrir dans ton navigateur !');
        console.log('='.repeat(70));
        console.log('\n⚠️  Garde cette fenêtre ouverte tant que vous jouez ensemble.');
        console.log('Appuie sur Ctrl+C pour arrêter le partage.\n');

        // Ouvrir dans le navigateur
        spawn('cmd.exe', ['/c', 'start', detectedUrl]);
      }
    }
  };

  tunnelProc.stdout.on('data', handleOutput);
  tunnelProc.stderr.on('data', handleOutput);

  const cleanup = () => {
    console.log('\nFermeture du tunnel et du serveur...');
    tunnelProc.kill();
    if (serverProc) {
      serverProc.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
