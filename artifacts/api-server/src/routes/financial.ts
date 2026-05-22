import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  contractorBillsTable,
  billDeductionsTable,
  paymentVouchersTable,
  ledgerAccountsTable,
  ledgerEntriesTable,
  clientInvoicesTable,
  gstEntriesTable,
  tdsEntriesTable,
  retentionLedgerTable,
  advanceLedgerTable,
  projectsTable,
  workOrderEstimatesTable,
  BILL_STATUSES,
} from "@workspace/db";
import { eq, and, asc, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS } from "../middlewares/requireAuth";
import { n, nOrNull, d, dReq } from "../lib/serialize";

const router: IRouter = Router();

// ─── Bill Workflow Transitions ────────────────────────────────────────────────
const BILL_TRANSITIONS: Record<string, string> = {
  draft: "submitted",
  submitted: "technical_check",
  technical_check: "qs_scrutiny",
  qs_scrutiny: "pm_certification",
  pm_certification: "auto_deductions",
  auto_deductions: "gst_invoice",
  gst_invoice: "finance_approval",
  finance_approval: "payment_released",
  payment_released: "closed",
};
const BILL_STEP_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  technical_check: "Technical Check",
  qs_scrutiny: "QS Scrutiny",
  pm_certification: "PM Certification",
  auto_deductions: "Auto Deductions",
  gst_invoice: "GST Invoice",
  finance_approval: "Finance Approval",
  payment_released: "Payment Released",
  closed: "Closed",
};

function serializeBill(b: any) {
  return {
    id: b.id,
    projectId: b.projectId,
    workOrderId: b.workOrderId ?? null,
    billNumber: b.billNumber,
    billDate: dReq(b.billDate),
    periodFrom: d(b.periodFrom),
    periodTo: d(b.periodTo),
    grossAmount: n(b.grossAmount),
    totalDeductions: n(b.totalDeductions),
    gstAmount: n(b.gstAmount),
    netPayable: n(b.netPayable),
    status: b.status,
    stepLabel: BILL_STEP_LABELS[b.status] ?? b.status,
    invoiceUrl: b.invoiceUrl ?? null,
    measurementUrl: b.measurementUrl ?? null,
    irnNumber: b.irnNumber ?? null,
    remarks: b.remarks ?? null,
    technicalRemarks: b.technicalRemarks ?? null,
    qsRemarks: b.qsRemarks ?? null,
    pmRemarks: b.pmRemarks ?? null,
    submittedById: b.submittedById ?? null,
    technicalCheckedById: b.technicalCheckedById ?? null,
    qsScrutinizedById: b.qsScrutinizedById ?? null,
    pmCertifiedById: b.pmCertifiedById ?? null,
    financeApprovedById: b.financeApprovedById ?? null,
    utr: b.utr ?? null,
    paymentMode: b.paymentMode ?? null,
    paidAt: d(b.paidAt),
    closedAt: d(b.closedAt),
    technicalCheckedAt: d(b.technicalCheckedAt),
    qsScrutinizedAt: d(b.qsScrutinizedAt),
    pmCertifiedAt: d(b.pmCertifiedAt),
    financeApprovedAt: d(b.financeApprovedAt),
    createdAt: dReq(b.createdAt),
    updatedAt: dReq(b.updatedAt),
  };
}

function serializeDeduction(d2: any) {
  return {
    id: d2.id,
    billId: d2.billId,
    deductionType: d2.deductionType,
    description: d2.description,
    rate: n(d2.rate),
    baseAmount: n(d2.baseAmount),
    amount: n(d2.amount),
    legalRef: d2.legalRef ?? null,
    createdAt: dReq(d2.createdAt),
  };
}

function serializeVoucher(v: any) {
  return {
    id: v.id,
    billId: v.billId,
    projectId: v.projectId,
    voucherNumber: v.voucherNumber,
    amount: n(v.amount),
    mode: v.mode,
    bankName: v.bankName ?? null,
    accountNumber: v.accountNumber ?? null,
    ifscCode: v.ifscCode ?? null,
    utr: v.utr ?? null,
    paidAt: d(v.paidAt),
    releasedById: v.releasedById ?? null,
    createdAt: dReq(v.createdAt),
  };
}

