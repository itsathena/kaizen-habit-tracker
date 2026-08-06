// --- APP STATE ---
let habits = []; 
let editingId = null;
let deletingId = null; 
let habitViews = {}; 
let calendarStates = {}; 
let currentUser = null; 
let isDashboardGrid = false;
let habitCollapsed = {}; 
let draggedItemId = null;
let draggedItemIndex = null;
let isAllCollapsed = false;

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
// Add these below your existing iconCalendar and iconGrid variables
const iconDown = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const iconUp = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
