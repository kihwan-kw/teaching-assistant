(function () {
/* ========================================================= */
/* --- Trigonometry (삼각함수) Logic --- */
/* ========================================================= */

const canvas = document.getElementById('mathCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('angleSlider');
const rSlider = document.getElementById('rSlider');
const rVal = document.getElementById('rVal');
const rSliderWrapper = document.getElementById('rSliderWrapper');
const infoText = document.getElementById('infoText');
const resetBtn = document.getElementById('resetBtn');
const tabBtns = document.querySelectorAll('#unit-trig .tab-btn');

const activeColors = {
    'radian': '#4fd1c5',
    'sin': '#ff8bad',
    'cos': '#73a5ff',
    'tan': '#ffb86c',
    'definition': '#b19cd9'
};

let CX = 150;
let CY = 200;
let R_BASE = 108;

const GRAPH_R_BASE = 108;
const GX = 312;
const GY = 200;
const X_SCALE_EXT = (Math.PI / 180) * GRAPH_R_BASE;
const G_WIDTH = 720 * X_SCALE_EXT;
const G_ORIGIN_X = GX + G_WIDTH / 2;

let currentFunc = 'radian';
let currentAngle = 0;
let currentR = 1.0;
let minReachedAngle = 0;
let maxReachedAngle = 0;

function initTrig() {
    slider.addEventListener('input', (e) => {
        currentAngle = parseInt(e.target.value);
        if (currentAngle > maxReachedAngle) maxReachedAngle = currentAngle;
        if (currentAngle < minReachedAngle) minReachedAngle = currentAngle;
        drawTrig();
        updateTextExtended();
    });

    rSlider.addEventListener('input', (e) => {
        currentR = parseFloat(e.target.value);
        rVal.innerText = currentR.toFixed(1);
        drawTrig();
    });

    resetBtn.addEventListener('click', () => {
        slider.value = 0;
        currentAngle = 0;
        minReachedAngle = 0;
        maxReachedAngle = 0;
        rSlider.value = 1.0;
        currentR = 1.0;
        rVal.innerText = "1.0";
        drawTrig();
        updateTextExtended();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFunc = e.target.dataset.func;

            if (currentFunc === 'radian' || currentFunc === 'definition') {
                CX = canvas.width / 2 - 250;
                CY = canvas.height / 2;
                R_BASE = 180;
                rSliderWrapper.style.display = 'flex';
            } else {
                CX = 150;
                CY = 200;
                R_BASE = 108;
                rSliderWrapper.style.display = 'none';
                currentR = 1.0;
                rSlider.value = 1.0;
                rVal.innerText = "1.0";
            }

            if (currentFunc === 'radian') {
                document.getElementById('radianControls').style.display = 'flex';
            } else {
                document.getElementById('radianControls').style.display = 'none';
            }

            slider.value = 0;
            currentAngle = 0;
            minReachedAngle = 0;
            maxReachedAngle = 0;
            drawTrig();
            updateTextExtended();
        });
    });

    const setAngleFromRad = (radVal) => {
        let deg = radVal * 180 / Math.PI;
        currentAngle = deg;
        slider.value = Math.round(deg);
        drawTrig();
        updateTextExtended();
    };

    document.getElementById('btnRad1').addEventListener('click', () => setAngleFromRad(1));
    document.getElementById('btnRad2').addEventListener('click', () => setAngleFromRad(2));
    document.getElementById('btnRad3').addEventListener('click', () => setAngleFromRad(3));
    document.getElementById('btnRadPi').addEventListener('click', () => setAngleFromRad(Math.PI));

    CX = canvas.width / 2 - 250;
    CY = canvas.height / 2;
    R_BASE = 180;
    rSliderWrapper.style.display = 'flex';
    document.getElementById('radianControls').style.display = 'flex';

    drawTrig();
    updateTextExtended();
}

function drawTrig() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    if (currentFunc === 'radian') {
        drawRadianConcept();
    } else if (currentFunc === 'definition') {
        drawDefinition();
    } else {
        drawUnitCircle();
        drawTraceExtended();
        drawCurrentStateExtended();
    }
}

