/* ========================================================= */
/* --- Function Graph (함수 그래프 그리기) Logic --- */
/* 전면 재작성: 줌/패닝, 불연속 처리, 정확한 좌표 변환     */
/* ========================================================= */

const expCanvas = document.getElementById('expCanvas');
const eCtx = expCanvas.getContext('2d');
const funcInput = document.getElementById('funcInput');
const drawBtn = document.getElementById('drawBtn');
const funcError = document.getElementById('funcError');
const historyList = document.getElementById('historyList');
const colorBtns = document.querySelectorAll('.color-btn');

const EXP_CW = 1000;
const EXP_CH = 700;

/* ---- 뷰포트 상태 (줌/패닝) ---- */
let vp = {
    cx: EXP_CW / 2,   // 원점의 캔버스 x 픽셀
    cy: EXP_CH / 2,   // 원점의 캔버스 y 픽셀
    scale: 60,         // px per math unit
};

/* ---- 좌표 변환 ---- */
const toCanvasX = (x) => vp.cx + x * vp.scale;
const toCanvasY = (y) => vp.cy - y * vp.scale;
const toMathX = (px) => (px - vp.cx) / vp.scale;
const toMathY = (py) => (vp.cy - py) / vp.scale;

/* ---- 함수 목록 ---- */
let selectedColor = '#ff8bad';
let functionHistory = [];
let histIdCounter = 0;
let selectedHistoryId = null;

/* ---- 드래그 상태 ---- */
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let vpAtDragStart = { cx: 0, cy: 0 };

/* ========================================================= */
/* ---- 그리드 그리기 ---- */
/* ========================================================= */
function drawExpGrid() {
    eCtx.clearRect(0, 0, EXP_CW, EXP_CH);

    /* 눈금 간격 자동 조정 */
    const rawStep = 80 / vp.scale;        // 목표: 80px마다 눈금 1개
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10].map(c => c * magnitude);
    const step = candidates.find(c => c >= rawStep) || candidates[candidates.length - 1];

    /* 격자 */
    eCtx.strokeStyle = 'rgba(0,0,0,0.05)';
    eCtx.lineWidth = 1;

    const xStart = Math.floor(toMathX(0) / step) * step;
    const xEnd = Math.ceil(toMathX(EXP_CW) / step) * step;
    for (let x = xStart; x <= xEnd; x += step) {
        const px = toCanvasX(x);
        eCtx.beginPath(); eCtx.moveTo(px, 0); eCtx.lineTo(px, EXP_CH); eCtx.stroke();
    }

    const yStart = Math.floor(toMathY(EXP_CH) / step) * step;
    const yEnd = Math.ceil(toMathY(0) / step) * step;
    for (let y = yStart; y <= yEnd; y += step) {
        const py = toCanvasY(y);
        eCtx.beginPath(); eCtx.moveTo(0, py); eCtx.lineTo(EXP_CW, py); eCtx.stroke();
    }

    /* 축 */
    eCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    eCtx.lineWidth = 2;
    eCtx.beginPath();
    eCtx.moveTo(0, vp.cy); eCtx.lineTo(EXP_CW, vp.cy);   // x축
    eCtx.moveTo(vp.cx, 0); eCtx.lineTo(vp.cx, EXP_CH);   // y축
    eCtx.stroke();

    /* 눈금 레이블 */
    eCtx.fillStyle = '#718096';
    eCtx.font = '11px Outfit, sans-serif';
    eCtx.textAlign = 'center';

    const labelY = Math.min(Math.max(vp.cy + 16, 16), EXP_CH - 6);
    const labelX = Math.min(Math.max(vp.cx + 8, 8), EXP_CW - 30);

    // x축 레이블
    for (let x = xStart; x <= xEnd; x += step) {
        if (Math.abs(x) < step * 0.01) continue;
        const px = toCanvasX(x);
        if (px < 10 || px > EXP_CW - 10) continue;
        const label = Number.isInteger(x) ? x.toString() : x.toFixed(1);
        eCtx.fillText(label, px, labelY);
    }

    // y축 레이블
    eCtx.textAlign = 'right';
    for (let y = yStart; y <= yEnd; y += step) {
        if (Math.abs(y) < step * 0.01) continue;
        const py = toCanvasY(y);
        if (py < 10 || py > EXP_CH - 10) continue;
        const label = Number.isInteger(y) ? y.toString() : y.toFixed(1);
        eCtx.fillText(label, labelX, py + 4);
    }

    eCtx.textAlign = 'left';
    eCtx.fillStyle = '#718096';
    eCtx.fillText('O', vp.cx - 14, vp.cy + 14);

    // 축 레이블
    eCtx.fillText('x', EXP_CW - 12, vp.cy - 6);
    eCtx.fillText('y', vp.cx + 6, 12);
}

