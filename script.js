  const firebaseConfig = {
    apiKey: "AIzaSyAIII3nb_vpsDrWA2ObYuwOE3I2XXdzQiM",
    authDomain: "kaizen-habit-tracker-36453.firebaseapp.com",
    projectId: "kaizen-habit-tracker-36453",
    storageBucket: "kaizen-habit-tracker-36453.firebasestorage.app",
    messagingSenderId: "263873833982",
    appId: "1:263873833982:web:4ce4690b70bcec677baeaf",
    measurementId: "G-1YGCKZTLL8"
  };

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();


let habits = []; 
let editingId = null;
let deletingId = null; 
let habitViews = {}; 
let calendarStates = {}; 
let currentUser = null; 

const tooltip = document.getElementById('globalTooltip');
const authBtn = document.getElementById('authBtn');


const iconCalendar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const iconGrid = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const localData = JSON.parse(localStorage.getItem('kaizenHabits'));
    if(localData) {
        habits = localData;
        initViews();
        renderHabits(true); 
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            if(authBtn) {
                authBtn.innerText = "Sign Out";
                authBtn.classList.add('btn-danger'); 
            }
            loadFromCloud(); 
        } else {
            currentUser = null;
            if(authBtn) {
                authBtn.innerText = "Sign In with Google";
                authBtn.classList.remove('btn-danger');
            }
            habits = JSON.parse(localStorage.getItem('kaizenHabits')) || [];
            initViews();
            renderHabits(true);
        }
    });
});

function initViews() {
    habits.forEach(h => {
        if(!habitViews[h.id]) habitViews[h.id] = 'heatmap';
        if(!calendarStates[h.id]) {
            const now = new Date();
            calendarStates[h.id] = { year: now.getFullYear(), month: now.getMonth() };
        }
    });
}


function toggleAuth() {
    if (currentUser) {
        auth.signOut();
        location.reload(); 
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => alert(error.message));
    }
}

function saveData(isToggle = false) {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({
            habits: habits,
            lastUpdated: new Date()
        })
        .catch(err => console.error("Sync Error", err));

        renderHabits(!isToggle);
    } else {
        localStorage.setItem('kaizenHabits', JSON.stringify(habits));
        renderHabits(!isToggle);
    }
}

function loadFromCloud() {
    db.collection('users').doc(currentUser.uid)
    .onSnapshot((doc) => {
        if (doc.exists && doc.data().habits) {
            habits = doc.data().habits;
            initViews();
            renderHabits(false); 
        } else {
            if(habits.length > 0) saveData(); 
        }
    });
}


function addHabit(name, desc, freq) {
    const id = Date.now().toString();
    habits.push({ id, name, desc, freq, created: new Date().toISOString(), history: {} });
    habitViews[id] = 'heatmap';
    const now = new Date();
    calendarStates[id] = { year: now.getFullYear(), month: now.getMonth() };
    saveData();
}

function updateHabit(id, name, desc, freq) {
    const h = habits.find(x => x.id === id);
    if(h) { h.name = name; h.desc = desc; h.freq = freq; saveData(); }
}

const deleteModal = document.getElementById('deleteModal');
function deleteHabit(id) { deletingId = id; deleteModal.style.display = 'flex'; }
function closeDeleteModal() { deleteModal.style.display = 'none'; deletingId = null; }
function confirmDelete() {
    if (deletingId) { habits = habits.filter(h => h.id !== deletingId); saveData(); closeDeleteModal(); }
}

const resetModal = document.getElementById('resetModal');
function openResetModal() { resetModal.style.display = 'flex'; }
function closeResetModal() { resetModal.style.display = 'none'; }
function confirmReset() {
     if (!editingId) return;
     const h = habits.find(x => x.id === editingId);
     if (h) { h.history = {}; saveData(); }
     closeResetModal(); closeModal(); 
}

function toggleDate(habitId, dateStr) {
    const h = habits.find(x => x.id === habitId);
    if(h) { 
        h.history[dateStr] ? delete h.history[dateStr] : h.history[dateStr] = true; 
        saveData(true); 
    }
}

function toggleView(habitId) {
    habitViews[habitId] = habitViews[habitId] === 'heatmap' ? 'calendar' : 'heatmap';
    renderHabits(false);
}

function changeMonth(habitId, offset) {
    const state = calendarStates[habitId];
    state.month += offset;
    if (state.month > 11) { state.month = 0; state.year++; }
    if (state.month < 0) { state.month = 11; state.year--; }
    renderHabits(false);
}

