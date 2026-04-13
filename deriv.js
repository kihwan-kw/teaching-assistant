/* ========================================================= */
/* --- Derivative (미분) Logic --- */
/* 할선 → 접선 수렴 애니메이션 + 도함수 실시간 그래프 */
/* ========================================================= */

const derivCanvas = document.getElementById('derivCanvas');
const derivCtx = derivCanvas.getContext('2d');
const derivFCanvas = document.getElementById('derivFCanvas');
const derivFCtx = derivFCanvas.getContext('2d');

const DW = derivCanvas.width;
const DH = derivCanvas.height;
const FW = derivFCanvas.width;
const FH = derivFCanvas.height;

/* ---- 좌표 설정 ---- */
const D_PAD = 50;
const D_CX = DW / 2;
const D_CY = DH / 2;
const D_SCALE = 55;   // px per unit

/* ---- 상태 ---- */
let derivExpr = null;
let derivX0 = 1;       // 접점 x 좌표
let derivH = 2.0;     // 할선 간격 h
let animFrameId = null;
let isAnimating = false;
let animTarget = 0.001;   // h 목표값
let tracePoints = [];      // 도함수 trace

/* ---- 수치 미분 ---- */
function numericalDeriv(expr, x, h = 1e-6) {
    try {
        const f1 = expr.evaluate({ x: x + h });
        const f2 = expr.evaluate({ x: x - h });
        if (!isFinite(f1) || !isFinite(f2)) return null;
        return (f1 - f2) / (2 * h);
    } catch { return null; }
}

function evalF(x) {
    if (!derivExpr) return null;
    try {
        const v = derivExpr.evaluate({ x });
        return isFinite(v) ? v : null;
    } catch { return null; }
}

/* ---- 좌표 변환 ---- */
function toCanvasX(x, cx, scale) { return cx + x * scale; }
function toCanvasY(y, cy, scale) { return cy - y * scale; }

/* ========================================================= */
/* ---- 원함수 캔버스 그리기 ---- */
/* ========================================================= */

function drawDerivGrid(ctx, w, h, cx, cy, scale) {
    ctx.clearRect(0, 0, w, h);

    // 격자
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < w; x += scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 축
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();

    // 눈금 + 레이블
    ctx.fillStyle = '#a0aec0';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    const range = Math.ceil(w / scale / 2) + 1;
    for (let i = -range; i <= range; i++) {
        if (i === 0) continue;
        const px = toCanvasX(i, cx, scale);
        const py = toCanvasY(i, cy, scale);
        if (px >= 0 && px <= w) ctx.fillText(i, px, cy + 16);
        if (py >= 0 && py <= h) { ctx.textAlign = 'right'; ctx.fillText(i, cx - 5, py + 4); ctx.textAlign = 'center'; }
    }
    ctx.fillText('O', cx - 12, cy + 16);
}

function drawFunctionCurve(ctx, cx, cy, scale, color, lineWidth = 2.5) {
    if (!derivExpr) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    let first = true, prevY = null;
    for (let px = 0; px <= DW; px += 1) {
        const x = (px - cx) / scale;
        const fy = evalF(x);
        if (fy === null) { first = true; prevY = null; continue; }
        const py = toCanvasY(fy, cy, scale);
        if (prevY !== null && Math.abs(py - prevY) > DH) { first = true; }
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
        prevY = py;
    }
    ctx.stroke();
}

function drawSecantLine(h) {
    if (!derivExpr) return;
    const x0 = derivX0;
    const f0 = evalF(x0);
    const fh = evalF(x0 + h);
    if (f0 === null || fh === null) return;

    const slope = (fh - f0) / h;
    const cx = D_CX, cy = D_CY, scale = D_SCALE;

    // 할선 (긴 직선)
    const xLeft = (0 - cx) / scale;
    const xRight = (DW - cx) / scale;
    const yLeft = f0 + slope * (xLeft - x0);
    const yRight = f0 + slope * (xRight - x0);

    const alpha = Math.max(0.1, Math.min(0.7, Math.abs(h) / 2));
    derivCtx.beginPath();
    derivCtx.strokeStyle = `rgba(255,184,108,${alpha})`;
    derivCtx.lineWidth = 1.5;
    derivCtx.setLineDash([6, 4]);
    derivCtx.moveTo(0, toCanvasY(yLeft, cy, scale));
    derivCtx.lineTo(DW, toCanvasY(yRight, cy, scale));
    derivCtx.stroke();
    derivCtx.setLineDash([]);

    // 두 점 표시
    const px0 = toCanvasX(x0, cx, scale);
    const py0 = toCanvasY(f0, cy, scale);
    const px1 = toCanvasX(x0 + h, cx, scale);
    const py1 = toCanvasY(fh, cy, scale);

    derivCtx.beginPath();
    derivCtx.arc(px1, py1, 4, 0, Math.PI * 2);
    derivCtx.fillStyle = 'rgba(255,184,108,0.8)';
    derivCtx.fill();

    // 레이블: 기울기 표시
    const midX = (px0 + px1) / 2 + 10;
    const midY = (py0 + py1) / 2 - 10;
    derivCtx.fillStyle = '#ed8936';
    derivCtx.font = '600 12px Outfit, sans-serif';
    derivCtx.textAlign = 'left';
    derivCtx.fillText(`m = ${slope.toFixed(3)}`, midX, midY);
}

