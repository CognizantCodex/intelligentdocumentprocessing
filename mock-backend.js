const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = 8000;
const ROOT = __dirname;
const DEMO_DIR = path.join(ROOT, "demo_docs", "generated");
const GROUND_TRUTH_DIR = path.join(ROOT, "demo_docs", "ground_truth");
const STATE_PATH = path.join(ROOT, "mock-backend-state.json");
const DISCLAIMER = "AI extraction may be imperfect; verify before use.";
const AUTH = {
  admin: "changeme",
  viewer: "viewer"
};

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

const manifest = readJson(path.join(DEMO_DIR, "manifest.json"), { documents: [] });
const state = readJson(STATE_PATH, { documents: [] });

function saveState() {
  writeJson(STATE_PATH, state);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseAuth(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [username, password] = decoded.split(":");
  if (AUTH[username] && AUTH[username] === password) {
    return { username, role: username === "admin" ? "admin" : "viewer" };
  }
  return null;
}

function requireAuth(req, res, adminOnly = false) {
  const user = parseAuth(req);
  if (!user || (adminOnly && user.role !== "admin")) {
    res.writeHead(user ? 403 : 401, {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Basic",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
    });
    res.end(JSON.stringify({ detail: user ? "Admin access required" : "Invalid credentials" }));
    return null;
  }
  return user;
}

function nowIso() {
  return new Date().toISOString();
}

function stageRuns(status = "queued", outputJson = null) {
  const stages = ["normalize", "classify", "extract", "validate", "route", "qa", "merge"];
  return stages.map((stage, index) => ({
    stage_name: stage,
    status,
    started_ts: status === "succeeded" ? nowIso() : null,
    finished_ts: status === "succeeded" ? nowIso() : null,
    latency_ms: status === "succeeded" ? 120 + index * 35 : null,
    output_json: stage === "merge" ? outputJson : null,
    error_text: null
  }));
}

function citationsForField(key, value) {
  const snippet = Array.isArray(value) ? JSON.stringify(value) : String(value ?? key);
  return [{ page: 1, chunk_id: "chunk_1", snippet: snippet.slice(0, 180) }];
}

function buildExtraction(groundTruth) {
  const fields = {};
  for (const [key, value] of Object.entries(groundTruth.fields || {})) {
    fields[key] = {
      value,
      confidence: value == null ? 0 : 0.94,
      citations: value == null ? [] : citationsForField(key, value)
    };
  }
  return { doc_type: groundTruth.doc_type, schema_version: "2026.04", fields };
}

function buildValidation(groundTruth) {
  const issues = [];
  if (groundTruth.source_label === "invoice_005_mismatch") {
    issues.push({ code: "totals_mismatch", severity: "error", message: "Invoice totals do not reconcile within tolerance." });
  }
  if (groundTruth.source_label === "po_002_missing_shipto") {
    issues.push({ code: "required_missing", severity: "error", message: "Required field 'ship_to' is missing." });
  }
  return { passed: issues.length === 0, issues, average_confidence: issues.length ? 0.82 : 0.94 };
}

function routeForDocType(docType) {
  const map = {
    invoice: "Accounts Payable",
    purchase_order: "Procurement",
    receipt: "Expense Operations",
    bank_statement: "Finance Operations",
    hr_form: "HR Onboarding",
    shipping_document: "Logistics"
  };
  return map[docType] || "Operations";
}

function buildFinalResult(document) {
  const truthPath = document.source_label ? path.join(GROUND_TRUTH_DIR, `${document.source_label}.json`) : null;
  const truth = truthPath && fs.existsSync(truthPath)
    ? readJson(truthPath, null)
    : { source_label: document.source_label || document.filename.replace(/\.[^.]+$/, ""), doc_type: "other", fields: { filename: document.filename, summary: document.filename } };
  const extraction = buildExtraction(truth);
  const validation = buildValidation(truth);
  const route = routeForDocType(truth.doc_type);
  const normalized_data = Object.fromEntries(Object.entries(extraction.fields).map(([key, value]) => [key, value.value]));
  return {
    document_id: document.id,
    filename: document.filename,
    status: validation.passed ? "routed" : "validated",
    route,
    doc_type: {
      doc_type: truth.doc_type,
      confidence: 0.95,
      evidence_keywords: [truth.doc_type, document.filename],
      evidence: citationsForField("doc_type", truth.doc_type)
    },
    disclaimer: DISCLAIMER,
    processing_options: document.processing_options_json || {},
    retention_days: document.retention_days,
    pii_detection_enabled: document.pii_detection_enabled,
    pii_redaction_enabled: document.pii_redaction_enabled,
    normalize: { ocr_used: document.filename.endsWith(".png"), page_count: 1, pages: [{ page: 1, text: document.filename }], chunks: [{ id: "chunk_1", page: 1, text: document.filename, stored_text: document.filename }], pii_findings: [] },
    extraction,
    normalized_data,
    validation,
    qa: { passed: true, issues: [] },
    review: document.review || null
  };
}

function toSummary(document) {
  return {
    id: document.id,
    filename: document.filename,
    upload_ts: document.upload_ts,
    status: document.status,
    route: document.route || null,
    doc_type: document.doc_type || null,
    doc_type_confidence: document.doc_type_confidence ?? null,
    review_required: Boolean(document.review_required),
    last_updated: document.updated_ts,
    source_label: document.source_label || null
  };
}

function toDetail(document) {
  return {
    ...toSummary(document),
    disclaimer: DISCLAIMER,
    retention_days: document.retention_days,
    pii_detection_enabled: document.pii_detection_enabled,
    pii_redaction_enabled: document.pii_redaction_enabled,
    processing_options_json: document.processing_options_json || {},
    final_result_json: document.final_result_json || null
  };
}

function ensureProcessed(document) {
  if (!document.final_result_json) {
    const finalResult = buildFinalResult(document);
    document.final_result_json = finalResult;
    document.doc_type = finalResult.doc_type.doc_type;
    document.doc_type_confidence = finalResult.doc_type.confidence;
    document.route = finalResult.route;
    document.review_required = !finalResult.validation.passed;
    document.status = document.review_required ? "validated" : "routed";
    document.stage_runs = stageRuns("succeeded", finalResult);
    document.updated_ts = nowIso();
    saveState();
  }
}

function rerunDocument(document) {
  document.status = "processing";
  document.route = null;
  document.doc_type = null;
  document.doc_type_confidence = null;
  document.review_required = false;
  document.review = null;
  document.final_result_json = null;
  document.stage_runs = stageRuns("queued");
  document.processing_options_json = {
    ...(document.processing_options_json || {}),
    rerun_count: ((document.processing_options_json && document.processing_options_json.rerun_count) || 0) + 1,
    last_rerun_ts: nowIso()
  };
  document.updated_ts = nowIso();
  saveState();
  ensureProcessed(document);
}

function loadDemoDocs() {
  const inserted = [];
  for (const item of manifest.documents || []) {
    if (state.documents.find((doc) => doc.source_label === item.source_label && doc.filename === item.pdf_filename)) {
      continue;
    }
    const document = {
      id: crypto.randomUUID(),
      filename: item.pdf_filename,
      upload_ts: nowIso(),
      updated_ts: nowIso(),
      status: "uploaded",
      route: null,
      doc_type: null,
      doc_type_confidence: null,
      review_required: false,
      retention_days: 30,
      pii_detection_enabled: true,
      pii_redaction_enabled: false,
      processing_options_json: { demo: true, variant: item.ingest_variant || "pdf" },
      source_label: item.source_label,
      final_result_json: null,
      stage_runs: stageRuns("queued")
    };
    state.documents.push(document);
    inserted.push(document);
  }
  saveState();
  return inserted;
}

function parseMultipartFilenames(contentType, buffer) {
  const match = /boundary=(.+)$/i.exec(contentType || "");
  if (!match) return [];
  const boundary = `--${match[1]}`;
  const body = buffer.toString("utf8");
  return body.split(boundary).map((part) => {
    const filenameMatch = /filename="([^"]+)"/i.exec(part);
    return filenameMatch ? filenameMatch[1] : null;
  }).filter(Boolean);
}

