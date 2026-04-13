/* ========================================================= */
/* --- Factorization (인수분해) Logic --- */
/* 단계: 1.공통인수 → 2.X자크로스 → 3.인수분해공식 → 4.조립제법 → 5.스피드퀴즈 */
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

/* ========================================================= */
/* ---- 단계 1: 공통인수 (GCF) ---- */
/* ========================================================= */

let gcfProblem = null;

function generateGcfProblem() {
    const k = Math.floor(Math.random() * 4) + 2;
    const type = Math.floor(Math.random() * 3); // 0: 숫자만, 1: 문자포함, 2: 숫자+문자

    let exprStr = '';
    let answerK = '';
    let terms = [];

    if (type === 0) {
        // 기존: 숫자 공통인수
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
        // 문자 공통인수: ax^n + bx^m (반드시 차수가 다르게)
        const p1 = Math.floor(Math.random() * 2) + 2; // 2~3
        const p2 = 1; // 항상 1로 고정 → p1과 달라서 동류항 방지
        const minP = Math.min(p1, p2);
        const c1 = Math.floor(Math.random() * 4) + 1;
        const c2 = Math.floor(Math.random() * 4) + 1;
        gcfProblem = { type: 1, minP, c1, c2, p1, p2 };
        answerK = `x^${minP}`;

        const makeTerm = (c, p) => (c === 1 ? '' : c) + (p === 1 ? 'x' : `x^${p}`);
        exprStr = `${makeTerm(c1, p1)} + ${makeTerm(c2, p2)}`;

    } else {
        // 숫자+문자 공통인수: kx^m 형태
        const minP = Math.floor(Math.random() * 2) + 1; // 1~2
        const p1 = minP + 1; // 반드시 p2보다 1 높게 고정 → 동류항 방지
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
    document.getElementById('gcf-feedback').innerText = '공통인수와 괄호 안의 식을 입력하세요.';
    document.getElementById('gcf-feedback').style.color = '#a0aec0';
    document.getElementById('gcf-next-btn').style.display = 'none';
    document.getElementById('gcf-hint').style.display = 'none';
    document.getElementById('gcf-check-btn').disabled = false;
}

function checkGcf() {
    if (!gcfProblem) return;
    const userK = document.getElementById('gcf-input').value.trim().replace(/\s/g, '');
    const userInner = document.getElementById('gcf-inner-input').value.trim().replace(/\s/g, '');
    const fb = document.getElementById('gcf-feedback');

    if (!userK) { fb.innerText = '공통인수를 입력하세요.'; fb.style.color = '#e53e3e'; return; }

    const normalize = s => s.toLowerCase().replace(/\s/g, '').replace(/\*\*/g, '^');
    const correctK = normalize(gcfProblem.answerK);
    const userKn = normalize(userK);

    if (userKn !== correctK) {
        fb.innerText = `공통인수가 맞지 않아요. 다시 찾아보세요!`;
        fb.style.color = '#e53e3e';
        return;
    }

    // 괄호 안 식 계산
    let expectedInner = '';
    if (gcfProblem.type === 0) {
        const innerCoeffs = gcfProblem.coeffs.map(c => c / gcfProblem.k);
        for (let i = 0; i < gcfProblem.numTerms; i++) {
            const c = innerCoeffs[i], p = gcfProblem.powers[i];
            const term = p === 2 ? (c === 1 ? '' : c) + 'x^2' : p === 1 ? (c === 1 ? '' : c) + 'x' : String(c);
            expectedInner += i === 0 ? term : '+' + term;
        }
    } else if (gcfProblem.type === 1) {
        const r1 = gcfProblem.p1 - gcfProblem.minP;
        const r2 = gcfProblem.p2 - gcfProblem.minP;
        const t1 = (gcfProblem.c1 === 1 ? '' : gcfProblem.c1) + (r1 === 0 ? '' : (r1 === 1 ? 'x' : 'x^' + r1));
        const t2 = (gcfProblem.c2 === 1 ? '' : gcfProblem.c2) + (r2 === 0 ? '' : (r2 === 1 ? 'x' : 'x^' + r2));
        expectedInner = t1 + '+' + t2;
    } else {
        const r1 = gcfProblem.p1 - gcfProblem.minP;
        const r2 = gcfProblem.p2 - gcfProblem.minP;
        const ic1 = gcfProblem.c1 / gcfProblem.k, ic2 = gcfProblem.c2 / gcfProblem.k;
        const t1 = (ic1 === 1 ? '' : ic1) + (r1 === 0 ? '' : (r1 === 1 ? 'x' : 'x^' + r1));
        const t2 = (ic2 === 1 ? '' : ic2) + (r2 === 0 ? '' : (r2 === 1 ? 'x' : 'x^' + r2));
        expectedInner = t1 + '+' + t2;
    }

    if (normalize(userInner) === normalize(expectedInner)) {
        fb.innerHTML = `정답! 🎉 <strong>${userK}(${userInner})</strong>`;
        fb.style.color = '#38a169';
        document.getElementById('gcf-next-btn').style.display = 'inline-block';
        document.getElementById('gcf-check-btn').disabled = true;
    } else {
        fb.innerText = `공통인수는 맞았어요! 괄호 안을 다시 확인해보세요.`;
        fb.style.color = '#ed8936';
    }
}

/* ========================================================= */
/* ---- 단계 2: X자 크로스 ---- */
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

    const fxProblem = document.getElementById('fx-problem');
    katex.render(formatPoly(currentFx.a, currentFx.b, currentFx.c), fxProblem, { throwOnError: false });

    ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.disabled = false; }
    });
    document.querySelector('.fx-board').classList.remove('fx-success');
    const nxt = document.getElementById('fx-next-btn2');
    if (nxt) nxt.style.display = 'none';
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
        document.getElementById('fx-feedback').innerHTML = `정답입니다! 🎉<br><span style="font-size:22px;color:#2d3748;">${ansStr}</span>`;
        const nxt = document.getElementById('fx-next-btn2');
        if (nxt) nxt.style.display = 'inline-block';
    } else {
        document.querySelector('.fx-board').classList.remove('fx-success');
        document.getElementById('fx-feedback').innerText = '가운데 일차항 계수(b)가 맞지 않아요.';
        document.getElementById('fx-feedback').style.color = '#e53e3e';
    }
}

