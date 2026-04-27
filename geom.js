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
        let touchDraggingPoint = false;
        canvas.addEventListener('touchstart', e => {
            lastT = e.touches;
            if (e.touches.length === 1) {
                const { px, py } = toCanvas(e.touches[0]);
                const vp = getVP();
                if (onDragPoint && onDragPoint(toMx(vp, px), toMy(vp, py), true, false, false)) {
                    touchDraggingPoint = true;
                }
            }
        }, { passive: false });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const r = CW / rect.width;
            const vp = getVP();

            if (touchDraggingPoint && e.touches.length === 1) {
                const { px, py } = toCanvas(e.touches[0]);
                if (onDragPoint) onDragPoint(toMx(vp, px), toMy(vp, py), false, true, false);
                return;
            }

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
        canvas.addEventListener('touchend', e => {
            if (touchDraggingPoint) {
                if (e.changedTouches.length > 0) {
                    const { px, py } = toCanvas(e.changedTouches[0]);
                    if (onDragPoint) onDragPoint(toMx(getVP(), px), toMy(getVP(), py), false, false, true);
                }
                touchDraggingPoint = false;
            }
            lastT = null;
        });
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
    let conicTanMode = 'point';
    let conicTanSlope = 1.0;

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

        const updateTanEq = (eqs) => {
            const eqDiv = document.getElementById('geom-conic-tangent-eq');
            if (!eqDiv) return;
            if (!showTanNorm) {
                eqDiv.innerHTML = '';
                return;
            }
            if (conicTanMode === 'slope' && eqs.length === 0) {
                eqDiv.innerHTML = '<span style="color:#e53e3e;">해당 기울기를 가진 접선이 존재하지 않습니다.</span>';
                return;
            }
            let text = `접선의 방정식:<br>` + eqs.join('<br>');
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

            let pts = [];
            let mVals = [];
            let eqs = [];
            if (conicTanMode === 'slope') {
                const m = conicTanSlope;
                if (Math.abs(m) < 0.05) {
                    // m이 0에 가까우면 접선 표시 안함 (포물선의 기울기 0 접선은 무한대)
                } else {
                    const px = p / (m * m);
                    const py = 2 * p / m;
                    pts.push({ x: px, y: py });
                    mVals.push(m);
                    const n = py - m * px;
                    const sign = n >= 0 ? '+' : '−';
                    eqs.push(`y = ${m.toFixed(2)}x ${sign} ${Math.abs(n).toFixed(2)}`);
                }
            } else {
                const P = projParabola(conicDragPt.tx, conicDragPt.ty, p);
                lastProjectedPt = P;
                pts.push(P);
                const mParabola = Math.abs(P.y) > 1e-5 ? (2 * p) / P.y : Infinity;
                mVals.push(mParabola);
                if (!isFinite(mParabola)) {
                    eqs.push(`x = ${P.x.toFixed(2)}`);
                } else {
                    const n = P.y - mParabola * P.x;
                    const sign = n >= 0 ? '+' : '−';
                    eqs.push(`y = ${mParabola.toFixed(2)}x ${sign} ${Math.abs(n).toFixed(2)}`);
                }
            }

            pts.forEach((P, idx) => {
                const m = mVals[idx];
                drawTanNorm(P.x, P.y, m);

                const sx = cx(P.x), sy = cy(P.y);
                const Hx = -p, sHx = cx(Hx), sHy = cy(P.y);
                const dPF = Math.sqrt((P.x - p) ** 2 + P.y ** 2);
                const dPH = Math.abs(P.x - Hx);

                drawSegWithLabel(ctx, sx, sy, cx(p), cy(0), '#2d3748', 2.2, idx === 0 ? `PF=${dPF.toFixed(2)}` : '');
                drawSegWithLabel(ctx, sx, sy, sHx, sHy, '#dd6b20', 2.5, idx === 0 ? `PH=${dPH.toFixed(2)}` : '');
                const sq = 9; ctx.strokeStyle = '#dd6b20'; ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sHx, sHy - sq); ctx.lineTo(sHx + sq, sHy - sq); ctx.lineTo(sHx + sq, sHy);
                ctx.stroke();
                dot(ctx, sHx, sHy, 5, '#dd6b20', '#fff');
                if (idx === 0) {
                    ctx.font = 'bold 12px Outfit'; ctx.fillStyle = '#dd6b20'; ctx.textAlign = 'left';
                    ctx.fillText('H', sHx + 6, sHy - 6);
                    drawInfoBadge(ctx, W, H, dPF, dPH, 'PF', 'PH', 'equal');
                }

                dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
                ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
                ctx.fillText(pts.length > 1 ? `P${idx + 1}` : 'P', sx + 10, sy - 6);
            });
            updateTanEq(eqs);

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

            let pts = [];
            let mVals = [];
            let eqs = [];
            if (conicTanMode === 'slope') {
                const m = conicTanSlope;
                const D = Math.sqrt(a * a * m * m + b * b);
                for (const sign of [1, -1]) {
                    const px = -sign * (a * a * m) / D;
                    const py = sign * (b * b) / D;
                    pts.push({ x: px, y: py });
                    mVals.push(m);
                    const n = py - m * px;
                    const signN = n >= 0 ? '+' : '−';
                    eqs.push(`y = ${m.toFixed(2)}x ${signN} ${Math.abs(n).toFixed(2)}`);
                }
            } else {
                const P = projEllipse(conicDragPt.tx, conicDragPt.ty, a, b);
                lastProjectedPt = P;
                pts.push(P);
                const mEllipse = Math.abs(P.y) > 1e-5 ? -(b * b * P.x) / (a * a * P.y) : Infinity;
                mVals.push(mEllipse);
                if (!isFinite(mEllipse)) {
                    eqs.push(`x = ${P.x.toFixed(2)}`);
                } else {
                    const n = P.y - mEllipse * P.x;
                    const sign = n >= 0 ? '+' : '−';
                    eqs.push(`y = ${mEllipse.toFixed(2)}x ${sign} ${Math.abs(n).toFixed(2)}`);
                }
            }

            pts.forEach((P, idx) => {
                const m = mVals[idx];
                drawTanNorm(P.x, P.y, m);

                const sx = cx(P.x), sy = cy(P.y);
                const dF1 = Math.sqrt((P.x + c) ** 2 + P.y ** 2), dF2 = Math.sqrt((P.x - c) ** 2 + P.y ** 2);
                drawSegWithLabel(ctx, sx, sy, cx(-c), cy(0), '#2d3748', 2.2, idx === 0 ? `PF₁=${dF1.toFixed(2)}` : '');
                drawSegWithLabel(ctx, sx, sy, cx(c), cy(0), '#dd6b20', 2.2, idx === 0 ? `PF₂=${dF2.toFixed(2)}` : '');
                if (idx === 0) drawInfoBadge(ctx, W, H, dF1, dF2, 'PF₁', 'PF₂', 'sum', 2 * a, '2a');
                dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
                ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
                ctx.fillText(pts.length > 1 ? `P${idx + 1}` : 'P', sx + 10, sy - 6);
            });
            updateTanEq(eqs);

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

            let pts = [];
            let mVals = [];
            let eqs = [];
            if (conicTanMode === 'slope') {
                const m = conicTanSlope;
                const D2 = a * a * m * m - b * b;
                if (D2 > 0) {
                    const D = Math.sqrt(D2);
                    for (const sign of [1, -1]) {
                        const px = -sign * (a * a * m) / D;
                        const py = -sign * (b * b) / D;
                        pts.push({ x: px, y: py });
                        mVals.push(m);
                        const n = py - m * px;
                        const signN = n >= 0 ? '+' : '−';
                        eqs.push(`y = ${m.toFixed(2)}x ${signN} ${Math.abs(n).toFixed(2)}`);
                    }
                }
            } else {
                const P = projHyperbola(conicDragPt.tx, conicDragPt.ty, a, b);
                lastProjectedPt = P;
                conicDragPt = { tx: P.x, ty: P.y };
                pts.push(P);
                const mHyperbola = Math.abs(P.y) > 1e-5 ? (b * b * P.x) / (a * a * P.y) : Infinity;
                mVals.push(mHyperbola);
                if (!isFinite(mHyperbola)) {
                    eqs.push(`x = ${P.x.toFixed(2)}`);
                } else {
                    const n = P.y - mHyperbola * P.x;
                    const sign = n >= 0 ? '+' : '−';
                    eqs.push(`y = ${mHyperbola.toFixed(2)}x ${sign} ${Math.abs(n).toFixed(2)}`);
                }
            }

            pts.forEach((P, idx) => {
                const m = mVals[idx];
                drawTanNorm(P.x, P.y, m);

                const sx = cx(P.x), sy = cy(P.y);
                const dF1 = Math.sqrt((P.x + c) ** 2 + P.y ** 2), dF2 = Math.sqrt((P.x - c) ** 2 + P.y ** 2);
                drawSegWithLabel(ctx, sx, sy, cx(-c), cy(0), '#2d3748', 2.2, idx === 0 ? `PF₁=${dF1.toFixed(2)}` : '');
                drawSegWithLabel(ctx, sx, sy, cx(c), cy(0), '#dd6b20', 2.2, idx === 0 ? `PF₂=${dF2.toFixed(2)}` : '');
                if (idx === 0) drawInfoBadge(ctx, W, H, dF1, dF2, 'PF₁', 'PF₂', 'diff', 2 * a, '2a');
                dot(ctx, sx, sy, 10, '#e53e3e', '#fff');
                ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'left';
                ctx.fillText(pts.length > 1 ? `P${idx + 1}` : 'P', sx + 10, sy - 6);
            });
            updateTanEq(eqs);
        }

        ctx.restore();
    }

    function conicDragHandler(mx, my, isDown, isMove, isUp) {
        if (conicTanMode === 'slope') return false;
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

        document.querySelectorAll('input[name="geom-conic-tan-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                conicTanMode = e.target.value;
                const slopeControls = document.getElementById('geom-conic-slope-controls');
                if (slopeControls) slopeControls.style.display = conicTanMode === 'slope' ? 'block' : 'none';
                redrawConic();
            });
        });

        const mSlider = document.getElementById('geom-conic-m-slider');
        const mVal = document.getElementById('geom-conic-m-val');
        if (mSlider) {
            mSlider.addEventListener('input', (e) => {
                conicTanSlope = parseFloat(e.target.value);
                if (mVal) mVal.textContent = conicTanSlope.toFixed(1);
                redrawConic();
            });
        }

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
    let rotH = 50, rotV = 70;

    const SOLID_INFO = {
        'line-plane': `<b>직선과 평면의 위치 관계</b><br>버튼으로 4가지 관계를 전환해 보세요.<br><br>① <b style="color:#3182ce;">포함</b> — 직선이 평면 위에 있음<br>② <b style="color:#38a169;">평행</b> — 만나지 않고 공유점 없음<br>③ <b style="color:#ed8936;">교차</b> — 한 점에서 만남<br>④ <b style="color:#e53e3e;">수직</b> — 교차 중 특수한 경우<br><br><span style="color:#718096;font-size:12px;">직선 ℓ ⊥ 평면 α 이면 α 위 모든 직선에 수직</span>`,
        'dihedral': `<b>이면각(二面角)의 정의</b><br>두 반평면이 공유하는 <b style="color:#e53e3e;">교선(능선)</b> 위의 한 점에서 각 반평면에 <b>수직인 단면</b>이 이루는 각<br><br>· 범위: 0° ≤ θ ≤ 180°<br>· <b style="color:#9f7aea;">보라색 단면</b>이 이면각을 정의하는 수직단면<br><br><span style="color:#718096;font-size:12px;">수평 슬라이더로 이면각을 조절하세요</span>`,
        'three-perp': `<b>삼수선의 정리 (제1수선)</b><br>평면 밖의 점 P에서 평면 α에 내린 수선의 발을 H라 하고,<br>점 H에서 평면 위의 직선 ℓ에 내린 수선의 발을 K라 할 때,<br>선분 PK는 직선 ℓ과 수직이다.<br><br><span style="color:#e53e3e;">Step 1: PH ⊥ α</span>, <span style="color:#3182ce;">Step 2: HK ⊥ ℓ</span> 이면<br>자동으로 <span style="color:#38a169;">PK ⊥ ℓ</span> 이 성립합니다.`,
        'orth-proj': `<b>정사영(正射影)</b><br>도형을 평면에 수직으로 투영한 그림자<br><br>· 원래 넓이 S, 기울기 θ이면<br>&nbsp;&nbsp;<b style="color:#e53e3e;">S' = S · cosθ</b><br><br>· θ = 0° → S' = S (평행, 변화 없음)<br>· θ = 90° → S' = 0 (수직, 선분으로 보임)<br><br><span style="color:#718096;font-size:12px;">슬라이더로 기울기 θ를 조절하세요</span>`,
        'space-coord': `<b>공간좌표계</b><br><b>직교좌표</b> (x, y, z)<br>&nbsp;x, y, z 슬라이더로 점을 이동<br><br><b>구면좌표</b> (r, θ, φ)<br>&nbsp;r: 원점까지의 거리<br>&nbsp;θ: xy평면으로부터의 위도각 (0°~90°)<br>&nbsp;φ: x축으로부터의 경도각 (0°~360°)<br><br><b style="color:#e53e3e;">x = r·cosθ·cosφ</b><br><b style="color:#38a169;">y = r·cosθ·sinφ</b><br><b style="color:#3182ce;">z = r·sinθ</b>`
    };

    function proj3D(x, y, z, cx, cy) {
        const rh = rotH * Math.PI / 180, rv = rotV * Math.PI / 180;
        const x1 = x * Math.cos(rh) - z * Math.sin(rh), z1 = x * Math.sin(rh) + z * Math.cos(rh);
        const y2 = y * Math.cos(rv) - z1 * Math.sin(rv), z2 = y * Math.sin(rv) + z1 * Math.cos(rv);
        const f = 6 / (6 + z2 * 0.35);
        return { sx: cx + x1 * f * 68, sy: cy + y2 * f * 68 };
    }

    function redrawSolid() {
        const c2d = document.getElementById('geomSolidCanvas');
        const c3d = document.getElementById('threePerpCanvas');
        const cCtrl = document.getElementById('geom-three-perp-controls');
        if (!c2d || !c3d) return;

        const cSc = document.getElementById('spaceCoordCanvas');
        const cLP = document.getElementById('geom-line-plane-controls');
        const cOrth = document.getElementById('geom-orth-controls');

        // 보조 컨트롤 패널 표시 제어
        if (cCtrl) cCtrl.style.display = solidTopic === 'three-perp' ? 'block' : 'none';
        if (cLP) cLP.style.display = solidTopic === 'line-plane' ? 'block' : 'none';
        if (cOrth) cOrth.style.display = solidTopic === 'orth-proj' ? 'block' : 'none';

        if (solidTopic === 'three-perp') {
            c2d.style.display = 'none';
            c3d.style.display = 'block';
            if (cSc) cSc.style.display = 'none';
            initThreePerp();
            buildThreePerpScene();
        } else if (solidTopic === 'space-coord') {
            c2d.style.display = 'none';
            c3d.style.display = 'none';
            if (cSc) cSc.style.display = 'block';
            initSpaceCoord();
        } else {
            c2d.style.display = 'block';
            c3d.style.display = 'none';
            if (cSc) cSc.style.display = 'none';

            const ctx = c2d.getContext('2d');
            const W = c2d.width, H = c2d.height;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
            const cx = W / 2, cy = H / 2 + 40;
            if (solidTopic === 'line-plane') drawLinePlane(ctx, cx, cy);
            else if (solidTopic === 'dihedral') drawDihedral(ctx, cx, cy);
            else if (solidTopic === 'orth-proj') drawOrthProj(ctx, W, H);
        }
    }

    /* 직선과 평면 4가지 관계 */
    let linePlaneMode = 'perp'; // contain | parallel | intersect | perp

    function drawLinePlane(ctx, cx, cy) {
        const p = (x, y, z) => proj3D(x, y, z, cx, cy);

        // 평면 그리기
        const corners = [[-3.5, 0, -3], [3.5, 0, -3], [3.5, 0, 3], [-3.5, 0, 3]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(corners[0].sx, corners[0].sy);
        corners.forEach(c => ctx.lineTo(c.sx, c.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(99,179,237,0.15)'; ctx.fill();
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 1.8; ctx.stroke();
        const lp = p(3.8, 0, 3.3);
        ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#3182ce'; ctx.fillText('α', lp.sx, lp.sy);

        // 격자선
        ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(49,130,206,0.25)'; ctx.lineWidth = 1;
        [[-2.5, 0, 0, 2.5, 0, 0], [0, 0, -2.5, 0, 0, 2.5]].forEach(([x1, y1, z1, x2, y2, z2]) => {
            const f = p(x1, y1, z1), t = p(x2, y2, z2);
            ctx.beginPath(); ctx.moveTo(f.sx, f.sy); ctx.lineTo(t.sx, t.sy); ctx.stroke();
        }); ctx.setLineDash([]);

        const mode = linePlaneMode;
        ctx.lineWidth = 3;

        if (mode === 'contain') {
            // ① 포함: 직선이 평면 위에 있음
            const a = p(-3, 0, -1.5), b = p(3, 0, 1.5);
            ctx.beginPath(); ctx.strokeStyle = '#3182ce'; ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
            // 화살표
            const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
            ctx.save(); ctx.translate(b.sx, b.sy); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -5); ctx.lineTo(-13, 5); ctx.closePath();
            ctx.fillStyle = '#3182ce'; ctx.fill(); ctx.restore();
            ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#3182ce'; ctx.fillText('ℓ', b.sx + 8, b.sy - 4);
            ctx.font = '15px Outfit'; ctx.fillStyle = '#3182ce';
            ctx.fillText('ℓ ⊂ α  (직선이 평면에 포함)', 18, 26);

        } else if (mode === 'parallel') {
            // ② 평행: 평면 위로 떠있는 직선
            const a = p(-3, 1.8, -1), b = p(3, 1.8, 1);
            ctx.beginPath(); ctx.strokeStyle = '#38a169'; ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
            const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
            ctx.save(); ctx.translate(b.sx, b.sy); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -5); ctx.lineTo(-13, 5); ctx.closePath();
            ctx.fillStyle = '#38a169'; ctx.fill(); ctx.restore();
            ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#38a169'; ctx.fillText('ℓ', b.sx + 8, b.sy - 4);
            // 수직 거리 표시 점선
            const mid = p(0, 0, 0), mid2 = p(0, 1.8, 0);
            ctx.setLineDash([5, 4]); ctx.strokeStyle = '#a0aec0'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(mid.sx, mid.sy); ctx.lineTo(mid2.sx, mid2.sy); ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '15px Outfit'; ctx.fillStyle = '#38a169';
            ctx.fillText('ℓ ∥ α  (직선과 평면이 평행)', 18, 26);

        } else if (mode === 'intersect') {
            // ③ 교차: 사선으로 평면 관통
            const a = p(-2, 2.5, -1), b = p(2, -2, -1);
            const t = 2.5 / 4.5;
            const meet = p(-2 + 4 * t, 0, -1);
            ctx.beginPath(); ctx.strokeStyle = '#ed8936'; ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
            ctx.beginPath(); ctx.fillStyle = '#ed8936'; ctx.arc(meet.sx, meet.sy, 6, 0, Math.PI * 2); ctx.fill();
            ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#ed8936'; ctx.fillText('ℓ', a.sx - 18, a.sy);
            ctx.font = '13px Outfit'; ctx.fillStyle = '#ed8936'; ctx.fillText('교점 P', meet.sx + 10, meet.sy - 8);
            ctx.font = '15px Outfit'; ctx.fillStyle = '#ed8936';
            ctx.fillText('ℓ ∩ α = {P}  (한 점에서 교차)', 18, 26);

        } else {
            // ④ 수직: 기존 코드
            const bot = p(0, -2.8, 0), top = p(0, 2.8, 0), orig = p(0, 0, 0);
            ctx.beginPath(); ctx.strokeStyle = '#e53e3e';
            ctx.moveTo(bot.sx, bot.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
            const ang = Math.atan2(top.sy - bot.sy, top.sx - bot.sx);
            ctx.save(); ctx.translate(top.sx, top.sy); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, -5); ctx.lineTo(-13, 5); ctx.closePath();
            ctx.fillStyle = '#e53e3e'; ctx.fill(); ctx.restore();
            ctx.font = 'italic bold 20px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.fillText('ℓ', top.sx + 8, top.sy - 4);
            // 직각 기호
            const sq = 0.4;
            const px = p(sq, 0, 0);
            const py = p(0, sq, 0);
            const pc = p(sq, sq, 0);
            ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2;
            ctx.moveTo(px.sx, px.sy);
            ctx.lineTo(pc.sx, pc.sy);
            ctx.lineTo(py.sx, py.sy);
            ctx.stroke();
            ctx.font = '15px Outfit'; ctx.fillStyle = '#e53e3e';
            ctx.fillText('ℓ ⊥ α  (직선이 평면에 수직)', 18, 26);
        }

        // 관계 선택 버튼 (캔버스 내부 하단)
        const modes2 = [{ k: 'contain', l: '① 포함', c: '#3182ce' }, { k: 'parallel', l: '② 평행', c: '#38a169' },
        { k: 'intersect', l: '③ 교차', c: '#ed8936' }, { k: 'perp', l: '④ 수직', c: '#e53e3e' }];
        // 버튼 영역은 HTML에서 처리 (geom-solid-info 아래)
    }


    function drawDihedral(ctx, cx, cy) {
        const angle = Math.max(5, Math.min(175, rotH % 180)) * Math.PI / 180;
        const p = (x, y, z) => proj3D(x, y, z, cx, cy);
        const cA = Math.cos(angle), sA = Math.sin(angle);

        // 평면 α (수평)
        const pl1 = [[-3, 0, 0], [3, 0, 0], [3, 2.8, 0], [-3, 2.8, 0]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(pl1[0].sx, pl1[0].sy);
        pl1.forEach(q => ctx.lineTo(q.sx, q.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(99,179,237,0.22)'; ctx.fill();
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 1.5; ctx.stroke();

        // 평면 β (회전)
        const pl2 = [[-3, 0, 0], [3, 0, 0], [3 * cA, 2.8 * cA, 2.8 * sA], [-3 * cA, 2.8 * cA, 2.8 * sA]].map(([x, y, z]) => p(x, y, z));
        ctx.beginPath(); ctx.moveTo(pl2[0].sx, pl2[0].sy);
        pl2.forEach(q => ctx.lineTo(q.sx, q.sy)); ctx.closePath();
        ctx.fillStyle = 'rgba(154,230,180,0.28)'; ctx.fill();
        ctx.strokeStyle = '#38a169'; ctx.lineWidth = 1.5; ctx.stroke();

        // 능선 (교선) — 굵고 빨갛게
        const eA = p(-3, 0, 0), eB = p(3, 0, 0);
        ctx.beginPath(); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 4;
        ctx.moveTo(eA.sx, eA.sy); ctx.lineTo(eB.sx, eB.sy); ctx.stroke();
        ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#e53e3e';
        ctx.fillText('교선(능선)', eA.sx - 8, eA.sy - 10);

        // 수직 단면 (이면각을 정의하는 핵심) — 보라색 삼각형
        const o = p(0, 0, 0), v1 = p(0, 1.8, 0), v2 = p(0, 1.8 * cA, 1.8 * sA);
        ctx.beginPath();
        ctx.moveTo(o.sx, o.sy); ctx.lineTo(v1.sx, v1.sy); ctx.lineTo(v2.sx, v2.sy); ctx.closePath();
        ctx.fillStyle = 'rgba(159,122,234,0.30)'; ctx.fill();
        ctx.strokeStyle = '#9f7aea'; ctx.lineWidth = 2; ctx.stroke();
        // 수직단면 라벨
        ctx.font = 'bold 12px Outfit'; ctx.fillStyle = '#9f7aea';
        const midV = { sx: (v1.sx + v2.sx) / 2 + 8, sy: (v1.sy + v2.sy) / 2 };
        ctx.fillText('수직단면', midV.sx, midV.sy);

        // 이면각 호
        const o2d = p(0, 0, 0), a1pt = p(0, 1, 0), a2pt = p(0, cA, sA);
        const a1 = Math.atan2(a1pt.sy - o2d.sy, a1pt.sx - o2d.sx);
        const a2 = Math.atan2(a2pt.sy - o2d.sy, a2pt.sx - o2d.sx);
        const aMin = Math.min(a1, a2), aMax = Math.max(a1, a2);
        ctx.beginPath(); ctx.arc(o2d.sx, o2d.sy, 44, aMin, aMax);
        ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 3; ctx.stroke();

        // 각도 수치 표시
        const angDeg = Math.round(rotH % 180);
        const midAng = (a1 + a2) / 2;
        ctx.font = 'bold 16px Outfit'; ctx.fillStyle = '#ed8936';
        ctx.fillText(`θ = ${angDeg}°`, o2d.sx + Math.cos(midAng) * 58, o2d.sy + Math.sin(midAng) * 58);

        // 직각 표시 (v1, v2 → 능선 수직)
        [v1, v2].forEach(vpt => {
            const dir = { sx: o2d.sx - vpt.sx, sy: o2d.sy - vpt.sy };
            const len = Math.sqrt(dir.sx * dir.sx + dir.sy * dir.sy) || 1;
            const ndir = { sx: dir.sx / len * 14, sy: dir.sy / len * 14 };
            const perp = { sx: -ndir.sy, sy: ndir.sx };
            ctx.beginPath(); ctx.strokeStyle = '#9f7aea'; ctx.lineWidth = 1.5;
            ctx.moveTo(vpt.sx + ndir.sx, vpt.sy + ndir.sy);
            ctx.lineTo(vpt.sx + ndir.sx + perp.sx, vpt.sy + ndir.sy + perp.sy);
            ctx.lineTo(vpt.sx + perp.sx, vpt.sy + perp.sy); ctx.stroke();
        });

        // 평면 레이블
        ctx.font = 'italic bold 18px Outfit';
        const lp1 = p(3.2, 1.5, 0), lp2 = p(-3.2 * cA, 1.4 * cA, 1.4 * sA);
        ctx.fillStyle = '#3182ce'; ctx.fillText('α', lp1.sx, lp1.sy);
        ctx.fillStyle = '#38a169'; ctx.fillText('β', lp2.sx, lp2.sy);

        ctx.font = '14px Outfit'; ctx.fillStyle = '#2d3748';
        ctx.fillText('슬라이더로 이면각 θ를 조절하세요', 18, 26);
    }


    function initThreePerp() {
        if (tpInitDone) return;
        const canvas = document.getElementById('threePerpCanvas');
        if (!canvas || typeof THREE === 'undefined') return;

        tpScene = new THREE.Scene();
        tpScene.background = new THREE.Color(0xf8fafc);

        tpCamera = new THREE.PerspectiveCamera(45, 800 / 520, 0.1, 1000);
        tpCamera.position.set(16, 12, 18);

        tpRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        tpRenderer.setSize(800, 520, false);
        tpRenderer.setPixelRatio(window.devicePixelRatio);

        if (typeof THREE.OrbitControls !== 'undefined') {
            tpControls = new THREE.OrbitControls(tpCamera, tpRenderer.domElement);
            tpControls.enableDamping = true;
            tpControls.dampingFactor = 0.05;
            tpControls.target.set(0, 2, 0);
        }

        tpScene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dl1 = new THREE.DirectionalLight(0xffffff, 0.5);
        dl1.position.set(10, 20, 10);
        tpScene.add(dl1);

        tpScene.add(tpGroup);

        tpInitDone = true;
        animateThreePerp();
    }

    function createThickLine(p1, p2, color, thickness = 0.06) {
        const dist = p1.distanceTo(p2);
        const geo = new THREE.CylinderGeometry(thickness, thickness, dist, 8);
        const mat = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(p1).lerp(p2, 0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        return mesh;
    }

    function createLabelSprite(text, colorStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 36px Outfit';
        ctx.fillStyle = colorStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(2.5, 1.25, 1);
        sprite.renderOrder = 999;
        return sprite;
    }

    function buildThreePerpScene() {
        tpGroup.clear();

        // 1. 평면 α
        const grid = new THREE.GridHelper(20, 20, 0xa0aec0, 0xe2e8f0);
        tpGroup.add(grid);

        const planeGeo = new THREE.PlaneGeometry(20, 20);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x90cdf4, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.rotation.x = -Math.PI / 2;
        tpGroup.add(planeMesh);

        const alphaLabel = createLabelSprite('α', '#3182ce');
        alphaLabel.position.set(8, 0, 8);
        tpGroup.add(alphaLabel);

        // 점 좌표 설정
        const P = new THREE.Vector3(0, 6, 0);
        const H = new THREE.Vector3(0, 0, 0);
        const K = new THREE.Vector3(0, 0, 5); // y축(높이)=0, x축=0, z축=5 -> l선상

        // 2. 직선 l (평면 위, z=5, x축과 평행)
        const L_START = new THREE.Vector3(-10, 0, 5);
        const L_END = new THREE.Vector3(10, 0, 5);
        tpGroup.add(createThickLine(L_START, L_END, 0x2d3748, 0.05));

        const lLabel = createLabelSprite('ℓ', '#2d3748');
        lLabel.position.set(9, 0.5, 5);
        tpGroup.add(lLabel);

        // 3. 점 렌더링
        const ptGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const pMesh = new THREE.Mesh(ptGeo, new THREE.MeshPhongMaterial({ color: 0x1a202c })); pMesh.position.copy(P); tpGroup.add(pMesh);
        const hMesh = new THREE.Mesh(ptGeo, new THREE.MeshPhongMaterial({ color: 0x1a202c })); hMesh.position.copy(H); tpGroup.add(hMesh);
        const kMesh = new THREE.Mesh(ptGeo, new THREE.MeshPhongMaterial({ color: 0x1a202c })); kMesh.position.copy(K); tpGroup.add(kMesh);

        const labelP = createLabelSprite('P', '#1a202c'); labelP.position.copy(P).add(new THREE.Vector3(0, 0.6, 0)); tpGroup.add(labelP);
        const labelH = createLabelSprite('H', '#1a202c'); labelH.position.copy(H).add(new THREE.Vector3(-0.4, 0, -0.4)); tpGroup.add(labelH);
        const labelK = createLabelSprite('K', '#1a202c'); labelK.position.copy(K).add(new THREE.Vector3(-0.4, 0, 0.4)); tpGroup.add(labelK);

        // 직각 기호 그리기 헬퍼
        function drawRightAngle(origin, dir1, dir2, color) {
            const size = 0.6;
            const d1 = dir1.clone().normalize().multiplyScalar(size);
            const d2 = dir2.clone().normalize().multiplyScalar(size);
            const pt1 = origin.clone().add(d1);
            const pt2 = pt1.clone().add(d2);
            const pt3 = origin.clone().add(d2);

            const arr = [pt1, pt2, pt2, pt3];
            const g = new THREE.BufferGeometry().setFromPoints(arr);
            const m = new THREE.LineBasicMaterial({ color: color });
            tpGroup.add(new THREE.LineSegments(g, m));

            // 채우기
            const gFill = new THREE.BufferGeometry().setFromPoints([origin, pt1, pt2, pt3]);
            gFill.setIndex([0, 1, 2, 0, 2, 3]);
            const mFill = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
            tpGroup.add(new THREE.Mesh(gFill, mFill));
        }

        // Step 1: PH ⊥ α
        if (tpStep1) {
            tpGroup.add(createThickLine(P, H, 0xe53e3e, 0.04));
            // H에서 직각 기호 (x축, z축 방향)
            drawRightAngle(H, new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), 0xe53e3e);
            drawRightAngle(H, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), 0xe53e3e);
        }

        // Step 2: HK ⊥ l
        if (tpStep2) {
            tpGroup.add(createThickLine(H, K, 0x3182ce, 0.04));
            // K에서 직각 기호 (HK 방향과 l방향)
            drawRightAngle(K, new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), 0x3182ce);
        }

        // Auto Complete: PK ⊥ l
        if (tpStep1 && tpStep2) {
            tpGroup.add(createThickLine(P, K, 0x38a169, 0.05));
            // K에서 PK 방향과 l방향 직각
            const dirPK = new THREE.Vector3().subVectors(P, K);
            drawRightAngle(K, dirPK, new THREE.Vector3(1, 0, 0), 0x38a169);
        }
    }

    function animateThreePerp() {
        requestAnimationFrame(animateThreePerp);
        if (solidTopic !== 'three-perp') return;
        if (tpControls) tpControls.update();
        if (tpRenderer && tpScene && tpCamera) {
            tpRenderer.render(tpScene, tpCamera);
        }
    }

    /* ============================================================
       정사영 (Orthographic Projection)
       ============================================================ */
    let orthAngle = 45; // 기울기 각도 (도)

    function drawOrthProj(ctx, W, H) {
        const theta = orthAngle * Math.PI / 180;
        const cosT = Math.cos(theta);

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

        const PAD = 60;
        const midX = W / 2, baseY = H - PAD - 60;

        // ── 원래 도형 (직사각형, 기울어진 평면 위) ──
        const W0 = 180, H0 = 120;
        // 기울어진 평면: 사다리꼴로 표현 (원근)
        const skew = H0 * Math.sin(theta) * 0.4; // 측면 기울기
        const topH = H0 * cosT;

        const ox = midX - 260, oy = baseY - topH - 40;

        // 기울어진 사각형 (평행사변형으로 표현)
        ctx.beginPath();
        ctx.moveTo(ox, oy + topH);           // 좌하
        ctx.lineTo(ox + W0, oy + topH);      // 우하
        ctx.lineTo(ox + W0, oy);             // 우상
        ctx.lineTo(ox, oy);                  // 좌상
        ctx.closePath();
        ctx.fillStyle = 'rgba(49,130,206,0.18)'; ctx.fill();
        ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 2; ctx.stroke();

        // 넓이 S 레이블
        ctx.font = 'bold 15px Outfit'; ctx.fillStyle = '#3182ce'; ctx.textAlign = 'center';
        ctx.fillText('S (원래 넓이)', ox + W0 / 2, oy + topH / 2 + 5);

        // θ 각도 표시
        const bx = ox + W0 / 2, by = baseY;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#a0aec0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx, oy + topH); ctx.lineTo(bx, by); ctx.stroke();
        ctx.setLineDash([]);

        // 기울기 호
        const arcR = 36;
        ctx.beginPath(); ctx.arc(bx, oy + topH, arcR, Math.PI / 2, Math.PI / 2 - theta, theta < 0.01);
        ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = 'bold 14px Outfit'; ctx.fillStyle = '#ed8936'; ctx.textAlign = 'left';
        ctx.fillText(`θ=${orthAngle}°`, bx + arcR + 6, oy + topH + 8);

        // ── 투영선 (점선) ──
        const projW = W0; // 폭은 동일
        const projH = H0 * cosT; // 높이는 cosθ 배

        const px = midX + 60, py = baseY - projH;

        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#a0aec0'; ctx.lineWidth = 1;
        // 네 꼭짓점 투영선
        [[ox, oy], [ox + W0, oy], [ox, oy + topH], [ox + W0, oy + topH]].forEach(([fx, fy], i) => {
            const tx = px + (i % 2 === 0 ? 0 : projW);
            const ty = i < 2 ? py : py + projH;
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
        });
        ctx.setLineDash([]);

        // ── 정사영 도형 ──
        ctx.beginPath();
        ctx.moveTo(px, py + projH);
        ctx.lineTo(px + projW, py + projH);
        ctx.lineTo(px + projW, py);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fillStyle = 'rgba(229,62,62,0.20)'; ctx.fill();
        ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5; ctx.stroke();

        // S' 레이블
        const sVal = (W0 / 60 * H0 / 60 * cosT).toFixed(3);
        ctx.font = 'bold 15px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'center';
        ctx.fillText(`S' (정사영)`, px + projW / 2, py + projH / 2 + 5);

        // ── 수평 기준 평면 ──
        ctx.strokeStyle = '#718096'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD, baseY); ctx.lineTo(W - PAD, baseY); ctx.stroke();
        ctx.font = '12px Outfit'; ctx.fillStyle = '#718096'; ctx.textAlign = 'right';
        ctx.fillText('기준 평면 α', W - PAD - 4, baseY - 6);

        // ── 공식 박스 ──
        ctx.fillStyle = 'rgba(229,62,62,0.08)';
        ctx.beginPath();
        const bw = 260, bh = 52, bLeft = W / 2 - bw / 2, bTop = H - 50;
        ctx.roundRect(bLeft, bTop, bw, bh, 10); ctx.fill();
        ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 18px Outfit'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'center';
        ctx.fillText(`S' = S·cos${orthAngle}° = S × ${cosT.toFixed(3)}`, W / 2, bTop + 32);

        ctx.textAlign = 'left';
    }

    /* ============================================================
       공간좌표 + 구면좌표계
       ============================================================ */
    let scInitDone = false;
    let scX = 2, scY = 2, scZ = 2;
    let scMode = 'cartesian'; // 'cartesian' | 'spherical'
    let scRotH = 30, scRotV = 25;
    let scDragging = false, scLastMX = 0, scLastMY = 0;

    function initSpaceCoord() {
        const canvas = document.getElementById('spaceCoordCanvas');
        if (!canvas) return;

        if (!scInitDone) {
            scInitDone = true;

            // 마우스 드래그로 회전
            canvas.addEventListener('mousedown', e => { scDragging = true; scLastMX = e.clientX; scLastMY = e.clientY; });
            canvas.addEventListener('mousemove', e => {
                if (!scDragging) return;
                scRotH += (e.clientX - scLastMX) * 0.5;
                scRotV -= (e.clientY - scLastMY) * 0.5;
                scRotV = Math.max(-80, Math.min(80, scRotV));
                scLastMX = e.clientX; scLastMY = e.clientY;
                drawSpaceCoord();
            });
            canvas.addEventListener('mouseup', () => { scDragging = false; });
            canvas.addEventListener('mouseleave', () => { scDragging = false; });

            // 슬라이더 동적 생성 — geom-solid-info 영역 아래에 삽입
            const infoEl = document.getElementById('geom-solid-info');
            if (infoEl && !document.getElementById('sc-controls')) {
                const ctrl = document.createElement('div');
                ctrl.id = 'sc-controls';
                ctrl.style.cssText = 'margin-top:14px;';
                ctrl.innerHTML = `
                <div style="margin-bottom:10px;">
                    <button id="sc-btn-cart" onclick="window.scSetMode('cartesian')"
                        style="padding:6px 12px;font-weight:800;font-size:13px;border-radius:8px;border:2px solid #3182ce;background:#3182ce;color:white;cursor:pointer;margin-right:6px;">직교좌표</button>
                    <button id="sc-btn-sph" onclick="window.scSetMode('spherical')"
                        style="padding:6px 12px;font-weight:800;font-size:13px;border-radius:8px;border:2px solid #a0aec0;background:white;color:#4a5568;cursor:pointer;">구면좌표</button>
                </div>
                <div id="sc-cart-sliders">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:16px;font-weight:800;color:#e53e3e;">x</span>
                        <input type="range" id="sc-x" min="-4" max="4" step="0.5" value="2" style="flex:1;">
                        <span id="sc-x-val" style="width:28px;font-weight:700;">2</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:16px;font-weight:800;color:#38a169;">y</span>
                        <input type="range" id="sc-y" min="-4" max="4" step="0.5" value="2" style="flex:1;">
                        <span id="sc-y-val" style="width:28px;font-weight:700;">2</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="width:16px;font-weight:800;color:#3182ce;">z</span>
                        <input type="range" id="sc-z" min="-4" max="4" step="0.5" value="2" style="flex:1;">
                        <span id="sc-z-val" style="width:28px;font-weight:700;">2</span>
                    </div>
                </div>
                <div id="sc-sph-sliders" style="display:none;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:16px;font-weight:800;color:#805ad5;">r</span>
                        <input type="range" id="sc-r" min="0.5" max="5" step="0.5" value="3.46" style="flex:1;">
                        <span id="sc-r-val" style="width:36px;font-weight:700;">3.46</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:16px;font-weight:800;color:#ed8936;">θ</span>
                        <input type="range" id="sc-theta" min="0" max="90" step="5" value="35" style="flex:1;">
                        <span id="sc-theta-val" style="width:36px;font-weight:700;">35°</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="width:16px;font-weight:800;color:#3182ce;">φ</span>
                        <input type="range" id="sc-phi" min="0" max="360" step="5" value="45" style="flex:1;">
                        <span id="sc-phi-val" style="width:36px;font-weight:700;">45°</span>
                    </div>
                </div>
                <div id="sc-coord-display" style="margin-top:12px;padding:10px;background:#f7fafc;border-radius:8px;font-size:13px;font-weight:700;line-height:2;"></div>
                <div style="margin-top:8px;font-size:12px;color:#718096;">🖱 캔버스를 드래그해서 시점 회전</div>`;
                infoEl.after(ctrl);

                // 이벤트 연결
                ['sc-x', 'sc-y', 'sc-z'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('input', () => {
                        scX = +document.getElementById('sc-x').value;
                        scY = +document.getElementById('sc-y').value;
                        scZ = +document.getElementById('sc-z').value;
                        document.getElementById('sc-x-val').textContent = scX;
                        document.getElementById('sc-y-val').textContent = scY;
                        document.getElementById('sc-z-val').textContent = scZ;
                        drawSpaceCoord();
                    });
                });
                ['sc-r', 'sc-theta', 'sc-phi'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('input', scUpdateFromSpherical);
                });
            }
        }
        drawSpaceCoord();
    }

    window.scSetMode = function (mode) {
        scMode = mode;
        document.getElementById('sc-cart-sliders').style.display = mode === 'cartesian' ? 'block' : 'none';
        document.getElementById('sc-sph-sliders').style.display = mode === 'spherical' ? 'block' : 'none';
        document.getElementById('sc-btn-cart').style.background = mode === 'cartesian' ? '#3182ce' : 'white';
        document.getElementById('sc-btn-cart').style.color = mode === 'cartesian' ? 'white' : '#4a5568';
        document.getElementById('sc-btn-sph').style.background = mode === 'spherical' ? '#805ad5' : 'white';
        document.getElementById('sc-btn-sph').style.color = mode === 'spherical' ? 'white' : '#4a5568';
        document.getElementById('sc-btn-sph').style.borderColor = mode === 'spherical' ? '#805ad5' : '#a0aec0';

        if (mode === 'spherical') {
            // 현재 직교좌표 → 구면좌표 변환해서 슬라이더 초기화
            const r = Math.sqrt(scX * scX + scY * scY + scZ * scZ);
            const theta = r > 0 ? Math.asin(scZ / r) * 180 / Math.PI : 0;
            const phi = Math.atan2(scY, scX) * 180 / Math.PI;
            const rEl = document.getElementById('sc-r'), tEl = document.getElementById('sc-theta'), pEl = document.getElementById('sc-phi');
            if (rEl) rEl.value = r.toFixed(2);
            if (tEl) tEl.value = Math.max(0, Math.min(90, Math.round(theta)));
            if (pEl) pEl.value = ((Math.round(phi) + 360) % 360);
            document.getElementById('sc-r-val').textContent = r.toFixed(2);
            document.getElementById('sc-theta-val').textContent = Math.round(theta) + '°';
            document.getElementById('sc-phi-val').textContent = ((Math.round(phi) + 360) % 360) + '°';
        }
        drawSpaceCoord();
    };

    function scUpdateFromSpherical() {
        const r = +document.getElementById('sc-r').value;
        const theta = +document.getElementById('sc-theta').value * Math.PI / 180;
        const phi = +document.getElementById('sc-phi').value * Math.PI / 180;
        scX = r * Math.cos(theta) * Math.cos(phi);
        scY = r * Math.cos(theta) * Math.sin(phi);
        scZ = r * Math.sin(theta);
        document.getElementById('sc-r-val').textContent = r;
        document.getElementById('sc-theta-val').textContent = document.getElementById('sc-theta').value + '°';
        document.getElementById('sc-phi-val').textContent = document.getElementById('sc-phi').value + '°';
        drawSpaceCoord();
    }

    function scProj(x, y, z, cx, cy) {
        const rh = scRotH * Math.PI / 180, rv = scRotV * Math.PI / 180;
        const x1 = x * Math.cos(rh) - z * Math.sin(rh), z1 = x * Math.sin(rh) + z * Math.cos(rh);
        const y2 = y * Math.cos(rv) - z1 * Math.sin(rv), z2 = y * Math.sin(rv) + z1 * Math.cos(rv);
        const f = 6 / (6 + z2 * 0.3);
        return { sx: cx + x1 * f * 68, sy: cy - y2 * f * 68 };
    }

    function drawSpaceCoord() {
        const canvas = document.getElementById('spaceCoordCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

        const cx = W / 2 - 40, cy = H / 2 + 40;
        const RANGE = 4, SCALE = 68;
        const p = (x, y, z) => scProj(x, y, z, cx, cy);

        // ── 격자 (xy 평면) ──
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
        for (let i = -RANGE; i <= RANGE; i++) {
            const a = p(i, 0, -RANGE), b = p(i, 0, RANGE);
            const c = p(-RANGE, 0, i), d = p(RANGE, 0, i);
            ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke();
        }

        // ── 3축 ──
        const axes = [
            { v: [RANGE + 0.5, 0, 0], neg: [-RANGE, 0, 0], col: '#e53e3e', lbl: 'x' },
            { v: [0, 0, RANGE + 0.5], neg: [0, 0, -RANGE], col: '#38a169', lbl: 'y' },
            { v: [0, RANGE + 0.5, 0], neg: [0, -RANGE, 0], col: '#3182ce', lbl: 'z' },
        ];
        axes.forEach(({ v, neg, col, lbl }) => {
            const o2 = p(0, 0, 0), ep = p(...v), np = p(...neg);
            // 음의 방향 점선
            ctx.setLineDash([4, 3]); ctx.strokeStyle = col + '88'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(o2.sx, o2.sy); ctx.lineTo(np.sx, np.sy); ctx.stroke();
            ctx.setLineDash([]);
            // 양의 방향
            ctx.strokeStyle = col; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(o2.sx, o2.sy); ctx.lineTo(ep.sx, ep.sy); ctx.stroke();
            // 화살표
            const ang = Math.atan2(ep.sy - o2.sy, ep.sx - o2.sx);
            ctx.save(); ctx.translate(ep.sx, ep.sy); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -5); ctx.lineTo(-12, 5); ctx.closePath();
            ctx.fillStyle = col; ctx.fill(); ctx.restore();
            ctx.font = 'bold 16px Outfit'; ctx.fillStyle = col; ctx.textAlign = 'center';
            ctx.fillText(lbl, ep.sx + Math.cos(ang) * 16, ep.sy + Math.sin(ang) * 16 + 4);
        });
        ctx.textAlign = 'left';

        // ── 원점 O ──
        const o = p(0, 0, 0);
        ctx.font = '13px Outfit'; ctx.fillStyle = '#718096'; ctx.fillText('O', o.sx + 6, o.sy + 14);

        // ── 점 P의 위치 ──
        const pt = p(scX, scZ, scY); // z를 위로

        // 투영선 — x,y(수평면)
        const pxy = p(scX, 0, scY);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = '#a0aec0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pt.sx, pt.sy); ctx.lineTo(pxy.sx, pxy.sy); ctx.stroke();
        // x축 발
        const px0 = p(scX, 0, 0);
        ctx.beginPath(); ctx.moveTo(pxy.sx, pxy.sy); ctx.lineTo(px0.sx, px0.sy); ctx.stroke();
        // y축 발
        const py0 = p(0, 0, scY);
        ctx.beginPath(); ctx.moveTo(pxy.sx, pxy.sy); ctx.lineTo(py0.sx, py0.sy); ctx.stroke();
        // z축 발
        const pz0 = p(0, scZ, 0);
        ctx.beginPath(); ctx.moveTo(pt.sx, pt.sy); ctx.lineTo(pz0.sx, pz0.sy); ctx.stroke();
        ctx.setLineDash([]);

        if (scMode === 'spherical') {
            // 구면좌표: r 벡터 (원점→P)
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(o.sx, o.sy); ctx.lineTo(pt.sx, pt.sy); ctx.stroke();

            // θ 호 (xy평면에서 위로)
            const pxyNorm = Math.sqrt(scX * scX + scY * scY);
            if (pxyNorm > 0.01) {
                const pxyDir = p(scX / pxyNorm * 1.5, 0, scY / pxyNorm * 1.5);
                const a1 = Math.atan2(pxyDir.sy - o.sy, pxyDir.sx - o.sx);
                const a2 = Math.atan2(pt.sy - o.sy, pt.sx - o.sx);
                ctx.beginPath(); ctx.arc(o.sx, o.sy, 38, Math.min(a1, a2), Math.max(a1, a2));
                ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 2; ctx.stroke();
                const midA = (a1 + a2) / 2;
                ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#ed8936';
                ctx.fillText('θ', o.sx + Math.cos(midA) * 50, o.sy + Math.sin(midA) * 50);
            }

            // φ 호 (xy평면 내 x축에서)
            const px1 = p(2, 0, 0);
            const a3 = Math.atan2(px1.sy - o.sy, px1.sx - o.sx);
            const a4 = Math.atan2(pxy.sy - o.sy, pxy.sx - o.sx);
            ctx.beginPath(); ctx.arc(o.sx, o.sy, 28, Math.min(a3, a4), Math.max(a3, a4));
            ctx.strokeStyle = '#3182ce'; ctx.lineWidth = 2; ctx.stroke();
            const midB = (a3 + a4) / 2;
            ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#3182ce';
            ctx.fillText('φ', o.sx + Math.cos(midB) * 40, o.sy + Math.sin(midB) * 40);

            // r 레이블
            const midPt = p(scX / 2, scZ / 2, scY / 2);
            ctx.font = 'bold 13px Outfit'; ctx.fillStyle = '#805ad5';
            ctx.fillText('r', midPt.sx + 6, midPt.sy - 6);
        }

        // ── 점 P ──
        ctx.beginPath(); ctx.arc(pt.sx, pt.sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#e53e3e'; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

        // P 레이블
        ctx.font = 'bold 15px Outfit'; ctx.fillStyle = '#2d3748';
        ctx.fillText(`P(${scX}, ${scY}, ${scZ})`, pt.sx + 12, pt.sy - 10);

        // ── 좌표 디스플레이 업데이트 ──
        const dispEl = document.getElementById('sc-coord-display');
        if (dispEl) {
            const r = Math.sqrt(scX * scX + scY * scY + scZ * scZ).toFixed(2);
            const theta = (r > 0 ? Math.asin(scZ / +r) * 180 / Math.PI : 0).toFixed(1);
            const phi = ((Math.atan2(scY, scX) * 180 / Math.PI + 360) % 360).toFixed(1);
            dispEl.innerHTML = `
                <span style="color:#4a5568;">직교좌표:</span>
                <span style="color:#e53e3e;">x=${scX}</span>,
                <span style="color:#38a169;">y=${scY}</span>,
                <span style="color:#3182ce;">z=${scZ}</span><br>
                <span style="color:#4a5568;">구면좌표:</span>
                <span style="color:#805ad5;">r=${r}</span>,
                <span style="color:#ed8936;">θ=${theta}°</span>,
                <span style="color:#3182ce;">φ=${phi}°</span>`;
        }
        ctx.textAlign = 'left';
    }

    /* 직선과 평면 관계 버튼 이벤트 연결 */
    function initLinePlaneButtons() {
        ['contain', 'parallel', 'intersect', 'perp'].forEach(mode => {
            const btn = document.getElementById('lp-btn-' + mode);
            if (btn) btn.addEventListener('click', () => {
                linePlaneMode = mode;
                document.querySelectorAll('.lp-mode-btn').forEach(b => b.style.fontWeight = '600');
                btn.style.fontWeight = '800';
                const c2d = document.getElementById('geomSolidCanvas');
                if (c2d) {
                    const ctx = c2d.getContext('2d'), W = c2d.width, H = c2d.height;
                    ctx.clearRect(0, 0, W, H);
                    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
                    drawLinePlane(ctx, W / 2, H / 2 + 40);
                }
            });
        });
    }

    /* 정사영 슬라이더 이벤트 연결 */
    function initOrthProjSlider() {
        const sl = document.getElementById('orth-angle-slider');
        if (sl && !sl.dataset.bound) {
            sl.dataset.bound = '1';
            sl.addEventListener('input', () => {
                orthAngle = +sl.value;
                document.getElementById('orth-angle-val').textContent = orthAngle + '°';
                const c2d = document.getElementById('geomSolidCanvas');
                if (c2d) {
                    const ctx = c2d.getContext('2d');
                    drawOrthProj(ctx, c2d.width, c2d.height);
                }
            });
        }
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



        const el = document.getElementById('geom-solid-info');
        if (el) el.innerHTML = SOLID_INFO[solidTopic] || '';

        /* ── 마우스 드래그 회전 ── */
        const solidCanvas = document.getElementById('geomSolidCanvas');
        if (solidCanvas && !solidCanvas.dataset.dragBound) {
            solidCanvas.dataset.dragBound = '1';
            let dragging = false, lastX = 0, lastY = 0;
            let velH = 0, velV = 0;

            solidCanvas.addEventListener('mousedown', e => {
                dragging = true;
                lastX = e.clientX; lastY = e.clientY;
                velH = velV = 0;
                solidCanvas.style.cursor = 'grabbing';
            });
            window.addEventListener('mousemove', e => {
                if (!dragging) return;
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                velH = dx * 0.5;
                velV = dy * 0.3;
                rotH = (rotH + velH + 360) % 360;
                rotV = Math.max(10, Math.min(80, rotV + velV));
                lastX = e.clientX; lastY = e.clientY;
                redrawSolid();
            });
            window.addEventListener('mouseup', () => {
                dragging = false;
                solidCanvas.style.cursor = 'grab';
                /* 관성 */
                (function inertia() {
                    if (dragging) return;
                    velH *= 0.88; velV *= 0.88;
                    if (Math.abs(velH) > 0.05 || Math.abs(velV) > 0.05) {
                        rotH = (rotH + velH + 360) % 360;
                        rotV = Math.max(10, Math.min(80, rotV + velV));
                        redrawSolid();
                        requestAnimationFrame(inertia);
                    }
                })();
            });

            /* 터치 지원 */
            solidCanvas.addEventListener('touchstart', e => {
                dragging = true;
                lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
                velH = velV = 0;
            }, { passive: true });
            solidCanvas.addEventListener('touchmove', e => {
                if (!dragging) return;
                const dx = e.touches[0].clientX - lastX;
                const dy = e.touches[0].clientY - lastY;
                rotH = (rotH + dx * 0.5 + 360) % 360;
                rotV = Math.max(10, Math.min(80, rotV + dy * 0.3));
                lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
                redrawSolid();
            }, { passive: true });
            solidCanvas.addEventListener('touchend', () => { dragging = false; });
        }

        initLinePlaneButtons();
        initOrthProjSlider();

        // 삼수선 Step 버튼 이벤트 리스너 연결
        const step1Btn = document.getElementById('three-perp-step1');
        const step2Btn = document.getElementById('three-perp-step2');
        if (step1Btn) step1Btn.addEventListener('change', (e) => { tpStep1 = e.target.checked; buildThreePerpScene(); });
        if (step2Btn) step2Btn.addEventListener('change', (e) => { tpStep2 = e.target.checked; buildThreePerpScene(); });
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
        if (panelId === 'solid') setTimeout(() => { redrawSolid(); initLinePlaneButtons(); initOrthProjSlider(); }, 60);
    };

})();