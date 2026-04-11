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

function formatPoly(a, b, c) {
    let str = "";
    if (a === 1) str += "x^2";
    else if (a === -1) str += "-x^2";
    else str += a + "x^2";
    if (b > 0) str += (b === 1 ? " + x" : " + " + b + "x");
    else if (b < 0) str += (b === -1 ? " - x" : " - " + Math.abs(b) + "x");
    if (c > 0) str += " + " + c;
    else if (c < 0) str += " - " + Math.abs(c);
    return str;
}

function generateCrossProblem() {
    let p = Math.floor(Math.random() * 3) + 1;
    let r = Math.floor(Math.random() * 2) + 1;
    let q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 1;
    let s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -1;

    currentFx.a = p * r;
    currentFx.c = q * s;
    currentFx.b = (p * s) + (q * r);

    katex.render(formatPoly(currentFx.a, currentFx.b, currentFx.c), fxProblem, { throwOnError: false });
    fxInputs.forEach(inp => { inp.value = ''; inp.disabled = false; });
    fxBoard.classList.remove('fx-success');
    fxNextBtn.style.display = 'none';
    fxCalc1.innerText = '?'; fxCalc2.innerText = '?'; fxCalcSum.innerText = '?';
    fxFeedback.innerText = "빈칸에 숫자를 넣어보세요!";
    fxFeedback.style.color = "#a0aec0";
}

function checkCross() {
    let x1 = parseInt(fxInputs[0].value);
    let x2 = parseInt(fxInputs[1].value);
    let y1 = parseInt(fxInputs[2].value);
    let y2 = parseInt(fxInputs[3].value);
    if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) return;

    let cross1 = x1 * y2, cross2 = x2 * y1, sum = cross1 + cross2;
    fxCalc1.innerText = cross1; fxCalc2.innerText = cross2; fxCalcSum.innerText = sum;

    if (x1 * x2 === currentFx.a && y1 * y2 === currentFx.c && sum === currentFx.b) {
        fxBoard.classList.add('fx-success');
        fxInputs.forEach(inp => inp.disabled = true);
        let formatFacLocal = (c1, c2) => {
            let partX = (c1 === 1 ? "x" : (c1 === -1 ? "-x" : c1 + "x"));
            if (c2 === 0) return partX;
            return `(${partX}${c2 > 0 ? "+" + c2 : c2})`;
        };
        let f1 = formatFacLocal(x1, y1), f2 = formatFacLocal(x2, y2);
        let finalAns = [f1, f2].sort((a, b) => a.startsWith('(') && !b.startsWith('(') ? 1 : (!a.startsWith('(') && b.startsWith('(') ? -1 : a.localeCompare(b))).join('');
        fxFeedback.innerHTML = `정답입니다! 🎉<br><span style="font-size:22px;color:#2d3748;">${finalAns}</span>`;
        fxNextBtn.style.display = 'inline-block';
    } else {
        fxBoard.classList.remove('fx-success');
        fxFeedback.innerText = "가운데 일차항 계수(b)가 맞지 않아요.";
        fxFeedback.style.color = "#e53e3e";
    }
}

/* ---- 퀴즈 모드 ---- */
const fqProblem = document.getElementById('fq-problem');
const fqOptions = document.querySelectorAll('.fq-btn');
const fqScoreVal = document.getElementById('fq-score-val');
const fqComboVal = document.getElementById('fq-combo-val');
const fqComboBox = document.getElementById('fq-combo-box');

let fqScore = 0, fqCombo = 0, fqCorrectIdx = 0;

function generateQuizProblem() {
    let p = 1, r = 1;
    if (fqScore > 50) { p = Math.floor(Math.random() * 3) + 1; r = Math.floor(Math.random() * 2) + 1; }
    let q = (Math.floor(Math.random() * 9) - 4); if (q === 0) q = 2;
    let s = (Math.floor(Math.random() * 9) - 4); if (s === 0) s = -2;
    let a = p * r, c = q * s, b = p * s + q * r;
    katex.render(formatPoly(a, b, c), fqProblem, { throwOnError: false });

    let formatFac = (c1, c2) => {
        let partX = (c1 === 1 ? "x" : (c1 === -1 ? "-x" : c1 + "x"));
        if (c2 === 0) return partX;
        return `(${partX}${c2 > 0 ? "+" + c2 : c2})`;
    };
    let getCanonical = (p1, q1, p2, q2) => {
        let f1 = formatFac(p1, q1), f2 = formatFac(p2, q2);
        return [f1, f2].sort((a, b) => a.startsWith('(') && !b.startsWith('(') ? 1 : (!a.startsWith('(') && b.startsWith('(') ? -1 : a.localeCompare(b))).join('');
    };
    let ansStr = getCanonical(p, q, r, s);
    let distractors = new Set([
        getCanonical(p, -q, r, -s), getCanonical(p, s, r, q),
        getCanonical(p, q + 1, r, s - 1), getCanonical(p, q - 1, r, s + 1)
    ]);
    distractors.delete(ansStr);
    let options = [ansStr];
    let distArr = Array.from(distractors);
    while (options.length < 4) {
        if (distArr.length > 0) options.push(distArr.shift());
        else {
            let randQ = Math.floor(Math.random() * 20) - 10;
            let randS = Math.floor(Math.random() * 20) - 10;
            let d = getCanonical(p, randQ, r, randS);
            if (d !== ansStr && !options.includes(d)) options.push(d);
        }
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
    fqOptions.forEach(b => b.disabled = true);
    if (isCorrect) {
        btn.classList.add('correct');
        fqCombo++;
        fqScore += 10 + (fqCombo * 2);
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
    setTimeout(generateQuizProblem, 1000);
}

function initFactor() {
    fxInputs.forEach(inp => inp.addEventListener('input', checkCross));
    fxNextBtn.addEventListener('click', generateCrossProblem);

    document.querySelectorAll('.tab-btn[data-factortab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn[data-factortab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            if (e.target.dataset.factortab === 'cross') {
                document.getElementById('factor-cross-container').style.display = 'flex';
                document.getElementById('factor-quiz-container').style.display = 'none';
                generateCrossProblem();
            } else {
                document.getElementById('factor-cross-container').style.display = 'none';
                document.getElementById('factor-quiz-container').style.display = 'flex';
                fqScore = 0; fqCombo = 0; fqScoreVal.innerText = 0; fqComboBox.style.opacity = 0;
                generateQuizProblem();
            }
        });
    });

    document.querySelector('.index-tab[data-unit="factor"]').addEventListener('click', () => setTimeout(generateCrossProblem, 50));
    generateCrossProblem();
}