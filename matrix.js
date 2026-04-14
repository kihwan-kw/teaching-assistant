(function () {
/* ========================================================= */
/* --- Matrix Transform (행렬과 변환) Logic --- */
/* ========================================================= */

const matrixOrigCanvas = document.getElementById('matrixOrigCanvas');
const matrixTransCanvas = document.getElementById('matrixTransCanvas');
const mOrigCtx = matrixOrigCanvas.getContext('2d');
const mTransCtx = matrixTransCanvas.getContext('2d');
const matrixImageInput = document.getElementById('matrixImageInput');
const applyMatrixBtn = document.getElementById('applyMatrixBtn');
const animateMatrixBtn = document.getElementById('animateMatrixBtn');

let matrixImage = null;
const M_W = 400;
const M_H = 400;
const M_CX = M_W / 2;
const M_CY = M_H / 2;

// 애니메이션 상태
let animFrameId = null;
let isAnimating = false;

/* ---- 그리드 그리기 ---- */
function drawMatrixGrid(ctx, alpha = 1) {
    ctx.clearRect(0, 0, M_W, M_H);
    ctx.strokeStyle = `rgba(0,0,0,${0.06 * alpha})`;
    ctx.lineWidth = 1;
    for (let x = 0; x <= M_W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, M_H); ctx.stroke();
    }
    for (let y = 0; y <= M_H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(M_W, y); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(0,0,0,${0.25 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M_CX, 0); ctx.lineTo(M_CX, M_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, M_CY); ctx.lineTo(M_W, M_CY); ctx.stroke();

    // 축 레이블
    ctx.fillStyle = `rgba(160,174,192,${alpha})`;
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        ctx.fillText(i, M_CX + i * 40, M_CY + 14);
        ctx.fillText(i, M_CX + 6, M_CY - i * 40 + 4);
    }
    ctx.fillText('0', M_CX - 10, M_CY + 14);
    ctx.textAlign = 'left';
}

/* ---- 기저 벡터 시각화 ---- */
function drawBasisVectors(ctx, mat, alpha = 1) {
    const [a, b, c, d] = mat;
    // e1 = (1,0) → (a, c), e2 = (0,1) → (b, d)
    const vectors = [
        { from: [M_CX, M_CY], to: [M_CX + a * 40, M_CY - c * 40], color: '#ff8bad', label: 'e₁' },
        { from: [M_CX, M_CY], to: [M_CX + b * 40, M_CY - d * 40], color: '#73a5ff', label: 'e₂' },
    ];
    vectors.forEach(v => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = v.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(v.from[0], v.from[1]);
        ctx.lineTo(v.to[0], v.to[1]);
        ctx.stroke();
        // 화살표 머리
        const dx = v.to[0] - v.from[0];
        const dy = v.to[1] - v.from[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            const nx = dx / len, ny = dy / len;
            ctx.beginPath();
            ctx.moveTo(v.to[0], v.to[1]);
            ctx.lineTo(v.to[0] - nx * 12 + ny * 6, v.to[1] - ny * 12 - nx * 6);
            ctx.lineTo(v.to[0] - nx * 12 - ny * 6, v.to[1] - ny * 12 + nx * 6);
            ctx.closePath();
            ctx.fillStyle = v.color;
            ctx.fill();
        }
        ctx.fillStyle = v.color;
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.fillText(v.label, v.to[0] + 6, v.to[1] - 6);
        ctx.restore();
    });
}

/* ---- 단위 원 / 단위 정사각형 변환 시각화 ---- */
function drawTransformedShapes(ctx, mat, alpha = 1) {
    const [a, b, c, d] = mat;
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;

    // 단위 정사각형 변환
    const unitPts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const transformed = unitPts.map(([x, y]) => [
        M_CX + (a * x + b * y) * 40,
        M_CY - (c * x + d * y) * 40
    ]);
    ctx.fillStyle = '#b19cd9';
    ctx.strokeStyle = '#b19cd9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(transformed[0][0], transformed[0][1]);
    transformed.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.8;
    ctx.stroke();

    // 단위 원 변환 (타원)
    ctx.globalAlpha = alpha * 0.2;
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
        const ox = Math.cos(t), oy = Math.sin(t);
        const nx = M_CX + (a * ox + b * oy) * 40;
        const ny = M_CY - (c * ox + d * oy) * 40;
        if (t === 0) ctx.moveTo(nx, ny);
        else ctx.lineTo(nx, ny);
    }
    ctx.closePath();
    ctx.globalAlpha = alpha * 0.6;
    ctx.stroke();
    ctx.restore();
}

