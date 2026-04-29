/* ========================================================= */
/* --- 함수의 극한과 연속 (Limit & Continuity) Logic ---    */
/* ========================================================= */

window.initLimit = (function () {

    let currentTab = 'intuition';

    /* ── 공통 유틸리티 ── */
    function clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return ctx;
    }

    /* ── 좌표 변환 헬퍼 생성 ── */
    function makeCoord(canvas, xMin, xMax, yMin, yMax) {
        const W = canvas.width, H = canvas.height;
        const PAD = 50;
        const cw = W - PAD * 2, ch = H - PAD * 2;
        return {
            W, H, PAD,
            x: (mx) => PAD + (mx - xMin) / (xMax - xMin) * cw,
            y: (my) => H - PAD - (my - yMin) / (yMax - yMin) * ch,
            mx: (px) => xMin + (px - PAD) / cw * (xMax - xMin),
        };
    }

    /* ── 축 그리기 ── */
    function drawAxes(ctx, c, xMin, xMax, yMin, yMax, xStep, yStep) {
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
        // 격자
        for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
            ctx.beginPath(); ctx.moveTo(c.x(x), c.PAD); ctx.lineTo(c.x(x), c.H - c.PAD); ctx.stroke();
        }
        for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
            ctx.beginPath(); ctx.moveTo(c.PAD, c.y(y)); ctx.lineTo(c.W - c.PAD, c.y(y)); ctx.stroke();
        }
        // 축
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.PAD, c.y(0)); ctx.lineTo(c.W - c.PAD, c.y(0));
        ctx.moveTo(c.x(0), c.PAD); ctx.lineTo(c.x(0), c.H - c.PAD);
        ctx.stroke();
        // 눈금 레이블
        ctx.fillStyle = '#718096'; ctx.font = '12px Outfit'; ctx.textAlign = 'center';
        for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
            if (x === 0) continue;
            ctx.fillText(x, c.x(x), c.y(0) + 18);
        }
        ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
            if (y === 0) continue;
            ctx.fillText(y, c.x(0) - 6, c.y(y) + 4);
        }
        ctx.fillText('O', c.x(0) - 6, c.y(0) + 16);
        ctx.textAlign = 'left';
    }

    /* ── 함수 곡선 그리기 ── */
    function drawCurve(ctx, c, fn, xMin, xMax, color, width, skip) {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width;
        let first = true;
        for (let px = c.PAD; px <= c.W - c.PAD; px++) {
            const mx = c.mx(px);
            if (mx < xMin || mx > xMax) continue;
            const my = fn(mx);
            if (!isFinite(my) || Math.abs(my) > 1e6) { first = true; continue; }
            if (skip && skip(mx)) { first = true; continue; }
            if (first) { ctx.moveTo(px, c.y(my)); first = false; }
            else ctx.lineTo(px, c.y(my));
        }
        ctx.stroke();
    }

    /* ── 열린 점 그리기 ── */
    function drawOpenDot(ctx, sx, sy, color) {
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    }

    /* ── 닫힌 점 그리기 ── */
    function drawClosedDot(ctx, sx, sy, color) {
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    }

    /* ============================================================
       탭 1 — 극한의 직관
       x→a 접근 시 함수값이 수렴하는 과정
    ============================================================ */
    let intuitState = {
        a: 2,
        xL: 0.5, // 왼쪽 접근점
        xR: 3.5, // 오른쪽 접근점
        fn: null,
        fnName: '(x²-4)/(x-2)',
        animId: null,
    };

    const intuitFunctions = {
        '(x²-4)/(x-2)': {
            fn: x => Math.abs(x - 2) < 1e-9 ? NaN : (x * x - 4) / (x - 2),
            limit: 4,
            a: 2,
            hole: true,
            yMin: -1, yMax: 7
        },
        'sin(x)/x': {
            fn: x => Math.abs(x) < 1e-9 ? NaN : Math.sin(x) / x,
            limit: 1,
            a: 0,
            hole: true,
            yMin: -0.5, yMax: 1.5
        },
        '(1-cos x)/x': {
            fn: x => Math.abs(x) < 1e-9 ? NaN : (1 - Math.cos(x)) / x,
            limit: 0,
            a: 0,
            hole: true,
            yMin: -0.5, yMax: 1
        },
    };

    function drawIntuition() {
        const canvas = document.getElementById('limitIntuitionCanvas');
        if (!canvas) return;
        const ctx = clearCanvas(canvas);
        const info = intuitFunctions[intuitState.fnName];
        const a = info.a;
        const c = makeCoord(canvas, a - 3, a + 3, info.yMin, info.yMax);

        drawAxes(ctx, c, a - 3, a + 3, info.yMin, info.yMax, 1, 1);

        // 함수 곡선
        drawCurve(ctx, c, info.fn, a - 3, a + 3, '#3182ce', 3, x => Math.abs(x - a) < 0.01);

        // 구멍 표시
        if (info.hole) {
            drawOpenDot(ctx, c.x(a), c.y(info.limit), '#3182ce');
        }

        // 수평 극한값 점선
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(229,62,62,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c.PAD, c.y(info.limit)); ctx.lineTo(c.W - c.PAD, c.y(info.limit)); ctx.stroke();
        ctx.setLineDash([]);

        // 왼쪽 접근점 (파란 화살표)
        const lx = intuitState.xL;
        const ly = info.fn(lx);
        if (isFinite(ly)) {
            // 접근 화살표 (x축 위)
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(c.x(lx), c.y(info.yMin) + 20); ctx.lineTo(c.x(a) + 12, c.y(info.yMin) + 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x(a) + 12, c.y(info.yMin) + 15); ctx.lineTo(c.x(a) + 2, c.y(info.yMin) + 20); ctx.lineTo(c.x(a) + 12, c.y(info.yMin) + 25); ctx.fill();

            ctx.setLineDash([4, 3]);
            ctx.strokeStyle = 'rgba(128,90,213,0.4)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(c.x(lx), c.y(info.yMin)); ctx.lineTo(c.x(lx), c.y(ly)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x(lx), c.y(ly)); ctx.lineTo(c.PAD, c.y(ly)); ctx.stroke();
            ctx.setLineDash([]);
            drawClosedDot(ctx, c.x(lx), c.y(ly), '#805ad5');
        }

        // 오른쪽 접근점 (초록 화살표)
        const rx = intuitState.xR;
        const ry = info.fn(rx);
        if (isFinite(ry)) {
            ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(c.x(rx), c.y(info.yMin) + 35); ctx.lineTo(c.x(a) - 12, c.y(info.yMin) + 35); ctx.stroke();

            ctx.setLineDash([4, 3]);
            ctx.strokeStyle = 'rgba(56,161,105,0.4)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(c.x(rx), c.y(info.yMin)); ctx.lineTo(c.x(rx), c.y(ry)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x(rx), c.y(ry)); ctx.lineTo(c.PAD, c.y(ry)); ctx.stroke();
            ctx.setLineDash([]);
            drawClosedDot(ctx, c.x(rx), c.y(ry), '#38a169');
        }

        // a 위치 수직선
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(229,62,62,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c.x(a), c.PAD); ctx.lineTo(c.x(a), c.H - c.PAD); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'center';
        ctx.fillText('a', c.x(a), c.H - c.PAD + 20);

        // 극한값 라벨
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 14px Outfit';
        ctx.fillText(`극한값 = ${info.limit}`, c.W - c.PAD - 120, c.y(info.limit) - 8);

        // 접근값 표시 박스
        const dist = Math.min(Math.abs(lx - a), Math.abs(rx - a)).toFixed(3);
        const lVal = isFinite(ly) ? ly.toFixed(4) : '—';
        const rVal = isFinite(ry) ? ry.toFixed(4) : '—';

        ctx.fillStyle = 'rgba(128,90,213,0.12)';
        ctx.beginPath(); ctx.roundRect(c.PAD + 4, c.PAD + 4, 200, 60, 8); ctx.fill();
        ctx.fillStyle = '#805ad5'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'left';
        ctx.fillText(`← x = ${lx.toFixed(3)} 일 때: f(x) = ${lVal}`, c.PAD + 12, c.PAD + 22);

        ctx.fillStyle = 'rgba(56,161,105,0.12)';
        ctx.beginPath(); ctx.roundRect(c.PAD + 4, c.PAD + 68, 200, 60, 8); ctx.fill();
        ctx.fillStyle = '#38a169'; ctx.font = 'bold 13px Outfit';
        ctx.fillText(`→ x = ${rx.toFixed(3)} 일 때: f(x) = ${rVal}`, c.PAD + 12, c.PAD + 86);

        // UI 업데이트
        const convEl = document.getElementById('limitIntuitionConverge');
        if (convEl) {
            const lDist = Math.abs(lx - a), rDist = Math.abs(rx - a);
            const converging = lDist < 0.3 && rDist < 0.3;
            convEl.innerHTML = converging
                ? `<span style="color:#38a169;font-weight:800;">✓ 두 방향 모두 ${info.limit} 로 수렴 → 극한값 존재</span>`
                : `<span style="color:#718096;">양쪽에서 x → ${a} 로 접근하면 f(x) → ?</span>`;
        }
    }

    function initIntuitionTab() {
        const fnSel = document.getElementById('limitFnSelect');
        if (fnSel) {
            fnSel.addEventListener('change', () => {
                intuitState.fnName = fnSel.value;
                const info = intuitFunctions[intuitState.fnName];
                intuitState.xL = info.a - 2.5;
                intuitState.xR = info.a + 2.5;
                const slL = document.getElementById('limitApproachL');
                const slR = document.getElementById('limitApproachR');
                if (slL) { slL.min = info.a - 3; slL.max = info.a - 0.01; slL.value = info.a - 2.5; }
                if (slR) { slR.min = info.a + 0.01; slR.max = info.a + 3; slR.value = info.a + 2.5; }
                drawIntuition();
            });
        }

        const slL = document.getElementById('limitApproachL');
        const slR = document.getElementById('limitApproachR');
        if (slL) slL.addEventListener('input', () => {
            intuitState.xL = parseFloat(slL.value);
            document.getElementById('limitApproachLVal').textContent = parseFloat(slL.value).toFixed(2);
            drawIntuition();
        });
        if (slR) slR.addEventListener('input', () => {
            intuitState.xR = parseFloat(slR.value);
            document.getElementById('limitApproachRVal').textContent = parseFloat(slR.value).toFixed(2);
            drawIntuition();
        });

        drawIntuition();
    }

    /* ============================================================
       탭 2 — 좌극한·우극한
       극한 존재 조건 시각화
    ============================================================ */
    const oneSidedFunctions = {
        '극한 존재 (연속)': {
            fn: x => x * x - 2 * x + 2,
            leftLimit: 1, rightLimit: 1, a: 1, fa: 1,
            continuous: true, color: '#3182ce',
            desc: 'lim f(x) = 1 존재, f(1) = 1 → 연속'
        },
        '극한 존재 (불연속)': {
            fn: x => Math.abs(x - 1) < 1e-9 ? 3 : x * x - 2 * x + 2,
            leftLimit: 1, rightLimit: 1, a: 1, fa: 3,
            continuous: false, color: '#ed8936',
            desc: 'lim f(x) = 1 존재, 하지만 f(1) = 3 → 불연속'
        },
        '좌극한≠우극한': {
            fn: x => x < 1 ? x + 1 : x - 1,
            leftLimit: 2, rightLimit: 0, a: 1, fa: 0,
            continuous: false, color: '#e53e3e',
            desc: '좌극한 = 2, 우극한 = 0 → 극한 존재하지 않음'
        },
        '진동 (극한 없음)': {
            fn: x => Math.abs(x) < 1e-9 ? NaN : Math.sin(1 / x),
            leftLimit: NaN, rightLimit: NaN, a: 0, fa: NaN,
            continuous: false, color: '#805ad5',
            desc: 'x→0 에서 -1과 1 사이를 무한 진동 → 극한 없음'
        },
    };

    let oneSidedState = { fnName: '극한 존재 (연속)' };

    function drawOneSided() {
        const canvas = document.getElementById('limitOneSidedCanvas');
        if (!canvas) return;
        const ctx = clearCanvas(canvas);
        const info = oneSidedFunctions[oneSidedState.fnName];
        const a = info.a;
        const c = makeCoord(canvas, a - 3, a + 3, -2, 5);

        drawAxes(ctx, c, a - 3, a + 3, -2, 5, 1, 1);

        // 함수 곡선
        if (oneSidedState.fnName === '좌극한≠우극한') {
            // 두 조각 따로 그리기
            drawCurve(ctx, c, x => x + 1, a - 3, a - 0.01, info.color, 3);
            drawCurve(ctx, c, x => x - 1, a + 0.01, a + 3, info.color, 3);
            drawOpenDot(ctx, c.x(a), c.y(info.leftLimit), info.color);
            drawClosedDot(ctx, c.x(a), c.y(info.fa), info.color);
        } else {
            drawCurve(ctx, c, info.fn, a - 3, a + 3, info.color, 3, x => Math.abs(x - a) < 0.01);
            if (!info.continuous) {
                drawOpenDot(ctx, c.x(a), c.y(info.leftLimit), info.color);
                if (isFinite(info.fa)) drawClosedDot(ctx, c.x(a), c.y(info.fa), info.color);
            } else {
                drawClosedDot(ctx, c.x(a), c.y(info.fa), info.color);
            }
        }

        // 좌극한 화살표
        if (isFinite(info.leftLimit)) {
            ctx.strokeStyle = '#805ad5'; ctx.lineWidth = 2.5;
            const arrowY = c.y(info.leftLimit);
            ctx.beginPath(); ctx.moveTo(c.x(a - 1.5), arrowY); ctx.lineTo(c.x(a) - 14, arrowY); ctx.stroke();
            ctx.beginPath(); ctx.fillStyle = '#805ad5';
            ctx.moveTo(c.x(a) - 14, arrowY - 6); ctx.lineTo(c.x(a) - 2, arrowY); ctx.lineTo(c.x(a) - 14, arrowY + 6);
            ctx.closePath(); ctx.fill();
            ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'right';
            ctx.fillText(`좌극한 = ${info.leftLimit}`, c.x(a) - 20, arrowY - 10);
        }

        // 우극한 화살표
        if (isFinite(info.rightLimit)) {
            ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2.5;
            const arrowY = c.y(info.rightLimit);
            ctx.beginPath(); ctx.moveTo(c.x(a + 1.5), arrowY); ctx.lineTo(c.x(a) + 14, arrowY); ctx.stroke();
            ctx.beginPath(); ctx.fillStyle = '#38a169';
            ctx.moveTo(c.x(a) + 14, arrowY - 6); ctx.lineTo(c.x(a) + 2, arrowY); ctx.lineTo(c.x(a) + 14, arrowY + 6);
            ctx.closePath(); ctx.fill();
            ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'left';
            ctx.fillText(`우극한 = ${info.rightLimit}`, c.x(a) + 20, arrowY - 10);
        }

        // a 수직선
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(229,62,62,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c.x(a), c.PAD); ctx.lineTo(c.x(a), c.H - c.PAD); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'center';
        ctx.fillText('a', c.x(a), c.H - c.PAD + 20);

        // 결론 박스
        const boxColor = (isFinite(info.leftLimit) && isFinite(info.rightLimit) && info.leftLimit === info.rightLimit)
            ? 'rgba(56,161,105,0.12)' : 'rgba(229,62,62,0.1)';
        const textColor = (isFinite(info.leftLimit) && isFinite(info.rightLimit) && info.leftLimit === info.rightLimit)
            ? '#276749' : '#c53030';
        ctx.fillStyle = boxColor;
        ctx.beginPath(); ctx.roundRect(c.PAD, c.PAD, c.W - c.PAD * 2, 36, 8); ctx.fill();
        ctx.fillStyle = textColor; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'center';
        ctx.fillText(info.desc, c.W / 2, c.PAD + 23);
        ctx.textAlign = 'left';
    }

    function initOneSidedTab() {
        document.querySelectorAll('.limit-onesided-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.limit-onesided-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                oneSidedState.fnName = btn.dataset.fn;
                drawOneSided();
            });
        });
        drawOneSided();
    }

    /* ============================================================
       탭 3 — 연속의 정의 & 불연속 유형
    ============================================================ */
    const continuityFunctions = {
        '연속': {
            fn: x => x * x - x + 1,
            a: 1, fa: 1, limit: 1,
            type: 'continuous',
            title: '연속함수',
            color: '#38a169',
            desc: '① f(a) 정의됨\n② lim f(x) 존재\n③ lim f(x) = f(a)\n→ 세 조건 모두 만족 ✓',
        },
        '제거가능 불연속': {
            fn: x => Math.abs(x - 1) < 1e-9 ? NaN : (x * x - 1) / (x - 1),
            a: 1, fa: NaN, limit: 2,
            type: 'removable',
            title: '제거가능 불연속',
            color: '#ed8936',
            desc: '① f(a) 정의되지 않음 ✗\n② lim f(x) = 2 존재\n→ f(a) 재정의 시 연속 가능',
        },
        '점프 불연속': {
            fn: x => x < 1 ? 2 * x : 2 * x - 1,
            a: 1, fa: 1, limit: NaN,
            leftLimit: 2, rightLimit: 1,
            type: 'jump',
            title: '점프 불연속',
            color: '#e53e3e',
            desc: '① f(a) = 1 정의됨\n② 좌극한 = 2, 우극한 = 1\n   → 극한 존재하지 않음 ✗',
        },
        '무한 불연속': {
            fn: x => Math.abs(x - 1) < 1e-9 ? NaN : 1 / (x - 1),
            a: 1, fa: NaN, limit: NaN,
            type: 'infinite',
            title: '무한 불연속',
            color: '#805ad5',
            desc: '① f(a) 정의되지 않음 ✗\n② lim f(x) = ±∞\n   → 극한 존재하지 않음 ✗',
        },
    };

    let continuityState = { fnName: '연속' };

    function drawContinuity() {
        const canvas = document.getElementById('limitContinuityCanvas');
        if (!canvas) return;
        const ctx = clearCanvas(canvas);
        const info = continuityFunctions[continuityState.fnName];
        const a = info.a;

        const yMin = info.type === 'infinite' ? -5 : -1;
        const yMax = info.type === 'infinite' ? 5 : 5;
        const c = makeCoord(canvas, a - 3, a + 3, yMin, yMax);

        drawAxes(ctx, c, a - 3, a + 3, yMin, yMax, 1, 1);

        const skipNear = x => Math.abs(x - a) < 0.08;

        // 점프 불연속 — 두 조각
        if (info.type === 'jump') {
            drawCurve(ctx, c, x => 2 * x, a - 3, a - 0.02, info.color, 3);
            drawCurve(ctx, c, x => 2 * x - 1, a + 0.02, a + 3, info.color, 3);
            drawOpenDot(ctx, c.x(a), c.y(info.leftLimit), info.color);
            drawClosedDot(ctx, c.x(a), c.y(info.fa), info.color);
        } else {
            drawCurve(ctx, c, info.fn, a - 3, a + 3, info.color, 3, skipNear);
            if (info.type === 'removable') {
                drawOpenDot(ctx, c.x(a), c.y(info.limit), info.color);
            } else if (info.type === 'continuous') {
                drawClosedDot(ctx, c.x(a), c.y(info.fa), info.color);
            } else if (info.type === 'infinite') {
                // 점근선
                ctx.setLineDash([5, 4]);
                ctx.strokeStyle = 'rgba(128,90,213,0.5)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(c.x(a), c.PAD); ctx.lineTo(c.x(a), c.H - c.PAD); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#805ad5'; ctx.font = '13px Outfit'; ctx.textAlign = 'center';
                ctx.fillText('수직점근선', c.x(a), c.PAD - 5);
            }
        }

        // 조건 박스 표시
        const lines = info.desc.split('\n');
        const boxH = lines.length * 22 + 20;
        ctx.fillStyle = `${info.color}18`;
        ctx.beginPath(); ctx.roundRect(c.W - c.PAD - 220, c.PAD, 220, boxH, 10); ctx.fill();
        ctx.strokeStyle = info.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(c.W - c.PAD - 220, c.PAD, 220, boxH, 10); ctx.stroke();

        ctx.fillStyle = '#2d3748'; ctx.font = '13px Outfit'; ctx.textAlign = 'left';
        ctx.fillText(info.title, c.W - c.PAD - 210, c.PAD + 18);
        ctx.font = '12px Outfit';
        lines.forEach((line, i) => {
            const col = line.includes('✓') ? '#276749' : line.includes('✗') ? '#c53030' : '#4a5568';
            ctx.fillStyle = col;
            ctx.fillText(line, c.W - c.PAD - 210, c.PAD + 38 + i * 22);
        });
        ctx.textAlign = 'left';
    }

    function initContinuityTab() {
        document.querySelectorAll('.limit-cont-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.limit-cont-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                continuityState.fnName = btn.dataset.fn;
                drawContinuity();
            });
        });
        drawContinuity();
    }

    /* ============================================================
       탭 4 — ε-δ 논법
    ============================================================ */
    let epsilonState = { epsilon: 1.0, a: 2, L: 4 };

    function computeDelta(epsilon) {
        // f(x) = x+2 일 때 |f(x)-4| < ε ⟺ |x-2| < ε
        return epsilon;
    }

    function drawEpsilonDelta() {
        const canvas = document.getElementById('limitEpsilonCanvas');
        if (!canvas) return;
        const ctx = clearCanvas(canvas);
        const eps = epsilonState.epsilon;
        const a = epsilonState.a;
        const L = epsilonState.L;
        const delta = computeDelta(eps);
        const c = makeCoord(canvas, a - 4, a + 4, L - 4, L + 4);

        drawAxes(ctx, c, a - 4, a + 4, L - 4, L + 4, 1, 1);

        // 함수 곡선 f(x) = x+2
        drawCurve(ctx, c, x => x + 2, a - 4, a + 4, '#3182ce', 3, x => Math.abs(x - a) < 0.01);
        drawOpenDot(ctx, c.x(a), c.y(L), '#3182ce');

        // ε 밴드 (y방향)
        ctx.fillStyle = 'rgba(229,62,62,0.12)';
        ctx.fillRect(c.PAD, c.y(L + eps), c.W - c.PAD * 2, c.y(L - eps) - c.y(L + eps));
        ctx.strokeStyle = 'rgba(229,62,62,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(c.PAD, c.y(L + eps)); ctx.lineTo(c.W - c.PAD, c.y(L + eps)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.PAD, c.y(L - eps)); ctx.lineTo(c.W - c.PAD, c.y(L - eps)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'right';
        ctx.fillText(`L+ε = ${(L + eps).toFixed(2)}`, c.PAD + 58, c.y(L + eps) - 5);
        ctx.fillText(`L-ε = ${(L - eps).toFixed(2)}`, c.PAD + 58, c.y(L - eps) + 16);

        // δ 밴드 (x방향)
        ctx.fillStyle = 'rgba(56,161,105,0.12)';
        ctx.fillRect(c.x(a - delta), c.PAD, c.x(a + delta) - c.x(a - delta), c.H - c.PAD * 2);
        ctx.strokeStyle = 'rgba(56,161,105,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(c.x(a - delta), c.PAD); ctx.lineTo(c.x(a - delta), c.H - c.PAD); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x(a + delta), c.PAD); ctx.lineTo(c.x(a + delta), c.H - c.PAD); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#276749'; ctx.font = 'bold 13px Outfit'; ctx.textAlign = 'center';
        ctx.fillText(`a-δ`, c.x(a - delta), c.H - c.PAD + 20);
        ctx.fillText(`a+δ`, c.x(a + delta), c.H - c.PAD + 20);

        // L 수평선
        ctx.strokeStyle = 'rgba(229,62,62,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.PAD, c.y(L)); ctx.lineTo(c.W - c.PAD, c.y(L)); ctx.stroke();
        ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'left';
        ctx.fillText(`L = ${L}`, c.PAD + 4, c.y(L) - 8);

        // a 수직선
        ctx.strokeStyle = '#38a169'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.x(a), c.PAD); ctx.lineTo(c.x(a), c.H - c.PAD); ctx.stroke();
        ctx.fillStyle = '#276749'; ctx.font = 'bold 14px Outfit'; ctx.textAlign = 'center';
        ctx.fillText(`a = ${a}`, c.x(a), c.PAD - 5);

        // 설명 업데이트
        const infoEl = document.getElementById('limitEpsilonInfo');
        if (infoEl) {
            infoEl.innerHTML =
                `ε = <b style="color:#e53e3e">${eps.toFixed(2)}</b> 로 주어지면 &nbsp;` +
                `δ = <b style="color:#38a169">${delta.toFixed(2)}</b> 로 선택<br>` +
                `<span style="color:#4a5568;font-size:13px;">0 &lt; |x - ${a}| &lt; δ 이면 |f(x) - ${L}| &lt; ε 이 성립합니다</span>`;
        }
    }

    function initEpsilonTab() {
        const sl = document.getElementById('limitEpsilonSlider');
        if (sl) sl.addEventListener('input', () => {
            epsilonState.epsilon = parseFloat(sl.value);
            document.getElementById('limitEpsilonVal').textContent = parseFloat(sl.value).toFixed(2);
            drawEpsilonDelta();
        });
        drawEpsilonDelta();
    }

    /* ============================================================
       탭 전환
    ============================================================ */
    function showTab(tab) {
        currentTab = tab;
        ['intuition', 'onesided', 'continuity', 'epsilon'].forEach(t => {
            const panel = document.getElementById(`limitPanel-${t}`);
            if (panel) panel.style.display = t === tab ? 'block' : 'none';
            const canvas = document.getElementById(`limitCanvas-${t}`);
            if (canvas) canvas.style.display = t === tab ? 'block' : 'none';
        });
        // topbar 버튼 active
        document.querySelectorAll('#limit-nav [data-limittab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.limittab === tab);
        });
        if (tab === 'intuition') drawIntuition();
        if (tab === 'onesided') drawOneSided();
        if (tab === 'continuity') drawContinuity();
        if (tab === 'epsilon') drawEpsilonDelta();
    }

    /* ============================================================
       공개 초기화
    ============================================================ */
    let initialized = false;

    return function () {
        if (initialized) { showTab(currentTab); return; }
        initialized = true;

        initIntuitionTab();
        initOneSidedTab();
        initContinuityTab();
        initEpsilonTab();

        document.querySelectorAll('#limit-nav [data-limittab]').forEach(btn => {
            btn.addEventListener('click', () => showTab(btn.dataset.limittab));
        });

        showTab('intuition');
    };

})();