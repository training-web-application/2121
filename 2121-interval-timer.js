'use strict';

const countdownInputBox = document.getElementById('two121-countdown');
const repsInputBox = document.getElementById('two121-reps');
const speedInputBox = document.getElementById('two121-speed');
const startButton = document.getElementById('two121-start');
const stopButton = document.getElementById('two121-stop');
const trainingRecords = document.getElementById('training-records');
const outputStopTime = document.getElementById('two121-stop-time');
const voiceVolume = document.getElementById('two121-voice-volume');
const soundEffectVolume = document.getElementById('two121-sound-effect-volume');
const mp3SoundEffect = document.getElementById('two121-sound-effect');
let storage;
// setInterval() の戻り値（作成したタイマーを識別する、0 ではない正の整数値）
let intervalID;
// タイマー作成前に停止したか（true: 停止した）
let stoppedBeforeTimerCreation;
// 現在のreps
let currentReps = 0;

try {
    // ローカルストレージを取得
    storage = localStorage;
    // ストレージから取得した文字列をオブジェクトとして解析
    const savedSettingValue = JSON.parse(storage.getItem('two121'));

    // 設定値が保存されている場合
    if(savedSettingValue) {
        // 保存されているCountdownの値を設定
        if(typeof savedSettingValue.countdown !== 'undefined') {
            countdownInputBox.value = savedSettingValue.countdown;
        }

        // 保存されているRepsの値を設定
        if(typeof savedSettingValue.reps !== 'undefined') {
            repsInputBox.value = savedSettingValue.reps;
        }

        // 保存されているSpeedの値を設定
        if(typeof savedSettingValue.speed !== 'undefined') {
            speedInputBox.value = savedSettingValue.speed;
        }

        // 保存されている[Voice Volume]の値を設定
        if(typeof savedSettingValue.voiceVolume !== 'undefined') {
            voiceVolume.value = savedSettingValue.voiceVolume;
        }

        // 保存されている[Sound Effect Volume]の値を設定
        if(typeof savedSettingValue.soundEffectVolume !== 'undefined') {
            soundEffectVolume.value = savedSettingValue.soundEffectVolume;
            // 音量を設定する
            mp3SoundEffect.volume = soundEffectVolume.value;
        }
    }
} catch(e) {
    // ストレージが利用できない場合、何もしない（例：Chromeで[すべての Cookie をブロックする]に設定している場合）
}

// 有効無効、テキストを設定する
const settingDisabledText = () => {
    // Startボタン有効時のテキスト
    const START_BUTTON_ENABLED_TEXT = 'Start';
    // Startボタン無効時のテキスト
    const START_BUTTON_DISABLED_TEXT = 'Now Loading...';
    
    // Startボタン無効時
    if(startButton.disabled) {
        // Countdownの入力ボックスを有効化する
        countdownInputBox.disabled = false;
        // Repsの入力ボックスを有効化する
        repsInputBox.disabled = false;
        // Speedの入力ボックスを有効化する
        speedInputBox.disabled = false;
        // Startボタンを有効化する
        startButton.disabled = false;
        // START_BUTTON_ENABLED_TEXTをStartボタンに表示する
        startButton.textContent = START_BUTTON_ENABLED_TEXT;
        // Stopボタンを無効化する
        stopButton.disabled = true;
    } else {
        countdownInputBox.disabled = true;
        repsInputBox.disabled = true;
        speedInputBox.disabled = true;
        startButton.disabled = true;
        startButton.textContent = START_BUTTON_DISABLED_TEXT;
        stopButton.disabled = false;
    }
};

// 入力値を変換する
const convertInputValue = element => {
    // 変換した整数
    const convertedInteger = parseInt(element.value);
    const maxValue = parseInt(element.max);
    const minValue = parseInt(element.min);
    if(Number.isNaN(convertedInteger)) {
        // 非数（Not A Number）の場合
        const defaultValue = parseInt(element.defaultValue);
        // ブラウザ上の表示を規定値にする
        element.value = defaultValue;
        // 戻り値を整数で返す
        return defaultValue;
    } else if(maxValue < convertedInteger) {
        // 最大値よりも大きい場合、ブラウザ上の表示を最大値にする
        element.value = maxValue;
        // 戻り値を整数で返す
        return maxValue;
    } else if(convertedInteger < minValue) {
        // 最小値よりも小さい場合、ブラウザ上の表示を最小値にする
        element.value = minValue;
        // 戻り値を整数で返す
        return minValue;
    } else {
        // その他の場合、ブラウザ上の表示を[変換した整数]にする
        element.value = convertedInteger;
        // 戻り値を整数で返す
        return convertedInteger;
    }
};

// タイマーを停止する
const stopTimer = () => {
    const nowTime = new Date();

    // タイマーが作成されていない（setInterval() が実行される前にStopボタンが押された）場合
    if(intervalID === 0) {
        stoppedBeforeTimerCreation = true;
    } else {
        // setInterval() を使用して設定された繰り返し動作のキャンセル
        clearInterval(intervalID);
    }
    // すべての発声を発声キューから削除する
    speechSynthesis.cancel();

    // オブジェクトをJSON文字列に変換＆ストレージに保存
    const settingValue = {
        countdown: countdownInputBox.value
        , reps: repsInputBox.value
        , speed: speedInputBox.value
        , voiceVolume: voiceVolume.value
        , soundEffectVolume: soundEffectVolume.value
    };
    try {
        storage.setItem('two121', JSON.stringify(settingValue));
    } catch(e) {
        // ストレージが利用できない場合、何もしない（例：Chromeで[すべての Cookie をブロックする]に設定している場合）
    }

    settingDisabledText();

    // Reps: が表示されていない（currentRepsが1になる前にStopボタンが押された）場合
    if(currentReps === 0) {
        // id="training-records"にclass="two121-div"を追加
        trainingRecords.classList.add('two121-div');
    }
    outputStopTime.textContent = `Stop Time: ${nowTime.toLocaleString()}`;
};