/* ========================================================= */
/* ---- 함수 곡선 그리기 ---- */
/* ========================================================= */
function drawFunctionCurve(item) {
    /* 수학 x 범위 */
    const xLeft = toMathX(0);
    const xRight = toMathX(EXP_CW);
    /* 픽셀 1개에 해당하는 x 간격 — 부드럽고 빠른 렌더링 */
    const dx = 1 / vp.scale;

    eCtx.beginPath();
    eCtx.strokeStyle = item.color;
    eCtx.lineWidth = 2.5;
    eCtx.setLineDash([]);

    let penDown = false;
    let prevPy = null;
    let prevVal = null;

    /* 불연속 감지 임계값 (캔버스 높이의 60%) */
    const JUMP = EXP_CH * 0.6;

    for (let x = xLeft - dx; x <= xRight + dx; x += dx) {
        let val;
        try {
            val = item.isInverse
                ? item.expr.evaluate({ x: /* y값으로 사용 */ x })
                : item.expr.evaluate({ x });
        } catch {
            penDown = false; prevPy = null; prevVal = null; continue;
        }

        if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) {
            penDown = false; prevPy = null; prevVal = null; continue;
        }

        let px, py;
        if (item.isInverse) {
            px = toCanvasX(val);
            py = toCanvasY(x);
        } else {
            px = toCanvasX(x);
            py = toCanvasY(val);
        }

        /* 불연속 감지: 이전 점과 y값 차이가 너무 크거나, 값 부호가 극단적으로 바뀜 */
        let discontinuous = false;
        if (prevPy !== null) {
            const dyPx = Math.abs(py - prevPy);
            /* tan 계열처럼 ±Infinity로 튀는 경우 */
            if (dyPx > JUMP) discontinuous = true;
            /* 양수 → 음수 / 음수 → 양수 + 큰 도약 → 점근선 */
            if (prevVal !== null && Math.sign(val) !== Math.sign(prevVal) && dyPx > JUMP * 0.3)
                discontinuous = true;
        }

        if (discontinuous) {
            eCtx.stroke();
            eCtx.beginPath();
            penDown = false;
        }

        if (!penDown) {
            eCtx.moveTo(px, py);
            penDown = true;
        } else {
            eCtx.lineTo(px, py);
        }

        prevPy = py;
        prevVal = val;
    }
    eCtx.stroke();
}

/* ========================================================= */
/* ---- 그래프 레이블 ---- */
/* ========================================================= */
function drawLabels() {
    document.getElementById('graphLabels').innerHTML = '';

    functionHistory.forEach(item => {
        if (!item.visible) return;

        /* 레이블 위치: 오른쪽 가장자리 근처 */
        const x = toMathX(EXP_CW * 0.82);
        let y;
        try {
            y = item.isInverse
                ? item.expr.evaluate({ x })
                : item.expr.evaluate({ x });
        } catch { return; }

        if (typeof y !== 'number' || !isFinite(y)) return;

        const px = item.isInverse ? toCanvasX(y) + 10 : toCanvasX(x) + 10;
        const py = item.isInverse ? toCanvasY(x) - 10 : toCanvasY(y) - 10;

        if (px < 0 || px > EXP_CW || py < 0 || py > EXP_CH) return;

        let eqString = item.isInverse
            ? 'x = ' + item.expr.toTex()
            : 'y = ' + item.expr.toTex();

        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = `
            position:absolute;
            left:${px}px; top:${py}px;
            color:${item.color};
            font-size:15px;
            font-weight:700;
            text-shadow:0 0 4px rgba(255,255,255,0.95),0 0 4px rgba(255,255,255,0.95);
            pointer-events:none;
        `;
        try {
            katex.render('\\textcolor{' + item.color + '}{' + eqString + '}', labelDiv, { throwOnError: false });
        } catch {
            labelDiv.innerText = eqString;
        }
        document.getElementById('graphLabels').appendChild(labelDiv);
    });
}

