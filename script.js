// ===== ELITE CASINO - COMPREHENSIVE GAME ENGINE =====
// Professional Standalone Casino Website with Full Features

// ===== STATE MANAGEMENT =====
const state = {
    currentUser: null,
    users: {},
    currentPage: 'dashboard',
    selectedBets: [],
    totalOdds: 1,
    blackjackGameState: null,
    soundEnabled: true
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        setupAuthListeners();
        showRandomPromotion();
    }, 1500);
}

// ===== AUTHENTICATION SYSTEM =====
function setupAuthListeners() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authTabs = document.querySelectorAll('.auth-tab');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });

    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);

    // Enter key support
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('register-confirm').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
}

function handleLogin() {
    const name = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-password').value;

    if (!name || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    const user = Object.values(state.users).find(u => u.name === name && u.password === password);
    if (user) {
        state.currentUser = user;
        showMainApp();
        showNotification(`Welcome back, ${user.name}!`, 'success');
    } else {
        showNotification('Invalid credentials', 'error');
    }
}

function handleRegister() {
    const name = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (!name || !phone || !password || !confirm) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirm) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (Object.values(state.users).some(u => u.name === name)) {
        showNotification('Name already taken', 'error');
        return;
    }

    const userId = `user_${Object.keys(state.users).length + 1}`;
    state.users[userId] = {
        id: userId,
        name,
        phone,
        password,
        balance: 1000,
        totalWinnings: 0,
        gamesPlayed: 0,
        wins: 0,
        transactions: [],
        vipPoints: 0,
        claimedBonuses: [],
        stats: {
            slots: { bets: 0, wins: 0 },
            roulette: { bets: 0, wins: 0 },
            blackjack: { bets: 0, wins: 0 },
            sports: { bets: 0, wins: 0 }
        }
    };

    state.currentUser = state.users[userId];
    showMainApp();
    showNotification(`Welcome, ${name}! You've been credited $1000`, 'success');
}

function showMainApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    setupMainAppListeners();
    updateUserDisplay();
    updateLeaderboard();
}

// ===== MAIN APP SETUP =====
function setupMainAppListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
            document.getElementById('nav-menu').classList.remove('active');
        });
    });

    // Mobile menu
    document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        state.currentUser = null;
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('login-name').value = '';
        document.getElementById('login-password').value = '';
        showNotification('You have been logged out', 'info');
    });

    // Game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            navigateToPage(game);
        });
    });

    // Slots
    document.getElementById('slots-bet').addEventListener('input', (e) => {
        document.getElementById('slots-bet-display').textContent = e.target.value;
    });
    document.getElementById('slots-spin-btn').addEventListener('click', playSlotsGame);

    // Roulette
    document.getElementById('roulette-bet').addEventListener('input', (e) => {
        document.getElementById('roulette-bet-display').textContent = e.target.value;
    });
    document.querySelectorAll('[data-bet]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-bet]').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    document.getElementById('roulette-spin-btn').addEventListener('click', playRouletteGame);

    // Blackjack
    document.getElementById('blackjack-bet').addEventListener('input', (e) => {
        document.getElementById('blackjack-bet-display').textContent = e.target.value;
    });
    document.getElementById('blackjack-deal-btn').addEventListener('click', dealBlackjack);
    document.getElementById('blackjack-hit-btn').addEventListener('click', blackjackHit);
    document.getElementById('blackjack-stand-btn').addEventListener('click', blackjackStand);
    document.getElementById('blackjack-double-btn').addEventListener('click', blackjackDouble);

    // Sports
    document.getElementById('sports-stake').addEventListener('input', (e) => {
        document.getElementById('sports-stake-display').textContent = e.target.value;
        updatePotentialWin();
    });
    document.getElementById('place-bet-btn').addEventListener('click', placeSportsBet);
    document.getElementById('clear-bet-btn').addEventListener('click', clearBets);

    // Wallet
    document.getElementById('deposit-btn').addEventListener('click', handleDeposit);
    document.getElementById('withdraw-btn').addEventListener('click', handleWithdraw);

    // Promotions
    document.querySelectorAll('.claim-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const promo = btn.dataset.promo;
            claimPromotion(promo);
        });
    });

    // Admin
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            updateAdminPanel();
        });
    });

    // Close promotion popup
    document.querySelector('.close-popup').addEventListener('click', () => {
        document.getElementById('promotion-popup').classList.add('hidden');
    });

    // Initialize
    initializeSportsMatches();
    updateDashboard();
}

