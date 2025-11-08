class SpeechService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isEnabled = localStorage.getItem('speechEnabled') === 'true';
        this.currentUtterance = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.userInteractionRequired = false;
        
        if (!('speechSynthesis' in window)) {
            console.warn('Speech Synthesis API not supported in this browser');
            this.supported = false;
        } else {
            this.supported = true;

            if (this.isMobile) {
                this.userInteractionRequired = true;

                this.initializeMobileVoices();
            }
        }
    }

    initializeMobileVoices() {
        try {

            const voices = this.synth.getVoices();
            if (voices.length === 0) {

                if (speechSynthesis.onvoiceschanged !== undefined) {
                    speechSynthesis.onvoiceschanged = () => {
                        console.log('Voices loaded:', this.synth.getVoices().length);
                    };
                }
            }
        } catch (error) {
            console.warn('Error initializing mobile voices:', error);
        }
    }

    testSpeech() {
        if (!this.isSupported()) {
            console.warn('Speech not supported');
            return false;
        }

        try {

            const testUtterance = new SpeechSynthesisUtterance('Test');
            testUtterance.volume = 1.0;
            testUtterance.rate = 1.0;
            
            let testSuccess = false;
            
            testUtterance.onstart = () => {
                console.log('✓ Speech test started - working!');
                testSuccess = true;
                this.userInteractionRequired = false;
            };
            
            testUtterance.onend = () => {
                console.log('✓ Speech test completed successfully');
                if (this.isMobile) {
                    this.showSpeechError('Speech is working! You can now use menu items.');
                }
            };
            
            testUtterance.onerror = (error) => {
                console.warn('✗ Speech test failed:', error);
                if (this.isMobile) {
                    this.showSpeechError('Speech test failed. Check device volume and try clicking a menu item.');
                }
            };
            
            console.log('Testing speech...');
            this.synth.speak(testUtterance);
            
            setTimeout(() => {
                const voices = this.synth.getVoices();
                console.log('Available voices:', voices.length);
                if (voices.length > 0) {
                    console.log('Sample voices:', voices.slice(0, 3).map(v => v.name));
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Speech test exception:', error);
            this.showSpeechError('Speech test error - may not be supported');
            return false;
        }
    }

    isSupported() {
        return this.supported;
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        localStorage.setItem('speechEnabled', enabled);
        
        if (!enabled) {
            this.stop();
        }
    }

    toggle() {
        this.setEnabled(!this.isEnabled);
        
        if (this.isEnabled && this.isMobile && this.userInteractionRequired) {

            setTimeout(() => {
                this.testSpeech();
            }, 100);
        }
        
        return this.isEnabled;
    }

    stop() {
        if (this.currentUtterance) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
    }

    speak(text, options = {}) {
        if (!this.isSupported() || !this.isEnabled || !text) {
            console.log('Speech blocked:', {
                supported: this.isSupported(),
                enabled: this.isEnabled,
                hasText: !!text
            });
            return;
        }

        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume !== undefined ? options.volume : (this.isMobile ? 1.0 : 1.0);

        if (options.voice) {
            utterance.voice = options.voice;
        } else {

            let voices = this.synth.getVoices();
            
            if (voices.length === 0) {
                console.log('No voices available, waiting...');

                let retries = 0;
                const trySpeak = () => {
                    voices = this.synth.getVoices();
                    if (voices.length > 0 || retries >= 5) {
                        if (voices.length > 0) {
                            const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                            if (englishVoice) {
                                utterance.voice = englishVoice;
                            }
                        }

                        if (voices.length > 0 || retries >= 5) {
                            console.log('Speaking with', voices.length, 'voices available');
                            this.synth.speak(utterance);
                        }
                    } else {
                        retries++;
                        setTimeout(trySpeak, 100);
                    }
                };
                trySpeak();
                return;
            }
            
            const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
            console.log('Using voice:', englishVoice ? englishVoice.name : 'default', 'from', voices.length, 'voices');
        }

        this.currentUtterance = utterance;

        utterance.onstart = () => {
            console.log('Speech started');
            this.userInteractionRequired = false;
        };

        utterance.onend = () => {
            console.log('Speech ended');
            this.currentUtterance = null;
            this.userInteractionRequired = false;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', {
                error: event.error,
                type: event.type,
                charIndex: event.charIndex,
                char: event.char,
                utterance: utterance.text
            });
            this.currentUtterance = null;
            
            if (event.error === 'not-allowed') {
                console.warn('Speech not allowed - user interaction required');
                this.userInteractionRequired = true;
                if (this.isMobile) {

                    this.showSpeechError('Please tap a menu item to activate speech');
                }
            } else if (event.error === 'synthesis-failed') {
                console.warn('Speech synthesis failed - may need voices installed');
                if (this.isMobile) {
                    this.showSpeechError('Speech may not be supported on this device');
                }
            }
        };

        try {
            console.log('Attempting to speak:', text.substring(0, 50));
            this.synth.speak(utterance);
        } catch (error) {
            console.error('Exception during speak:', error);

            if (this.isMobile) {
                setTimeout(() => {
                    try {
                        console.log('Retrying speech...');
                        this.synth.speak(utterance);
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                        this.showSpeechError('Speech failed - check device volume');
                    }
                }, 300);
            }
        }
    }

    showSpeechError(message) {

        const existing = document.getElementById('speech-error-msg');
        if (existing) {
            existing.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.id = 'speech-error-msg';
        errorDiv.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #FF5722;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 90%;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 4000);
    }

    announceOrderConfirmation(orderDetails) {
        if (!this.isSupported() || !this.isEnabled) {
            return;
        }

        const trackingNumber = orderDetails.trackingNumber || '';
        const total = orderDetails.total || 0;
        const itemCount = orderDetails.items ? orderDetails.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        const message = `Order placed successfully. Your tracking number is ${trackingNumber}. Total amount is ${total} pesos. Thank you for your order.`;
        
        this.speak(message, { rate: 0.9 });
    }

    announceItemAdded(itemName) {
        if (!this.isSupported() || !this.isEnabled) {
            return;
        }

        const message = `${itemName} added to cart`;
        this.speak(message, { rate: 1.1 });
    }

    announceCartUpdate(itemCount) {
        if (!this.isSupported() || !this.isEnabled) {
            return;
        }

        const message = `Cart updated. You have ${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`;
        this.speak(message, { rate: 1.0 });
    }

    getVoices() {
        if (!this.isSupported()) {
            return [];
        }
        return this.synth.getVoices();
    }
}

const speechService = new SpeechService();

if (speechService.isSupported()) {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {

            const voices = speechSynthesis.getVoices();
            console.log('Voices loaded:', voices.length, 'Mobile:', speechService.isMobile);
        };
    }
    
    if (speechService.isMobile) {
        setTimeout(() => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                console.log('Mobile voices available:', voices.length);
            }
        }, 500);
    }
}