function serializeLedgerAccount(a: any) {
  return {
    id: a.id,
    organisationId: a.organisationId ?? null,
    projectId: a.projectId ?? null,
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountType: a.accountType,
    parentAccountId: a.parentAccountId ?? null,
    openingBalance: n(a.openingBalance),
    currentBalance: n(a.currentBalance),
    isActive: a.isActive,
    createdAt: dReq(a.createdAt),
  };
}

function serializeLedgerEntry(e: any) {
  return {
    id: e.id,
    projectId: e.projectId,
    entryNumber: e.entryNumber,
    entryDate: dReq(e.entryDate),
    entityType: e.entityType ?? null,
    entityId: e.entityId ?? null,
    narration: e.narration,
    debitAccountId: e.debitAccountId ?? null,
    creditAccountId: e.creditAccountId ?? null,
    amount: n(e.amount),
    createdById: e.createdById ?? null,
    createdAt: dReq(e.createdAt),
  };
}

function serializeClientInvoice(inv: any) {
  return {
    id: inv.id,
    projectId: inv.projectId,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    invoiceDate: dReq(inv.invoiceDate),
    dueDate: d(inv.dueDate),
    milestoneId: inv.milestoneId ?? null,
    grossAmount: n(inv.grossAmount),
    cgstRate: n(inv.cgstRate),
    sgstRate: n(inv.sgstRate),
    igstRate: n(inv.igstRate),
    gstAmount: n(inv.gstAmount),
    netAmount: n(inv.netAmount),
    retentionHeld: n(inv.retentionHeld),
    amountReceived: n(inv.amountReceived),
    status: inv.status,
    irnNumber: inv.irnNumber ?? null,
    reraReference: inv.reraReference ?? null,
    notes: inv.notes ?? null,
    paidAt: d(inv.paidAt),
    createdAt: dReq(inv.createdAt),
    updatedAt: dReq(inv.updatedAt),
  };
}

function serializeGstEntry(g: any) {
  return {
    id: g.id,
    projectId: g.projectId,
    entityType: g.entityType,
    entityId: g.entityId,
    invoiceNumber: g.invoiceNumber,
    invoiceDate: dReq(g.invoiceDate),
    partyGstin: g.partyGstin ?? null,
    partyName: g.partyName,
    taxableValue: n(g.taxableValue),
    cgstRate: n(g.cgstRate),
    cgstAmount: n(g.cgstAmount),
    sgstRate: n(g.sgstRate),
    sgstAmount: n(g.sgstAmount),
    igstRate: n(g.igstRate),
    igstAmount: n(g.igstAmount),
    totalGst: n(g.totalGst),
    hsnCode: g.hsnCode ?? null,
    entryType: g.entryType,
    createdAt: dReq(g.createdAt),
  };
}

function serializeTdsEntry(t: any) {
  return {
    id: t.id,
    projectId: t.projectId,
    billId: t.billId ?? null,
    vendorName: t.vendorName,
    pan: t.pan ?? null,
    sectionCode: t.sectionCode,
    grossAmount: n(t.grossAmount),
    tdsRate: n(t.tdsRate),
    tdsAmount: n(t.tdsAmount),
    depositedAt: d(t.depositedAt),
    challanNumber: t.challanNumber ?? null,
    quarter: t.quarter ?? null,
    createdAt: dReq(t.createdAt),
  };
}