// ===== NAVIGATION =====
function navigateToPage(page) {
    state.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    if (page === 'dashboard') updateDashboard();
    if (page === 'wallet') updateWalletDisplay();
    if (page === 'leaderboard') updateLeaderboard();
    if (page === 'admin') updateAdminPanel();
    if (page === 'promotions') updatePromotionsDisplay();
}

// ===== NOTIFICATIONS & POPUPS =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };

    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function showRandomPromotion() {
    const promotions = [
        {
            title: '🎉 Welcome Bonus!',
            desc: 'Get 100% match on your first deposit up to $500'
        },
        {
            title: '🎁 Daily Rewards',
            desc: 'Claim $50 every 24 hours'
        },
        {
            title: '👑 VIP Program',
            desc: 'Earn loyalty points on every bet'
        }
    ];

    const promo = promotions[Math.floor(Math.random() * promotions.length)];
    const popup = document.getElementById('promotion-popup');
    const body = popup.querySelector('.promotion-body');
    body.innerHTML = `
        <h2>${promo.title}</h2>
        <p>${promo.desc}</p>
        <button class="spin-button" onclick="document.getElementById('promotion-popup').classList.add('hidden')">
            <i class="fas fa-check"></i> Got it!
        </button>
    `;
    popup.classList.remove('hidden');
}

// ===== USER DISPLAY =====
function updateUserDisplay() {
    if (!state.currentUser) return;
    document.getElementById('user-name').textContent = state.currentUser.name;
    document.getElementById('user-balance').textContent = `$${state.currentUser.balance.toFixed(2)}`;
    document.getElementById('dashboard-name').textContent = state.currentUser.name;

    // VIP Level
    const vipLevels = {
        0: 'Member',
        100: 'Silver',
        500: 'Gold',
        1000: 'Platinum',
        5000: 'Diamond'
    };
    let vipLevel = 'Member';
    for (const [points, level] of Object.entries(vipLevels)) {
        if (state.currentUser.vipPoints >= parseInt(points)) {
            vipLevel = level;
        }
    }
    document.getElementById('vip-level').textContent = vipLevel;

    // Show/hide admin
    const adminOnly = document.querySelectorAll('.admin-only');
    if (state.currentUser.name === 'admin') {
        adminOnly.forEach(el => el.classList.remove('hidden'));
    } else {
        adminOnly.forEach(el => el.classList.add('hidden'));
    }
}

// ===== DASHBOARD =====
function updateDashboard() {
    if (!state.currentUser) return;
    const totalGames = state.currentUser.gamesPlayed || 0;
    const winRate = totalGames > 0 ? ((state.currentUser.wins || 0) / totalGames * 100).toFixed(1) : 0;
    
    document.getElementById('dashboard-balance').textContent = `$${state.currentUser.balance.toFixed(2)}`;
    document.getElementById('dashboard-winnings').textContent = `$${(state.currentUser.totalWinnings || 0).toFixed(2)}`;
    document.getElementById('dashboard-games').textContent = totalGames;
    document.getElementById('dashboard-winrate').textContent = `${winRate}%`;
}

