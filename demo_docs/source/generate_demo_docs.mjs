import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, "..", "generated");
const groundTruthDir = path.resolve(__dirname, "..", "ground_truth");
const htmlDir = path.join(generatedDir, "html");

mkdirSync(generatedDir, { recursive: true });
mkdirSync(groundTruthDir, { recursive: true });
mkdirSync(htmlDir, { recursive: true });

const docs = [
  invoice("invoice_001", "Northwind Office Supply", "INV-1001", "2026-03-01", "2026-03-15", "PO-4401", "Northwind Lockbox", [["Printer Paper", 10, 4.5, 45], ["Ink Cartridge", 2, 67.5, 135]], 180, 14.4, 194.4, "pdf"),
  invoice("invoice_002", "BlueHarbor Logistics", "INV-2048", "2026-03-05", "2026-03-30", "PO-4402", "BlueHarbor Finance", [["Freight Handling", 1, 320, 320], ["Fuel Surcharge", 1, 48, 48]], 368, 29.44, 397.44, "scan"),
  invoice("invoice_003", "Asterix Health Admin", "INV-3010", "2026-03-10", "2026-03-22", "PO-4403", "Asterix Payments", [["Records Digitization", 12, 55, 660], ["Secure Pickup", 1, 85, 85]], 745, 59.6, 804.6, "pdf"),
  invoice("invoice_004", "Summit Telecom", "INV-4104", "2026-03-12", "2026-03-26", "PO-4404", "Summit Remittance", [["Circuit Activation", 4, 80, 320], ["Support Window", 1, 125, 125]], 445, 35.6, 480.6, "scan"),
  invoice("invoice_005_mismatch", "Granite Manufacturing", "INV-5099", "2026-03-14", "2026-03-28", "PO-4405", "Granite AP", [["Machine Part A", 3, 120, 360], ["Machine Part B", 1, 90, 90]], 450, 36, 500, "pdf"),
  purchaseOrder("po_001", "Contoso Retail", "Polar Components", "PO-7101", "2026-03-02", "Contoso Dallas Warehouse", "Contoso Accounts", [["Cooling Fan", 20, 15, 300], ["Sensor Kit", 10, 22, 220]], 520, "pdf"),
  purchaseOrder("po_002_missing_shipto", "Bridgeway Foods", "River Industrial", "PO-7102", "2026-03-08", null, "Bridgeway Payables", [["Conveyor Belt", 2, 480, 960]], 960, "scan"),
  purchaseOrder("po_003", "Northwind Labs", "Metro Forms", "PO-7103", "2026-03-11", "Northwind Lab Dock", "Northwind Shared Services", [["Specimen Labels", 50, 2.5, 125], ["Storage Bins", 8, 14, 112]], 237, "pdf"),
  receipt("receipt_001", "Corner Market", "2026-03-18 09:14", [["Coffee Beans", 1, 14.99, 14.99], ["Paper Cups", 2, 4.5, 9]], 23.99, "Corporate Card", "Office Supplies", "pdf"),
  receipt("receipt_002", "Urban Fuel", "2026-03-18 18:40", [["Fuel", 11.2, 3.85, 43.12]], 43.12, "Fleet Card", "Travel", "scan"),
  receipt("receipt_003", "City Deli", "2026-03-19 12:06", [["Team Lunch", 1, 58.6, 58.6]], 58.6, "Visa", "Meals", "pdf"),
  bankStatement("statement_001", "XXXX-2201", "2026-02-01 to 2026-02-29", 15240.33, 18495.12, [["2026-02-03", "Payroll Deposit", 4200], ["2026-02-08", "Office Rent", -3200], ["2026-02-12", "Utilities", -445.21]], "scan"),
  bankStatement("statement_002", "XXXX-2209", "2026-03-01 to 2026-03-31", 8400.5, 9122.1, [["2026-03-04", "Client Payment", 1800], ["2026-03-09", "Insurance Premium", -510.4], ["2026-03-18", "Payroll", -568]], "pdf"),
  hrForm("onboarding_001", "Jordan Lee", "77 Market Street, Chicago, IL", "XXX-XX-4123", "2026-04-01", "Acme Shared Services", true, "scan"),
  hrForm("onboarding_002", "Priya Raman", "1020 Elm Avenue, Dallas, TX", "XXX-XX-7721", "2026-04-15", "Contoso Operations", true, "pdf"),
  shipping("shipping_001", "TRK-994102", "Acme Fulfillment Center", "Central Hospital Receiving", "RapidShip", "188 lb", "2026-03-16", "pdf"),
  shipping("shipping_002", "TRK-994103", "Bridgeway Foods Plant", "Northwind Retail Hub", "FreightOne", "412 lb", "2026-03-17", "scan")
];