// ─── Auto-Deduction Engine ────────────────────────────────────────────────────
async function computeDeductions(billId: string, grossAmount: number, workOrderId: string | null, projectId: string) {
  await db.delete(billDeductionsTable).where(eq(billDeductionsTable.billId, billId));
  const deductions: { type: string; desc: string; rate: number; base: number; legal: string }[] = [];

  // TDS Sec 194C — 2% for companies, 1% for individuals; use 2% as default
  const tdsRate = 0.02;
  deductions.push({ type: "tds_194c", desc: "TDS u/s 194C — Payments to contractors (company)", rate: tdsRate * 100, base: grossAmount, legal: "Income Tax Act, 1961 — Section 194C" });

  // Retention 5% of gross
  deductions.push({ type: "retention", desc: "Retention money @ 5% of gross bill value", rate: 5, base: grossAmount, legal: "Contract clause 14.3 — Retention 5% until DLP" });

  // Labour Welfare Fund — flat 0.5%
  deductions.push({ type: "lwf", desc: "Labour Welfare Fund contribution @ 0.5%", rate: 0.5, base: grossAmount, legal: "Building & Other Construction Workers Act, 1996" });

  // Advance recovery — check advance ledger balance
  if (workOrderId) {
    const advRows = await db.select({ balance: advanceLedgerTable.balance })
      .from(advanceLedgerTable)
      .where(and(eq(advanceLedgerTable.workOrderId, workOrderId), eq(advanceLedgerTable.projectId, projectId)))
      .orderBy(desc(advanceLedgerTable.createdAt))
      .limit(1);
    const advBalance = advRows.length > 0 ? n(advRows[0].balance) : 0;
    if (advBalance > 0) {
      const recoveryPct = 20;
      const recoveryAmt = Math.min(grossAmount * recoveryPct / 100, advBalance);
      deductions.push({ type: "advance_recovery", desc: `Advance recovery @ ${recoveryPct}% of gross (outstanding: ₹${advBalance.toLocaleString()})`, rate: recoveryPct, base: grossAmount, legal: "Contract clause 9.1 — Mobilization advance recovery" });
    }
  }

  let totalDeductions = 0;
  for (const d3 of deductions) {
    const amount = Math.round(d3.base * d3.rate / 100 * 100) / 100;
    totalDeductions += amount;
    await db.insert(billDeductionsTable).values({
      billId,
      deductionType: d3.type,
      description: d3.desc,
      rate: String(d3.rate),
      baseAmount: String(d3.base),
      amount: String(amount),
      legalRef: d3.legal,
    });
  }
  return totalDeductions;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACTOR BILLS
// ─────────────────────────────────────────────────────────────────────────────

// List project bills
router.get("/projects/:projectId/contractor-bills", requireAuth, async (req: Request, res: Response) => {
  const bills = await db.select().from(contractorBillsTable)
    .where(eq(contractorBillsTable.projectId, req.params.projectId))
    .orderBy(desc(contractorBillsTable.createdAt));
  res.json(bills.map(serializeBill));
});

// Create bill (contractor or PM)
router.post("/projects/:projectId/contractor-bills", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.billNumber || !b.grossAmount) {
    res.status(400).json({ error: "billNumber and grossAmount required" }); return;
  }
  const gross = n(b.grossAmount);
  const gstAmt = Math.round(gross * 0.18 * 100) / 100;
  const [bill] = await db.insert(contractorBillsTable).values({
    projectId: req.params.projectId,
    workOrderId: b.workOrderId ?? null,
    billNumber: b.billNumber,
    billDate: b.billDate ? new Date(b.billDate) : new Date(),
    periodFrom: b.periodFrom ? new Date(b.periodFrom) : null,
    periodTo: b.periodTo ? new Date(b.periodTo) : null,
    grossAmount: String(gross),
    gstAmount: String(gstAmt),
    netPayable: String(gross + gstAmt),
    invoiceUrl: b.invoiceUrl ?? null,
    measurementUrl: b.measurementUrl ?? null,
    remarks: b.remarks ?? null,
    submittedById: (req as any).user?.id ?? null,
  }).returning();
  res.status(201).json(serializeBill(bill));
});

// Get single bill
router.get("/contractor-bills/:billId", requireAuth, async (req: Request, res: Response) => {
  const [bill] = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.id, req.params.billId));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeBill(bill));
});

