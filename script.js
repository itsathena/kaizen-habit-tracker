// --- FIREBASE CONFIGURATION ---
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

// --- APP STATE ---
let habits = []; 
let editingId = null;
let deletingId = null; 
let habitViews = {}; 
let calendarStates = {}; 
let currentUser = null; 

// Day Modal State
let currentDayHabitId = null;
let currentDayDateStr = null;
let currentDayStatus = false; 

// --- DOM ELEMENTS ---
let tooltip, landingView, appView, userProfile, userAvatar, userName, loadingScreen;
let modal, resetBtn, deleteModal, resetModal, dayModal;
let dayStatusBtn, dayNoteInput;
let inputs = {}; 

// SVG Icons
const iconCalendar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
const iconGrid = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Grab Elements
    tooltip = document.getElementById('globalTooltip');
    landingView = document.getElementById('landing-view');
    appView = document.getElementById('app-view');
    userProfile = document.getElementById('user-profile');
    userAvatar = document.getElementById('user-avatar');
    userName = document.getElementById('user-name');
    loadingScreen = document.getElementById('loading-screen');
    
    modal = document.getElementById('habitModal');
    resetBtn = document.getElementById('resetBtn');
    deleteModal = document.getElementById('deleteModal');
    resetModal = document.getElementById('resetModal');
    dayModal = document.getElementById('dayModal');
    
    dayStatusBtn = document.getElementById('dayStatusBtn');
    dayNoteInput = document.getElementById('dayNote');
    
    inputs = { 
        name: document.getElementById('habitName'), 
        desc: document.getElementById('habitDesc'), 
        freq: document.getElementById('habitFreq') 
    };

    // Auth Listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            if(userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
            if(userName) userName.innerText = user.displayName ? user.displayName.split(' ')[0] : 'User';
            if(userProfile) userProfile.style.display = 'flex';
            
            showAppView();
            loadFromCloud(); 
        } else {
            currentUser = null;
            if(userProfile) userProfile.style.display = 'none';
            
            const localData = JSON.parse(localStorage.getItem('kaizenHabits'));
            if(localData && localData.length > 0) {
                habits = localData;
                initViews();
                renderHabits(true);
                showAppView();
            } else {
                habits = [];
                showLandingView();
            }
        }
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 400); 
        }
    });
});

function showAppView() {
    if(landingView) landingView.style.display = 'none';
    if(appView) {
        appView.style.display = 'block';
        appView.classList.add('fade-in');
    }
}

function showLandingView() {
    if(appView) appView.style.display = 'none';
    if(landingView) {
        landingView.style.display = 'flex';
        landingView.classList.add('fade-in');
    }
}

function enterGuestMode() {
    const localData = JSON.parse(localStorage.getItem('kaizenHabits'));
    habits = localData || [];
    initViews();
    renderHabits(true);
    showAppView();
}

function initViews() {
    habits.forEach(h => {
        if(!habitViews[h.id]) habitViews[h.id] = 'heatmap';
        if(!calendarStates[h.id]) {
            const now = new Date();
            calendarStates[h.id] = { year: now.getFullYear(), month: now.getMonth() };
        }
        if(!h.notes) h.notes = {};
    });
}

// --- AUTH & SYNC ---
function toggleAuth() {
    if (currentUser) {
        auth.signOut().then(() => location.reload());
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        auth.signInWithPopup(provider).catch(error => alert(error.message));
    }
}

function saveData(isToggle = false) {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({
            habits: habits,
            lastUpdated: new Date()
        }).catch(err => console.error("Sync Error", err));
        
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
            else renderHabits(true);
        }
    });
}

// --- HABIT CRUD ---
function addHabit(name, desc, freq) {
    const id = Date.now().toString();
    habits.push({ id, name, desc, freq, created: new Date().toISOString(), history: {}, notes: {} });
    habitViews[id] = 'heatmap';
    const now = new Date();
    calendarStates[id] = { year: now.getFullYear(), month: now.getMonth() };
    saveData();
}

function updateHabit(id, name, desc, freq) {
    const h = habits.find(x => x.id === id);
    if(h) { h.name = name; h.desc = desc; h.freq = freq; saveData(); }
}

function openModal() { 
    editingId = null; 
    if(inputs.name) inputs.name.value = ''; 
    if(inputs.desc) inputs.desc.value = ''; 
    if(resetBtn) resetBtn.style.display = 'none'; 
    document.getElementById('modalTitle').innerText = 'Design Routine';
    if(modal) { modal.style.display = 'flex'; if(inputs.name) inputs.name.focus(); }
}

