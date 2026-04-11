const canvas = document.getElementById('mathCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('angleSlider');
const rSlider = document.getElementById('rSlider');
const rVal = document.getElementById('rVal');
const rSliderWrapper = document.getElementById('rSliderWrapper');
const infoText = document.getElementById('infoText');
const resetBtn = document.getElementById('resetBtn');
const tabBtns = document.querySelectorAll('.tab-btn');

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

function init() {
    const indexTabs = document.querySelectorAll('.index-tab');
    const unitContents = document.querySelectorAll('.unit-content');

    indexTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            indexTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const targetUnit = e.target.dataset.unit;
            unitContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === 'unit-' + targetUnit) {
                    content.classList.add('active');
                }
            });
        });
    });

    slider.addEventListener('input', (e) => {
        currentAngle = parseInt(e.target.value);
        if (currentAngle > maxReachedAngle) maxReachedAngle = currentAngle;
        if (currentAngle < minReachedAngle) minReachedAngle = currentAngle;
        draw();
        updateTextExtended();
    });

    rSlider.addEventListener('input', (e) => {
        currentR = parseFloat(e.target.value);
        rVal.innerText = currentR.toFixed(1);
        draw();
    });

    resetBtn.addEventListener('click', () => {
        slider.value = 0;
        currentAngle = 0;
        minReachedAngle = 0;
        maxReachedAngle = 0;
        rSlider.value = 1.0;
        currentR = 1.0;
        rVal.innerText = "1.0";
        draw();
        updateTextExtended();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFunc = e.target.dataset.func;

            if (currentFunc === 'radian' || currentFunc === 'definition') {
                // 호도법 & 정의 탭: 원을 화면 중앙 쯤으로 옮기고 키움
                CX = canvas.width / 2 - 250;
                CY = canvas.height / 2;
                R_BASE = 180;
                rSliderWrapper.style.display = 'flex';
            } else {
                // 사인/코사인/탄젠트 탭: 원을 다시 좌측으로, 원래 크기로
                CX = 150;
                CY = 200;
                R_BASE = 108;
                rSliderWrapper.style.display = 'none';
                currentR = 1.0;
                rSlider.value = 1.0;
                rVal.innerText = "1.0";
            }

            // 호도법 탭일 때만 퀵 버튼 표시
            if (currentFunc === 'radian') {
                document.getElementById('radianControls').style.display = 'flex';
            } else {
                document.getElementById('radianControls').style.display = 'none';
            }

            // 탭 변경 시 리셋 (필요에 따라 주석 처리 가능)
            slider.value = 0;
            currentAngle = 0;
            minReachedAngle = 0;
            maxReachedAngle = 0;

            draw();
            updateTextExtended();
        });
    });

    // --- 호도법 퀵 버튼 이벤트 등록 ---
    const setAngleFromRad = (radVal) => {
        let deg = radVal * 180 / Math.PI;
        currentAngle = deg; // 소수점 각도 허용
        slider.value = Math.round(deg);
        draw();
        updateTextExtended();
    };

    document.getElementById('btnRad1').addEventListener('click', () => setAngleFromRad(1));
    document.getElementById('btnRad2').addEventListener('click', () => setAngleFromRad(2));
    document.getElementById('btnRad3').addEventListener('click', () => setAngleFromRad(3));
    document.getElementById('btnRadPi').addEventListener('click', () => setAngleFromRad(Math.PI));
    // --------------------------------

    // 초기 실행 시 호도법 탭 기본 세팅
    CX = canvas.width / 2 - 250;
    CY = canvas.height / 2;
    R_BASE = 180;
    rSliderWrapper.style.display = 'flex';
    document.getElementById('radianControls').style.display = 'flex';

    draw();
    updateTextExtended();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();

    if (currentFunc === 'radian') {
        drawRadianConcept(); // 새로 만들 함수
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

    // 2. 우측 그래프 축 (사인, 코사인, 탄젠트 탭에서만 그림!)
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
        // 그래프 탭: 좌측 상단에 기존 크기 유지
        ctx.font = '600 18px Outfit, sans-serif';
        ctx.fillText(`x = ${x.toFixed(2)}`, 20, 40);
        ctx.fillText(`y = ${y.toFixed(2)}`, 20, 70);
    } else {
        // 호도법 & 정의 탭: 원의 왼쪽 상단에 크고 뚜렷하게 배치
        ctx.font = '800 24px Outfit, sans-serif';
        let startX = CX - R_BASE - 150; // 위치 조정
        let startY = CY - R_BASE + 20;
        ctx.fillText(`x = ${x.toFixed(2)}`, startX, startY);
        ctx.fillText(`y = ${y.toFixed(2)}`, startX, startY + 40);
    }
}

function drawPoint(x, y, borderCol, radius = 5, fillCol = '#ffffff') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillCol;
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
    ctx.fillStyle = 'rgba(177, 156, 217, 0.2)';
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

    // 항상 좌표 표시
    drawCoordinates(val_x, val_y);

    const sinVal = Math.sin(rad);
    const cosVal = Math.cos(rad);
    const tanVal = Math.tan(rad);
    let tanStr = tanVal.toFixed(2);
    if (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270) {
        tanStr = "∞";
    }
    let textStartX = CX + R_BASE + 80; // 원 우측에 배치
    let textStartY = CY - 40;

    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillStyle = activeColors['sin'];
    ctx.fillText(`sin(${currentAngle}°) = ${sinVal.toFixed(2)}`, textStartX, textStartY);
    ctx.fillStyle = activeColors['cos'];
    ctx.fillText(`cos(${currentAngle}°) = ${cosVal.toFixed(2)}`, textStartX, textStartY + 50);
    ctx.fillStyle = activeColors['tan'];
    ctx.fillText(`tan(${currentAngle}°) = ${tanStr}`, textStartX, textStartY + 100);
}