// Advance bill through workflow
router.post("/contractor-bills/:billId/advance", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const [bill] = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.id, req.params.billId));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status === "closed") { res.status(409).json({ error: "Bill is already closed" }); return; }

  const nextStatus = BILL_TRANSITIONS[bill.status];
  if (!nextStatus) { res.status(409).json({ error: `No transition from ${bill.status}` }); return; }

  const userId = (req as any).user?.id ?? null;
  const now = new Date();
  const patch: Record<string, any> = { status: nextStatus };

  if (nextStatus === "technical_check") patch.submittedById = userId;
  if (nextStatus === "qs_scrutiny") { patch.technicalCheckedById = userId; patch.technicalCheckedAt = now; patch.technicalRemarks = b.remarks ?? null; }
  if (nextStatus === "pm_certification") { patch.qsScrutinizedById = userId; patch.qsScrutinizedAt = now; patch.qsRemarks = b.remarks ?? null; }
  if (nextStatus === "auto_deductions") { patch.pmCertifiedById = userId; patch.pmCertifiedAt = now; patch.pmRemarks = b.remarks ?? null; }
  if (nextStatus === "finance_approval") {
    // Auto-compute deductions
    const total = await computeDeductions(bill.id, n(bill.grossAmount), bill.workOrderId, bill.projectId);
    const net = n(bill.grossAmount) + n(bill.gstAmount) - total;
    patch.totalDeductions = String(total);
    patch.netPayable = String(Math.max(0, net));
  }
  if (nextStatus === "gst_invoice") {
    // Generate GST e-invoice placeholder
    patch.irnNumber = `IRN-${bill.projectId.slice(-6).toUpperCase()}-${bill.billNumber}-${Date.now().toString(36).toUpperCase()}`;
  }
  if (nextStatus === "payment_released") { patch.financeApprovedById = userId; patch.financeApprovedAt = now; }
  if (nextStatus === "closed") {
    patch.utr = b.utr ?? `UTR${Date.now().toString(36).toUpperCase()}`;
    patch.paymentMode = b.paymentMode ?? "neft";
    patch.paidAt = now;
    patch.closedAt = now;
  }

  const [updated] = await db.update(contractorBillsTable).set(patch).where(eq(contractorBillsTable.id, bill.id)).returning();
  res.json(serializeBill(updated));
});

// Get bill deductions
router.get("/contractor-bills/:billId/deductions", requireAuth, async (req: Request, res: Response) => {
  const deductions = await db.select().from(billDeductionsTable)
    .where(eq(billDeductionsTable.billId, req.params.billId))
    .orderBy(asc(billDeductionsTable.createdAt));
  res.json(deductions.map(serializeDeduction));
});

// Release payment (Finance role)
router.post("/contractor-bills/:billId/release-payment", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const [bill] = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.id, req.params.billId));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }
  if (bill.status !== "finance_approval") { res.status(409).json({ error: "Bill must be at finance_approval stage to release payment" }); return; }

  const utr = b.utr ?? `UTR${Date.now().toString(36).toUpperCase()}`;
  const mode = b.mode ?? "neft";
  const paidAmount = n(bill.netPayable);

  const voucherNumber = `PV-${bill.projectId.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const [voucher] = await db.insert(paymentVouchersTable).values({
    billId: bill.id,
    projectId: bill.projectId,
    voucherNumber,
    amount: String(paidAmount),
    mode,
    bankName: b.bankName ?? null,
    accountNumber: b.accountNumber ?? null,
    ifscCode: b.ifscCode ?? null,
    utr,
    paidAt: new Date(),
    releasedById: (req as any).user?.id ?? null,
  }).returning();

  const [updated] = await db.update(contractorBillsTable).set({
    status: "payment_released",
    utr,
    paymentMode: mode,
    paidAt: new Date(),
    financeApprovedById: (req as any).user?.id ?? null,
    financeApprovedAt: new Date(),
  }).where(eq(contractorBillsTable.id, bill.id)).returning();

  // Auto-create TDS entry
  const gross = n(bill.grossAmount);
  const tdsAmt = Math.round(gross * 0.02 * 100) / 100;
  await db.insert(tdsEntriesTable).values({
    projectId: bill.projectId,
    billId: bill.id,
    vendorName: `Contractor — Bill ${bill.billNumber}`,
    sectionCode: "194C",
    grossAmount: String(gross),
    tdsRate: "2",
    tdsAmount: String(tdsAmt),
    quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}FY${String(new Date().getFullYear()).slice(-2)}`,
  });

  res.json({ bill: serializeBill(updated), voucher: serializeVoucher(voucher) });
});

