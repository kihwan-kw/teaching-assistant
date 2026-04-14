(function () {
/* ========================================================= */
/* --- Factorization (인수분해) Logic --- */
/* 단계: 1.공통인수 → 2.인수분해공식 → 3.X자크로스 → 4.조립제법 → 5.스피드퀴즈 */
/* ========================================================= */

// 전역 통계 관리객체
const factorStats = {
    gcf: { total: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, score: 0, prefix: 'gcf' },
    fm: { total: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, score: 0, prefix: 'fm' },
    cross: { total: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, score: 0, prefix: 'cross' },
    syn: { total: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, score: 0, prefix: 'syn' },
    fq: { total: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, score: 0, prefix: 'fq' }
};

function updateUnitDashboard(unitKey) {
    const stats = factorStats[unitKey];
    if (!stats) return;

    // 콤보 체크 및 알림 호출 (콤보가 상승했을 때만)
    if (stats.combo > 1 && stats._prevCombo < stats.combo) {
        showComboCelebration(stats.combo);
    }
    stats._prevCombo = stats.combo;

    const p = stats.prefix;
    const elMap = {
        total: document.getElementById(`${p}-total`),
        correct: document.getElementById(`${p}-correct`),
        wrong: document.getElementById(`${p}-wrong`),
        maxCombo: document.getElementById(`${p}-max-combo`),
        score: document.getElementById(`${p}-score-val`)
    };
    if (elMap.total) elMap.total.innerText = stats.total;
    if (elMap.correct) elMap.correct.innerText = stats.correct;
    if (elMap.wrong) elMap.wrong.innerText = stats.wrong;
    if (elMap.maxCombo) elMap.maxCombo.innerText = stats.maxCombo;
    if (elMap.score) elMap.score.innerText = stats.score;
}

function showComboCelebration(count) {
    const container = document.getElementById('combo-toast-container');
    if (!container) return;

    const phrases = {
        low: ["좋아요!", "오~ 맞았습니다!", "굿!", "계속 가보죠!", "오호!"],
        mid: ["대단해요!", "완벽한 흐름!", "막힘이 없네요!", "훌륭합니다!", "와우!"],
        high: ["천재인가요?", "대체 못 푸는 게 뭐죠?", "수학 귀신!", "진짜 실력자!", "엄청나요!"],
        god: ["수학의 신 탄생! 🔥", "전설적인 실력!", "압도적입니다!", "Master!", "경이로운 기록!"]
    };

    let selectedPhrase = "";
    if (count <= 3) selectedPhrase = phrases.low[Math.floor(Math.random() * phrases.low.length)];
    else if (count <= 6) selectedPhrase = phrases.mid[Math.floor(Math.random() * phrases.mid.length)];
    else if (count <= 9) selectedPhrase = phrases.high[Math.floor(Math.random() * phrases.high.length)];
    else selectedPhrase = phrases.god[Math.floor(Math.random() * phrases.god.length)];

    const toast = document.createElement('div');
    toast.className = 'combo-toast' + (count >= 7 ? ' high-combo' : '');
    toast.innerHTML = `
        <div class="combo-count-text">${count} COMBO!</div>
        <div class="combo-phrase">${selectedPhrase}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) container.removeChild(toast);
    }, 2600);
}

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

function formatFactor(p, q) {
    const partX = p === 1 ? 'x' : (p === -1 ? '-x' : p + 'x');
    if (q === 0) return partX;
    return `(${partX}${q > 0 ? '+' + q : q})`;
}

function buildAnswer(k, p1, q1, p2, q2) {
    const parts = [];
    if (k === -1) parts.push('-');
    else if (Math.abs(k) !== 1) parts.push(String(k));
    const isPerfectSq = (p1 === p2 && q1 === q2);
    if (isPerfectSq) {
        parts.push(`${formatFactor(p1, q1)}^2`);
    } else {
        const [fa, fb] = [formatFactor(p1, q1), formatFactor(p2, q2)].sort((a, b) => a.localeCompare(b));
        parts.push(fa, fb);
    }
    return parts.join('');
}

/* 수치 대입 동치 검사 */
function isEquivalent(expr1, expr2, varName = 'x') {
    try {
        const e1 = math.parse(expr1.replace(/\s/g, '').replace(/\*\*/g, '^'));
        const e2 = math.parse(expr2.replace(/\s/g, '').replace(/\*\*/g, '^'));
        const pts = [1.23, -0.76, 3.14, Math.E];
        for (const p of pts) {
            if (Math.abs(e1.evaluate({ [varName]: p }) - e2.evaluate({ [varName]: p })) > 1e-5) return false;
        }
        return true;
    } catch { return false; }
}

/* 미니 키패드 바인딩 */
function bindKeypad(keypadId, inputIds) {
    let activeInput = document.getElementById(inputIds[0]);
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('focus', e => activeInput = e.target);
    });

    document.addEventListener('click', e => {
        const btn = e.target.closest('.fk-btn');
        if (!btn) return;
        if (!btn.closest('#' + keypadId)) return;

        if (btn.id && btn.id.startsWith('fk-del')) {
            if (activeInput) activeInput.value = activeInput.value.slice(0, -1);
        } else if (btn.classList.contains('fk-check') || btn.classList.contains('fk-next')) {
            return;
        } else {
            const map = { '÷': '/', '×': '*', '← 지우기': null };
            const val = map[btn.innerText.trim()];
            if (val === null) return;
            if (activeInput) activeInput.value += (val !== undefined ? val : btn.innerText.trim());
        }
        if (activeInput) activeInput.focus();
    });
}

/* ========================================================= */
/* ---- 단계 1: 공통인수 (GCF) ---- */
/* ========================================================= */

let gcfProblem = null;

function generateGcfProblem() {
    const k = Math.floor(Math.random() * 4) + 2;
    const type = Math.floor(Math.random() * 3);
    let exprStr = '';
    let answerK = '';

    if (type === 0) {
        const numTerms = Math.random() < 0.5 ? 2 : 3;
        const powers = numTerms === 2
            ? [Math.floor(Math.random() * 2) + 2, 0]
            : [2, 1, 0];
        const rawCoeffs = Array.from({ length: numTerms }, () => (Math.floor(Math.random() * 4) + 1));
        const actualK = rawCoeffs.reduce((acc, cur) => gcd(acc, cur * k), rawCoeffs[0] * k);
        const coeffs = rawCoeffs.map(c => c * k);
        
        gcfProblem = { type: 0, k: actualK, coeffs, powers, numTerms };
        answerK = String(actualK);
        const formatT = (c, p) => {
            if (p === 0) return String(c);
            const xPart = p === 1 ? 'x' : `x^${p}`;
            return (c === 1 ? '' : (c === -1 ? '-' : c)) + xPart;
        };
        for (let i = 0; i < numTerms; i++) {
            const term = formatT(coeffs[i], powers[i]);
            exprStr += i === 0 ? term : ' + ' + term;
        }
    } else if (type === 1) {
        const p1 = Math.floor(Math.random() * 2) + 2;
        const p2 = 1;
        const minP = Math.min(p1, p2);
        const c1 = Math.floor(Math.random() * 4) + 1;
        const c2 = Math.floor(Math.random() * 4) + 1;
        gcfProblem = { type: 1, minP, c1, c2, p1, p2 };
        answerK = minP === 1 ? 'x' : `x^${minP}`;
        const makeTerm = (c, p) => (c === 1 ? '' : c) + (p === 1 ? 'x' : `x^${p}`);
        exprStr = `${makeTerm(c1, p1)} + ${makeTerm(c2, p2)}`;
    } else {
        const minP = Math.floor(Math.random() * 2) + 1;
        const p1 = minP + 1;
        const p2 = minP;
        const rawC1 = (Math.floor(Math.random() * 3) + 1);
        const rawC2 = (Math.floor(Math.random() * 3) + 1);
        const actualK = gcd(rawC1 * k, rawC2 * k);
        const c1 = rawC1 * k;
        const c2 = rawC2 * k;

        gcfProblem = { type: 2, k: actualK, minP, c1, c2, p1, p2 };
        answerK = `${actualK === 1 ? '' : actualK}x${minP > 1 ? '^' + minP : ''}`;
        if (actualK === 1 && minP === 1) answerK = 'x';

        const makeTerm = (c, p) => (c === 1 ? '' : c) + (p === 1 ? 'x' : `x^${p}`);
        exprStr = `${makeTerm(c1, p1)} + ${makeTerm(c2, p2)}`;
    }

    gcfProblem.exprStr = exprStr;
    gcfProblem.answerK = answerK;

    katex.render(exprStr, document.getElementById('gcf-problem'), { throwOnError: false });
    document.getElementById('gcf-input').value = '';
    document.getElementById('gcf-inner-input').value = '';
    document.getElementById('gcf-type-label').innerText =
        type === 0 ? '📌 숫자 공통인수' : type === 1 ? '📌 문자 공통인수' : '📌 숫자+문자 공통인수';

    const fb = document.getElementById('gcf-feedback');
    fb.innerText = '빈칸을 클릭하고 입력하세요.';
    fb.style.color = '#a0aec0';

    const nextBtn = document.getElementById('gcf-next-btn-keypad');
    if (nextBtn) nextBtn.style.display = 'none';
    document.getElementById('gcf-check-btn').disabled = false;
}

function checkGcf() {
    if (!gcfProblem) return;
    const uK = document.getElementById('gcf-input').value.trim();
    const uI = document.getElementById('gcf-inner-input').value.trim();
    const fb = document.getElementById('gcf-feedback');
    if (!uK || !uI) { fb.innerText = '두 칸을 모두 채워주세요.'; fb.style.color = '#e53e3e'; return; }

    const isKCorrect = isEquivalent(uK, gcfProblem.answerK);
    
    let expectedInner = '';
    if (gcfProblem.type === 0) {
        const formatT = (c, p) => {
            if (p === 0) return String(c);
            const xPart = p === 1 ? 'x' : `x^${p}`;
            return (c === 1 ? '' : (c === -1 ? '-' : c)) + xPart;
        };
        const innerCoeffs = gcfProblem.coeffs.map(c => c / gcfProblem.k);
        for (let i = 0; i < gcfProblem.numTerms; i++) {
            const term = formatT(innerCoeffs[i], gcfProblem.powers[i]);
            expectedInner += i === 0 ? term : '+' + term;
        }
    } else if (gcfProblem.type === 1) {
        const r1 = gcfProblem.p1 - gcfProblem.minP;
        const r2 = gcfProblem.p2 - gcfProblem.minP;
        const makeT = (c, r) => (r === 0 ? String(c) : (c === 1 ? '' : c) + (r === 1 ? 'x' : 'x^' + r));
        expectedInner = `${makeT(gcfProblem.c1, r1)}+${makeT(gcfProblem.c2, r2)}`;
    } else {
        const r1 = gcfProblem.p1 - gcfProblem.minP;
        const r2 = gcfProblem.p2 - gcfProblem.minP;
        const innerK = gcfProblem.k;
        const makeT = (c, r) => {
            const coeff = c / innerK;
            const xPart = r === 0 ? '' : (r === 1 ? 'x' : 'x^' + r);
            if (xPart === '') return String(coeff);
            return (coeff === 1 ? '' : coeff) + xPart;
        };
        expectedInner = `${makeT(gcfProblem.c1, r1)}+${makeT(gcfProblem.c2, r2)}`;
    }

    const isICorrect = isEquivalent(uI, expectedInner);

    if (isKCorrect && isICorrect) {
        fb.innerHTML = `정답! 🎉 <strong>${uK}(${uI})</strong>`;
        fb.style.color = '#38a169';
        const nxtKeypad = document.getElementById('gcf-next-btn-keypad');
        if (nxtKeypad) nxtKeypad.style.display = 'inline-block';
        document.getElementById('gcf-check-btn').disabled = true;

        const st = factorStats.gcf;
        st.total++; st.correct++; st.combo++;
        st.score += 10 + st.combo * 2;
        if (st.combo > st.maxCombo) st.maxCombo = st.combo;
        updateUnitDashboard('gcf');
    } else {
        const st = factorStats.gcf;
        st.total++; st.wrong++; st.combo = 0;
        updateUnitDashboard('gcf');

        if (!isKCorrect) {
            fb.innerText = '공통인수가 맞지 않아요. 다시 찾아보세요!';
            fb.style.color = '#e53e3e';
        } else {
            fb.innerText = '공통인수는 맞았어요! 괄호 안을 다시 확인해보세요.';
            fb.style.color = '#ed8936';
        }
    }
}

/* ========================================================= */
/* ---- 단계 2: 인수분해 공식 ---- */
/* ========================================================= */

const FORMULA_TYPES = [
    {
        name: '완전제곱식 (합)', latex: 'a^2 + 2ab + b^2 = (a+b)^2',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            let a, b;
            do { a = Math.floor(Math.random() * 3) + 1; b = Math.floor(Math.random() * 4) + 1; } while (gcd(a, b) !== 1);
            const A = k * a * a, B = k * 2 * a * b, C = k * b * b;
            const exprStr = `${A === 1 ? '' : A}x^2 + ${B}x + ${C}`;
            const inside = `(${a === 1 ? '' : a}x+${b})^2`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '완전제곱식 (차)', latex: 'a^2 - 2ab + b^2 = (a-b)^2',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            let a, b;
            do { a = Math.floor(Math.random() * 3) + 1; b = Math.floor(Math.random() * 4) + 1; } while (gcd(a, b) !== 1);
            const A = k * a * a, B = k * 2 * a * b, C = k * b * b;
            const exprStr = `${A === 1 ? '' : A}x^2 - ${B}x + ${C}`;
            const inside = `(${a === 1 ? '' : a}x-${b})^2`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '합차공식', latex: 'a^2 - b^2 = (a+b)(a-b)',
        generate() {
            const k = Math.floor(Math.random() * 4) + 1;
            let a, b;
            do { a = Math.floor(Math.random() * 4) + 1; b = Math.floor(Math.random() * 4) + 1; } while (gcd(a, b) !== 1);
            const A = k * a * a, C = k * b * b;
            const exprStr = `${A === 1 ? '' : A}x^2 - ${C}`;
            const i1 = `(${a === 1 ? '' : a}x+${b})(${a === 1 ? '' : a}x-${b})`;
            const i2 = `(${a === 1 ? '' : a}x-${b})(${a === 1 ? '' : a}x+${b})`;
            return { exprStr, answers: k === 1 ? [i1, i2] : [`${k}${i1}`, `${k}${i2}`], k, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '세제곱 합', latex: 'a^3 + b^3 = (a+b)(a^2-ab+b^2)',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            const b = Math.floor(Math.random() * 3) + 1;
            const exprStr = `${k === 1 ? '' : k}x^3 + ${k * b * b * b}`;
            const inside = `(x+${b})(x^2-${b}x+${b * b})`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=x, b=${b}` };
        }
    },
    {
        name: '세제곱 차', latex: 'a^3 - b^3 = (a-b)(a^2+ab+b^2)',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            const b = Math.floor(Math.random() * 3) + 1;
            const exprStr = `${k === 1 ? '' : k}x^3 - ${k * b * b * b}`;
            const inside = `(x-${b})(x^2+${b}x+${b * b})`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=x, b=${b}` };
        }
    }
];

let currentFormula = null;
let currentFormulaTypeIdx = 0;

function generateFormulaProblem(typeIdx) {
    if (typeIdx !== undefined) currentFormulaTypeIdx = typeIdx;
    const type = FORMULA_TYPES[currentFormulaTypeIdx];
    const prob = type.generate();
    currentFormula = { ...prob, typeName: type.name, typeLatex: type.latex };

    document.querySelectorAll('.fm-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === currentFormulaTypeIdx);
    });

    document.getElementById('formula-type-name').innerText = type.name;
    katex.render(type.latex, document.getElementById('formula-type-latex'), { throwOnError: false });
    katex.render(prob.exprStr, document.getElementById('formula-problem'), { throwOnError: false });
    document.getElementById('formula-input').value = '';

    const fb = document.getElementById('formula-feedback');
    fb.innerHTML = '<strong>💡 주의:</strong> 공통인수가 있다면 반드시 먼저 묶어낸 후 공식을 적용하세요!';
    fb.style.color = '#ed8936';

    const nextBtn = document.getElementById('formula-next-btn-keypad');
    if (nextBtn) nextBtn.style.display = 'none';
    document.getElementById('formula-check-btn').disabled = false;
    updateUnitDashboard('fm');
}

function checkFormula() {
    if (!currentFormula) return;
    const userAns = document.getElementById('formula-input').value.trim().replace(/\s/g, '').toLowerCase();
    const fb = document.getElementById('formula-feedback');
    if (!userAns) return;

    if (currentFormula.k > 1 && !userAns.startsWith(currentFormula.k.toString())) {
        fb.innerText = `공통인수 '${currentFormula.k}'를 먼저 묶어주세요!`;
        fb.style.color = '#e53e3e';
        return;
    }

    const cleanUser = userAns.replace(/([0-9])([a-z])/g, '$1*$2');
    const cleanAns = currentFormula.answers[0].replace(/([0-9])([a-z])/g, '$1*$2');

    if (isEquivalent(cleanUser, cleanAns, 'x') || currentFormula.answers.some(a => a.toLowerCase() === userAns)) {
        const fullEq = `${currentFormula.exprStr} = \\textcolor{#276749}{${currentFormula.answers[0]}}`;
        fb.innerHTML = `정답! 🎉<br><div style="font-size:24px;color:#2d3748;margin-top:10px;">${katex.renderToString(fullEq, { throwOnError: false })}</div>`;
        
        const st = factorStats.fm;
        st.total++; st.correct++; st.combo++;
        st.score += 10 + st.combo * 2;
        if (st.combo > st.maxCombo) st.maxCombo = st.combo;
        updateUnitDashboard('fm');

        const nxtKeypad = document.getElementById('formula-next-btn-keypad');
        if (nxtKeypad) nxtKeypad.style.display = 'inline-block';
        document.getElementById('formula-check-btn').disabled = true;
    } else {
        const st = factorStats.fm;
        st.total++; st.wrong++; st.combo = 0;
        updateUnitDashboard('fm');

        fb.innerText = '틀렸어요. 부호나 제곱 등을 다시 확인해보세요!';
        fb.style.color = '#e53e3e';
    }
}

