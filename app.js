/* =========================================================
   STORAGE MODULE
========================================================= */
const Storage = {
  KEY: 'jp_student_life_v1',
  data: {},
  load(){
    try{
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? JSON.parse(raw) : {};
    }catch(e){ this.data = {}; }
  },
  save(){
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  },
  get(key, fallback){
    return this.data[key] !== undefined ? this.data[key] : fallback;
  },
  set(key, value){
    this.data[key] = value;
    this.save();
  },
  reset(){
    this.data = {};
    this.save();
  },
  export(){
    return JSON.stringify(this.data, null, 2);
  },
  import(json){
    try{
      const parsed = JSON.parse(json);
      this.data = parsed;
      this.save();
      return true;
    }catch(e){ return false; }
  }
};

/* =========================================================
   UTILITIES
========================================================= */
const Utils = {
  uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); },
  today(){ return new Date().toISOString().slice(0,10); },
  formatDate(d){
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  },
  formatTime(t){
    if(!t) return '';
    const [h,m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  },
  dayName(d, short=true){
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return short ? days[d].slice(0,3) : days[d];
  },
  daysBetween(a,b){
    const d1 = new Date(a); d1.setHours(0,0,0,0);
    const d2 = new Date(b); d2.setHours(0,0,0,0);
    return Math.round((d2-d1)/(1000*60*60*24));
  },
  yen(n){ return '¥' + Number(n).toLocaleString('ja-JP'); },
  parseDuration(start,end,breakMin=0){
    if(!start || !end) return {hours:0,minutes:0,total:0};
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    let total = (eh*60+em) - (sh*60+sm) - Number(breakMin||0);
    if(total < 0) total += 24*60;
    return {hours: Math.floor(total/60), minutes: total%60, total};
  },
  escape(s){
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
};

/* =========================================================
   TOAST
========================================================= */
function toast(msg, type='success'){
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(20px)'; },2500);
  setTimeout(()=>el.remove(),3000);
}

/* =========================================================
   MODAL
========================================================= */
const Modal = {
  open(title, bodyHTML, footerHTML){
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML || '';
    document.getElementById('modalOverlay').classList.add('open');
  },
  close(){
    document.getElementById('modalOverlay').classList.remove('open');
  }
};
document.getElementById('modalClose').onclick = Modal.close;
document.getElementById('modalOverlay').onclick = (e)=>{
  if(e.target.id === 'modalOverlay') Modal.close();
};
document.addEventListener('keydown',(e)=>{
  if(e.key === 'Escape') Modal.close();
});

/* =========================================================
   THEME
========================================================= */
const Theme = {
  init(){
    const saved = Storage.get('theme','system');
    this.apply(saved);
  },
  apply(mode){
    Storage.set('theme', mode);
    let theme = mode;
    if(mode === 'system'){
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  }
};

/* =========================================================
   SAMPLE DATA
========================================================= */
function initSampleData(){
  if(Storage.get('initialized')) return;
  
  const today = new Date();
  const todayStr = Utils.today();
  const dayOfWeek = today.getDay();
  
  // Profile
  Storage.set('profile',{
    name:'[Student Name]',
    school:'[School Name]',
    course:'[Course Name]',
    jlptLevel:'N3',
    jlptDate:'2026-12-06',
    monthlyBudget:150000,
    hourlyWage:1200
  });
  
  // Classes - weekly schedule
  const classes = [
    {id:Utils.uid(),subject:'Japanese II',teacher:'Tanaka-sensei',room:'B-204',day:1,start:'09:00',end:'10:30',notes:'Bring textbook ch.5'},
    {id:Utils.uid(),subject:'Calculus',teacher:'Prof. Sato',room:'A-301',day:1,start:'13:00',end:'14:30',notes:''},
    {id:Utils.uid(),subject:'Japanese II',teacher:'Tanaka-sensei',room:'B-204',day:2,start:'09:00',end:'10:30',notes:''},
    {id:Utils.uid(),subject:'Physics Lab',teacher:'Prof. Yamada',room:'Lab-2',day:2,start:'13:00',end:'16:00',notes:'Lab report due Friday'},
    {id:Utils.uid(),subject:'English Lit',teacher:'Ms. Suzuki',room:'C-105',day:3,start:'10:45',end:'12:15',notes:''},
    {id:Utils.uid(),subject:'Japanese II',teacher:'Tanaka-sensei',room:'B-204',day:3,start:'13:00',end:'14:30',notes:''},
    {id:Utils.uid(),subject:'Linear Algebra',teacher:'Prof. Ito',room:'A-202',day:4,start:'09:00',end:'10:30',notes:''},
    {id:Utils.uid(),subject:'Japanese II',teacher:'Tanaka-sensei',room:'B-204',day:4,start:'13:00',end:'14:30',notes:''},
    {id:Utils.uid(),subject:'Seminar',teacher:'Prof. Watanabe',room:'D-401',day:5,start:'13:00',end:'16:00',notes:'Presentation prep'}
  ];
  Storage.set('classes', classes);
  
  // Work shifts - next 7 days
  const shifts = [];
  for(let i=0;i<5;i++){
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if(d.getDay() === 0 || d.getDay() === 3){
      shifts.push({
        id:Utils.uid(),
        workplace:'Sakura Cafe',
        date:d.toISOString().slice(0,10),
        start:'17:00',
        end:'22:00',
        break:30,
        wage:1200,
        notes:'Evening shift'
      });
    }
  }
  // Add some past shifts for stats
  for(let i=1;i<=10;i++){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if(d.getDay() === 0 || d.getDay() === 3 || d.getDay() === 6){
      shifts.push({
        id:Utils.uid(),
        workplace:'Sakura Cafe',
        date:d.toISOString().slice(0,10),
        start:'17:00',
        end:'22:00',
        break:30,
        wage:1200,
        notes:''
      });
    }
  }
  Storage.set('shifts', shifts);
  
  // Expenses
  const expenses = [
    {id:Utils.uid(),amount:650,category:'food',date:todayStr,description:'Lunch at konbini'},
    {id:Utils.uid(),amount:220,category:'transportation',date:todayStr,description:'Train fare'},
    {id:Utils.uid(),amount:1200,category:'food',date:todayStr,description:'Dinner ingredients'},
    {id:Utils.uid(),amount:4500,category:'food',date:new Date(today.getTime()-86400000).toISOString().slice(0,10),description:'Restaurant with friends'},
    {id:Utils.uid(),amount:65000,category:'rent',date:'2026-09-01',description:'Monthly rent'},
    {id:Utils.uid(),amount:3500,category:'phone',date:'2026-09-02',description:'Phone bill'},
    {id:Utils.uid(),amount:2800,category:'school',date:'2026-09-03',description:'Textbooks'},
    {id:Utils.uid(),amount:1500,category:'shopping',date:'2026-09-04',description:'Clothes'},
    {id:Utils.uid(),amount:800,category:'entertainment',date:'2026-09-05',description:'Movie ticket'}
  ];
  Storage.set('expenses', expenses);
  
  // Tasks
  const tasks = [
    {id:Utils.uid(),title:'Complete physics lab report',dueDate:todayStr,priority:'high',category:'school',completed:false,notes:''},
    {id:Utils.uid(),title:'Review kanji chapter 12',dueDate:todayStr,priority:'medium',category:'japanese',completed:false,notes:''},
    {id:Utils.uid(),title:'Call landlord about AC',dueDate:todayStr,priority:'low',category:'personal',completed:false,notes:''},
    {id:Utils.uid(),title:'Prepare seminar presentation',dueDate:new Date(today.getTime()+3*86400000).toISOString().slice(0,10),priority:'high',category:'school',completed:false,notes:'15 minutes'},
    {id:Utils.uid(),title:'Renew visa documents',dueDate:new Date(today.getTime()+7*86400000).toISOString().slice(0,10),priority:'high',category:'important',completed:false,notes:''},
    {id:Utils.uid(),title:'Buy winter coat',dueDate:new Date(today.getTime()+5*86400000).toISOString().slice(0,10),priority:'low',category:'personal',completed:false,notes:''}
  ];
  Storage.set('tasks', tasks);
  
  // Study sessions
  const sessions = [];
  for(let i=0;i<14;i++){
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    sessions.push({
      id:Utils.uid(),
      date:d.toISOString().slice(0,10),
      duration: 45 + Math.floor(Math.random()*60),
      vocabulary: Math.floor(Math.random()*20)+5,
      kanji: Math.floor(Math.random()*10)+2,
      grammar: Math.floor(Math.random()*3)+1,
      reading: Math.random()>0.5 ? 1 : 0,
      listening: Math.random()>0.5 ? 1 : 0,
      speaking: Math.random()>0.7 ? 1 : 0
    });
  }
  Storage.set('studySessions', sessions);
  
  // JLPT progress
  Storage.set('jlptProgress',{
    vocabulary: 420,
    vocabularyTarget: 1000,
    kanji: 380,
    kanjiTarget: 650,
    grammar: 55,
    grammarTarget: 120,
    reading: 30,
    readingTarget: 60,
    listening: 25,
    listeningTarget: 50,
    mockScore: 78
  });
  
  // Reminders
  Storage.set('reminders',[
    {id:Utils.uid(),title:'Pay electricity bill',date:new Date(today.getTime()+2*86400000).toISOString().slice(0,10),time:'18:00',description:'Due this week',completed:false},
    {id:Utils.uid(),title:'Submit scholarship application',date:new Date(today.getTime()+5*86400000).toISOString().slice(0,10),time:'09:00',description:'Bring all documents',completed:false}
  ]);
  
  // Calendar events
  Storage.set('events',[
    {id:Utils.uid(),title:'Midterm exam - Calculus',date:new Date(today.getTime()+14*86400000).toISOString().slice(0,10),type:'exam',notes:'Room A-301'},
    {id:Utils.uid(),title:'Friend birthday dinner',date:new Date(today.getTime()+3*86400000).toISOString().slice(0,10),type:'personal',notes:'Shibuya'}
  ]);
  
  Storage.set('initialized', true);
}

/* =========================================================
   NAVIGATION
========================================================= */
function switchView(view){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  document.querySelectorAll('.bottom-nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  renderView(view);
}

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=> switchView(btn.dataset.view));
});