/* ========================================================= */
/* ---- 단계 3: 인수분해 공식 (공통인수 추출 필수) ---- */
/* ========================================================= */

const FORMULA_TYPES = [
    {
        name: '완전제곱식 (합)', latex: 'a^2 + 2ab + b^2 = (a+b)^2',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1; // 공통인수 (1~3)
            let a, b;
            do { a = Math.floor(Math.random() * 3) + 1; b = Math.floor(Math.random() * 4) + 1; } while (gcd(a, b) !== 1); // a, b는 서로소

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
            const inside1 = `(${a === 1 ? '' : a}x+${b})(${a === 1 ? '' : a}x-${b})`;
            const inside2 = `(${a === 1 ? '' : a}x-${b})(${a === 1 ? '' : a}x+${b})`; // 교환법칙 허용
            return { exprStr, answers: k === 1 ? [inside1, inside2] : [`${k}${inside1}`, `${k}${inside2}`], k, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '세제곱 합', latex: 'a^3 + b^3 = (a+b)(a^2-ab+b^2)',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            const b = Math.floor(Math.random() * 3) + 1;
            const A = k, C = k * b * b * b;
            const exprStr = `${A === 1 ? '' : A}x^3 + ${C}`;
            const inside = `(x+${b})(x^2-${b}x+${b * b})`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=x, b=${b}` };
        }
    },
    {
        name: '세제곱 차', latex: 'a^3 - b^3 = (a-b)(a^2+ab+b^2)',
        generate() {
            const k = Math.floor(Math.random() * 3) + 1;
            const b = Math.floor(Math.random() * 3) + 1;
            const A = k, C = k * b * b * b;
            const exprStr = `${A === 1 ? '' : A}x^3 - ${C}`;
            const inside = `(x-${b})(x^2+${b}x+${b * b})`;
            return { exprStr, answers: [k === 1 ? inside : `${k}${inside}`], k, hint: `a=x, b=${b}` };
        }
    }
];

let currentFormula = null, formulaScore = 0, formulaStreak = 0;

function generateFormulaProblem() {
    const maxIdx = formulaScore < 20 ? 3 : FORMULA_TYPES.length;
    const type = FORMULA_TYPES[Math.floor(Math.random() * maxIdx)];
    const prob = type.generate();
    currentFormula = { ...prob, typeName: type.name, typeLatex: type.latex };

    document.getElementById('formula-type-name').innerText = type.name;
    katex.render(type.latex, document.getElementById('formula-type-latex'), { throwOnError: false });
    katex.render(prob.exprStr, document.getElementById('formula-problem'), { throwOnError: false });
    document.getElementById('formula-input').value = '';

    // 안내 문구 변경 (공통인수 추출 권장)
    const fb = document.getElementById('formula-feedback');
    fb.innerHTML = '<strong>💡 주의:</strong> 숨어있는 공통인수가 있다면 반드시 먼저 괄호 밖으로 묶어낸 후 공식을 적용하세요!';
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

    // 공통인수가 있는데 안 뽑은 경우 힌트 주기
    if (currentFormula.k > 1 && !userAns.startsWith(currentFormula.k.toString())) {
        fb.innerText = `아차! 식 전체를 나눌 수 있는 공통인수 '${currentFormula.k}'가 숨어있어요. 먼저 묶어주세요!`;
        fb.style.color = '#e53e3e';
        formulaStreak = 0;
        document.getElementById('formula-streak-val').innerText = formulaStreak;
        return;
    }

    // 정답 체크 (여러 형태의 정답 중 하나라도 맞으면 통과)
    const isCorrect = currentFormula.answers.some(ans => ans.toLowerCase() === userAns);

    if (isCorrect) {
        fb.innerHTML = `정답! 🎉 공통인수와 공식을 완벽하게 적용했어요!`;
        fb.style.color = '#38a169';
        formulaScore += 10 + formulaStreak * 2;
        formulaStreak++;
        document.getElementById('formula-next-btn').style.display = 'inline-block';
        document.getElementById('formula-check-btn').disabled = true;
        document.getElementById('formula-score-val').innerText = formulaScore;
        document.getElementById('formula-streak-val').innerText = formulaStreak;
    } else {
        formulaStreak = 0;
        fb.innerText = `틀렸어요. 부호나 제곱 등을 다시 확인해보세요!`;
        fb.style.color = '#e53e3e';
        document.getElementById('formula-streak-val').innerText = formulaStreak;
    }
}

/* ========================================================= */
/* ---- 단계 4: 조립제법 (결과식 옆에 등호로 이어붙이기) ---- */
/* ========================================================= */

let syntheticProblem = null;
let syntheticPhase = 0;
let userGuessR = null;
let currentCol = 0;
let currentRow = 2;
let syntheticMiddleRow = [];
let syntheticRow = [];

function generateSyntheticProblem() {
    let r = Math.floor(Math.random() * 5) - 2;
    if (r === 0) r = 1;
    const qa = Math.floor(Math.random() * 2) + 1;
    const qb = Math.floor(Math.random() * 5) - 2;
    const qc = Math.floor(Math.random() * 4) - 2;

    const a3 = qa, a2 = qb - r * qa, a1 = qc - r * qb, a0 = -r * qc;
    syntheticProblem = { r, coeffs: [a3, a2, a1, a0], qa, qb, qc };

    syntheticPhase = 0;
    userGuessR = null;
    currentCol = 0;
    currentRow = 2;
    syntheticMiddleRow = [];
    syntheticRow = [];

    // 문제 식 생성
    let polyStr = '';
    [[a3, 'x^3'], [a2, 'x^2'], [a1, 'x'], [a0, '']].forEach(([c, name], i) => {
        if (c === 0) return;
        if (polyStr === '') polyStr += (c === 1 && name ? '' : c === -1 && name ? '-' : c) + name;
        else if (c > 0) polyStr += ` + ${c === 1 && name ? '' : c}${name}`;
        else polyStr += ` - ${Math.abs(c) === 1 && name ? '' : Math.abs(c)}${name}`;
    });

    // 원본 식을 기억해둡니다. (나중에 등호를 붙이기 위해)
    syntheticProblem.polyStr = polyStr;

    katex.render(polyStr, document.getElementById('synthetic-problem'), { throwOnError: false });

    const rootDisplay = document.getElementById('synthetic-root-display');
    if (rootDisplay) rootDisplay.innerText = '';

    const feedback = document.getElementById('synthetic-feedback');
    feedback.innerHTML = `
        <div id="guess-phase-ui" style="margin-bottom: 15px; text-align: center;">
            <p style="margin-bottom: 12px; color: #2d3748; font-size: 15px;">
                💡 <strong>인수정리:</strong> 이 다항식에 <br>
                <code style="font-size:16px;">x = </code> <input type="number" id="syn-guess-input" class="syn-input" style="width: 60px; text-align:center; border-radius: 8px; border: 2px solid #a3bffa;" placeholder="?"> 
                를 대입하면 식의 값이 0이 될 것 같아요!
            </p>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
                <button id="syn-guess-btn" style="padding: 10px 20px; font-size: 15px; font-weight: 600; background: #a3bffa; color: #2c5282; border: none; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 6px rgba(163,191,250,0.4);">조립제법 표 만들기</button>
                <button id="syn-hint-btn" style="padding: 10px 16px; font-size: 14px; font-weight: 600; background: #fbd38d; color: #9c4221; border: none; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 6px rgba(251,211,141,0.4);">💡 힌트 보기</button>
            </div>
        </div>
        <div id="syn-hint-box" style="display: none; font-size: 13px; color: #718096; background: #fffaf0; padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px dashed #fbd38d;">
            <strong>※ 팁:</strong> 대입해서 0이 되는 후보 숫자는 주로<br>
            <code>±(상수항의 약수) / (최고차항 계수의 약수)</code> 중에 있어요.<br>
            이 식의 상수항은 <strong>${a0}</strong> 이네요! ${a0}의 약수들을 하나씩 넣어보세요.
        </div>
        <div id="syn-action-feedback" style="font-size: 14px;"></div>
    `;

    document.getElementById('synthetic-next-btn').style.display = 'none';
    document.getElementById('synthetic-tbody').innerHTML = '';

    document.getElementById('syn-guess-btn').addEventListener('click', startSyntheticWithGuess);
    document.getElementById('syn-guess-input').addEventListener('keypress', e => { if (e.key === 'Enter') startSyntheticWithGuess(); });
    document.getElementById('syn-hint-btn').addEventListener('click', () => {
        document.getElementById('syn-hint-box').style.display = 'block';
        document.getElementById('syn-hint-btn').style.display = 'none';
    });
}

function startSyntheticWithGuess() {
    const guessInput = document.getElementById('syn-guess-input');
    const val = parseInt(guessInput.value);
    const feedback = document.getElementById('syn-action-feedback');

    if (isNaN(val)) {
        feedback.innerText = '어떤 숫자를 대입할지 입력해주세요.';
        feedback.style.color = '#e53e3e';
        return;
    }

    userGuessR = val;
    syntheticPhase = 1;
    currentCol = 0;
    currentRow = 2;
    syntheticMiddleRow = new Array(syntheticProblem.coeffs.length).fill(null);
    syntheticRow = [];

    guessInput.disabled = true;
    document.getElementById('syn-guess-btn').style.display = 'none';
    document.getElementById('syn-hint-btn').style.display = 'none';
    const hintBox = document.getElementById('syn-hint-box');
    if (hintBox) hintBox.style.display = 'none';

    feedback.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom: 8px; justify-content:center;">
            <span style="color:#3182ce;"><strong>x = ${userGuessR}</strong> (으)로 조립제법 진행 중</span>
            <button id="syn-cancel-btn" style="padding:6px 12px; font-size:12px; background:#e2e8f0; color:#4a5568; border:none; border-radius:15px; cursor:pointer; font-weight:bold;">숫자 다시 고르기 ↩</button>
        </div>
        <div id="syn-step-msg" style="color:#4a5568; font-weight:bold; margin-top:5px;">첫 번째 계수는 계산 없이 그대로 아래로 내려 적으세요.</div>
    `;

    setTimeout(() => {
        const cancelBtn = document.getElementById('syn-cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', resetSyntheticTry);
    }, 50);

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
    th0.className = 'syn-cell'; th0.style.background = '#f0f4ff'; th0.style.borderRadius = '8px 0 0 0';
    th0.innerHTML = `<strong style="color:#73a5ff">${r}</strong>`;
    row1.appendChild(th0);
    coeffs.forEach(c => {
        const td = document.createElement('td');
        td.className = 'syn-cell coeff-cell'; td.innerText = c;
        row1.appendChild(td);
    });
    tbody.appendChild(row1);

    const row2 = document.createElement('tr');
    const td0 = document.createElement('td'); td0.className = 'syn-cell'; row2.appendChild(td0);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell mult-cell';
        if (i === 0) {
            td.innerText = '';
        } else if (i < currentCol || (i === currentCol && currentRow === 2)) {
            td.innerText = syntheticMiddleRow[i];
            td.style.color = '#73a5ff'; td.style.fontWeight = '700';
        } else if (i === currentCol && currentRow === 1 && syntheticPhase === 1) {
            const input = document.createElement('input');
            input.type = 'number'; input.className = 'syn-input'; input.id = 'syn-current-input';
            input.placeholder = '곱하기';
            input.style.borderRadius = '6px'; input.style.border = '2px solid #a3bffa';
            td.appendChild(input);
        }
        row2.appendChild(td);
    });
    tbody.appendChild(row2);

    const row3 = document.createElement('tr');
    const td00 = document.createElement('td'); td00.className = 'syn-cell'; row3.appendChild(td00);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell sum-cell';
        td.style.borderTop = '2px solid #4a5568';

        if (i < currentCol || (i === currentCol && currentRow > 2) || (i === 0 && currentCol > 0)) {
            td.innerText = syntheticRow[i];
            td.style.fontWeight = '800';
            if (i === coeffs.length - 1) {
                td.style.border = '2px dashed #ed8936';
                td.style.backgroundColor = '#fffaf0';
                td.style.borderRadius = '0 0 8px 0';
            }
        } else if (i === currentCol && currentRow === 2 && syntheticPhase === 1) {
            const input = document.createElement('input');
            input.type = 'number'; input.className = 'syn-input'; input.id = 'syn-current-input';
            input.placeholder = i === 0 ? '내리기' : '더하기';
            input.style.borderRadius = '6px'; input.style.border = '2px solid #a3bffa';
            td.appendChild(input);
        }
        row3.appendChild(td);
    });
    tbody.appendChild(row3);

    const inp = document.getElementById('syn-current-input');
    if (inp) {
        inp.focus();
        inp.addEventListener('keypress', e => { if (e.key === 'Enter') checkSyntheticStep(); });
    }
}

