const QUESTIONS = [];
for(let i=0;i<10;i++){
  DIMENSIONS.forEach(dim=>{
    QUESTIONS.push({dimKey:dim.key, dimName:dim.name, bearing:dim.bearing, text:dim.questions[i]});
  });
}

let current = 0;
const answers = new Array(QUESTIONS.length).fill(null);

function renderIntroTicks(){
  const g = document.getElementById('intro-ticks');
  let svgStr = '';
  DIMENSIONS.forEach(d=>{
    const rad = (d.bearing - 90) * Math.PI/180;
    const x1 = 150 + 118*Math.cos(rad), y1 = 150 + 118*Math.sin(rad);
    const x2 = 150 + 128*Math.cos(rad), y2 = 150 + 128*Math.sin(rad);
    svgStr += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#B8935F" stroke-width="1.5"/>`;
  });
  g.innerHTML = svgStr;
}
renderIntroTicks();

function startQuiz(){
  document.getElementById('screen-intro').classList.remove('active');
  document.getElementById('screen-quiz').classList.add('active');
  renderQuestion();
}

function renderQuestion(){
  const q = QUESTIONS[current];
  document.getElementById('qz-progress').textContent = `页 ${String(current+1).padStart(2,'0')} / ${QUESTIONS.length}`;
  document.getElementById('qz-bearing').textContent = `方位 ${String(q.bearing).padStart(3,'0')}°`;
  document.getElementById('qz-progress-fill').style.width = `${((current+1)/QUESTIONS.length*100).toFixed(1)}%`;
  document.getElementById('qz-dim-name').textContent = q.dimName;
  document.getElementById('qz-question').textContent = q.text;

  const likertDiv = document.getElementById('qz-likert');
  likertDiv.innerHTML = '';
  const captions = ['1','2','3','4','5'];
  for(let v=1; v<=5; v++){
    const opt = document.createElement('div');
    opt.className = 'likert-option' + (answers[current]===v ? ' selected' : '');
    opt.innerHTML = `<div class="likert-dot"></div><div class="likert-caption">${captions[v-1]}</div>`;
    opt.onclick = ()=>selectAnswer(v);
    likertDiv.appendChild(opt);
  }

  document.getElementById('qz-prev').disabled = current===0;
}
function selectAnswer(v){
  answers[current] = v;

  if(current < QUESTIONS.length - 1){
    current++;
    renderQuestion();
  }else{
    showResult();
  }
}

function prevQuestion(){
  if(current>0){
    current--;
    renderQuestion();
  }
}

function computeScores(){
  const totals = {};
  DIMENSIONS.forEach(d=> totals[d.key]=0);
  QUESTIONS.forEach((q,i)=>{
    totals[q.dimKey] += (answers[i]||0);
  });
  return DIMENSIONS.map(d=>{
    const raw = totals[d.key]; 
    const pct = Math.round((raw/50)*100);
    return {...d, raw, pct};
  });
}

function levelOf(raw){
  if(raw>=35) return {tag:'突出优势', cls:'level-high'};
  if(raw>=28) return {tag:'均衡发展', cls:'level-mid'};
  return {tag:'有待发掘', cls:'level-low'};
}