function renderView(view){
  const content = document.getElementById('content');
  const titles = {
    dashboard:['Dashboard',`${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}`],
    school:['Schedule / 時間割','Weekly timetable and classes'],
    work:['Part-Time Work / バイト','Manage shifts and income'],
    expenses:['Expenses / 支出管理','Track your spending'],
    japanese:['Japanese Study / 日本語学習','Daily progress and sessions'],
    jlpt:['JLPT Countdown','Exam preparation tracker'],
    tasks:['Tasks','Organize your to-dos'],
    calendar:['Calendar','Monthly overview'],
    reminders:['Reminders','Never miss important dates'],
    stats:['Statistics','Your productivity insights'],
    settings:['Settings','Customize your experience']
  };
  const [title, sub] = titles[view] || ['',''];
  document.getElementById('topbarTitle').innerHTML = `${title}<small>${sub}</small>`;
  
  const renderers = {
    dashboard: renderDashboard,
    school: renderSchool,
    work: renderWork,
    expenses: renderExpenses,
    japanese: renderJapanese,
    jlpt: renderJLPT,
    tasks: renderTasks,
    calendar: renderCalendar,
    reminders: renderReminders,
    stats: renderStats,
    settings: renderSettings
  };
  content.innerHTML = `<div class="view active" id="view-${view}"></div>`;
  const viewEl = document.getElementById(`view-${view}`);
  if(renderers[view]) renderers[view](viewEl);
}

/* =========================================================
   DASHBOARD
========================================================= */
function renderDashboard(container){
  const profile = Storage.get('profile',{});
  const classes = Storage.get('classes',[]);
  const shifts = Storage.get('shifts',[]);
  const tasks = Storage.get('tasks',[]);
  const expenses = Storage.get('expenses',[]);
  const sessions = Storage.get('studySessions',[]);
  const reminders = Storage.get('reminders',[]);
  const jlptProgress = Storage.get('jlptProgress',{});
  const today = Utils.today();
  const todayDay = new Date().getDay();
  
  // Today's classes
  const todayClasses = classes.filter(c=>c.day===todayDay).sort((a,b)=>a.start.localeCompare(b.start));
  const nextClass = todayClasses.find(c=>{
    const [h,m] = c.start.split(':').map(Number);
    const now = new Date();
    return h*60+m > now.getHours()*60+now.getMinutes();
  });
  
  // Today's work
  const todayShift = shifts.find(s=>s.date===today);
  
  // Today's tasks
  const todayTasks = tasks.filter(t=>!t.completed && t.dueDate===today);
  
  // Today's expenses
  const todayExpenses = expenses.filter(e=>e.date===today);
  const todaySpent = todayExpenses.reduce((s,e)=>s+Number(e.amount),0);
  
  // Monthly expenses
  const thisMonth = today.slice(0,7);
  const monthExpenses = expenses.filter(e=>e.date.startsWith(thisMonth));
  const monthSpent = monthExpenses.reduce((s,e)=>s+Number(e.amount),0);
  
  // Study today
  const todayStudy = sessions.filter(s=>s.date===today);
  const todayStudyMin = todayStudy.reduce((s,x)=>s+Number(x.duration),0);
  
  // Streak
  const streak = calcStudyStreak(sessions);
  
  // JLPT countdown
  const jlptDays = profile.jlptDate ? Utils.daysBetween(today, profile.jlptDate) : 0;
  
  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'おはよう' : hour < 18 ? 'こんにちは' : 'こんばんは';
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div style="font-size:13px;color:var(--text-muted)">${greeting}, ${Utils.escape(profile.name || 'Student')}</div>
      </div>
    </div>
    
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="time-outline"></ion-icon></div>
        <div class="stat-label">Next Class</div>
        <div class="stat-value" style="font-size:16px">${nextClass ? Utils.escape(nextClass.subject) : (todayClasses.length ? 'Done for today' : 'No class')}</div>
        <div class="stat-sub">${nextClass ? Utils.formatTime(nextClass.start)+' · '+Utils.escape(nextClass.room) : todayClasses.length+' classes today'}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="wallet-outline"></ion-icon></div>
        <div class="stat-label">Today Spent</div>
        <div class="stat-value">${Utils.yen(todaySpent)}</div>
        <div class="stat-sub">Budget: ${Utils.yen(profile.monthlyBudget||0)}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="flame-outline"></ion-icon></div>
        <div class="stat-label">Study Streak</div>
        <div class="stat-value">${streak} <span style="font-size:13px;font-weight:500;color:var(--text-muted)">days</span></div>
        <div class="stat-sub">${todayStudyMin} min studied today</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="trophy-outline"></ion-icon></div>
        <div class="stat-label">JLPT ${Utils.escape(profile.jlptLevel||'N3')}</div>
        <div class="stat-value">${jlptDays} <span style="font-size:13px;font-weight:500;color:var(--text-muted)">days</span></div>
        <div class="stat-sub">${profile.jlptDate ? Utils.formatDate(profile.jlptDate) : 'Set exam date'}</div>
      </div>
    </div>
    
    <div class="grid grid-2-1" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="calendar-outline"></ion-icon>Today's Schedule</div>
          <button class="card-action" onclick="switchView('calendar')">View calendar</button>
        </div>
        <div class="list">
          ${todayClasses.length === 0 && !todayShift ? `<div class="empty-state" style="padding:20px"><p>No classes or shifts today</p></div>` : ''}
          ${todayClasses.map(c=>`
            <div class="list-item">
              <div class="list-item-dot" style="background:var(--info)"></div>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(c.subject)}</div>
                <div class="list-item-meta">
                  <span><ion-icon name="time-outline" style="font-size:11px"></ion-icon> ${Utils.formatTime(c.start)} - ${Utils.formatTime(c.end)}</span>
                  <span><ion-icon name="location-outline" style="font-size:11px"></ion-icon> ${Utils.escape(c.room)}</span>
                </div>
              </div>
            </div>
          `).join('')}
          ${todayShift ? `
            <div class="list-item">
              <div class="list-item-dot" style="background:var(--warning)"></div>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(todayShift.workplace)}</div>
                <div class="list-item-meta">
                  <span><ion-icon name="time-outline" style="font-size:11px"></ion-icon> ${Utils.formatTime(todayShift.start)} - ${Utils.formatTime(todayShift.end)}</span>
                  <span><ion-icon name="cash-outline" style="font-size:11px"></ion-icon> ~${Utils.yen(calcShiftEarnings(todayShift))}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="countdown">
        <div class="countdown-label">JLPT ${Utils.escape(profile.jlptLevel||'N3')} Countdown</div>
        <div class="countdown-days">${jlptDays}<small>days</small></div>
        <div class="countdown-date">${profile.jlptDate ? Utils.formatDate(profile.jlptDate) : 'Set exam date in settings'}</div>
        <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;margin-top:12px" onclick="switchView('jlpt')">View progress →</button>
      </div>
    </div>
    
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="checkmark-circle-outline"></ion-icon>Today's Tasks</div>
          <button class="card-action" onclick="switchView('tasks')">All tasks</button>
        </div>
        <div class="list">
          ${todayTasks.length === 0 ? `<div class="empty-state" style="padding:20px"><p>No tasks due today 🎉</p></div>` : 
            todayTasks.slice(0,4).map(t=>`
              <div class="list-item">
                <button class="icon-btn" onclick="toggleTask('${t.id}')"><ion-icon name="${t.completed?'checkbox':'square-outline'}"></ion-icon></button>
                <div class="list-item-content">
                  <div class="list-item-title">${Utils.escape(t.title)}</div>
                  <div class="list-item-meta"><span class="badge badge-${t.priority}">${t.priority}</span><span class="badge badge-${t.category}">${t.category}</span></div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="book-outline"></ion-icon>Japanese Study</div>
          <button class="card-action" onclick="switchView('japanese')">Details</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px">Today's progress</span>
              <span style="font-size:12px;font-weight:600">${todayStudyMin} min</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,todayStudyMin/60*100)}%"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px">Vocabulary</span>
              <span style="font-size:12px;font-weight:600">${jlptProgress.vocabulary||0}/${jlptProgress.vocabularyTarget||1000}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${((jlptProgress.vocabulary||0)/(jlptProgress.vocabularyTarget||1000))*100}%"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px">Kanji</span>
              <span style="font-size:12px;font-weight:600">${jlptProgress.kanji||0}/${jlptProgress.kanjiTarget||650}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${((jlptProgress.kanji||0)/(jlptProgress.kanjiTarget||650))*100}%"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px">Grammar</span>
              <span style="font-size:12px;font-weight:600">${jlptProgress.grammar||0}/${jlptProgress.grammarTarget||120}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${((jlptProgress.grammar||0)/(jlptProgress.grammarTarget||120))*100}%"></div></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="wallet-outline"></ion-icon>Monthly Budget</div>
          <button class="card-action" onclick="switchView('expenses')">Details</button>
        </div>
        ${renderBudgetDonut(monthSpent, profile.monthlyBudget||150000)}
        <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:12px">
          <span>Spent: <strong>${Utils.yen(monthSpent)}</strong></span>
          <span>Remaining: <strong style="color:var(--success)">${Utils.yen((profile.monthlyBudget||150000)-monthSpent)}</strong></span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="alarm-outline"></ion-icon>Upcoming Reminders</div>
          <button class="card-action" onclick="switchView('reminders')">All</button>
        </div>
        <div class="list">
          ${reminders.filter(r=>!r.completed).slice(0,3).map(r=>`
            <div class="list-item">
              <div class="list-item-dot" style="background:var(--warning)"></div>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(r.title)}</div>
                <div class="list-item-meta">
                  <span><ion-icon name="calendar-outline" style="font-size:11px"></ion-icon> ${Utils.formatDate(r.date)}</span>
                  ${r.time ? `<span><ion-icon name="time-outline" style="font-size:11px"></ion-icon> ${Utils.formatTime(r.time)}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('') || `<div class="empty-state" style="padding:20px"><p>No upcoming reminders</p></div>`}
        </div>
      </div>
    </div>
  `;
}

function calcShiftEarnings(s){
  const d = Utils.parseDuration(s.start, s.end, s.break);
  return (d.total/60) * Number(s.wage||0);
}

function calcStudyStreak(sessions){
  if(!sessions.length) return 0;
  const dates = [...new Set(sessions.map(s=>s.date))].sort().reverse();
  const today = Utils.today();
  let streak = 0;
  let checkDate = new Date(today);
  for(let i=0;i<365;i++){
    const ds = checkDate.toISOString().slice(0,10);
    if(dates.includes(ds)){
      streak++;
      checkDate.setDate(checkDate.getDate()-1);
    } else if(i===0){
      // today not yet logged, check from yesterday
      checkDate.setDate(checkDate.getDate()-1);
      continue;
    } else break;
  }
  return streak;
}

function renderBudgetDonut(spent, budget){
  const pct = Math.min(100, (spent/budget)*100);
  const r = 54, c = 2*Math.PI*r;
  const offset = c - (pct/100)*c;
  return `
    <div class="donut">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="12"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--accent)" stroke-width="12" 
          stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <div class="donut-center">
        <div class="donut-value">${Math.round(pct)}%</div>
        <div class="donut-label">Used</div>
      </div>
    </div>
  `;
}

/* =========================================================
   SCHOOL SCHEDULE
========================================================= */
function renderSchool(container){
  const classes = Storage.get('classes',[]);
  const todayDay = new Date().getDay();
  const todayClasses = classes.filter(c=>c.day===todayDay).sort((a,b)=>a.start.localeCompare(b.start));
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Schedule / 時間割</div>
        <div class="view-subtitle">${classes.length} classes · ${todayClasses.length} today</div>
      </div>
      <button class="btn btn-primary" onclick="openClassForm()"><ion-icon name="add"></ion-icon>Add Class</button>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="grid-outline"></ion-icon>Weekly Timetable</div>
      </div>
      ${renderTimetable(classes)}
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="today-outline"></ion-icon>Today's Classes</div>
      </div>
      <div class="list">
        ${todayClasses.length === 0 ? `<div class="empty-state"><ion-icon name="sunny-outline"></ion-icon><p>No classes today</p></div>` :
          todayClasses.map(c=>`
            <div class="list-item">
              <div class="list-item-dot" style="background:var(--info)"></div>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(c.subject)}</div>
                <div class="list-item-meta">
                  <span>${Utils.formatTime(c.start)} - ${Utils.formatTime(c.end)}</span>
                  <span>${Utils.escape(c.room||'')}</span>
                  <span>${Utils.escape(c.teacher||'')}</span>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" onclick="openClassForm('${c.id}')" aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
                <button class="icon-btn" onclick="deleteClass('${c.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function renderTimetable(classes){
  const days = ['Mon','Tue','Wed','Thu','Fri'];
  const hours = [9,10,11,12,13,14,15,16];
  let html = `<div class="timetable"><div class="tt-header"></div>`;
  days.forEach(d=> html += `<div class="tt-header">${d}</div>`);
  
  hours.forEach(h=>{
    html += `<div class="tt-time">${h}:00</div>`;
    for(let day=1;day<=5;day++){
      const cellClasses = classes.filter(c=>{
        if(c.day !== day) return false;
        const [sh] = c.start.split(':').map(Number);
        return sh === h;
      });
      if(cellClasses.length){
        const c = cellClasses[0];
        html += `<div class="tt-cell filled" onclick="openClassForm('${c.id}')" title="${Utils.escape(c.subject)}">
          <div class="tt-cell-subject">${Utils.escape(c.subject)}</div>
          <div class="tt-cell-room">${Utils.escape(c.room||'')}</div>
        </div>`;
      } else {
        html += `<div class="tt-cell"></div>`;
      }
    }
  });
  html += `</div>`;
  return html;
}

