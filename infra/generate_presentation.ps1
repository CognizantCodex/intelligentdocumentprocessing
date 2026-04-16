param(
  [string]$OutputPath = "C:\Users\456989\OneDrive - Cognizant\Documents\New project\Enterprise-IDP-Studio-Presentation.pptx"
)

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$presentation = $ppt.Presentations.Add()

function Add-TitleSlide {
  param([string]$Title, [string]$Subtitle)
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 1)
  $slide.Shapes.Title.TextFrame.TextRange.Text = $Title
  $slide.Shapes.Item(2).TextFrame.TextRange.Text = $Subtitle
}

function Add-BulletSlide {
  param([string]$Title, [string[]]$Bullets)
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 2)
  $slide.Shapes.Title.TextFrame.TextRange.Text = $Title
  $textRange = $slide.Shapes.Item(2).TextFrame.TextRange
  $textRange.Text = ($Bullets -join "`r")
  $textRange.Font.Size = 22
}

Add-TitleSlide `
  "Enterprise IDP Studio" `
  "Production-style Intelligent Document Processing with grounded extraction, validation, routing, review, and measurable demo metrics"

Add-BulletSlide `
  "Problem & Outcome" `
  @(
    "Turn PDFs, images, and text documents into structured, validated, searchable business data."
    "Support end-to-end workflows: upload, classify, extract, validate, route, review, approve, and export."
    "Keep every field grounded with evidence citations and configurable PII detection/redaction."
  )

Add-BulletSlide `
  "Architecture" `
  @(
    "Frontend: Next.js App Router + TypeScript + Tailwind dashboard for uploads, processing, review, evidence, and metrics."
    "Backend: FastAPI async API with Postgres metadata, Celery background stages, Redis queueing, and local-file storage abstraction."
    "Document understanding: pdfplumber text extraction, OCR fallback for images/scans, schema-driven extraction, rules validation, and routing."
  )

Add-BulletSlide `
  "Parallel Pipeline" `
  @(
    "S1 Normalize/OCR -> S2 Classify -> S3 Extract -> S4 Validate + S6 QA in parallel -> S5 Route -> S7 Merge."
    "Every stage is persisted in stage_runs with queued/running/succeeded/failed status, latency, output payload, and errors."
    "Final result record combines workflow state, normalized data, citations, validation output, review status, and export-ready payloads."
  )

Add-BulletSlide `
  "Demo Dataset & Metrics" `
  @(
    "17 synthetic documents: 5 invoices, 3 purchase orders, 3 receipts, 2 bank statements, 2 onboarding forms, 2 shipping docs."
    "Both PDF and scan-style PNG variants are generated, with ground truth JSON labels for each source document."
    "Metrics exposed in-app: doc-type accuracy, field precision/recall, validation pass rate, and average confidence."
  )

Add-BulletSlide `
  "Safety, Compliance & Review" `
  @(
    "No legal, medical, or financial advice outputs. The app focuses on document understanding, extraction, routing, and review."
    "Built-in disclaimer: AI extraction may be imperfect; verify before use."
    "PII detection and redaction toggles, configurable retention days, deletion endpoint, and audit logging for key actions."
  )

Add-BulletSlide `
  "Judging Criteria Alignment" `
  @(
    "Depth of Codex Integration: full-stack build flow, data generation, pipeline design, dashboard UX, and deck automation all produced in one repo."
    "Real-World Partner Impact: addresses AP, procurement, HR onboarding, finance operations, shipping, and claims-style document workflows."
    "Reusability & Adoption Potential: provider-swappable LLM layer, storage abstraction, stage-based orchestration, and integration-ready export APIs."
    "Demo & Pitch Quality: live processing timeline, review queue, evidence panel, metrics page, demo dataset, and presentation deck."
  )

Add-BulletSlide `
  "Demo Walkthrough" `
  @(
    "1. Load the synthetic dataset or upload a real sample file."
    "2. Run the pipeline and watch stage-level progress with partial outputs."
    "3. Open a document, inspect extracted fields and evidence, review validation issues, and approve or reject."
    "4. Export normalized JSON/CSV and show metrics generated against ground truth."
  )

$presentation.SaveAs($OutputPath, 24)
$presentation.Close()
$ppt.Quit()