function checkSyntheticStep() {
    if (!syntheticProblem || syntheticPhase !== 1) return;
    const coeffs = syntheticProblem.coeffs;
    const r = userGuessR;

    const inp = document.getElementById('syn-current-input');
    if (!inp) return;

    const userVal = parseInt(inp.value);

    let msgEl = document.getElementById('syn-step-msg');
    let feedback = document.getElementById('syn-action-feedback');

    if (isNaN(userVal)) {
        if (msgEl) { msgEl.innerText = '빈칸에 알맞은 값을 입력하세요.'; msgEl.style.color = '#e53e3e'; }
        return;
    }

    if (currentCol === 0 && currentRow === 2) {
        const expected = coeffs[0];
        if (userVal === expected) {
            syntheticRow[0] = expected;
            currentCol = 1;
            currentRow = 1;
            if (msgEl) { msgEl.innerText = `✓ 맞아요! 이제 왼쪽 숫자(${r})와 방금 내린 수를 곱해서 오른쪽 대각선 위로 적으세요.`; msgEl.style.color = '#38a169'; }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. 첫 번째 계수는 계산 없이 그대로 아래로 적어야 해요! (${expected})`; msgEl.style.color = '#e53e3e'; }
        }
        return;
    }

    if (currentRow === 1) {
        const expected = syntheticRow[currentCol - 1] * r;
        if (userVal === expected) {
            syntheticMiddleRow[currentCol] = expected;
            currentRow = 2;
            if (msgEl) { msgEl.innerText = `✓ 맞아요! 이제 위아래 수를 더해서 아래칸에 적으세요.`; msgEl.style.color = '#38a169'; }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. 왼쪽 숫자(${r})와 아래 숫자(${syntheticRow[currentCol - 1]})를 곱해야 해요!`; msgEl.style.color = '#e53e3e'; }
        }
    } else if (currentRow === 2) {
        const expected = coeffs[currentCol] + syntheticMiddleRow[currentCol];
        if (userVal === expected) {
            syntheticRow[currentCol] = expected;

            if (currentCol === coeffs.length - 1) {
                // 조립제법 완성
                syntheticPhase = 2;
                const remainder = syntheticRow[syntheticRow.length - 1];

                if (remainder === 0) {
                    const sign = r < 0 ? `+ ${Math.abs(r)}` : `- ${r}`;
                    const qLatex = formatQuotientLatex(syntheticRow.slice(0, -1));
                    const finalLatex = `(x ${sign})(${qLatex})`;

                    // [핵심 변경점] 원본 문제 식 옆에 등호와 함께 결과 식을 이어 붙여줍니다.
                    // \textcolor{#276749}를 사용하여 결과식을 초록색으로 강조합니다.
                    const fullEquationLatex = `${syntheticProblem.polyStr} = \\textcolor{#276749}{${finalLatex}}`;
                    katex.render(fullEquationLatex, document.getElementById('synthetic-problem'), { throwOnError: false });

                    const renderedMath = katex.renderToString(finalLatex, { throwOnError: false });

                    if (feedback) {
                        feedback.innerHTML = `
                            <div style="padding: 15px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 12px; margin-top: 15px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                🎉 <strong>나머지가 0이네요!</strong> 인수분해 성공!<br><br>
                                <div style="font-size:24px; color:#276749; margin-top:10px;">${renderedMath}</div>
                            </div>`;
                    }
                    const nextBtn = document.getElementById('synthetic-next-btn');
                    if (nextBtn) {
                        nextBtn.style.display = 'inline-block';
                        nextBtn.innerText = '다음 문제 풀기';
                    }
                } else {
                    if (feedback) {
                        feedback.innerHTML = `
                            <div style="padding: 15px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; margin-top: 15px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                🤔 나머지 = <strong>${remainder}</strong><br>
                                나머지가 0이 아니므로 나누어 떨어지지 않아요.<br>
                                <button id="syn-retry-btn" style="margin-top:12px; padding:10px 20px; font-size:14px; font-weight:600; background:#fc8181; color:white; border:none; border-radius:20px; cursor:pointer; box-shadow: 0 4px 6px rgba(252,129,129,0.4);">다른 숫자로 다시 도전!</button>
                            </div>`;
                        setTimeout(() => {
                            const retryBtn = document.getElementById('syn-retry-btn');
                            if (retryBtn) retryBtn.addEventListener('click', resetSyntheticTry);
                        }, 50);
                    }
                }
            } else {
                currentCol++;
                currentRow = 1;
                if (msgEl) { msgEl.innerText = `✓ 합계가 맞아요! 다시 왼쪽 해(${r})와 대각선으로 곱해보세요.`; msgEl.style.color = '#38a169'; }
            }
            renderSyntheticTable();
        } else {
            if (msgEl) { msgEl.innerText = `틀렸어요. 위 숫자(${coeffs[currentCol]})와 아래 숫자(${syntheticMiddleRow[currentCol]})를 더해야 해요!`; msgEl.style.color = '#e53e3e'; }
        }
    }
}