/* ========================================================= */
/* ---- 전체 렌더 ---- */
/* ========================================================= */
function renderAllExpGraphs() {
    drawExpGrid();
    functionHistory.forEach(item => {
        if (item.visible) drawFunctionCurve(item);
    });
    drawLabels();
}

/* ========================================================= */
/* ---- 히스토리 UI ---- */
/* ========================================================= */
function updateHistoryUI() {
    historyList.innerHTML = '';
    if (functionHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align:center;color:#a0aec0;margin-top:20px;font-size:14px;">추가된 함수가 없습니다.</div>';
        return;
    }
    functionHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item'
            + (item.visible ? '' : ' hidden-graph')
            + (item.id === selectedHistoryId ? ' selected' : '');

        let eqString = item.isInverse ? 'x = ' + item.expr.toTex() : 'y = ' + item.expr.toTex();
        let texHtml = '';
        try { texHtml = katex.renderToString(eqString, { throwOnError: false, displayMode: false }); }
        catch { texHtml = eqString; }

        div.innerHTML = `
            <div class="history-item-header">
                <div style="display:flex;align-items:center;width:70%;overflow:hidden;">
                    <div class="history-item-color" style="background-color:${item.color};flex-shrink:0;"></div>
                    <div class="history-item-expr" style="overflow-x:auto;overflow-y:hidden;" title="${eqString}">${texHtml}</div>
                </div>
                <div style="display:flex;gap:5px;flex-shrink:0;">
                    <button class="history-btn toggle-btn" data-id="${item.id}" title="보이기/숨기기">${item.visible ? '👁️' : '🙈'}</button>
                    <button class="history-btn delete-btn"  data-id="${item.id}" title="삭제">❌</button>
                </div>
            </div>`;

        div.addEventListener('click', e => {
            if (e.target.closest('.history-btn')) return;
            selectedHistoryId = item.id;
            updateHistoryUI();
        });
        historyList.appendChild(div);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = parseInt(e.currentTarget.dataset.id);
            const f = functionHistory.find(f => f.id === id);
            if (f) { f.visible = !f.visible; updateHistoryUI(); renderAllExpGraphs(); }
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = parseInt(e.currentTarget.dataset.id);
            functionHistory = functionHistory.filter(f => f.id !== id);
            if (selectedHistoryId === id) selectedHistoryId = null;
            updateHistoryUI(); renderAllExpGraphs();
        });
    });
}

/* ========================================================= */
/* ---- 함수 추가 ---- */
/* ========================================================= */
function getNextColor() {
    const colors = Array.from(colorBtns).map(b => b.dataset.color);
    const idx = colors.indexOf(selectedColor);
    const next = colors[(idx + 1) % colors.length];
    colorBtns.forEach(b => { b.classList.remove('active'); if (b.dataset.color === next) b.classList.add('active'); });
    selectedColor = next;
}

colorBtns.forEach(btn => {
    btn.addEventListener('click', e => {
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedColor = e.target.dataset.color;
    });
});

function addFunction() {
    const exprStr = funcInput.value.trim();
    if (!exprStr) { funcError.innerText = '수식을 입력해주세요.'; return; }
    let expr;
    try {
        expr = math.parse(exprStr);
        /* x=1에서 평가 시도 (x=0은 log 등에서 오류 가능) */
        const testVal = expr.evaluate({ x: 1 });
        funcError.innerText = '';
    } catch {
        funcError.innerText = '수식이 올바르지 않습니다. (예: sin(x), 2^x, log(x), 1/x)';
        return;
    }
    const newId = histIdCounter++;
    functionHistory.push({ id: newId, exprStr, expr, color: selectedColor, visible: true, isInverse: false });
    selectedHistoryId = newId;
    getNextColor();
    funcInput.value = '';
    updateHistoryUI();
    renderAllExpGraphs();
}

