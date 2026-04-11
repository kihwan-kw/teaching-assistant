/* ========================================================= */
/* --- Main (메인 진입점 & 탭 네비게이션) --- */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    /* ---- 인덱스 탭 네비게이션 ---- */
    const indexTabs = document.querySelectorAll('.index-tab');
    const unitContents = document.querySelectorAll('.unit-content');

    indexTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            indexTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const targetUnit = e.target.dataset.unit;
            unitContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === 'unit-' + targetUnit) content.classList.add('active');
            });
        });
    });

    /* ---- 모듈 초기화 ---- */
    initGraph();
    initTrig();
    initMatrix();
    initInteg();
    initFactor();
});