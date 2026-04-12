/* ========================================================= */
/* --- Main (메인 진입점 & 홈 화면 + 단원별 인덱스 제어) --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const UNITS = [
        { id: 'exp', icon: '📈', title: '그래프 그리기', subtitle: '함수를 입력하고 다양한 변환을 시각화', ready: true, colorClass: 'card-exp', init: () => initGraph() },
        { id: 'factor', icon: '✖️', title: '인수분해', subtitle: 'X자 크로스 훈련장과 스피드 퀴즈', ready: true, colorClass: 'card-factor', init: () => initFactor() },
        { id: 'matrix', icon: '🔲', title: '행렬과 변환', subtitle: '선형 변환을 이미지로 직관적으로 확인', ready: true, colorClass: 'card-matrix', init: () => initMatrix() },
        { id: 'trig', icon: '〽️', title: '삼각함수', subtitle: '단위원과 그래프로 sin·cos·tan 이해', ready: true, colorClass: 'card-trig', init: () => initTrig() },
        { id: 'integ', icon: '∫', title: '적분', subtitle: '상합·하합으로 구분구적법 시각화', ready: true, colorClass: 'card-integ', init: () => initInteg() },
        { id: 'seq', icon: '🔢', title: '수열', subtitle: '등차·등비수열 시각화', ready: false, colorClass: 'card-seq', init: null },
        { id: 'limit', icon: '→', title: '극한과 연속', subtitle: '함수의 극한과 연속', ready: false, colorClass: 'card-limit', init: null },
        { id: 'deriv', icon: '📐', title: '미분', subtitle: '접선과 도함수 시각화', ready: false, colorClass: 'card-deriv', init: null },
    ];

    // 단원별 인덱스 패널 ID (없는 단원은 항목 없음 → 인덱스 전부 숨김)
    const UNIT_INDEX_MAP = {
        factor: 'idx-factor',
        trig: 'idx-trig',
        integ: 'idx-integ',
    };

    const initialized = new Set();

    const homeScreen = document.getElementById('home-screen');
    const unitTopbar = document.getElementById('unit-topbar');
    const appContainer = document.querySelector('.app-container');
    const cardGrid = document.getElementById('card-grid');
    const backBtn = document.getElementById('back-btn');
    const breadcrumb = document.getElementById('breadcrumb-title');
    const unitContents = document.querySelectorAll('.unit-content');
    const unitFooter = document.getElementById('unit-footer');
    const allIndexPanels = document.querySelectorAll('.side-index-wrapper[id^="idx-"]');

    unitTopbar.style.display = 'none';
    appContainer.style.display = 'none';
    if (unitFooter) unitFooter.style.display = 'none';

    /* 카드 렌더링 */
    function renderCards() {
        UNITS.forEach((unit, i) => {
            const card = document.createElement('div');
            card.className = `unit-card ${unit.colorClass}${unit.ready ? '' : ' coming-soon'}`;
            card.style.animationDelay = `${i * 55}ms`;
            card.innerHTML = `
                <div class="card-badge ${unit.ready ? 'badge-ready' : 'badge-soon'}">
                    ${unit.ready ? '✓ 사용 가능' : '준비 중'}
                </div>
                <div class="card-icon">${unit.icon}</div>
                <div class="card-body">
                    <div class="card-title">${unit.title}</div>
                    <div class="card-subtitle">${unit.subtitle}</div>
                </div>
                ${unit.ready ? '<div class="card-arrow">→</div>' : ''}
            `;
            if (unit.ready) card.addEventListener('click', () => navigateTo(unit));
            cardGrid.appendChild(card);
        });
    }

    /* 인덱스 패널 전환 */
    function switchIndexPanel(unitId) {
        allIndexPanels.forEach(p => p.style.display = 'none');
        const targetId = UNIT_INDEX_MAP[unitId];
        if (targetId) {
            const panel = document.getElementById(targetId);
            if (panel) panel.style.display = 'flex';
        }
    }

    /* 단원으로 이동 */
    function navigateTo(unit) {
        homeScreen.style.display = 'none';
        unitTopbar.style.display = 'flex';
        appContainer.style.display = 'block';
        if (unitFooter) unitFooter.style.display = 'block';

        if (breadcrumb) breadcrumb.textContent = unit.title;

        unitContents.forEach(el => {
            el.classList.toggle('active', el.id === 'unit-' + unit.id);
        });

        switchIndexPanel(unit.id);

        if (unit.init && !initialized.has(unit.id)) {
            initialized.add(unit.id);
            setTimeout(unit.init, 50);
        } else {
            if (unit.id === 'exp') setTimeout(() => renderAllExpGraphs(), 50);
            if (unit.id === 'integ') setTimeout(() => drawInteg(), 50);
            if (unit.id === 'matrix') setTimeout(() => { drawOriginal(); applyMatrixTransform(); }, 50);
            if (unit.id === 'trig') setTimeout(() => drawTrig(), 50);
        }
    }

    /* 홈으로 */
    function navigateHome() {
        appContainer.style.display = 'none';
        unitTopbar.style.display = 'none';
        if (unitFooter) unitFooter.style.display = 'none';
        homeScreen.style.display = 'flex';
        homeScreen.style.flexDirection = 'column';
        homeScreen.style.alignItems = 'center';
        unitContents.forEach(el => el.classList.remove('active'));
        allIndexPanels.forEach(p => p.style.display = 'none');
    }

    if (backBtn) backBtn.addEventListener('click', navigateHome);

    /* 삼각함수 인덱스 탭 → trig.js 탭 연동 */
    document.querySelectorAll('#idx-trig .index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#idx-trig .index-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // trig.js가 내부적으로 듣는 .tab-btn을 프로그래매틱하게 클릭
            const trigTabBtn = document.querySelector(`.tab-btn[data-func="${tab.dataset.func}"]`);
            if (trigTabBtn) trigTabBtn.click();
        });
    });

    /* 인수분해 인덱스 탭 → factor.js 탭 연동 */
    document.querySelectorAll('#idx-factor .index-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#idx-factor .index-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const factorTabBtn = document.querySelector(`.tab-btn[data-factortab="${tab.dataset.factortab}"]`);
            if (factorTabBtn) factorTabBtn.click();
        });
    });

    renderCards();
});