/* ========================================================= */
/* ---- 단계 3: X자 크로스 ---- */
/* ========================================================= */

let currentFx = { a: 0, b: 0, c: 0 };

function generateCrossProblem() {
    let p, r, q, s;
    do {
        p = Math.floor(Math.random() * 3) + 1;
        r = Math.floor(Math.random() * 2) + 1;
        q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 1;
        s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -1;
    } while (gcd(gcd(p * r, Math.abs(p * s + q * r)), Math.abs(q * s)) > 1);

    currentFx.a = p * r; currentFx.c = q * s; currentFx.b = p * s + q * r;
    currentFx.p = p; currentFx.q = q; currentFx.r = r; currentFx.s = s;

    katex.render(formatPoly(currentFx.a, currentFx.b, currentFx.c), document.getElementById('fx-problem'), { throwOnError: false });

    ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.disabled = false; }
    });
    document.querySelector('.fx-board').classList.remove('fx-success');
    const nxt = document.getElementById('fx-next-btn2'); if (nxt) nxt.style.display = 'none';
    document.getElementById('fx-calc1').innerText = '?';
    document.getElementById('fx-calc2').innerText = '?';
    document.getElementById('fx-calc-sum').innerText = '?';
    document.getElementById('fx-feedback').innerText = '빈칸에 숫자를 넣어보세요!';
    document.getElementById('fx-feedback').style.color = '#a0aec0';
}