function showResult(){
  document.getElementById('screen-quiz').classList.remove('active');
  document.getElementById('screen-result').classList.add('active');

  const scores = computeScores();

  drawRadar(scores);

  const strengths = scores.filter(s => s.raw >= 35);

  const minScore = Math.min(
    ...scores.map(s => s.raw)
  );

  const weakest = scores.filter(
    s => s.raw === minScore
  );

  const listContainer =
    document.getElementById('dim-list-container');

  const sortedScores = [...scores].sort((a, b) => b.raw - a.raw);
  
  listContainer.innerHTML = sortedScores.map(s => {

    const level = levelOf(s.raw);

    let levelText = '';

    if(s.raw >= 35){
      levelText = s.high;
    }
    else if(s.raw >= 28){
      levelText = s.mid;
    }
    else{
      levelText = s.low;
    }

    return `
      <div class="dim-row"
           onclick="toggleDimension('${s.key}')">

        <div class="dim-row-head">

          <div class="left">
            <span class="bearing">
              ${String(s.bearing).padStart(3,'0')}°
            </span>

            <h3>
              ${s.name}
            </h3>
          </div>

          <span class="level-badge ${level.cls}">
            ${level.tag} · ${s.raw}/50
          </span>

        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            style="width:${s.pct}%">
          </div>
        </div>

        <div
          class="dim-detail"
          id="detail-${s.key}"
          style="display:none;"
        >

          <p class="dim-intro">
            ${s.intro}
          </p>

          <div class="dim-detail-score">
            你的得分：${s.raw} / 50
          </div>

          <div class="dim-detail-level">
            ${level.tag}
          </div>

          <p class="dim-desc">
            ${levelText}
          </p>

        </div>

      </div>
    `;

  }).join('');


  const actionContainer =document.getElementById('action-container');
  if(strengths.length > 0){

    actionContainer.innerHTML = `

      <div class="result-section">

        ${strengths.map(s => `

          <div class="action-card">

            <div class="action-card-head">

              <h4>${s.name}</h4>

              <span>
                ${s.raw}/50
              </span>

            </div>


            <div class="action-group">

              <h5>探索与积累阶段（大一、大二）</h5>

              <p>
                <strong>社团：</strong>
                ${s.actionLow?.club || ''}
              </p>

              <p>
                <strong>比赛 / 活动：</strong>
                ${s.actionLow?.competition || ''}
              </p>

              <p>
                <strong>课程：</strong>
                ${s.actionLow?.course || ''}
              </p>

              <p>
                ${s.actionLow?.advice || ''}
              </p>

            </div>


            <div class="action-group">

              <h5>深化与应用阶段（大三、大四）</h5>

              <p>
                <strong>职业方向：</strong>
                ${s.actionHigh?.career || ''}
              </p>

              <p>
                <strong>实习：</strong>
                ${s.actionHigh?.internship || ''}
              </p>

              <p>
                ${s.actionHigh?.advice || ''}
              </p>

            </div>

          </div>

        `).join('')}

      </div>
    `;

  }else{
    actionContainer.innerHTML = '';
  }

  // 9. 待发展提升建议
  //
  // 只展示最低分维度
  // 如果最低分并列，则一起展示

 const improveContainer =document.getElementById('improve-container');


  // 只有最低分进入10～24分，
  // 才显示具体提升建议。
  if(minScore >= 10 && minScore <= 27){

    improveContainer.innerHTML = `

      <div class="result-section">

        ${weakest.map(s => {

          const guide = s.improveGuide;

          if(!guide){
            return '';
          }

          return `

            <div class="improve-card">

              <div class="improve-card-head">

                <h4>
                  ${s.name}
                </h4>

                <span>
                  ${s.raw}/50
                </span>

              </div>


              <p class="improve-opening">
                ${guide.opening || ''}
              </p>


              <div class="improve-tips">

                ${(guide.tips || []).map((tip, index) => `

                  <div class="improve-tip">

                    <span class="tip-number">
                      ${index + 1}
                    </span>

                    <p>
                      ${tip}
                    </p>

                  </div>

                `).join('')}

              </div>


              <p class="improve-encouragement">
                ${guide.encouragement || ''}
              </p>

            </div>

          `;

        }).join('')}

      </div>
    `;

  }else{

    // 没有待发展区，不展示具体提升内容
    improveContainer.innerHTML = '';
  }

}

function toggleDimension(key){

  const detail = document.getElementById(`detail-${key}`);

  if(!detail) return;

  const isOpen = detail.style.display !== 'none';

  detail.style.display = isOpen ? 'none' : 'block';
}

function drawRadar(scores){
  const svg = document.getElementById('radar-svg');
  const cx=200, cy=200, maxR=150;
  const n = scores.length;
  let inner = '';

  // grid rings
  [0.25,0.5,0.75,1].forEach(f=>{
    let pts = '';
    for(let i=0;i<n;i++){
      const ang = (scores[i].bearing-90)*Math.PI/180;
      const r = maxR*f;
      pts += `${(cx+r*Math.cos(ang)).toFixed(1)},${(cy+r*Math.sin(ang)).toFixed(1)} `;
    }
   inner += `<polygon points="${pts}" fill="none" stroke="#9BB5AD" stroke-width="0.8" opacity="${0.35}"/>`;
  });

  // axes + labels
  scores.forEach(s=>{
    const ang = (s.bearing-90)*Math.PI/180;
    const x2 = cx+maxR*Math.cos(ang), y2 = cy+maxR*Math.sin(ang);
    inner += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#B7C8C2" stroke-width="0.8" opacity="0.45"/>`;    const lx = cx+(maxR+26)*Math.cos(ang), ly = cy+(maxR+26)*Math.sin(ang);
    inner += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11" fill="#34413D" text-anchor="middle" dominant-baseline="middle" font-family="JetBrains Mono, monospace">${s.name.replace('智能','')}</text>`;
  });

  // data polygon
  let dataPts = '';
  scores.forEach(s=>{
    const ang = (s.bearing-90)*Math.PI/180;
    const r = maxR*(s.pct/100);
    dataPts += `${(cx+r*Math.cos(ang)).toFixed(1)},${(cy+r*Math.sin(ang)).toFixed(1)} `;
  });
inner += `<polygon 
points="${dataPts}" 
fill="#91A99A" 
fill-opacity="0.28" 
stroke="#718C84" 
stroke-width="2"/>`;
  scores.forEach(s=>{
    const ang = (s.bearing-90)*Math.PI/180;
    const r = maxR*(s.pct/100);
    const x = cx+r*Math.cos(ang), y = cy+r*Math.sin(ang);
    inner += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#A8543A"/>`;
  });

 inner += `<polygon points="${dataPts}" fill="#91A99A" fill-opacity="0.28" stroke="#718C84" stroke-width="2"/>`;

  svg.innerHTML = inner;
}

function restartQuiz(){
  current = 0;
  answers.fill(null);
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-intro').classList.add('active');
}