// ===== SLOTS GAME =====
function playSlotsGame() {
    if (!state.currentUser) return;
    
    const bet = parseInt(document.getElementById('slots-bet').value);
    
    if (bet > state.currentUser.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    const spinBtn = document.getElementById('slots-spin-btn');
    spinBtn.disabled = true;

    state.currentUser.balance -= bet;
    state.currentUser.gamesPlayed = (state.currentUser.gamesPlayed || 0) + 1;
    state.currentUser.stats.slots.bets = (state.currentUser.stats.slots.bets || 0) + 1;

    const reels = [1, 2, 3];
    const symbols = ['🍒', '🍊', '🍋', '🍌', '🍉', '🔔', '💎'];
    let spinCount = 0;

    const spinInterval = setInterval(() => {
        reels.forEach((reel, i) => {
            const reelEl = document.getElementById(`reel-${i + 1}`);
            reelEl.classList.add('spinning');
            reelEl.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        });
        spinCount++;
        if (spinCount > 20) {
            clearInterval(spinInterval);
            
            const finalReels = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
            finalReels.forEach((symbol, i) => {
                const reelEl = document.getElementById(`reel-${i + 1}`);
                reelEl.classList.remove('spinning');
                reelEl.textContent = symbol;
            });

            const allMatch = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
            let payout = 0;

            if (allMatch) {
                const payouts = {
                    '🍒': 5, '🍊': 10, '🍋': 15, '🍌': 20,
                    '🍉': 25, '🔔': 50, '💎': 100
                };
                payout = bet * (payouts[finalReels[0]] || 1);
                state.currentUser.balance += payout;
                state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) + (payout - bet);
                state.currentUser.wins = (state.currentUser.wins || 0) + 1;
                state.currentUser.stats.slots.wins = (state.currentUser.stats.slots.wins || 0) + 1;
                state.currentUser.vipPoints = (state.currentUser.vipPoints || 0) + Math.floor(payout / 10);

                const resultEl = document.getElementById('slots-result');
                resultEl.textContent = `🎉 YOU WON! +$${payout}`;
                resultEl.className = 'game-result win';
                resultEl.classList.remove('hidden');
                showNotification(`Slots Win! +$${payout}`, 'success');
            } else {
                state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) - bet;

                const resultEl = document.getElementById('slots-result');
                resultEl.textContent = `❌ No Match. -$${bet}`;
                resultEl.className = 'game-result lose';
                resultEl.classList.remove('hidden');
                showNotification(`No match. -$${bet}`, 'info');
            }

            addTransaction('bet', -bet, 'Slots Game');
            updateUserDisplay();
            spinBtn.disabled = false;
        }
    }, 100);
}

// ===== ROULETTE GAME =====
function playRouletteGame() {
    if (!state.currentUser) return;

    const bet = parseInt(document.getElementById('roulette-bet').value);
    const selectedBet = document.querySelector('[data-bet].selected');

    if (!selectedBet) {
        showNotification('Please select a bet type', 'warning');
        return;
    }

    if (bet > state.currentUser.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    const spinBtn = document.getElementById('roulette-spin-btn');
    spinBtn.disabled = true;

    state.currentUser.balance -= bet;
    state.currentUser.gamesPlayed = (state.currentUser.gamesPlayed || 0) + 1;
    state.currentUser.stats.roulette.bets = (state.currentUser.stats.roulette.bets || 0) + 1;

    const wheel = document.getElementById('roulette-wheel');
    wheel.classList.add('spinning');

    setTimeout(() => {
        wheel.classList.remove('spinning');

        const result = Math.floor(Math.random() * 37);
        const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(result);
        const isBlack = result !== 0 && !isRed;
        const isEven = result !== 0 && result % 2 === 0;
        const isOdd = result !== 0 && result % 2 === 1;
        const isLow = result >= 1 && result <= 18;
        const isHigh = result >= 19 && result <= 36;

        const betType = selectedBet.dataset.bet;
        let won = false;

        switch(betType) {
            case 'red': won = isRed; break;
            case 'black': won = isBlack; break;
            case 'even': won = isEven; break;
            case 'odd': won = isOdd; break;
            case '1-18': won = isLow; break;
            case '19-36': won = isHigh; break;
        }

        let payout = 0;
        if (won) {
            payout = bet * 2;
            state.currentUser.balance += payout;
            state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) + (payout - bet);
            state.currentUser.wins = (state.currentUser.wins || 0) + 1;
            state.currentUser.stats.roulette.wins = (state.currentUser.stats.roulette.wins || 0) + 1;
            state.currentUser.vipPoints = (state.currentUser.vipPoints || 0) + Math.floor(payout / 10);

            const resultEl = document.getElementById('roulette-result');
            resultEl.textContent = `🎉 YOU WON! Number: ${result} | +$${payout}`;
            resultEl.className = 'game-result win';
            resultEl.classList.remove('hidden');
            showNotification(`Roulette Win! +$${payout}`, 'success');
        } else {
            state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) - bet;

            const resultEl = document.getElementById('roulette-result');
            resultEl.textContent = `❌ Lost. Number: ${result} | -$${bet}`;
            resultEl.className = 'game-result lose';
            resultEl.classList.remove('hidden');
            showNotification(`Roulette Loss. -$${bet}`, 'info');
        }

        addTransaction('bet', -bet, 'Roulette Game');
        updateUserDisplay();
        spinBtn.disabled = false;
    }, 3000);
}