function openClassForm(id){
  const classes = Storage.get('classes',[]);
  const c = id ? classes.find(x=>x.id===id) : null;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  Modal.open(c?'Edit Class':'Add Class', `
    <form id="classForm">
      <div class="form-group">
        <label class="form-label">Subject</label>
        <input class="form-input" name="subject" value="${c?Utils.escape(c.subject):''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Teacher</label>
          <input class="form-input" name="teacher" value="${c?Utils.escape(c.teacher):''}">
        </div>
        <div class="form-group">
          <label class="form-label">Room</label>
          <input class="form-input" name="room" value="${c?Utils.escape(c.room):''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Day</label>
        <select class="form-select" name="day" required>
          ${days.map((d,i)=>`<option value="${i}" ${c&&c.day===i?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start</label>
          <input class="form-input" type="time" name="start" value="${c?c.start:'09:00'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">End</label>
          <input class="form-input" type="time" name="end" value="${c?c.end:'10:30'}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes">${c?Utils.escape(c.notes||''):''}</textarea>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveClass('${id||''}')">${c?'Save':'Add'}</button>
  `);
}

function saveClass(id){
  const form = document.getElementById('classForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.day = Number(data.day);
  const classes = Storage.get('classes',[]);
  if(id){
    const idx = classes.findIndex(c=>c.id===id);
    classes[idx] = {...classes[idx], ...data};
  } else {
    classes.push({id:Utils.uid(), ...data});
  }
  Storage.set('classes', classes);
  Modal.close();
  toast(id?'Class updated':'Class added');
  renderView('school');
}

function deleteClass(id){
  if(!confirm('Delete this class?')) return;
  const classes = Storage.get('classes',[]).filter(c=>c.id!==id);
  Storage.set('classes', classes);
  toast('Class deleted');
  renderView('school');
}

/* =========================================================
   PART-TIME WORK
========================================================= */
function renderWork(container){
  const shifts = Storage.get('shifts',[]).sort((a,b)=>b.date.localeCompare(a.date));
  const profile = Storage.get('profile',{});
  const today = Utils.today();
  const thisMonth = today.slice(0,7);
  
  const todayShifts = shifts.filter(s=>s.date===today);
  const monthShifts = shifts.filter(s=>s.date.startsWith(thisMonth));
  const weekShifts = shifts.filter(s=>{
    const d = new Date(s.date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate()-now.getDay());
    return d >= weekStart;
  });
  
  const monthHours = monthShifts.reduce((s,x)=>s+Utils.parseDuration(x.start,x.end,x.break).total/60,0);
  const monthIncome = monthShifts.reduce((s,x)=>s+calcShiftEarnings(x),0);
  const weekHours = weekShifts.reduce((s,x)=>s+Utils.parseDuration(x.start,x.end,x.break).total/60,0);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Part-Time Work / バイト</div>
        <div class="view-subtitle">${shifts.length} shifts total · ${Utils.yen(profile.hourlyWage||0)}/hour</div>
      </div>
      <button class="btn btn-primary" onclick="openShiftForm()"><ion-icon name="add"></ion-icon>Add Shift</button>
    </div>
    
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="time-outline"></ion-icon></div>
        <div class="stat-label">This Week</div>
        <div class="stat-value">${weekHours.toFixed(1)}h</div>
        <div class="stat-sub">${weekShifts.length} shifts</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="cash-outline"></ion-icon></div>
        <div class="stat-label">This Month</div>
        <div class="stat-value">${Utils.yen(Math.round(monthIncome))}</div>
        <div class="stat-sub">${monthHours.toFixed(1)} hours worked</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="trending-up-outline"></ion-icon></div>
        <div class="stat-label">Hourly Wage</div>
        <div class="stat-value">${Utils.yen(profile.hourlyWage||0)}</div>
        <div class="stat-sub">${Utils.escape(profile.name||'')}</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="list-outline"></ion-icon>Shift History</div>
      </div>
      <div class="list">
        ${shifts.length === 0 ? `<div class="empty-state"><ion-icon name="briefcase-outline"></ion-icon><p>No shifts recorded yet</p></div>` :
          shifts.slice(0,15).map(s=>{
            const d = Utils.parseDuration(s.start, s.end, s.break);
            const earn = calcShiftEarnings(s);
            return `
              <div class="list-item">
                <div class="list-item-dot" style="background:var(--warning)"></div>
                <div class="list-item-content">
                  <div class="list-item-title">${Utils.escape(s.workplace)}</div>
                  <div class="list-item-meta">
                    <span>${Utils.formatDate(s.date)}</span>
                    <span>${Utils.formatTime(s.start)} - ${Utils.formatTime(s.end)}</span>
                    <span>${d.hours}h${d.minutes}m</span>
                    <span style="color:var(--success);font-weight:600">${Utils.yen(Math.round(earn))}</span>
                  </div>
                </div>
                <div class="list-item-actions">
                  <button class="icon-btn" onclick="openShiftForm('${s.id}')" aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
                  <button class="icon-btn" onclick="deleteShift('${s.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    </div>
  `;
}

function openShiftForm(id){
  const shifts = Storage.get('shifts',[]);
  const profile = Storage.get('profile',{});
  const s = id ? shifts.find(x=>x.id===id) : null;
  Modal.open(s?'Edit Shift':'Add Shift', `
    <form id="shiftForm">
      <div class="form-group">
        <label class="form-label">Workplace</label>
        <input class="form-input" name="workplace" value="${s?Utils.escape(s.workplace):''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" name="date" value="${s?s.date:Utils.today()}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start</label>
          <input class="form-input" type="time" name="start" value="${s?s.start:'17:00'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">End</label>
          <input class="form-input" type="time" name="end" value="${s?s.end:'22:00'}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Break (min)</label>
          <input class="form-input" type="number" name="break" value="${s?s.break:30}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Hourly Wage (¥)</label>
          <input class="form-input" type="number" name="wage" value="${s?s.wage:(profile.hourlyWage||1200)}" min="0" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes">${s?Utils.escape(s.notes||''):''}</textarea>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveShift('${id||''}')">${s?'Save':'Add'}</button>
  `);
}

function saveShift(id){
  const form = document.getElementById('shiftForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.break = Number(data.break||0);
  data.wage = Number(data.wage||0);
  const shifts = Storage.get('shifts',[]);
  if(id){
    const idx = shifts.findIndex(s=>s.id===id);
    shifts[idx] = {...shifts[idx], ...data};
  } else {
    shifts.push({id:Utils.uid(), ...data});
  }
  Storage.set('shifts', shifts);
  Modal.close();
  toast(id?'Shift updated':'Shift added');
  renderView('work');
}

function deleteShift(id){
  if(!confirm('Delete this shift?')) return;
  const shifts = Storage.get('shifts',[]).filter(s=>s.id!==id);
  Storage.set('shifts', shifts);
  toast('Shift deleted');
  renderView('work');
}

/* =========================================================
   EXPENSES
========================================================= */
function renderExpenses(container){
  const expenses = Storage.get('expenses',[]).sort((a,b)=>b.date.localeCompare(a.date));
  const profile = Storage.get('profile',{});
  const today = Utils.today();
  const thisMonth = today.slice(0,7);
  
  const todayExp = expenses.filter(e=>e.date===today);
  const weekExp = expenses.filter(e=>{
    const d = new Date(e.date);
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay());
    return d >= weekStart;
  });
  const monthExp = expenses.filter(e=>e.date.startsWith(thisMonth));
  
  const todaySum = todayExp.reduce((s,e)=>s+Number(e.amount),0);
  const weekSum = weekExp.reduce((s,e)=>s+Number(e.amount),0);
  const monthSum = monthExp.reduce((s,e)=>s+Number(e.amount),0);
  const budget = profile.monthlyBudget || 150000;
  
  // Category breakdown
  const cats = {};
  monthExp.forEach(e=>{
    cats[e.category] = (cats[e.category]||0) + Number(e.amount);
  });
  const catColors = {food:'#c9302c',transportation:'#2d5a8f',rent:'#6b4a9a',phone:'#2d7a4f',school:'#c98a1f',shopping:'#e04a44',entertainment:'#4a9ae0',bills:'#8a5ac9',other:'#6b6b73'};
  
  // Last 7 days chart
  const last7 = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    const sum = expenses.filter(e=>e.date===ds).reduce((s,e)=>s+Number(e.amount),0);
    last7.push({day:Utils.dayName(d.getDay()), amount:sum});
  }
  const maxAmt = Math.max(...last7.map(l=>l.amount), 1);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Expenses / 支出管理</div>
        <div class="view-subtitle">${expenses.length} transactions · Budget ${Utils.yen(budget)}</div>
      </div>
      <button class="btn btn-primary" onclick="openExpenseForm()"><ion-icon name="add"></ion-icon>Add Expense</button>
    </div>
    
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="today-outline"></ion-icon></div>
        <div class="stat-label">Today</div>
        <div class="stat-value">${Utils.yen(todaySum)}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="calendar-outline"></ion-icon></div>
        <div class="stat-label">This Week</div>
        <div class="stat-value">${Utils.yen(weekSum)}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="wallet-outline"></ion-icon></div>
        <div class="stat-label">This Month</div>
        <div class="stat-value">${Utils.yen(monthSum)}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="piggy-bank-outline"></ion-icon></div>
        <div class="stat-label">Remaining</div>
        <div class="stat-value" style="color:${budget-monthSum>=0?'var(--success)':'var(--accent)'}">${Utils.yen(budget-monthSum)}</div>
      </div>
    </div>
    
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="bar-chart-outline"></ion-icon>Last 7 Days</div>
        </div>
        <div class="chart-bars">
          ${last7.map(l=>`
            <div class="chart-bar-wrap">
              <div class="chart-bar-value">${l.amount>0?'¥'+(l.amount/1000).toFixed(1)+'k':''}</div>
              <div class="chart-bar" style="height:${(l.amount/maxAmt)*100}%"></div>
              <div class="chart-bar-label">${l.day}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="pie-chart-outline"></ion-icon>By Category</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${Object.keys(cats).sort((a,b)=>cats[b]-cats[a]).map(cat=>{
            const pct = (cats[cat]/monthSum)*100;
            return `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:12px;text-transform:capitalize">${cat}</span>
                  <span style="font-size:12px;font-weight:600">${Utils.yen(cats[cat])} <span style="color:var(--text-muted);font-weight:400">(${pct.toFixed(0)}%)</span></span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${catColors[cat]||'var(--accent)'}"></div></div>
              </div>
            `;
          }).join('') || `<div class="empty-state" style="padding:20px"><p>No expenses this month</p></div>`}
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="list-outline"></ion-icon>Recent Expenses</div>
      </div>
      <div class="list">
        ${expenses.slice(0,15).map(e=>`
          <div class="list-item">
            <div class="list-item-dot" style="background:${catColors[e.category]||'var(--accent)'}"></div>
            <div class="list-item-content">
              <div class="list-item-title">${Utils.escape(e.description||e.category)}</div>
              <div class="list-item-meta">
                <span>${Utils.formatDate(e.date)}</span>
                <span class="badge" style="background:${catColors[e.category]}22;color:${catColors[e.category]}">${e.category}</span>
              </div>
            </div>
            <div style="font-weight:700;font-size:14px">${Utils.yen(e.amount)}</div>
            <div class="list-item-actions">
              <button class="icon-btn" onclick="openExpenseForm('${e.id}')" aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
              <button class="icon-btn" onclick="deleteExpense('${e.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
            </div>
          </div>
        `).join('') || `<div class="empty-state"><p>No expenses yet</p></div>`}
      </div>
    </div>
  `;
}

function openExpenseForm(id){
  const expenses = Storage.get('expenses',[]);
  const e = id ? expenses.find(x=>x.id===id) : null;
  const cats = ['food','transportation','rent','phone','school','shopping','entertainment','bills','other'];
  Modal.open(e?'Edit Expense':'Add Expense', `
    <form id="expenseForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount (¥)</label>
          <input class="form-input" type="number" name="amount" value="${e?e.amount:''}" min="0" step="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" name="date" value="${e?e.date:Utils.today()}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" name="category" required>
          ${cats.map(c=>`<option value="${c}" ${e&&e.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" name="description" value="${e?Utils.escape(e.description||''):''}" placeholder="What was it for?">
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveExpense('${id||''}')">${e?'Save':'Add'}</button>
  `);
}

function saveExpense(id){
  const form = document.getElementById('expenseForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.amount = Number(data.amount);
  const expenses = Storage.get('expenses',[]);
  if(id){
    const idx = expenses.findIndex(e=>e.id===id);
    expenses[idx] = {...expenses[idx], ...data};
  } else {
    expenses.push({id:Utils.uid(), ...data});
  }
  Storage.set('expenses', expenses);
  Modal.close();
  toast(id?'Expense updated':'Expense added');
  renderView('expenses');
}

function deleteExpense(id){
  if(!confirm('Delete this expense?')) return;
  const expenses = Storage.get('expenses',[]).filter(e=>e.id!==id);
  Storage.set('expenses', expenses);
  toast('Expense deleted');
  renderView('expenses');
}

/* =========================================================
   JAPANESE STUDY
========================================================= */
function renderJapanese(container){
  const sessions = Storage.get('studySessions',[]);
  const today = Utils.today();
  const thisMonth = today.slice(0,7);
  
  const todaySessions = sessions.filter(s=>s.date===today);
  const weekSessions = sessions.filter(s=>{
    const d = new Date(s.date);
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay());
    return d >= weekStart;
  });
  const monthSessions = sessions.filter(s=>s.date.startsWith(thisMonth));
  
  const todayMin = todaySessions.reduce((s,x)=>s+Number(x.duration),0);
  const weekMin = weekSessions.reduce((s,x)=>s+Number(x.duration),0);
  const monthMin = monthSessions.reduce((s,x)=>s+Number(x.duration),0);
  
  const todayVocab = todaySessions.reduce((s,x)=>s+Number(x.vocabulary||0),0);
  const todayKanji = todaySessions.reduce((s,x)=>s+Number(x.kanji||0),0);
  
  const streak = calcStudyStreak(sessions);
  
  // Last 7 days chart
  const last7 = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    const sum = sessions.filter(s=>s.date===ds).reduce((s,x)=>s+Number(x.duration),0);
    last7.push({day:Utils.dayName(d.getDay()), min:sum});
  }
  const maxMin = Math.max(...last7.map(l=>l.min), 1);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Japanese Study / 日本語学習</div>
        <div class="view-subtitle">${sessions.length} sessions logged · 🔥 ${streak} day streak</div>
      </div>
      <button class="btn btn-primary" onclick="openStudyForm()"><ion-icon name="add"></ion-icon>Log Session</button>
    </div>
    
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="flame-outline"></ion-icon></div>
        <div class="stat-label">Streak</div>
        <div class="stat-value">${streak} <span style="font-size:13px;font-weight:500;color:var(--text-muted)">days</span></div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="time-outline"></ion-icon></div>
        <div class="stat-label">Today</div>
        <div class="stat-value">${todayMin}<span style="font-size:13px;font-weight:500;color:var(--text-muted)">min</span></div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="calendar-outline"></ion-icon></div>
        <div class="stat-label">This Week</div>
        <div class="stat-value">${(weekMin/60).toFixed(1)}<span style="font-size:13px;font-weight:500;color:var(--text-muted)">h</span></div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="trending-up-outline"></ion-icon></div>
        <div class="stat-label">This Month</div>
        <div class="stat-value">${(monthMin/60).toFixed(1)}<span style="font-size:13px;font-weight:500;color:var(--text-muted)">h</span></div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="book-outline"></ion-icon>Today's Progress</div>
      </div>
      <div class="study-grid">
        <div class="study-item">
          <div class="study-item-label">Vocabulary</div>
          <div class="study-item-value">${todayVocab}</div>
          <div class="study-item-sub">words reviewed</div>
        </div>
        <div class="study-item">
          <div class="study-item-label">Kanji</div>
          <div class="study-item-value">${todayKanji}</div>
          <div class="study-item-sub">characters</div>
        </div>
        <div class="study-item">
          <div class="study-item-label">Study Time</div>
          <div class="study-item-value">${todayMin}</div>
          <div class="study-item-sub">minutes</div>
        </div>
        <div class="study-item">
          <div class="study-item-label">Sessions</div>
          <div class="study-item-value">${todaySessions.length}</div>
          <div class="study-item-sub">today</div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="bar-chart-outline"></ion-icon>Last 7 Days</div>
        </div>
        <div class="chart-bars">
          ${last7.map(l=>`
            <div class="chart-bar-wrap">
              <div class="chart-bar-value">${l.min>0?l.min+'m':''}</div>
              <div class="chart-bar" style="height:${(l.min/maxMin)*100}%"></div>
              <div class="chart-bar-label">${l.day}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="stats-chart-outline"></ion-icon>Skills Focus</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${['vocabulary','kanji','grammar','reading','listening','speaking'].map(skill=>{
            const total = monthSessions.reduce((s,x)=>s+Number(x[skill]||0),0);
            return `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:12px;text-transform:capitalize">${skill}</span>
                  <span style="font-size:12px;font-weight:600">${total}</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,total/2)}%"></div></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="list-outline"></ion-icon>Recent Sessions</div>
      </div>
      <div class="list">
        ${sessions.slice().reverse().slice(0,10).map(s=>`
          <div class="list-item">
            <div class="list-item-dot" style="background:var(--accent)"></div>
            <div class="list-item-content">
              <div class="list-item-title">${s.duration} min study session</div>
              <div class="list-item-meta">
                <span>${Utils.formatDate(s.date)}</span>
                <span>${s.vocabulary||0} vocab · ${s.kanji||0} kanji · ${s.grammar||0} grammar</span>
              </div>
            </div>
            <button class="icon-btn" onclick="deleteStudy('${s.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
          </div>
        `).join('') || `<div class="empty-state"><p>No sessions logged yet</p></div>`}
      </div>
    </div>
  `;
}

function openStudyForm(){
  Modal.open('Log Study Session', `
    <form id="studyForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" name="date" value="${Utils.today()}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (min)</label>
          <input class="form-input" type="number" name="duration" value="45" min="1" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Vocabulary</label>
          <input class="form-input" type="number" name="vocabulary" value="10" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Kanji</label>
          <input class="form-input" type="number" name="kanji" value="3" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Grammar points</label>
        <input class="form-input" type="number" name="grammar" value="1" min="0">
      </div>
      <div class="form-row" style="grid-template-columns:repeat(3,1fr)">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" name="reading" value="1"> Reading</label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" name="listening" value="1"> Listening</label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" name="speaking" value="1"> Speaking</label>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveStudy()">Log Session</button>
  `);
}

function saveStudy(){
  const form = document.getElementById('studyForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.duration = Number(data.duration);
  data.vocabulary = Number(data.vocabulary||0);
  data.kanji = Number(data.kanji||0);
  data.grammar = Number(data.grammar||0);
  data.reading = data.reading ? 1 : 0;
  data.listening = data.listening ? 1 : 0;
  data.speaking = data.speaking ? 1 : 0;
  const sessions = Storage.get('studySessions',[]);
  sessions.push({id:Utils.uid(), ...data});
  Storage.set('studySessions', sessions);
  Modal.close();
  toast('Study session logged! 📚');
  renderView('japanese');
}

function deleteStudy(id){
  if(!confirm('Delete this session?')) return;
  const sessions = Storage.get('studySessions',[]).filter(s=>s.id!==id);
  Storage.set('studySessions', sessions);
  toast('Session deleted');
  renderView('japanese');
}

/* =========================================================
   JLPT
========================================================= */
function renderJLPT(container){
  const profile = Storage.get('profile',{});
  const p = Storage.get('jlptProgress',{});
  const today = Utils.today();
  const days = profile.jlptDate ? Utils.daysBetween(today, profile.jlptDate) : 0;
  
  const vocabPct = (p.vocabulary/p.vocabularyTarget)*100;
  const kanjiPct = (p.kanji/p.kanjiTarget)*100;
  const gramPct = (p.grammar/p.grammarTarget)*100;
  const readPct = (p.reading/p.readingTarget)*100;
  const listPct = (p.listening/p.listeningTarget)*100;
  const overall = (vocabPct+kanjiPct+gramPct+readPct+listPct)/5;
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">JLPT Countdown</div>
        <div class="view-subtitle">Level ${Utils.escape(profile.jlptLevel||'N3')} · ${profile.jlptDate?Utils.formatDate(profile.jlptDate):'Set exam date'}</div>
      </div>
      <button class="btn btn-secondary" onclick="openJLPTSettings()"><ion-icon name="settings-outline"></ion-icon>Configure</button>
    </div>
    
    <div class="countdown" style="margin-bottom:16px">
      <div class="countdown-label">JLPT ${Utils.escape(profile.jlptLevel||'N3')}</div>
      <div class="countdown-level">Exam Date: ${profile.jlptDate?Utils.formatDate(profile.jlptDate):'Not set'}</div>
      <div class="countdown-days">${days}<small>days remaining</small></div>
      <div class="countdown-date">Overall preparation: ${Math.round(overall)}%</div>
      <div style="margin-top:12px;background:rgba(255,255,255,0.2);height:8px;border-radius:4px;overflow:hidden">
        <div style="height:100%;background:white;width:${overall}%;transition:width 0.6s"></div>
      </div>
    </div>
    
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="book-outline"></ion-icon>Vocabulary</div>
          <span style="font-size:12px;font-weight:600">${p.vocabulary||0}/${p.vocabularyTarget||1000}</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${vocabPct}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(vocabPct)}% complete</div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="language-outline"></ion-icon>Kanji</div>
          <span style="font-size:12px;font-weight:600">${p.kanji||0}/${p.kanjiTarget||650}</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${kanjiPct}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(kanjiPct)}% complete</div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="create-outline"></ion-icon>Grammar</div>
          <span style="font-size:12px;font-weight:600">${p.grammar||0}/${p.grammarTarget||120}</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${gramPct}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(gramPct)}% complete</div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="reader-outline"></ion-icon>Reading</div>
          <span style="font-size:12px;font-weight:600">${p.reading||0}/${p.readingTarget||60}</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${readPct}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(readPct)}% complete</div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="headset-outline"></ion-icon>Listening</div>
          <span style="font-size:12px;font-weight:600">${p.listening||0}/${p.listeningTarget||50}</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${listPct}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(listPct)}% complete</div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="trophy-outline"></ion-icon>Mock Test Score</div>
          <span style="font-size:12px;font-weight:600">${p.mockScore||0}/180</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px"><div class="progress-fill" style="width:${((p.mockScore||0)/180)*100}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${Math.round(((p.mockScore||0)/180)*100)}% of max score</div>
      </div>
    </div>
  `;
}

function openJLPTSettings(){
  const profile = Storage.get('profile',{});
  const p = Storage.get('jlptProgress',{});
  Modal.open('JLPT Configuration', `
    <form id="jlptForm">
      <div class="form-group">
        <label class="form-label">JLPT Level</label>
        <select class="form-select" name="jlptLevel">
          ${['N5','N4','N3','N2','N1'].map(l=>`<option ${profile.jlptLevel===l?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Exam Date</label>
        <input class="form-input" type="date" name="jlptDate" value="${profile.jlptDate||''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Vocabulary (${p.vocabulary||0}/${p.vocabularyTarget||1000})</label>
          <input class="form-input" type="number" name="vocabulary" value="${p.vocabulary||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target</label>
          <input class="form-input" type="number" name="vocabularyTarget" value="${p.vocabularyTarget||1000}" min="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Kanji (${p.kanji||0}/${p.kanjiTarget||650})</label>
          <input class="form-input" type="number" name="kanji" value="${p.kanji||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target</label>
          <input class="form-input" type="number" name="kanjiTarget" value="${p.kanjiTarget||650}" min="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Grammar (${p.grammar||0}/${p.grammarTarget||120})</label>
          <input class="form-input" type="number" name="grammar" value="${p.grammar||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target</label>
          <input class="form-input" type="number" name="grammarTarget" value="${p.grammarTarget||120}" min="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Reading</label>
          <input class="form-input" type="number" name="reading" value="${p.reading||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target</label>
          <input class="form-input" type="number" name="readingTarget" value="${p.readingTarget||60}" min="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Listening</label>
          <input class="form-input" type="number" name="listening" value="${p.listening||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Target</label>
          <input class="form-input" type="number" name="listeningTarget" value="${p.listeningTarget||50}" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Latest Mock Test Score (out of 180)</label>
        <input class="form-input" type="number" name="mockScore" value="${p.mockScore||0}" min="0" max="180">
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveJLPT()">Save</button>
  `);
}

function saveJLPT(){
  const form = document.getElementById('jlptForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  const profile = Storage.get('profile',{});
  profile.jlptLevel = data.jlptLevel;
  profile.jlptDate = data.jlptDate;
  Storage.set('profile', profile);
  const prog = {
    vocabulary:Number(data.vocabulary),
    vocabularyTarget:Number(data.vocabularyTarget),
    kanji:Number(data.kanji),
    kanjiTarget:Number(data.kanjiTarget),
    grammar:Number(data.grammar),
    grammarTarget:Number(data.grammarTarget),
    reading:Number(data.reading),
    readingTarget:Number(data.readingTarget),
    listening:Number(data.listening),
    listeningTarget:Number(data.listeningTarget),
    mockScore:Number(data.mockScore)
  };
  Storage.set('jlptProgress', prog);
  Modal.close();
  toast('JLPT settings saved');
  renderView('jlpt');
}

/* =========================================================
   TASKS
========================================================= */
function renderTasks(container){
  const tasks = Storage.get('tasks',[]);
  const today = Utils.today();
  const todayTasks = tasks.filter(t=>t.dueDate===today);
  const upcoming = tasks.filter(t=>!t.completed && t.dueDate>today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const overdue = tasks.filter(t=>!t.completed && t.dueDate<today);
  const completed = tasks.filter(t=>t.completed);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Tasks</div>
        <div class="view-subtitle">${tasks.filter(t=>!t.completed).length} open · ${completed.length} completed</div>
      </div>
      <button class="btn btn-primary" onclick="openTaskForm()"><ion-icon name="add"></ion-icon>Add Task</button>
    </div>
    
    ${overdue.length ? `
      <div class="card" style="margin-bottom:16px;border-left:3px solid var(--accent)">
        <div class="card-header">
          <div class="card-title" style="color:var(--accent)"><ion-icon name="warning-outline"></ion-icon>Overdue</div>
        </div>
        <div class="list">${overdue.map(renderTaskItem).join('')}</div>
      </div>
    ` : ''}
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="today-outline"></ion-icon>Today (${todayTasks.length})</div>
      </div>
      <div class="list">
        ${todayTasks.length === 0 ? `<div class="empty-state" style="padding:20px"><p>All clear for today!</p></div>` : todayTasks.map(renderTaskItem).join('')}
      </div>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="calendar-outline"></ion-icon>Upcoming (${upcoming.length})</div>
      </div>
      <div class="list">
        ${upcoming.length === 0 ? `<div class="empty-state" style="padding:20px"><p>No upcoming tasks</p></div>` : upcoming.slice(0,10).map(renderTaskItem).join('')}
      </div>
    </div>
    
    ${completed.length ? `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="checkmark-done-outline"></ion-icon>Completed (${completed.length})</div>
        </div>
        <div class="list">
          ${completed.slice(0,5).map(renderTaskItem).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function renderTaskItem(t){
  return `
    <div class="list-item ${t.completed?'completed':''}">
      <button class="icon-btn" onclick="toggleTask('${t.id}')" aria-label="Toggle">
        <ion-icon name="${t.completed?'checkbox':'square-outline'}"></ion-icon>
      </button>
      <div class="list-item-content">
        <div class="list-item-title">${Utils.escape(t.title)}</div>
        <div class="list-item-meta">
          <span><ion-icon name="calendar-outline" style="font-size:11px"></ion-icon> ${Utils.formatDate(t.dueDate)}</span>
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span class="badge badge-${t.category}">${t.category}</span>
        </div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn" onclick="openTaskForm('${t.id}')" aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
        <button class="icon-btn" onclick="deleteTask('${t.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
      </div>
    </div>
  `;
}

function toggleTask(id){
  const tasks = Storage.get('tasks',[]);
  const t = tasks.find(x=>x.id===id);
  if(t){ t.completed = !t.completed; Storage.set('tasks', tasks); toast(t.completed?'Task completed ✓':'Task reopened'); renderView('tasks'); }
}

function openTaskForm(id){
  const tasks = Storage.get('tasks',[]);
  const t = id ? tasks.find(x=>x.id===id) : null;
  Modal.open(t?'Edit Task':'Add Task', `
    <form id="taskForm">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input class="form-input" name="title" value="${t?Utils.escape(t.title):''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input class="form-input" type="date" name="dueDate" value="${t?t.dueDate:Utils.today()}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" name="priority">
            ${['high','medium','low'].map(p=>`<option value="${p}" ${t&&t.priority===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" name="category">
          ${['school','work','japanese','personal','important'].map(c=>`<option value="${c}" ${t&&t.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes">${t?Utils.escape(t.notes||''):''}</textarea>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveTask('${id||''}')">${t?'Save':'Add'}</button>
  `);
}

function saveTask(id){
  const form = document.getElementById('taskForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  const tasks = Storage.get('tasks',[]);
  if(id){
    const idx = tasks.findIndex(t=>t.id===id);
    tasks[idx] = {...tasks[idx], ...data};
  } else {
    tasks.push({id:Utils.uid(), completed:false, ...data});
  }
  Storage.set('tasks', tasks);
  Modal.close();
  toast(id?'Task updated':'Task added');
  renderView('tasks');
}

function deleteTask(id){
  if(!confirm('Delete this task?')) return;
  const tasks = Storage.get('tasks',[]).filter(t=>t.id!==id);
  Storage.set('tasks', tasks);
  toast('Task deleted');
  renderView('tasks');
}

/* =========================================================
   CALENDAR
========================================================= */
let calendarState = { year: new Date().getFullYear(), month: new Date().getMonth(), selected: Utils.today() };

function renderCalendar(container){
  const classes = Storage.get('classes',[]);
  const shifts = Storage.get('shifts',[]);
  const tasks = Storage.get('tasks',[]);
  const events = Storage.get('events',[]);
  const reminders = Storage.get('reminders',[]);
  const profile = Storage.get('profile',{});
  
  const {year, month, selected} = calendarState;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = Utils.today();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  
  let cells = [];
  // Previous month
  for(let i=startDay-1;i>=0;i--){
    const d = new Date(year, month-1, prevMonthDays-i);
    cells.push({date:d, other:true});
  }
  // Current month
  for(let i=1;i<=daysInMonth;i++){
    const d = new Date(year, month, i);
    cells.push({date:d, other:false});
  }
  // Next month
  while(cells.length % 7 !== 0 || cells.length < 42){
    const last = cells[cells.length-1].date;
    const d = new Date(last); d.setDate(d.getDate()+1);
    cells.push({date:d, other:true});
    if(cells.length >= 42) break;
  }
  
  const getEventsForDate = (d)=>{
    const ds = d.toISOString().slice(0,10);
    const dayOfWeek = d.getDay();
    const items = [];
    if(classes.some(c=>c.day===dayOfWeek)) items.push({type:'class'});
    if(shifts.some(s=>s.date===ds)) items.push({type:'work'});
    if(tasks.some(t=>t.dueDate===ds && !t.completed)) items.push({type:'task'});
    if(events.some(e=>e.date===ds)) items.push({type:'event'});
    if(profile.jlptDate === ds) items.push({type:'jlpt'});
    return items;
  };
  
  const selectedEvents = [];
  const selDate = new Date(selected);
  const selDs = selected;
  const selDay = selDate.getDay();
  classes.filter(c=>c.day===selDay).forEach(c=>selectedEvents.push({type:'class',title:c.subject,meta:`${Utils.formatTime(c.start)} · ${c.room}`,data:c}));
  shifts.filter(s=>s.date===selDs).forEach(s=>selectedEvents.push({type:'work',title:s.workplace,meta:`${Utils.formatTime(s.start)}-${Utils.formatTime(s.end)} · ~${Utils.yen(Math.round(calcShiftEarnings(s)))}`,data:s}));
  tasks.filter(t=>t.dueDate===selDs).forEach(t=>selectedEvents.push({type:'task',title:t.title,meta:`${t.priority} · ${t.category}${t.completed?' · done':''}`,data:t}));
  events.filter(e=>e.date===selDs).forEach(e=>selectedEvents.push({type:'event',title:e.title,meta:e.notes||e.type,data:e}));
  reminders.filter(r=>r.date===selDs).forEach(r=>selectedEvents.push({type:'reminder',title:r.title,meta:r.time?Utils.formatTime(r.time):'',data:r}));
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Calendar</div>
        <div class="view-subtitle">Overview of classes, work, tasks and events</div>
      </div>
      <button class="btn btn-primary" onclick="openEventForm()"><ion-icon name="add"></ion-icon>Add Event</button>
    </div>
    
    <div class="grid grid-2-1">
      <div class="calendar">
        <div class="calendar-header">
          <button class="btn btn-ghost btn-icon" onclick="changeMonth(-1)"><ion-icon name="chevron-back"></ion-icon></button>
          <div class="calendar-title">${monthNames[month]} ${year}</div>
          <button class="btn btn-ghost btn-icon" onclick="changeMonth(1)"><ion-icon name="chevron-forward"></ion-icon></button>
        </div>
        <div class="calendar-grid">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-day-name">${d}</div>`).join('')}
          ${cells.map(c=>{
            const ds = c.date.toISOString().slice(0,10);
            const evts = getEventsForDate(c.date);
            const isToday = ds === today;
            const isSel = ds === selected;
            return `
              <div class="calendar-day ${c.other?'other-month':''} ${isToday?'today':''} ${isSel?'selected':''}" onclick="selectDate('${ds}')">
                <div class="calendar-day-num">${c.date.getDate()}</div>
                <div class="calendar-dots">
                  ${evts.slice(0,4).map(e=>`<div class="calendar-dot dot-${e.type}"></div>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;font-size:11px;color:var(--text-muted)">
          <span><span class="calendar-dot dot-class" style="display:inline-block"></span> Class</span>
          <span><span class="calendar-dot dot-work" style="display:inline-block"></span> Work</span>
          <span><span class="calendar-dot dot-task" style="display:inline-block"></span> Task</span>
          <span><span class="calendar-dot dot-event" style="display:inline-block"></span> Event</span>
          <span><span class="calendar-dot dot-jlpt" style="display:inline-block"></span> JLPT</span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="calendar-outline"></ion-icon>${Utils.formatDate(selected)}</div>
        </div>
        <div class="list">
          ${selectedEvents.length === 0 ? `<div class="empty-state" style="padding:20px"><p>Nothing scheduled</p></div>` :
            selectedEvents.map(e=>`
              <div class="list-item">
                <div class="list-item-dot" style="background:${e.type==='class'?'var(--info)':e.type==='work'?'var(--warning)':e.type==='task'?'var(--accent)':e.type==='jlpt'?'#6b4a9a':'var(--success)'}"></div>
                <div class="list-item-content">
                  <div class="list-item-title">${Utils.escape(e.title)}</div>
                  <div class="list-item-meta"><span class="badge badge-${e.type==='class'?'school':e.type==='work'?'work':e.type==='task'?(e.data.category||'personal'):e.type==='jlpt'?'important':'personal'}">${e.type}</span> ${e.meta?`<span>${Utils.escape(e.meta)}</span>`:''}</div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>
  `;
}

function changeMonth(delta){
  calendarState.month += delta;
  if(calendarState.month > 11){ calendarState.month = 0; calendarState.year++; }
  if(calendarState.month < 0){ calendarState.month = 11; calendarState.year--; }
  renderView('calendar');
}

function selectDate(ds){
  calendarState.selected = ds;
  renderView('calendar');
}

function openEventForm(){
  Modal.open('Add Calendar Event', `
    <form id="eventForm">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input class="form-input" name="title" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" name="date" value="${calendarState.selected}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" name="type">
            <option value="personal">Personal</option>
            <option value="exam">Exam</option>
            <option value="school">School</option>
            <option value="work">Work</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" name="notes"></textarea>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveEvent()">Add</button>
  `);
}

function saveEvent(){
  const form = document.getElementById('eventForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  const events = Storage.get('events',[]);
  events.push({id:Utils.uid(), ...data});
  Storage.set('events', events);
  Modal.close();
  toast('Event added');
  renderView('calendar');
}

/* =========================================================
   REMINDERS
========================================================= */
function renderReminders(container){
  const reminders = Storage.get('reminders',[]).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const today = Utils.today();
  const upcoming = reminders.filter(r=>!r.completed && r.date>=today);
  const past = reminders.filter(r=>r.completed || r.date<today);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Reminders</div>
        <div class="view-subtitle">${upcoming.length} upcoming · ${past.length} past/completed</div>
      </div>
      <button class="btn btn-primary" onclick="openReminderForm()"><ion-icon name="add"></ion-icon>Add Reminder</button>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="alarm-outline"></ion-icon>Upcoming</div>
      </div>
      <div class="list">
        ${upcoming.length === 0 ? `<div class="empty-state" style="padding:20px"><p>No upcoming reminders</p></div>` :
          upcoming.map(r=>`
            <div class="list-item">
              <button class="icon-btn" onclick="toggleReminder('${r.id}')"><ion-icon name="square-outline"></ion-icon></button>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(r.title)}</div>
                <div class="list-item-meta">
                  <span><ion-icon name="calendar-outline" style="font-size:11px"></ion-icon> ${Utils.formatDate(r.date)}</span>
                  ${r.time?`<span><ion-icon name="time-outline" style="font-size:11px"></ion-icon> ${Utils.formatTime(r.time)}</span>`:''}
                  ${r.description?`<span>${Utils.escape(r.description)}</span>`:''}
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" onclick="openReminderForm('${r.id}')" aria-label="Edit"><ion-icon name="create-outline"></ion-icon></button>
                <button class="icon-btn" onclick="deleteReminder('${r.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
    
    ${past.length ? `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="checkmark-done-outline"></ion-icon>Past / Completed</div>
        </div>
        <div class="list">
          ${past.slice(0,10).map(r=>`
            <div class="list-item ${r.completed?'completed':''}">
              <button class="icon-btn" onclick="toggleReminder('${r.id}')"><ion-icon name="${r.completed?'checkbox':'square-outline'}"></ion-icon></button>
              <div class="list-item-content">
                <div class="list-item-title">${Utils.escape(r.title)}</div>
                <div class="list-item-meta">
                  <span>${Utils.formatDate(r.date)}</span>
                  ${r.time?`<span>${Utils.formatTime(r.time)}</span>`:''}
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" onclick="deleteReminder('${r.id}')" aria-label="Delete"><ion-icon name="trash-outline"></ion-icon></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function toggleReminder(id){
  const reminders = Storage.get('reminders',[]);
  const r = reminders.find(x=>x.id===id);
  if(r){ r.completed = !r.completed; Storage.set('reminders', reminders); renderView('reminders'); }
}

function openReminderForm(id){
  const reminders = Storage.get('reminders',[]);
  const r = id ? reminders.find(x=>x.id===id) : null;
  Modal.open(r?'Edit Reminder':'Add Reminder', `
    <form id="reminderForm">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input class="form-input" name="title" value="${r?Utils.escape(r.title):''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" name="date" value="${r?r.date:Utils.today()}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input class="form-input" type="time" name="time" value="${r?r.time||'':''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" name="description">${r?Utils.escape(r.description||''):''}</textarea>
      </div>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" onclick="saveReminder('${id||''}')">${r?'Save':'Add'}</button>
  `);
}

function saveReminder(id){
  const form = document.getElementById('reminderForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  const reminders = Storage.get('reminders',[]);
  if(id){
    const idx = reminders.findIndex(r=>r.id===id);
    reminders[idx] = {...reminders[idx], ...data};
  } else {
    reminders.push({id:Utils.uid(), completed:false, ...data});
  }
  Storage.set('reminders', reminders);
  Modal.close();
  toast(id?'Reminder updated':'Reminder added');
  renderView('reminders');
}

function deleteReminder(id){
  if(!confirm('Delete this reminder?')) return;
  const reminders = Storage.get('reminders',[]).filter(r=>r.id!==id);
  Storage.set('reminders', reminders);
  toast('Reminder deleted');
  renderView('reminders');
}

/* =========================================================
   STATISTICS
========================================================= */
function renderStats(container){
  const profile = Storage.get('profile',{});
  const shifts = Storage.get('shifts',[]);
  const expenses = Storage.get('expenses',[]);
  const sessions = Storage.get('studySessions',[]);
  const tasks = Storage.get('tasks',[]);
  const today = Utils.today();
  const thisMonth = today.slice(0,7);
  
  const monthShifts = shifts.filter(s=>s.date.startsWith(thisMonth));
  const monthExpenses = expenses.filter(e=>e.date.startsWith(thisMonth));
  const monthSessions = sessions.filter(s=>s.date.startsWith(thisMonth));
  const monthTasks = tasks.filter(t=>t.completed && t.dueDate && t.dueDate.startsWith(thisMonth));
  
  const monthIncome = monthShifts.reduce((s,x)=>s+calcShiftEarnings(x),0);
  const monthExpense = monthExpenses.reduce((s,e)=>s+Number(e.amount),0);
  const monthWorkHrs = monthShifts.reduce((s,x)=>s+Utils.parseDuration(x.start,x.end,x.break).total/60,0);
  const monthStudyHrs = monthSessions.reduce((s,x)=>s+Number(x.duration),0)/60;
  const streak = calcStudyStreak(sessions);
  
  // Income vs Expense chart
  const last6 = [];
  for(let i=5;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const ms = d.toISOString().slice(0,7);
    const inc = shifts.filter(s=>s.date.startsWith(ms)).reduce((s,x)=>s+calcShiftEarnings(x),0);
    const exp = expenses.filter(e=>e.date.startsWith(ms)).reduce((s,e)=>s+Number(e.amount),0);
    last6.push({month:d.toLocaleDateString('en-US',{month:'short'}), income:inc, expense:exp});
  }
  const maxVal = Math.max(...last6.flatMap(l=>[l.income,l.expense]), 1);
  
  // Study hours by week (last 4 weeks)
  const studyWeeks = [];
  for(let i=3;i>=0;i--){
    const start = new Date(); start.setDate(start.getDate() - (i*7+6));
    const end = new Date(); end.setDate(end.getDate() - i*7);
    let total = 0;
    sessions.forEach(s=>{
      const d = new Date(s.date);
      if(d >= start && d <= end) total += Number(s.duration);
    });
    studyWeeks.push({label:`W${4-i}`, hours: total/60});
  }
  const maxStudy = Math.max(...studyWeeks.map(w=>w.hours), 1);
  
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Statistics</div>
        <div class="view-subtitle">Your monthly productivity insights</div>
      </div>
    </div>
    
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="cash-outline"></ion-icon></div>
        <div class="stat-label">Monthly Income</div>
        <div class="stat-value" style="color:var(--success)">${Utils.yen(Math.round(monthIncome))}</div>
        <div class="stat-sub">${monthShifts.length} shifts</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="wallet-outline"></ion-icon></div>
        <div class="stat-label">Monthly Expenses</div>
        <div class="stat-value" style="color:var(--accent)">${Utils.yen(monthExpense)}</div>
        <div class="stat-sub">Budget: ${Utils.yen(profile.monthlyBudget||0)}</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="trending-up-outline"></ion-icon></div>
        <div class="stat-label">Net Savings</div>
        <div class="stat-value" style="color:${monthIncome-monthExpense>=0?'var(--success)':'var(--accent)'}">${Utils.yen(Math.round(monthIncome-monthExpense))}</div>
        <div class="stat-sub">This month</div>
      </div>
    </div>
    
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat">
        <div class="stat-icon"><ion-icon name="briefcase-outline"></ion-icon></div>
        <div class="stat-label">Working Hours</div>
        <div class="stat-value">${monthWorkHrs.toFixed(1)}h</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="book-outline"></ion-icon></div>
        <div class="stat-label">Study Hours</div>
        <div class="stat-value">${monthStudyHrs.toFixed(1)}h</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="checkmark-done-outline"></ion-icon></div>
        <div class="stat-label">Tasks Done</div>
        <div class="stat-value">${tasks.filter(t=>t.completed).length}</div>
        <div class="stat-sub">${monthTasks.length} this month</div>
      </div>
      <div class="stat">
        <div class="stat-icon"><ion-icon name="flame-outline"></ion-icon></div>
        <div class="stat-label">Study Streak</div>
        <div class="stat-value">${streak}d</div>
      </div>
    </div>
    
    <div class="grid grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="bar-chart-outline"></ion-icon>Income vs Expenses (6 months)</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:8px;font-size:11px">
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--success);border-radius:2px"></span> Income</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:2px"></span> Expenses</span>
        </div>
        <div class="chart-bars" style="height:180px">
          ${last6.map(l=>`
            <div class="chart-bar-wrap" style="gap:2px">
              <div style="display:flex;gap:2px;align-items:flex-end;height:100%;width:100%">
                <div class="chart-bar" style="height:${(l.income/maxVal)*100}%;background:var(--success);flex:1"></div>
                <div class="chart-bar" style="height:${(l.expense/maxVal)*100}%;flex:1"></div>
              </div>
              <div class="chart-bar-label">${l.month}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-title"><ion-icon name="time-outline"></ion-icon>Study Hours (4 weeks)</div>
        </div>
        <div class="chart-bars">
          ${studyWeeks.map(w=>`
            <div class="chart-bar-wrap">
              <div class="chart-bar-value">${w.hours.toFixed(1)}h</div>
              <div class="chart-bar" style="height:${(w.hours/maxStudy)*100}%"></div>
              <div class="chart-bar-label">${w.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="pie-chart-outline"></ion-icon>Expense Breakdown</div>
      </div>
      ${(() => {
        const cats = {};
        monthExpenses.forEach(e=>{ cats[e.category] = (cats[e.category]||0) + Number(e.amount); });
        const total = Object.values(cats).reduce((a,b)=>a+b,0) || 1;
        const catColors = {food:'#c9302c',transportation:'#2d5a8f',rent:'#6b4a9a',phone:'#2d7a4f',school:'#c98a1f',shopping:'#e04a44',entertainment:'#4a9ae0',bills:'#8a5ac9',other:'#6b6b73'};
        return `<div style="display:flex;flex-direction:column;gap:10px">
          ${Object.keys(cats).sort((a,b)=>cats[b]-cats[a]).map(cat=>{
            const pct = (cats[cat]/total)*100;
            return `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:12px;text-transform:capitalize">${cat}</span>
                  <span style="font-size:12px;font-weight:600">${Utils.yen(cats[cat])}</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${catColors[cat]||'var(--accent)'}"></div></div>
              </div>
            `;
          }).join('') || `<div class="empty-state"><p>No expenses this month</p></div>`}
        </div>`;
      })()}
    </div>
  `;
}

/* =========================================================
   SETTINGS
========================================================= */
function renderSettings(container){
  const profile = Storage.get('profile',{});
  const theme = Storage.get('theme','system');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <div class="view-title">Settings</div>
        <div class="view-subtitle">Customize your experience</div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="person-outline"></ion-icon>Profile</div>
      </div>
      <form id="profileForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Student Name</label>
            <input class="form-input" name="name" value="${Utils.escape(profile.name||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">School</label>
            <input class="form-input" name="school" value="${Utils.escape(profile.school||'')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Course</label>
            <input class="form-input" name="course" value="${Utils.escape(profile.course||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Budget (¥)</label>
            <input class="form-input" type="number" name="monthlyBudget" value="${profile.monthlyBudget||150000}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Hourly Wage (¥)</label>
            <input class="form-input" type="number" name="hourlyWage" value="${profile.hourlyWage||1200}">
          </div>
          <div class="form-group">
            <label class="form-label">JLPT Level</label>
            <select class="form-select" name="jlptLevel">
              ${['N5','N4','N3','N2','N1'].map(l=>`<option ${profile.jlptLevel===l?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">JLPT Exam Date</label>
          <input class="form-input" type="date" name="jlptDate" value="${profile.jlptDate||''}">
        </div>
        <button type="button" class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
      </form>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="color-palette-outline"></ion-icon>Theme</div>
      </div>
      <div style="display:flex;gap:8px">
        ${['light','dark','system'].map(t=>`
          <button class="btn ${theme===t?'btn-primary':'btn-secondary'}" onclick="setTheme('${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>
        `).join('')}
      </div>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><ion-icon name="save-outline"></ion-icon>Data Management</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="exportData()"><ion-icon name="download-outline"></ion-icon>Export JSON</button>
        <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()"><ion-icon name="upload-outline"></ion-icon>Import JSON</button>
        <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
        <button class="btn btn-danger" onclick="resetData()"><ion-icon name="trash-outline"></ion-icon>Reset All Data</button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="card-title"><ion-icon name="information-circle-outline"></ion-icon>About</div>
      </div>
      <div style="font-size:13px;color:var(--text-muted);line-height:1.6">
        <p><strong>Japanese Student Life Manager</strong> 🇯🇵</p>
        <p style="margin-top:8px">A personal productivity command center for international students in Japan. Track classes, part-time work, expenses, Japanese study progress, JLPT preparation, and more — all in one place.</p>
        <p style="margin-top:8px">All data is stored locally in your browser. No account required. Export your data anytime for backup.</p>
      </div>
    </div>
  `;
}

function saveProfile(){
  const form = document.getElementById('profileForm');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.monthlyBudget = Number(data.monthlyBudget);
  data.hourlyWage = Number(data.hourlyWage);
  Storage.set('profile', data);
  toast('Profile saved');
}

function setTheme(t){
  Theme.apply(t);
  renderView('settings');
}

function exportData(){
  const json = Storage.export();
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jp-student-life-${Utils.today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported');
}

function importData(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    if(confirm('This will replace all current data. Continue?')){
      if(Storage.import(ev.target.result)){
        toast('Data imported successfully');
        renderView('settings');
      } else {
        toast('Invalid JSON file', 'error');
      }
    }
  };
  reader.readAsText(file);
}

function resetData(){
  if(!confirm('This will delete ALL your data. Are you sure?')) return;
  if(!confirm('Really delete everything? This cannot be undone.')) return;
  Storage.reset();
  toast('All data reset');
  initSampleData();
  renderView('settings');
}

/* =========================================================
   SEARCH
========================================================= */
const searchInput = document.getElementById('globalSearch');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  if(!q){ searchResults.classList.remove('open'); return; }
  
  const results = [];
  const tasks = Storage.get('tasks',[]);
  const classes = Storage.get('classes',[]);
  const shifts = Storage.get('shifts',[]);
  const expenses = Storage.get('expenses',[]);
  const reminders = Storage.get('reminders',[]);
  const events = Storage.get('events',[]);
  
  tasks.forEach(t=>{
    if((t.title||'').toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q)){
      results.push({type:'task',icon:'checkmark-circle-outline',title:t.title,meta:`${t.priority} · ${t.category} · ${Utils.formatDate(t.dueDate)}`,view:'tasks'});
    }
  });
  classes.forEach(c=>{
    if((c.subject||'').toLowerCase().includes(q) || (c.teacher||'').toLowerCase().includes(q) || (c.room||'').toLowerCase().includes(q)){
      results.push({type:'class',icon:'school-outline',title:c.subject,meta:`${c.teacher} · ${c.room}`,view:'school'});
    }
  });
  shifts.forEach(s=>{
    if((s.workplace||'').toLowerCase().includes(q) || (s.notes||'').toLowerCase().includes(q)){
      results.push({type:'shift',icon:'briefcase-outline',title:s.workplace,meta:`${Utils.formatDate(s.date)} · ${Utils.formatTime(s.start)}`,view:'work'});
    }
  });
  expenses.forEach(e=>{
    if((e.description||'').toLowerCase().includes(q) || (e.category||'').toLowerCase().includes(q)){
      results.push({type:'expense',icon:'wallet-outline',title:e.description||e.category,meta:`${Utils.yen(e.amount)} · ${Utils.formatDate(e.date)}`,view:'expenses'});
    }
  });
  reminders.forEach(r=>{
    if((r.title||'').toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q)){
      results.push({type:'reminder',icon:'alarm-outline',title:r.title,meta:`${Utils.formatDate(r.date)}`,view:'reminders'});
    }
  });
  events.forEach(e=>{
    if((e.title||'').toLowerCase().includes(q) || (e.notes||'').toLowerCase().includes(q)){
      results.push({type:'event',icon:'calendar-outline',title:e.title,meta:`${Utils.formatDate(e.date)}`,view:'calendar'});
    }
  });
  
  if(results.length === 0){
    searchResults.innerHTML = `<div class="search-empty">No results for "${Utils.escape(q)}"</div>`;
  } else {
    searchResults.innerHTML = results.slice(0,10).map(r=>`
      <div class="search-result-item" onclick="goToResult('${r.view}')">
        <ion-icon name="${r.icon}"></ion-icon>
        <div style="flex:1;min-width:0">
          <div class="search-result-title">${Utils.escape(r.title)}</div>
          <div class="search-result-meta">${Utils.escape(r.meta)}</div>
        </div>
      </div>
    `).join('');
  }
  searchResults.classList.add('open');
});

searchInput.addEventListener('blur', ()=>{
  setTimeout(()=>searchResults.classList.remove('open'), 200);
});

function goToResult(view){
  searchResults.classList.remove('open');
  searchInput.value = '';
  switchView(view);
}

/* =========================================================
   QUICK ADD (FAB)
========================================================= */
const fab = document.getElementById('fab');
const fabMenu = document.getElementById('fabMenu');
fab.addEventListener('click', ()=> fabMenu.classList.toggle('open'));
document.addEventListener('click', (e)=>{
  if(!fab.contains(e.target) && !fabMenu.contains(e.target)) fabMenu.classList.remove('open');
});
document.querySelectorAll('.fab-menu-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    fabMenu.classList.remove('open');
    const type = item.dataset.type;
    if(type==='task') openTaskForm();
    else if(type==='class') openClassForm();
    else if(type==='work') openShiftForm();
    else if(type==='expense') openExpenseForm();
    else if(type==='study') openStudyForm();
    else if(type==='reminder') openReminderForm();
    else if(type==='event') openEventForm();
  });
});

/* =========================================================
   INIT
========================================================= */
Storage.load();
initSampleData();
Theme.init();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
  if(Storage.get('theme','system')==='system') Theme.apply('system');
});
switchView('dashboard');

// Expose functions to global scope for inline onclick handlers
window.switchView = switchView;
window.openClassForm = openClassForm;
window.saveClass = saveClass;
window.deleteClass = deleteClass;
window.openShiftForm = openShiftForm;
window.saveShift = saveShift;
window.deleteShift = deleteShift;
window.openExpenseForm = openExpenseForm;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
window.openStudyForm = openStudyForm;
window.saveStudy = saveStudy;
window.deleteStudy = deleteStudy;
window.openJLPTSettings = openJLPTSettings;
window.saveJLPT = saveJLPT;
window.openTaskForm = openTaskForm;
window.saveTask = saveTask;
window.deleteTask = deleteTask;
window.toggleTask = toggleTask;
window.changeMonth = changeMonth;
window.selectDate = selectDate;
window.openEventForm = openEventForm;
window.saveEvent = saveEvent;
window.openReminderForm = openReminderForm;
window.saveReminder = saveReminder;
window.deleteReminder = deleteReminder;
window.toggleReminder = toggleReminder;
window.saveProfile = saveProfile;
window.setTheme = setTheme;
window.exportData = exportData;
window.importData = importData;
window.resetData = resetData;
window.goToResult = goToResult;
window.Modal = Modal;