function openEdit(id) { 
    const h = habits.find(x => x.id === id); 
    if(h){ 
        editingId = id; 
        if(inputs.name) inputs.name.value = h.name; 
        if(inputs.desc) inputs.desc.value = h.desc; 
        if(inputs.freq) inputs.freq.value = h.freq; 
        if(resetBtn) resetBtn.style.display = 'block'; 
        document.getElementById('modalTitle').innerText = 'Refine Routine';
        if(modal) modal.style.display = 'flex'; 
    } 
}

function closeModal() { if(modal) modal.style.display = 'none'; }

function saveHabit() { 
    if (!inputs.name) return; 
    const name = inputs.name.value.trim();
    if(!name) return alert('Name required'); 
    
    if(editingId) updateHabit(editingId, name, inputs.desc.value, inputs.freq.value); 
    else addHabit(name, inputs.desc.value, inputs.freq.value); 
    closeModal(); 
}

// --- DAY DETAILS (Notes & Double Click) ---

function attachGridEvents(element, habitId, dateStr) {
    let pressTimer;
    let isLongPress = false;

    // 1. CLICK: Toggle Status (Fast)
    element.addEventListener('click', (e) => {
        // If we just finished a long press, do NOT toggle
        if (isLongPress) {
            isLongPress = false;
            return;
        }
        toggleDate(habitId, dateStr);
    });

    // 2. DOUBLE CLICK: Open Modal (Desktop)
    element.addEventListener('dblclick', (e) => {
        openDayModal(habitId, dateStr);
    });

    // 3. LONG PRESS: Open Modal (Mobile)
    element.addEventListener('touchstart', (e) => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true; // Flag to prevent 'click' from firing
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
            openDayModal(habitId, dateStr);
        }, 500); // 500ms long press
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        clearTimeout(pressTimer);
    });
    
    element.addEventListener('touchmove', (e) => {
        clearTimeout(pressTimer); // Cancel if scrolling
    });
}

function toggleDate(habitId, dateStr) {
    const h = habits.find(x => x.id === habitId);
    if(h) { 
        h.history[dateStr] ? delete h.history[dateStr] : h.history[dateStr] = true; 
        saveData(true); 
    }
}

function openDayModal(habitId, dateStr) {
    const h = habits.find(x => x.id === habitId);
    if (!h) return;

    currentDayHabitId = habitId;
    currentDayDateStr = dateStr;
    
    const dateObj = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dayModalTitle').innerText = dateObj.toLocaleDateString(undefined, options);
    document.getElementById('dayModalSubtitle').innerText = h.name;

    currentDayStatus = !!h.history[dateStr];
    updateDayStatusUI();

    if (!h.notes) h.notes = {};
    dayNoteInput.value = h.notes[dateStr] || '';

    dayModal.style.display = 'flex';
}

function toggleDayStatus() {
    currentDayStatus = !currentDayStatus;
    updateDayStatusUI();
}

function updateDayStatusUI() {
    if (currentDayStatus) {
        dayStatusBtn.classList.add('active');
        dayStatusBtn.innerText = "Completed";
    } else {
        dayStatusBtn.classList.remove('active');
        dayStatusBtn.innerText = "Mark as Done";
    }
}

function saveDayDetails() {
    const h = habits.find(x => x.id === currentDayHabitId);
    if (h) {
        if (currentDayStatus) h.history[currentDayDateStr] = true;
        else delete h.history[currentDayDateStr];

        const note = dayNoteInput.value.trim();
        if(!h.notes) h.notes = {};
        if (note) h.notes[currentDayDateStr] = note;
        else delete h.notes[currentDayDateStr];

        saveData(true);
    }
    closeDayModal();
}

function closeDayModal() {
    dayModal.style.display = 'none';
    currentDayHabitId = null;
    currentDayDateStr = null;
}

// --- GLOBAL CLICKS ---
window.onclick = e => { 
    if(modal && e.target == modal) closeModal(); 
    if(deleteModal && e.target == deleteModal) closeDeleteModal();
    if(resetModal && e.target == resetModal) closeResetModal();
    if(dayModal && e.target == dayModal) closeDayModal();
};