function invoice(source_label, vendor, invoice_number, invoice_date, due_date, po_number, remit_to, items, subtotal, tax, total, ingest_variant) {
  return {
    source_label,
    doc_type: "invoice",
    ingest_variant,
    title: "Invoice",
    fields: { vendor, invoice_number, invoice_date, due_date, currency: "USD", line_items: items.map(itemObject), subtotal, tax, total, po_number, remit_to },
    lines: [
      "Invoice",
      `Vendor: ${vendor}`,
      `Invoice #: ${invoice_number}`,
      `Invoice Date: ${invoice_date}`,
      `Due Date: ${due_date}`,
      "Currency: USD",
      `PO #: ${po_number}`,
      `Remit To: ${remit_to}`,
      ...items.map(([description, quantity, unit_price, amount]) => `ITEM| ${description} | Qty: ${quantity} | Unit: ${unit_price.toFixed(2)} | Amount: ${amount.toFixed(2)}`),
      `Subtotal: ${subtotal.toFixed(2)}`,
      `Tax: ${tax.toFixed(2)}`,
      `Total: ${total.toFixed(2)}`
    ]
  };
}

function purchaseOrder(source_label, buyer, supplier, po_number, order_date, ship_to, bill_to, items, total, ingest_variant) {
  return {
    source_label,
    doc_type: "purchase_order",
    ingest_variant,
    title: "Purchase Order",
    fields: { buyer, supplier, po_number, order_date, ship_to, bill_to, items: items.map(itemObject), total },
    lines: [
      "Purchase Order",
      `Buyer: ${buyer}`,
      `Supplier: ${supplier}`,
      `PO #: ${po_number}`,
      `Order Date: ${order_date}`,
      ...(ship_to ? [`Ship To: ${ship_to}`] : []),
      `Bill To: ${bill_to}`,
      ...items.map(([description, quantity, unit_price, amount]) => `ITEM| ${description} | Qty: ${quantity} | Unit: ${unit_price.toFixed(2)} | Amount: ${amount.toFixed(2)}`),
      `Total: ${total.toFixed(2)}`
    ]
  };
}

function receipt(source_label, merchant, transaction_datetime, items, total, payment_method, category, ingest_variant) {
  return {
    source_label,
    doc_type: "receipt",
    ingest_variant,
    title: "Receipt",
    fields: { merchant, transaction_datetime, items: items.map(itemObject), total, payment_method, category },
    lines: [
      "Receipt",
      `Merchant: ${merchant}`,
      `Date/Time: ${transaction_datetime}`,
      ...items.map(([description, quantity, unit_price, amount]) => `ITEM| ${description} | Qty: ${quantity} | Unit: ${unit_price.toFixed(2)} | Amount: ${amount.toFixed(2)}`),
      `Total: ${total.toFixed(2)}`,
      `Payment Method: ${payment_method}`,
      `Category: ${category}`
    ]
  };
}

function bankStatement(source_label, account_number, statement_period, beginning_balance, ending_balance, transactions, ingest_variant) {
  return {
    source_label,
    doc_type: "bank_statement",
    ingest_variant,
    title: "Bank Statement",
    fields: { account_number, statement_period, beginning_balance, ending_balance, transactions: transactions.map(transactionObject) },
    lines: [
      "Bank Statement",
      `Account Number: ${account_number}`,
      `Statement Period: ${statement_period}`,
      `Beginning Balance: ${beginning_balance.toFixed(2)}`,
      `Ending Balance: ${ending_balance.toFixed(2)}`,
      ...transactions.map(([date, description, amount]) => `TXN| ${date} | ${description} | ${amount.toFixed(2)}`)
    ]
  };
}

function hrForm(source_label, person_name, address, identifier_masked, start_date, employer, signatures_present, ingest_variant) {
  return {
    source_label,
    doc_type: "hr_form",
    ingest_variant,
    title: "Employee Onboarding Form",
    fields: { person_name, address, identifier_masked, start_date, employer, signatures_present: signatures_present ? "yes" : "no" },
    lines: [
      "Employee Onboarding Form",
      `Employee: ${person_name}`,
      `Address: ${address}`,
      `Identifier: ${identifier_masked}`,
      `Start Date: ${start_date}`,
      `Employer: ${employer}`,
      signatures_present ? "Signature on file" : "Unsigned"
    ]
  };
}