// ===== BLACKJACK GAME =====
function dealBlackjack() {
    if (!state.currentUser) return;

    const bet = parseInt(document.getElementById('blackjack-bet').value);

    if (bet > state.currentUser.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    state.currentUser.balance -= bet;
    state.currentUser.gamesPlayed = (state.currentUser.gamesPlayed || 0) + 1;
    state.currentUser.stats.blackjack.bets = (state.currentUser.stats.blackjack.bets || 0) + 1;

    state.blackjackGameState = {
        bet,
        playerCards: [drawCard(), drawCard()],
        dealerCards: [drawCard(), drawCard()],
        gameOver: false,
        playerStand: false
    };

    displayBlackjackCards();
    document.getElementById('blackjack-deal-btn').disabled = true;
    document.getElementById('action-buttons').classList.remove('hidden');

    if (calculateBlackjackTotal(state.blackjackGameState.playerCards) === 21) {
        endBlackjackGame();
    }
}

function drawCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return values[Math.floor(Math.random() * values.length)] + suits[Math.floor(Math.random() * suits.length)];
}

function getCardValue(card) {
    const value = card.slice(0, -1);
    if (value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(value)) return 10;
    return parseInt(value);
}

function calculateBlackjackTotal(cards) {
    let total = 0;
    let aces = 0;
    
    cards.forEach(card => {
        const value = getCardValue(card);
        if (card[0] === 'A') aces++;
        total += value;
    });

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

function displayBlackjackCards() {
    const playerDisplay = document.getElementById('player-cards');
    const dealerDisplay = document.getElementById('dealer-cards');

    playerDisplay.innerHTML = state.blackjackGameState.playerCards.map(card => 
        `<div class="card">${card}</div>`
    ).join('');

    dealerDisplay.innerHTML = state.blackjackGameState.dealerCards.map((card, i) => 
        `<div class="card">${i === 0 ? card : '🂠'}</div>`
    ).join('');

    document.getElementById('player-total').textContent = `Total: ${calculateBlackjackTotal(state.blackjackGameState.playerCards)}`;
    document.getElementById('dealer-total').textContent = `Total: ${calculateBlackjackTotal([state.blackjackGameState.dealerCards[0]])}`;
}

function blackjackHit() {
    if (!state.blackjackGameState || state.blackjackGameState.gameOver) return;
    
    state.blackjackGameState.playerCards.push(drawCard());
    displayBlackjackCards();

    if (calculateBlackjackTotal(state.blackjackGameState.playerCards) > 21) {
        endBlackjackGame();
    }
}

function blackjackStand() {
    if (!state.blackjackGameState || state.blackjackGameState.gameOver) return;
    
    state.blackjackGameState.playerStand = true;
    endBlackjackGame();
}

function blackjackDouble() {
    if (!state.blackjackGameState || state.blackjackGameState.gameOver || state.blackjackGameState.playerCards.length !== 2) return;
    
    if (state.currentUser.balance < state.blackjackGameState.bet) {
        showNotification('Insufficient balance to double down', 'error');
        return;
    }

    state.currentUser.balance -= state.blackjackGameState.bet;
    state.blackjackGameState.bet *= 2;
    state.blackjackGameState.playerCards.push(drawCard());
    displayBlackjackCards();

    if (calculateBlackjackTotal(state.blackjackGameState.playerCards) > 21) {
        endBlackjackGame();
    } else {
        state.blackjackGameState.playerStand = true;
        endBlackjackGame();
    }
}

function endBlackjackGame() {
    const playerTotal = calculateBlackjackTotal(state.blackjackGameState.playerCards);
    let dealerTotal = calculateBlackjackTotal(state.blackjackGameState.dealerCards);

    while (dealerTotal < 17) {
        state.blackjackGameState.dealerCards.push(drawCard());
        dealerTotal = calculateBlackjackTotal(state.blackjackGameState.dealerCards);
    }

    displayBlackjackCards();
    document.getElementById('dealer-total').textContent = `Total: ${dealerTotal}`;

    let result = '';
    let payout = 0;

    if (playerTotal > 21) {
        result = 'BUST! You went over 21.';
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) - state.blackjackGameState.bet;
    } else if (dealerTotal > 21) {
        result = 'Dealer busted! You win!';
        payout = state.blackjackGameState.bet * 2;
        state.currentUser.balance += payout;
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) + (payout - state.blackjackGameState.bet);
        state.currentUser.wins = (state.currentUser.wins || 0) + 1;
        state.currentUser.stats.blackjack.wins = (state.currentUser.stats.blackjack.wins || 0) + 1;
    } else if (playerTotal > dealerTotal) {
        result = 'You win!';
        payout = state.blackjackGameState.bet * 2;
        state.currentUser.balance += payout;
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) + (payout - state.blackjackGameState.bet);
        state.currentUser.wins = (state.currentUser.wins || 0) + 1;
        state.currentUser.stats.blackjack.wins = (state.currentUser.stats.blackjack.wins || 0) + 1;
    } else if (playerTotal < dealerTotal) {
        result = 'Dealer wins!';
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) - state.blackjackGameState.bet;
    } else {
        result = 'Push! It\'s a tie.';
        state.currentUser.balance += state.blackjackGameState.bet;
    }

    if (payout > 0) {
        state.currentUser.vipPoints = (state.currentUser.vipPoints || 0) + Math.floor(payout / 10);
    }

    const resultEl = document.getElementById('blackjack-result');
    resultEl.textContent = result + (payout > 0 ? ` +$${payout}` : '');
    resultEl.className = `game-result ${payout > 0 ? 'win' : 'lose'}`;
    resultEl.classList.remove('hidden');

    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('blackjack-deal-btn').disabled = false;
    state.blackjackGameState.gameOver = true;

    addTransaction('bet', -state.blackjackGameState.bet, 'Blackjack Game');
    updateUserDisplay();
    
    if (payout > 0) {
        showNotification(`Blackjack Win! +$${payout}`, 'success');
    }
}