// --- RENDER FUNCTIONS ---
function renderHabits(forceScrollToEnd = false) {
    const pageScrollY = window.scrollY;
    const scrollPositions = {};
    
    habits.forEach(h => {
        const el = document.getElementById(`scroll-wrapper-${h.id}`);
        if(el && el.offsetParent !== null) {
            scrollPositions[h.id] = el.scrollLeft;
        }
    });

    const list = document.getElementById('habitList');
    list.innerHTML = '';
    
    if(habits.length === 0) { 
        list.innerHTML = `
            <div style="text-align:center; padding:80px; color:var(--ink-light); font-weight:300;">
                ${currentUser ? 'Your cloud journey begins here.' : 'Data is saved locally. Sign in to sync.'}
            </div>`; 
        return; 
    }

    habits.forEach(h => {
        if(!habitViews[h.id]) habitViews[h.id] = 'heatmap';
        if(!calendarStates[h.id]) { const n = new Date(); calendarStates[h.id] = { year: n.getFullYear(), month: n.getMonth() }; }

        const streak = getStreak(h.history);
        const count = Object.keys(h.history).length;
        const isCalendar = habitViews[h.id] === 'calendar';
        
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.innerHTML = `
            <div class="habit-header">
                <div class="habit-title">
                    <h2>${h.name}</h2>
                    <div class="habit-desc">${h.desc}</div>
                </div>
                <div class="action-icons">
                    <span class="action-icon" onclick="toggleView('${h.id}')" title="${isCalendar ? 'View Heatmap' : 'View Calendar'}">
                        ${isCalendar ? iconGrid : iconCalendar}
                    </span>
                    <span class="action-icon" onclick="openEdit('${h.id}')" title="Edit">✎</span>
                    <span class="action-icon" onclick="deleteHabit('${h.id}')" title="Delete">✕</span>
                </div>
            </div>
            <div class="stats-bar">
                <div class="stat"><span class="stat-label">Streak</span><span class="stat-val">${streak}</span></div>
                <div class="stat"><span class="stat-label">Total</span><span class="stat-val">${count}</span></div>
            </div>
            
            <div id="heatmap-view-${h.id}" class="heatmap-container ${isCalendar ? 'hidden' : ''}">
                <div class="day-labels">
                    <div class="day-label">Mon</div><div class="day-label">Tue</div><div class="day-label">Wed</div>
                    <div class="day-label">Thu</div><div class="day-label">Fri</div><div class="day-label">Sat</div><div class="day-label">Sun</div>
                </div>
                <div class="heatmap-scroll-wrapper" id="scroll-wrapper-${h.id}">
                    <div class="months-row" id="months-${h.id}"></div>
                    <div class="heatmap-grid" id="grid-${h.id}"></div>
                </div>
            </div>

            <div id="calendar-view-${h.id}" class="calendar-container ${isCalendar ? 'active' : ''}">
            </div>
        `;
        list.appendChild(card);
        
        if (!isCalendar) {
            renderHeatmap(h.id, h.history);
            const wrapper = document.getElementById(`scroll-wrapper-${h.id}`);
            if(wrapper) {
                if (forceScrollToEnd) {
                    // Explicit force (e.g. fresh reload)
                    setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                } else if (scrollPositions[h.id] !== undefined) {
                    // Restore previous position (e.g. during toggle)
                    wrapper.scrollLeft = scrollPositions[h.id];
                } else {
                    // Default to end if no history (e.g. first load from cloud or switch from calendar)
                    setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                }
            }
        } else {
            renderCalendar(h.id, h.history);
        }
    });
    
    window.scrollTo(0, pageScrollY);
}

