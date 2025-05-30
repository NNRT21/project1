
const appState = {
    currentUser: null,
    isAdmin: false,
    candidates: [],
    votes: {}
};


const users = [
    { id: 'admin', password: 'admin123', name: 'Admin User', role: 'admin' },
    { id: 'S12345', password: 'pass123', name: 'John Doe', role: 'student' },
    { id: 'S67890', password: 'pass456', name: 'Jane Smith', role: 'student' }
];


document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage
    loadFromLocalStorage();
    
    // Set up event handlers
    setupLogin();
    setupRegistration();
    setupProfilesFilter();
    setupVoting();
    
    // Initialize navigation
    setupNavigation();
    
    // Initialize pages
    renderCandidateProfiles();
    renderVotingOptions();
    renderResults();
    
    console.log('Student Election Portal initialized');
});

// Helper functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active-page');
    
    // Update navigation highlighting
    updateNavHighlighting(pageId);
}

function updateNavHighlighting(pageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.fontWeight = 'normal';
    });
    
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.style.fontWeight = 'bold';
    }
}

function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.innerHTML = message;
    element.className = isError ? 'error-message' : 'success-message';
    element.style.display = 'block';
}

function loadFromLocalStorage() {
    // Load candidates
    const storedCandidates = localStorage.getItem('candidates');
    if (storedCandidates) {
        appState.candidates = JSON.parse(storedCandidates);
    }
    
    // Load votes
    const storedVotes = localStorage.getItem('votes');
    if (storedVotes) {
        appState.votes = JSON.parse(storedVotes);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('candidates', JSON.stringify(appState.candidates));
    localStorage.setItem('votes', JSON.stringify(appState.votes));
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.getElementById('navLinks');
    navLinks.innerHTML = '';
    
    // If not logged in, only show Login
    if (!appState.currentUser) {
        const loginLink = document.createElement('a');
        loginLink.className = 'nav-link';
        loginLink.textContent = 'Login';
        loginLink.setAttribute('data-page', 'loginPage');
        loginLink.onclick = () => showPage('loginPage');
        navLinks.appendChild(loginLink);
        return;
    }
    
    // Common links for all logged-in users
    const pages = [
        { id: 'aboutPage', text: 'About' },
        { id: 'rulesPage', text: 'Rules' },
        { id: 'profilesPage', text: 'Candidates' },
        { id: 'votingPage', text: 'Vote' },
        { id: 'resultsPage', text: 'Results' }
    ];
    
    // Add registration link for admin
    if (appState.isAdmin) {
        pages.push({ id: 'registrationPage', text: 'Register Candidates' });
    }
    
    // Create link elements
    pages.forEach(page => {
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.textContent = page.text;
        link.setAttribute('data-page', page.id);
        link.onclick = () => showPage(page.id);
        navLinks.appendChild(link);
    });
    
    // Add logout link
    const logoutLink = document.createElement('a');
    logoutLink.className = 'nav-link';
    logoutLink.textContent = 'Logout';
    logoutLink.onclick = () => {
        appState.currentUser = null;
        appState.isAdmin = false;
        setupNavigation();
        showPage('loginPage');
    };
    navLinks.appendChild(logoutLink);
}

// Login functionality
function setupLogin() {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = users.find(u => u.id === username && u.password === password);
        
        if (user) {
            appState.currentUser = user;
            appState.isAdmin = user.role === 'admin';
            setupNavigation();
            showPage('aboutPage');
        } else {
            showMessage('loginMessage', 'Invalid credentials. Please try again.', true);
        }
    });
    
    document.getElementById('demoLoginBtn').addEventListener('click', () => {
        // Auto-fill with demo credentials
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'admin123';
    });
}

// Registration functionality
function setupRegistration() {
    document.getElementById('registerBtn').addEventListener('click', () => {
        const fullName = document.getElementById('fullName').value;
        const studentId = document.getElementById('studentId').value;
        const position = document.getElementById('position').value;
        const year = document.getElementById('year').value;
        const manifesto = document.getElementById('manifesto').value;
        
        // Simple validation
        if (!fullName || !studentId || !position || !year || !manifesto) {
            showMessage('registrationMessage', 'Please fill in all fields.', true);
            return;
        }
        
        // Check if student is already registered for a position
        const existingCandidate = appState.candidates.find(c => c.studentId === studentId);
        if (existingCandidate) {
            showMessage('registrationMessage', 'This student is already registered as a candidate.', true);
            return;
        }
        
        // Create candidate object
        const candidate = {
            id: Date.now().toString(),
            fullName,
            studentId,
            position,
            year,
            manifesto,
            // Use a placeholder image or default to first letter of name
            image: `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&size=128&background=random`
        };
        
        // Add to candidates list
        appState.candidates.push(candidate);
        saveToLocalStorage();
        
        // Reset form and show success message
        document.getElementById('fullName').value = '';
        document.getElementById('studentId').value = '';
        document.getElementById('position').value = '';
        document.getElementById('year').value = '';
        document.getElementById('manifesto').value = '';
        
        showMessage('registrationMessage', 'Candidate registered successfully!');
        
        // Update candidate profiles and voting options
        renderCandidateProfiles();
        renderVotingOptions();
    });
}