// ===== SPORTS BETTING =====
function initializeSportsMatches() {
    const matches = [
        { id: 1, home: 'Manchester United', away: 'Liverpool', homeOdds: 2.1, drawOdds: 3.2, awayOdds: 3.5 },
        { id: 2, home: 'Barcelona', away: 'Real Madrid', homeOdds: 1.9, drawOdds: 3.5, awayOdds: 3.8 },
        { id: 3, home: 'Bayern Munich', away: 'Dortmund', homeOdds: 1.7, drawOdds: 3.8, awayOdds: 4.5 },
        { id: 4, home: 'PSG', away: 'Lyon', homeOdds: 1.5, drawOdds: 4.0, awayOdds: 5.5 },
        { id: 5, home: 'Juventus', away: 'AC Milan', homeOdds: 2.0, drawOdds: 3.3, awayOdds: 3.7 }
    ];

    const container = document.getElementById('sports-matches');
    container.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-info">
                <div class="match-title">${match.home} vs ${match.away}</div>
                <div class="match-time">Today 20:00</div>
            </div>
            <div class="odds-display">
                <button class="odd-button" data-match="${match.id}" data-type="home" data-odds="${match.homeOdds}">${match.home} ${match.homeOdds}</button>
                <button class="odd-button" data-match="${match.id}" data-type="draw" data-odds="${match.drawOdds}">Draw ${match.drawOdds}</button>
                <button class="odd-button" data-match="${match.id}" data-type="away" data-odds="${match.awayOdds}">${match.away} ${match.awayOdds}</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.odd-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const matchId = btn.dataset.match;
            const type = btn.dataset.type;
            const odds = parseFloat(btn.dataset.odds);
            const matchCard = btn.closest('.match-card');
            const matchTitle = matchCard.querySelector('.match-title').textContent;

            const existing = state.selectedBets.find(b => b.matchId === matchId);
            if (existing) {
                state.selectedBets = state.selectedBets.filter(b => b.matchId !== matchId);
            } else {
                state.selectedBets = state.selectedBets.filter(b => b.matchId !== matchId);
                state.selectedBets.push({ matchId, type, odds, matchTitle });
            }

            updateBetSlip();
        });
    });
}