// Get payment vouchers for a bill
router.get("/contractor-bills/:billId/vouchers", requireAuth, async (req: Request, res: Response) => {
  const vouchers = await db.select().from(paymentVouchersTable)
    .where(eq(paymentVouchersTable.billId, req.params.billId))
    .orderBy(desc(paymentVouchersTable.createdAt));
  res.json(vouchers.map(serializeVoucher));
});

// Update bill (patch remarks/URLs before submission)
router.patch("/contractor-bills/:billId", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const [bill] = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.id, req.params.billId));
  if (!bill) { res.status(404).json({ error: "Not found" }); return; }

  const patch: Record<string, any> = {};
  if (b.remarks !== undefined) patch.remarks = b.remarks;
  if (b.invoiceUrl !== undefined) patch.invoiceUrl = b.invoiceUrl;
  if (b.measurementUrl !== undefined) patch.measurementUrl = b.measurementUrl;
  if (b.grossAmount !== undefined) {
    const gross = n(b.grossAmount);
    const gst = Math.round(gross * 0.18 * 100) / 100;
    patch.grossAmount = String(gross);
    patch.gstAmount = String(gst);
    patch.netPayable = String(gross + gst);
  }

  const [updated] = await db.update(contractorBillsTable).set(patch).where(eq(contractorBillsTable.id, bill.id)).returning();
  res.json(serializeBill(updated));
});

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT INVOICES
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:projectId/client-invoices", requireAuth, async (req: Request, res: Response) => {
  const invoices = await db.select().from(clientInvoicesTable)
    .where(eq(clientInvoicesTable.projectId, req.params.projectId))
    .orderBy(desc(clientInvoicesTable.createdAt));
  res.json(invoices.map(serializeClientInvoice));
});

router.post("/projects/:projectId/client-invoices", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.invoiceNumber || !b.clientName || !b.grossAmount) {
    res.status(400).json({ error: "invoiceNumber, clientName, grossAmount required" }); return;
  }
  const gross = n(b.grossAmount);
  const cgst = n(b.cgstRate ?? 9);
  const sgst = n(b.sgstRate ?? 9);
  const igst = n(b.igstRate ?? 0);
  const gstAmt = Math.round(gross * (cgst + sgst + igst) / 100 * 100) / 100;
  const retention = Math.round(gross * 0.05 * 100) / 100;
  const net = gross + gstAmt - retention;

  const [inv] = await db.insert(clientInvoicesTable).values({
    projectId: req.params.projectId,
    invoiceNumber: b.invoiceNumber,
    clientName: b.clientName,
    invoiceDate: b.invoiceDate ? new Date(b.invoiceDate) : new Date(),
    dueDate: b.dueDate ? new Date(b.dueDate) : null,
    milestoneId: b.milestoneId ?? null,
    grossAmount: String(gross),
    cgstRate: String(cgst),
    sgstRate: String(sgst),
    igstRate: String(igst),
    gstAmount: String(gstAmt),
    netAmount: String(net),
    retentionHeld: String(retention),
    reraReference: b.reraReference ?? null,
    notes: b.notes ?? null,
  }).returning();

  // Auto-create GST entry
  await db.insert(gstEntriesTable).values({
    projectId: req.params.projectId,
    entityType: "client_invoice",
    entityId: inv.id,
    invoiceNumber: b.invoiceNumber,
    partyGstin: b.clientGstin ?? null,
    partyName: b.clientName,
    taxableValue: String(gross),
    cgstRate: String(cgst),
    cgstAmount: String(Math.round(gross * cgst / 100 * 100) / 100),
    sgstRate: String(sgst),
    sgstAmount: String(Math.round(gross * sgst / 100 * 100) / 100),
    igstRate: String(igst),
    igstAmount: String(Math.round(gross * igst / 100 * 100) / 100),
    totalGst: String(gstAmt),
    hsnCode: "9954",
    entryType: "sale",
  });

  res.status(201).json(serializeClientInvoice(inv));
});