// Candidate profiles functionality
function renderCandidateProfiles(filterPosition = 'All') {
    const candidateCardsContainer = document.getElementById('candidateCards');
    candidateCardsContainer.innerHTML = '';
    
    let filteredCandidates = appState.candidates;
    if (filterPosition !== 'All') {
        filteredCandidates = appState.candidates.filter(candidate => candidate.position === filterPosition);
    }
    
    if (filteredCandidates.length === 0) {
        candidateCardsContainer.innerHTML = '<p>No candidates found for this position.</p>';
        return;
    }
    
    filteredCandidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-image">
                <img src="${candidate.image}" alt="${candidate.fullName}">
            </div>
            <h3>${candidate.fullName}</h3>
            <p><strong>Position:</strong> ${candidate.position}</p>
            <p><strong>Year:</strong> ${candidate.year}</p>
            <p><strong>Manifesto:</strong> ${candidate.manifesto}</p>
        `;
        candidateCardsContainer.appendChild(card);
    });
}

function setupProfilesFilter() {
    document.getElementById('positionFilter').addEventListener('change', (e) => {
        renderCandidateProfiles(e.target.value);
    });
}

// Voting functionality
function renderVotingOptions() {
    const positionSections = document.getElementById('positionSections');
    positionSections.innerHTML = '';
    
    // Get unique positions
    const positions = [...new Set(appState.candidates.map(c => c.position))];
    
    if (positions.length === 0) {
        positionSections.innerHTML = '<p>No candidates have registered yet.</p>';
        return;
    }
    
    // For each position, create a section with candidates
    positions.forEach(position => {
        const positionCandidates = appState.candidates.filter(c => c.position === position);
        
        const section = document.createElement('div');
        section.className = 'info-section';
        
        const heading = document.createElement('h2');
        heading.textContent = position;
        section.appendChild(heading);
        
        positionCandidates.forEach(candidate => {
            const voteCard = document.createElement('div');
            voteCard.className = 'vote-card';
            
            voteCard.innerHTML = `
                <div class="candidate-info">
                    <div class="candidate-image">
                        <img src="${candidate.image}" alt="${candidate.fullName}">
                    </div>
                    <div>
                        <h3>${candidate.fullName}</h3>
                        <p>${candidate.year}</p>
                    </div>
                </div>
                <div>
                    <input type="radio" name="vote-${position}" value="${candidate.id}" id="vote-${candidate.id}">
                    <label for="vote-${candidate.id}">Vote</label>
                </div>
            `;
            
            section.appendChild(voteCard);
        });
        
        positionSections.appendChild(section);
    });
}

function setupVoting() {
    document.getElementById('submitVotesBtn').addEventListener('click', () => {
        if (!appState.currentUser) {
            showMessage('votingMessage', 'You must be logged in to vote.', true);
            return;
        }
        
        const positions = [...new Set(appState.candidates.map(c => c.position))];
        const votes = {};
        let hasVoted = false;
        
        positions.forEach(position => {
            const selectedCandidate = document.querySelector(`input[name="vote-${position}"]:checked`);
            if (selectedCandidate) {
                votes[position] = selectedCandidate.value;
                hasVoted = true;
            }
        });
        
        if (!hasVoted) {
            showMessage('votingMessage', 'Please select at least one candidate to vote.', true);
            return;
        }
        
        // Check if user has already voted
        const userVotes = appState.votes[appState.currentUser.id];
        if (userVotes) {
            showMessage('votingMessage', 'You have already cast your votes.', true);
            return;
        }
        
        // Save votes
        appState.votes[appState.currentUser.id] = votes;
        saveToLocalStorage();
        
        showMessage('votingMessage', 'Your votes have been submitted successfully!');
        
        // Update results
        renderResults();
    });
}

// Results functionality
function renderResults() {
    const resultsSections = document.getElementById('resultsSections');
    resultsSections.innerHTML = '';
    
    // Get unique positions
    const positions = [...new Set(appState.candidates.map(c => c.position))];
    
    if (positions.length === 0) {
        resultsSections.innerHTML = '<p>No candidates have registered yet.</p>';
        return;
    }
    
    // For each position, count votes and display results
    positions.forEach(position => {
        const positionCandidates = appState.candidates.filter(c => c.position === position);
        
        // Create a results container for this position
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        
        const heading = document.createElement('h2');
        heading.textContent = position;
        resultsContainer.appendChild(heading);
        
        // Count votes for each candidate
        const voteCounts = {};
        positionCandidates.forEach(candidate => {
            voteCounts[candidate.id] = 0;
        });
        
        // Count votes from all users
        Object.values(appState.votes).forEach(userVotes => {
            if (userVotes[position] && voteCounts[userVotes[position]] !== undefined) {
                voteCounts[userVotes[position]]++;
            }
        });
        
        // Calculate total votes for this position
        const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
        
        // Create result items for each candidate
        positionCandidates.forEach(candidate => {
            const votes = voteCounts[candidate.id];
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            resultItem.innerHTML = `
                <div class="candidate-info">
                    <h3>${candidate.fullName}</h3>
                    <p>${votes} vote${votes !== 1 ? 's' : ''} (${Math.round(percentage)}%)</p>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            
            resultsContainer.appendChild(resultItem);
        });
        
        resultsSections.appendChild(resultsContainer);
    });
}
