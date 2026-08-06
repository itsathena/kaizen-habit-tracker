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