router.get("/client-invoices/:invoiceId", requireAuth, async (req: Request, res: Response) => {
  const [inv] = await db.select().from(clientInvoicesTable).where(eq(clientInvoicesTable.id, req.params.invoiceId));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializeClientInvoice(inv));
});

router.patch("/client-invoices/:invoiceId", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const [inv] = await db.select().from(clientInvoicesTable).where(eq(clientInvoicesTable.id, req.params.invoiceId));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }

  const patch: Record<string, any> = {};
  if (b.status !== undefined) { patch.status = b.status; if (b.status === "paid") { patch.paidAt = new Date(); patch.amountReceived = String(n(inv.netAmount)); } }
  if (b.irnNumber !== undefined) patch.irnNumber = b.irnNumber;
  if (b.notes !== undefined) patch.notes = b.notes;
  if (b.amountReceived !== undefined) patch.amountReceived = String(n(b.amountReceived));

  const [updated] = await db.update(clientInvoicesTable).set(patch).where(eq(clientInvoicesTable.id, inv.id)).returning();
  res.json(serializeClientInvoice(updated));
});

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:projectId/ledger-accounts", requireAuth, async (req: Request, res: Response) => {
  const accounts = await db.select().from(ledgerAccountsTable)
    .where(eq(ledgerAccountsTable.projectId, req.params.projectId))
    .orderBy(asc(ledgerAccountsTable.accountCode));
  res.json(accounts.map(serializeLedgerAccount));
});

router.post("/projects/:projectId/ledger-accounts", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.accountCode || !b.accountName || !b.accountType) {
    res.status(400).json({ error: "accountCode, accountName, accountType required" }); return;
  }
  const [account] = await db.insert(ledgerAccountsTable).values({
    projectId: req.params.projectId,
    accountCode: b.accountCode,
    accountName: b.accountName,
    accountType: b.accountType,
    parentAccountId: b.parentAccountId ?? null,
    openingBalance: String(n(b.openingBalance ?? 0)),
    currentBalance: String(n(b.openingBalance ?? 0)),
  }).returning();
  res.status(201).json(serializeLedgerAccount(account));
});

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

router.get("/projects/:projectId/ledger-entries", requireAuth, async (req: Request, res: Response) => {
  const entries = await db.select().from(ledgerEntriesTable)
    .where(eq(ledgerEntriesTable.projectId, req.params.projectId))
    .orderBy(desc(ledgerEntriesTable.entryDate));
  res.json(entries.map(serializeLedgerEntry));
});

router.post("/projects/:projectId/ledger-entries", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.entryNumber || !b.narration || !b.amount) {
    res.status(400).json({ error: "entryNumber, narration, amount required" }); return;
  }
  const amt = n(b.amount);
  const [entry] = await db.insert(ledgerEntriesTable).values({
    projectId: req.params.projectId,
    entryNumber: b.entryNumber,
    entryDate: b.entryDate ? new Date(b.entryDate) : new Date(),
    entityType: b.entityType ?? null,
    entityId: b.entityId ?? null,
    narration: b.narration,
    debitAccountId: b.debitAccountId ?? null,
    creditAccountId: b.creditAccountId ?? null,
    amount: String(amt),
    createdById: (req as any).user?.id ?? null,
  }).returning();

  // Update account balances if account IDs provided
  if (b.debitAccountId) {
    await db.update(ledgerAccountsTable)
      .set({ currentBalance: sql`current_balance + ${String(amt)}::numeric` })
      .where(eq(ledgerAccountsTable.id, b.debitAccountId));
  }
  if (b.creditAccountId) {
    await db.update(ledgerAccountsTable)
      .set({ currentBalance: sql`current_balance - ${String(amt)}::numeric` })
      .where(eq(ledgerAccountsTable.id, b.creditAccountId));
  }

  res.status(201).json(serializeLedgerEntry(entry));
});

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

