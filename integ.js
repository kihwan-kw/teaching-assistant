/* ========================================================= */
/* --- Integration (적분: 구분구적법 상합과 하합) Logic --- */
/* ========================================================= */

const iCanvas = document.getElementById('integCanvas');
const iCtx = iCanvas.getContext('2d');
const integFuncInput = document.getElementById('integFuncInput');
const integA = document.getElementById('integA');
const integB = document.getElementById('integB');
const integNSlider = document.getElementById('integNSlider');
const integNVal = document.getElementById('integNVal');
const integError = document.getElementById('integError');
const methodBtns = document.querySelectorAll('.integ-method-btn');

let currentIntegMethod = 'both';
let integExpr = null;

const IW = iCanvas.width;
const IH = iCanvas.height;
const I_PAD = 40;
let mapX, mapY;

function calculateExactIntegral(expr, a, b) {
    let sum = 0, n = 2000, dx = (b - a) / n;
    for (let i = 0; i < n; i++) {
        let x = a + (i + 0.5) * dx;
        try { sum += expr.evaluate({ x }) * dx; } catch (e) { return 0; }
    }
    return sum;
}

function drawInteg() {
    const exprStr = integFuncInput.value.trim();
    let a = parseFloat(integA.value);
    let b = parseFloat(integB.value);
    let n = parseInt(integNSlider.value);

    if (isNaN(a)) a = 0;
    if (isNaN(b)) b = 5;
    if (a >= b) { integError.innerText = "a는 b보다 작아야 합니다."; iCtx.clearRect(0, 0, IW, IH); return; }

    try {
        integExpr = math.parse(exprStr);
        integExpr.evaluate({ x: (a + b) / 2 });
        integError.innerText = "";
    } catch (err) {
        integError.innerText = "올바른 수식을 입력하세요.";
        iCtx.clearRect(0, 0, IW, IH);
        return;
    }

    iCtx.clearRect(0, 0, IW, IH);

    let minX = a - (b - a) * 0.1, maxX = b + (b - a) * 0.1;
    let minY = 0, maxY = 0;
    for (let x = a; x <= b; x += (b - a) / 100) {
        let y = integExpr.evaluate({ x });
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    let yRange = maxY - minY;
    if (yRange === 0) yRange = 10;
    maxY += yRange * 0.2; minY -= yRange * 0.1;
    if (minY > 0) minY = -yRange * 0.1;

    mapX = (x) => I_PAD + ((x - minX) / (maxX - minX)) * (IW - 2 * I_PAD);
    mapY = (y) => IH - I_PAD - ((y - minY) / (maxY - minY)) * (IH - 2 * I_PAD);

    iCtx.lineWidth = 1.5;
    iCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    iCtx.beginPath();
    iCtx.moveTo(mapX(minX), mapY(0)); iCtx.lineTo(mapX(maxX), mapY(0));
    iCtx.moveTo(mapX(0), mapY(minY)); iCtx.lineTo(mapX(0), mapY(maxY));
    iCtx.stroke();

    iCtx.fillStyle = '#718096';
    iCtx.font = '12px Outfit';
    iCtx.fillText('O', mapX(0) - 15, mapY(0) + 15);
    iCtx.fillText('a=' + a, mapX(a) - 10, mapY(0) + 20);
    iCtx.fillText('b=' + b, mapX(b) - 10, mapY(0) + 20);

    let dx = (b - a) / n;
    let upperSum = 0, lowerSum = 0;

    for (let i = 0; i < n; i++) {
        let xStart = a + i * dx, xEnd = a + (i + 1) * dx;
        let maxVal = -Infinity, minVal = Infinity;
        for (let j = 0; j <= 20; j++) {
            let val = integExpr.evaluate({ x: xStart + (j / 20) * dx });
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }
        upperSum += maxVal * dx;
        lowerSum += minVal * dx;

        let px = mapX(xStart), pWidth = mapX(xEnd) - px;

        if (currentIntegMethod === 'upper' || currentIntegMethod === 'both') {
            let pyMax = mapY(maxVal), pHeightMax = mapY(0) - pyMax;
            iCtx.fillStyle = currentIntegMethod === 'both' ? 'rgba(252,129,129,0.2)' : 'rgba(252,129,129,0.4)';
            iCtx.fillRect(px, pyMax, pWidth, pHeightMax);
            iCtx.strokeStyle = 'rgba(229,62,62,0.8)';
            iCtx.lineWidth = 1;
            iCtx.strokeRect(px, pyMax, pWidth, pHeightMax);
        }
        if (currentIntegMethod === 'lower' || currentIntegMethod === 'both') {
            let pyMin = mapY(minVal), pHeightMin = mapY(0) - pyMin;
            iCtx.fillStyle = currentIntegMethod === 'both' ? 'rgba(115,165,255,0.6)' : 'rgba(115,165,255,0.4)';
            iCtx.fillRect(px, pyMin, pWidth, pHeightMin);
            iCtx.strokeStyle = 'rgba(49,130,206,0.8)';
            iCtx.lineWidth = 1;
            iCtx.strokeRect(px, pyMin, pWidth, pHeightMin);
        }
    }

    iCtx.beginPath();
    iCtx.strokeStyle = '#2d3748';
    iCtx.lineWidth = 3;
    let first = true;
    for (let x = minX; x <= maxX; x += (maxX - minX) / 200) {
        let y = integExpr.evaluate({ x });
        if (first) { iCtx.moveTo(mapX(x), mapY(y)); first = false; }
        else iCtx.lineTo(mapX(x), mapY(y));
    }
    iCtx.stroke();

    let exactArea = calculateExactIntegral(integExpr, a, b);
    document.getElementById('integUpperVal').innerText = upperSum.toFixed(4);
    document.getElementById('integLowerVal').innerText = lowerSum.toFixed(4);
    document.getElementById('integDiff').innerText = (upperSum - lowerSum).toFixed(4);
    document.getElementById('integExactVal').innerText = exactArea.toFixed(4);
}

function initInteg() {
    integFuncInput.addEventListener('input', drawInteg);
    integA.addEventListener('input', drawInteg);
    integB.addEventListener('input', drawInteg);
    integNSlider.addEventListener('input', (e) => { integNVal.innerText = e.target.value; drawInteg(); });
    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            methodBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentIntegMethod = e.target.dataset.method;
            drawInteg();
        });
    });
    document.querySelector('.index-tab[data-unit="integ"]').addEventListener('click', () => setTimeout(drawInteg, 50));
    drawInteg();
}