function checkCross() {
    const x1 = parseInt(document.getElementById('fx-x1').value);
    const x2 = parseInt(document.getElementById('fx-x2').value);
    const y1 = parseInt(document.getElementById('fx-y1').value);
    const y2 = parseInt(document.getElementById('fx-y2').value);
    if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) return;

    const cross1 = x1 * y2, cross2 = x2 * y1, sum = cross1 + cross2;
    document.getElementById('fx-calc1').innerText = cross1;
    document.getElementById('fx-calc2').innerText = cross2;
    document.getElementById('fx-calc-sum').innerText = sum;

    if (x1 * x2 === currentFx.a && y1 * y2 === currentFx.c && sum === currentFx.b) {
        document.querySelector('.fx-board').classList.add('fx-success');
        ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = true; });
        const ansStr = buildAnswer(1, x1, y1, x2, y2);
        const probStr = formatPoly(currentFx.a, currentFx.b, currentFx.c);
        const fullEq = `${probStr} = \\textcolor{#38a169}{${ansStr}}`;
        document.getElementById('fx-feedback').innerHTML = `정답입니다! 🎉<br><div style="font-size:24px;color:#2d3748;margin-top:10px;">${katex.renderToString(fullEq, { throwOnError: false })}</div>`;
        const nxt = document.getElementById('fx-next-btn2'); if (nxt) nxt.style.display = 'inline-block';

        const st = factorStats.cross;
        st.total++; st.correct++; st.combo++;
        st.score += 15 + st.combo * 3;
        if (st.combo > st.maxCombo) st.maxCombo = st.combo;
        updateUnitDashboard('cross');
    } else {
        const st = factorStats.cross;
        st.total++; st.wrong++; st.combo = 0;
        updateUnitDashboard('cross');

        document.querySelector('.fx-board').classList.remove('fx-success');
        document.getElementById('fx-feedback').innerText = '가운데 일차항 계수(b)가 맞지 않아요.';
        document.getElementById('fx-feedback').style.color = '#e53e3e';
    }
}

