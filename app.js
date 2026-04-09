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
            'sin': '#ff8bad',
            'cos': '#73a5ff',
            'tan': '#ffb86c',
            'definition': '#b19cd9'
        };

        const CX = 180; 
        const CY = 200; 
        const R_BASE = 90;  

        const GX = 380; 
        const GY = 200; 
        const X_SCALE_EXT = (Math.PI / 180) * R_BASE; 
        const G_WIDTH = 720 * X_SCALE_EXT; 
        const G_ORIGIN_X = GX + G_WIDTH / 2; 

        let currentFunc = 'definition';
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

                    if (currentFunc === 'definition') {
                        rSliderWrapper.style.display = 'flex';
                    } else {
                        rSliderWrapper.style.display = 'none';
                        currentR = 1.0; 
                        rSlider.value = 1.0;
                        rVal.innerText = "1.0";
                    }

                    slider.value = 0;
                    currentAngle = 0;
                    minReachedAngle = 0;
                    maxReachedAngle = 0;
                    draw();
                    updateTextExtended();
                });
            });

            rSliderWrapper.style.display = 'flex'; 
            draw();
            updateTextExtended();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawAxes();

            if (currentFunc === 'definition') {
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
            ctx.moveTo(CX - R_BASE - 40, CY); ctx.lineTo(CX + R_BASE + 40, CY); 
            ctx.moveTo(CX, CY - R_BASE - 40); ctx.lineTo(CX, CY + R_BASE + 40); 
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(GX - 30, GY); ctx.lineTo(GX + G_WIDTH + 30, GY); 
            ctx.moveTo(G_ORIGIN_X, 30); ctx.lineTo(G_ORIGIN_X, canvas.height - 30);     
            ctx.stroke();

            ctx.fillStyle = '#718096';
            ctx.font = '14px Outfit, sans-serif';

            ctx.fillText('1', CX + R_BASE + 8, CY - 8);
            ctx.fillText('-1', CX - R_BASE - 25, CY - 8);
            ctx.fillText('1', CX + 8, CY - R_BASE - 8);
            ctx.fillText('-1', CX + 8, CY + R_BASE + 20);

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
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`x = ${x.toFixed(2)}`, 20, 40);
            ctx.fillText(`y = ${y.toFixed(2)}`, 20, 70);
        }

        function drawPoint(x, y, borderCol, radius = 5, fillCol = '#ffffff') {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillCol;
            ctx.fill();
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
            ctx.fill();
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
            
            ctx.font = '600 20px Outfit, sans-serif';
            ctx.fillStyle = activeColors['sin']; 
            ctx.fillText(`sin(${currentAngle}°) = ${sinVal.toFixed(2)}`, G_ORIGIN_X + 60, CY + 80);
            ctx.fillStyle = activeColors['cos']; 
            ctx.fillText(`cos(${currentAngle}°) = ${cosVal.toFixed(2)}`, G_ORIGIN_X + 60, CY + 115);
            ctx.fillStyle = activeColors['tan']; 
            ctx.fillText(`tan(${currentAngle}°) = ${tanStr}`, G_ORIGIN_X + 60, CY + 150);
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fill();
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
                ctx.beginPath();
                ctx.moveTo(CX, py); ctx.lineTo(px, py);
                ctx.strokeStyle = activeColor;
                ctx.setLineDash([]);
                ctx.stroke();

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
            if (currentFunc === 'definition') {
                infoText.innerHTML = `정의 (Definition)`;
                infoText.style.color = activeColors['definition'];
                return; 
            }

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
