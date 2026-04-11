/* ========================================================= */
/* --- Function Graph (함수 그래프 그리기) Logic --- */
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
const EXP_CX = EXP_CW / 2;
const EXP_CY = EXP_CH / 2;
const UNIT_PX = 40;

let selectedColor = '#ff8bad';
let functionHistory = [];
let histIdCounter = 0;
let selectedHistoryId = null;

function getNextColor() {
    let colors = Array.from(colorBtns).map(b => b.dataset.color);
    let currIdx = colors.indexOf(selectedColor);
    let nextIdx = (currIdx + 1) % colors.length;
    let nextColor = colors[nextIdx];
    colorBtns.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.color === nextColor) b.classList.add('active');
    });
    selectedColor = nextColor;
}

colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedColor = e.target.dataset.color;
    });
});

function drawExpGrid() {
    eCtx.clearRect(0, 0, EXP_CW, EXP_CH);
    eCtx.lineWidth = 1;
    eCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    for (let x = 0; x <= EXP_CW; x += UNIT_PX) {
        eCtx.beginPath(); eCtx.moveTo(x, 0); eCtx.lineTo(x, EXP_CH); eCtx.stroke();
    }
    for (let y = 0; y <= EXP_CH; y += UNIT_PX) {
        eCtx.beginPath(); eCtx.moveTo(0, y); eCtx.lineTo(EXP_CW, y); eCtx.stroke();
    }
    eCtx.lineWidth = 2;
    eCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    eCtx.beginPath();
    eCtx.moveTo(0, EXP_CY); eCtx.lineTo(EXP_CW, EXP_CY);
    eCtx.moveTo(EXP_CX, 0); eCtx.lineTo(EXP_CX, EXP_CH);
    eCtx.stroke();
    eCtx.fillStyle = '#718096';
    eCtx.font = '12px Outfit, sans-serif';
    for (let i = -15; i <= 15; i++) {
        if (i !== 0) {
            let px = EXP_CX + i * UNIT_PX;
            if (px >= 0 && px <= EXP_CW) eCtx.fillText(i, px - 4, EXP_CY + 15);
            let py = EXP_CY - i * UNIT_PX;
            if (py >= 0 && py <= EXP_CH) eCtx.fillText(i, EXP_CX + 8, py + 4);
        }
    }
    eCtx.fillText('O', EXP_CX - 12, EXP_CY + 15);
    eCtx.fillText('x', EXP_CW - 15, EXP_CY - 10);
    eCtx.fillText('y', EXP_CX + 10, 15);
}