function metricsPayload() {
  const processed = state.documents.filter((document) => document.final_result_json);
  const per_document = processed.filter((document) => document.source_label).map((document) => ({
    document_id: document.id,
    source_label: document.source_label,
    doc_type_expected: document.final_result_json.extraction.doc_type,
    doc_type_predicted: document.doc_type,
    doc_type_correct: true
  }));
  return {
    generated_at: nowIso(),
    metrics: {
      document_count: per_document.length,
      doc_type_accuracy: per_document.length ? 1 : 0,
      field_precision: per_document.length ? 0.97 : 0,
      field_recall: per_document.length ? 0.95 : 0,
      pass_rate: per_document.length ? per_document.filter((row) => {
        const doc = state.documents.find((item) => item.id === row.document_id);
        return doc && doc.final_result_json.validation.passed;
      }).length / per_document.length : 0,
      average_confidence: per_document.length ? 0.93 : 0,
      per_document
    }
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/health") {
    return sendJson(res, 200, { ok: true, mode: "mock-node", port: PORT });
  }

  const adminUser = ["/api/upload", "/api/demo/load"].includes(url.pathname) || req.method === "DELETE" || req.method === "POST";
  const user = requireAuth(req, res, adminUser);
  if (!user) return;

  if (req.method === "GET" && url.pathname === "/api/documents") {
    return sendJson(res, 200, state.documents.map(toSummary));
  }

  if (req.method === "POST" && url.pathname === "/api/demo/load") {
    const loaded = loadDemoDocs();
    return sendJson(res, 200, { loaded: loaded.length, autorun: false, documents: loaded.map((document) => ({ id: document.id, filename: document.filename, status: document.status, storage_path: path.join(DEMO_DIR, document.filename), checksum: crypto.createHash("sha256").update(document.filename).digest("hex") })) });
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    const body = await readBody(req);
    const filenames = parseMultipartFilenames(req.headers["content-type"], body);
    const created = filenames.map((filename) => {
      const source_label = filename.replace(/\.[^.]+$/, "");
      const document = {
        id: crypto.randomUUID(),
        filename,
        upload_ts: nowIso(),
        updated_ts: nowIso(),
        status: "uploaded",
        route: null,
        doc_type: null,
        doc_type_confidence: null,
        review_required: false,
        retention_days: 30,
        pii_detection_enabled: true,
        pii_redaction_enabled: false,
        processing_options_json: { manual_upload: true },
        source_label,
        final_result_json: null,
        stage_runs: stageRuns("queued")
      };
      state.documents.push(document);
      return { id: document.id, filename: document.filename, status: document.status, storage_path: path.join(ROOT, "uploads", document.filename), checksum: crypto.createHash("sha256").update(document.filename).digest("hex") };
    });
    saveState();
    return sendJson(res, 200, created);
  }

  if (req.method === "GET" && url.pathname === "/api/metrics") {
    return sendJson(res, 200, metricsPayload());
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/export/")) {
    const id = url.pathname.split("/").pop();
    const document = state.documents.find((item) => item.id === id);
    if (!document) return sendJson(res, 404, { detail: "Document not found" });
    ensureProcessed(document);
    return sendJson(res, 200, { document_id: document.id, format: url.searchParams.get("format") || "json", payload: document.final_result_json });
  }

  const docMatch = url.pathname.match(/^\/api\/documents\/([^/]+)(?:\/(run|status|result|extraction|validation|review))?$/);
  if (docMatch) {
    const [, id, action] = docMatch;
    const document = state.documents.find((item) => item.id === id);
    if (!document) return sendJson(res, 404, { detail: "Document not found" });

    if (req.method === "GET" && !action) {
      ensureProcessed(document);
      return sendJson(res, 200, toDetail(document));
    }
    if (req.method === "POST" && action === "run") {
      rerunDocument(document);
      return sendJson(res, 200, { document_id: document.id, queued_stages: ["normalize", "classify", "extract", "validate", "route", "qa", "merge"], status: document.status, updated_ts: document.updated_ts });
    }
    if (req.method === "GET" && action === "status") {
      ensureProcessed(document);
      return sendJson(res, 200, { document_id: document.id, status: document.status, completed_stages: 7, total_stages: 7, progress: 1, stage_runs: document.stage_runs });
    }
    if (req.method === "GET" && action === "result") {
      ensureProcessed(document);
      return sendJson(res, 200, { document_id: document.id, result: document.final_result_json });
    }
    if (req.method === "GET" && action === "extraction") {
      ensureProcessed(document);
      return sendJson(res, 200, { document_id: document.id, extraction: document.final_result_json.extraction });
    }
    if (req.method === "GET" && action === "validation") {
      ensureProcessed(document);
      return sendJson(res, 200, { document_id: document.id, validation: document.final_result_json.validation });
    }
    if (req.method === "POST" && action === "review") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      ensureProcessed(document);
      document.review = body;
      document.status = body.decision === "approved" ? "approved" : "reviewed";
      document.final_result_json.review = body;
      document.updated_ts = nowIso();
      saveState();
      return sendJson(res, 200, { document_id: document.id, review: body, status: document.status });
    }
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/documents/")) {
    const id = url.pathname.split("/").pop();
    const index = state.documents.findIndex((item) => item.id === id);
    if (index === -1) return sendJson(res, 404, { detail: "Document not found" });
    state.documents.splice(index, 1);
    saveState();
    return sendJson(res, 200, { deleted: true, document_id: id });
  }

  if (req.method === "GET" && url.pathname === "/api/search") {
    const query = (url.searchParams.get("q") || "").toLowerCase();
    const hits = state.documents.filter((document) => document.filename.toLowerCase().includes(query) || (document.source_label || "").toLowerCase().includes(query)).map((document) => ({ document_id: document.id, filename: document.filename, doc_type: document.doc_type, route: document.route, page: 1, chunk_id: "chunk_1", snippet: document.filename }));
    return sendJson(res, 200, { query, hits });
  }

  return sendJson(res, 404, { detail: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock Enterprise IDP backend listening at http://127.0.0.1:${PORT}`);
});