/* ========================================================= */
/* ---- 단계 4: 조립제법 ---- */
/* ========================================================= */

let syntheticProblem = null;
let syntheticPhase = 0;
let userGuessR = null;
let currentCol = 0;
let currentRow = 2;
let syntheticMiddleRow = [];
let syntheticRow = [];

function generateSyntheticProblem() {
    let r = Math.floor(Math.random() * 5) - 2; if (r === 0) r = 1;
    const qa = Math.floor(Math.random() * 2) + 1;
    const qb = Math.floor(Math.random() * 5) - 2;
    const qc = Math.floor(Math.random() * 4) - 2;
    const a3 = qa, a2 = qb - r * qa, a1 = qc - r * qb, a0 = -r * qc;
    syntheticProblem = { r, coeffs: [a3, a2, a1, a0], qa, qb, qc };
    syntheticPhase = 0; userGuessR = null; currentCol = 0; currentRow = 2;
    syntheticMiddleRow = []; syntheticRow = [];

    let polyStr = '';
    [[a3, 'x^3'], [a2, 'x^2'], [a1, 'x'], [a0, '']].forEach(([c, name]) => {
        if (c === 0) return;
        if (polyStr === '') polyStr += (c === 1 && name ? '' : c === -1 && name ? '-' : c) + name;
        else if (c > 0) polyStr += ` + ${c === 1 && name ? '' : c}${name}`;
        else polyStr += ` - ${Math.abs(c) === 1 && name ? '' : Math.abs(c)}${name}`;
    });
    syntheticProblem.polyStr = polyStr;

    katex.render(polyStr, document.getElementById('synthetic-problem'), { throwOnError: false });

    const feedback = document.getElementById('synthetic-feedback');
    feedback.innerHTML = `
        <div id="guess-phase-ui" style="margin-bottom:15px;text-align:center;">
            <p style="margin-bottom:12px;color:#2d3748;font-size:15px;">
                💡 <strong>인수정리:</strong> x = <input type="number" id="syn-guess-input" class="syn-input" style="width:60px;text-align:center;" placeholder="?"> 를 대입하면 0이 될 것 같아요!
            </p>
            <div style="display:flex;justify-content:center;gap:10px;margin-top:15px;">
                <button id="syn-guess-btn" style="padding:10px 20px;font-size:15px;font-weight:600;background:#a3bffa;color:#2c5282;border:none;border-radius:20px;cursor:pointer;">조립제법 표 만들기</button>
                <button id="syn-hint-btn" style="padding:10px 16px;font-size:14px;font-weight:600;background:#fbd38d;color:#9c4221;border:none;border-radius:20px;cursor:pointer;">💡 힌트 보기</button>
            </div>
        </div>
        <div id="syn-hint-box" style="display:none;font-size:13px;color:#718096;background:#fffaf0;padding:12px;border-radius:12px;margin-bottom:15px;border:1px dashed #fbd38d;">
            <strong>※ 팁:</strong> 상수항 <strong>${a0}</strong>의 약수들을 하나씩 대입해보세요.
        </div>
        <div id="syn-action-feedback" style="font-size:14px;"></div>
    `;

    document.getElementById('synthetic-next-btn').style.display = 'none';
    const checkBtn = document.getElementById('synthetic-check-btn');
    if (checkBtn) checkBtn.style.display = 'none';
    document.getElementById('synthetic-tbody').innerHTML = '';

    setTimeout(() => {
        const gb = document.getElementById('syn-guess-btn');
        if (gb) gb.addEventListener('click', startSyntheticWithGuess);
        const gi = document.getElementById('syn-guess-input');
        if (gi) gi.addEventListener('keypress', e => { if (e.key === 'Enter') startSyntheticWithGuess(); });
        const hb = document.getElementById('syn-hint-btn');
        if (hb) hb.addEventListener('click', () => {
            document.getElementById('syn-hint-box').style.display = 'block';
            hb.style.display = 'none';
        });
    }, 50);
    updateUnitDashboard('syn');
}