function resetSyntheticTry() {
    syntheticPhase = 0;
    userGuessR = null;
    currentCol = 0;
    currentRow = 2;
    syntheticMiddleRow = [];
    syntheticRow = [];

    // 다시 도전할 때는 문제 식에서 등호 뒤를 제거하고 원본만 다시 보여줍니다.
    if (syntheticProblem && syntheticProblem.polyStr) {
        katex.render(syntheticProblem.polyStr, document.getElementById('synthetic-problem'), { throwOnError: false });
    }

    const guessInput = document.getElementById('syn-guess-input');
    guessInput.disabled = false;
    guessInput.value = '';

    document.getElementById('syn-guess-btn').style.display = 'inline-block';
    document.getElementById('syn-hint-btn').style.display = 'inline-block';

    const feedback = document.getElementById('syn-action-feedback');
    if (feedback) {
        feedback.innerText = '';
    }

    document.getElementById('synthetic-tbody').innerHTML = '';
}

function formatQuotientLatex(coeffs) {
    if (!coeffs || coeffs.length === 0) return '0';
    let str = '';
    const degree = coeffs.length - 1;

    coeffs.forEach((c, i) => {
        if (c === 0) return;
        const p = degree - i;
        let term = '';

        let absC = Math.abs(c);
        if (p > 0) {
            if (absC === 1) term = '';
            else term = absC.toString();
            term += p === 1 ? 'x' : `x^{${p}}`;
        } else {
            term = absC.toString();
        }

        if (str === '') {
            str += (c < 0 ? '-' : '') + term;
        } else {
            str += c > 0 ? ` + ${term}` : ` - ${term}`;
        }
    });
    return str || '0';
}