function drawTangentLine() {
    if (!derivExpr) return;
    const x0 = derivX0;
    const f0 = evalF(x0);
    const slope = numericalDeriv(derivExpr, x0);
    if (f0 === null || slope === null) return;

    const cx = D_CX, cy = D_CY, scale = D_SCALE;
    const xLeft = (0 - cx) / scale;
    const xRight = (DW - cx) / scale;

    derivCtx.beginPath();
    derivCtx.strokeStyle = '#ff8bad';
    derivCtx.lineWidth = 2.5;
    derivCtx.setLineDash([]);
    derivCtx.moveTo(0, toCanvasY(f0 + slope * (xLeft - x0), cy, scale));
    derivCtx.lineTo(DW, toCanvasY(f0 + slope * (xRight - x0), cy, scale));
    derivCtx.stroke();

    // 접점
    const px0 = toCanvasX(x0, cx, scale);
    const py0 = toCanvasY(f0, cy, scale);
    derivCtx.beginPath();
    derivCtx.arc(px0, py0, 6, 0, Math.PI * 2);
    derivCtx.fillStyle = '#ff8bad';
    derivCtx.fill();
    derivCtx.strokeStyle = 'white';
    derivCtx.lineWidth = 2;
    derivCtx.stroke();

    // 접선 레이블
    derivCtx.fillStyle = '#ff8bad';
    derivCtx.font = '700 13px Outfit, sans-serif';
    derivCtx.textAlign = 'left';
    derivCtx.fillText(`f'(${x0}) = ${slope.toFixed(4)}`, px0 + 10, py0 - 12);
}

function drawContactPoint() {
    const x0 = derivX0;
    const f0 = evalF(x0);
    if (f0 === null) return;
    const px = toCanvasX(x0, D_CX, D_SCALE);
    const py = toCanvasY(f0, D_CY, D_SCALE);

    // 수직 점선
    derivCtx.beginPath();
    derivCtx.strokeStyle = 'rgba(0,0,0,0.15)';
    derivCtx.lineWidth = 1;
    derivCtx.setLineDash([4, 4]);
    derivCtx.moveTo(px, py);
    derivCtx.lineTo(px, D_CY);
    derivCtx.stroke();
    derivCtx.setLineDash([]);

    // x0 레이블
    derivCtx.fillStyle = '#4a5568';
    derivCtx.font = '600 12px Outfit, sans-serif';
    derivCtx.textAlign = 'center';
    derivCtx.fillText(`x₀ = ${x0}`, px, D_CY + 28);
}

function drawHLabel(h) {
    if (!derivExpr) return;
    const x0 = derivX0, f0 = evalF(x0);
    if (f0 === null) return;
    const px0 = toCanvasX(x0, D_CX, D_SCALE);
    const px1 = toCanvasX(x0 + h, D_CX, D_SCALE);
    const py = toCanvasY(f0, D_CY, D_SCALE) + 22;

    if (Math.abs(px1 - px0) > 5) {
        derivCtx.beginPath();
        derivCtx.strokeStyle = 'rgba(255,184,108,0.6)';
        derivCtx.lineWidth = 1.5;
        derivCtx.moveTo(px0, py); derivCtx.lineTo(px1, py);
        derivCtx.stroke();
        derivCtx.fillStyle = '#ed8936';
        derivCtx.font = '600 11px Outfit, sans-serif';
        derivCtx.textAlign = 'center';
        derivCtx.fillText(`h = ${h.toFixed(3)}`, (px0 + px1) / 2, py + 13);
    }
}

