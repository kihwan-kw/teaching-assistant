/* ========================================================= */
/* --- Factorization (인수분해) Logic --- */
/* ========================================================= */

const fxProblem = document.getElementById('fx-problem');
const fxInputs = [
    document.getElementById('fx-x1'),
    document.getElementById('fx-x2'),
    document.getElementById('fx-y1'),
    document.getElementById('fx-y2')
];
const fxCalc1 = document.getElementById('fx-calc1');
const fxCalc2 = document.getElementById('fx-calc2');
const fxCalcSum = document.getElementById('fx-calc-sum');
const fxFeedback = document.getElementById('fx-feedback');
const fxBoard = document.querySelector('.fx-board');
const fxNextBtn = document.getElementById('fx-next-btn');

let currentFx = { a: 0, b: 0, c: 0 };

/* ---- 유틸 ---- */
function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

function formatPoly(a, b, c) {
    let str = '';
    if (a === 1) str += 'x^2';
    else if (a === -1) str += '-x^2';
    else str += a + 'x^2';
    if (b > 0) str += (b === 1 ? ' + x' : ' + ' + b + 'x');
    else if (b < 0) str += (b === -1 ? ' - x' : ' - ' + Math.abs(b) + 'x');
    if (c > 0) str += ' + ' + c;
    else if (c < 0) str += ' - ' + Math.abs(c);
    return str;
}

/* 인수 하나를 (px+q) 형태로 */
function formatFactor(p, q) {
    const partX = p === 1 ? 'x' : (p === -1 ? '-x' : p + 'x');
    if (q === 0) return partX;
    return `(${partX}${q > 0 ? '+' + q : q})`;
}

/* 정답 문자열 생성: k(p1x+q1)(p2x+q2), 완전제곱이면 (...)^2 */
function buildAnswer(k, p1, q1, p2, q2) {
    const parts = [];
    if (Math.abs(k) !== 1) parts.push(String(k));
    else if (k === -1) parts.push('-');

    const isPerfectSq = (p1 === p2 && q1 === q2);

    if (isPerfectSq) {
        parts.push(`${formatFactor(p1, q1)}^2`);
    } else {
        const f1 = formatFactor(p1, q1);
        const f2 = formatFactor(p2, q2);
        // 사전순 정렬로 표시 순서 일관성 유지
        const [fa, fb] = [f1, f2].sort((a, b) => a.localeCompare(b));
        parts.push(fa, fb);
    }
    return parts.join('');
}

/* ========================================================= */
/* ---- 크로스 훈련장 ---- */
/* ========================================================= */

function generateCrossProblem() {
    let p, r, q, s;
    // 공통인수(GCD)가 없는 문제만 출제
    do {
        p = Math.floor(Math.random() * 3) + 1;
        r = Math.floor(Math.random() * 2) + 1;
        q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 1;
        s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -1;
    } while (gcd(gcd(p * r, Math.abs(p * s + q * r)), Math.abs(q * s)) > 1);

    currentFx.a = p * r;
    currentFx.c = q * s;
    currentFx.b = p * s + q * r;
    currentFx.p = p; currentFx.q = q;
    currentFx.r = r; currentFx.s = s;

    katex.render(formatPoly(currentFx.a, currentFx.b, currentFx.c), fxProblem, { throwOnError: false });
    fxInputs.forEach(inp => { inp.value = ''; inp.disabled = false; });
    fxBoard.classList.remove('fx-success');
    fxNextBtn.style.display = 'none';
    fxCalc1.innerText = '?'; fxCalc2.innerText = '?'; fxCalcSum.innerText = '?';
    fxFeedback.innerText = '빈칸에 숫자를 넣어보세요!';
    fxFeedback.style.color = '#a0aec0';
}

function checkCross() {
    const x1 = parseInt(fxInputs[0].value);
    const x2 = parseInt(fxInputs[1].value);
    const y1 = parseInt(fxInputs[2].value);
    const y2 = parseInt(fxInputs[3].value);
    if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) return;

    const cross1 = x1 * y2, cross2 = x2 * y1, sum = cross1 + cross2;
    fxCalc1.innerText = cross1; fxCalc2.innerText = cross2; fxCalcSum.innerText = sum;

    if (x1 * x2 === currentFx.a && y1 * y2 === currentFx.c && sum === currentFx.b) {
        fxBoard.classList.add('fx-success');
        fxInputs.forEach(inp => inp.disabled = true);

        const ansStr = buildAnswer(1, x1, y1, x2, y2);
        fxFeedback.innerHTML = `정답입니다! 🎉<br><span style="font-size:22px;color:#2d3748;">${ansStr}</span>`;
        fxNextBtn.style.display = 'inline-block';
    } else {
        fxBoard.classList.remove('fx-success');
        fxFeedback.innerText = '가운데 일차항 계수(b)가 맞지 않아요.';
        fxFeedback.style.color = '#e53e3e';
    }
}