function drawAxes() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(CX - R_BASE - 60, CY); ctx.lineTo(CX + R_BASE + 60, CY);
    ctx.moveTo(CX, CY - R_BASE - 60); ctx.lineTo(CX, CY + R_BASE + 60);
    ctx.stroke();

    ctx.fillStyle = '#718096';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText('1', CX + R_BASE + 8, CY - 8);
    ctx.fillText('-1', CX - R_BASE - 25, CY - 8);
    ctx.fillText('1', CX + 8, CY - R_BASE - 8);
    ctx.fillText('-1', CX + 8, CY + R_BASE + 20);

    if (currentFunc === 'sin' || currentFunc === 'cos' || currentFunc === 'tan') {
        ctx.beginPath();
        ctx.moveTo(GX - 30, GY); ctx.lineTo(GX + G_WIDTH + 30, GY);
        ctx.moveTo(G_ORIGIN_X, 30); ctx.lineTo(G_ORIGIN_X, canvas.height - 30);
        ctx.stroke();

        const angles = [
            { deg: -360, label: '-2π' }, { deg: -270, label: '-3π/2' }, { deg: -180, label: '-π' }, { deg: -90, label: '-π/2' },
            { deg: 90, label: 'π/2' }, { deg: 180, label: 'π' }, { deg: 270, label: '3π/2' }, { deg: 360, label: '2π' }
        ];

        ctx.textAlign = 'center';
        angles.forEach(a => {
            const x = G_ORIGIN_X + a.deg * X_SCALE_EXT;
            ctx.beginPath();
            ctx.moveTo(x, GY - 5); ctx.lineTo(x, GY + 5);
            ctx.stroke();
            ctx.fillStyle = '#718096';
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillText(a.label, x, GY + 22);
            ctx.fillStyle = '#a0aec0';
            ctx.font = '12px Outfit, sans-serif';
            ctx.fillText(a.deg + '°', x, GY + 38);
        });

        ctx.fillStyle = '#718096';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('0', G_ORIGIN_X, GY + 22);
        ctx.fillStyle = '#a0aec0';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('0°', G_ORIGIN_X, GY + 38);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#718096';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('1', G_ORIGIN_X - 18, GY - R_BASE + 5);
        ctx.fillText('-1', G_ORIGIN_X - 22, GY + R_BASE + 5);
    }
}

function drawUnitCircle() {
    ctx.beginPath();
    ctx.arc(CX, CY, R_BASE, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();
}

function drawCoordinates(x, y) {
    ctx.fillStyle = '#4a5568';
    if (currentFunc === 'sin' || currentFunc === 'cos' || currentFunc === 'tan') {
        ctx.font = '600 18px Outfit, sans-serif';
        ctx.fillText(`x = ${x.toFixed(2)}`, 20, 40);
        ctx.fillText(`y = ${y.toFixed(2)}`, 20, 70);
    } else {
        ctx.font = '800 24px Outfit, sans-serif';
        let startX = CX - R_BASE - 150;
        let startY = CY - R_BASE + 20;
        ctx.fillText(`x = ${x.toFixed(2)}`, startX, startY);
        ctx.fillText(`y = ${y.toFixed(2)}`, startX, startY + 40);
    }
}

function drawPoint(x, y, borderCol, radius = 5, fillCol = '#ffffff') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillCol;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderCol;
    ctx.stroke();
}