function renderAllExpGraphs() {
    drawExpGrid();
    document.getElementById('graphLabels').innerHTML = '';
    const startX = -15, endX = 15, step = 0.05;

    functionHistory.forEach(item => {
        if (!item.visible) return;
        eCtx.beginPath();
        eCtx.lineWidth = 3;
        eCtx.strokeStyle = item.color;
        let labelCandidates = [];

        function getPt(t) {
            let val;
            try { val = item.expr.evaluate({ x: t }); } catch (e) { return null; }
            if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return null;
            let px, py;
            if (item.isInverse) {
                px = EXP_CX + val * UNIT_PX;
                py = EXP_CY - t * UNIT_PX;
            } else {
                px = EXP_CX + t * UNIT_PX;
                py = EXP_CY - val * UNIT_PX;
            }
            return { x: px, y: py, t, val };
        }

        let rawPoints = [];
        for (let t = startX; t <= endX; t += step) rawPoints.push(getPt(t));

        let refinedPoints = [];
        for (let i = 0; i < rawPoints.length - 1; i++) {
            let p1 = rawPoints[i], p2 = rawPoints[i + 1];
            refinedPoints.push(p1);
            if ((p1 === null && p2 !== null) || (p1 !== null && p2 === null)) {
                let validT = p1 ? startX + i * step : startX + (i + 1) * step;
                let invalidT = p1 ? startX + (i + 1) * step : startX + i * step;
                let extra = [];
                for (let d = 0; d < 14; d++) {
                    let midT = (validT + invalidT) / 2;
                    let midPt = getPt(midT);
                    if (midPt) { extra.push(midPt); validT = midT; }
                    else invalidT = midT;
                }
                refinedPoints.push(...(p1 !== null ? extra : extra.reverse()));
            }
        }
        refinedPoints.push(rawPoints[rawPoints.length - 1]);

        let firstPoint = true, prevPx = null, prevPy = null;
        for (let i = 0; i < refinedPoints.length; i++) {
            let pt = refinedPoints[i];
            if (!pt) { firstPoint = true; continue; }
            if (item.isInverse) {
                if (prevPx !== null && Math.abs(pt.x - prevPx) > EXP_CW / 2) firstPoint = true;
            } else {
                if (prevPy !== null && Math.abs(pt.y - prevPy) > EXP_CH / 2) firstPoint = true;
            }
            if (firstPoint) { eCtx.moveTo(pt.x, pt.y); firstPoint = false; }
            else eCtx.lineTo(pt.x, pt.y);
            prevPx = pt.x; prevPy = pt.y;
            if (pt.x >= 0 && pt.x <= EXP_CW && pt.y >= 0 && pt.y <= EXP_CH) labelCandidates.push({ x: pt.x, y: pt.y });
        }
        eCtx.stroke();

        if (labelCandidates.length > 0) {
            let targetPt = labelCandidates[Math.floor(labelCandidates.length * 0.85)];
            if (targetPt.x > EXP_CW - 80) targetPt.x = EXP_CW - 80;
            if (targetPt.y < 20) targetPt.y = 20;
            let eqString = item.isInverse
                ? 'x = ' + item.expr.clone().transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('y') : n).toTex()
                : 'y = ' + item.expr.toTex();
            let labelDiv = document.createElement('div');
            labelDiv.style.cssText = `position:absolute;left:${targetPt.x + 15}px;top:${targetPt.y - 25}px;color:${item.color};font-size:18px;text-shadow:0 0 4px rgba(255,255,255,0.9)`;
            katex.render('\\textcolor{' + item.color + '}{' + eqString + '}', labelDiv, { throwOnError: false });
            document.getElementById('graphLabels').appendChild(labelDiv);
        }
    });
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    if (functionHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align:center;color:#a0aec0;margin-top:20px;font-size:14px;">추가된 함수가 없습니다.</div>';
        return;
    }
    functionHistory.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item' + (item.visible ? '' : ' hidden-graph') + (item.id === selectedHistoryId ? ' selected' : '');
        let eqString = item.isInverse ? 'x = ' + item.expr.toTex() : 'y = ' + item.expr.toTex();
        let texHtml = '';
        try { texHtml = katex.renderToString(eqString, { throwOnError: false, displayMode: false }); }
        catch (e) { texHtml = eqString; }
        div.innerHTML = `
            <div class="history-item-header">
                <div style="display:flex;align-items:center;width:70%;overflow:hidden;">
                    <div class="history-item-color" style="background-color:${item.color};flex-shrink:0;"></div>
                    <div class="history-item-expr" style="overflow-x:auto;overflow-y:hidden;" title="${eqString}">${texHtml}</div>
                </div>
                <div style="display:flex;gap:5px;flex-shrink:0;">
                    <button class="history-btn toggle-btn" data-id="${item.id}" title="보이기/숨기기">${item.visible ? '👁️' : '🙈'}</button>
                    <button class="history-btn delete-btn" data-id="${item.id}" title="삭제">❌</button>
                </div>
            </div>`;
        div.addEventListener('click', (e) => {
            if (e.target.closest('.history-btn')) return;
            selectedHistoryId = item.id;
            updateHistoryUI();
        });
        historyList.appendChild(div);
    });
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const func = functionHistory.find(f => f.id === id);
            if (func) { func.visible = !func.visible; updateHistoryUI(); renderAllExpGraphs(); }
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            functionHistory = functionHistory.filter(f => f.id !== id);
            if (selectedHistoryId === id) selectedHistoryId = null;
            updateHistoryUI(); renderAllExpGraphs();
        });
    });
}

function addFunction() {
    const exprStr = funcInput.value.trim();
    if (!exprStr) { funcError.innerText = "수식을 입력해주세요."; return; }
    let expr;
    try {
        expr = math.parse(exprStr);
        expr.evaluate({ x: 1 });
        funcError.innerText = "";
    } catch (err) {
        funcError.innerText = "수식이 올바르지 않습니다. (예: sin(x), 2^x, sqrt(x), abs(x))";
        return;
    }
    let newId = histIdCounter++;
    functionHistory.push({ id: newId, exprStr, expr, color: selectedColor, visible: true, isInverse: false });
    selectedHistoryId = newId;
    getNextColor();
    funcInput.value = '';
    updateHistoryUI();
    renderAllExpGraphs();
}