/* ========================================================= */
/* ---- 퀴즈 모드 ---- */
/* ========================================================= */

const fqProblem = document.getElementById('fq-problem');
const fqOptions = document.querySelectorAll('.fq-btn');
const fqScoreVal = document.getElementById('fq-score-val');
const fqComboVal = document.getElementById('fq-combo-val');
const fqComboBox = document.getElementById('fq-combo-box');

let fqScore = 0, fqCombo = 0, fqCorrectIdx = 0;

function generateQuizProblem() {
    let p, r, q, s, k;

    // 점수 30점 이상이면 30% 확률로 공통인수 있는 문제
    const useGcd = fqScore > 30 && Math.random() < 0.35;

    if (useGcd) {
        k = Math.floor(Math.random() * 3) + 2; // 2~4
        p = 1; r = 1;
        do {
            q = (Math.floor(Math.random() * 7) - 3); if (q === 0) q = 2;
            s = (Math.floor(Math.random() * 7) - 3); if (s === 0) s = -2;
        } while (q === s); // 완전제곱 제외
    } else {
        k = 1;
        do {
            p = fqScore > 50 ? (Math.floor(Math.random() * 3) + 1) : 1;
            r = fqScore > 50 ? (Math.floor(Math.random() * 2) + 1) : 1;
            q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 2;
            s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -2;
        } while (gcd(gcd(p * r, Math.abs(p * s + q * r)), Math.abs(q * s)) > 1);
    }

    const a = k * p * r;
    const b = k * (p * s + q * r);
    const c = k * q * s;

    katex.render(formatPoly(a, b, c), fqProblem, { throwOnError: false });

    const ansStr = buildAnswer(k, p, q, r, s);

    // 오답 생성
    const distractors = new Set();
    distractors.add(buildAnswer(k, p, -q, r, -s));
    distractors.add(buildAnswer(k, p, q, r, -s));
    distractors.add(buildAnswer(k, p, -q, r, s));
    distractors.add(buildAnswer(k, p, q + 1, r, s - 1));
    distractors.add(buildAnswer(k, p, q - 1, r, s + 1));
    distractors.add(buildAnswer(k, p, s, r, q));
    if (k > 1) distractors.add(buildAnswer(1, p, q, r, s)); // 공통인수 누락

    distractors.delete(ansStr);

    const distArr = Array.from(distractors);
    const options = [ansStr];

    while (options.length < 4) {
        if (distArr.length > 0) {
            const d = distArr.shift();
            if (!options.includes(d)) options.push(d);
        } else {
            const rq = Math.floor(Math.random() * 10) - 5;
            const rs = Math.floor(Math.random() * 10) - 5;
            const d = buildAnswer(k, p, rq, r, rs);
            if (d !== ansStr && !options.includes(d)) options.push(d);
        }
    }

    options.sort(() => Math.random() - 0.5);
    fqCorrectIdx = options.indexOf(ansStr);

    fqOptions.forEach((btn, idx) => {
        btn.className = 'fq-btn';
        btn.disabled = false;
        katex.render(options[idx], btn, { throwOnError: false });
        btn.onclick = () => handleQuizClick(btn, idx === fqCorrectIdx);
    });
}

function handleQuizClick(btn, isCorrect) {
    fqOptions.forEach(b => b.disabled = true);
    if (isCorrect) {
        btn.classList.add('correct');
        fqCombo++;
        fqScore += 10 + fqCombo * 2;
        fqComboBox.classList.add('active');
        setTimeout(() => fqComboBox.classList.remove('active'), 300);
    } else {
        btn.classList.add('wrong');
        fqOptions[fqCorrectIdx].classList.add('correct');
        fqCombo = 0;
    }
    fqScoreVal.innerText = fqScore;
    fqComboVal.innerText = fqCombo;
    fqComboBox.style.opacity = fqCombo > 0 ? 1 : 0;
    setTimeout(generateQuizProblem, 1200);
}

/* ========================================================= */
/* ---- 초기화 ---- */
/* ========================================================= */

function initFactor() {
    fxInputs.forEach(inp => inp.addEventListener('input', checkCross));
    fxNextBtn.addEventListener('click', generateCrossProblem);

    // 탭 버튼 (main.js의 인덱스 탭이 programmatically click)
    document.querySelectorAll('.tab-btn[data-factortab]').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn[data-factortab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            if (e.target.dataset.factortab === 'cross') {
                document.getElementById('factor-cross-container').style.display = 'flex';
                document.getElementById('factor-quiz-container').style.display = 'none';
                generateCrossProblem();
            } else {
                document.getElementById('factor-cross-container').style.display = 'none';
                document.getElementById('factor-quiz-container').style.display = 'flex';
                fqScore = 0; fqCombo = 0;
                fqScoreVal.innerText = 0;
                fqComboBox.style.opacity = 0;
                generateQuizProblem();
            }
        });
    });

    generateCrossProblem();
}
