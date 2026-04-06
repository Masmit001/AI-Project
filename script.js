document.addEventListener('DOMContentLoaded', () => {
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const swapBtn = document.getElementById('swap-lang');
    const translateBtn = document.getElementById('translate-btn');
    const loader = document.getElementById('loader');

    // Action buttons
    const btnCopySource = document.getElementById('copy-source');
    const btnCopyTarget = document.getElementById('copy-target');
    const btnListenSource = document.getElementById('listen-source');
    const btnListenTarget = document.getElementById('listen-target');

    // Language Mapping for TTS
    // Adjusting a bit to match standard speech synthesis locales when possible
    const ttsLangMap = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh-CN': 'zh-CN',
        'hi': 'hi-IN',
        'ar': 'ar-SA'
    };

    // Swap Languages
    swapBtn.addEventListener('click', () => {
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;

        // Add a small rotation animation programmatically if CSS isn't enough
        swapBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            swapBtn.style.transition = 'none';
            swapBtn.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                swapBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 10);
        }, 300);
    });

    // Translate Logic
    const translateText = async () => {
        let text = sourceText.value.trim();
        if (!text) {
            targetText.value = '';
            return;
        }

        const sl = sourceLang.value;
        const tl = targetLang.value;
        
        loader.classList.remove('hidden');
        targetText.value = ''; // Clear target while loading

        try {
            // Unofficial Google Translate API endpoint
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // data[0] contains array of translated sentences
            let translated = '';
            if (data && data[0]) {
                data[0].forEach(segment => {
                    if (segment[0]) {
                        translated += segment[0];
                    }
                });
            }
            targetText.value = translated;
        } catch (error) {
            console.error('Translation error:', error);
            targetText.value = 'Failed to fetch translation. Please try again later.';
        } finally {
            loader.classList.add('hidden');
        }
    };

    translateBtn.addEventListener('click', translateText);

    // Auto-translate on Ctrl+Enter
    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            translateText();
        }
    });

    // Copy to clipboard
    const copyToClipboard = async (text, btnElement) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const icon = btnElement.querySelector('i');
            const originalClass = icon.className;
            
            // Visual feedback
            icon.className = 'fa-solid fa-check';
            btnElement.classList.add('active');
            
            setTimeout(() => {
                icon.className = originalClass;
                btnElement.classList.remove('active');
            }, 2000);
        } catch (err) {
            console.error('Copy failed', err);
            alert("Failed to copy text. Your browser might not support this feature.");
        }
    };

    btnCopySource.addEventListener('click', () => copyToClipboard(sourceText.value, btnCopySource));
    btnCopyTarget.addEventListener('click', () => copyToClipboard(targetText.value, btnCopyTarget));

    // Text to Speech
    const speakText = (text, lang, btnElement) => {
        if (!text) return;
        
        if (!('speechSynthesis' in window)) {
            alert('Sorry, your browser does not support text to speech.');
            return;
        }

        const synth = window.speechSynthesis;
        
        // Cancel any currently speaking text to restart
        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        // Map the selected language to an appropriate speech synthesis locale
        utterance.lang = ttsLangMap[lang] || lang; 
        
        // You can tweak pitch and rate here if desired
        utterance.pitch = 1;
        utterance.rate = 1;

        const icon = btnElement.querySelector('i');

        utterance.onstart = () => {
            btnElement.classList.add('active');
            // Change icon to indicate speaking (e.g. from volume-high to something else if desired)
            icon.style.transform = 'scale(1.2)';
        };

        utterance.onend = () => {
            btnElement.classList.remove('active');
            icon.style.transform = 'scale(1)';
        };

        utterance.onerror = () => {
            console.error('SpeechSynthesis error');
            btnElement.classList.remove('active');
            icon.style.transform = 'scale(1)';
        };

        synth.speak(utterance);
    };

    btnListenSource.addEventListener('click', () => speakText(sourceText.value, sourceLang.value, btnListenSource));
    btnListenTarget.addEventListener('click', () => speakText(targetText.value, targetLang.value, btnListenTarget));
});