// Payment analytics dashboard — 5 KPI tiles + aging
router.get("/projects/:projectId/payment-analytics", requireAuth, async (req: Request, res: Response) => {
  const pid = req.params.projectId;
  const bills = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.projectId, pid));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const received = bills.length;
  const underProcess = bills.filter(b => !["closed", "payment_released", "draft"].includes(b.status)).length;
  const overdueUnpaid = bills.filter(b => {
    if (b.status === "closed" || b.status === "payment_released") return false;
    const created = new Date(b.createdAt);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) > 30;
  }).length;
  const paidThisMonth = bills.filter(b => b.paidAt && new Date(b.paidAt) >= startOfMonth).reduce((s, b) => s + n(b.netPayable), 0);

  const tdsEntries = await db.select({ amount: tdsEntriesTable.tdsAmount })
    .from(tdsEntriesTable).where(eq(tdsEntriesTable.projectId, pid));
  const tdsYtd = tdsEntries.reduce((s, t) => s + n(t.amount), 0);

  // Aging buckets (days since creation for unpaid bills)
  const unpaid = bills.filter(b => !["closed", "payment_released"].includes(b.status));
  const aging = { _0_30: 0, _31_60: 0, _61_90: 0, _over90: 0 };
  for (const b2 of unpaid) {
    const days = (now.getTime() - new Date(b2.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) aging._0_30++;
    else if (days <= 60) aging._31_60++;
    else if (days <= 90) aging._61_90++;
    else aging._over90++;
  }

  // Monthly payment trend (last 6 months)
  const trend: { month: string; paid: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d2 = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthBills = bills.filter(b2 => b2.paidAt && new Date(b2.paidAt) >= d2 && new Date(b2.paidAt) < dEnd);
    trend.push({ month: d2.toLocaleString("default", { month: "short", year: "2-digit" }), paid: monthBills.reduce((s, b2) => s + n(b2.netPayable), 0) });
  }

  res.json({ received, underProcess, overdueUnpaid, paidThisMonth, tdsYtd, aging, trend });
});

// TDS Register
router.get("/projects/:projectId/tds-register", requireAuth, async (req: Request, res: Response) => {
  const entries = await db.select().from(tdsEntriesTable)
    .where(eq(tdsEntriesTable.projectId, req.params.projectId))
    .orderBy(desc(tdsEntriesTable.createdAt));
  res.json(entries.map(serializeTdsEntry));
});

// GST Register
router.get("/projects/:projectId/gst-register", requireAuth, async (req: Request, res: Response) => {
  const entries = await db.select().from(gstEntriesTable)
    .where(eq(gstEntriesTable.projectId, req.params.projectId))
    .orderBy(desc(gstEntriesTable.createdAt));
  res.json(entries.map(serializeGstEntry));
});

// Retention Ledger
router.get("/projects/:projectId/retention-ledger", requireAuth, async (req: Request, res: Response) => {
  const entries = await db.select().from(retentionLedgerTable)
    .where(eq(retentionLedgerTable.projectId, req.params.projectId))
    .orderBy(desc(retentionLedgerTable.createdAt));
  res.json(entries.map(e => ({
    id: e.id, projectId: e.projectId, workOrderId: e.workOrderId ?? null,
    billId: e.billId ?? null, transactionType: e.transactionType,
    retentionHeld: n(e.retentionHeld), retentionReleased: n(e.retentionReleased),
    balance: n(e.balance), remarks: e.remarks ?? null, createdAt: dReq(e.createdAt),
  })));
});