function invertAST(node) {
    function containsX(n) {
        let hasX = false;
        n.traverse(child => { if (child.isSymbolNode && child.name === 'x') hasX = true; });
        return hasX;
    }
    function solve(n, targetStr) {
        if (n.isSymbolNode && n.name === 'x') return targetStr;
        if (n.isParenthesisNode) return solve(n.content, targetStr);
        if (n.isOperatorNode) {
            if (n.op === '+') {
                let lx = containsX(n.args[0]);
                let A = lx ? n.args[0] : n.args[1], B = lx ? n.args[1] : n.args[0];
                return solve(A, `(${targetStr}) - (${B.toString()})`);
            }
            if (n.op === '-') {
                if (n.args.length === 1) return solve(n.args[0], `-(${targetStr})`);
                let lx = containsX(n.args[0]);
                return lx ? solve(n.args[0], `(${targetStr}) + (${n.args[1].toString()})`)
                    : solve(n.args[1], `(${n.args[0].toString()}) - (${targetStr})`);
            }
            if (n.op === '*') {
                let lx = containsX(n.args[0]);
                let A = lx ? n.args[0] : n.args[1], B = lx ? n.args[1] : n.args[0];
                return solve(A, `(${targetStr}) / (${B.toString()})`);
            }
            if (n.op === '/') {
                return containsX(n.args[0])
                    ? solve(n.args[0], `(${targetStr}) * (${n.args[1].toString()})`)
                    : solve(n.args[1], `(${n.args[0].toString()}) / (${targetStr})`);
            }
            if (n.op === '^' && !containsX(n.args[0]))
                return solve(n.args[1], `log(${targetStr}, ${n.args[0].toString()})`);
        }
        if (n.isFunctionNode) {
            if (n.fn.name === 'log' || n.fn.name === 'log10') {
                let base = n.args.length > 1 ? n.args[1].toString() : (n.fn.name === 'log10' ? '10' : 'e');
                return (n.fn.name === 'log' && n.args.length === 1)
                    ? solve(n.args[0], `exp(${targetStr})`)
                    : solve(n.args[0], `(${base})^(${targetStr})`);
            }
            if (n.fn.name === 'exp') return solve(n.args[0], `log(${targetStr})`);
        }
        throw new Error('Unsupported AST format for algebraic inversion.');
    }
    return math.parse(solve(node, 'x'));
}

function applyGlobalTransform(action) {
    if (selectedHistoryId === null) {
        funcError.innerText = "대칭/평행 이동할 함수를 좌측 목록에서 선택해주신 뒤 눌러주세요.";
        setTimeout(() => funcError.innerText = "", 2000);
        return;
    }
    const func = functionHistory.find(f => f.id === selectedHistoryId);
    if (!func) return;

    let newExpr = math.parse(func.expr.toString());
    let newIsInverse = func.isInverse;

    if (action === 'refX') {
        newExpr = newIsInverse
            ? newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('(-x)') : n)
            : math.parse(`-(${newExpr.toString()})`);
    } else if (action === 'refY') {
        newExpr = newIsInverse
            ? math.parse(`-(${newExpr.toString()})`)
            : newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('(-x)') : n);
    } else if (action === 'refOrigin') {
        newExpr = newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('(-x)') : n);
        newExpr = math.parse(`-(${newExpr.toString()})`);
    } else if (action === 'refYX') {
        if (newIsInverse) {
            newIsInverse = false;
        } else {
            try { newExpr = invertAST(newExpr); newIsInverse = false; }
            catch (e) { newIsInverse = true; }
        }
    } else if (action === 'shift') {
        let dx = parseFloat(document.getElementById('gShiftX').value) || 0;
        let dy = parseFloat(document.getElementById('gShiftY').value) || 0;
        if (dx === 0 && dy === 0) return;
        if (dx !== 0) {
            if (newIsInverse) newExpr = math.parse(`(${newExpr.toString()}) + ${dx}`);
            else {
                let rep = dx > 0 ? `(x - ${dx})` : `(x + ${-dx})`;
                newExpr = newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse(rep) : n);
            }
        }
        if (dy !== 0) {
            if (newIsInverse) {
                let rep = dy > 0 ? `(x - ${dy})` : `(x + ${-dy})`;
                newExpr = newExpr.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse(rep) : n);
            } else newExpr = math.parse(`(${newExpr.toString()}) + ${dy}`);
        }
    }

    try { newExpr = math.simplify(newExpr); } catch (e) { }
    newExpr = math.parse(newExpr.toString());

    let newId = histIdCounter++;
    functionHistory.push({ id: newId, exprStr: newExpr.toString(), expr: newExpr, color: selectedColor, visible: true, isInverse: newIsInverse });
    selectedHistoryId = newId;
    getNextColor();
    updateHistoryUI();
    renderAllExpGraphs();
}

function initGraph() {
    drawExpGrid();
    updateHistoryUI();

    drawBtn.addEventListener('click', addFunction);
    funcInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addFunction(); });

    document.querySelector('.g-ref-x').addEventListener('click', () => applyGlobalTransform('refX'));
    document.querySelector('.g-ref-y').addEventListener('click', () => applyGlobalTransform('refY'));
    document.querySelector('.g-ref-o').addEventListener('click', () => applyGlobalTransform('refOrigin'));
    document.querySelector('.g-ref-yx').addEventListener('click', () => applyGlobalTransform('refYX'));
    document.querySelector('.g-apply-shift').addEventListener('click', () => applyGlobalTransform('shift'));

    document.querySelectorAll('.k-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'k-clear') funcInput.value = '';
            else if (btn.id === 'k-back') funcInput.value = funcInput.value.slice(0, -1);
            else funcInput.value += btn.dataset.val;
            funcInput.focus();
        });
    });

    document.querySelector('.index-tab[data-unit="exp"]').addEventListener('click', () => {
        setTimeout(renderAllExpGraphs, 50);
    });
}