function drawRadianConcept() {
    let r_pixel = currentR * R_BASE;

    // 연한 배경 원 그리기
    ctx.beginPath();
    ctx.arc(CX, CY, r_pixel, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    let rad = currentAngle * Math.PI / 180;
    let absRad = Math.abs(rad);
    let sign = currentAngle >= 0 ? -1 : 1;

    // 기준 반지름 선(x축)
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + r_pixel, CY);
    ctx.strokeStyle = '#a0aec0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 현재 각도의 반지름 선
    let px = CX + r_pixel * Math.cos(rad);
    let py = CY - r_pixel * Math.sin(rad);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#4a5568';
    ctx.stroke();

    // 호의 길이를 r 단위(1라디안)로 쪼개서 그리기
    let fullRads = Math.floor(absRad);
    let colors = ['#4fd1c5', '#38b2ac', '#319795', '#285e61', '#234e52', '#1d4044'];

    for (let i = 0; i < fullRads; i++) {
        let startA = sign * i;
        let endA = sign * (i + 1);
        let midA = sign * (i + 0.5);

        // 1. 바깥쪽 호 (길이 r)
        ctx.beginPath();
        ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 6;
        ctx.stroke();

        // 바깥쪽 텍스트 (호의 조각 길이가 r임을 명시)
        let outX = CX + (r_pixel + 20) * Math.cos(midA);
        let outY = CY + (r_pixel + 20) * Math.sin(midA);
        ctx.fillStyle = colors[i % colors.length];
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`r`, outX, outY + 5);

        // 2. 안쪽 중심각 호 (각도 1 rad)
        ctx.beginPath();
        ctx.arc(CX, CY, 40 + i * 2, startA, endA, sign < 0); // 겹치지 않게 살짝씩 넓힘
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2;
        ctx.stroke();

        // 안쪽 각도 텍스트
        let inX = CX + 70 * Math.cos(midA);
        let inY = CY + 70 * Math.sin(midA);
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText(`1 rad`, inX, inY + 4);
    }

    // 1라디안 미만으로 남은 자투리 호 그리기
    if (absRad > fullRads) {
        let startA = sign * fullRads;
        let endA = sign * absRad;
        let midA = (startA + endA) / 2;
        let diffRad = absRad - fullRads;

        // 바깥쪽 자투리 호
        ctx.beginPath();
        ctx.arc(CX, CY, r_pixel, startA, endA, sign < 0);
        ctx.strokeStyle = '#fc8181'; // 눈에 띄는 빨간색
        ctx.lineWidth = 6;
        ctx.stroke();

        // 바깥쪽 남은 호 길이 텍스트 (예: 0.14 r)
        let outX = CX + (r_pixel + 25) * Math.cos(midA);
        let outY = CY + (r_pixel + 25) * Math.sin(midA);
        ctx.fillStyle = '#fc8181';
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${diffRad.toFixed(2)} r`, outX, outY + 5);

        // 안쪽 자투리 중심각 호
        ctx.beginPath();
        ctx.arc(CX, CY, 40 + fullRads * 2, startA, endA, sign < 0);
        ctx.strokeStyle = '#fc8181';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 안쪽 남은 각도 텍스트 (예: 0.14 rad)
        let inX = CX + 70 * Math.cos(midA);
        let inY = CY + 70 * Math.sin(midA);
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillText(`${diffRad.toFixed(2)} rad`, inX, inY + 4);
    }
    ctx.textAlign = 'left';

    // ================= 우측 설명 텍스트 =================
    let rightX = CX + R_BASE + 80; // 원 우측으로 배치
    let rightY = CY - 80;

    ctx.fillStyle = '#2d3748';
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.fillText(`호도법 (Radian Measure)`, rightX, rightY);

    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText(`반지름 길이를 단위로 하여 중심각을 재는 방법`, rightX, rightY + 30);

    // 반지름과 호의 길이 비교 설명
    ctx.fillStyle = '#4a5568';
    ctx.fillText(`반지름 r = ${currentR.toFixed(1)}`, rightX, rightY + 70);
    ctx.fillText(`호의 길이 l = `, rightX, rightY + 95);
    ctx.fillStyle = '#4fd1c5';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillText(`${absRad.toFixed(2)}`, rightX + 105, rightY + 95);
    ctx.fillStyle = '#4a5568';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText(` × r`, rightX + 145, rightY + 95);

    // 현재 각도 표시
    ctx.fillStyle = '#4fd1c5';
    ctx.font = '800 22px Outfit, sans-serif';
    ctx.fillText(`중심각 = ${absRad.toFixed(2)} 라디안`, rightX, rightY + 140);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText(`( 1 라디안 ≈ 57.3° )`, rightX + 220, rightY + 140);

    // 180도(또는 -180도)에 도달했을 때 피드백
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

        if (currentFunc === 'sin') y = GY - R_BASE * Math.sin(rad);
        else if (currentFunc === 'cos') y = GY - R_BASE * Math.cos(rad);
        else if (currentFunc === 'tan') y = GY - R_BASE * Math.tan(rad);

        if (currentFunc === 'tan' && (a === 90 || a === -90 || a === 270 || a === -270)) {
            ctx.stroke();
            ctx.beginPath();
            continue;
        }

        if (a === minAngle || (currentFunc === 'tan' && (a === minAngle + 1))) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
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

    // 사인 코사인 탄젠트 탭에서도 항상 좌측 상단에 x y 좌표 표시
    let val_x = Math.cos(rad);
    let val_y = Math.sin(rad);
    drawCoordinates(val_x, val_y);

    if (currentFunc === 'sin') gy = GY - R_BASE * Math.sin(rad);
    else if (currentFunc === 'cos') gy = GY - R_BASE * Math.cos(rad);
    else if (currentFunc === 'tan') gy = GY - R_BASE * Math.tan(rad);

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
        // 1. 점 P에서 x축으로 수선의 발 내리기 (얇은 점선) -> 직각삼각형 뼈대 완성
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px, CY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. 원점에서 x축 위의 수선의 발까지 선 긋기 (이것이 cos 값! 굵은 파란색)
        ctx.beginPath();
        ctx.moveTo(CX, CY); ctx.lineTo(px, CY);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3; // 강조를 위해 살짝 더 굵게 (기본 2)
        ctx.stroke();
        ctx.lineWidth = 2; // 선 굵기 원상 복구

        // 3. 점 P에서 우측 그래프 상의 점으로 이어지는 보조선 (기존 유지)
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

    if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
        return;
    }
    if (gy >= 0 && gy <= canvas.height) {
        drawPoint(gx, gy, activeColor, 5, '#ffffff');
    }
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

    if (currentFunc === 'sin') { val = Math.sin(rad); }
    else if (currentFunc === 'cos') { val = Math.cos(rad); }
    else if (currentFunc === 'tan') { val = Math.tan(rad); }

    if (currentFunc === 'tan' && (currentAngle === 90 || currentAngle === -90 || currentAngle === 270 || currentAngle === -270)) {
        displayVal = "∞";
    } else {
        displayVal = val.toFixed(2);
    }

    infoText.style.color = '#2d3748';
    infoText.innerHTML = `${currentFunc}(${currentAngle}°) = <span style="color: ${valColor};">${displayVal}</span>`;
}

init();


/* --- Exponential & Logarithmic Functions Logic --- */
const expCanvas = document.getElementById('expCanvas');
const eCtx = expCanvas.getContext('2d');
const funcInput = document.getElementById('funcInput');
const drawBtn = document.getElementById('drawBtn');
const funcError = document.getElementById('funcError');
const historyList = document.getElementById('historyList');
const colorBtns = document.querySelectorAll('.color-btn');

// Defaults and Constants
const EXP_CW = 1000;
const EXP_CH = 700;
const EXP_CX = EXP_CW / 2;
const EXP_CY = EXP_CH / 2;
const UNIT_PX = 40;               // 1 unit = 40 pixels

let selectedColor = '#ff8bad'; // Default selected color
let functionHistory = [];      // Array to hold { id, exprStr, expr, color, visible, isInverse }
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

// --- Event Listeners for new UI ---
colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('active'));
        const target = e.target;
        target.classList.add('active');
        selectedColor = target.dataset.color;
    });
});

function drawExpGrid() {
    eCtx.clearRect(0, 0, EXP_CW, EXP_CH);

    eCtx.lineWidth = 1;
    eCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';

    // Vertical grid lines
    for (let x = 0; x <= EXP_CW; x += UNIT_PX) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x, EXP_CH);
        eCtx.stroke();
    }
    // Horizontal grid lines
    for (let y = 0; y <= EXP_CH; y += UNIT_PX) {
        eCtx.beginPath();
        eCtx.moveTo(0, y);
        eCtx.lineTo(EXP_CW, y);
        eCtx.stroke();
    }

    // Axes
    eCtx.lineWidth = 2;
    eCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    eCtx.beginPath();
    eCtx.moveTo(0, EXP_CY);
    eCtx.lineTo(EXP_CW, EXP_CY); // X axis
    eCtx.moveTo(EXP_CX, 0);
    eCtx.lineTo(EXP_CX, EXP_CH); // Y axis
    eCtx.stroke();

    // Labels
    eCtx.fillStyle = '#718096';
    eCtx.font = '12px Outfit, sans-serif';
    for (let i = -15; i <= 15; i++) {
        if (i !== 0) {
            let px = EXP_CX + i * UNIT_PX;
            if (px >= 0 && px <= EXP_CW) {
                eCtx.fillText(i, px - 4, EXP_CY + 15);
            }
            let py = EXP_CY - i * UNIT_PX;
            if (py >= 0 && py <= EXP_CH) {
                eCtx.fillText(i, EXP_CX + 8, py + 4);
            }
        }
    }
    eCtx.fillText('O', EXP_CX - 12, EXP_CY + 15);
    eCtx.fillText('x', EXP_CW - 15, EXP_CY - 10);
    eCtx.fillText('y', EXP_CX + 10, 15);
}

function renderAllExpGraphs() {
    drawExpGrid();
    document.getElementById('graphLabels').innerHTML = '';

    const startX = -15;
    const endX = 15;
    const step = 0.05;

    functionHistory.forEach(item => {
        if (!item.visible) return;

        eCtx.beginPath();
        eCtx.lineWidth = 3;
        eCtx.strokeStyle = item.color;

        let labelCandidates = [];

        function getPt(t) {
            let val;
            try {
                val = item.expr.evaluate({ x: t });
            } catch (e) {
                return null;
            }

            if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
                return null;
            }

            let px, py;
            if (item.isInverse) {
                px = EXP_CX + val * UNIT_PX;
                py = EXP_CY - t * UNIT_PX;
            } else {
                px = EXP_CX + t * UNIT_PX;
                py = EXP_CY - val * UNIT_PX;
            }
            return { x: px, y: py, t: t, val: val };
        }

        let rawPoints = [];
        for (let t = startX; t <= endX; t += step) {
            rawPoints.push(getPt(t));
        }

        let refinedPoints = [];
        for (let i = 0; i < rawPoints.length - 1; i++) {
            let p1 = rawPoints[i];
            let p2 = rawPoints[i + 1];

            refinedPoints.push(p1);

            if ((p1 === null && p2 !== null) || (p1 !== null && p2 === null)) {
                let validT = p1 ? startX + i * step : startX + (i + 1) * step;
                let invalidT = p1 ? startX + (i + 1) * step : startX + i * step;

                let extra = [];
                for (let d = 0; d < 14; d++) {
                    let midT = (validT + invalidT) / 2;
                    let midPt = getPt(midT);
                    if (midPt) {
                        extra.push(midPt);
                        validT = midT;
                    } else {
                        invalidT = midT;
                    }
                }
                if (p1 !== null) {
                    refinedPoints.push(...extra);
                } else {
                    refinedPoints.push(...extra.reverse());
                }
            }
        }
        refinedPoints.push(rawPoints[rawPoints.length - 1]);

        let MathAbs = Math.abs;
        let firstPoint = true;
        let prevPx = null;
        let prevPy = null;

        for (let i = 0; i < refinedPoints.length; i++) {
            let pt = refinedPoints[i];
            if (!pt) {
                firstPoint = true;
                continue;
            }

            if (item.isInverse) {
                if (prevPx !== null && MathAbs(pt.x - prevPx) > EXP_CW / 2) firstPoint = true;
            } else {
                if (prevPy !== null && MathAbs(pt.y - prevPy) > EXP_CH / 2) firstPoint = true;
            }

            if (firstPoint) {
                eCtx.moveTo(pt.x, pt.y);
                firstPoint = false;
            } else {
                eCtx.lineTo(pt.x, pt.y);
            }
            prevPx = pt.x;
            prevPy = pt.y;

            if (pt.x >= 0 && pt.x <= EXP_CW && pt.y >= 0 && pt.y <= EXP_CH) {
                labelCandidates.push({ x: pt.x, y: pt.y });
            }
        }
        eCtx.stroke();

        if (labelCandidates.length > 0) {
            let targetIdx = Math.floor(labelCandidates.length * 0.85);
            let targetPt = labelCandidates[targetIdx];
            if (targetPt.x > EXP_CW - 80) targetPt.x = EXP_CW - 80;
            if (targetPt.y < 20) targetPt.y = 20;

            let eqString = '';
            if (item.isInverse) {
                let cloned = item.expr.clone();
                cloned = cloned.transform(n => n.isSymbolNode && n.name === 'x' ? math.parse('y') : n);
                eqString = 'x = ' + cloned.toTex();
            } else {
                eqString = 'y = ' + item.expr.toTex();
            }
            let texStr = '\\textcolor{' + item.color + '}{' + eqString + '}';
            let labelDiv = document.createElement('div');
            labelDiv.style.position = 'absolute';
            labelDiv.style.left = (targetPt.x + 15) + 'px';
            labelDiv.style.top = (targetPt.y - 25) + 'px';
            labelDiv.style.color = item.color;
            labelDiv.style.fontSize = '18px';
            labelDiv.style.textShadow = '0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9)';
            katex.render(texStr, labelDiv, { throwOnError: false });
            document.getElementById('graphLabels').appendChild(labelDiv);
        }
    });
}

function updateHistoryUI() {
    historyList.innerHTML = '';

    if (functionHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: #a0aec0; margin-top: 20px; font-size: 14px;">추가된 함수가 없습니다.</div>';
        return;
    }

    functionHistory.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item' + (item.visible ? '' : ' hidden-graph') + (item.id === selectedHistoryId ? ' selected' : '');

        let texHtml = '';
        let eqString = item.isInverse ? 'x = ' + item.expr.toTex() : 'y = ' + item.expr.toTex();
        try {
            texHtml = katex.renderToString(eqString, { throwOnError: false, displayMode: false });
        } catch (e) {
            texHtml = eqString;
        }

        div.innerHTML = `
                    <div class="history-item-header">
                        <div style="display: flex; align-items: center; width: 70%; overflow: hidden;">
                            <div class="history-item-color" style="background-color: ${item.color}; flex-shrink: 0;"></div>
                            <div class="history-item-expr" style="overflow-x: auto; overflow-y: hidden;" title="${eqString}">${texHtml}</div>
                        </div>
                        <div style="display: flex; gap: 5px; flex-shrink: 0;">
                            <button class="history-btn toggle-btn" data-id="${item.id}" title="보이기/숨기기">
                                ${item.visible ? '👁️' : '🙈'}
                            </button>
                            <button class="history-btn delete-btn" data-id="${item.id}" title="삭제">
                                ❌
                            </button>
                        </div>
                    </div>
                `;

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
            if (func) {
                func.visible = !func.visible;
                updateHistoryUI();
                renderAllExpGraphs();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            functionHistory = functionHistory.filter(f => f.id !== id);
            if (selectedHistoryId === id) selectedHistoryId = null;
            updateHistoryUI();
            renderAllExpGraphs();
        });
    });
}

function addFunction() {
    const exprStr = funcInput.value.trim();
    if (!exprStr) {
        funcError.innerText = "수식을 입력해주세요.";
        return;
    }

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
    functionHistory.push({
        id: newId,
        exprStr: exprStr,
        expr: expr,
        color: selectedColor,
        visible: true,
        isInverse: false
    });

    selectedHistoryId = newId;

    getNextColor();
    funcInput.value = '';
    updateHistoryUI();
    renderAllExpGraphs();
}

function invertAST(node) {
    function containsX(n) {
        let hasX = false;
        n.traverse(function (child) {
            if (child.isSymbolNode && child.name === 'x') hasX = true;
        });
        return hasX;
    }
    function solve(n, targetStr) {
        if (n.isSymbolNode && n.name === 'x') return targetStr;
        if (n.isParenthesisNode) return solve(n.content, targetStr);

        if (n.isOperatorNode) {
            if (n.op === '+') {
                let leftHasX = containsX(n.args[0]);
                let A = leftHasX ? n.args[0] : n.args[1];
                let B = leftHasX ? n.args[1] : n.args[0];
                return solve(A, `(${targetStr}) - (${B.toString()})`);
            }
            if (n.op === '-') {
                if (n.args.length === 1) {
                    return solve(n.args[0], `-(${targetStr})`);
                } else {
                    let leftHasX = containsX(n.args[0]);
                    if (leftHasX) {
                        return solve(n.args[0], `(${targetStr}) + (${n.args[1].toString()})`);
                    } else {
                        return solve(n.args[1], `(${n.args[0].toString()}) - (${targetStr})`);
                    }
                }
            }
            if (n.op === '*') {
                let leftHasX = containsX(n.args[0]);
                let A = leftHasX ? n.args[0] : n.args[1];
                let B = leftHasX ? n.args[1] : n.args[0];
                return solve(A, `(${targetStr}) / (${B.toString()})`);
            }
            if (n.op === '/') {
                let leftHasX = containsX(n.args[0]);
                if (leftHasX) {
                    return solve(n.args[0], `(${targetStr}) * (${n.args[1].toString()})`);
                } else {
                    return solve(n.args[1], `(${n.args[0].toString()}) / (${targetStr})`);
                }
            }
            if (n.op === '^') {
                let leftHasX = containsX(n.args[0]);
                if (!leftHasX) {
                    return solve(n.args[1], `log(${targetStr}, ${n.args[0].toString()})`);
                }
            }
        }

        if (n.isFunctionNode) {
            if (n.fn.name === 'log' || n.fn.name === 'log10') {
                let base = n.args.length > 1 ? n.args[1].toString() : (n.fn.name === 'log10' ? '10' : 'e');
                let A = n.args[0];
                if (n.fn.name === 'log' && n.args.length === 1) {
                    return solve(A, `exp(${targetStr})`);
                } else {
                    return solve(A, `(${base})^(${targetStr})`);
                }
            }
            if (n.fn.name === 'exp') {
                return solve(n.args[0], `log(${targetStr})`);
            }
        }
        throw new Error('Unsupported AST format for algebraic inversion.');
    }

    let invStr = solve(node, 'x');
    return math.parse(invStr);
}

function applyGlobalTransform(action) {
    if (selectedHistoryId === null) {
        funcError.innerText = "대칭/평행 이동할 함수를 좌측 목록에서 선택해주신 뒤 눌러주세요.";
        setTimeout(() => funcError.innerText = "", 2000);
        return;
    }
    const func = functionHistory.find(f => f.id === selectedHistoryId);
    if (!func) return;

    let newExprStr = func.expr.toString();
    let newExpr = math.parse(newExprStr);
    let newIsInverse = func.isInverse;

    if (action === 'refX') {
        if (newIsInverse) {
            newExpr = newExpr.transform(node => {
                if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
                return node;
            });
        } else {
            newExpr = math.parse(`-(${newExpr.toString()})`);
        }
    } else if (action === 'refY') {
        if (newIsInverse) {
            newExpr = math.parse(`-(${newExpr.toString()})`);
        } else {
            newExpr = newExpr.transform(node => {
                if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
                return node;
            });
        }
    } else if (action === 'refOrigin') {
        newExpr = newExpr.transform(node => {
            if (node.isSymbolNode && node.name === 'x') return math.parse('(-x)');
            return node;
        });
        newExpr = math.parse(`-(${newExpr.toString()})`);
    } else if (action === 'refYX') {
        if (newIsInverse) {
            newIsInverse = false;
        } else {
            try {
                let invAST = invertAST(newExpr);
                newExpr = invAST;
                newIsInverse = false;
            } catch (e) {
                newIsInverse = true;
            }
        }
    } else if (action === 'shift') {
        let dx = parseFloat(document.getElementById('gShiftX').value) || 0;
        let dy = parseFloat(document.getElementById('gShiftY').value) || 0;
        if (dx === 0 && dy === 0) return;

        if (dx !== 0) {
            if (newIsInverse) {
                newExpr = math.parse(`(${newExpr.toString()}) + ${dx}`);
            } else {
                let rep = dx > 0 ? `(x - ${dx})` : `(x + ${-dx})`;
                newExpr = newExpr.transform(node => {
                    if (node.isSymbolNode && node.name === 'x') return math.parse(rep);
                    return node;
                });
            }
        }
        if (dy !== 0) {
            if (newIsInverse) {
                let rep = dy > 0 ? `(x - ${dy})` : `(x + ${-dy})`;
                newExpr = newExpr.transform(node => {
                    if (node.isSymbolNode && node.name === 'x') return math.parse(rep);
                    return node;
                });
            } else {
                newExpr = math.parse(`(${newExpr.toString()}) + ${dy}`);
            }
        }
    }

    try {
        newExpr = math.simplify(newExpr);
    } catch (e) {
        // 파싱 불가능한 복잡한 꼴이거나 에러 시 그대로 둠
    }

    let finalStr = newExpr.toString();
    newExpr = math.parse(finalStr);

    let newId = histIdCounter++;
    functionHistory.push({
        id: newId,
        exprStr: finalStr,
        expr: newExpr,
        color: selectedColor,
        visible: true,
        isInverse: newIsInverse
    });

    selectedHistoryId = newId;

    getNextColor();
    updateHistoryUI();
    renderAllExpGraphs();
}

// Initialize Exponential View
drawExpGrid();
updateHistoryUI();

drawBtn.addEventListener('click', addFunction);
funcInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFunction();
});

document.querySelector('.g-ref-x').addEventListener('click', () => applyGlobalTransform('refX'));
document.querySelector('.g-ref-y').addEventListener('click', () => applyGlobalTransform('refY'));
document.querySelector('.g-ref-o').addEventListener('click', () => applyGlobalTransform('refOrigin'));
document.querySelector('.g-ref-yx').addEventListener('click', () => applyGlobalTransform('refYX'));
document.querySelector('.g-apply-shift').addEventListener('click', () => applyGlobalTransform('shift'));

document.querySelectorAll('.k-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'k-clear') {
            funcInput.value = '';
        } else if (btn.id === 'k-back') {
            funcInput.value = funcInput.value.slice(0, -1);
        } else {
            let addition = btn.dataset.val;
            if (addition.includes('log') || addition.includes('exp')) {
                // insert snippet and maybe move cursor, or just append
                funcInput.value += addition;
            } else {
                funcInput.value += addition;
            }
        }
        funcInput.focus();
    });
});

// Trigger redraw when switching to exp tab
document.querySelector('.index-tab[data-unit="exp"]').addEventListener('click', () => {
    setTimeout(() => {
        renderAllExpGraphs();
    }, 50);
});

/* --- Matrix Transform Logic --- */
const matrixOrigCanvas = document.getElementById('matrixOrigCanvas');
const matrixTransCanvas = document.getElementById('matrixTransCanvas');
const mOrigCtx = matrixOrigCanvas.getContext('2d');
const mTransCtx = matrixTransCanvas.getContext('2d');
const matrixImageInput = document.getElementById('matrixImageInput');
const applyMatrixBtn = document.getElementById('applyMatrixBtn');

let matrixImage = null;
const M_W = 400;
const M_H = 400;
const M_CX = M_W / 2;
const M_CY = M_H / 2;

function drawMatrixGrid(ctx) {
    ctx.clearRect(0, 0, M_W, M_H);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= M_W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, M_H); ctx.stroke();
    }
    for (let y = 0; y <= M_H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(M_W, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M_CX, 0); ctx.lineTo(M_CX, M_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, M_CY); ctx.lineTo(M_W, M_CY); ctx.stroke();
}

function drawOriginal() {
    drawMatrixGrid(mOrigCtx);
    if (!matrixImage) {
        mOrigCtx.fillStyle = '#e2e8f0';
        mOrigCtx.fillRect(M_CX - 80, M_CY - 80, 160, 160);
        mOrigCtx.fillStyle = '#a0aec0';
        mOrigCtx.font = '600 14px Outfit, sans-serif';
        mOrigCtx.textAlign = 'center';
        mOrigCtx.fillText('이미지를 업로드하세요', M_CX, M_CY + 5);
        mOrigCtx.textAlign = 'left';
        return;
    }
    const size = Math.min(M_W, M_H) * 0.7;
    mOrigCtx.drawImage(matrixImage, M_CX - size / 2, M_CY - size / 2, size, size);
}

function applyMatrixTransform() {
    const a = parseFloat(document.getElementById('m00').value) || 0;
    const b = parseFloat(document.getElementById('m01').value) || 0;
    const c = parseFloat(document.getElementById('m10').value) || 0;
    const d = parseFloat(document.getElementById('m11').value) || 0;

    const det = a * d - b * c;
    document.getElementById('detValue').innerText = det.toFixed(2);
    const detDesc = document.getElementById('detDesc');
    if (Math.abs(det) < 0.001) {
        detDesc.innerText = '⚠️ 행렬식이 0: 역행렬이 존재하지 않습니다';
        detDesc.style.color = '#e53e3e';
    } else {
        detDesc.innerText = `넓이가 ${Math.abs(det).toFixed(2)}배로 변환됩니다`;
        detDesc.style.color = '#718096';
    }

    drawMatrixGrid(mTransCtx);

    if (!matrixImage) {
        // 기본 사각형으로 시연
        const pts = [[-80, -80], [80, -80], [80, 80], [-80, 80]];
        const transformed = pts.map(([x, y]) => [a * x + b * y, c * x + d * y]);

        mOrigCtx.clearRect(0, 0, M_W, M_H);
        drawMatrixGrid(mOrigCtx);
        mOrigCtx.fillStyle = 'rgba(115,165,255,0.3)';
        mOrigCtx.strokeStyle = '#73a5ff';
        mOrigCtx.lineWidth = 2;
        mOrigCtx.beginPath();
        pts.forEach(([x, y], i) => {
            if (i === 0) mOrigCtx.moveTo(M_CX + x, M_CY - y);
            else mOrigCtx.lineTo(M_CX + x, M_CY - y);
        });
        mOrigCtx.closePath();
        mOrigCtx.fill(); mOrigCtx.stroke();

        mTransCtx.fillStyle = 'rgba(177,156,217,0.3)';
        mTransCtx.strokeStyle = '#b19cd9';
        mTransCtx.lineWidth = 2;
        mTransCtx.beginPath();
        transformed.forEach(([x, y], i) => {
            if (i === 0) mTransCtx.moveTo(M_CX + x, M_CY - y);
            else mTransCtx.lineTo(M_CX + x, M_CY - y);
        });
        mTransCtx.closePath();
        mTransCtx.fill(); mTransCtx.stroke();
        return;
    }

    // 이미지가 있을 때: pixel 단위 변환
    const size = Math.min(M_W, M_H) * 0.7;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = M_W; offCanvas.height = M_H;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(matrixImage, M_CX - size / 2, M_CY - size / 2, size, size);
    const srcData = offCtx.getImageData(0, 0, M_W, M_H);

    const outData = mTransCtx.createImageData(M_W, M_H);

    // 역행렬로 역방향 매핑
    const det2 = a * d - b * c;
    if (Math.abs(det2) < 0.001) return;
    const invA = d / det2, invB = -b / det2, invC = -c / det2, invD = a / det2;

    for (let py = 0; py < M_H; py++) {
        for (let px = 0; px < M_W; px++) {
            const x = px - M_CX;
            const y = -(py - M_CY);
            const srcX = Math.round(invA * x + invB * y + M_CX);
            const srcY = Math.round(-(invC * x + invD * y) + M_CY);
            if (srcX >= 0 && srcX < M_W && srcY >= 0 && srcY < M_H) {
                const si = (srcY * M_W + srcX) * 4;
                const di = (py * M_W + px) * 4;
                outData.data[di] = srcData.data[si];
                outData.data[di + 1] = srcData.data[si + 1];
                outData.data[di + 2] = srcData.data[si + 2];
                outData.data[di + 3] = srcData.data[si + 3];
            }
        }
    }
    mTransCtx.putImageData(outData, 0, 0);
}

// 이미지 업로드
document.getElementById('matrixImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.querySelector('.upload-label').innerText = '✅ ' + file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            matrixImage = img;
            drawOriginal();
            applyMatrixTransform();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// 적용 버튼
applyMatrixBtn.addEventListener('click', () => {
    drawOriginal();
    applyMatrixTransform();
});

// 행렬 입력 실시간 반영
['m00', 'm01', 'm10', 'm11'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        const a = parseFloat(document.getElementById('m00').value) || 0;
        const b = parseFloat(document.getElementById('m01').value) || 0;
        const c = parseFloat(document.getElementById('m10').value) || 0;
        const d = parseFloat(document.getElementById('m11').value) || 0;
        const det = a * d - b * c;
        document.getElementById('detValue').innerText = det.toFixed(2);
        const detDesc = document.getElementById('detDesc');
        if (Math.abs(det) < 0.001) {
            detDesc.innerText = '⚠️ 행렬식이 0: 역행렬이 존재하지 않습니다';
            detDesc.style.color = '#e53e3e';
        } else {
            detDesc.innerText = `넓이가 ${Math.abs(det).toFixed(2)}배로 변환됩니다`;
            detDesc.style.color = '#718096';
        }
    });
});

// 프리셋 버튼
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const [a, b, c, d] = btn.dataset.matrix.split(',').map(Number);
        document.getElementById('m00').value = a;
        document.getElementById('m01').value = b;
        document.getElementById('m10').value = c;
        document.getElementById('m11').value = d;
        drawOriginal();
        applyMatrixTransform();
    });
});

// 탭 전환 시 초기화
document.querySelector('.index-tab[data-unit="matrix"]').addEventListener('click', () => {
    setTimeout(() => {
        drawOriginal();
        applyMatrixTransform();
    }, 50);
});

// 초기 실행
drawOriginal();
applyMatrixTransform();

/* ========================================================= */
/* --- Integration (구분구적법: 상합과 하합 조임정리) Logic --- */
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

let currentIntegMethod = 'both'; // 'upper', 'lower', 'both'
let integExpr = null;

const IW = iCanvas.width;
const IH = iCanvas.height;
const I_PAD = 40;
let mapX, mapY;

function initInteg() {
    integFuncInput.addEventListener('input', drawInteg);
    integA.addEventListener('input', drawInteg);
    integB.addEventListener('input', drawInteg);

    integNSlider.addEventListener('input', (e) => {
        integNVal.innerText = e.target.value;
        drawInteg();
    });

    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            methodBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentIntegMethod = e.target.dataset.method;
            drawInteg();
        });
    });

    document.querySelector('.index-tab[data-unit="integ"]').addEventListener('click', () => {
        setTimeout(drawInteg, 50);
    });

    drawInteg();
}

function calculateExactIntegral(expr, a, b) {
    let sum = 0;
    let n = 2000;
    let dx = (b - a) / n;
    for (let i = 0; i < n; i++) {
        let x = a + (i + 0.5) * dx;
        try { sum += expr.evaluate({ x: x }) * dx; } catch (e) { return 0; }
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
    if (a >= b) {
        integError.innerText = "a는 b보다 작아야 합니다.";
        iCtx.clearRect(0, 0, IW, IH);
        return;
    }

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

    // 스케일링 설정
    let minX = a - (b - a) * 0.1;
    let maxX = b + (b - a) * 0.1;
    let minY = 0, maxY = 0;

    for (let x = a; x <= b; x += (b - a) / 100) {
        let y = integExpr.evaluate({ x: x });
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    let yRange = maxY - minY;
    if (yRange === 0) yRange = 10;
    maxY += yRange * 0.2;
    minY -= yRange * 0.1;
    if (minY > 0) minY = -yRange * 0.1;

    mapX = (x) => I_PAD + ((x - minX) / (maxX - minX)) * (IW - 2 * I_PAD);
    mapY = (y) => IH - I_PAD - ((y - minY) / (maxY - minY)) * (IH - 2 * I_PAD);

    // 축 그리기
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

    // 상합(Upper), 하합(Lower) 계산 및 그리기
    let dx = (b - a) / n;
    let upperSum = 0;
    let lowerSum = 0;

    for (let i = 0; i < n; i++) {
        let xStart = a + i * dx;
        let xEnd = a + (i + 1) * dx;

        // 해당 소구간 내에서 최댓값, 최솟값 찾기 (샘플링 방식)
        let maxVal = -Infinity;
        let minVal = Infinity;
        let samples = 20; // 한 칸을 20번 쪼개서 비교

        for (let j = 0; j <= samples; j++) {
            let testX = xStart + (j / samples) * dx;
            let val = integExpr.evaluate({ x: testX });
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }

        upperSum += maxVal * dx;
        lowerSum += minVal * dx;

        let px = mapX(xStart);
        let pWidth = mapX(xEnd) - px;

        // 그리기 (보기 모드에 따라)
        if (currentIntegMethod === 'upper' || currentIntegMethod === 'both') {
            // 상합 (빨간색 투명)
            let pyMax = mapY(maxVal);
            let pHeightMax = mapY(0) - pyMax;
            iCtx.fillStyle = currentIntegMethod === 'both' ? 'rgba(252, 129, 129, 0.2)' : 'rgba(252, 129, 129, 0.4)';
            iCtx.fillRect(px, pyMax, pWidth, pHeightMax);
            iCtx.strokeStyle = 'rgba(229, 62, 62, 0.8)';
            iCtx.lineWidth = 1;
            iCtx.strokeRect(px, pyMax, pWidth, pHeightMax);
        }

        if (currentIntegMethod === 'lower' || currentIntegMethod === 'both') {
            // 하합 (파란색 투명 - both 모드일때 상합 위에 덮어그려짐)
            let pyMin = mapY(minVal);
            let pHeightMin = mapY(0) - pyMin;
            iCtx.fillStyle = currentIntegMethod === 'both' ? 'rgba(115, 165, 255, 0.6)' : 'rgba(115, 165, 255, 0.4)';
            iCtx.fillRect(px, pyMin, pWidth, pHeightMin);
            iCtx.strokeStyle = 'rgba(49, 130, 206, 0.8)';
            iCtx.lineWidth = 1;
            iCtx.strokeRect(px, pyMin, pWidth, pHeightMin);
        }
    }

    // 원래 함수 곡선 덮어 그리기
    iCtx.beginPath();
    iCtx.strokeStyle = '#2d3748'; // 짙은 회색 곡선
    iCtx.lineWidth = 3;
    let first = true;
    for (let x = minX; x <= maxX; x += (maxX - minX) / 200) {
        let y = integExpr.evaluate({ x: x });
        if (first) { iCtx.moveTo(mapX(x), mapY(y)); first = false; }
        else { iCtx.lineTo(mapX(x), mapY(y)); }
    }
    iCtx.stroke();

    // 결과 텍스트 업데이트
    let exactArea = calculateExactIntegral(integExpr, a, b);

    document.getElementById('integUpperVal').innerText = upperSum.toFixed(4);
    document.getElementById('integLowerVal').innerText = lowerSum.toFixed(4);
    document.getElementById('integDiff').innerText = (upperSum - lowerSum).toFixed(4);
    document.getElementById('integExactVal').innerText = exactArea.toFixed(4);
}

initInteg();