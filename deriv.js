/* ========================================================= */
/* --- Derivative (미분) Logic --- */
/* 할선 → 접선 수렴 애니메이션 + 도함수 실시간 그래프 */
/* ========================================================= */

(function() {
    let derivCanvas, derivCtx, derivFCanvas, derivFCtx;
    let DW, DH, FW, FH;
    let D_CX, D_CY;
    const D_SCALE = 55;   // px per unit

    let derivExpr = null;
    let derivX0 = 1;       // 접점 x 좌표
    let derivH = 2.0;     // 할선 간격 h
    let animFrameId = null;
    let isAnimating = false;
    let tracePoints = [];      // 도함수 trace

    /* ---- 헬퍼 함수 ---- */
    const toCX = (x, cx, scale) => cx + x * scale;
    const toCY = (y, cy, scale) => cy - y * scale;

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

    function updateDerivDimensions() {
        derivCanvas = document.getElementById('derivCanvas');
        if (derivCanvas) {
            derivCtx = derivCanvas.getContext('2d');
            DW = derivCanvas.width;
            DH = derivCanvas.height;
            D_CX = DW / 2;
            D_CY = DH / 2;
        }
        derivFCanvas = document.getElementById('derivFCanvas');
        if (derivFCanvas) {
            derivFCtx = derivFCanvas.getContext('2d');
            FW = derivFCanvas.width;
            FH = derivFCanvas.height;
        }
    }

    function drawDerivGrid(ctx, w, h, cx, cy, scale) {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let x = cx % scale; x < w; x += scale) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = cy % scale; y < h; y += scale) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.stroke();
        ctx.fillStyle = '#a0aec0';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const range = Math.ceil(w / scale / 2) + 1;
        for (let i = -range; i <= range; i++) {
            if (i === 0) continue;
            const px = toCX(i, cx, scale);
            const py = toCY(i, cy, scale);
            if (px >= 0 && px <= w) ctx.fillText(i, px, cy + 16);
            if (py >= 0 && py <= h) { ctx.textAlign = 'right'; ctx.fillText(i, cx - 5, py + 4); ctx.textAlign = 'center'; }
        }
        ctx.fillText('O', cx - 12, cy + 16);
    }

    function drawFunctionCurve(ctx, cx, cy, scale, color, lineWidth = 2.5) {
        if (!derivExpr || !ctx) return;
        const currentW = ctx.canvas.width;
        const currentH = ctx.canvas.height;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([]);
        let first = true, prevY = null;
        for (let px = 0; px <= currentW; px += 1) {
            const x = (px - cx) / scale;
            const fy = evalF(x);
            if (fy === null) { first = true; prevY = null; continue; }
            const py = toCY(fy, cy, scale);
            if (prevY !== null && Math.abs(py - prevY) > currentH) { first = true; }
            if (first) { ctx.moveTo(px, py); first = false; }
            else ctx.lineTo(px, py);
            prevY = py;
        }
        ctx.stroke();
    }

    function drawSecantLine(h) {
        if (!derivExpr || !derivCtx) return;
        const x0 = derivX0;
        const f0 = evalF(x0);
        const fh = evalF(x0 + h);
        if (f0 === null || fh === null) return;
        const slope = (fh - f0) / h;
        const xLeft = (0 - D_CX) / D_SCALE;
        const xRight = (DW - D_CX) / D_SCALE;
        const yLeft = f0 + slope * (xLeft - x0);
        const yRight = f0 + slope * (xRight - x0);
        const alpha = Math.max(0.1, Math.min(0.7, Math.abs(h) / 2));
        derivCtx.beginPath();
        derivCtx.strokeStyle = `rgba(255,184,108,${alpha})`;
        derivCtx.lineWidth = 1.5;
        derivCtx.setLineDash([6, 4]);
        derivCtx.moveTo(0, toCY(yLeft, D_CY, D_SCALE));
        derivCtx.lineTo(DW, toCY(yRight, D_CY, D_SCALE));
        derivCtx.stroke();
        derivCtx.setLineDash([]);
        const px1 = toCX(x0 + h, D_CX, D_SCALE);
        const py1 = toCY(fh, D_CY, D_SCALE);
        derivCtx.beginPath();
        derivCtx.arc(px1, py1, 4, 0, Math.PI * 2);
        derivCtx.fillStyle = 'rgba(255,184,108,0.8)';
        derivCtx.fill();
        const midX = (toCX(x0, D_CX, D_SCALE) + px1) / 2 + 10;
        const midY = (toCY(f0, D_CY, D_SCALE) + py1) / 2 - 10;
        derivCtx.fillStyle = '#ed8936';
        derivCtx.font = '600 12px Outfit, sans-serif';
        derivCtx.textAlign = 'left';
        derivCtx.fillText(`m = ${slope.toFixed(3)}`, midX, midY);
    }

    function drawTangentLine() {
        if (!derivExpr || !derivCtx) return;
        const x0 = derivX0;
        const f0 = evalF(x0);
        const slope = numericalDeriv(derivExpr, x0);
        if (f0 === null || slope === null) return;
        const xLeft = (0 - D_CX) / D_SCALE;
        const xRight = (DW - D_CX) / D_SCALE;
        derivCtx.beginPath();
        derivCtx.strokeStyle = '#ff8bad';
        derivCtx.lineWidth = 2.5;
        derivCtx.setLineDash([]);
        derivCtx.moveTo(0, toCY(f0 + slope * (xLeft - x0), D_CY, D_SCALE));
        derivCtx.lineTo(DW, toCY(f0 + slope * (xRight - x0), D_CY, D_SCALE));
        derivCtx.stroke();
        const px0 = toCX(x0, D_CX, D_SCALE);
        const py0 = toCY(f0, D_CY, D_SCALE);
        derivCtx.beginPath();
        derivCtx.arc(px0, py0, 6, 0, Math.PI * 2);
        derivCtx.fillStyle = '#ff8bad';
        derivCtx.fill();
        derivCtx.strokeStyle = 'white';
        derivCtx.lineWidth = 2;
        derivCtx.stroke();
        derivCtx.fillStyle = '#ff8bad';
        derivCtx.font = '700 13px Outfit, sans-serif';
        derivCtx.textAlign = 'left';
        derivCtx.fillText(`f'(${x0}) = ${slope.toFixed(4)}`, px0 + 10, py0 - 12);
    }

    function drawContactPoint() {
        if (!derivCtx) return;
        const x0 = derivX0;
        const f0 = evalF(x0);
        if (f0 === null) return;
        const px = toCX(x0, D_CX, D_SCALE);
        const py = toCY(f0, D_CY, D_SCALE);
        derivCtx.beginPath();
        derivCtx.strokeStyle = 'rgba(0,0,0,0.15)';
        derivCtx.lineWidth = 1;
        derivCtx.setLineDash([4, 4]);
        derivCtx.moveTo(px, py);
        derivCtx.lineTo(px, D_CY);
        derivCtx.stroke();
        derivCtx.setLineDash([]);
        derivCtx.fillStyle = '#4a5568';
        derivCtx.font = '600 12px Outfit, sans-serif';
        derivCtx.textAlign = 'center';
        derivCtx.fillText(`x₀ = ${x0}`, px, D_CY + 28);
    }

    function drawHLabel(h) {
        if (!derivExpr || !derivCtx) return;
        const x0 = derivX0, f0 = evalF(x0);
        if (f0 === null) return;
        const px0 = toCX(x0, D_CX, D_SCALE);
        const px1 = toCX(x0 + h, D_CX, D_SCALE);
        const py = toCY(f0, D_CY, D_SCALE) + 22;
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

    window.renderDerivMain = function(h = derivH) {
        updateDerivDimensions();
        if (!derivCtx) return;
        drawDerivGrid(derivCtx, DW, DH, D_CX, D_CY, D_SCALE);
        drawFunctionCurve(derivCtx, D_CX, D_CY, D_SCALE, '#73a5ff', 2.5);
        if (Math.abs(h) > 0.005) drawSecantLine(h);
        drawTangentLine();
        drawContactPoint();
        if (Math.abs(h) > 0.005) drawHLabel(h);
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
    };

    window.renderDerivF = function() {
        updateDerivDimensions();
        if (!derivFCtx) return;
        const cx = FW / 2, cy = FH / 2, scale = D_SCALE;
        drawDerivGrid(derivFCtx, FW, FH, cx, cy, scale);
        if (!derivExpr) return;
        derivFCtx.beginPath();
        derivFCtx.strokeStyle = '#ff8bad';
        derivFCtx.lineWidth = 2.5;
        let first = true, prevY = null;
        for (let px = 0; px <= FW; px += 1) {
            const x = (px - cx) / scale;
            const dy = numericalDeriv(derivExpr, x);
            if (dy === null) { first = true; prevY = null; continue; }
            const py = toCY(dy, cy, scale);
            if (prevY !== null && Math.abs(py - prevY) > FH) { first = true; }
            if (first) { derivFCtx.moveTo(px, py); first = false; }
            else derivFCtx.lineTo(px, py);
            prevY = py;
        }
        derivFCtx.stroke();
        const slope = numericalDeriv(derivExpr, derivX0);
        if (slope !== null) {
            const px = toCX(derivX0, cx, scale);
            const py = toCY(slope, cy, scale);
            derivFCtx.beginPath();
            derivFCtx.arc(px, py, 6, 0, Math.PI * 2);
            derivFCtx.fillStyle = '#ff8bad';
            derivFCtx.fill();
            derivFCtx.strokeStyle = 'white';
            derivFCtx.lineWidth = 2;
            derivFCtx.stroke();
            derivFCtx.beginPath();
            derivFCtx.strokeStyle = 'rgba(255,139,173,0.3)';
            derivFCtx.lineWidth = 1;
            derivFCtx.setLineDash([4, 4]);
            derivFCtx.moveTo(px, py); derivFCtx.lineTo(px, cy);
            derivFCtx.stroke();
            derivFCtx.setLineDash([]);
            derivFCtx.fillStyle = '#ff8bad';
            derivFCtx.font = '700 12px Outfit, sans-serif';
            derivFCtx.textAlign = px > FW - 120 ? 'right' : 'left';
            derivFCtx.fillText(`f'(${derivX0}) = ${slope.toFixed(3)}`, px + (px > FW - 120 ? -10 : 10), py - 10);
        }
        derivFCtx.fillStyle = '#ff8bad';
        derivFCtx.font = '700 14px Outfit, sans-serif';
        derivFCtx.textAlign = 'left';
        derivFCtx.fillText("y = f'(x)", 12, 22);
    };

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
        const dur = 2500;
        let startTime = null;
        function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
        function frame(ts) {
            if (!startTime) startTime = ts;
            const elapsed = ts - startTime;
            const raw = Math.min(elapsed / dur, 1);
            const t = ease(raw);
            derivH = startH + (endH - startH) * t;
            updateHSlider(derivH);
            window.renderDerivMain(derivH);
            window.renderDerivF();
            if (raw < 1) animFrameId = requestAnimationFrame(frame);
            else {
                derivH = endH;
                isAnimating = false;
                updateAnimBtn(false);
                window.renderDerivMain(derivH);
                window.renderDerivF();
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
        const sliderEl = document.getElementById('deriv-h-slider');
        const labelEl = document.getElementById('deriv-h-val');
        if (sliderEl) sliderEl.value = Math.log10(h) * -1;
        if (labelEl) labelEl.innerText = h.toFixed(4);
    }

    function applyDerivFunc(exprStr) {
        if (!exprStr) return;
        try {
            const expr = math.parse(exprStr);
            expr.evaluate({ x: 1 });
            derivExpr = expr;
            document.getElementById('deriv-error').innerText = '';
            window.renderDerivMain(derivH);
            window.renderDerivF();
            updateDerivInfo();
        } catch (e) {
            document.getElementById('deriv-error').innerText = '수식이 올바르지 않습니다.';
        }
    }

    function updateDerivInfo() {
        if (!derivExpr) return;
        const slope = numericalDeriv(derivExpr, derivX0);
        const fval = evalF(derivX0);
        const sValEl = document.getElementById('deriv-slope-val');
        const fValEl = document.getElementById('deriv-fval-val');
        const xValEl = document.getElementById('deriv-x0-display');
        if (sValEl) sValEl.innerText = slope?.toFixed(4) ?? '—';
        if (fValEl) fValEl.innerText = fval?.toFixed(4) ?? '—';
        if (xValEl) xValEl.innerText = derivX0.toString();
    }

    window.initDeriv = function() {
        try {
            updateDerivDimensions();
            // 프리셋 렌더링
            const container = document.getElementById('deriv-presets');
            if (container) {
                container.innerHTML = '';
                const DERIV_PRESETS = [
                    { label: 'x²', expr: 'x^2' }, { label: 'x³', expr: 'x^3' },
                    { label: 'sin(x)', expr: 'sin(x)' }, { label: 'cos(x)', expr: 'cos(x)' },
                    { label: 'eˣ', expr: 'exp(x)' }, { label: 'ln(x)', expr: 'log(x)' },
                    { label: '1/x', expr: '1/x' }, { label: '√x', expr: 'sqrt(x)' }
                ];
                DERIV_PRESETS.forEach(p => {
                    const btn = document.createElement('button');
                    btn.className = 'preset-btn';
                    btn.innerText = p.label;
                    btn.addEventListener('click', () => {
                        const input = document.getElementById('deriv-func-input');
                        if (input) input.value = p.expr;
                        applyDerivFunc(p.expr);
                    });
                    container.appendChild(btn);
                });
            }

            const funcInput = document.getElementById('deriv-func-input');
            const applyBtn = document.getElementById('deriv-apply-btn');
            if (applyBtn && funcInput) {
                applyBtn.onclick = () => applyDerivFunc(funcInput.value.trim());
                funcInput.onkeypress = e => { if (e.key === 'Enter') applyDerivFunc(funcInput.value.trim()); };
            }

            const x0Slider = document.getElementById('deriv-x0-slider');
            if (x0Slider) {
                x0Slider.oninput = e => {
                    derivX0 = parseFloat(e.target.value);
                    const label = document.getElementById('deriv-x0-val');
                    if (label) label.innerText = derivX0.toFixed(1);
                    window.renderDerivMain(derivH);
                    window.renderDerivF();
                    updateDerivInfo();
                };
            }

            const hSlider = document.getElementById('deriv-h-slider');
            if (hSlider) {
                hSlider.oninput = e => {
                    const logH = parseFloat(e.target.value);
                    derivH = Math.pow(10, -logH);
                    const label = document.getElementById('deriv-h-val');
                    if (label) label.innerText = derivH.toFixed(4);
                    if (!isAnimating) {
                        window.renderDerivMain(derivH);
                        window.renderDerivF();
                    }
                };
            }

            const animBtn = document.getElementById('deriv-anim-btn');
            if (animBtn) animBtn.onclick = startSecantAnimation;

            applyDerivFunc('x^2');
        } catch (err) {
            console.error('initDeriv failed:', err);
        }
    };
})();