/* ========================================================= */
/* ---- 단계 5: 스피드 퀴즈 ---- */
/* ========================================================= */

let fqScore = 0, fqCombo = 0, fqCorrectIdx = 0;

function generateQuizProblem() {
    const fqProblem = document.getElementById('fq-problem');
    const fqOptions = document.querySelectorAll('.fq-btn');
    const fqScoreVal = document.getElementById('fq-score-val');
    const fqComboBox = document.getElementById('fq-combo-box');

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
    const distractors = new Set([buildAnswer(k, p, -q, r, -s), buildAnswer(k, p, q, r, -s), buildAnswer(k, p, -q, r, s), buildAnswer(k, p, q + 1, r, s - 1), buildAnswer(k, p, q - 1, r, s + 1)]);
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
    const fqScoreVal = document.getElementById('fq-score-val');
    const fqComboVal = document.getElementById('fq-combo-val');
    const fqComboBox = document.getElementById('fq-combo-box');

    fqOptions.forEach(b => b.disabled = true);
    if (isCorrect) {
        btn.classList.add('correct'); fqCombo++;
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
/* ---- 탭 전환 & 초기화 ---- */
/* ========================================================= */

function switchFactorTab(tabName) {
    const ids = ['factor-gcf-container', 'factor-cross-container', 'factor-formula-container', 'factor-synthetic-container', 'factor-quiz-container'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const map = { gcf: 'factor-gcf-container', cross: 'factor-cross-container', formula: 'factor-formula-container', synthetic: 'factor-synthetic-container', quiz: 'factor-quiz-container' };
    const target = document.getElementById(map[tabName]);
    if (target) target.style.display = 'flex';

    if (tabName === 'gcf') generateGcfProblem();
    else if (tabName === 'cross') generateCrossProblem();
    else if (tabName === 'formula') { formulaScore = 0; formulaStreak = 0; generateFormulaProblem(); }
    else if (tabName === 'synthetic') generateSyntheticProblem();
    else if (tabName === 'quiz') { fqScore = 0; fqCombo = 0; document.getElementById('fq-score-val').innerText = 0; document.getElementById('fq-combo-box').style.opacity = 0; generateQuizProblem(); }
}

function initFactor() {
    document.getElementById('gcf-check-btn').addEventListener('click', checkGcf);
    document.getElementById('gcf-hint-btn').addEventListener('click', () => {
        if (!gcfProblem) return;
        const hint = document.getElementById('gcf-hint');
        hint.style.display = 'block';
        const allGcd = gcfProblem.coeffs.reduce((acc, c) => gcd(acc, c), gcfProblem.coeffs[0]);
        hint.innerText = `힌트: 계수 (${gcfProblem.coeffs.join(', ')}) 의 최대공약수는 ${allGcd}입니다.`;
    });
    document.getElementById('gcf-next-btn').addEventListener('click', generateGcfProblem);

    ['fx-x1', 'fx-x2', 'fx-y1', 'fx-y2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', checkCross);
    });
    const fxNextBtn = document.getElementById('fx-next-btn2');
    if (fxNextBtn) fxNextBtn.addEventListener('click', generateCrossProblem);

    document.getElementById('formula-check-btn').addEventListener('click', checkFormula);
    document.getElementById('formula-hint-btn').addEventListener('click', () => {
        if (!currentFormula) return;
        const hintBox = document.getElementById('formula-hint-box');
        hintBox.style.display = 'block';
        hintBox.innerText = `💡 ${currentFormula.hint}\n정답 형식: ${currentFormula.answer}`;
    });
    document.getElementById('formula-next-btn').addEventListener('click', generateFormulaProblem);
    document.getElementById('formula-input').addEventListener('keypress', e => { if (e.key === 'Enter') checkFormula(); });

    document.getElementById('synthetic-check-btn').addEventListener('click', checkSyntheticStep);
    document.getElementById('synthetic-next-btn').addEventListener('click', generateSyntheticProblem);

    document.querySelectorAll('.tab-btn[data-factortab]').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn[data-factortab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchFactorTab(e.target.dataset.factortab);
        });
    });

    switchFactorTab('gcf');
}