function updateBetSlip() {
    const slipItems = document.getElementById('bet-slip-items');
    slipItems.innerHTML = state.selectedBets.map((bet, i) => `
        <div class="bet-slip-item">
            <div>
                <strong>${bet.matchTitle}</strong><br>
                ${bet.type} @ ${bet.odds}
            </div>
            <button class="remove-bet" onclick="removeBet(${i})">✕</button>
        </div>
    `).join('');

    state.totalOdds = state.selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
    document.getElementById('total-odds').textContent = state.totalOdds.toFixed(2);
    updatePotentialWin();
}

function removeBet(index) {
    state.selectedBets.splice(index, 1);
    updateBetSlip();
}

function updatePotentialWin() {
    const stake = parseInt(document.getElementById('sports-stake').value) || 0;
    const potential = (stake * state.totalOdds).toFixed(2);
    document.getElementById('potential-win').textContent = potential;
}

function placeSportsBet() {
    if (!state.currentUser) return;

    if (state.selectedBets.length === 0) {
        showNotification('Please select at least one bet', 'warning');
        return;
    }

    const stake = parseInt(document.getElementById('sports-stake').value);

    if (stake > state.currentUser.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    state.currentUser.balance -= stake;
    state.currentUser.gamesPlayed = (state.currentUser.gamesPlayed || 0) + 1;
    state.currentUser.stats.sports.bets = (state.currentUser.stats.sports.bets || 0) + 1;

    const won = Math.random() < 0.45;
    let payout = 0;

    if (won) {
        payout = Math.floor(stake * state.totalOdds);
        state.currentUser.balance += payout;
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) + (payout - stake);
        state.currentUser.wins = (state.currentUser.wins || 0) + 1;
        state.currentUser.stats.sports.wins = (state.currentUser.stats.sports.wins || 0) + 1;
        state.currentUser.vipPoints = (state.currentUser.vipPoints || 0) + Math.floor(payout / 10);
        showNotification(`🎉 Your bet won! +$${payout}!`, 'success');
    } else {
        state.currentUser.totalWinnings = (state.currentUser.totalWinnings || 0) - stake;
        showNotification(`❌ Your bet lost. Better luck next time!`, 'info');
    }

    addTransaction('bet', -stake, 'Sports Betting');
    clearBets();
    updateUserDisplay();
}

function clearBets() {
    state.selectedBets = [];
    state.totalOdds = 1;
    updateBetSlip();
}

// ===== WALLET =====
function updateWalletDisplay() {
    if (!state.currentUser) return;
    document.getElementById('wallet-balance').textContent = `$${state.currentUser.balance.toFixed(2)}`;
    updateTransactionsList();
}

function updateTransactionsList() {
    if (!state.currentUser) return;
    const list = document.getElementById('transactions-list');
    const transactions = state.currentUser.transactions || [];
    
    if (transactions.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No transactions yet</p>';
        return;
    }

    list.innerHTML = transactions.slice().reverse().map(t => `
        <div class="transaction-item">
            <div>
                <div class="transaction-type">${t.type}</div>
                <div class="transaction-date">${new Date(t.date).toLocaleDateString()}</div>
            </div>
            <div class="transaction-amount ${t.type.toLowerCase()}">${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}</div>
        </div>
    `).join('');
}

function handleDeposit() {
    const amount = parseInt(document.getElementById('deposit-amount').value);
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    state.currentUser.balance += amount;
    addTransaction('deposit', amount, 'Deposit');
    document.getElementById('deposit-amount').value = '';
    updateWalletDisplay();
    updateUserDisplay();
    showNotification(`Deposit successful! +$${amount}`, 'success');
}

function handleWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value);
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    if (amount > state.currentUser.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    state.currentUser.balance -= amount;
    addTransaction('withdraw', -amount, 'Withdrawal');
    document.getElementById('withdraw-amount').value = '';
    updateWalletDisplay();
    updateUserDisplay();
    showNotification(`Withdrawal successful! -$${amount}`, 'success');
}

function addTransaction(type, amount, description) {
    if (!state.currentUser.transactions) {
        state.currentUser.transactions = [];
    }
    state.currentUser.transactions.push({
        type,
        amount,
        description,
        date: new Date()
    });
}

