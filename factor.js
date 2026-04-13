/* ========================================================= */
/* --- Factorization (인수분해) Logic --- */
/* 단계: 1.공통인수 → 2.인수분해공식 → 3.X자크로스 → 4.조립제법 → 5.스피드퀴즈 */
/* ========================================================= */

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
    const keypad = document.getElementById(keypadId);
    if (!keypad) return;
    keypad.querySelectorAll('.fk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!activeInput) return;
            if (btn.id && btn.id.startsWith('fk-del')) {
                activeInput.value = activeInput.value.slice(0, -1);
            } else {
                activeInput.value += btn.innerText;
            }
            activeInput.focus();
        });
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
        const powers = numTerms === 2 ? [Math.floor(Math.random() * 2) + 1, 0] : [2, 1, 0];
        const coeffs = Array.from({ length: numTerms }, () => (Math.floor(Math.random() * 4) + 1) * k);
        gcfProblem = { type: 0, k, coeffs, powers, numTerms };
        answerK = String(k);
        for (let i = 0; i < numTerms; i++) {
            const c = coeffs[i], p = powers[i];
            const term = p === 2 ? (c === 1 ? '' : c) + 'x^2' : p === 1 ? (c === 1 ? '' : c) + 'x' : String(c);
            exprStr += i === 0 ? term : ' + ' + term;
        }
    } else if (type === 1) {
        const p1 = Math.floor(Math.random() * 2) + 2;
        const p2 = 1;
        const minP = Math.min(p1, p2);
        const c1 = Math.floor(Math.random() * 4) + 1;
        const c2 = Math.floor(Math.random() * 4) + 1;
        gcfProblem = { type: 1, minP, c1, c2, p1, p2 };
        answerK = `x^${minP}`;
        const makeTerm = (c, p) => (c === 1 ? '' : c) + (p === 1 ? 'x' : `x^${p}`);
        exprStr = `${makeTerm(c1, p1)} + ${makeTerm(c2, p2)}`;
    } else {
        const minP = Math.floor(Math.random() * 2) + 1;
        const p1 = minP + 1;
        const p2 = minP;
        const c1 = (Math.floor(Math.random() * 3) + 1) * k;
        const c2 = (Math.floor(Math.random() * 3) + 1) * k;
        gcfProblem = { type: 2, k, minP, c1, c2, p1, p2 };
        answerK = `${k}x${minP > 1 ? '^' + minP : ''}`;
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

    document.getElementById('gcf-next-btn').style.display = 'none';
    const hint = document.getElementById('gcf-hint');
    if (hint) hint.style.display = 'none';
    document.getElementById('gcf-check-btn').disabled = false;
}