/* ========================================================= */
/* ---- 역함수 AST ---- */
/* ========================================================= */
function invertAST(node) {
    function containsX(n) {
        let has = false;
        n.traverse(c => { if (c.isSymbolNode && c.name === 'x') has = true; });
        return has;
    }
    function solve(n, t) {
        if (n.isSymbolNode && n.name === 'x') return t;
        if (n.isParenthesisNode) return solve(n.content, t);
        if (n.isOperatorNode) {
            const [A, B] = n.args;
            if (n.op === '+') { const lx = containsX(A); return solve(lx ? A : B, `(${t})-(${(lx ? B : A).toString()})`); }
            if (n.op === '-') {
                if (n.args.length === 1) return solve(A, `-(${t})`);
                return containsX(A) ? solve(A, `(${t})+(${B.toString()})`) : solve(B, `(${A.toString()})-(${t})`);
            }
            if (n.op === '*') { const lx = containsX(A); return solve(lx ? A : B, `(${t})/(${(lx ? B : A).toString()})`); }
            if (n.op === '/') return containsX(A) ? solve(A, `(${t})*(${B.toString()})`) : solve(B, `(${A.toString()})/(${t})`);
            if (n.op === '^' && !containsX(A)) return solve(B, `log(${t},${A.toString()})`);
        }
        if (n.isFunctionNode) {
            const name = n.fn.name;
            if (name === 'log' || name === 'log10') {
                const base = n.args.length > 1 ? n.args[1].toString() : (name === 'log10' ? '10' : 'e');
                return n.fn.name === 'log' && n.args.length === 1
                    ? solve(n.args[0], `exp(${t})`)
                    : solve(n.args[0], `(${base})^(${t})`);
            }
            if (name === 'exp') return solve(n.args[0], `log(${t})`);
        }
        throw new Error('역함수 변환 불가');
    }
    return math.parse(solve(node, 'x'));
}

/* ========================================================= */
/* ---- 대칭/이동 변환 ---- */
/* ========================================================= */
function applyGlobalTransform(action) {
    if (selectedHistoryId === null) {
        funcError.innerText = '변환할 함수를 목록에서 먼저 선택하세요.';
        setTimeout(() => funcError.innerText = '', 2000);
        return;
    }
    const func = functionHistory.find(f => f.id === selectedHistoryId);
    if (!func) return;

    let newExpr = math.parse(func.expr.toString());
    let newInverse = func.isInverse;
    const repX = n => n.isSymbolNode && n.name === 'x' ? math.parse('(-x)') : n;

    if (action === 'refX') {
        newExpr = newInverse ? newExpr.transform(repX) : math.parse(`-(${newExpr})`);
    } else if (action === 'refY') {
        newExpr = newInverse ? math.parse(`-(${newExpr})`) : newExpr.transform(repX);
    } else if (action === 'refOrigin') {
        newExpr = math.parse(`-(${newExpr.transform(repX)})`);
    } else if (action === 'refYX') {
        if (newInverse) { newInverse = false; }
        else { try { newExpr = invertAST(newExpr); } catch { newInverse = true; } }
    } else if (action === 'shift') {
        const dx = parseFloat(document.getElementById('gShiftX').value) || 0;
        const dy = parseFloat(document.getElementById('gShiftY').value) || 0;
        if (dx === 0 && dy === 0) return;
        if (dx !== 0) {
            const rep = dx > 0 ? `(x-${dx})` : `(x+${-dx})`;
            newExpr = newInverse
                ? math.parse(`(${newExpr})+${dx}`)
                : newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse(rep) : n);
        }
        if (dy !== 0) {
            newExpr = newInverse
                ? newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse(dy > 0 ? `(x-${dy})` : `(x+${-dy})`) : n)
                : math.parse(`(${newExpr})+${dy}`);
        }
    }

    try { newExpr = math.simplify(newExpr); } catch { }
    newExpr = math.parse(newExpr.toString());

    const newId = histIdCounter++;
    functionHistory.push({ id: newId, exprStr: newExpr.toString(), expr: newExpr, color: selectedColor, visible: true, isInverse: newInverse });
    selectedHistoryId = newId;
    getNextColor();
    updateHistoryUI();
    renderAllExpGraphs();
}

/* ========================================================= */
/* ---- 줌 리셋 ---- */
/* ========================================================= */
function resetView() {
    vp = { cx: EXP_CW / 2, cy: EXP_CH / 2, scale: 60 };
    renderAllExpGraphs();
}