/* ---- 원본 캔버스 그리기 ---- */
function drawOriginal() {
    drawMatrixGrid(mOrigCtx);
    drawBasisVectors(mOrigCtx, [1, 0, 0, 1]);
    drawTransformedShapes(mOrigCtx, [1, 0, 0, 1]);

    if (!matrixImage) {
        mOrigCtx.fillStyle = 'rgba(177,156,217,0.3)';
        mOrigCtx.fillRect(M_CX - 60, M_CY - 60, 120, 120);
        mOrigCtx.fillStyle = '#a0aec0';
        mOrigCtx.font = '600 12px Outfit, sans-serif';
        mOrigCtx.textAlign = 'center';
        mOrigCtx.fillText('이미지를 업로드하세요', M_CX, M_CY + 5);
        mOrigCtx.textAlign = 'left';
        return;
    }
    const size = Math.min(M_W, M_H) * 0.6;
    mOrigCtx.drawImage(matrixImage, M_CX - size / 2, M_CY - size / 2, size, size);
}

/* ---- 행렬 정보 업데이트 ---- */
function updateMatrixInfo(a, b, c, d) {
    const det = a * d - b * c;
    document.getElementById('detValue').innerText = det.toFixed(2);
    const detDesc = document.getElementById('detDesc');

    if (Math.abs(det) < 0.001) {
        detDesc.innerText = '⚠️ 행렬식이 0: 역행렬이 존재하지 않습니다 (차원 축소)';
        detDesc.style.color = '#e53e3e';
    } else if (det < 0) {
        detDesc.innerText = `넓이 ${Math.abs(det).toFixed(2)}배 변환, 방향이 반전됩니다`;
        detDesc.style.color = '#ed8936';
    } else {
        detDesc.innerText = `넓이가 ${det.toFixed(2)}배로 변환됩니다`;
        detDesc.style.color = '#718096';
    }

    // 역행렬 표시
    const invEl = document.getElementById('inverseMatrix');
    if (Math.abs(det) > 0.001) {
        const invA = d / det, invB = -b / det, invC = -c / det, invD = a / det;
        invEl.innerHTML = `
            <div class="inv-matrix-display">
                <span>A⁻¹ = </span>
                <div class="matrix-bracket">
                    <div class="matrix-cell">${invA.toFixed(2)}</div>
                    <div class="matrix-cell">${invB.toFixed(2)}</div>
                    <div class="matrix-cell">${invC.toFixed(2)}</div>
                    <div class="matrix-cell">${invD.toFixed(2)}</div>
                </div>
            </div>`;
    } else {
        invEl.innerHTML = '<span style="color:#e53e3e;font-size:13px;">역행렬 없음</span>';
    }
}

