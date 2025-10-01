// 게임 설정 변수
let gameSettings = {
    maxAttempts: 10,
    numberLength: 4,
    allowDuplicates: false,
    timeLimit: 60,
    unlimitedAttempts: false,
    unlimitedTime: true
};

// 게임 상태 변수
let answer = []; // 정답 숫자 배열
let attempts = 0; // 시도 횟수
let gameOver = false; // 게임 종료 여부
let timeRemaining = 0; // 남은 시간
let timer = null; // 타이머 객체

// DOM 요소
const form = document.getElementById('form');
const input = document.getElementById('input');
const logs = document.getElementById('logs');
const attemptsNumber = document.getElementById('attempts-number');

// 설정 관련 DOM 요소
const applySettings = document.getElementById('apply-settings');

// 시도 횟수 업데이트 함수
function updateAttemptsDisplay() {
    if (gameSettings.unlimitedAttempts) {
        attemptsNumber.textContent = '무한';
        attemptsNumber.classList.remove('warning', 'danger');
        return;
    }
    
    const remaining = gameSettings.maxAttempts - attempts;
    attemptsNumber.textContent = remaining;
    
    // 남은 기회에 따라 색상과 애니메이션 변경
    attemptsNumber.classList.remove('warning', 'danger');
    
    if (remaining <= 3 && remaining > 1) {
        attemptsNumber.classList.add('warning');
    } else if (remaining <= 1) {
        attemptsNumber.classList.add('danger');
    }
}

// 타이머 관련 함수
function createTimerDisplay() {
    if (!gameSettings.unlimitedTime) {
        const timerDiv = document.createElement('div');
        timerDiv.id = 'timer-display';
        timerDiv.className = 'timer-display';
        document.body.appendChild(timerDiv);
        updateTimerDisplay();
        timerDiv.style.display = 'block';
    }
}