// Advance Ledger
router.get("/projects/:projectId/advance-ledger", requireAuth, async (req: Request, res: Response) => {
  const entries = await db.select().from(advanceLedgerTable)
    .where(eq(advanceLedgerTable.projectId, req.params.projectId))
    .orderBy(desc(advanceLedgerTable.createdAt));
  res.json(entries.map(e => ({
    id: e.id, projectId: e.projectId, workOrderId: e.workOrderId ?? null,
    billId: e.billId ?? null, transactionType: e.transactionType,
    amount: n(e.amount), balance: n(e.balance), remarks: e.remarks ?? null, createdAt: dReq(e.createdAt),
  })));
});

// Financial Summary (P&L by project)
router.get("/projects/:projectId/financial-summary", requireAuth, async (req: Request, res: Response) => {
  const pid = req.params.projectId;
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, pid));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const bills = await db.select().from(contractorBillsTable).where(eq(contractorBillsTable.projectId, pid));
  const invoices = await db.select().from(clientInvoicesTable).where(eq(clientInvoicesTable.projectId, pid));
  const tds = await db.select().from(tdsEntriesTable).where(eq(tdsEntriesTable.projectId, pid));
  const ledger = await db.select().from(ledgerAccountsTable).where(eq(ledgerAccountsTable.projectId, pid));

  const contractValue = n(project.contractValue);
  const totalBilled = bills.filter(b => b.status !== "draft").reduce((s, b) => s + n(b.grossAmount), 0);
  const totalPaid = bills.filter(b => b.paidAt).reduce((s, b) => s + n(b.netPayable), 0);
  const totalDeducted = bills.reduce((s, b) => s + n(b.totalDeductions), 0);
  const totalGstOnBills = bills.reduce((s, b) => s + n(b.gstAmount), 0);
  const totalClientBilled = invoices.reduce((s, inv) => s + n(inv.grossAmount), 0);
  const totalClientReceived = invoices.filter(inv => inv.status === "paid").reduce((s, inv) => s + n(inv.amountReceived), 0);
  const totalTds = tds.reduce((s, t) => s + n(t.tdsAmount), 0);
  const retentionBalance = bills.reduce((s, b) => s + n(b.totalDeductions) * 0.5 / 100 * 5, 0);

  // P&L
  const revenue = totalClientBilled;
  const expenditure = totalBilled;
  const grossProfit = revenue - expenditure;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Trial balance (from ledger accounts)
  const trialBalance = ledger.map(a => ({
    accountCode: a.accountCode,
    accountName: a.accountName,
    accountType: a.accountType,
    openingBalance: n(a.openingBalance),
    currentBalance: n(a.currentBalance),
  }));

  res.json({
    contractValue, totalBilled, totalPaid, totalDeducted, totalGstOnBills,
    totalClientBilled, totalClientReceived, totalTds, retentionBalance,
    pAndL: { revenue, expenditure, grossProfit, grossMarginPct },
    trialBalance,
    payableToContractors: totalBilled - totalPaid,
    receivableFromClient: totalClientBilled - totalClientReceived,
  });
});

// Aging Report (outstanding bills by bucket)
router.get("/projects/:projectId/aging-report", requireAuth, async (req: Request, res: Response) => {
  const bills = await db.select().from(contractorBillsTable)
    .where(and(
      eq(contractorBillsTable.projectId, req.params.projectId),
    ));

  const now = new Date();
  const unpaidBills = bills.filter(b => !["closed", "payment_released"].includes(b.status));

  const buckets: Record<string, { count: number; amount: number; bills: any[] }> = {
    "0-30": { count: 0, amount: 0, bills: [] },
    "31-60": { count: 0, amount: 0, bills: [] },
    "61-90": { count: 0, amount: 0, bills: [] },
    ">90": { count: 0, amount: 0, bills: [] },
  };

  for (const b2 of unpaidBills) {
    const days = Math.floor((now.getTime() - new Date(b2.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const bucket = days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : ">90";
    buckets[bucket].count++;
    buckets[bucket].amount += n(b2.netPayable);
    buckets[bucket].bills.push({ billNumber: b2.billNumber, netPayable: n(b2.netPayable), status: b2.status, ageDays: days });
  }

  res.json(buckets);
});

export default router;