/* ========================================================= */
/* ---- 초기화 ---- */
/* ========================================================= */
function initGraph() {
    drawExpGrid();
    updateHistoryUI();

    /* 함수 추가 */
    drawBtn.addEventListener('click', addFunction);
    funcInput.addEventListener('keypress', e => { if (e.key === 'Enter') addFunction(); });

    /* 변환 버튼 */
    document.querySelector('.g-ref-x').addEventListener('click', () => applyGlobalTransform('refX'));
    document.querySelector('.g-ref-y').addEventListener('click', () => applyGlobalTransform('refY'));
    document.querySelector('.g-ref-o').addEventListener('click', () => applyGlobalTransform('refOrigin'));
    document.querySelector('.g-ref-yx').addEventListener('click', () => applyGlobalTransform('refYX'));
    document.querySelector('.g-apply-shift').addEventListener('click', () => applyGlobalTransform('shift'));

    /* 키패드 */
    document.querySelectorAll('.k-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'k-clear') funcInput.value = '';
            else if (btn.id === 'k-back') funcInput.value = funcInput.value.slice(0, -1);
            else funcInput.value += btn.dataset.val;
            funcInput.focus();
        });
    });

    /* ---- 마우스 휠 줌 ---- */
    expCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = expCanvas.getBoundingClientRect();
        const ratio = EXP_CW / rect.width;           // CSS 축소 비율 보정
        const mx = (e.clientX - rect.left) * ratio;
        const my = (e.clientY - rect.top) * ratio;
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        /* 마우스 위치를 기준으로 줌 */
        vp.cx = mx - (mx - vp.cx) * factor;
        vp.cy = my - (my - vp.cy) * factor;
        vp.scale = Math.max(5, Math.min(vp.scale * factor, 2000));
        renderAllExpGraphs();
    }, { passive: false });

    /* ---- 드래그 패닝 ---- */
    expCanvas.addEventListener('mousedown', e => {
        isDragging = true;
        const rect = expCanvas.getBoundingClientRect();
        const ratio = EXP_CW / rect.width;
        dragStart = { x: e.clientX * ratio, y: e.clientY * ratio };
        vpAtDragStart = { cx: vp.cx, cy: vp.cy };
        expCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const rect = expCanvas.getBoundingClientRect();
        const ratio = EXP_CW / rect.width;
        const dx = e.clientX * ratio - dragStart.x;
        const dy = e.clientY * ratio - dragStart.y;
        vp.cx = vpAtDragStart.cx + dx;
        vp.cy = vpAtDragStart.cy + dy;
        renderAllExpGraphs();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        expCanvas.style.cursor = 'crosshair';
    });

    /* ---- 터치 패닝 (태블릿) ---- */
    let lastTouches = null;
    expCanvas.addEventListener('touchstart', e => {
        lastTouches = e.touches;
    }, { passive: true });

    expCanvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const rect = expCanvas.getBoundingClientRect();
        const ratio = EXP_CW / rect.width;

        if (e.touches.length === 1 && lastTouches?.length === 1) {
            /* 1손가락: 패닝 */
            const dx = (e.touches[0].clientX - lastTouches[0].clientX) * ratio;
            const dy = (e.touches[0].clientY - lastTouches[0].clientY) * ratio;
            vp.cx += dx;
            vp.cy += dy;
        } else if (e.touches.length === 2 && lastTouches?.length === 2) {
            /* 2손가락: 핀치 줌 */
            const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            const factor = dist(e.touches) / dist(lastTouches);
            const cx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * ratio;
            const cy = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * ratio;
            vp.cx = cx - (cx - vp.cx) * factor;
            vp.cy = cy - (cy - vp.cy) * factor;
            vp.scale = Math.max(5, Math.min(vp.scale * factor, 2000));
        }
        lastTouches = e.touches;
        renderAllExpGraphs();
    }, { passive: false });

    expCanvas.addEventListener('touchend', () => { lastTouches = null; });

    /* ---- 뷰 리셋 버튼 ---- */
    const resetBtn = document.getElementById('graph-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetView);

    /* 탭 전환 */
    document.querySelector('.index-tab[data-unit="exp"]')?.addEventListener('click', () => {
        setTimeout(renderAllExpGraphs, 50);
    });

    expCanvas.style.cursor = 'crosshair';
}