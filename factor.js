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
/* ---- 단계 3: 인수분해 공식 ---- */
/* ========================================================= */

const FORMULA_TYPES = [
    {
        name: '완전제곱식 (합)', latex: 'a^2 + 2ab + b^2 = (a+b)^2',
        generate() {
            const a = Math.floor(Math.random() * 3) + 1, b = Math.floor(Math.random() * 4) + 1;
            return { exprStr: `${a * a === 1 ? '' : a * a}x^2 + ${2 * a * b}x + ${b * b}`, answer: `(${a === 1 ? '' : a}x+${b})^2`, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '완전제곱식 (차)', latex: 'a^2 - 2ab + b^2 = (a-b)^2',
        generate() {
            const a = Math.floor(Math.random() * 3) + 1, b = Math.floor(Math.random() * 4) + 1;
            return { exprStr: `${a * a === 1 ? '' : a * a}x^2 - ${2 * a * b}x + ${b * b}`, answer: `(${a === 1 ? '' : a}x-${b})^2`, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '합차공식', latex: 'a^2 - b^2 = (a+b)(a-b)',
        generate() {
            const a = Math.floor(Math.random() * 4) + 1, b = Math.floor(Math.random() * 4) + 1;
            return { exprStr: `${a * a === 1 ? '' : a * a}x^2 - ${b * b}`, answer: `(${a === 1 ? '' : a}x+${b})(${a === 1 ? '' : a}x-${b})`, hint: `a=${a}x, b=${b}` };
        }
    },
    {
        name: '세제곱 합', latex: 'a^3 + b^3 = (a+b)(a^2-ab+b^2)',
        generate() {
            const b = Math.floor(Math.random() * 3) + 1;
            return { exprStr: `x^3 + ${b * b * b}`, answer: `(x+${b})(x^2-${b}x+${b * b})`, hint: `a=x, b=${b}` };
        }
    },
    {
        name: '세제곱 차', latex: 'a^3 - b^3 = (a-b)(a^2+ab+b^2)',
        generate() {
            const b = Math.floor(Math.random() * 3) + 1;
            return { exprStr: `x^3 - ${b * b * b}`, answer: `(x-${b})(x^2+${b}x+${b * b})`, hint: `a=x, b=${b}` };
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
    document.getElementById('formula-feedback').innerText = '인수분해 결과를 입력하세요. (예: (x+3)^2)';
    document.getElementById('formula-feedback').style.color = '#a0aec0';
    document.getElementById('formula-next-btn').style.display = 'none';
    document.getElementById('formula-hint-box').style.display = 'none';
    document.getElementById('formula-check-btn').disabled = false;
    document.getElementById('formula-score-val').innerText = formulaScore;
    document.getElementById('formula-streak-val').innerText = formulaStreak;
}

function checkFormula() {
    if (!currentFormula) return;
    const userAns = document.getElementById('formula-input').value.trim().replace(/\s/g, '');
    const correct = currentFormula.answer.replace(/\s/g, '');
    const fb = document.getElementById('formula-feedback');

    // 공통인수를 뽑지 않은 경우 감지
    if (/^\d+\(/.test(userAns) && !correct.startsWith(userAns[0])) {
        fb.innerText = '⚠️ 이 단계에서는 공통인수 없이 공식만 적용하세요!';
        fb.style.color = '#ed8936';
        return;
    }

    if (userAns.toLowerCase() === correct.toLowerCase()) {
        fb.innerHTML = `정답! 🎉`;
        fb.style.color = '#38a169';
        formulaScore += 10 + formulaStreak * 2;
        formulaStreak++;
        document.getElementById('formula-next-btn').style.display = 'inline-block';
        document.getElementById('formula-check-btn').disabled = true;
        document.getElementById('formula-score-val').innerText = formulaScore;
        document.getElementById('formula-streak-val').innerText = formulaStreak;
    } else {
        formulaStreak = 0;
        fb.innerText = `틀렸어요. 공식을 다시 확인해보세요!`;
        fb.style.color = '#e53e3e';
        document.getElementById('formula-streak-val').innerText = formulaStreak;
    }
}

/* ========================================================= */
/* ---- 단계 4: 조립제법 ---- */
/* ========================================================= */

let syntheticProblem = null, syntheticStep = 0, syntheticRow = [];

function generateSyntheticProblem() {
    let r = Math.floor(Math.random() * 5) - 2;
    if (r === 0) r = 1;
    const qa = Math.floor(Math.random() * 2) + 1;
    const qb = Math.floor(Math.random() * 5) - 2;
    const qc = Math.floor(Math.random() * 4) - 2;

    const a3 = qa, a2 = qb - r * qa, a1 = qc - r * qb, a0 = -r * qc;
    syntheticProblem = { r, coeffs: [a3, a2, a1, a0], qa, qb, qc };
    syntheticStep = 0;
    syntheticRow = [a3];

    let polyStr = '';
    [[a3, 'x^3'], [a2, 'x^2'], [a1, 'x'], [a0, '']].forEach(([c, name], i) => {
        if (c === 0) return;
        if (polyStr === '') polyStr += (c === 1 && name ? '' : c === -1 && name ? '-' : c) + name;
        else if (c > 0) polyStr += ` + ${c === 1 && name ? '' : c}${name}`;
        else polyStr += ` - ${Math.abs(c) === 1 && name ? '' : Math.abs(c)}${name}`;
    });

    katex.render(polyStr, document.getElementById('synthetic-problem'), { throwOnError: false });
    document.getElementById('synthetic-root-display').innerText = `해: x = ${r}`;
    document.getElementById('synthetic-feedback').innerText = '아래 표를 단계별로 채워보세요.';
    document.getElementById('synthetic-feedback').style.color = '#a0aec0';
    document.getElementById('synthetic-next-btn').style.display = 'none';
    renderSyntheticTable();
}

function renderSyntheticTable() {
    if (!syntheticProblem) return;
    const { r, coeffs } = syntheticProblem;
    const tbody = document.getElementById('synthetic-tbody');
    tbody.innerHTML = '';

    // 헤더: 계수 행
    const row1 = document.createElement('tr');
    const th0 = document.createElement('td');
    th0.className = 'syn-cell'; th0.style.background = '#f0f4ff';
    th0.innerHTML = `<strong style="color:#73a5ff">${r}</strong>`;
    row1.appendChild(th0);
    coeffs.forEach(c => {
        const td = document.createElement('td');
        td.className = 'syn-cell coeff-cell'; td.innerText = c;
        row1.appendChild(td);
    });
    tbody.appendChild(row1);

    // 곱셈 행
    const row2 = document.createElement('tr');
    const td0 = document.createElement('td'); td0.className = 'syn-cell'; row2.appendChild(td0);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell mult-cell';
        if (i === 0) td.innerText = '';
        else if (i <= syntheticStep) {
            td.innerText = syntheticRow[i - 1] * r;
            td.style.color = '#73a5ff'; td.style.fontWeight = '700';
        } else if (i === syntheticStep + 1) {
            const input = document.createElement('input');
            input.type = 'number'; input.className = 'syn-input'; input.id = 'syn-current-input';
            input.placeholder = '?';
            td.appendChild(input);
        }
        row2.appendChild(td);
    });
    tbody.appendChild(row2);

    // 합계 행
    const row3 = document.createElement('tr');
    const td00 = document.createElement('td'); td00.className = 'syn-cell'; row3.appendChild(td00);
    coeffs.forEach((c, i) => {
        const td = document.createElement('td'); td.className = 'syn-cell sum-cell';
        td.style.borderTop = '2px solid #4a5568';
        if (i < syntheticRow.length) { td.innerText = syntheticRow[i]; td.style.fontWeight = '800'; }
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
    if (!syntheticProblem) return;
    const { r, coeffs, qa, qb, qc } = syntheticProblem;
    const inp = document.getElementById('syn-current-input');
    if (!inp) return;

    const userVal = parseInt(inp.value);
    const expected = syntheticRow[syntheticStep] * r;
    const fb = document.getElementById('synthetic-feedback');

    if (isNaN(userVal)) { fb.innerText = '값을 입력하세요.'; fb.style.color = '#e53e3e'; return; }

    if (userVal === expected) {
        const nextSum = coeffs[syntheticStep + 1] + expected;
        syntheticRow.push(nextSum);
        syntheticStep++;
        if (syntheticStep === coeffs.length - 1) {
            const remainder = syntheticRow[syntheticRow.length - 1];
            if (remainder === 0) {
                const sign = r < 0 ? `+${Math.abs(r)}` : `-${r}`;
                const qStr = `${qa === 1 ? '' : qa}x^2${qb >= 0 ? '+' + qb : qb}x${qc >= 0 ? '+' + qc : qc}`;
                fb.innerHTML = `완성! 🎉 나머지 = 0<br><strong>(x${sign})(${qStr})</strong>`;
            } else {
                fb.innerHTML = `완성! 나머지 = ${remainder} (나머지가 0이 아님)`;
                fb.style.color = '#ed8936';
            }
            fb.style.color = remainder === 0 ? '#38a169' : '#ed8936';
            document.getElementById('synthetic-next-btn').style.display = 'inline-block';
        } else {
            fb.innerText = `✓ 맞아요! 계속하세요.`;
            fb.style.color = '#38a169';
        }
        renderSyntheticTable();
    } else {
        fb.innerText = `틀렸어요. ${syntheticRow[syntheticStep]} × ${r} 를 다시 계산해보세요.`;
        fb.style.color = '#e53e3e';
    }
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