function renderDerivMain(h) {
    drawDerivGrid(derivCtx, DW, DH, D_CX, D_CY, D_SCALE);
    drawFunctionCurve(derivCtx, D_CX, D_CY, D_SCALE, '#73a5ff', 2.5);
    if (Math.abs(h) > 0.005) drawSecantLine(h);
    drawTangentLine();
    drawContactPoint();
    if (Math.abs(h) > 0.005) drawHLabel(h);

    // 우측 상단 정보 패널
    if (derivExpr) {
        const slope = numericalDeriv(derivExpr, derivX0);
        derivCtx.fillStyle = 'rgba(255,255,255,0.9)';
        derivCtx.beginPath();
        derivCtx.roundRect(DW - 200, 12, 185, 70, 10);
        derivCtx.fill();
        derivCtx.fillStyle = '#2d3748';
        derivCtx.font = '700 13px Outfit, sans-serif';
        derivCtx.textAlign = 'left';
        derivCtx.fillText(`f(${derivX0}) = ${evalF(derivX0)?.toFixed(4) ?? '—'}`, DW - 188, 35);
        derivCtx.fillStyle = '#ff8bad';
        derivCtx.fillText(`f'(${derivX0}) = ${slope?.toFixed(4) ?? '—'}`, DW - 188, 55);
        derivCtx.fillStyle = '#ed8936';
        derivCtx.fillText(`h = ${h.toFixed(4)}`, DW - 188, 75);
    }
}

/* ========================================================= */
/* ---- 도함수 캔버스 그리기 ---- */
/* ========================================================= */

function renderDerivF() {
    const cx = FW / 2, cy = FH / 2, scale = D_SCALE;
    drawDerivGrid(derivFCtx, FW, FH, cx, cy, scale);

    if (!derivExpr) return;

    // 도함수 곡선
    derivFCtx.beginPath();
    derivFCtx.strokeStyle = '#ff8bad';
    derivFCtx.lineWidth = 2.5;
    let first = true, prevY = null;
    for (let px = 0; px <= FW; px += 1) {
        const x = (px - cx) / scale;
        const dy = numericalDeriv(derivExpr, x);
        if (dy === null) { first = true; prevY = null; continue; }
        const py = toCanvasY(dy, cy, scale);
        if (prevY !== null && Math.abs(py - prevY) > FH) { first = true; }
        if (first) { derivFCtx.moveTo(px, py); first = false; }
        else derivFCtx.lineTo(px, py);
        prevY = py;
    }
    derivFCtx.stroke();

    // 현재 x0에서의 도함수 값 표시 점
    const slope = numericalDeriv(derivExpr, derivX0);
    if (slope !== null) {
        const px = toCanvasX(derivX0, cx, scale);
        const py = toCanvasY(slope, cy, scale);
        derivFCtx.beginPath();
        derivFCtx.arc(px, py, 6, 0, Math.PI * 2);
        derivFCtx.fillStyle = '#ff8bad';
        derivFCtx.fill();
        derivFCtx.strokeStyle = 'white';
        derivFCtx.lineWidth = 2;
        derivFCtx.stroke();

        // 수직 점선
        derivFCtx.beginPath();
        derivFCtx.strokeStyle = 'rgba(255,139,173,0.3)';
        derivFCtx.lineWidth = 1;
        derivFCtx.setLineDash([4, 4]);
        derivFCtx.moveTo(px, py); derivFCtx.lineTo(px, cy);
        derivFCtx.stroke();
        derivFCtx.setLineDash([]);

        // 레이블
        derivFCtx.fillStyle = '#ff8bad';
        derivFCtx.font = '700 12px Outfit, sans-serif';
        derivFCtx.textAlign = px > FW - 120 ? 'right' : 'left';
        derivFCtx.fillText(`f'(${derivX0}) = ${slope.toFixed(3)}`, px + (px > FW - 120 ? -10 : 10), py - 10);
    }

    // 레이블
    derivFCtx.fillStyle = '#ff8bad';
    derivFCtx.font = '700 14px Outfit, sans-serif';
    derivFCtx.textAlign = 'left';
    derivFCtx.fillText("y = f'(x)", 12, 22);
}

/* ========================================================= */
/* ---- 할선 → 접선 애니메이션 ---- */
/* ========================================================= */

function startSecantAnimation() {
    if (isAnimating) {
        cancelAnimationFrame(animFrameId);
        isAnimating = false;
        updateAnimBtn(false);
        return;
    }
    if (!derivExpr) return;

    derivH = 2.0;
    isAnimating = true;
    updateAnimBtn(true);

    const startH = 2.0;
    const endH = 0.001;
    const dur = 2500; // ms
    let startTime = null;

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function frame(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const raw = Math.min(elapsed / dur, 1);
        const t = ease(raw);
        derivH = startH + (endH - startH) * t;

        updateHSlider(derivH);
        renderDerivMain(derivH);
        renderDerivF();

        if (raw < 1) {
            animFrameId = requestAnimationFrame(frame);
        } else {
            derivH = endH;
            isAnimating = false;
            updateAnimBtn(false);
            renderDerivMain(derivH);
            renderDerivF();
        }
    }
    animFrameId = requestAnimationFrame(frame);
}

