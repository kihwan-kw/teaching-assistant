/* ========================================================= */
/* ---  geom.js  ·  기하 (이차곡선 · 벡터 · 공간도형)     --- */
/* ---  줌/패닝 + 드래그 가능한 점 + 거리 시각화          --- */
/* ========================================================= */

(function () {
    'use strict';

    /* ============================================================
       공통 뷰포트 & 캔버스 유틸
       ============================================================ */

    function makeVP(W, H, scale) {
        return { cx: W / 2, cy: H / 2, scale: scale || 60 };
    }
    function toCx(vp, x) { return vp.cx + x * vp.scale; }
    function toCy(vp, y) { return vp.cy - y * vp.scale; }
    function toMx(vp, px) { return (px - vp.cx) / vp.scale; }
    function toMy(vp, py) { return (vp.cy - py) / vp.scale; }

    function drawGrid(ctx, vp, W, H) {
        ctx.clearRect(0, 0, W, H);
        const rawStep = 80 / vp.scale;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const cands = [1, 2, 5, 10].map(c => c * mag);
        const step = cands.find(c => c >= rawStep) || cands[cands.length - 1];

        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        const xS = Math.floor(toMx(vp, 0) / step) * step;
        const xE = Math.ceil(toMx(vp, W) / step) * step;
        for (let x = xS; x <= xE; x += step) {
            const px = toCx(vp, x);
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
        }
        const yS = Math.floor(toMy(vp, H) / step) * step;
        const yE = Math.ceil(toMy(vp, 0) / step) * step;
        for (let y = yS; y <= yE; y += step) {
            const py = toCy(vp, y);
            ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, vp.cy); ctx.lineTo(W, vp.cy);
        ctx.moveTo(vp.cx, 0); ctx.lineTo(vp.cx, H);
        ctx.stroke();

        ctx.fillStyle = '#718096';
        ctx.font = '11px Outfit, sans-serif';
        const labelY = Math.min(Math.max(vp.cy + 15, 15), H - 5);
        const labelX = Math.min(Math.max(vp.cx + 6, 6), W - 28);

        ctx.textAlign = 'center';
        for (let x = xS; x <= xE; x += step) {
            if (Math.abs(x) < step * 0.01) continue;
            const px = toCx(vp, x);
            if (px < 10 || px > W - 10) continue;
            ctx.fillText(Number.isInteger(x) ? x : x.toFixed(1), px, labelY);
        }
        ctx.textAlign = 'right';
        for (let y = yS; y <= yE; y += step) {
            if (Math.abs(y) < step * 0.01) continue;
            const py = toCy(vp, y);
            if (py < 10 || py > H - 10) continue;
            ctx.fillText(Number.isInteger(y) ? y : y.toFixed(1), labelX, py + 4);
        }
        ctx.textAlign = 'left';
        ctx.fillText('O', vp.cx - 14, vp.cy + 14);
        ctx.fillText('x', W - 12, vp.cy - 6);
        ctx.fillText('y', vp.cx + 5, 13);
    }

    function attachViewport(canvas, getVP, setVP, redraw, onDragPoint) {
        const CW = canvas.width;
        let panning = false, dragStart = null, vpAtStart = null;

        function toCanvas(e) {
            const rect = canvas.getBoundingClientRect();
            const r = CW / rect.width;
            return { px: (e.clientX - rect.left) * r, py: (e.clientY - rect.top) * r };
        }

        canvas.addEventListener('mousedown', e => {
            const { px, py } = toCanvas(e);
            const vp = getVP();
            if (onDragPoint && onDragPoint(toMx(vp, px), toMy(vp, py), true, false, false)) return;
            panning = true;
            dragStart = { px, py };
            vpAtStart = { ...getVP() };
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', e => {
            const { px, py } = toCanvas(e);
            const vp = getVP();
            if (onDragPoint && onDragPoint(toMx(vp, px), toMy(vp, py), false, true, false)) return;
            if (!panning) return;
            setVP({ ...vpAtStart, cx: vpAtStart.cx + (px - dragStart.px), cy: vpAtStart.cy + (py - dragStart.py) });
            redraw();
        });

        window.addEventListener('mouseup', e => {
            if (onDragPoint) {
                const { px, py } = toCanvas(e);
                onDragPoint(toMx(getVP(), px), toMy(getVP(), py), false, false, true);
            }
            panning = false;
            canvas.style.cursor = 'crosshair';
        });

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const { px, py } = toCanvas(e);
            const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            const vp = getVP();
            setVP({ cx: px - (px - vp.cx) * f, cy: py - (py - vp.cy) * f, scale: Math.max(8, Math.min(vp.scale * f, 3000)) });
            redraw();
        }, { passive: false });

        let lastT = null;
        canvas.addEventListener('touchstart', e => { lastT = e.touches; }, { passive: true });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const r = CW / rect.width;
            const vp = getVP();
            if (e.touches.length === 1 && lastT?.length === 1) {
                setVP({ ...vp, cx: vp.cx + (e.touches[0].clientX - lastT[0].clientX) * r, cy: vp.cy + (e.touches[0].clientY - lastT[0].clientY) * r });
            } else if (e.touches.length === 2 && lastT?.length === 2) {
                const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
                const f = dist(e.touches) / dist(lastT);
                const cx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * r;
                const cy = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * r;
                setVP({ cx: cx - (cx - vp.cx) * f, cy: cy - (cy - vp.cy) * f, scale: Math.max(8, Math.min(vp.scale * f, 3000)) });
            }
            lastT = e.touches;
            redraw();
        }, { passive: false });
        canvas.addEventListener('touchend', () => { lastT = null; });
        canvas.style.cursor = 'crosshair';
    }

    function dot(ctx, sx, sy, r, fill, stroke) {
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke(); }
    }

    function drawSegWithLabel(ctx, x1, y1, x2, y2, color, lw, text) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (text) {
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            let ang = Math.atan2(y2 - y1, x2 - x1);
            if (ang > Math.PI / 2 + 0.01 || ang < -Math.PI / 2 - 0.01) {
                ang += Math.PI; // 텍스트가 뒤집히지 않도록 각도 보정
            }
            ctx.font = 'bold 13px Outfit, sans-serif';
            ctx.fillStyle = color; ctx.textAlign = 'center';
            ctx.translate(mx, my); ctx.rotate(ang);
            ctx.fillText(text, 0, -8);
        }
        ctx.restore();
    }

    /* ============================================================
       패널 전환
       ============================================================ */
    let geomCurrentPanel = 'conic';

    /* ============================================================
       1. 이차곡선
       ============================================================ */
    const CONIC_CW = 800, CONIC_CH = 520;
    let conicVP = makeVP(CONIC_CW, CONIC_CH, 60);
    let conicType = 'parabola';
    let conicDragActive = false;
    let conicDragPt = { tx: 3, ty: 2 };
    let lastProjectedPt = { x: 3, y: 2 };

    const CONIC_PARAMS = {
        parabola: [{ id: 'cp-p', label: 'p (초점 거리)', min: 0.3, max: 5, step: 0.1, value: 1.5 }],
        ellipse: [
            { id: 'cp-c', label: 'c (초점 위치)', min: 0.1, max: 6, step: 0.1, value: 3 },
            { id: 'cp-sum', label: '거리의 합 (2a)', min: 1.0, max: 16, step: 0.2, value: 10 }
        ],
        hyperbola: [
            { id: 'cp-c', label: 'c (초점 위치)', min: 1.0, max: 8, step: 0.1, value: 5 },
            { id: 'cp-diff', label: '거리의 차 (2a)', min: 0.2, max: 15.8, step: 0.2, value: 6 }
        ]
    };

    const CONIC_INFO = {
        parabola: `<b>포물선</b>의 정의<br>초점 F와 준선 ℓ까지의 거리가 같은 점들의 집합<br>
               <span style="color:#e53e3e;font-size:15px;">PF = PH</span> (항상 성립)<br><br>
               표준형: y² = 4px &nbsp;· 초점 F(p, 0) &nbsp;· 준선 x = −p<br>
               <span style="color:#718096;font-size:12px;">🖱 빨간 점 P를 드래그하거나, 휠·드래그로 화면 이동</span>`,
        ellipse: `<b>타원</b>의 정의<br>두 초점까지의 거리의 합이 일정한 점들의 집합<br>
               <span style="color:#e53e3e;font-size:15px;">PF₁ + PF₂ = 2a</span> (항상 성립)<br><br>
               표준형: x²/a² + y²/b² = 1 &nbsp;· c² = a² − b²<br>
               <span style="color:#718096;font-size:12px;">🖱 점 P 드래그로 이동 · 슬라이더로 거리의 합(2a) 변경</span>`,
        hyperbola: `<b>쌍곡선</b>의 정의<br>두 초점까지의 거리의 차의 절댓값이 일정한 점들의 집합<br>
               <span style="color:#e53e3e;font-size:15px;">|PF₁ − PF₂| = 2a</span> (항상 성립)<br><br>
               표준형: x²/a² − y²/b² = 1 &nbsp;· c² = a² + b²<br>
               <span style="color:#718096;font-size:12px;">🖱 점 P 드래그로 이동 · 슬라이더로 거리의 차(2a) 변경</span>`
    };

    function getCp(id) { const el = document.getElementById(id); return el ? +el.value : 1; }

    function buildConicControls() {
        const box = document.getElementById('geom-conic-controls');
        if (!box) return;
        const params = CONIC_PARAMS[conicType];
        box.innerHTML = `<h3 class="matrix-section-title">⚙️ 파라미터</h3>`;
        params.forEach(p => {
            box.innerHTML += `
        <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;margin-bottom:3px;">
                <span>${p.label}</span>
                <span id="${p.id}-val" style="color:#3182ce;">${p.value}</span>
            </div>
            <input type="range" id="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" style="width:100%;">
        </div>`;
        });
        params.forEach(p => {
            const sl = document.getElementById(p.id);
            const vs = document.getElementById(`${p.id}-val`);
            if (!sl) return;
            sl.addEventListener('input', () => { if (vs) vs.textContent = (+sl.value).toFixed(1); redrawConic(); });
        });
    }

    /* 포물선 위 투영 */
    function projParabola(mx, my, p) {
        const y = Math.max(-30, Math.min(30, my));
        return { x: (y * y) / (4 * p), y };
    }

    /* 타원 위 투영 */
    function projEllipse(mx, my, a, b) {
        let theta = Math.atan2(my / b, mx / a);
        for (let i = 0; i < 8; i++) {
            const ex = a * Math.cos(theta), ey = b * Math.sin(theta);
            const dx = mx - ex, dy = my - ey;
            const dtx = -a * Math.sin(theta), dty = b * Math.cos(theta);
            const d2 = dtx * dtx + dty * dty;
            if (d2 < 1e-10) break;
            theta += (dx * dtx + dy * dty) / d2;
        }
        return { x: a * Math.cos(theta), y: b * Math.sin(theta) };
    }

    /* 쌍곡선 위 투영 (가장 가까운 가지) */
    function projHyperbola(mx, my, a, b) {
        const snap = (sign) => {
            let t = Math.asinh(Math.max(-10, Math.min(10, my / b)));
            for (let i = 0; i < 8; i++) {
                const hx = sign * a * Math.cosh(t), hy = b * Math.sinh(t);
                const dx = mx - hx, dy = my - hy;
                const dtx = sign * a * Math.sinh(t), dty = b * Math.cosh(t);
                const d2 = dtx * dtx + dty * dty;
                if (d2 < 1e-10) break;
                t += (dx * dtx + dy * dty) / d2;
            }
            return { x: sign * a * Math.cosh(t), y: b * Math.sinh(t) };
        };
        const r = snap(1), l = snap(-1);
        const dr = (mx - r.x) ** 2 + (my - r.y) ** 2;
        const dl = (mx - l.x) ** 2 + (my - l.y) ** 2;
        return dr < dl ? r : l;
    }

    function drawInfoBadge(ctx, W, H, d1, d2, l1, l2, mode, constVal, constLabel) {
        /* mode: 'equal' | 'sum' | 'diff' */
        const bw = 228, bh = mode === 'equal' ? 68 : 84;
        const bx = W - bw - 12, by = 12;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 10);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill(); ctx.stroke();

        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'left';

        if (mode === 'equal') {
            const eq = Math.abs(d1 - d2) < 0.025;
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`${l1} = ${d1.toFixed(3)}`, bx + 12, by + 22);
            ctx.fillText(`${l2} = ${d2.toFixed(3)}`, bx + 12, by + 40);
            ctx.font = 'bold 13px Outfit';
            ctx.fillStyle = eq ? '#38a169' : '#e53e3e';
            ctx.fillText(eq ? `✓ ${l1} = ${l2} (항상 같습니다)` : `차이: ${Math.abs(d1 - d2).toFixed(4)}`, bx + 12, by + 60);
        } else if (mode === 'sum') {
            const total = d1 + d2;
            const ok = constVal && Math.abs(total - constVal) < 0.06;
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`${l1} = ${d1.toFixed(3)}`, bx + 12, by + 22);
            ctx.fillText(`${l2} = ${d2.toFixed(3)}`, bx + 12, by + 40);
            ctx.font = 'bold 13px Outfit';
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`${l1} + ${l2} = ${total.toFixed(3)}`, bx + 12, by + 58);
            ctx.fillStyle = ok ? '#38a169' : '#e53e3e';
            ctx.fillText(`${constLabel} = ${constVal ? constVal.toFixed(3) : '?'} ${ok ? '✓ 일정!' : ''}`, bx + 12, by + 76);
        } else { /* diff */
            const diff = Math.abs(d1 - d2);
            const ok = constVal && Math.abs(diff - constVal) < 0.06;
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`${l1} = ${d1.toFixed(3)}`, bx + 12, by + 22);
            ctx.fillText(`${l2} = ${d2.toFixed(3)}`, bx + 12, by + 40);
            ctx.font = 'bold 13px Outfit';
            ctx.fillStyle = '#2d3748';
            ctx.fillText(`|${l1} − ${l2}| = ${diff.toFixed(3)}`, bx + 12, by + 58);
            ctx.fillStyle = ok ? '#38a169' : '#e53e3e';
            ctx.fillText(`${constLabel} = ${constVal ? constVal.toFixed(3) : '?'} ${ok ? '✓ 일정!' : ''}`, bx + 12, by + 76);
        }
        ctx.restore();
    }

    function redrawConic() {
        const canvas = document.getElementById('geomConicCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const vp = conicVP;
        drawGrid(ctx, vp, W, H);

        const cx = x => toCx(vp, x), cy = y => toCy(vp, y);

        ctx.save();
        ctx.lineJoin = 'round';

        const showTanNorm = document.getElementById('geom-conic-tangent')?.checked;
        const drawTanNorm = (px, py, m) => {
            if (!showTanNorm) return;
            const L = Math.max(W, H) / vp.scale * 2;
            const dx = isFinite(m) ? L / Math.sqrt(1 + m * m) : 0;
            const dy = isFinite(m) ? m * dx : L;
            
            // 접선 (보라색)
            ctx.save(); ctx.strokeStyle = 'rgba(159,122,234,0.8)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (!isFinite(m)) {
                ctx.moveTo(cx(px), cy(py - L)); ctx.lineTo(cx(px), cy(py + L));
            } else {
                ctx.moveTo(cx(px - dx), cy(py - dy)); ctx.lineTo(cx(px + dx), cy(py + dy));
            }
            ctx.stroke(); ctx.restore();

            // 법선 (주황색 점선)
            const mn = !isFinite(m) ? 0 : (Math.abs(m) < 1e-6 ? Infinity : -1 / m);
            const dnx = isFinite(mn) ? L / Math.sqrt(1 + mn * mn) : 0;
            const dny = isFinite(mn) ? mn * dnx : L;
            ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(237,137,54,0.8)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (!isFinite(mn)) {
                ctx.moveTo(cx(px), cy(py - L)); ctx.lineTo(cx(px), cy(py + L));
            } else {
                ctx.moveTo(cx(px - dnx), cy(py - dny)); ctx.lineTo(cx(px + dnx), cy(py + dny));
            }
            ctx.stroke(); ctx.restore();
        };

        const updateTanEq = (px, py, m) => {
            const eqDiv = document.getElementById('geom-conic-tangent-eq');
            if (!eqDiv) return;
            if (!showTanNorm) {
                eqDiv.innerHTML = '';
                return;
            }
            let text = `점 P(${px.toFixed(1)}, ${py.toFixed(1)})에서의 접선:<br>`;
            if (!isFinite(m)) {
                text += `x = ${px.toFixed(2)}`;
            } else {
                const n = py - m * px;
                const sign = n >= 0 ? '+' : '−';
                text += `y = ${m.toFixed(2)}x ${sign} ${Math.abs(n).toFixed(2)}`;
            }
            eqDiv.innerHTML = text;
        };

        if (conicType === 'parabola') {
            const p = getCp('cp-p');
            /* 포물선 */
            ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5;
            const yMin = toMy(vp, H), yMax = toMy(vp, 0);
            for (let i = 0; i <= 500; i++) {
                const my = yMin + (yMax - yMin) * i / 500;
                const mx = (my * my) / (4 * p);
                i === 0 ? ctx.moveTo(cx(mx), cy(my)) : ctx.lineTo(cx(mx), cy(my));
            }
            ctx.stroke();
            /* 준선 */
            ctx.beginPath(); ctx.setLineDash([7, 5]); ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2;
            ctx.moveTo(cx(-p), 0); ctx.lineTo(cx(-p), H); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#38a169'; ctx.textAlign = 'left';
            ctx.fillText(`x = −${p.toFixed(1)}`, cx(-p) + 8, 25);
            /* 초점 */
            dot(ctx, cx(p), cy(0), 8, '#3182ce', '#fff');
            ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#3182ce'; ctx.textAlign = 'left';
            ctx.fillText(`F(${p.toFixed(1)}, 0)`, cx(p) + 10, cy(0) - 6);

            /* 점 P 투영 */
            const P = projParabola(conicDragPt.tx, conicDragPt.ty, p);
            lastProjectedPt = P;
            
            /* 접선 및 법선 표시 */
            const mParabola = Math.abs(P.y) > 1e-5 ? (2 * p) / P.y : Infinity;
            drawTanNorm(P.x, P.y, mParabola);
            updateTanEq(P.x, P.y, mParabola);
            
            const sx = cx(P.x), sy = cy(P.y);
            const Hx = -p, sHx = cx(Hx), sHy = cy(P.y);
            const dPF = Math.sqrt((P.x - p) ** 2 + P.y ** 2);
            const dPH = Math.abs(P.x - Hx);

            /* 선분 */
            drawSegWithLabel(ctx, sx, sy, cx(p), cy(0), '#2d3748', 2.2, `PF=${dPF.toFixed(2)}`);
            drawSegWithLabel(ctx, sx, sy, sHx, sHy, '#dd6b20', 2.5, `PH=${dPH.toFixed(2)}`);
            /* 직각 기호 */
            const sq = 9; ctx.strokeStyle = '#dd6b20'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sHx, sHy - sq); ctx.lineTo(sHx + sq, sHy - sq); ctx.lineTo(sHx + sq, sHy);
            ctx.stroke();
            /* H점 */
            dot(ctx, sHx, sHy, 5, '#dd6b20', '#fff');
            ctx.font = 'bold 12px Outfit'; ctx.fillStyle = '#dd6b20'; ctx.textAlign = 'left';
            ctx.fillText('H', sHx + 6, sHy - 6);
            /* 배지 */
            drawInfoBadge(ctx, W, H, dPF, dPH, 'PF', 'PH', 'equal');
            /* P점 */
            dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
            ctx.fillText('P', sx + 10, sy - 6);

        } else if (conicType === 'ellipse') {
            let c = getCp('cp-c'), sum = getCp('cp-sum');
            if (sum <= 2 * c) {
                sum = 2 * c + 0.2;
                const sl = document.getElementById('cp-sum');
                const val = document.getElementById('cp-sum-val');
                if (sl) sl.value = sum;
                if (val) val.textContent = sum.toFixed(1);
            }
            let a = sum / 2;
            let b = Math.sqrt(a * a - c * c);
            /* 타원 */
            ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5;
            for (let i = 0; i <= 360; i++) {
                const t = i / 360 * Math.PI * 2;
                i === 0 ? ctx.moveTo(cx(a * Math.cos(t)), cy(b * Math.sin(t))) : ctx.lineTo(cx(a * Math.cos(t)), cy(b * Math.sin(t)));
            }
            ctx.closePath(); ctx.stroke();
            /* 초점 */
            dot(ctx, cx(-c), cy(0), 8, '#3182ce', '#fff');
            ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#3182ce'; ctx.textAlign = 'right';
            ctx.fillText(`F₁(−${c.toFixed(1)},0)`, cx(-c) - 10, cy(0) - 6);
            dot(ctx, cx(c), cy(0), 8, '#3182ce', '#fff');
            ctx.textAlign = 'left';
            ctx.fillText(`F₂(${c.toFixed(1)},0)`, cx(c) + 10, cy(0) - 6);

            /* 준선 */
            const dx = (a * a) / c;
            ctx.beginPath(); ctx.setLineDash([7, 5]); ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2;
            ctx.moveTo(cx(-dx), 0); ctx.lineTo(cx(-dx), H);
            ctx.moveTo(cx(dx), 0); ctx.lineTo(cx(dx), H);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#38a169';
            ctx.textAlign = 'right'; ctx.fillText(`x = −${dx.toFixed(2)}`, cx(-dx) - 8, 25);
            ctx.textAlign = 'left'; ctx.fillText(`x = ${dx.toFixed(2)}`, cx(dx) + 8, 25);

            const P = projEllipse(conicDragPt.tx, conicDragPt.ty, a, b);
            lastProjectedPt = P;

            /* 접선 및 법선 표시 */
            const mEllipse = Math.abs(P.y) > 1e-5 ? -(b * b * P.x) / (a * a * P.y) : Infinity;
            drawTanNorm(P.x, P.y, mEllipse);
            updateTanEq(P.x, P.y, mEllipse);

            const sx = cx(P.x), sy = cy(P.y);
            const dF1 = Math.sqrt((P.x + c) ** 2 + P.y ** 2), dF2 = Math.sqrt((P.x - c) ** 2 + P.y ** 2);
            drawSegWithLabel(ctx, sx, sy, cx(-c), cy(0), '#2d3748', 2.2, `PF₁=${dF1.toFixed(2)}`);
            drawSegWithLabel(ctx, sx, sy, cx(c), cy(0), '#dd6b20', 2.2, `PF₂=${dF2.toFixed(2)}`);
            drawInfoBadge(ctx, W, H, dF1, dF2, 'PF₁', 'PF₂', 'sum', 2 * a, '2a');
            dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
            ctx.fillText('P', sx + 10, sy - 6);

        } else if (conicType === 'hyperbola') {
            let c = getCp('cp-c'), diff = getCp('cp-diff');
            if (diff >= 2 * c) {
                diff = 2 * c - 0.2;
                const sl = document.getElementById('cp-diff');
                const val = document.getElementById('cp-diff-val');
                if (sl) sl.value = diff;
                if (val) val.textContent = diff.toFixed(1);
            }
            let a = diff / 2;
            let b = Math.sqrt(c * c - a * a);
            /* 쌍곡선 두 가지 */
            for (const sign of [1, -1]) {
                ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5;
                const xEdge = sign > 0 ? Math.max(a + 0.01, toMx(vp, W)) : Math.min(-(a + 0.01), toMx(vp, 0));
                const tMax = Math.acosh(Math.max(1.001, Math.abs(xEdge) / a));
                for (let i = 0; i <= 500; i++) {
                    const t = -tMax + 2 * tMax * i / 500;
                    const mx = sign * a * Math.cosh(t), my = b * Math.sinh(t);
                    i === 0 ? ctx.moveTo(cx(mx), cy(my)) : ctx.lineTo(cx(mx), cy(my));
                }
                ctx.stroke();
            }
            /* 점근선 */
            ctx.setLineDash([6, 5]); ctx.strokeStyle = '#a0aec0'; ctx.lineWidth = 1.5;
            const ext = Math.max(20, Math.abs(toMx(vp, 0)) + Math.abs(toMx(vp, W)));
            ctx.beginPath(); ctx.moveTo(cx(-ext), cy(-ext * b / a)); ctx.lineTo(cx(ext), cy(ext * b / a)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx(-ext), cy(ext * b / a)); ctx.lineTo(cx(ext), cy(-ext * b / a)); ctx.stroke();
            ctx.setLineDash([]);

            /* 점근선 방정식 */
            for (const sign of [1, -1]) {
                const slope = sign * (b / a);
                const txt = `y = ${slope > 0 ? '' : '−'}${(b / a).toFixed(2)}x`;
                const px = cx(a + 1.5);
                const py = cy((a + 1.5) * slope);
                const ang = Math.atan2(-slope, 1); // 캔버스 y축이 아래를 향하므로 기울기 부호 반전
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(ang);
                ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#718096'; ctx.textAlign = 'center';
                ctx.fillText(txt, 0, -8);
                ctx.restore();
            }
            /* 초점 */
            dot(ctx, cx(-c), cy(0), 8, '#3182ce', '#fff');
            ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#3182ce'; ctx.textAlign = 'right';
            ctx.fillText(`F₁(−${c.toFixed(1)},0)`, cx(-c) - 10, cy(0) - 6);
            dot(ctx, cx(c), cy(0), 8, '#3182ce', '#fff');
            ctx.textAlign = 'left';
            ctx.fillText(`F₂(${c.toFixed(1)},0)`, cx(c) + 10, cy(0) - 6);

            /* 준선 */
            const hdx = (a * a) / c;
            ctx.beginPath(); ctx.setLineDash([7, 5]); ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2;
            ctx.moveTo(cx(-hdx), 0); ctx.lineTo(cx(-hdx), H);
            ctx.moveTo(cx(hdx), 0); ctx.lineTo(cx(hdx), H);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#38a169';
            ctx.textAlign = 'right'; ctx.fillText(`x = −${hdx.toFixed(2)}`, cx(-hdx) - 8, 25);
            ctx.textAlign = 'left'; ctx.fillText(`x = ${hdx.toFixed(2)}`, cx(hdx) + 8, 25);

            const P = projHyperbola(conicDragPt.tx, conicDragPt.ty, a, b);
            lastProjectedPt = P;
            conicDragPt = { tx: P.x, ty: P.y };
            
            /* 접선 및 법선 표시 */
            const mHyperbola = Math.abs(P.y) > 1e-5 ? (b * b * P.x) / (a * a * P.y) : Infinity;
            drawTanNorm(P.x, P.y, mHyperbola);
            updateTanEq(P.x, P.y, mHyperbola);

            const sx = cx(P.x), sy = cy(P.y);
            const dF1 = Math.sqrt((P.x + c) ** 2 + P.y ** 2), dF2 = Math.sqrt((P.x - c) ** 2 + P.y ** 2);
            drawSegWithLabel(ctx, sx, sy, cx(-c), cy(0), '#2d3748', 2.2, `PF₁=${dF1.toFixed(2)}`);
            drawSegWithLabel(ctx, sx, sy, cx(c), cy(0), '#dd6b20', 2.2, `PF₂=${dF2.toFixed(2)}`);
            drawInfoBadge(ctx, W, H, dF1, dF2, 'PF₁', 'PF₂', 'diff', 2 * a, '2a');
            dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
            ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
            ctx.fillText('P', sx + 10, sy - 6);
        }

        ctx.restore();
    }

    function conicDragHandler(mx, my, isDown, isMove, isUp) {
        if (isDown) {
            const P = lastProjectedPt;
            const dist = Math.sqrt((mx - P.x) ** 2 + (my - P.y) ** 2);
            if (dist < 20 / conicVP.scale) { conicDragActive = true; return true; }
            return false;
        }
        if (isMove && conicDragActive) { conicDragPt = { tx: mx, ty: my }; redrawConic(); return true; }
        if (isUp) { conicDragActive = false; return false; }
        return false;
    }

    function initConicSection() {
        const canvas = document.getElementById('geomConicCanvas');
        if (!canvas) return;
        canvas.width = CONIC_CW; canvas.height = CONIC_CH;

        document.querySelectorAll('.geom-conic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.geom-conic-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                conicType = btn.dataset.conic;
                /* 타입별 초기 P 위치 */
                if (conicType === 'parabola') conicDragPt = { tx: 3, ty: 2 };
                if (conicType === 'ellipse') conicDragPt = { tx: 2, ty: 2.5 };
                if (conicType === 'hyperbola') conicDragPt = { tx: 3, ty: 2 };
                buildConicControls();
                const info = document.getElementById('geom-conic-info');
                if (info) info.innerHTML = CONIC_INFO[conicType];
                redrawConic();
            });
        });

        buildConicControls();
        const info = document.getElementById('geom-conic-info');
        if (info) info.innerHTML = CONIC_INFO[conicType];

        const tanCheck = document.getElementById('geom-conic-tangent');
        if (tanCheck) tanCheck.addEventListener('change', redrawConic);

        attachViewport(canvas, () => conicVP, vp => { conicVP = vp; }, redrawConic, conicDragHandler);

        const resetBtn = document.getElementById('geom-conic-reset');
        if (resetBtn) resetBtn.addEventListener('click', () => { conicVP = makeVP(CONIC_CW, CONIC_CH, 60); redrawConic(); });
    }

    /* ============================================================
       2. 벡터
       ============================================================ */
    const VEC_CW = 800, VEC_CH = 520;
    let vecVP = makeVP(VEC_CW, VEC_CH, 55);
    let vecOp = 'add';
    let vecPts = { ax: 3, ay: 2, bx: 1, by: 3 };
    let vecDragId = null;
    let vecScalarK = 2.0;

    function redrawVector() {
        const canvas = document.getElementById('geomVecCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const vp = vecVP;
        drawGrid(ctx, vp, W, H);
        const cx = x => toCx(vp, x), cy = y => toCy(vp, y);
        const ox = cx(0), oy = cy(0);
        const { ax, ay, bx, by } = vecPts;

        /* 슬라이더 동기화 */
        ['ax', 'ay', 'bx', 'by'].forEach(id => {
            const sl = document.getElementById(`geom-${id}`);
            const sp = document.getElementById(`geom-${id}-val`);
            if (sl) sl.value = vecPts[id];
            if (sp) sp.textContent = vecPts[id].toFixed(1);
        });

        /* 탭별 패널 show/hide */
        const bPanel = document.getElementById('geom-vec-b-panel');
        const kPanel = document.getElementById('geom-vec-k-panel');
        if (bPanel) bPanel.style.display = (vecOp === 'add' || vecOp === 'sub' || vecOp === 'dot' || vecOp === 'pos') ? '' : 'none';
        if (kPanel) kPanel.style.display = (vecOp === 'scalar') ? '' : 'none';

        ctx.save();

        const drawVecLabel = (ctx, lbl, tx, ty, color) => {
            ctx.save();
            ctx.setLineDash([]);
            ctx.font = 'bold 16px Outfit';
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            const drawArrowOver = (x, y, w) => {
                if (w <= 0) return;
                ctx.beginPath(); ctx.lineWidth = 1.2;
                ctx.moveTo(x - 1, y); ctx.lineTo(x + w + 1, y);
                ctx.lineTo(x + w - 2, y - 2);
                ctx.moveTo(x + w + 1, y); ctx.lineTo(x + w - 2, y + 2);
                ctx.stroke();
            };

            if (lbl.includes('+') || lbl.includes('−')) {
                const op = lbl.includes('+') ? '+' : '−';
                const parts = lbl.split(op);
                const w1 = parts[0] ? ctx.measureText(parts[0]).width : 0;
                const opStr = parts[0] ? ` ${op} ` : `${op} `;
                const wOp = ctx.measureText(opStr).width;
                const w2 = parts[1] ? ctx.measureText(parts[1]).width : 0;
                const totalW = w1 + wOp + w2;
                let currX = tx - totalW / 2;

                ctx.textAlign = 'left';
                if (parts[0]) { ctx.fillText(parts[0], currX, ty); drawArrowOver(currX, ty - 13, w1); }
                currX += w1;
                ctx.fillText(opStr, currX, ty); currX += wOp;
                if (parts[1]) { ctx.fillText(parts[1], currX, ty); drawArrowOver(currX, ty - 13, w2); }
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(lbl, tx, ty);
                const w = ctx.measureText(lbl).width;
                drawArrowOver(tx - w / 2, ty - 13, w);
            }
            ctx.restore();
        };

        const arrow = (x1, y1, x2, y2, color, lbl, lw) => {
            const ang = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw || 2.5;
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.save(); ctx.translate(x2, y2); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -5); ctx.lineTo(-13, 5); ctx.closePath();
            ctx.fillStyle = color; ctx.fill(); ctx.restore();
            if (lbl) {
                const tx = (x1 + x2) / 2 - Math.sin(ang) * 18;
                const ty = (y1 + y2) / 2 + Math.cos(ang) * 18;
                drawVecLabel(ctx, lbl, tx, ty, color);
            }
        };

        /* ── 덧셈 ── */
        if (vecOp === 'add') {
            ctx.setLineDash([5, 4]);
            arrow(cx(ax), cy(ay), cx(ax + bx), cy(ay + by), 'rgba(231,76,60,0.45)', '', 1.8);
            arrow(cx(bx), cy(by), cx(ax + bx), cy(ay + by), 'rgba(49,130,206,0.45)', '', 1.8);
            ctx.setLineDash([]);
            arrow(ox, oy, cx(ax), cy(ay), '#3182ce', 'a', 2.8);
            arrow(ox, oy, cx(bx), cy(by), '#e53e3e', 'b', 2.8);
            arrow(ox, oy, cx(ax + bx), cy(ay + by), '#38a169', 'a+b', 3.2);
            document.getElementById('geom-vec-result').innerHTML =
                `<span style="color:#3182ce"><span class="vec-text">a</span></span> = (${ax.toFixed(1)}, ${ay.toFixed(1)}) &nbsp; |<span class="vec-text">a</span>| = ${Math.sqrt(ax * ax + ay * ay).toFixed(2)}<br>
                 <span style="color:#e53e3e"><span class="vec-text">b</span></span> = (${bx.toFixed(1)}, ${by.toFixed(1)}) &nbsp; |<span class="vec-text">b</span>| = ${Math.sqrt(bx * bx + by * by).toFixed(2)}<br>
                 <span style="color:#38a169"><span class="vec-text">a</span> + <span class="vec-text">b</span></span> = (${(ax + bx).toFixed(1)}, ${(ay + by).toFixed(1)})<br>
                 <span style="color:#38a169">|<span class="vec-text">a</span> + <span class="vec-text">b</span>|</span> = ${Math.sqrt((ax + bx) ** 2 + (ay + by) ** 2).toFixed(3)}`;

            /* ── 뺄셈 ── */
        } else if (vecOp === 'sub') {
            ctx.setLineDash([5, 4]);
            arrow(cx(ax), cy(ay), cx(ax - bx), cy(ay - by), 'rgba(229,62,62,0.45)', '', 1.8);
            arrow(cx(-bx), cy(-by), cx(ax - bx), cy(ay - by), 'rgba(49,130,206,0.45)', '', 1.8);
            ctx.setLineDash([]);
            arrow(ox, oy, cx(ax), cy(ay), '#3182ce', 'a', 2.8);
            arrow(ox, oy, cx(bx), cy(by), '#e53e3e', 'b', 2.8);
            arrow(ox, oy, cx(-bx), cy(-by), '#e53e3e', '−b', 2.8);
            arrow(ox, oy, cx(ax - bx), cy(ay - by), '#9f7aea', 'a−b', 3.2);
            document.getElementById('geom-vec-result').innerHTML =
                `<span style="color:#3182ce"><span class="vec-text">a</span></span> = (${ax.toFixed(1)}, ${ay.toFixed(1)})<br>
                 <span style="color:#e53e3e"><span class="vec-text">b</span></span> = (${bx.toFixed(1)}, ${by.toFixed(1)})<br>
                 <span style="color:#9f7aea"><span class="vec-text">a</span> − <span class="vec-text">b</span></span> = (${(ax - bx).toFixed(1)}, ${(ay - by).toFixed(1)})<br>
                 <span style="color:#9f7aea">|<span class="vec-text">a</span> − <span class="vec-text">b</span>|</span> = ${Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2).toFixed(3)}`;

            /* ── 내적 (정사영 강화) ── */
        } else if (vecOp === 'dot') {
            const mA = Math.sqrt(ax * ax + ay * ay), mB = Math.sqrt(bx * bx + by * by);
            const d = ax * bx + ay * by;
            const cosT = mA && mB ? d / (mA * mB) : 0;
            const theta = Math.acos(Math.max(-1, Math.min(1, cosT)));
            const isPerp = Math.abs(d) < 0.08;

            /* b 위로 a를 정사영 — 발(foot) 좌표 */
            const projLen = mB > 0.01 ? d / mB : 0;            /* |a|cosθ */
            const footX = mB > 0.01 ? (projLen / mB) * bx : 0; /* b 단위벡터 × projLen */
            const footY = mB > 0.01 ? (projLen / mB) * by : 0;

            /* 정사영 선분: a 끝 → foot (수직 강하선) */
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = 'rgba(237,137,54,0.7)'; ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(cx(ax), cy(ay));
            ctx.lineTo(cx(footX), cy(footY));
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            /* 정사영 foot 위치에 직각 기호 */
            if (!isPerp && mB > 0.01) {
                const bux = bx / mB, buy = by / mB;           /* b 단위벡터 */
                const nx = -buy, ny = bux;                     /* b의 법선 */
                const sq = 10 / vp.scale;
                const fx = footX, fy = footY;
                ctx.save(); ctx.strokeStyle = 'rgba(237,137,54,0.8)'; ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx(fx + bux * sq), cy(fy + buy * sq));
                ctx.lineTo(cx(fx + bux * sq + nx * sq), cy(fy + buy * sq + ny * sq));
                ctx.lineTo(cx(fx + nx * sq), cy(fy + ny * sq));
                ctx.stroke(); ctx.restore();
            }

            /* 정사영 벡터 (원점 → foot): 굵은 주황색 */
            if (Math.abs(projLen) > 0.05) {
                ctx.save(); ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 4; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx(footX), cy(footY)); ctx.stroke();
                ctx.restore();
                /* 정사영 길이 레이블 */
                ctx.font = '12px Outfit'; ctx.fillStyle = '#c05621'; ctx.textAlign = 'center';
                ctx.fillText(`|a|cosθ=${projLen.toFixed(2)}`,
                    (ox + cx(footX)) / 2 + (by / mB) * 20,
                    (oy + cy(footY)) / 2 - (bx / mB) * 20);
            }

            /* 수직일 때 ⊥ 표시 */
            if (isPerp && mA > 0.01 && mB > 0.01) {
                ctx.font = 'bold 22px Outfit'; ctx.fillStyle = '#38a169'; ctx.textAlign = 'center';
                ctx.fillText('⊥', ox + 26, oy - 14);
                ctx.font = '12px Outfit';
                ctx.fillText('a · b = 0', ox + 26, oy - 0);
            }

            /* 사잇각 호 */
            if (mA > 0.01 && mB > 0.01) {
                const a1 = Math.atan2(-ay, ax), a2 = Math.atan2(-by, bx);
                ctx.beginPath(); ctx.arc(ox, oy, 38, Math.min(a1, a2), Math.max(a1, a2));
                ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 2; ctx.stroke();
                ctx.font = '13px Outfit'; ctx.fillStyle = '#ed8936'; ctx.textAlign = 'center';
                ctx.fillText(`θ≈${(theta * 180 / Math.PI).toFixed(1)}°`,
                    ox + 55 * Math.cos((a1 + a2) / 2), oy + 55 * Math.sin((a1 + a2) / 2));
            }

            arrow(ox, oy, cx(ax), cy(ay), '#3182ce', 'a', 2.8);
            arrow(ox, oy, cx(bx), cy(by), '#e53e3e', 'b', 2.8);

            document.getElementById('geom-vec-result').innerHTML =
                `<span style="color:#3182ce"><span class="vec-text">a</span></span> = (${ax.toFixed(1)}, ${ay.toFixed(1)}) &nbsp; |<span class="vec-text">a</span>| = ${mA.toFixed(2)}<br>
                 <span style="color:#e53e3e"><span class="vec-text">b</span></span> = (${bx.toFixed(1)}, ${by.toFixed(1)}) &nbsp; |<span class="vec-text">b</span>| = ${mB.toFixed(2)}<br>
                 <span style="color:#ed8936;"><span class="vec-text">a</span> · <span class="vec-text">b</span></span> = <b>${d.toFixed(3)}</b><br>
                 cos θ = ${cosT.toFixed(3)} &nbsp; θ ≈ <b>${(theta * 180 / Math.PI).toFixed(1)}°</b><br>
                 <span style="color:#c05621;">정사영 |<span class="vec-text">a</span>|cosθ = ${projLen.toFixed(3)}</span>`;

            /* ── 실수배 ── */
        } else if (vecOp === 'scalar') {
            const k = vecScalarK;
            const kax = k * ax, kay = k * ay;
            const mA = Math.sqrt(ax * ax + ay * ay);
            const mKA = Math.abs(k) * mA;
            const kColor = k > 0 ? '#38a169' : '#e53e3e';

            if (Math.abs(k) > 0.01) {
                /* k<0 : 원래 a 방향 점선으로 잔상 */
                if (k < 0) {
                    ctx.save(); ctx.setLineDash([6, 4]);
                    ctx.strokeStyle = 'rgba(49,130,206,0.25)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx(ax), cy(ay)); ctx.stroke();
                    ctx.setLineDash([]); ctx.restore();
                }
                arrow(ox, oy, cx(ax), cy(ay), 'rgba(49,130,206,0.4)', '', 2);
                arrow(ox, oy, cx(kax), cy(kay), kColor, 'ka', 3.2);

                /* 성분 분해 점선 (ka 기준) */
                ctx.save(); ctx.setLineDash([4, 3]);
                ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(cx(kax), cy(0)); ctx.lineTo(cx(kax), cy(kay));
                ctx.moveTo(cx(0), cy(kay)); ctx.lineTo(cx(kax), cy(kay));
                ctx.stroke(); ctx.setLineDash([]); ctx.restore();
            } else {
                dot(ctx, ox, oy, 7, '#718096', '#fff');
                ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#718096'; ctx.textAlign = 'left';
                ctx.fillText('0 (영벡터)', ox + 10, oy - 8);
            }

            /* a 레이블 별도 표시 */
            if (mA > 0.01) {
                const ang = Math.atan2(-ay, ax);
                drawVecLabel(ctx, 'a',
                    cx(ax / 2) - Math.sin(ang) * 18,
                    cy(ay / 2) + Math.cos(ang) * 18,
                    'rgba(49,130,206,0.7)');
            }

            document.getElementById('geom-vec-result').innerHTML =
                `<span style="color:#3182ce"><span class="vec-text">a</span></span> = (${ax.toFixed(1)}, ${ay.toFixed(1)}) &nbsp; |<span class="vec-text">a</span>| = ${mA.toFixed(2)}<br>
                 k = <b>${k.toFixed(1)}</b><br>
                 <span style="color:${kColor};">k<span class="vec-text">a</span></span> = (${kax.toFixed(2)}, ${kay.toFixed(2)})<br>
                 |k<span class="vec-text">a</span>| = <b>${mKA.toFixed(3)}</b> &nbsp;= |k|·|<span class="vec-text">a</span>|`;

            /* ── 단위벡터 ── */
        } else if (vecOp === 'unit') {
            const mA = Math.sqrt(ax * ax + ay * ay);
            arrow(ox, oy, cx(ax), cy(ay), '#3182ce', 'a', 2.8);

            if (mA > 0.01) {
                const ux = ax / mA, uy = ay / mA;

                /* 단위원 */
                ctx.save();
                ctx.beginPath(); ctx.arc(ox, oy, vp.scale, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(160,174,192,0.35)'; ctx.lineWidth = 1.2;
                ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
                ctx.restore();

                /* 단위벡터 â */
                arrow(ox, oy, cx(ux), cy(uy), '#ed8936', 'â', 2.8);

                /* 성분 분해 점선 */
                ctx.save(); ctx.setLineDash([4, 3]);
                ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(cx(ax), cy(0)); ctx.lineTo(cx(ax), cy(ay));
                ctx.moveTo(cx(0), cy(ay)); ctx.lineTo(cx(ax), cy(ay));
                ctx.stroke(); ctx.setLineDash([]); ctx.restore();

                /* 성분 수치 */
                ctx.font = '12px Outfit'; ctx.fillStyle = '#718096'; ctx.textAlign = 'center';
                if (Math.abs(ax) > 0.1)
                    ctx.fillText(`${ax.toFixed(1)}`, cx(ax / 2), cy(0) + (ay >= 0 ? 16 : -6));
                if (Math.abs(ay) > 0.1)
                    ctx.fillText(`${ay.toFixed(1)}`, cx(ax) + (ax >= 0 ? 18 : -18), cy(ay / 2));

                document.getElementById('geom-vec-result').innerHTML =
                    `<span style="color:#3182ce"><span class="vec-text">a</span></span> = (${ax.toFixed(1)}, ${ay.toFixed(1)})<br>
                     |<span class="vec-text">a</span>| = <b>${mA.toFixed(3)}</b><br>
                     <span style="color:#ed8936;">â (단위벡터)</span> = (${ux.toFixed(3)}, ${uy.toFixed(3)})<br>
                     |â| = <b>1.000</b> ✓`;
            } else {
                document.getElementById('geom-vec-result').innerHTML =
                    `<span style="color:#718096;"><span class="vec-text">a</span>가 영벡터입니다.<br>단위벡터가 존재하지 않습니다.</span>`;
            }

            /* ── 위치벡터 ── */
        } else if (vecOp === 'pos') {
            /* A = (ax, ay), B = (bx, by) 로 점 두 개 사용 */
            const Ax = ax, Ay = ay, Bx = bx, By = by;

            /* OA, OB 위치벡터 */
            arrow(ox, oy, cx(Ax), cy(Ay), '#3182ce', 'OA', 2.5);
            arrow(ox, oy, cx(Bx), cy(By), '#e53e3e', 'OB', 2.5);

            /* AB 벡터 (A에서 B로) */
            arrow(cx(Ax), cy(Ay), cx(Bx), cy(By), '#9f7aea', '', 3.0);

            /* 점 A, B 표시 */
            ctx.font = 'bold 14px Outfit';
            ctx.fillStyle = '#3182ce'; ctx.textAlign = 'left';
            ctx.fillText(`A(${Ax.toFixed(1)}, ${Ay.toFixed(1)})`, cx(Ax) + 10, cy(Ay) - 8);
            ctx.fillStyle = '#e53e3e';
            ctx.fillText(`B(${Bx.toFixed(1)}, ${By.toFixed(1)})`, cx(Bx) + 10, cy(By) - 8);

            /* 중점 M 및 AB 벡터 라벨을 선분 양쪽으로 분리하여 배치 */
            const Mx = (Ax + Bx) / 2, My = (Ay + By) / 2;
            dot(ctx, cx(Mx), cy(My), 6, '#38a169', '#fff');
            
            const ang = Math.atan2(cy(By) - cy(Ay), cx(Bx) - cx(Ax));
            
            // AB 라벨 (법선 방향 1)
            const abTx = cx(Mx) - Math.sin(ang) * 20;
            const abTy = cy(My) + Math.cos(ang) * 20;
            drawVecLabel(ctx, 'AB', abTx, abTy, '#9f7aea');
            
            // M 라벨 (법선 방향 2 - 반대편)
            const mTx = cx(Mx) + Math.sin(ang) * 20;
            const mTy = cy(My) - Math.cos(ang) * 20 + 5;
            ctx.fillStyle = '#38a169'; ctx.textAlign = 'center';
            ctx.fillText(`M(${Mx.toFixed(1)}, ${My.toFixed(1)})`, mTx, mTy);

            /* OM 점선 */
            ctx.save(); ctx.setLineDash([5, 4]);
            ctx.strokeStyle = 'rgba(56,161,105,0.5)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx(Mx), cy(My)); ctx.stroke();
            ctx.setLineDash([]); ctx.restore();

            const ABx = Bx - Ax, ABy = By - Ay;
            const mAB = Math.sqrt(ABx * ABx + ABy * ABy);
            document.getElementById('geom-vec-result').innerHTML =
                `A = (${Ax.toFixed(1)}, ${Ay.toFixed(1)}) &nbsp; <span style="color:#3182ce;">OA</span><br>
                 B = (${Bx.toFixed(1)}, ${By.toFixed(1)}) &nbsp; <span style="color:#e53e3e;">OB</span><br>
                 <span style="color:#9f7aea;"><span class="vec-text">AB</span></span> = OB − OA = (${ABx.toFixed(1)}, ${ABy.toFixed(1)})<br>
                 |<span class="vec-text">AB</span>| = <b>${mAB.toFixed(3)}</b><br>
                 <span style="color:#38a169;">중점 M</span> = (${Mx.toFixed(1)}, ${My.toFixed(1)})`;
        }

        ctx.restore();
    }

    function vecDragHandler(mx, my, isDown, isMove, isUp) {
        if (isDown) {
            const thresh = 22 / vecVP.scale;
            if (vecOp === 'scalar') {
                const kax = vecScalarK * vecPts.ax, kay = vecScalarK * vecPts.ay;
                if (Math.hypot(mx - kax, my - kay) < thresh) { vecDragId = 'ka'; return true; }
            }
            if (Math.hypot(mx - vecPts.ax, my - vecPts.ay) < thresh) { vecDragId = 'a'; return true; }
            if (Math.hypot(mx - vecPts.bx, my - vecPts.by) < thresh) { vecDragId = 'b'; return true; }
            return false;
        }
        if (isMove && vecDragId) {
            if (vecDragId === 'a') {
                vecPts.ax = Math.round(mx * 2) / 2; vecPts.ay = Math.round(my * 2) / 2;
                const slx = document.getElementById('geom-ax'), sly = document.getElementById('geom-ay');
                if (slx) { slx.value = vecPts.ax; document.getElementById('geom-ax-val').textContent = vecPts.ax.toFixed(1); }
                if (sly) { sly.value = vecPts.ay; document.getElementById('geom-ay-val').textContent = vecPts.ay.toFixed(1); }
            } else if (vecDragId === 'b') {
                vecPts.bx = Math.round(mx * 2) / 2; vecPts.by = Math.round(my * 2) / 2;
                const slx = document.getElementById('geom-bx'), sly = document.getElementById('geom-by');
                if (slx) { slx.value = vecPts.bx; document.getElementById('geom-bx-val').textContent = vecPts.bx.toFixed(1); }
                if (sly) { sly.value = vecPts.by; document.getElementById('geom-by-val').textContent = vecPts.by.toFixed(1); }
            } else if (vecDragId === 'ka') {
                const aSq = vecPts.ax * vecPts.ax + vecPts.ay * vecPts.ay;
                if (aSq > 0.001) {
                    let newK = (mx * vecPts.ax + my * vecPts.ay) / aSq;
                    newK = Math.max(-4, Math.min(4, Math.round(newK * 2) / 2));
                    vecScalarK = newK;
                    const ks = document.getElementById('geom-vec-k');
                    if (ks) { ks.value = newK; document.getElementById('geom-vec-k-val').textContent = newK.toFixed(1); }
                }
            }
            redrawVector(); return true;
        }
        if (isUp) { vecDragId = null; return false; }
        return false;
    }

    function initVectorSection() {
        const canvas = document.getElementById('geomVecCanvas');
        if (!canvas) return;
        canvas.width = VEC_CW; canvas.height = VEC_CH;

        document.querySelectorAll('.geom-vec-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.geom-vec-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                vecOp = btn.dataset.vec;
                redrawVector();
            });
        });

        ['ax', 'ay', 'bx', 'by'].forEach(id => {
            const sl = document.getElementById(`geom-${id}`);
            const sp = document.getElementById(`geom-${id}-val`);
            if (!sl) return;
            sl.addEventListener('input', () => {
                vecPts[id] = +sl.value;
                if (sp) sp.textContent = (+sl.value).toFixed(1);
                redrawVector();
            });
        });

        attachViewport(canvas, () => vecVP, vp => { vecVP = vp; }, redrawVector, vecDragHandler);

        const resetBtn = document.getElementById('geom-vec-reset');
        if (resetBtn) resetBtn.addEventListener('click', () => { vecVP = makeVP(VEC_CW, VEC_CH, 55); redrawVector(); });

        /* k 슬라이더 (실수배 탭) */
        const kSlider = document.getElementById('geom-vec-k');
        const kValEl = document.getElementById('geom-vec-k-val');
        if (kSlider) {
            kSlider.value = vecScalarK;
            kSlider.addEventListener('input', () => {
                vecScalarK = +kSlider.value;
                if (kValEl) kValEl.textContent = vecScalarK.toFixed(1);
                redrawVector();
            });
        }
    }

    /* ============================================================
       3. 공간도형
       ============================================================ */
    const SOLID_CW = 800, SOLID_CH = 520;
    let solidTopic = 'line-plane';
    let rotH = 30, rotV = 25;

    const SOLID_INFO = {
        'line-plane': `<b>직선과 평면의 위치 관계</b><br>
        ① 직선이 평면에 포함<br>② 직선과 평면이 한 점에서 교차<br>③ 직선이 평면에 평행<br><br>
        직선 ℓ ⊥ 평면 α 이면 ℓ은 α 위의 <b>모든 직선</b>에 수직`,
        'dihedral': `<b>이면각(二面角)의 정의</b><br>
        두 반평면이 공유하는 교선(능선) 위의 한 점에서<br>각 반평면에 수선을 그었을 때 이루는 각<br><br>
        · 범위: 0° ≤ θ ≤ 180°<br>
        <span style="color:#718096;font-size:12px;">수평 슬라이더로 이면각을 조절하세요</span>`
    };

    function proj3D(x, y, z, cx, cy) {
        const rh = rotH * Math.PI / 180, rv = rotV * Math.PI / 180;
        const x1 = x * Math.cos(rh) - z * Math.sin(rh), z1 = x * Math.sin(rh) + z * Math.cos(rh);
        const y2 = y * Math.cos(rv) - z1 * Math.sin(rv), z2 = y * Math.sin(rv) + z1 * Math.cos(rv);
        const f = 6 / (6 + z2 * 0.35);
        return { sx: cx + x1 * f * 68, sy: cy - y2 * f * 68 };
    }

    function redrawSolid() {
        const canvas = document.getElementById('geomSolidCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2 + 40;
        if (solidTopic === 'line-plane') drawLinePlane(ctx, cx, cy);
        else drawDihedral(ctx, cx, cy);
    }

    function drawLinePlane(ctx, cx, cy) {
        const p = (x, y, z) => proj3D(x, y, z, cx, cy);
        /* 평면 */
        const corners = [[-3.5, 0, -3], [3.5, 0, -3], [3.5, 0, 3], [-3.5, 0, 3]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(corners[0].sx, corners[0].sy);
        corners.forEach(c => ctx.lineTo(c.sx, c.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(99,179,237,0.15)'; ctx.fill();
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 1.8; ctx.stroke();
        const lp = p(3.8, 0, 3.3);
        ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#3182ce'; ctx.fillText('α', lp.sx, lp.sy);

        /* 격자선 */
        const gridLines = [[-2.5, 0, 0, 2.5, 0, 0], [0, 0, -2.5, 0, 0, 2.5], [-2, 0, -2, 2, 0, 2], [-2, 0, 2, 2, 0, -2]];
        ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(49,130,206,0.32)'; ctx.lineWidth = 1;
        gridLines.forEach(([x1, y1, z1, x2, y2, z2]) => {
            const f = p(x1, y1, z1), t = p(x2, y2, z2);
            ctx.beginPath(); ctx.moveTo(f.sx, f.sy); ctx.lineTo(t.sx, t.sy); ctx.stroke();
        });
        ctx.setLineDash([]);

        /* 수직선 */
        const bot = p(0, -2.8, 0), top = p(0, 2.8, 0), orig = p(0, 0, 0);
        ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3;
        ctx.moveTo(bot.sx, bot.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
        const ang = Math.atan2(top.sy - bot.sy, top.sx - bot.sx);
        ctx.save(); ctx.translate(top.sx, top.sy); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -5); ctx.lineTo(-13, 5); ctx.closePath();
        ctx.fillStyle = '#e53e3e'; ctx.fill(); ctx.restore();
        ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.fillText('ℓ', top.sx + 8, top.sy - 4);

        /* 직각 기호 */
        const dxp = p(0.35, 0, 0), dzp = p(0, 0, 0.35);
        ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1.8;
        ctx.moveTo(orig.sx + (dxp.sx - orig.sx), orig.sy + (dxp.sy - orig.sy));
        ctx.lineTo(orig.sx + (dxp.sx - orig.sx) + (dzp.sx - orig.sx), orig.sy + (dxp.sy - orig.sy) + (dzp.sy - orig.sy));
        ctx.lineTo(orig.sx + (dzp.sx - orig.sx), orig.sy + (dzp.sy - orig.sy)); ctx.stroke();

        ctx.font = '15px Outfit'; ctx.fillStyle = '#2d3748'; ctx.fillText('직선 ℓ ⊥ 평면 α', 18, 26);
        ctx.font = '13px Outfit'; ctx.fillStyle = '#718096'; ctx.fillText('슬라이더로 시점을 회전하세요', 18, 44);
    }

    function drawDihedral(ctx, cx, cy) {
        const angle = (rotH % 180) * Math.PI / 180;
        const p = (x, y, z) => proj3D(x, y, z, cx, cy);
        const cA = Math.cos(angle), sA = Math.sin(angle);

        const pl1 = [[-3, 0, 0], [3, 0, 0], [3, 2.8, 0], [-3, 2.8, 0]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(pl1[0].sx, pl1[0].sy);
        pl1.forEach(q => ctx.lineTo(q.sx, q.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(99,179,237,0.2)'; ctx.fill();
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 1.5; ctx.stroke();

        const pl2 = [[-3, 0, 0], [3, 0, 0], [3 * cA, 2.8 * cA, 2.8 * sA], [-3 * cA, 2.8 * cA, 2.8 * sA]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(pl2[0].sx, pl2[0].sy);
        pl2.forEach(q => ctx.lineTo(q.sx, q.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(154,230,180,0.28)'; ctx.fill();
        ctx.strokeStyle = '#38a169'; ctx.lineWidth = 1.5; ctx.stroke();

        const eA = p(-3, 0, 0), eB = p(3, 0, 0);
        ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 3;
        ctx.moveTo(eA.sx, eA.sy); ctx.lineTo(eB.sx, eB.sy); ctx.stroke();

        const o2d = p(0, 0, 0), v1 = p(0, 1, 0), v2 = p(0, cA, sA);
        const a1 = Math.atan2(v1.sy - o2d.sy, v1.sx - o2d.sx), a2 = Math.atan2(v2.sy - o2d.sy, v2.sx - o2d.sx);
        ctx.beginPath(); ctx.arc(o2d.sx, o2d.sy, 40, Math.min(a1, a2), Math.max(a1, a2));
        ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.font = 'bold 15px Outfit'; ctx.fillStyle = '#ed8936';
        ctx.fillText(`θ = ${Math.round(rotH % 180)}°`, o2d.sx + 48, o2d.sy + 6);

        const lp1 = p(3.3, 1.5, 0), lp2 = p(-3.3, cA * 1.4, sA * 1.4);
        ctx.font = 'italic bold 18px Outfit';
        ctx.fillStyle = '#3182ce'; ctx.fillText('α', lp1.sx, lp1.sy);
        ctx.fillStyle = '#38a169'; ctx.fillText('β', lp2.sx, lp2.sy);

        ctx.font = '15px Outfit'; ctx.fillStyle = '#2d3748'; ctx.fillText('이면각: 두 반평면 α, β가 이루는 각 θ', 18, 26);
        ctx.font = '13px Outfit'; ctx.fillStyle = '#718096'; ctx.fillText('수평 슬라이더로 이면각을 조절하세요', 18, 44);
    }

    function initSolidSection() {
        const canvas = document.getElementById('geomSolidCanvas');
        if (!canvas) return;
        canvas.width = SOLID_CW; canvas.height = SOLID_CH;

        document.querySelectorAll('.geom-solid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.geom-solid-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                solidTopic = btn.dataset.solid;
                const el = document.getElementById('geom-solid-info');
                if (el) el.innerHTML = SOLID_INFO[solidTopic] || '';
                redrawSolid();
            });
        });

        const slH = document.getElementById('geom-rot-h');
        const slV = document.getElementById('geom-rot-v');
        if (slH) slH.addEventListener('input', () => { rotH = +slH.value; redrawSolid(); });
        if (slV) slV.addEventListener('input', () => { rotV = +slV.value; redrawSolid(); });

        const el = document.getElementById('geom-solid-info');
        if (el) el.innerHTML = SOLID_INFO[solidTopic] || '';
    }

    /* ============================================================
       공개 API
       ============================================================ */
    window.initGeom = function () {
        initConicSection();
        initVectorSection();
        initSolidSection();
        window.geomSwitchPanel('conic');
    };

    window.geomSwitchPanel = function (panelId) {
        geomCurrentPanel = panelId;
        document.querySelectorAll('.geom-panel').forEach(p => p.style.display = 'none');
        const t = document.getElementById(`geom-${panelId}-container`);
        if (t) t.style.display = 'block';
        if (panelId === 'conic') setTimeout(redrawConic, 60);
        if (panelId === 'vector') setTimeout(redrawVector, 60);
        if (panelId === 'solid') setTimeout(redrawSolid, 60);
    };

})();