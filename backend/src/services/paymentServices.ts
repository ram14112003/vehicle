// paymentService.ts
import { Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { Payment } from "../models/payment";
import { Invoice } from "../models/invoice";
import { Booking } from "../models";

import config from "../config/config";
import { ORDER } from "../utils/costants";
import { isTerminal, toUiName, SUCCESS_NAMES, FAILURE_NAMES } from "../utils/costants";

/* =============================================================================
   SIMPLE LOGGER (unchanged)
============================================================================= */
const LOG_ROOT = process.env.PAYMENT_LOG_DIR || path.join(process.cwd(), 'logs');

function ensureLogDir() {
  try { fs.mkdirSync(LOG_ROOT, { recursive: true }); } catch {}
}

function scrub(obj: any) {
  try {
    const out = JSON.parse(JSON.stringify(obj));
    const hide = (o: any) => {
      if (!o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        if (/(authorization|api[_-]?key|x-merchantid|token|secret|password|clientAuthToken|cvv|pin|card[_-]?number|pan|last[_-]?four|last4)/i.test(k)) {
          o[k] = '[REDACTED]';
        } else {
          hide(o[k]);
        }
      }
    };
    hide(out);
    return out;
  } catch {
    return obj;
  }
}

function log(tag: string, data: any) {
  const rec = { ts: new Date().toISOString(), tag, ...scrub(data) };
  const line = JSON.stringify(rec);
  const file = path.join(LOG_ROOT, `hdfc-${new Date().toISOString().slice(0,10)}.log`);
  ensureLogDir();
  fs.appendFile(file, line + '\n', () => {});
  console.log(`[${tag}]`, JSON.stringify(rec));
}

const GW_LOG_FILE = (date = new Date()) =>
  path.join(LOG_ROOT, `gateway-${date.toISOString().slice(0,10)}.log`);

/* =============================================================================
   Small helpers (card/links/status id) -- unchanged from your original code
============================================================================= */
type CardMeta = {
  expiry_year?: string;
  expiry_month?: string;
  name_on_card?: string;
  card_issuer?: string;
  last_four_digits?: string;
  card_fingerprint?: string;
  card_isin?: string;
  card_type?: string;
  card_brand?: string;
  card_issuer_country?: string;
  juspay_bank_code?: string;
  extended_card_type?: string;
  payment_account_reference?: string;
};

function pickSafeCard(meta: any): CardMeta {
  const c = meta?.cardSafe || meta?.card || meta?.paymentMethod || {};
  const clean = (v: any) => (v == null ? undefined : String(v));
  return {
    expiry_year: clean(c.expiry_year || c.expiryYear),
    expiry_month: clean(c.expiry_month || c.expiryMonth),
    name_on_card: clean(c.name_on_card || c.nameOnCard),
    card_issuer: clean(c.card_issuer || c.issuer),
    last_four_digits: clean(c.last_four_digits || c.last4 || c.last_four),
    card_fingerprint: clean(c.card_fingerprint || c.fingerprint),
    card_isin: clean(c.card_isin || c.isin),
    card_type: clean(c.card_type || c.type),
    card_brand: clean(c.card_brand || c.brand),
    card_issuer_country: clean(c.card_issuer_country || c.issuer_country),
    juspay_bank_code: clean(c.juspay_bank_code),
    extended_card_type: clean(c.extended_card_type),
    payment_account_reference: clean(c.payment_account_reference || c.par),
  };
}

function paymentLinksFromGateway(d: any): { iframe?: string; web?: string; mobile?: string } {
  return {
    iframe: d?.payment_links?.iframe || d?.payment_page_url || d?.paymentUrl || undefined,
    web:    d?.payment_links?.web    || d?.payment_page_url || d?.paymentUrl || undefined,
    mobile: d?.payment_links?.mobile || d?.payment_page_url || d?.paymentUrl || undefined,
  };
}

function statusIdFromName(name: string) {
  switch (name) {
    case 'CHARGED': return 21;
    case 'FAILED':  return 7;
    case 'PENDING': return 5;
    case 'NEW':
    default:        return 1;
  }
}

/* =============================================================================
   Gateway logging (unchanged)
============================================================================= */
async function writeGatewayStyleLog(opts: {
  payment?: any;
  payload?: any;
  gateway?: any;
  orderId: string;
  statusName: 'NEW' | 'CHARGED' | 'FAILED' | 'PENDING';
  customerEmail?: string;
  customerPhone?: string | number;
  userId?: string | number;
}) {
  const pg = config.paymentgateway;

  const amountRaw =
    opts.payment?.amount ?? opts.gateway?.amount ?? opts.gateway?.payment?.amount ?? (Array.isArray(opts.gateway?.payments) ? opts.gateway.payments[0]?.amount : undefined) ?? opts.payload?.amount ?? 0;

  const amount = !!pg.pg_amount_in_paise ? Math.round(Number(amountRaw) / 100) : Number(amountRaw);

  const record = {
    customer_email: String(opts.customerEmail ?? opts.payment?.meta?.customer_email ?? ''),
    customer_phone: String(opts.customerPhone ?? opts.payment?.meta?.customer_phone ?? ''),
    customer_id:    String(opts.userId ?? opts.payment?.meta?.customer_phone ?? ''),
    status_id: statusIdFromName(opts.statusName),
    status: opts.statusName,
    id: opts.payment?.gatewayOrderId || opts.gateway?.id || '',
    merchant_id: pg.pg_merchant_id || '',
    amount,
    currency: 'INR',
    order_id: opts.orderId,
    date_created: (opts.payment?.createdAt ? new Date(opts.payment.createdAt) : new Date()).toISOString(),
    return_url: opts.payload?.return_url || '',
    product_id: '',
    payment_links: paymentLinksFromGateway(opts.gateway ?? opts.payment?.meta ?? {}),
    udf1: '', udf2: '', udf3: '', udf4: '', udf5: '',
    udf6: '', udf7: '', udf8: '', udf9: '', udf10: '',
    txn_id: opts.gateway?.txn_id || ((pg.pg_merchant_id && opts.orderId) ? `${pg.pg_merchant_id}-${opts.orderId}` : ''),
    payment_method_type: (opts.gateway?.payment_method_type || opts.payment?.meta?.payment_method_type || 'CARD'),
    auth_type: (opts.gateway?.auth_type || opts.payment?.meta?.auth_type || 'THREE_DS'),
    card: pickSafeCard(opts.payment?.meta || {}),
  };

  ensureLogDir();
  await fs.promises.appendFile(GW_LOG_FILE(), JSON.stringify(record) + '\n');
  console.log('[GW_LOG]', JSON.stringify(record));
}

/* =============================================================================
   Validate gateway amount against DB (unchanged)
============================================================================= */
// ✅ FIX: use correct invoice amount column and be defensive
async function validateGatewayAgainstDB(payment: any, gateway: any) {
  // Pull only what we need; use the actual column name in your schema.
  const invs = await Invoice.findAll({
    where: { paymentId: payment.paymentId },
    // If your model maps the column as 'invoiceAmount', ask for that.
    attributes: ['invoiceAmount'],   // << was ['amount'] causing SQL error
    raw: true,
  });

  // Sum with fallbacks in case some rows still have 'amount' mapped
  const dbTotal = invs.reduce(
    (s: number, i: any) => s + Number(i.invoiceAmount ?? i.amount ?? 0),
    0
  );

  // Gateway amount (covers both top-level and nested shapes)
  const gwRaw =
    gateway?.amount ??
    gateway?.payment?.amount ??
    (Array.isArray(gateway?.payments) ? gateway.payments[0]?.amount : undefined) ??
    0;

  const gwAmt = config.paymentgateway.pg_amount_in_paise
    ? Number(gwRaw) / 100
    : Number(gwRaw);

  const ok = Math.abs(gwAmt - dbTotal) < 0.01;

  return { ok, dbTotal, gwAmt };
}


/* =============================================================================
   HMAC + replay protection
   - FIX: computeHmac now returns Base64 to match gateway signatures.
============================================================================= */

function computeHmac(secret: string, payload: string | Buffer) {
  // Gateway signatures are Base64; produce Base64 here to compare apples-to-apples.
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

function makeCanonicalStringFromParams(params: Record<string, any>, excludeKeys: string[] = []) {
  const kv: string[] = [];
  const excludeSet = new Set<string>(excludeKeys.map(k => k.toLowerCase()));
  for (const k of Object.keys(params).sort()) {
    if (excludeSet.has(k.toLowerCase())) continue;
    const v = params[k];
    const sval = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    kv.push(`${k}=${sval}`);
  }
  return kv.join('&');
}

function verifySignature(receivedSignature: string | undefined, computedSignatureBase64: string) {
  if (!receivedSignature) return false;
  try {
    // Compare RAW bytes in constant time
    const a = Buffer.from(receivedSignature, 'base64');
    const b = Buffer.from(computedSignatureBase64, 'base64');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}


function isReplayAttempt(paymentMeta: any, incoming: { txnId?: string; signature?: string }) {
  if (!paymentMeta) return false;
  const lastTxn = paymentMeta?.lastGatewayTxn;
  const lastSig = paymentMeta?.lastGatewaySignature;
  if (incoming.txnId && lastTxn && incoming.txnId === lastTxn) return true;
  if (incoming.signature && lastSig && incoming.signature === lastSig) return true;
  return false;
}

/* =============================================================================
   Main handlers
============================================================================= */

export const createPaymentSession = async (req: Request, res: Response) => {
  try {
    const { customerEmail, customerPhone, userId, invoiceIds, paymentMode, bookingId } = req.body ?? {};
    log('CREATE_REQ', { customerEmail, customerPhone, userId, invoiceIds, paymentMode, bookingId });

    if (!userId) {
      log('CREATE_REQ_MISSING_USER', {});
      return res.status(400).json({ message: "Missing userId" });
    }

    let booking: any = null;
    if (bookingId) {
      booking = await Booking.findOne({ where: { bookingId } });
      if (!booking) {
        return res.status(404).json({ message: "Invalid bookingId, booking not found" });
      }
    }

    // === NEW: compute server-authoritative expectedTotal from DB ===
    let expectedTotal = 0;
    if (Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      const rows = await Invoice.findAll({
        where: { invoiceId: invoiceIds },
        attributes: ['invoiceAmount'],
        raw: true,
      });
      expectedTotal = rows.reduce((s, r: any) => s + Number(r?.invoiceAmount ?? 0), 0);
    } else if (bookingId) {
      const rows = await Invoice.findAll({
        where: { bookingId },
        attributes: ['invoiceAmount'],
        raw: true,
      });
      expectedTotal = rows.reduce((s, r: any) => s + Number(r?.invoiceAmount ?? 0), 0);
    } else {
      return res.status(400).json({ message: "Provide invoiceIds or bookingId" });
    }

    if (!Number.isFinite(expectedTotal) || expectedTotal <= 0) {
      log('CREATE_REQ_INVALID_COMPUTED_AMOUNT', { expectedTotal, invoiceIds, bookingId });
      return res.status(400).json({ message: "Invalid amount (computed)" });
    }
    // ===============================================================

    const pg = config.paymentgateway;
    const PG_API_KEY = (pg.pg_api_key || "").trim();
    const PG_MERCHANT_ID = (pg.pg_merchant_id || "").trim();
    const PG_CREATE_URL = (pg.pg_create_url || "").trim();
    const PG_RETURN_URL = (pg.pg_return_url || "").trim();
    const PG_CALLBACK_URL = (pg.pg_callback_url || "").trim();
    const PG_CLIENT_ID = (pg.pg_client_id || "").trim();
    const PG_ORDER_ID_PREFIX = pg.pg_order_id_prefix || "ORD";
    const PG_AMOUNT_IN_PAISE = !!pg.pg_amount_in_paise;

    if (!PG_API_KEY || !PG_MERCHANT_ID || !PG_CREATE_URL || !PG_CLIENT_ID) {
      log('CREATE_CONFIG_MISSING', { hasApiKey: !!PG_API_KEY, hasMerchantId: !!PG_MERCHANT_ID, hasCreateUrl: !!PG_CREATE_URL, hasClientId: !!PG_CLIENT_ID });
      return res.status(500).json({ message: "Missing HDFC Config" });
    }

    const orderId = `${PG_ORDER_ID_PREFIX}${Date.now()}`;
    const amtForGateway = PG_AMOUNT_IN_PAISE ? Math.round(expectedTotal * 100) : expectedTotal.toFixed(2); // << NEW: use expectedTotal

    const returnUrlWithOrder = `${PG_RETURN_URL}?orderId=${encodeURIComponent(orderId)}`;
    const payload = {
      order_id: orderId,
      amount: amtForGateway,
      currency: "INR",
      customer_email: customerEmail,
      customer_phone: customerPhone,
      return_url: returnUrlWithOrder,
      callback_url: PG_CALLBACK_URL,
      action: "paymentPage",
      description: "Invoice payment",
      payment_page_client_id: PG_CLIENT_ID,
    };

    log('CREATE_POST_PREPARED', { PG_CREATE_URL, orderId, payload });

    const { data } = await axios.post(PG_CREATE_URL, payload, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${PG_API_KEY}:`).toString("base64"),
        "x-merchantid": PG_MERCHANT_ID,
        "Content-Type": "application/json",
        "x-customerid": String(userId),
      },
      timeout: 15000,
    });

    const paymentUrl =
      data?.payment_page_url ||
      data?.paymentUrl ||
      data?.redirectUrl ||
      data?.payment_links?.web;

    log('CREATE_POST_RESPONSE', { orderId, gatewayOrderId: data?.id, paymentUrl, raw: data });

    if (!paymentUrl) {
      log('CREATE_NO_PAYMENT_URL', { orderId, raw: data });
      return res.status(502).json({ message: "No payment URL returned from gateway", raw: data });
    }

    const MODE = typeof paymentMode === 'string' && paymentMode.trim()
      ? paymentMode.trim()
      : "CCAvenue";

    let paymentRecord: any = null;

    const baseMeta = {
      ...(data || {}),
      customer_email: customerEmail,
      customer_phone: customerPhone,
      userId,
      merchant_used: PG_MERCHANT_ID,
      expectedTotal, // << NEW: store for auditing
    };

    if (booking?.paymentId) {
      paymentRecord = await Payment.findByPk(booking.paymentId);
      if (paymentRecord) {
        paymentRecord.set({
          paymentMode: MODE,
          isOnline: true,
          isActive: true,
          status: ORDER.STATUS.INITIALIZED,
          amount: expectedTotal, // << NEW: persist authoritative amount
          tax: 0,
          orderId,
          gatewayOrderId: data?.id,
          paymentUrl,
          clientAuthToken: data?.sdk_payload?.payload?.clientAuthToken || null,
          expiresAt: data?.payment_links?.expiry ? new Date(data?.payment_links?.expiry) : null,
          meta: { ...(paymentRecord.meta || {}), ...baseMeta },
        });
        await paymentRecord.save();
        log('CREATE_DB_UPDATED_EXISTING_PAYMENT', { paymentId: paymentRecord.paymentId, orderId, bookingId });
      } else {
        paymentRecord = await Payment.create({
          paymentMode: MODE,
          isOnline: true,
          isActive: true,
          status: ORDER.STATUS.INITIALIZED,
          amount: expectedTotal, // << NEW
          tax: 0,
          orderId,
          gatewayOrderId: data?.id,
          paymentUrl,
          clientAuthToken: data?.sdk_payload?.payload?.clientAuthToken || null,
          expiresAt: data?.payment_links?.expiry ? new Date(data?.payment_links?.expiry) : null,
          meta: baseMeta,
        });
        await Booking.update({ paymentId: paymentRecord.paymentId }, { where: { bookingId } });
        log('CREATE_DB_CREATED_PAYMENT_AND_LINKED', { paymentId: paymentRecord.paymentId, orderId, bookingId });
      }
    } else {
      paymentRecord = await Payment.create({
        paymentMode: MODE,
        isOnline: true,
        isActive: true,
        status: ORDER.STATUS.INITIALIZED,
        amount: expectedTotal, // << NEW
        tax: 0,
        orderId,
        gatewayOrderId: data?.id,
        paymentUrl,
        clientAuthToken: data?.sdk_payload?.payload?.clientAuthToken || null,
        expiresAt: data?.payment_links?.expiry ? new Date(data?.payment_links?.expiry) : null,
        meta: baseMeta,
      });
      if (bookingId) {
        await Booking.update({ paymentId: paymentRecord.paymentId }, { where: { bookingId } });
      }
      log('CREATE_DB_CREATED_PAYMENT', { paymentId: paymentRecord.paymentId, orderId, bookingId });
    }

    await writeGatewayStyleLog({
      payment: paymentRecord, payload, gateway: data, orderId,
      statusName: 'NEW',
      customerEmail, customerPhone, userId,
    });

    if (Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      const [cnt] = await Invoice.update({ paymentId: paymentRecord.paymentId }, { where: { invoiceId: invoiceIds } } as any);
      log('CREATE_INVOICES_ATTACHED', { paymentId: paymentRecord.paymentId, invoiceIds, updatedCount: cnt });
    } else if (bookingId) {
      const [cnt] = await Invoice.update(
        { paymentId: paymentRecord.paymentId },
        { where: { bookingId, paymentId: null } } as any
      );
      if (cnt) log('CREATE_INVOICES_ATTACHED_AUTOMATIC', { bookingId, paymentId: paymentRecord.paymentId, updatedCount: cnt });
    }

    return res.status(200).json({
      success: true,
      message: "Payment session created",
      orderId,
      gatewayOrderId: data?.id,
      paymentId: paymentRecord.paymentId,
      paymentUrl,
    });
  } catch (err: any) {
    log('CREATE_ERROR', { status: err?.response?.status, data: err?.response?.data, message: err?.message });
    return res.status(500).json({ success: false, message: "create session failed", error: err?.response?.data || err?.message || "Unknown error" });
  }
};

/* =============================================================================
   Callback
============================================================================= */

export const paymentCallback = async (req: Request, res: Response) => {
  try {
    log('CALLBACK_BODY', { body: req.body, query: req.query });

    const pg = config.paymentgateway;
    const { pg_api_key, pg_merchant_id, pg_status_url, pg_signature_key } = pg;

    const orderId =
      req.body?.order_id ||
      req.body?.orderId ||
      req.body?.ORDER_ID ||
      (req.query?.orderId as string);

    if (!orderId) {
      log('CALLBACK_MISSING_ORDERID', {});
      return res.status(400).send("Missing orderId");
    }

    const incomingSignature =
      (req.body && (req.body.signature || req.body.hmac || req.body.merchant_signature || req.body.signature_sha256)) ||
      (req.query && (req.query.signature || req.query.hmac || req.query.merchant_signature || req.query.signature_sha256)) ||
      undefined;

    const combinedParams = { ...(req.query || {}), ...(req.body || {}) };
    const canonical = makeCanonicalStringFromParams(combinedParams, ['signature','hmac','merchant_signature','signature_sha256']);

    let signatureValid = false;
    if (pg_signature_key && incomingSignature) {
      const computed = computeHmac(String(pg_signature_key), canonical);
      signatureValid = verifySignature(String(incomingSignature), computed);
      log('CALLBACK_SIGNATURE_CHECK', { orderId, hasIncomingSignature: true, signatureValid });
    } else {
      log('CALLBACK_SIGNATURE_CHECK', { orderId, hasIncomingSignature: !!incomingSignature, signatureConfigured: !!pg_signature_key });
    }

    // === NEW (no flow change): if signature present and invalid, note it
    if (incomingSignature && pg_signature_key && !signatureValid) {
      log('CALLBACK_BAD_SIGNATURE', { orderId });
      // Continue to poll PG below; we still base state ONLY on PG result (unchanged).
    }
    // ===============================================================

    const statusUrl = `${pg_status_url.replace(/\/$/, "")}/${encodeURIComponent(orderId)}`;
    const statusResp = await axios.get(statusUrl, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${pg_api_key}:`).toString("base64"),
        "x-merchantid": pg_merchant_id,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
    const data = statusResp.data;
    const raw = String(data?.status || data?.paymentStatus || data?.transactionStatus || "").toUpperCase();
    const success = SUCCESS_NAMES.has(raw);

    log('CALLBACK_STATUS_RESPONSE', { orderId, raw, success, gateway: data, signatureValid });

    const payment = await Payment.findOne({ where: { orderId } });

    const incomingTxn = data?.txn_id || data?.txnId || data?.transactionId || data?.id || undefined;
    const incomingSigMarker = incomingSignature ? String(incomingSignature) : (data?.signature || data?.hmac || undefined);
    if (payment) {
      if (isReplayAttempt(payment.meta, { txnId: incomingTxn, signature: incomingSigMarker })) {
        log('CALLBACK_REPLAY_DETECTED', { orderId, paymentId: payment.paymentId, incomingTxn, incomingSigMarker });
        await writeGatewayStyleLog({ payment, gateway: data, orderId, statusName: success ? 'CHARGED' : 'FAILED' });
        return res.status(200).send("OK");
      }
    }

    await writeGatewayStyleLog({
      payment, gateway: data, orderId,
      statusName: success ? 'CHARGED' : 'FAILED',
      customerEmail: payment?.meta?.customer_email,
      customerPhone: payment?.meta?.customer_phone,
      userId: payment?.meta?.userId,
    });

    if (payment) {
      if (success) {
        const v = await validateGatewayAgainstDB(payment, data);
        if (!v.ok) {
          await payment.update({
            status: ORDER.STATUS.DECLINED,
            meta: { ...(payment.meta || {}), callback: req.body, statusCheck: data, validationError: { dbTotal: v.dbTotal, gwAmt: v.gwAmt } },
          });
          log('CALLBACK_VALIDATION_FAIL', { orderId, dbTotal: v.dbTotal, gwAmt: v.gwAmt });
          return res.status(200).send("OK");
        }

        const usedMerchant = payment.meta?.merchant_used;
        if (usedMerchant && usedMerchant !== pg_merchant_id) {
          log('CALLBACK_MERCHANT_MISMATCH', { orderId, expected: usedMerchant, actual: pg_merchant_id });
          await payment.update({
            status: ORDER.STATUS.DECLINED,
            meta: { ...(payment.meta || {}), callback: req.body, statusCheck: data, merchantMismatch: true },
          });
          return res.status(200).send("OK");
        }

        await applyPaymentSuccessSideEffects(payment.paymentId);

        await payment.update({
          meta: {
            ...(payment.meta || {}),
            lastGatewayTxn: incomingTxn,
            lastGatewaySignature: incomingSigMarker,
            lastStatusCheck: data,
          }
        });
      } else {
        await payment.update({
          status: ORDER.STATUS.DECLINED,
          meta: { ...(payment.meta || {}), callback: req.body, statusCheck: data },
        });
        log('CALLBACK_MARK_DECLINED', { paymentId: payment.paymentId, orderId });
      }
    } else {
      log('CALLBACK_NO_PAYMENT_ROW', { orderId, gateway: data });
    }

    log('CALLBACK_DONE', { orderId, success });
    return res.status(200).send("OK");
  } catch (e: any) {
    log('CALLBACK_ERROR', { message: e?.message, status: e?.response?.status, data: e?.response?.data });
    return res.status(200).send("OK");
  }
};


/* =============================================================================
   getPaymentStatus
============================================================================= */

// 🚀 SECURE VERSION of getPaymentStatus

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { orderId } = req.query as { orderId: string };
  const hint = String((req.query as any).status || "").toUpperCase();

  if (!orderId) {
    log("STATUS_REQ_MISSING_ORDERID", {});
    return res.status(400).json({ message: "Missing orderId" });
  }

  try {
    log("STATUS_REQ", { orderId, hint });

    const payment = await Payment.findOne({ where: { orderId } });

    if (payment && isTerminal(payment.status)) {
      log("STATUS_TERMINAL", { orderId, paymentId: payment.paymentId, status: payment.status });
      return res.json({ status: toUiName(payment.status), paymentId: payment.paymentId });
    }

    // Only allow failure hints to shortcut
    if (hint && FAILURE_NAMES.has(hint)) {
      if (payment) {
        await payment.update({ status: ORDER.STATUS.DECLINED });
        await writeGatewayStyleLog({ payment, orderId, statusName: "FAILED" });
      }
      log("STATUS_FROM_HINT", { orderId, hint, resolved: "FAILED", paymentId: payment?.paymentId });
      return res.json({ status: "FAILED", paymentId: payment?.paymentId });
    }

    const pg = config.paymentgateway;
    const { pg_api_key, pg_merchant_id, pg_status_url } = pg;

    const { data } = await axios.get(
      `${pg_status_url.replace(/\/$/, "")}/${encodeURIComponent(orderId)}`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${pg_api_key}:`).toString("base64"),
          "x-merchantid": pg_merchant_id,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const raw = String(
      data?.status || data?.paymentStatus || data?.transactionStatus || ""
    ).toUpperCase();

    log("STATUS_GATEWAY_RESPONSE", { orderId, raw, gateway: data });

    if (payment && SUCCESS_NAMES.has(raw)) {
      const v = await validateGatewayAgainstDB(payment, data);
      if (!v.ok) {
        await payment.update({
          status: ORDER.STATUS.DECLINED,
          meta: { ...(payment.meta || {}), statusCheck: data, validationError: { dbTotal: v.dbTotal, gwAmt: v.gwAmt } },
        });
        await writeGatewayStyleLog({ payment, gateway: data, orderId, statusName: "FAILED" });
        log("STATUS_VALIDATION_FAIL", { orderId, dbTotal: v.dbTotal, gwAmt: v.gwAmt });
        return res.json({ status: "FAILED", paymentId: payment.paymentId });
      }

      await applyPaymentSuccessSideEffects(payment.paymentId);
      await writeGatewayStyleLog({ payment, gateway: data, orderId, statusName: "CHARGED" });

      const incomingTxn = data?.txn_id || data?.txnId || data?.transactionId || data?.id || undefined;
      const incomingSigMarker = data?.signature || data?.hmac || undefined;
      await payment.update({
        meta: {
          ...(payment.meta || {}),
          lastGatewayTxn: incomingTxn,
          lastGatewaySignature: incomingSigMarker,
          lastStatusCheck: data,
        },
      });

      log("STATUS_RESOLVED_PAID", { orderId, paymentId: payment.paymentId });
      return res.json({ status: "PAID", paymentId: payment.paymentId });
    }

    if (payment && FAILURE_NAMES.has(raw)) {
      await payment.update({
        status: ORDER.STATUS.DECLINED,
        meta: { ...(payment.meta || {}), statusCheck: data },
      });
      await writeGatewayStyleLog({ payment, gateway: data, orderId, statusName: "FAILED" });
      log("STATUS_RESOLVED_FAILED", { orderId, paymentId: payment.paymentId });
      return res.json({ status: "FAILED", paymentId: payment.paymentId });
    }

    await writeGatewayStyleLog({ payment, gateway: data, orderId, statusName: "PENDING" });
    log("STATUS_PENDING", { orderId, paymentId: payment?.paymentId });
    return res.json({ status: "PENDING", paymentId: payment?.paymentId });
  } catch (e: any) {
    log("STATUS_ERROR", {
      orderId,
      message: e?.message,
      status: e?.response?.status,
      data: e?.response?.data,
    });
    return res.status(200).json({ status: "PENDING", note: "unverified" });
  }
};



/* =============================================================================
   paymentReturnRelay
============================================================================= */

export const paymentReturnRelay = async (req: Request, res: Response) => {
  try {
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const orderId =
      params?.order_id ||
      params?.orderId ||
      params?.ORDER_ID ||
      '';

    const statusParam =
      params?.status ||
      params?.payment_status ||
      params?.paymentStatus ||
      '';

    const reason =
      (params as any)?.reason ||
      (params as any)?.message ||
      (params as any)?.tx_msg ||
      '';

    log('RETURN_RELAY_RECEIVED', { params: scrub(params) });

    const pg = config.paymentgateway;
    const { pg_signature_key, pg_status_url, pg_api_key, pg_merchant_id } = pg;

    const canonical = makeCanonicalStringFromParams(params as any, ['signature','hmac','merchant_signature','signature_sha256']);
    const incomingSignature =
      (params as any).signature || (params as any).hmac || (params as any).merchant_signature || (params as any).signature_sha256 || undefined;

    let signatureValid = false;
    if (pg_signature_key && incomingSignature) {
      const computed = computeHmac(String(pg_signature_key), canonical);
      signatureValid = verifySignature(String(incomingSignature), computed);
      log('RETURN_RELAY_SIGNATURE_CHECK', { orderId, signatureValid });
    } else {
      log('RETURN_RELAY_SIGNATURE_CHECK', { orderId, hasIncomingSignature: !!incomingSignature, signatureConfigured: !!pg_signature_key });
    }

    let canonicalStatus = 'PENDING';
    try {
      if (orderId) {
        const statusUrl = `${pg_status_url.replace(/\/$/, "")}/${encodeURIComponent(String(orderId))}`;
        const statusResp = await axios.get(statusUrl, {
          headers: {
            Authorization: "Basic " + Buffer.from(`${pg_api_key}:`).toString("base64"),
            "x-merchantid": pg_merchant_id,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });
        const data = statusResp.data;
        const raw = String(data?.status || data?.paymentStatus || data?.transactionStatus || "").toUpperCase();
        if (SUCCESS_NAMES.has(raw)) canonicalStatus = 'PAID';
        else if (FAILURE_NAMES.has(raw)) canonicalStatus = 'FAILED';
        else canonicalStatus = 'PENDING';
        log('RETURN_RELAY_STATUS_CHECK', { orderId, raw, canonicalStatus });
      }
    } catch (e: any) {
      log('RETURN_RELAY_STATUS_CHECK_ERROR', { orderId, message: e?.message, data: e?.response?.data });
    }

    const feUrl = new URL('https://gracecabs.com/payments/return');
    if (orderId) feUrl.searchParams.set('orderId', String(orderId));
    feUrl.searchParams.set('statusHint', canonicalStatus);
    if (reason) feUrl.searchParams.set('reason', String(reason));

    log('RETURN_RELAY', { orderId, statusParam, canonicalStatus, redirect: feUrl.toString() });
    return res.redirect(302, feUrl.toString());
  } catch (err: any) {
    log('RETURN_RELAY_ERROR', { message: err?.message });
    return res.redirect(302, 'https://gracecabs.com/payments/return');
  }
};

/* =============================================================================
   Side-effects
============================================================================= */

async function applyPaymentSuccessSideEffects(paymentId: string) {
  const PAYMENT_COMPLETED = ORDER.STATUS.PAYMENTCOMPLETED; // 9
  const PENDING = ORDER.STATUS.PENDING;

  log('SIDE_EFFECTS_START', { paymentId });

  const sequelize = Payment.sequelize!;
  await sequelize.transaction(async (t) => {
    const invoices = await Invoice.findAll({
      where: { paymentId },
      attributes: ['invoiceId', 'bookingId'],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const bookingIds = invoices.map(i => i.bookingId).filter((v): v is string => Boolean(v));

    const invData = await Invoice.findOne({
      where: { paymentId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const payData = await Payment.findOne({
      where: { paymentId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const invAmnt: number = Number(
      (invData as any)?.invoiceAmount ?? invData?.get?.('invoiceAmount') ?? 0
    );
    const payAmnt: number = Number(
      (payData as any)?.amount ?? payData?.get?.('amount') ?? 0
    );

    const safeInv = Number.isFinite(invAmnt) ? invAmnt : 0;
    const safePay = Number.isFinite(payAmnt) ? payAmnt : 0;

    const remaining = Math.max(0, safeInv - safePay);
    const isFullyPaid = remaining <= 0.01;

    console.log('amount check:', { invoiceAmount: safeInv, paymentAmount: safePay, remaining });

    if (isFullyPaid) {
      const inv = await Invoice.update(
        { invoiceStatus: PAYMENT_COMPLETED },
        { where: { paymentId }, transaction: t }
      );
      log('SIDE_EFFECTS_INVOICES_UPDATED', { paymentId, result: inv });

      if (bookingIds.length > 0) {
        const book = await Booking.update(
          { confirmStatus: PAYMENT_COMPLETED, paymentId },
          { where: { bookingId: bookingIds }, transaction: t }
        );
        log('SIDE_EFFECTS_BOOKINGS_UPDATED', { paymentId, bookingIds, result: book });
      }

      const [updatedCount] = await Payment.update(
        { status: PAYMENT_COMPLETED },
        { where: { paymentId }, transaction: t }
      );
      log('SIDE_EFFECTS_PAYMENT_UPDATED', { paymentId, updatedCount });
    } else {
      const pendingAmount = Number(remaining.toFixed(2));

      const inv = await Invoice.update(
        { invoiceStatus: PENDING },
        { where: { paymentId }, transaction: t }
      );
      log('SIDE_EFFECTS_INVOICES_UPDATED', { paymentId, result: inv });

      if (bookingIds.length > 0) {
        const book = await Booking.update(
          { confirmStatus: ORDER.STATUS.CLOSED, paymentId },
          { where: { bookingId: bookingIds }, transaction: t }
        );
        log('SIDE_EFFECTS_BOOKINGS_UPDATED', { paymentId, bookingIds, result: book });
      }

      const [updatedCount] = await Payment.update(
        { status: PENDING, amount: pendingAmount },
        { where: { paymentId }, transaction: t }
      );
      log('SIDE_EFFECTS_PAYMENT_UPDATED', { paymentId, updatedCount, pendingAmount });
    }
  });

  log('SIDE_EFFECTS_DONE', { paymentId });
}

export default {
  createPaymentSession,
  paymentCallback,
  getPaymentStatus,
  paymentReturnRelay
};
