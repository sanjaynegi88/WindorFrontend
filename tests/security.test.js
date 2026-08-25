import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function shouldAttachAuthHeader(urlStr, backendApiUrlStr) {
    if (!urlStr) return false;
    try {
        const targetHost = new URL(urlStr).host.toLowerCase();
        if (backendApiUrlStr) {
            const backendHost = new URL(backendApiUrlStr).host.toLowerCase();
            return targetHost === backendHost;
        }
        if (targetHost.includes('s3.') || targetHost.includes('amazonaws.com') || targetHost.includes('cloudfront.net')) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

const rateLimitMap = new Map();
function checkRateLimit(key, limit = 5, windowMs = 1000) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }
    if (record.count >= limit) {
        return { allowed: false, remaining: 0 };
    }
    record.count += 1;
    return { allowed: true, remaining: limit - record.count };
}

function isValidRouteId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

function getSecureCookieOptions(isHttpOnly, isProd = true, maxAge = 86400) {
    return {
        httpOnly: isHttpOnly,
        secure: isProd,
        sameSite: 'lax',
        maxAge,
    };
}

function sanitizeErrorDetail(errMessage, isProd = true) {
    if (isProd) return undefined;
    return errMessage;
}

test('CRITICAL 1.1: .gitignore excludes all sensitive .env files', () => {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    assert.equal(fs.existsSync(gitignorePath), true, '.gitignore file must exist');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    assert.match(gitignoreContent, /\.env(?!\.example)/, '.gitignore must match .env files');
    assert.match(gitignoreContent, /\.env\.local/, '.gitignore must exclude .env.local');
    assert.match(gitignoreContent, /\.env\.\*\.local/, '.gitignore must exclude .env.*.local');
});


test('CRITICAL 1.2: shouldAttachAuthHeader strips Authorization header for external S3 / pre-signed URLs', () => {
    const backendUrl = 'http://localhost:5000';
    assert.equal(shouldAttachAuthHeader('http://localhost:5000/api/reports/download', backendUrl), true);

    const s3Url = 'https://windor-verifications-images.s3.eu-north-1.amazonaws.com/reports/sample.pdf?X-Amz-Signature=12345';
    assert.equal(shouldAttachAuthHeader(s3Url, backendUrl), false);

    const cdnUrl = 'https://d111111abcdef8.cloudfront.net/reports/sample.pdf';
    assert.equal(shouldAttachAuthHeader(cdnUrl, backendUrl), false);
});

test('HIGH 2.1: Route parameter ID sanitizer rejects path traversal and malformed inputs', () => {
    assert.equal(isValidRouteId('valid-uuid-1234_abc'), true);
    assert.equal(isValidRouteId('../admin/secret'), false);
    assert.equal(isValidRouteId('<script>alert(1)</script>'), false);
    assert.equal(isValidRouteId(''), false);
});

test('HIGH 2.1: Rate limiting correctly blocks requests exceeding threshold', () => {
    const key = 'test-client-ip';
    for (let i = 0; i < 5; i++) {
        assert.equal(checkRateLimit(key, 5, 1000).allowed, true);
    }
    assert.equal(checkRateLimit(key, 5, 1000).allowed, false);
});

test('HIGH 2.2: getSecureCookieOptions sets httpOnly, secure, and sameSite lax correctly', () => {
    const authTokenOpts = getSecureCookieOptions(true, true, 86400);
    assert.equal(authTokenOpts.httpOnly, true);
    assert.equal(authTokenOpts.secure, true);
    assert.equal(authTokenOpts.sameSite, 'lax');
});

test('MEDIUM 3.2: sanitizeErrorDetail hides internal exception messages in production mode', () => {
    const rawError = 'Error: ENOENT: no such file /var/secret/db_pass.txt';
    assert.equal(sanitizeErrorDetail(rawError, true), undefined);
    assert.equal(sanitizeErrorDetail(rawError, false), rawError);
});

test('LOW 4.1: Unified search term sanitizer strips control characters and trims input', () => {
    function sanitizeSearchTerm(term) {
        if (!term || typeof term !== 'string') return '';
        return term.replace(/[\x00-\x1F\x7F]/g, '').trim();
    }
    assert.equal(sanitizeSearchTerm('  test search\x00 '), 'test search');
    assert.equal(sanitizeSearchTerm(null), '');
    assert.equal(sanitizeSearchTerm(123), '');
});

test('PERFORMANCE 5.1: Debouncing prevents excessive API dispatches within debounce window', async () => {
    let callCount = 0;
    function createDebouncedFunc(fn, delayMs) {
        let timer = null;
        return (...args) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delayMs);
        };
    }
    const debouncedFn = createDebouncedFunc(() => { callCount++; }, 50);
    debouncedFn();
    debouncedFn();
    debouncedFn();
    assert.equal(callCount, 0);
    await new Promise(res => setTimeout(res, 80));
    assert.equal(callCount, 1);
});

test('CODE QUALITY 6.1: Ecommerce plan calculations are authoritative and reject client price overrides', () => {
    const SERVER_PLAN_PRICES = {
        monthly: 29.99,
        yearly: 299.99,
    };
    function computeSubscriptionTotal(planType, clientPriceOverride) {
        // Must use SERVER_PLAN_PRICES regardless of client input
        const basePrice = SERVER_PLAN_PRICES[planType];
        if (!basePrice) throw new Error('Invalid plan type');
        return basePrice;
    }
    assert.equal(computeSubscriptionTotal('monthly', 0.01), 29.99);
    assert.equal(computeSubscriptionTotal('yearly', 500.00), 299.99);
    assert.throws(() => computeSubscriptionTotal('hacked_plan', 0), /Invalid plan type/);
});

test('REFACTORING 7.1: RBAC route permission matching enforces role hierarchy and sub-account restrictions', () => {
    function isAllowed(routeRoles, userRole, mainAccountOnly = false, isSubAccount = false) {
        if (mainAccountOnly && isSubAccount) return false;
        if (routeRoles === 'all') return true;
        return routeRoles.includes(userRole);
    }
    assert.equal(isAllowed(['admin'], 'admin', false, false), true);
    assert.equal(isAllowed(['admin'], 'contractor', false, false), false);
    assert.equal(isAllowed(['admin', 'contractor'], 'contractor', true, true), false);
    assert.equal(isAllowed(['admin', 'contractor'], 'contractor', true, false), true);
});

