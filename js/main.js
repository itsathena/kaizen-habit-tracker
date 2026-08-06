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