function renderCalendar(habitId, history) {
    const container = document.getElementById(`calendar-view-${habitId}`);
    const state = calendarStates[habitId];
    const year = state.year;
    const month = state.month;
    const firstDay = new Date(year, month, 1).getDay(); 
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const todayStr = new Date().toISOString().split('T')[0];

    let html = `
        <div class="cal-header">
            <button class="btn btn-sm" onclick="changeMonth('${habitId}', -1)">←</button>
            <div class="cal-title">${monthName} ${year}</div>
            <button class="btn btn-sm" onclick="changeMonth('${habitId}', 1)">→</button>
        </div>
        <div class="cal-grid">
            <div class="cal-day-name">Mon</div><div class="cal-day-name">Tue</div><div class="cal-day-name">Wed</div>
            <div class="cal-day-name">Thu</div><div class="cal-day-name">Fri</div><div class="cal-day-name">Sat</div><div class="cal-day-name">Sun</div>
    `;
    for(let i=0; i<startOffset; i++) html += `<div class="cal-day empty"></div>`;
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isDone = history[dateStr];
        const isToday = dateStr === todayStr;
        html += `<div class="cal-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}" onclick="toggleDate('${habitId}', '${dateStr}')">${d}</div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

function renderHeatmap(habitId, history) {
    const grid = document.getElementById(`grid-${habitId}`);
    const monthsContainer = document.getElementById(`months-${habitId}`);
    const boxSize = 15; const boxGap = 4; const columnWidth = boxSize + boxGap;
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); 
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day == 0 ? -6 : 1); 
    startDate.setDate(diff);
    const daysToRender = 53 * 7; 
    let currentMonth = -1;

    for (let i = 0; i < daysToRender; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isDone = history[dateStr];
        const isToday = dateStr === today.toISOString().split('T')[0];
        const readableDate = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        const box = document.createElement('div');
        box.className = `day-box ${isDone ? 'l-done' : ''} ${isToday ? 'l-today' : ''}`;
        box.onclick = () => toggleDate(habitId, dateStr);
        box.onmousemove = (e) => {
            tooltip.innerText = readableDate;
            tooltip.style.display = 'block';
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = (e.clientY - 40) + 'px';
        };
        box.onmouseleave = () => { tooltip.style.display = 'none'; };
        if(d > today) { box.style.opacity = '0.3'; box.style.pointerEvents = 'none'; }
        grid.appendChild(box);

        if (i % 7 === 0) {
            if (d.getMonth() !== currentMonth && d.getDate() < 14) { 
                currentMonth = d.getMonth();
                const colIndex = Math.floor(i / 7);
                const label = document.createElement('div');
                label.className = 'month-label';
                label.innerText = d.toLocaleDateString(undefined, { month: 'short' });
                label.style.left = `${colIndex * columnWidth}px`; 
                monthsContainer.appendChild(label);
            }
        }
    }
}

function getStreak(history) {
    let s = 0; const t = new Date();
    for(let i=0; i<365; i++) {
        const d = new Date(); d.setDate(t.getDate()-i);
        const k = d.toISOString().split('T')[0];
        if(history[k]) s++;
        else if(i===0) continue; 
        else break;
    }
    return s;
}

const modal = document.getElementById('habitModal');
const resetBtn = document.getElementById('resetBtn');
const inputs = { name: document.getElementById('habitName'), desc: document.getElementById('habitDesc'), freq: document.getElementById('habitFreq') };

function openModal() { 
    editingId=null; 
    inputs.name.value=''; inputs.desc.value=''; 
    resetBtn.style.display = 'none'; 
    document.getElementById('modalTitle').innerText = 'Design Routine';
    modal.style.display='flex'; inputs.name.focus(); 
}

function openEdit(id) { 
    const h=habits.find(x=>x.id===id); 
    if(h){ 
        editingId=id; 
        inputs.name.value=h.name; inputs.desc.value=h.desc; inputs.freq.value=h.freq; 
        resetBtn.style.display = 'block'; 
        document.getElementById('modalTitle').innerText = 'Refine Routine';
        modal.style.display='flex'; 
    } 
}

function closeModal() { modal.style.display='none'; }

function saveHabit() { 
    if(!inputs.name.value.trim()) return alert('Name required'); 
    if(editingId) updateHabit(editingId, inputs.name.value, inputs.desc.value, inputs.freq.value); 
    else addHabit(inputs.name.value, inputs.desc.value, inputs.freq.value); 
    closeModal(); 
}

window.onclick = e => { 
    if(e.target == modal) closeModal(); 
    if(e.target == deleteModal) closeDeleteModal();
    if(e.target == resetModal) closeResetModal();
};

function exportData() {
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(habits));
    a.download = "kaizen_habits.json"; a.click();
    
}
function importData(input) {
    const f = input.files[0]; if(!f)return;
    const r = new FileReader(); r.onload = e => { try { habits = JSON.parse(e.target.result); saveData(); alert('Restored.'); } catch(err){ alert('Error'); } };
    r.readAsText(f);
}