startButton.addEventListener('click', () => {
    const outputCurrentReps = document.getElementById('two121-current-reps');
    // setInterval() の戻り値の初期化
    intervalID = 0;
    // stoppedBeforeTimerCreationの初期化
    stoppedBeforeTimerCreation = false;
    // 現在のrepsの初期化
    currentReps = 0;
    settingDisabledText();
    // Reps: の初期化
    outputCurrentReps.textContent = '';
    // Stop Time: の初期化
    outputStopTime.textContent = '';
    // id="training-records"からclass="two121-div"を削除（class="two121-div"がない場合、何も起こらない）
    trainingRecords.classList.remove('two121-div');
    // 入力されたCountdown
    const inputCountdown = convertInputValue(countdownInputBox);
    // 入力されたCountdown + 1（入力されたCountdownが3の場合、3, 2, 1, 0の[0]に該当）
    const inputCountdownPlus0 = inputCountdown + 1;
    // 入力されたReps
    const inputReps = convertInputValue(repsInputBox);
    // 入力されたSpeed
    const inputSpeed = convertInputValue(speedInputBox);
    // 総リピート数（[入力されたCountdown + 1] + 入力されたReps * 入力されたSpeed）
    const totalRepeatCount = inputCountdownPlus0 + inputReps * inputSpeed;
    // 現在のcountdown
    let currentCountdown = inputCountdown;
    // 現在のリピート数
    let currentRepeatCount = 0;
    // 作成した音声
    let createdVoice;
    // setInterval() の時間間隔（ミリ秒）
    const TIME_INTERVAL = 1000;
    // カウントダウン開始の言葉
    const COUNTDOWN_START_WORD = 'カウントダウン';
    // 最後の1回の言葉
    const LAST_ONE_WORD = 'ラスト';

    // mp3ファイルを再生できるか（true: 再生できる）
    let supportedMp3;
    if(mp3SoundEffect.canPlayType('audio/mpeg').match(/^(probably|maybe)$/)) {
        supportedMp3 = true;
    } else {
        supportedMp3 = false;
    }

    // 音声を再生する
    const playVoice = utterance => {
        createdVoice = new SpeechSynthesisUtterance(utterance);
        // 音量を設定する
        createdVoice.volume = voiceVolume.value;
        // すべての発声を発声キューから削除する
        speechSynthesis.cancel();
        // 発声を発声キューに追加する
        // それ以前にキューに追加された他の発声が発話された後に発話される
        speechSynthesis.speak(createdVoice);
    };

    // 効果音を再生する
    const playSoundEffect = () => {
        if(supportedMp3) {
            mp3SoundEffect.pause();
            mp3SoundEffect.currentTime = 0;
            mp3SoundEffect.play();
        }
    };

    playVoice(COUNTDOWN_START_WORD);

    // [COUNTDOWN_START_WORD]の発話が完了した時に発火
    createdVoice.onend = () => {
        // 初回
        // この時点では、まだsetInterval() が実行されておらず、intervalIDは必ず0になるため、
        // intervalIDをタイマーが作成済みか否かの判断に用いることはできない
        if(stoppedBeforeTimerCreation) {
            // タイマーが作成されていない（setInterval() が実行される前にStopボタンが押された）場合
            return;
        } else {
            currentRepeatCount++;
            // 現在のcountdownをStartボタンに表示する
            startButton.textContent = currentCountdown;
            playSoundEffect();
            currentCountdown--;
        }
        const intervalTimer = () => {
            currentRepeatCount++;
            if(inputCountdown < currentRepeatCount) {
                const current21x1 = (currentRepeatCount - inputCountdownPlus0) % inputSpeed;
                if(current21x1 === 0) {
                    if(currentRepeatCount !== totalRepeatCount) {
                        // 音声用の現在のreps（currentRepsを+1する前に発言を再生するため）
                        const currentRepsForVoice = currentReps + 1;
                        if(inputReps !== currentRepsForVoice) {
                            playVoice(currentRepsForVoice);
                        } else {
                            playVoice(LAST_ONE_WORD);
                        }
                    }
                } else if(current21x1 === 1) {
                    currentReps++;
                    if(currentReps === 1) {
                        // id="training-records"にclass="two121-div"を追加
                        trainingRecords.classList.add('two121-div');
                    }
                    outputCurrentReps.textContent = `Reps: ${currentReps}`;
                }
                if(currentRepeatCount - inputCountdownPlus0 !== 0) {
                    if(current21x1 !== 0) {
                        // current21x1が0以外の場合、current21x1をStartボタンに表示する
                        startButton.textContent = current21x1;
                    } else {
                        // current21x1が0の場合、[選択されたExercise]の値をStartボタンに表示する
                        startButton.textContent = inputSpeed;
                    }
                } else {
                    // 現在のcountdownをStartボタンに表示する
                    startButton.textContent = currentCountdown;
                }
                playSoundEffect();
                if(currentRepeatCount === totalRepeatCount) {
                    stopTimer();
                }
            } else {
                // 現在のcountdownをStartボタンに表示する
                startButton.textContent = currentCountdown;
                playSoundEffect();
                currentCountdown--;
            }
        };

        // タイマーの作成
        intervalID = setInterval(() => {
            intervalTimer();
        }, TIME_INTERVAL);
    }
});

stopButton.addEventListener('click', () => {
    stopTimer();
});

soundEffectVolume.addEventListener('input', () => {
    // 音量を設定する
    mp3SoundEffect.volume = soundEffectVolume.value;
});