/* ---- 변환 적용 (정적) ---- */
function applyMatrixTransform() {
    const a = parseFloat(document.getElementById('m00').value) || 0;
    const b = parseFloat(document.getElementById('m01').value) || 0;
    const c = parseFloat(document.getElementById('m10').value) || 0;
    const d = parseFloat(document.getElementById('m11').value) || 0;

    updateMatrixInfo(a, b, c, d);
    drawMatrixGrid(mTransCtx);
    drawBasisVectors(mTransCtx, [a, b, c, d]);
    drawTransformedShapes(mTransCtx, [a, b, c, d]);

    if (!matrixImage) return;

    const det2 = a * d - b * c;
    if (Math.abs(det2) < 0.001) {
        mTransCtx.fillStyle = '#a0aec0';
        mTransCtx.font = '600 14px Outfit, sans-serif';
        mTransCtx.textAlign = 'center';
        mTransCtx.fillText('행렬식 = 0: 이미지가 직선으로 압축됩니다', M_CX, M_CY);
        mTransCtx.textAlign = 'left';
        return;
    }

    const size = Math.min(M_W, M_H) * 0.6;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = M_W; offCanvas.height = M_H;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(matrixImage, M_CX - size / 2, M_CY - size / 2, size, size);
    const srcData = offCtx.getImageData(0, 0, M_W, M_H);
    const outData = mTransCtx.createImageData(M_W, M_H);

    const invA = d / det2, invB = -b / det2, invC = -c / det2, invD = a / det2;

    // Web Worker 없이 최적화된 픽셀 매핑
    const data = srcData.data, out = outData.data;
    for (let py = 0; py < M_H; py++) {
        for (let px = 0; px < M_W; px++) {
            const x = px - M_CX, y = -(py - M_CY);
            const srcX = Math.round(invA * x + invB * y + M_CX);
            const srcY = Math.round(-(invC * x + invD * y) + M_CY);
            if (srcX >= 0 && srcX < M_W && srcY >= 0 && srcY < M_H) {
                const si = (srcY * M_W + srcX) * 4;
                const di = (py * M_W + px) * 4;
                out[di] = data[si]; out[di + 1] = data[si + 1];
                out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
            }
        }
    }
    mTransCtx.putImageData(outData, 0, 0);
}

/* ---- 애니메이션 변환 ---- */
function animateMatrixTransform() {
    if (isAnimating) {
        cancelAnimationFrame(animFrameId);
        isAnimating = false;
        animateMatrixBtn.innerText = '▶ 변환 애니메이션';
        animateMatrixBtn.style.background = 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)';
        return;
    }

    const a = parseFloat(document.getElementById('m00').value) || 0;
    const b = parseFloat(document.getElementById('m01').value) || 0;
    const c = parseFloat(document.getElementById('m10').value) || 0;
    const d = parseFloat(document.getElementById('m11').value) || 0;

    isAnimating = true;
    animateMatrixBtn.innerText = '⏹ 중지';
    animateMatrixBtn.style.background = 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)';

    let startTime = null;
    const duration = 1200; // ms

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function frame(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        let t = Math.min(elapsed / duration, 1);
        t = easeInOut(t);

        // 항등행렬에서 목표 행렬로 보간
        const ca = 1 + (a - 1) * t;
        const cb = b * t;
        const cc = c * t;
        const cd = 1 + (d - 1) * t;

        drawMatrixGrid(mTransCtx);
        drawBasisVectors(mTransCtx, [ca, cb, cc, cd]);
        drawTransformedShapes(mTransCtx, [ca, cb, cc, cd]);

        // 진행 상태 표시
        mTransCtx.fillStyle = 'rgba(113,128,150,0.7)';
        mTransCtx.font = '600 12px Outfit, sans-serif';
        mTransCtx.fillText(`t = ${t.toFixed(2)}`, 10, 20);

        if (elapsed < duration) {
            animFrameId = requestAnimationFrame(frame);
        } else {
            // 최종 상태 그리기
            applyMatrixTransform();
            isAnimating = false;
            animateMatrixBtn.innerText = '▶ 변환 애니메이션';
            animateMatrixBtn.style.background = 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)';
        }
    }

    animFrameId = requestAnimationFrame(frame);
}

function initMatrix() {
    // 이미지 업로드
    matrixImageInput.addEventListener('change', (e) => {
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

    // 애니메이션 버튼
    animateMatrixBtn.addEventListener('click', animateMatrixTransform);

    // 실시간 행렬 정보 업데이트
    ['m00', 'm01', 'm10', 'm11'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const a = parseFloat(document.getElementById('m00').value) || 0;
            const b = parseFloat(document.getElementById('m01').value) || 0;
            const c = parseFloat(document.getElementById('m10').value) || 0;
            const d = parseFloat(document.getElementById('m11').value) || 0;
            updateMatrixInfo(a, b, c, d);
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
            updateMatrixInfo(a, b, c, d);
            drawOriginal();
            applyMatrixTransform();
        });
    });

    // 초기 실행
    drawOriginal();
    applyMatrixTransform();
}

    window.initMatrix           = initMatrix;
    window.drawOriginal         = drawOriginal;
    window.applyMatrixTransform = applyMatrixTransform;
})();