function shipping(source_label, tracking_number, origin, destination, carrier, weight, ship_date, ingest_variant) {
  return {
    source_label,
    doc_type: "shipping_document",
    ingest_variant,
    title: "Shipping Document / Bill of Lading",
    fields: { tracking_number, origin, destination, carrier, weight, ship_date },
    lines: [
      "Bill of Lading",
      `Tracking: ${tracking_number}`,
      `Ship From: ${origin}`,
      `Ship To: ${destination}`,
      `Carrier: ${carrier}`,
      `Weight: ${weight}`,
      `Ship Date: ${ship_date}`
    ]
  };
}

function itemObject([description, quantity, unit_price, amount]) {
  return { description, quantity, unit_price, amount };
}

function transactionObject([date, description, amount]) {
  return { date, description, amount };
}

function renderHtml(doc) {
  const body = doc.lines.map((line) => `<div class="line">${line}</div>`).join("");
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; }
        .sheet { width: 1040px; min-height: 1460px; margin: 0 auto; background: white; border: 1px solid #d9e1ee; border-radius: 16px; padding: 48px; box-sizing: border-box; }
        .badge { display: inline-block; border-radius: 999px; background: #dbeafe; color: #1d4ed8; padding: 8px 14px; font-size: 14px; font-weight: bold; }
        h1 { font-size: 34px; margin: 20px 0 12px; color: #0f172a; }
        .line { font-size: 19px; line-height: 1.6; color: #1f2937; margin-bottom: 8px; white-space: pre-wrap; }
        .footer { margin-top: 36px; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="badge">${doc.doc_type}</div>
        <h1>${doc.title}</h1>
        ${body}
        <div class="footer">Synthetic demo document for Enterprise IDP Studio.</div>
      </div>
    </body>
  </html>`;
}

function escapePdf(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function writePdf(doc, pdfPath) {
  const lines = [doc.title, ...doc.lines];
  let content = "BT\n/F1 16 Tf\n50 780 Td\n18 TL\n";
  for (const line of lines) {
    content += `(${escapePdf(line)}) Tj\nT*\n`;
  }
  content += "ET\n";
  const streamLength = Buffer.byteLength(content, "utf8");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${streamLength} >> stream\n${content}endstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }
  const xrefPosition = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
  writeFileSync(pdfPath, pdf, "utf8");
}

function writePng(doc, pngPath) {
  const linesLiteral = JSON.stringify([doc.title, ...doc.lines]);
  const command = `
    Add-Type -AssemblyName System.Drawing;
    $lines = ConvertFrom-Json @'
${linesLiteral}
'@;
    $bmp = New-Object System.Drawing.Bitmap 1400, 1800;
    $graphics = [System.Drawing.Graphics]::FromImage($bmp);
    $graphics.Clear([System.Drawing.Color]::White);
    $titleFont = New-Object System.Drawing.Font('Arial', 26, [System.Drawing.FontStyle]::Bold);
    $bodyFont = New-Object System.Drawing.Font('Arial', 18);
    $subFont = New-Object System.Drawing.Font('Arial', 12);
    $brush = [System.Drawing.Brushes]::Black;
    $accent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235));
    $graphics.FillEllipse($accent, 70, 60, 180, 50);
    $graphics.DrawString('${doc.doc_type}', $subFont, [System.Drawing.Brushes]::White, 120, 78);
    $graphics.DrawString($lines[0], $titleFont, $brush, 70, 150);
    $y = 220;
    for ($i = 1; $i -lt $lines.Length; $i++) {
      $graphics.DrawString([string]$lines[$i], $bodyFont, $brush, 70, $y);
      $y += 42;
    }
    $graphics.DrawString('Synthetic demo document for Enterprise IDP Studio.', $subFont, [System.Drawing.Brushes]::Gray, 70, 1680);
    $bmp.Save('${pngPath.replaceAll("\\", "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png);
    $graphics.Dispose();
    $bmp.Dispose();
  `;
  execFileSync("powershell", ["-NoProfile", "-Command", command], { stdio: "ignore" });
}

for (const doc of docs) {
  const htmlPath = path.join(htmlDir, `${doc.source_label}.html`);
  const pdfPath = path.join(generatedDir, `${doc.source_label}.pdf`);
  const pngPath = path.join(generatedDir, `${doc.source_label}.png`);
  writeFileSync(htmlPath, renderHtml(doc), "utf8");
  writeFileSync(path.join(groundTruthDir, `${doc.source_label}.json`), JSON.stringify({ source_label: doc.source_label, doc_type: doc.doc_type, fields: doc.fields }, null, 2));

  writePdf(doc, pdfPath);
  writePng(doc, pngPath);

  doc.pdf_filename = `${doc.source_label}.pdf`;
  doc.scan_filename = `${doc.source_label}.png`;
}

writeFileSync(path.join(generatedDir, "manifest.json"), JSON.stringify({ generated_at: new Date().toISOString(), documents: docs }, null, 2));