function deleteHabit(id) { deletingId = id; if(deleteModal) deleteModal.style.display = 'flex'; }
function closeDeleteModal() { if(deleteModal) deleteModal.style.display = 'none'; deletingId = null; }
function confirmDelete() {
    if (deletingId) { habits = habits.filter(h => h.id !== deletingId); saveData(); closeDeleteModal(); }
}

function openResetModal() { if(resetModal) resetModal.style.display = 'flex'; }
function closeResetModal() { if(resetModal) resetModal.style.display = 'none'; }
function confirmReset() {
     if (!editingId) return;
     const h = habits.find(x => x.id === editingId);
     if (h) { h.history = {}; h.notes = {}; saveData(); }
     closeResetModal(); closeModal(); 
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
    if(list) {
        list.innerHTML = '';
        
        if(habits.length === 0) { 
            list.innerHTML = `
                <div style="text-align:center; padding:80px; color:var(--ink-light); font-weight:300;">
                    ${currentUser ? 'Your cloud journey begins here.' : 'No habits yet.'}
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
                renderHeatmap(h.id, h.history, h.notes); 
                const wrapper = document.getElementById(`scroll-wrapper-${h.id}`);
                if(wrapper) {
                    if (forceScrollToEnd) {
                        setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                    } else if (scrollPositions[h.id] !== undefined) {
                        wrapper.scrollLeft = scrollPositions[h.id];
                    } else {
                         setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                    }
                }
            } else {
                renderCalendar(h.id, h.history, h.notes);
            }
        });
        
        window.scrollTo(0, pageScrollY);
    }
}

function renderCalendar(habitId, history, notes = {}) {
    const container = document.getElementById(`calendar-view-${habitId}`);
    if(!container) return; 

    const state = calendarStates[habitId];
    const year = state.year;
    const month = state.month;
    const firstDay = new Date(year, month, 1).getDay(); 
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const todayStr = new Date().toISOString().split('T')[0];

    // Clear Previous
    container.innerHTML = '';

    // Create Header
    const header = document.createElement('div');
    header.className = 'cal-header';
    header.innerHTML = `
        <button class="btn btn-sm" onclick="changeMonth('${habitId}', -1)">←</button>
        <div class="cal-title">${monthName} ${year}</div>
        <button class="btn btn-sm" onclick="changeMonth('${habitId}', 1)">→</button>
    `;
    container.appendChild(header);

    // Create Grid
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    // Day Names
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    dayNames.forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day-name';
        div.innerText = d;
        grid.appendChild(div);
    });

    // Empty Slots
    for(let i=0; i<startOffset; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day empty';
        grid.appendChild(div);
    }

    // Days
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isDone = history[dateStr];
        const isToday = dateStr === todayStr;
        const hasNote = notes[dateStr] ? true : false;

        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}`;
        dayDiv.innerText = d;
        
        if(hasNote) dayDiv.style.textDecoration = 'underline';
        
        // ATTACH EVENTS (Click / DblClick / LongPress)
        attachGridEvents(dayDiv, habitId, dateStr);
        
        grid.appendChild(dayDiv);
    }
    container.appendChild(grid);
}

function renderHeatmap(habitId, history, notes = {}) {
    const grid = document.getElementById(`grid-${habitId}`);
    const monthsContainer = document.getElementById(`months-${habitId}`);
    if(!grid || !monthsContainer) return; 

    // Reset content to prevent duplicates if called multiple times (though currently we wipe the whole list)
    grid.innerHTML = '';
    monthsContainer.innerHTML = '';

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
        const hasNote = notes[dateStr];
        const isToday = dateStr === today.toISOString().split('T')[0];
        const readableDate = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        const box = document.createElement('div');
        box.className = `day-box ${isDone ? 'l-done' : ''} ${isToday ? 'l-today' : ''}`;
        
        if(hasNote && !isDone) box.style.border = "1px solid var(--ink-light)";

        attachGridEvents(box, habitId, dateStr);

        box.onmousemove = (e) => {
            if(tooltip) {
                const noteText = hasNote ? `<br><span style="font-size:0.7em; opacity:0.8">${hasNote.substring(0,20)}${hasNote.length>20?'...':''}</span>` : '';
                tooltip.innerHTML = `${readableDate}${noteText}`;
                tooltip.style.display = 'block';
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = (e.clientY - 40) + 'px';
            }
        };
        box.onmouseleave = () => { if(tooltip) tooltip.style.display = 'none'; };
        
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