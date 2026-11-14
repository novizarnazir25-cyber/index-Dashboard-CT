/**
 * CIRCULARTRACE - HTTP Server & REST API
 * Exposes server-side calculation pipeline, role-based form configurations,
 * benchmark registry, and versioned calculation snapshots.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CalculationPipeline } from '../engine/calculation-pipeline.js';
import { RoleFormsConfig } from '../forms/role-forms-config.js';
import { globalBenchmarkRegistry } from '../registry/benchmark-registry.js';
import { ChainAggregationEngine } from '../engine/chain-aggregation.js';
import { ValidationError } from '../cdl/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const pipeline = new CalculationPipeline();

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new ValidationError('Invalid JSON body', 'body'));
      }
    });
  });
}

// Serve static files
function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // -------------------------------------------------------------------------
    // API: Role Forms Configuration
    // -------------------------------------------------------------------------
    if (pathname === '/api/forms/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, forms: RoleFormsConfig }));
      return;
    }

    // -------------------------------------------------------------------------
    // API: Benchmarks Registry List
    // -------------------------------------------------------------------------
    if (pathname === '/api/benchmarks' && req.method === 'GET') {
      const list = Array.from(globalBenchmarkRegistry.benchmarks.values());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, benchmarks: list }));
      return;
    }

    // -------------------------------------------------------------------------
    // API: Execute Server-side Calculation Pipeline
    // -------------------------------------------------------------------------
    if (pathname === '/api/calculation/execute' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const { assessmentData, options } = payload;

      if (!assessmentData) {
        throw new ValidationError('assessmentData is required', 'assessmentData');
      }

      const snapshot = pipeline.execute(assessmentData, options);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, snapshot }));
      return;
    }

    // -------------------------------------------------------------------------
    // API: List Calculation Snapshots for Assessment
    // -------------------------------------------------------------------------
    if (pathname.startsWith('/api/snapshots/') && req.method === 'GET') {
      const assessmentId = pathname.replace('/api/snapshots/', '');
      const list = pipeline.listSnapshotsForAssessment(assessmentId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, snapshots: list }));
      return;
    }

    // -------------------------------------------------------------------------
    // API: Aggregate Chain Scores
    // -------------------------------------------------------------------------
    if (pathname === '/api/calculation/aggregate-chain' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const { stageSnapshots, stageRawData } = payload;

      const chainCci = ChainAggregationEngine.aggregateCci(stageRawData || []);
      const chainSdi = ChainAggregationEngine.aggregateSdi(stageSnapshots || []);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, chainCci, chainSdi }));
      return;
    }

    // -------------------------------------------------------------------------
    // Static Files (Frontend Dashboard)
    // -------------------------------------------------------------------------
    const cleanRelativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.join(PUBLIC_DIR, cleanRelativePath);
    serveStatic(req, res, filePath);

  } catch (err) {
    const statusCode = err instanceof ValidationError ? 400 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: err.message,
      field: err.field,
      code: err.code || 'INTERNAL_ERROR'
    }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`CircularTrace Calculation Server running at http://localhost:${PORT}`);
});

export { server, pipeline };