function updateAnimBtn(running) {
    const btn = document.getElementById('deriv-anim-btn');
    if (!btn) return;
    if (running) {
        btn.innerText = '⏹ 중지';
        btn.style.background = 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)';
    } else {
        btn.innerText = '▶ 할선→접선 애니메이션';
        btn.style.background = 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)';
    }
}

function updateHSlider(h) {
    const slider = document.getElementById('deriv-h-slider');
    const label = document.getElementById('deriv-h-val');
    if (slider) slider.value = Math.log10(h) * -1; // 로그 스케일
    if (label) label.innerText = h.toFixed(4);
}

/* ========================================================= */
/* ---- 프리셋 함수 ---- */
/* ========================================================= */

const DERIV_PRESETS = [
    { label: 'x²', expr: 'x^2' },
    { label: 'x³', expr: 'x^3' },
    { label: 'sin(x)', expr: 'sin(x)' },
    { label: 'cos(x)', expr: 'cos(x)' },
    { label: 'eˣ', expr: 'exp(x)' },
    { label: 'ln(x)', expr: 'log(x)' },
    { label: '1/x', expr: '1/x' },
    { label: '√x', expr: 'sqrt(x)' },
];

function renderPresetBtns() {
    const container = document.getElementById('deriv-presets');
    if (!container) return;
    container.innerHTML = '';
    DERIV_PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.innerText = p.label;
        btn.addEventListener('click', () => {
            document.getElementById('deriv-func-input').value = p.expr;
            applyDerivFunc(p.expr);
        });
        container.appendChild(btn);
    });
}

function applyDerivFunc(exprStr) {
    if (!exprStr) return;
    try {
        const expr = math.parse(exprStr);
        expr.evaluate({ x: 1 });
        derivExpr = expr;
        document.getElementById('deriv-error').innerText = '';

        // x0 범위를 함수에 맞게 조정
        tracePoints = [];
        renderDerivMain(derivH);
        renderDerivF();
        updateDerivInfo();
    } catch (e) {
        document.getElementById('deriv-error').innerText = '수식이 올바르지 않습니다.';
    }
}

function updateDerivInfo() {
    if (!derivExpr) return;
    const slope = numericalDeriv(derivExpr, derivX0);
    const fval = evalF(derivX0);
    document.getElementById('deriv-slope-val').innerText = slope?.toFixed(4) ?? '—';
    document.getElementById('deriv-fval-val').innerText = fval?.toFixed(4) ?? '—';
    document.getElementById('deriv-x0-display').innerText = derivX0.toString();
}

/* ========================================================= */
/* ---- 초기화 ---- */
/* ========================================================= */

function initDeriv() {
    renderPresetBtns();

    // 초기 함수 설정
    applyDerivFunc('x^2');

    // 함수 입력
    const funcInput = document.getElementById('deriv-func-input');
    const applyBtn = document.getElementById('deriv-apply-btn');
    applyBtn.addEventListener('click', () => applyDerivFunc(funcInput.value.trim()));
    funcInput.addEventListener('keypress', e => { if (e.key === 'Enter') applyDerivFunc(funcInput.value.trim()); });

    // x0 슬라이더
    const x0Slider = document.getElementById('deriv-x0-slider');
    x0Slider.addEventListener('input', e => {
        derivX0 = parseFloat(e.target.value);
        document.getElementById('deriv-x0-val').innerText = derivX0.toFixed(1);
        renderDerivMain(derivH);
        renderDerivF();
        updateDerivInfo();
    });

    // h 슬라이더 (로그 스케일: 0~3 → h=1000~0.001)
    const hSlider = document.getElementById('deriv-h-slider');
    hSlider.addEventListener('input', e => {
        const logH = parseFloat(e.target.value);
        derivH = Math.pow(10, -logH);
        document.getElementById('deriv-h-val').innerText = derivH.toFixed(4);
        if (!isAnimating) {
            renderDerivMain(derivH);
            renderDerivF();
        }
    });

    // 애니메이션 버튼
    document.getElementById('deriv-anim-btn').addEventListener('click', startSecantAnimation);

    // 초기 렌더
    renderDerivMain(derivH);
    renderDerivF();
    updateDerivInfo();

    // 탭 전환 시
    document.querySelector('.index-tab[data-unit="deriv"]')?.addEventListener('click', () => {
        setTimeout(() => { renderDerivMain(derivH); renderDerivF(); }, 50);
    });
}