function checkGcf() {
    if (!gcfProblem) return;
    const uK = document.getElementById('gcf-input').value.trim();
    const uI = document.getElementById('gcf-inner-input').value.trim();
    const fb = document.getElementById('gcf-feedback');
    if (!uK || !uI) { fb.innerText = '두 칸을 모두 채워주세요.'; fb.style.color = '#e53e3e'; return; }

    const normalize = s => s.replace(/\s/g, '').toLowerCase();

    let expectedInner = '';
    if (gcfProblem.type === 0) {
        const innerCoeffs = gcfProblem.coeffs.map(c => c / gcfProblem.k);
        for (let i = 0; i < gcfProblem.numTerms; i++) {
            const c = innerCoeffs[i], p = gcfProblem.powers[i];
            const term = p === 2 ? (c === 1 ? '' : c) + 'x^2' : p === 1 ? (c === 1 ? '' : c) + 'x' : String(c);
            expectedInner += i === 0 ? term : '+' + term;
        }
    } else if (gcfProblem.type === 1) {
        const r1 = gcfProblem.p1 - gcfProblem.minP, r2 = gcfProblem.p2 - gcfProblem.minP;
        const t1 = (gcfProblem.c1 === 1 ? '' : gcfProblem.c1) + (r1 === 0 ? '' : r1 === 1 ? 'x' : 'x^' + r1);
        const t2 = (gcfProblem.c2 === 1 ? '' : gcfProblem.c2) + (r2 === 0 ? '' : r2 === 1 ? 'x' : 'x^' + r2);
        expectedInner = t1 + '+' + t2;
    } else {
        const r1 = gcfProblem.p1 - gcfProblem.minP, r2 = gcfProblem.p2 - gcfProblem.minP;
        const ic1 = gcfProblem.c1 / gcfProblem.k, ic2 = gcfProblem.c2 / gcfProblem.k;
        const t1 = (ic1 === 1 ? '' : ic1) + (r1 === 0 ? '' : r1 === 1 ? 'x' : 'x^' + r1);
        const t2 = (ic2 === 1 ? '' : ic2) + (r2 === 0 ? '' : r2 === 1 ? 'x' : 'x^' + r2);
        expectedInner = t1 + '+' + t2;
    }

    if (normalize(uK) === normalize(gcfProblem.answerK) && normalize(uI) === normalize(expectedInner)) {
        fb.innerHTML = `정답! 🎉 <strong>${uK}(${uI})</strong>`;
        fb.style.color = '#38a169';
        document.getElementById('gcf-next-btn').style.display = 'inline-block';
        document.getElementById('gcf-check-btn').disabled = true;
    } else if (normalize(uK) !== normalize(gcfProblem.answerK)) {
        fb.innerText = '공통인수가 맞지 않아요. 다시 찾아보세요!';
        fb.style.color = '#e53e3e';
    } else {
        fb.innerText = '공통인수는 맞았어요! 괄호 안을 다시 확인해보세요.';
        fb.style.color = '#ed8936';
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

let currentFormula = null, formulaScore = 0, formulaStreak = 0;
let currentFormulaTypeIdx = 0;

function generateFormulaProblem(typeIdx) {
    if (typeIdx !== undefined) currentFormulaTypeIdx = typeIdx;
    const type = FORMULA_TYPES[currentFormulaTypeIdx];
    const prob = type.generate();
    currentFormula = { ...prob, typeName: type.name, typeLatex: type.latex };

    // 사이드바 active 업데이트
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

    document.getElementById('formula-next-btn').style.display = 'none';
    document.getElementById('formula-hint-box').style.display = 'none';
    document.getElementById('formula-check-btn').disabled = false;
    document.getElementById('formula-score-val').innerText = formulaScore;
    document.getElementById('formula-streak-val').innerText = formulaStreak;
}

function checkFormula() {
    if (!currentFormula) return;
    const userAns = document.getElementById('formula-input').value.trim().replace(/\s/g, '').toLowerCase();
    const fb = document.getElementById('formula-feedback');
    if (!userAns) return;

    if (currentFormula.k > 1 && !userAns.startsWith(currentFormula.k.toString())) {
        fb.innerText = `공통인수 '${currentFormula.k}'를 먼저 묶어주세요!`;
        fb.style.color = '#e53e3e';
        formulaStreak = 0;
        document.getElementById('formula-streak-val').innerText = formulaStreak;
        return;
    }

    const cleanUser = userAns.replace(/([0-9])([a-z])/g, '$1*$2');
    const cleanAns = currentFormula.answers[0].replace(/([0-9])([a-z])/g, '$1*$2');

    if (isEquivalent(cleanUser, cleanAns, 'x') || currentFormula.answers.some(a => a.toLowerCase() === userAns)) {
        const fullEq = `${currentFormula.exprStr} = \\textcolor{#276749}{${currentFormula.answers[0]}}`;
        fb.innerHTML = `정답! 🎉<br><div style="font-size:24px;color:#2d3748;margin-top:10px;">${katex.renderToString(fullEq, { throwOnError: false })}</div>`;
        formulaScore += 10 + formulaStreak * 2;
        formulaStreak++;
        document.getElementById('formula-next-btn').style.display = 'inline-block';
        document.getElementById('formula-check-btn').disabled = true;
        document.getElementById('formula-score-val').innerText = formulaScore;
        document.getElementById('formula-streak-val').innerText = formulaStreak;
    } else {
        formulaStreak = 0;
        fb.innerText = '틀렸어요. 부호나 제곱 등을 다시 확인해보세요!';
        fb.style.color = '#e53e3e';
        document.getElementById('formula-streak-val').innerText = formulaStreak;
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
    } else {
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

    // 행 1: 계수
    const row1 = document.createElement('tr');
    const th0 = document.createElement('td');
    th0.className = 'syn-cell'; th0.style.background = '#f0f4ff';
    th0.innerHTML = `<strong style="color:#73a5ff">${r}</strong>`;
    row1.appendChild(th0);
    coeffs.forEach(c => {
        const td = document.createElement('td'); td.className = 'syn-cell coeff-cell'; td.innerText = c; row1.appendChild(td);
    });
    tbody.appendChild(row1);

    // 행 2: 곱셈 행
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

    // 행 3: 합계 행
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
                if (remainder === 0) {
                    const sign = r < 0 ? `+ ${Math.abs(r)}` : `- ${r}`;
                    const qLatex = formatQuotientLatex(syntheticRow.slice(0, -1));
                    const finalLatex = `(x ${sign})(${qLatex})`;
                    const fullEq = `${syntheticProblem.polyStr} = \\textcolor{#276749}{${finalLatex}}`;
                    katex.render(fullEq, document.getElementById('synthetic-problem'), { throwOnError: false });
                    if (actionFb) {
                        actionFb.innerHTML = `<div style="padding:15px;background:#f0fff4;border:1px solid #c6f6d5;border-radius:12px;margin-top:15px;text-align:center;">🎉 <strong>나머지가 0!</strong> 인수분해 성공!<br><div style="font-size:24px;color:#276749;margin-top:10px;">${katex.renderToString(finalLatex, { throwOnError: false })}</div></div>`;
                    }
                    document.getElementById('synthetic-next-btn').style.display = 'inline-block';
                } else {
                    if (actionFb) {
                        actionFb.innerHTML = `<div style="padding:15px;background:#fff5f5;border:1px solid #fed7d7;border-radius:12px;margin-top:15px;text-align:center;">🤔 나머지 = <strong>${remainder}</strong>. 나누어 떨어지지 않아요.<br><button id="syn-retry-btn" style="margin-top:12px;padding:10px 20px;font-size:14px;font-weight:600;background:#fc8181;color:white;border:none;border-radius:20px;cursor:pointer;">다른 숫자로 다시 도전!</button></div>`;
                        setTimeout(() => {
                            const rb = document.getElementById('syn-retry-btn');
                            if (rb) rb.addEventListener('click', resetSyntheticTry);
                        }, 50);
                    }
                }
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

let fqScore = 0, fqCombo = 0, fqCorrectIdx = 0, fqTotal = 0, fqCorrect = 0, fqWrong = 0, fqMaxCombo = 0;

function generateQuizProblem() {
    const fqProblem = document.getElementById('fq-problem');
    const fqOptions = document.querySelectorAll('.fq-btn');

    let p, r, q, s, k;
    const useGcd = fqScore > 30 && Math.random() < 0.35;
    if (useGcd) {
        k = Math.floor(Math.random() * 3) + 2; p = 1; r = 1;
        do { q = (Math.floor(Math.random() * 7) - 3); if (q === 0) q = 2; s = (Math.floor(Math.random() * 7) - 3); if (s === 0) s = -2; } while (q === s);
    } else {
        k = 1;
        do {
            p = fqScore > 50 ? (Math.floor(Math.random() * 3) + 1) : 1;
            r = fqScore > 50 ? (Math.floor(Math.random() * 2) + 1) : 1;
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
    fqTotal++;

    if (isCorrect) {
        btn.classList.add('correct'); fqCombo++; fqCorrect++;
        fqScore += 10 + fqCombo * 2;
        if (fqCombo > fqMaxCombo) fqMaxCombo = fqCombo;
    } else {
        btn.classList.add('wrong'); fqOptions[fqCorrectIdx].classList.add('correct');
        fqCombo = 0; fqWrong++;
    }

    // 대시보드 업데이트
    const totalEl = document.getElementById('fq-total');
    const correctEl = document.getElementById('fq-correct');
    const wrongEl = document.getElementById('fq-wrong');
    const maxComboEl = document.getElementById('fq-max-combo');
    const scoreEl = document.getElementById('fq-score-val');
    if (totalEl) totalEl.innerText = fqTotal;
    if (correctEl) correctEl.innerText = fqCorrect;
    if (wrongEl) wrongEl.innerText = fqWrong;
    if (maxComboEl) maxComboEl.innerText = fqMaxCombo;
    if (scoreEl) scoreEl.innerText = fqScore;

    setTimeout(generateQuizProblem, 1200);
}

/* ========================================================= */
/* ---- 탭 전환 & 초기화 ---- */
/* ========================================================= */

function switchFactorTab(tabName) {
    const map = {
        gcf: 'factor-gcf-container', formula: 'factor-formula-container',
        cross: 'factor-cross-container', synthetic: 'factor-synthetic-container', quiz: 'factor-quiz-container'
    };
    Object.values(map).forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const target = document.getElementById(map[tabName]);
    if (target) target.style.display = 'flex';

    if (tabName === 'gcf') generateGcfProblem();
    else if (tabName === 'formula') { formulaScore = 0; formulaStreak = 0; generateFormulaProblem(0); }
    else if (tabName === 'cross') generateCrossProblem();
    else if (tabName === 'synthetic') generateSyntheticProblem();
    else if (tabName === 'quiz') {
        fqScore = 0; fqCombo = 0; fqTotal = 0; fqCorrect = 0; fqWrong = 0; fqMaxCombo = 0;
        ['fq-total', 'fq-correct', 'fq-wrong', 'fq-max-combo', 'fq-score-val'].forEach(id => {
            const el = document.getElementById(id); if (el) el.innerText = '0';
        });
        generateQuizProblem();
    }
}

function initFactor() {
    /* ① 공통인수 */
    document.getElementById('gcf-check-btn').addEventListener('click', checkGcf);
    document.getElementById('gcf-next-btn').addEventListener('click', generateGcfProblem);
    // hint 버튼은 HTML에 없으므로 optional 처리
    const gcfHintBtn = document.getElementById('gcf-hint-btn');
    if (gcfHintBtn) {
        gcfHintBtn.addEventListener('click', () => {
            if (!gcfProblem) return;
            const hint = document.getElementById('gcf-hint');
            if (hint) {
                hint.style.display = 'block';
                if (gcfProblem.type === 0) {
                    const allGcd = gcfProblem.coeffs.reduce((acc, c) => gcd(acc, c), gcfProblem.coeffs[0]);
                    hint.innerText = `힌트: 계수 (${gcfProblem.coeffs.join(', ')}) 의 최대공약수는 ${allGcd}입니다.`;
                } else {
                    hint.innerText = `힌트: 공통인수는 "${gcfProblem.answerK}" 입니다.`;
                }
            }
        });
    }

    /* ② 인수분해 공식 — 사이드바 버튼 연결 */
    document.getElementById('formula-check-btn').addEventListener('click', checkFormula);
    document.getElementById('formula-next-btn').addEventListener('click', () => generateFormulaProblem());
    document.getElementById('formula-input').addEventListener('keypress', e => { if (e.key === 'Enter') checkFormula(); });
    const formulaHintBtn = document.getElementById('formula-hint-btn');
    if (formulaHintBtn) {
        formulaHintBtn.addEventListener('click', () => {
            if (!currentFormula) return;
            const hintBox = document.getElementById('formula-hint-box');
            if (hintBox) { hintBox.style.display = 'block'; hintBox.innerText = `💡 ${currentFormula.hint}\n정답 형식: ${currentFormula.answers[0]}`; }
        });
    }
    // 원인3 수정: 공식 사이드바 fm-btn 클릭 연결
    document.querySelectorAll('.fm-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => generateFormulaProblem(i));
    });

    /* ③ X자 크로스 */
    ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => {
        const el = document.getElementById(id); if (el) el.addEventListener('input', checkCross);
    });
    const fxNextBtn = document.getElementById('fx-next-btn2');
    if (fxNextBtn) fxNextBtn.addEventListener('click', generateCrossProblem);

    /* ④ 조립제법 */
    const synCheckBtn = document.getElementById('synthetic-check-btn');
    if (synCheckBtn) synCheckBtn.addEventListener('click', checkSyntheticStep);
    document.getElementById('synthetic-next-btn').addEventListener('click', generateSyntheticProblem);

    /* 숨겨진 탭 버튼 (main.js 인덱스 탭이 click() 호출) */
    document.querySelectorAll('.tab-btn[data-factortab]').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn[data-factortab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchFactorTab(e.target.dataset.factortab);
        });
    });

    /* 미니 키패드 */
    bindKeypad('gcf-keypad', ['gcf-input', 'gcf-inner-input']);
    bindKeypad('formula-keypad', ['formula-input']);

    switchFactorTab('gcf');
}