function drawDefinition() {
    let r_pixel = currentR * R_BASE;
    ctx.beginPath();
    ctx.arc(CX, CY, r_pixel, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    let rad = currentAngle * Math.PI / 180;
    let px = CX + r_pixel * Math.cos(rad);
    let py = CY - r_pixel * Math.sin(rad);
    let val_x = currentR * Math.cos(rad);
    let val_y = currentR * Math.sin(rad);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(px, CY);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(177, 156, 217, 0.15)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = activeColors['definition'];
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(px, py); ctx.lineTo(px, CY);
    ctx.moveTo(px, py); ctx.lineTo(CX, py);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    drawPoint(px, py, activeColors['definition'], 5, '#ffffff');

    ctx.fillStyle = '#4a5568';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText(`P(x,y)`, px + 10, py - 10);
    ctx.fillText('x', px, CY + 20);
    ctx.fillText('y', CX - 20, py + 5);

    ctx.beginPath();
    ctx.arc(CX, CY, 35, 0, -rad, currentAngle > 0);
    ctx.strokeStyle = activeColors['definition'];
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = activeColors['definition'];
    let labelX = CX + 50 * Math.cos(-rad / 2);
    let labelY = CY + 50 * Math.sin(-rad / 2);
    ctx.fillText(`${currentAngle}°`, labelX, labelY);
    ctx.fillText('α', CX + 15, CY - 10);
    ctx.fillStyle = '#4a5568';
    ctx.fillText(`r = ${currentR.toFixed(1)}`, CX + 15, CY - r_pixel - 15);
    drawCoordinates(val_x, val_y);

    const sinVal = Math.sin(rad);
    const cosVal = Math.cos(rad);
    const tanVal = Math.tan(rad);
    let tanStr = tanVal.toFixed(2);
    if (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270) tanStr = "∞";

    let textStartX = CX + R_BASE + 80;
    let textStartY = CY - 40;
    ctx.font = '800 28px Outfit, sans-serif';
    ctx.fillStyle = activeColors['sin'];
    ctx.fillText(`sin(${currentAngle}°) = ${sinVal.toFixed(2)}`, textStartX, textStartY);
    ctx.fillStyle = activeColors['cos'];
    ctx.fillText(`cos(${currentAngle}°) = ${cosVal.toFixed(2)}`, textStartX, textStartY + 50);
    ctx.fillStyle = activeColors['tan'];
    ctx.fillText(`tan(${currentAngle}°) = ${tanStr}`, textStartX, textStartY + 100);
}

function drawRadianConcept() {
    let r_pixel = currentR * R_BASE;
    ctx.beginPath();
    ctx.arc(CX, CY, r_pixel, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    let rad = currentAngle * Math.PI / 180;
    let absRad = Math.abs(rad);
    let sign = currentAngle >= 0 ? -1 : 1;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + r_pixel, CY);
    ctx.strokeStyle = '#a0aec0';
    ctx.lineWidth = 2;
    ctx.stroke();

    let px = CX + r_pixel * Math.cos(rad);
    let py = CY - r_pixel * Math.sin(rad);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#4a5568';
    ctx.stroke();

    let fullRads = Math.floor(absRad);
    let colors = ['#4fd1c5', '#38b2ac', '#319795', '#285e61', '#234e52', '#1d4044'];

    for (let i = 0; i < fullRads; i++) {
        let startA = sign * i;
        let endA = sign * (i + 1);
        let midA = sign * (i + 0.5);

        ctx.beginPath();
        ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 6;
        ctx.stroke();

        let outX = CX + (r_pixel + 20) * Math.cos(midA);
        let outY = CY + (r_pixel + 20) * Math.sin(midA);
        ctx.fillStyle = colors[i % colors.length];
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`r`, outX, outY + 5);

        ctx.beginPath();
        ctx.arc(CX, CY, 40 + i * 2, startA, endA, sign < 0);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2;
        ctx.stroke();

        let inX = CX + 70 * Math.cos(midA);
        let inY = CY + 70 * Math.sin(midA);
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText(`1 rad`, inX, inY + 4);
    }

    if (absRad > fullRads) {
        let startA = sign * fullRads;
        let endA = sign * absRad;
        let midA = (startA + endA) / 2;
        let diffRad = absRad - fullRads;

        ctx.beginPath();
        ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
        ctx.strokeStyle = '#fc8181';
        ctx.lineWidth = 6;
        ctx.stroke();

        let outX = CX + (r_pixel + 25) * Math.cos(midA);
        let outY = CY + (r_pixel + 25) * Math.sin(midA);
        ctx.fillStyle = '#fc8181';
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${diffRad.toFixed(2)} r`, outX, outY + 5);

        ctx.beginPath();
        ctx.arc(CX, CY, 40 + fullRads * 2, startA, endA, sign < 0);
        ctx.strokeStyle = '#fc8181';
        ctx.lineWidth = 2;
        ctx.stroke();

        let inX = CX + 70 * Math.cos(midA);
        let inY = CY + 70 * Math.sin(midA);
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillText(`${diffRad.toFixed(2)} rad`, inX, inY + 4);
    }
    ctx.textAlign = 'left';

    let rightX = CX + R_BASE + 80;
    let rightY = CY - 80;

    ctx.fillStyle = '#2d3748';
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.fillText(`호도법 (Radian Measure)`, rightX, rightY);
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText(`반지름 길이를 단위로 하여 중심각을 재는 방법`, rightX, rightY + 30);
    ctx.fillStyle = '#4a5568';
    ctx.fillText(`반지름 r = ${currentR.toFixed(1)}`, rightX, rightY + 70);
    ctx.fillText(`호의 길이 l = `, rightX, rightY + 95);
    ctx.fillStyle = '#4fd1c5';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillText(`${absRad.toFixed(2)}`, rightX + 105, rightY + 95);
    ctx.fillStyle = '#4a5568';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText(` × r`, rightX + 145, rightY + 95);
    ctx.fillStyle = '#4fd1c5';
    ctx.font = '800 22px Outfit, sans-serif';
    ctx.fillText(`중심각 = ${absRad.toFixed(2)} 라디안`, rightX, rightY + 140);
    ctx.fillStyle = '#a0aec0';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText(`( 1 라디안 ≈ 57.3° )`, rightX + 220, rightY + 140);

    if (Math.abs(currentAngle) === 180) {
        ctx.fillStyle = '#e53e3e';
        ctx.font = '800 28px Outfit, sans-serif';
        ctx.fillText(`π 라디안 = 180°`, rightX, rightY + 190);
        ctx.font = '600 16px Outfit, sans-serif';
        ctx.fillStyle = '#718096';
        ctx.fillText(`(반원의 호의 길이는 πr 이므로, 중심각은 π 라디안)`, rightX, rightY + 220);
    }
}

function drawTraceExtended() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(GX, 0, G_WIDTH + 40, canvas.height);
    ctx.clip();

    let activeColor = activeColors[currentFunc];
    ctx.beginPath();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 4;
    ctx.setLineDash([]);

    let minAngle = minReachedAngle, maxAngle = maxReachedAngle;

    for (let a = minAngle; a <= maxAngle; a++) {
        let rad = a * Math.PI / 180;
        let x = G_ORIGIN_X + a * X_SCALE_EXT;
        let y;

        if (currentFunc === 'sin') y = GY - GRAPH_R_BASE * Math.sin(rad);
        else if (currentFunc === 'cos') y = GY - GRAPH_R_BASE * Math.cos(rad);
        else if (currentFunc === 'tan') y = GY - GRAPH_R_BASE * Math.tan(rad);

        if (currentFunc === 'tan' && (a === 90 || a === -90 || a === 270 || a === -270)) {
            ctx.stroke(); ctx.beginPath(); continue;
        }
        if (a === minAngle || (currentFunc === 'tan' && (a === minAngle + 1))) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawCurrentStateExtended() {
    let activeColor = activeColors[currentFunc];
    let rad = currentAngle * Math.PI / 180;
    let px = CX + R_BASE * Math.cos(rad);
    let py = CY - R_BASE * Math.sin(rad);
    let gx = G_ORIGIN_X + currentAngle * X_SCALE_EXT;
    let gy;

    drawCoordinates(Math.cos(rad), Math.sin(rad));

    if (currentFunc === 'sin') gy = GY - GRAPH_R_BASE * Math.sin(rad);
    else if (currentFunc === 'cos') gy = GY - GRAPH_R_BASE * Math.cos(rad);
    else if (currentFunc === 'tan') gy = GY - GRAPH_R_BASE * Math.tan(rad);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CX, CY, 30, 0, -rad, currentAngle > 0);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineWidth = 2;

    if (currentFunc === 'sin') {
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px, CY);
        ctx.strokeStyle = activeColor;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(gx, gy);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    } else if (currentFunc === 'cos') {
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px, CY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(CX, CY); ctx.lineTo(px, CY);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(gx, gy);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    } else if (currentFunc === 'tan') {
        let tx = CX + R_BASE;
        if (currentAngle !== 90 && currentAngle !== -90 && currentAngle !== 270 && currentAngle !== -270) {
            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(tx, gy);
            ctx.strokeStyle = 'rgba(255, 184, 108, 0.4)';
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, CY); ctx.lineTo(tx, gy);
            ctx.strokeStyle = activeColor;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, gy); ctx.lineTo(gx, gy);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            drawPoint(tx, gy, activeColor, 4, '#ffffff');
        }
    }

    drawPoint(px, py, activeColor, 5, '#ffffff');

    if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) return;
    if (gy >= 0 && gy <= canvas.height) drawPoint(gx, gy, activeColor, 5, '#ffffff');
}

function updateTextExtended() {
    if (currentFunc === 'definition' || currentFunc === 'radian') {
        infoText.style.display = 'none';
        return;
    }
    infoText.style.display = '';

    let rad = currentAngle * Math.PI / 180;
    let val;
    let displayVal = "";
    let valColor = activeColors[currentFunc];

    if (currentFunc === 'sin') val = Math.sin(rad);
    else if (currentFunc === 'cos') val = Math.cos(rad);
    else if (currentFunc === 'tan') val = Math.tan(rad);

    if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
        displayVal = "∞";
    } else {
        displayVal = val.toFixed(2);
    }

    infoText.style.color = '#2d3748';
    infoText.innerHTML = `${currentFunc}(${currentAngle}°) = <span style="color: ${valColor};">${displayVal}</span>`;
}

    window.initTrig = initTrig;
    window.drawTrig  = drawTrig;
})();