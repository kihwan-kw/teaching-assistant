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

let zoom = 40;
let offsetX = 500;
let offsetY = 350;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function drawExpGrid() {
    eCtx.clearRect(0, 0, EXP_CW, EXP_CH);
    eCtx.lineWidth = 1; eCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';

    let startCol = Math.floor(-offsetX / zoom);
    let endCol = Math.ceil((EXP_CW - offsetX) / zoom);
    for (let i = startCol; i <= endCol; i++) {
        let px = offsetX + i * zoom;
        eCtx.beginPath(); eCtx.moveTo(px, 0); eCtx.lineTo(px, EXP_CH); eCtx.stroke();
    }
    let startRow = Math.floor((offsetY - EXP_CH) / zoom);
    let endRow = Math.ceil(offsetY / zoom);
    for (let i = startRow; i <= endRow; i++) {
        let py = offsetY - i * zoom;
        eCtx.beginPath(); eCtx.moveTo(0, py); eCtx.lineTo(EXP_CW, py); eCtx.stroke();
    }
    eCtx.lineWidth = 2; eCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    eCtx.beginPath(); eCtx.moveTo(0, offsetY); eCtx.lineTo(EXP_CW, offsetY); eCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(offsetX, 0); eCtx.lineTo(offsetX, EXP_CH); eCtx.stroke();

    eCtx.fillStyle = '#718096'; eCtx.font = '12px Outfit, sans-serif';
    let stepSize = zoom < 20 ? 5 : (zoom < 40 ? 2 : 1);
    for (let i = startCol; i <= endCol; i++) {
        if (i !== 0 && i % stepSize === 0) eCtx.fillText(i, offsetX + i * zoom - 5, offsetY + 15);
    }
    for (let i = startRow; i <= endRow; i++) {
        if (i !== 0 && i % stepSize === 0) eCtx.fillText(i, offsetX + 8, offsetY - i * zoom + 4);
    }
    eCtx.fillText('O', offsetX - 12, offsetY + 15);
}

function renderAllExpGraphs() {
    drawExpGrid();
    document.getElementById('graphLabels').innerHTML = '';

    const startX = (-offsetX / zoom) - 1;
    const endX = ((EXP_CW - offsetX) / zoom) + 1;
    const step = 1 / zoom;

    functionHistory.forEach(item => {
        if (!item.visible) return;
        eCtx.beginPath(); eCtx.lineWidth = 3; eCtx.strokeStyle = item.color;
        let firstPoint = true, prevY = null;

        for (let t = startX; t <= endX; t += step) {
            try {
                let val = item.expr.evaluate({ x: t });
                if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) { firstPoint = true; continue; }
                let px = offsetX + t * zoom, py = offsetY - val * zoom;
                if (item.isInverse) { px = offsetX + val * zoom; py = offsetY - t * zoom; }

                if (prevY !== null && Math.abs(py - prevY) > EXP_CH * 0.8) { firstPoint = true; continue; }

                if (firstPoint) { eCtx.moveTo(px, py); firstPoint = false; }
                else eCtx.lineTo(px, py);
                prevY = py;
            } catch (e) { firstPoint = true; }
        }
        eCtx.stroke();
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

    const canvas = document.getElementById('expCanvas');

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleRatio = canvas.width / rect.width;
        const mx = (e.clientX - rect.left) * scaleRatio;
        const my = (e.clientY - rect.top) * scaleRatio;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        offsetX = mx - (mx - offsetX) * delta;
        offsetY = my - (my - offsetY) * delta;
        zoom *= delta;
        renderAllExpGraphs();
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const scaleRatio = canvas.width / rect.width;
        lastMouse.x = e.clientX * scaleRatio;
        lastMouse.y = e.clientY * scaleRatio;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const scaleRatio = canvas.width / rect.width;
        const mx = e.clientX * scaleRatio;
        const my = e.clientY * scaleRatio;
        offsetX += mx - lastMouse.x;
        offsetY += my - lastMouse.y;
        lastMouse.x = mx;
        lastMouse.y = my;
        renderAllExpGraphs();
    });

    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);
}