function updateTimerDisplay() {
    const timerDiv = document.getElementById('timer-display');
    if (!timerDiv || gameSettings.unlimitedTime) return;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDiv.textContent = `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // 시간에 따른 경고 표시
    timerDiv.classList.remove('warning', 'danger');
    if (timeRemaining <= 30 && timeRemaining > 10) {
        timerDiv.classList.add('warning');
    } else if (timeRemaining <= 10) {
        timerDiv.classList.add('danger');
    }
}

function startTimer() {
    if (gameSettings.unlimitedTime) return;
    
    timeRemaining = gameSettings.timeLimit;
    createTimerDisplay();
    
    timer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    const timerDiv = document.getElementById('timer-display');
    if (timerDiv) {
        timerDiv.remove();
    }
}

function handleTimeUp() {
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry game-over';
    logDiv.innerHTML = `<strong>시간 초과! ⏰<br>정답: ${answer.join('')}</strong>`;
    logs.appendChild(logDiv);
    
    gameOver = true;
    input.disabled = true;
    stopTimer();
    showRestartButton();
}

// 게임 시작 함수
function startGame() {
    // 설정에 따라 숫자 생성
    const numbers = new Set();
    const maxDigit = gameSettings.allowDuplicates ? 10 : 9; // 0 포함 여부
    const startDigit = gameSettings.allowDuplicates ? 0 : 1; // 시작 숫자
    
    if (gameSettings.allowDuplicates) {
        // 중복 허용 시
        answer = [];
        for (let i = 0; i < gameSettings.numberLength; i++) {
            answer.push(Math.floor(Math.random() * 10));
        }
    } else {
        // 중복 불허 시
        while (numbers.size < gameSettings.numberLength) {
            const randomNum = Math.floor(Math.random() * 9) + 1; // 1-9만 사용
            numbers.add(randomNum);
        }
        answer = Array.from(numbers);
    }
    
    // 게임 상태 초기화
    attempts = 0;
    gameOver = false;
    logs.innerHTML = '';
    input.disabled = false;
    input.maxLength = gameSettings.numberLength;
    input.placeholder = `${gameSettings.numberLength}자리 숫자 입력`;
    input.focus();
    
    // 시도 횟수 표시 업데이트
    updateAttemptsDisplay();
    
    // 타이머 시작
    stopTimer(); // 기존 타이머 정리
    startTimer();
    
    console.log('정답:', answer); // 개발용 (실제로는 제거)
}

// 애니메이션 트리거 함수들
function triggerInputShake() {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
}

function triggerInputSuccess() {
    input.classList.add('success');
    setTimeout(() => input.classList.remove('success'), 800);
}

// 입력 검증 함수
function validateInput(inputValue) {
    // 설정된 길이와 일치하는지 확인
    if (inputValue.length !== gameSettings.numberLength) {
        triggerInputShake();
        return { valid: false, message: `${gameSettings.numberLength}자리 숫자를 입력해주세요!` };
    }
    
    // 숫자만 포함하는지 확인
    if (!/^\d+$/.test(inputValue)) {
        triggerInputShake();
        return { valid: false, message: '숫자만 입력해주세요!' };
    }
    
    // 중복 허용 여부에 따른 검증
    if (!gameSettings.allowDuplicates) {
        // 0이 포함되지 않았는지 확인 (1-9만 사용)
        if (inputValue.includes('0')) {
            triggerInputShake();
            return { valid: false, message: '1-9 숫자만 사용해주세요!' };
        }
        
        // 중복 숫자가 없는지 확인
        const uniqueDigits = new Set(inputValue);
        if (uniqueDigits.size !== gameSettings.numberLength) {
            triggerInputShake();
            return { valid: false, message: `중복되지 않는 ${gameSettings.numberLength}개의 숫자를 입력해주세요!` };
        }
    }
    
    return { valid: true };
}

// 스트라이크와 볼 계산 함수
function calculateResult(userInput) {
    const userNumbers = userInput.split('').map(Number);
    let strikes = 0;
    let balls = 0;
    
    // 스트라이크 계산 (위치와 숫자가 모두 맞음)
    for (let i = 0; i < gameSettings.numberLength; i++) {
        if (userNumbers[i] === answer[i]) {
            strikes++;
        }
    }
    
    // 볼 계산 (숫자는 맞지만 위치가 다름)
    for (let i = 0; i < gameSettings.numberLength; i++) {
        if (userNumbers[i] !== answer[i] && answer.includes(userNumbers[i])) {
            balls++;
        }
    }
    
    return { strikes, balls };
}

// 결과 표시 함수
function displayResult(userInput, strikes, balls) {
    if (strikes === gameSettings.numberLength) {
        // 홈런 - 별도 함수로 처리
        handleHomerun(userInput);
        return;
    }
    
    // 일반 결과 표시
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry';
    logDiv.innerHTML = `${userInput} : ${strikes} 스트라이크, ${balls} 볼`;
    
    logs.appendChild(logDiv);
    logs.scrollTop = logs.scrollHeight; // 스크롤을 최하단으로
    
    // 시도 횟수 업데이트
    updateAttemptsDisplay();
}

// 홈런 처리 함수
function handleHomerun(userInput) {
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry homerun';
    logDiv.innerHTML = `<strong>홈런! 🎉<br>${userInput} 정답!</strong>`;
    logs.appendChild(logDiv);
    
    gameOver = true;
    input.disabled = true;
    stopTimer();
    triggerInputSuccess();
    
    // 홈런 사운드 효과 (브라우저 지원 시)
    if (typeof Audio !== 'undefined') {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmweCSnU4v3ScA==')
            audio.play().catch(() => {}); // 오류 무시
        } catch(e) {}
    }
    
    showRestartButton();
}

// 게임 오버 처리 함수
function handleGameOver() {
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry game-over';
    logDiv.innerHTML = `<strong>아웃! 😢<br>정답: ${answer.join('')}</strong>`;
    logs.appendChild(logDiv);
    
    gameOver = true;
    input.disabled = true;
    stopTimer();
    
    // 시도 횟수 업데이트
    updateAttemptsDisplay();
    
    showRestartButton();
}

// 다시하기 버튼 표시 함수
function showRestartButton() {
    const restartBtn = document.createElement('button');
    restartBtn.textContent = '다시하기';
    restartBtn.className = 'restart-btn';
    restartBtn.onclick = () => {
        restartBtn.remove();
        startGame();
    };
    logs.appendChild(restartBtn);
}

// 폼 제출 이벤트 처리
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (gameOver) return;
    
    const userInput = input.value.trim();
    
    // 입력 검증
    const validation = validateInput(userInput);
    if (!validation.valid) {
        alert(validation.message);
        input.value = '';
        return;
    }
    
    // 시도 횟수 증가
    attempts++;
    
    // 스트라이크와 볼 계산
    const { strikes, balls } = calculateResult(userInput);
    
    // 성공적인 입력에 대한 애니메이션
    if (strikes < 4) {
        triggerInputSuccess();
    }
    
    // 결과 표시
    displayResult(userInput, strikes, balls);
    
    // 게임 종료 조건 확인
    if (strikes === gameSettings.numberLength) {
        // 홈런 - 이미 displayResult에서 처리됨
    } else if (!gameSettings.unlimitedAttempts && attempts >= gameSettings.maxAttempts) {
        // 아웃
        handleGameOver();
    }
    
    // 입력창 초기화
    input.value = '';
    input.focus();
});

// 숫자만 입력 가능하도록 제한
input.addEventListener('input', (e) => {
    if (gameSettings.allowDuplicates) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    } else {
        e.target.value = e.target.value.replace(/[^1-9]/g, '');
    }
});

// 설정 적용 이벤트
applySettings.addEventListener('click', () => {
    const confirmed = confirm('설정을 적용하면 현재 게임이 다시 시작됩니다. 계속하시겠습니까?');
    if (!confirmed) return;
    
    // 설정 값 읽어오기
    const maxAttempts = parseInt(document.getElementById('max-attempts').value) || 10;
    const numberLength = parseInt(document.getElementById('number-length').value) || 4;
    const allowDuplicates = document.getElementById('allow-duplicates').checked;
    const timeLimit = parseInt(document.getElementById('time-limit').value) || 60;
    const unlimitedAttempts = document.getElementById('unlimited-attempts').checked;
    const unlimitedTime = document.getElementById('unlimited-time').checked;
    
    // 설정 유효성 검사
    if (numberLength < 2 || numberLength > 10) {
        alert('숫자 길이는 2~10 사이여야 합니다.');
        return;
    }
    
    if (!unlimitedAttempts && (maxAttempts < 1 || maxAttempts > 999)) {
        alert('기회 횟수는 1~999 사이여야 합니다.');
        return;
    }
    
    if (!unlimitedTime && (timeLimit < 10 || timeLimit > 999)) {
        alert('시간 제한은 10~999초 사이여야 합니다.');
        return;
    }
    
    if (!allowDuplicates && numberLength > 9) {
        alert('중복 숫자를 허용하지 않으면 최대 9자리까지만 가능합니다.');
        return;
    }
    
    // 설정 적용
    gameSettings = {
        maxAttempts,
        numberLength,
        allowDuplicates,
        timeLimit,
        unlimitedAttempts,
        unlimitedTime
    };
    
    // 게임 재시작
    startGame();
    
    alert('설정이 적용되었습니다!');
});

// 무한 기회 체크박스 이벤트
document.getElementById('unlimited-attempts').addEventListener('change', (e) => {
    document.getElementById('max-attempts').disabled = e.target.checked;
});

// 무제한 시간 체크박스 이벤트
document.getElementById('unlimited-time').addEventListener('change', (e) => {
    document.getElementById('time-limit').disabled = e.target.checked;
});

// 게임 시작
startGame();