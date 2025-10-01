import * as http from 'http';
import * as path from 'path';

import cors = require('cors');
import { config as configDotenv } from 'dotenv';
import express = require('express');

import { JobsProcessor } from './modules/jobs/processor';
import { registerJobHandlers } from './jobs/registerHandlers';
import { registerControllers } from './controllers';
import { setupWebSocket } from './ws';

configDotenv({ debug: false, override: true, quiet: true });

const rootDir = path.resolve(__dirname, '..');
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(cors());

// Static frontend (serve the frontend directory which contains index.html and assets)
app.use(express.static(path.join(rootDir, 'frontend')));

// Jobs processor
const jobsProcessor = new JobsProcessor({
  intervalMs: Number(process.env.JOBS_POLL_MS || 1000),
});
registerJobHandlers(jobsProcessor);
jobsProcessor.start();

// REST controllers
registerControllers(app);

// HTTP + WebSocket server
const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