// ===== PROMOTIONS =====
function updatePromotionsDisplay() {
    if (!state.currentUser) return;
    document.getElementById('vip-points').textContent = state.currentUser.vipPoints || 0;
}

function claimPromotion(promo) {
    if (!state.currentUser) return;

    if (state.currentUser.claimedBonuses && state.currentUser.claimedBonuses.includes(promo)) {
        showNotification('You have already claimed this bonus', 'warning');
        return;
    }

    if (!state.currentUser.claimedBonuses) {
        state.currentUser.claimedBonuses = [];
    }

    let bonus = 0;
    let message = '';

    switch(promo) {
        case 'welcome':
            bonus = 500;
            message = 'Welcome Bonus claimed! +$500';
            break;
        case 'daily':
            bonus = 50;
            message = 'Daily Reward claimed! +$50';
            break;
        case 'referral':
            bonus = 100;
            message = 'Referral Bonus claimed! +$100';
            break;
        case 'vip':
            showNotification(`You have ${state.currentUser.vipPoints || 0} VIP Points`, 'info');
            return;
    }

    state.currentUser.balance += bonus;
    state.currentUser.claimedBonuses.push(promo);
    addTransaction('bonus', bonus, `${promo} Bonus`);
    updateUserDisplay();
    showNotification(message, 'success');
}

// ===== LEADERBOARD =====
function updateLeaderboard() {
    const allUsers = Object.values(state.users).map(user => ({
        name: user.name,
        winnings: user.totalWinnings || 0,
        games: user.gamesPlayed || 0,
        wins: user.wins || 0,
        winRate: user.gamesPlayed > 0 ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) : 0
    })).sort((a, b) => b.winnings - a.winnings);

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = allUsers.map((user, i) => {
        const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        return `
            <tr>
                <td class="${rankClass}">${medal}</td>
                <td>${user.name}</td>
                <td>$${user.winnings.toFixed(2)}</td>
                <td>${user.games}</td>
                <td>${user.winRate}%</td>
            </tr>
        `;
    }).join('');
}

// ===== ADMIN PANEL =====
function updateAdminPanel() {
    if (!state.currentUser || state.currentUser.name !== 'admin') {
        showNotification('Access denied', 'error');
        return;
    }

    const allUsers = Object.values(state.users);
    const totalBets = allUsers.reduce((sum, u) => sum + (u.gamesPlayed || 0), 0);
    const totalWinnings = allUsers.reduce((sum, u) => sum + (u.totalWinnings || 0), 0);
    const platformBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);

    document.getElementById('admin-total-users').textContent = allUsers.length;
    document.getElementById('admin-total-bets').textContent = totalBets;
    document.getElementById('admin-total-winnings').textContent = `$${totalWinnings.toFixed(2)}`;
    document.getElementById('admin-platform-balance').textContent = `$${platformBalance.toFixed(2)}`;

    const usersList = document.getElementById('admin-users-list');
    usersList.innerHTML = allUsers.map((user, i) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.phone}</td>
            <td>$${user.balance.toFixed(2)}</td>
            <td>
                <button onclick="editUserBalance('${user.id}')" style="padding: 6px 12px; background: var(--primary); border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: 600;">Edit</button>
            </td>
        </tr>
    `).join('');

    const allTransactions = [];
    allUsers.forEach(user => {
        (user.transactions || []).forEach(t => {
            allTransactions.push({
                user: user.name,
                ...t
            });
        });
    });

    const transactionsList = document.getElementById('admin-transactions-list');
    transactionsList.innerHTML = allTransactions.slice().reverse().slice(0, 50).map(t => `
        <tr>
            <td>${t.user}</td>
            <td>${t.type}</td>
            <td>$${Math.abs(t.amount).toFixed(2)}</td>
            <td>${new Date(t.date).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function editUserBalance(userId) {
    const user = state.users[userId];
    const newBalance = prompt(`Edit balance for ${user.name} (Current: $${user.balance}):`, user.balance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        user.balance = parseFloat(newBalance);
        updateAdminPanel();
        showNotification('Balance updated', 'success');
    }
}

// Make functions globally accessible
window.editUserBalance = editUserBalance;
window.removeBet = removeBet;