function startSyntheticWithGuess() {
    const guessInput = document.getElementById('syn-guess-input');
    const val = parseInt(guessInput.value);
    const feedback = document.getElementById('syn-action-feedback');
    if (isNaN(val)) { if (feedback) { feedback.innerText = '숫자를 입력해주세요.'; feedback.style.color = '#e53e3e'; } return; }

    userGuessR = val; syntheticPhase = 1; currentCol = 0; currentRow = 2;
    syntheticMiddleRow = new Array(syntheticProblem.coeffs.length).fill(null);
    syntheticRow = [];

    guessInput.disabled = true;
    document.getElementById('syn-guess-btn').style.display = 'none';
    document.getElementById('syn-hint-btn').style.display = 'none';
    const hintBox = document.getElementById('syn-hint-box'); if (hintBox) hintBox.style.display = 'none';

    if (feedback) {
        feedback.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;justify-content:center;">
                <span style="color:#3182ce;"><strong>x = ${userGuessR}</strong> 로 진행 중</span>
                <button id="syn-cancel-btn" style="padding:6px 12px;font-size:12px;background:#e2e8f0;color:#4a5568;border:none;border-radius:15px;cursor:pointer;font-weight:bold;">↩ 다시 선택</button>
            </div>
            <div id="syn-step-msg" style="color:#4a5568;font-weight:bold;margin-top:5px;">첫 번째 계수를 그대로 아래로 내려 적으세요.</div>
        `;
        const checkBtn = document.getElementById('synthetic-check-btn');
        if (checkBtn) checkBtn.style.display = 'inline-block';

        setTimeout(() => {
            const cb = document.getElementById('syn-cancel-btn');
            if (cb) cb.addEventListener('click', resetSyntheticTry);
        }, 50);
    }
    renderSyntheticTable();
}

function renderSyntheticTable() {
    if (!syntheticProblem || syntheticPhase === 0) return;
    const coeffs = syntheticProblem.coeffs;
    const r = userGuessR;
    const tbody = document.getElementById('synthetic-tbody');
    tbody.innerHTML = '';

    const row1 = document.createElement('tr');
    const th0 = document.createElement('td');
    th0.className = 'syn-cell'; th0.style.background = '#f0f4ff';
    th0.innerHTML = `<strong style="color:#73a5ff">${r}</strong>`;
    row1.appendChild(th0);
    coeffs.forEach(c => {
        const td = document.createElement('td'); td.className = 'syn-cell coeff-cell'; td.innerText = c; row1.appendChild(td);
    });
    tbody.appendChild(row1);

    const row2 = document.createElement('tr');
    const td0 = document.createElement('td'); td0.className = 'syn-cell'; row2.appendChild(td0);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell mult-cell';
        if (i === 0) { td.innerText = ''; }
        else if (i < currentCol || (i === currentCol && currentRow === 2)) {
            td.innerText = syntheticMiddleRow[i]; td.style.color = '#73a5ff'; td.style.fontWeight = '700';
        } else if (i === currentCol && currentRow === 1) {
            const input = document.createElement('input');
            input.type = 'number'; input.className = 'syn-input'; input.id = 'syn-current-input'; input.placeholder = '곱하기';
            td.appendChild(input);
        }
        row2.appendChild(td);
    });
    tbody.appendChild(row2);

    const row3 = document.createElement('tr');
    const td00 = document.createElement('td'); td00.className = 'syn-cell'; row3.appendChild(td00);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell sum-cell'; td.style.borderTop = '2px solid #4a5568';
        if (i < syntheticRow.length) {
            td.innerText = syntheticRow[i]; td.style.fontWeight = '800';
            if (i === coeffs.length - 1) { td.style.border = '2px dashed #ed8936'; td.style.backgroundColor = '#fffaf0'; }
        } else if (i === currentCol && currentRow === 2) {
            const input = document.createElement('input');
            input.type = 'number'; input.className = 'syn-input'; input.id = 'syn-current-input';
            input.placeholder = i === 0 ? '내리기' : '더하기';
            td.appendChild(input);
        }
        row3.appendChild(td);
    });
    tbody.appendChild(row3);

    const inp = document.getElementById('syn-current-input');
    if (inp) { inp.focus(); inp.addEventListener('keypress', e => { if (e.key === 'Enter') checkSyntheticStep(); }); }
}

function checkSyntheticStep() {
    if (!syntheticProblem || syntheticPhase !== 1) return;
    const coeffs = syntheticProblem.coeffs;
    const r = userGuessR;
    const inp = document.getElementById('syn-current-input'); if (!inp) return;
    const userVal = parseInt(inp.value);
    const msgEl = document.getElementById('syn-step-msg');
    if (isNaN(userVal)) { if (msgEl) { msgEl.innerText = '빈칸에 값을 입력하세요.'; msgEl.style.color = '#e53e3e'; } return; }

    if (currentCol === 0 && currentRow === 2) {
        if (userVal === coeffs[0]) {
            syntheticRow[0] = coeffs[0]; currentCol = 1; currentRow = 1;
            if (msgEl) { msgEl.innerText = `✓ 맞아요! 이제 ${r} × ${syntheticRow[0]} 를 오른쪽 위에 적으세요.`; msgEl.style.color = '#38a169'; }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. 첫 번째 계수(${coeffs[0]})를 그대로 내려야 해요!`; msgEl.style.color = '#e53e3e'; }
        }
        return;
    }

    if (currentRow === 1) {
        const expected = syntheticRow[currentCol - 1] * r;
        if (userVal === expected) {
            syntheticMiddleRow[currentCol] = expected; currentRow = 2;
            if (msgEl) { msgEl.innerText = '✓ 맞아요! 위아래 수를 더해 아래칸에 적으세요.'; msgEl.style.color = '#38a169'; }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. ${syntheticRow[currentCol - 1]} × ${r} 를 계산하세요!`; msgEl.style.color = '#e53e3e'; }
        }
    } else if (currentRow === 2) {
        const expected = coeffs[currentCol] + syntheticMiddleRow[currentCol];
        if (userVal === expected) {
            syntheticRow[currentCol] = expected;
            if (currentCol === coeffs.length - 1) {
                syntheticPhase = 2;
                const remainder = syntheticRow[syntheticRow.length - 1];
                const actionFb = document.getElementById('syn-action-feedback');
                
                const st = factorStats.syn;
                st.total++;

                if (remainder === 0) {
                    st.correct++; st.combo++;
                    st.score += 20 + st.combo * 5;
                    if (st.combo > st.maxCombo) st.maxCombo = st.combo;

                    const sign = r < 0 ? `+ ${Math.abs(r)}` : `- ${r}`;
                    const qLatex = formatQuotientLatex(syntheticRow.slice(0, -1));
                    const finalLatex = `(x ${sign})(${qLatex})`;
                    const fullEq = `${syntheticProblem.polyStr} = \\textcolor{#276749}{${finalLatex}}`;
                    katex.render(fullEq, document.getElementById('synthetic-problem'), { throwOnError: false });
                    if (actionFb) {
                        actionFb.innerHTML = `<div style="padding:15px;background:#f0fff4;border:1px solid #c6f6d5;border-radius:12px;margin-top:15px;text-align:center;">🎉 <strong>나머지가 0!</strong> 인수분해 성공!<br><div style="font-size:24px;color:#276749;margin-top:10px;">${katex.renderToString(finalLatex, { throwOnError: false })}</div></div>`;
                    }
                    document.getElementById('synthetic-next-btn').style.display = 'inline-block';
                    const checkBtn = document.getElementById('synthetic-check-btn');
                    if (checkBtn) checkBtn.style.display = 'none';
                } else {
                    st.wrong++; st.combo = 0;
                    if (actionFb) {
                        actionFb.innerHTML = `<div style="padding:15px;background:#fff5f5;border:1px solid #fed7d7;border-radius:12px;margin-top:15px;text-align:center;">🤔 나머지 = <strong>${remainder}</strong>. 나누어 떨어지지 않아요.<br><button id="syn-retry-btn" style="margin-top:12px;padding:10px 20px;font-size:14px;font-weight:600;background:#fc8181;color:white;border:none;border-radius:20px;cursor:pointer;">다른 숫자로 다시 도전!</button></div>`;
                        setTimeout(() => {
                            const rb = document.getElementById('syn-retry-btn');
                            if (rb) rb.addEventListener('click', resetSyntheticTry);
                        }, 50);
                    }
                }
                updateUnitDashboard('syn');
            } else {
                currentCol++; currentRow = 1;
                if (msgEl) { msgEl.innerText = `✓ 합계 맞아요! 다시 ${r} × ${syntheticRow[currentCol - 1]} 를 오른쪽 위에 적으세요.`; msgEl.style.color = '#38a169'; }
            }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. ${coeffs[currentCol]} + ${syntheticMiddleRow[currentCol]} 를 계산하세요!`; msgEl.style.color = '#e53e3e'; }
        }
    }
}

function resetSyntheticTry() {
    syntheticPhase = 0; userGuessR = null; currentCol = 0; currentRow = 2;
    syntheticMiddleRow = []; syntheticRow = [];
    if (syntheticProblem && syntheticProblem.polyStr) {
        katex.render(syntheticProblem.polyStr, document.getElementById('synthetic-problem'), { throwOnError: false });
    }
    const gi = document.getElementById('syn-guess-input');
    if (gi) { gi.disabled = false; gi.value = ''; }
    const gb = document.getElementById('syn-guess-btn'); if (gb) gb.style.display = 'inline-block';
    const hb = document.getElementById('syn-hint-btn'); if (hb) hb.style.display = 'inline-block';
    const fb = document.getElementById('syn-action-feedback'); if (fb) fb.innerText = '';
    document.getElementById('synthetic-tbody').innerHTML = '';
}

function formatQuotientLatex(coeffs) {
    if (!coeffs || coeffs.length === 0) return '0';
    let str = '';
    const degree = coeffs.length - 1;
    coeffs.forEach((c, i) => {
        if (c === 0) return;
        const p = degree - i;
        let absC = Math.abs(c);
        let term = p > 0 ? (absC === 1 ? '' : absC) + (p === 1 ? 'x' : `x^{${p}}`) : absC.toString();
        if (str === '') str += (c < 0 ? '-' : '') + term;
        else str += c > 0 ? ` + ${term}` : ` - ${term}`;
    });
    return str || '0';
}

/* ========================================================= */
/* ---- 단계 5: 스피드 퀴즈 ---- */
/* ========================================================= */

let fqCorrectIdx = 0;

function generateQuizProblem() {
    const fqProblem = document.getElementById('fq-problem');
    const fqOptions = document.querySelectorAll('.fq-btn');

    let p, r, q, s, k;
    const st = factorStats.fq;
    const useGcd = st.score > 30 && Math.random() < 0.35;
    if (useGcd) {
        k = Math.floor(Math.random() * 3) + 2; p = 1; r = 1;
        do { q = (Math.floor(Math.random() * 7) - 3); if (q === 0) q = 2; s = (Math.floor(Math.random() * 7) - 3); if (s === 0) s = -2; } while (q === s);
    } else {
        k = 1;
        do {
            p = st.score > 50 ? (Math.floor(Math.random() * 3) + 1) : 1;
            r = st.score > 50 ? (Math.floor(Math.random() * 2) + 1) : 1;
            q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 2;
            s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -2;
        } while (gcd(gcd(p * r, Math.abs(p * s + q * r)), Math.abs(q * s)) > 1);
    }

    const a = k * p * r, b = k * (p * s + q * r), c = k * q * s;
    katex.render(formatPoly(a, b, c), fqProblem, { throwOnError: false });
    const ansStr = buildAnswer(k, p, q, r, s);

    const distractors = new Set([
        buildAnswer(k, p, -q, r, -s), buildAnswer(k, p, q, r, -s),
        buildAnswer(k, p, -q, r, s), buildAnswer(k, p, q + 1, r, s - 1), buildAnswer(k, p, q - 1, r, s + 1)
    ]);
    if (k > 1) distractors.add(buildAnswer(1, p, q, r, s));
    distractors.delete(ansStr);
    const distArr = Array.from(distractors);
    const options = [ansStr];
    while (options.length < 4) {
        if (distArr.length > 0) { const d = distArr.shift(); if (!options.includes(d)) options.push(d); }
        else { const rq = Math.floor(Math.random() * 10) - 5, rs = Math.floor(Math.random() * 10) - 5; const d = buildAnswer(k, p, rq, r, rs); if (d !== ansStr && !options.includes(d)) options.push(d); }
    }
    options.sort(() => Math.random() - 0.5);
    fqCorrectIdx = options.indexOf(ansStr);
    fqOptions.forEach((btn, idx) => {
        btn.className = 'fq-btn'; btn.disabled = false;
        katex.render(options[idx], btn, { throwOnError: false });
        btn.onclick = () => handleQuizClick(btn, idx === fqCorrectIdx);
    });
}

function handleQuizClick(btn, isCorrect) {
    const fqOptions = document.querySelectorAll('.fq-btn');
    fqOptions.forEach(b => b.disabled = true);
    
    const st = factorStats.fq;
    st.total++;

    if (isCorrect) {
        btn.classList.add('correct'); st.combo++; st.correct++;
        st.score += 10 + st.combo * 2;
        if (st.combo > st.maxCombo) st.maxCombo = st.combo;
    } else {
        btn.classList.add('wrong'); fqOptions[fqCorrectIdx].classList.add('correct');
        st.combo = 0; st.wrong++;
    }

    updateUnitDashboard('fq');
    setTimeout(generateQuizProblem, 1200);
}

/* ========================================================= */
/* ---- 탭 전환 & 초기화 ---- */
/* ========================================================= */

function switchFactorTab(tabName) {
    console.log('--- switchFactorTab call --- tabName:', tabName);
    const map = {
        gcf: 'factor-gcf-container', formula: 'factor-formula-container',
        cross: 'factor-cross-container', synthetic: 'factor-synthetic-container', quiz: 'factor-quiz-container'
    };
    
    // 모든 컨테이너 숨기기
    Object.values(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
        else console.warn('Container not found:', id);
    });

    const targetId = map[tabName];
    const target = document.getElementById(targetId);
    if (target) {
        console.log('Showing container:', targetId);
        target.style.display = 'flex';
    } else {
        console.error('Target container not found for tab:', tabName);
    }

    // display를 먼저 적용한 뒤 다음 틱에 문제 생성
    setTimeout(() => {
        try {
            console.log('Switching to tab:', tabName);
            if (tabName === 'gcf') {
                updateUnitDashboard('gcf');
                generateGcfProblem();
            }
            else if (tabName === 'formula') {
                updateUnitDashboard('fm');
                generateFormulaProblem(0);
            }
            else if (tabName === 'cross') {
                updateUnitDashboard('cross');
                generateCrossProblem();
            }
            else if (tabName === 'synthetic') {
                updateUnitDashboard('syn');
                generateSyntheticProblem();
            }
            else if (tabName === 'quiz') {
                updateUnitDashboard('fq');
                generateQuizProblem();
            }
        } catch (err) {
            console.error('Error generating problem for', tabName, ':', err);
            // 에러를 화면에 표시 (디버깅용)
            const fb = document.getElementById(tabName === 'synthetic' ? 'synthetic-feedback' : 'fq-problem');
            if (fb) fb.innerHTML = `<div style="color:red; margin-top:20px;">[JS Error] ${err.message}</div>`;
        }
    }, 0);
}

function initFactor() {
    /* ① 공통인수 */
    const gcfCheck = document.getElementById('gcf-check-btn');
    if (gcfCheck) gcfCheck.addEventListener('click', checkGcf);
    
    // 키패드 내 다음 버튼
    const gcfNextKeypad = document.getElementById('gcf-next-btn-keypad');
    if (gcfNextKeypad) gcfNextKeypad.addEventListener('click', generateGcfProblem);
    
    // 엔터키 지원 (keydown 권장)
    const gcfIn1 = document.getElementById('gcf-input');
    const gcfIn2 = document.getElementById('gcf-inner-input');
    if (gcfIn1) gcfIn1.addEventListener('keydown', e => { if (e.key === 'Enter') checkGcf(); });
    if (gcfIn2) gcfIn2.addEventListener('keydown', e => { if (e.key === 'Enter') checkGcf(); });

    /* ② 인수분해 공식 */
    const fmCheck = document.getElementById('formula-check-btn');
    if (fmCheck) fmCheck.addEventListener('click', checkFormula);
    
    const fmNextKeypad = document.getElementById('formula-next-btn-keypad');
    if (fmNextKeypad) fmNextKeypad.addEventListener('click', () => generateFormulaProblem());
    
    const fmInput = document.getElementById('formula-input');
    if (fmInput) fmInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkFormula(); });
    
    document.querySelectorAll('.fm-btn').forEach((btn, i) => {
        btn.onclick = () => generateFormulaProblem(i);
    });

    /* ③ X자 크로스 */
    ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => {
        const el = document.getElementById(id); 
        if (el) el.addEventListener('input', checkCross);
    });
    const fxNextBtn = document.getElementById('fx-next-btn2');
    if (fxNextBtn) fxNextBtn.addEventListener('click', generateCrossProblem);

    /* ④ 조립제법 */
    const synCheckBtn = document.getElementById('synthetic-check-btn');
    if (synCheckBtn) synCheckBtn.addEventListener('click', checkSyntheticStep);
    const synNextBtn = document.getElementById('synthetic-next-btn');
    if (synNextBtn) synNextBtn.addEventListener('click', generateSyntheticProblem);

    /* 인덱스 탭 이벤트 */
    document.querySelectorAll('.index-tab[data-factortab]').forEach(btn => {
        btn.onclick = (e) => {
            const tabName = e.currentTarget.dataset.factortab;
            document.querySelectorAll('.index-tab[data-factortab]').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            switchFactorTab(tabName);
        };
    });

    /* 미니 키패드 */
    bindKeypad('gcf-keypad', ['gcf-input', 'gcf-inner-input']);
    bindKeypad('formula-keypad', ['formula-input']);

    switchFactorTab('gcf');
}

    window.initFactor = initFactor;
})();