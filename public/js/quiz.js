class EndOfWordQuiz {
    constructor() {
        this.storageKey = 'endofword_progress';
        this.answersKey = 'endofword_answers';
        this.totalQuestions = 4;
        this.currentProgress = this.getProgress();
        this.userAnswers = this.getAnswers();
        this.baseUrl = window.APP_BASE_URL || '';

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.handlePageLoad();
        });
    }

    setupEventListeners() {
        // Boutons de la page d'accueil
        const startBtn = document.getElementById('startQuizBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const firstToken = startBtn.dataset.firstToken;
                this.clearProgress();
                this.clearAnswers();
                window.location.href = `${this.baseUrl}/quiz/question/1/${firstToken}`;
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                const resumeId = resumeBtn.dataset.resumeId;
                const resumeToken = resumeBtn.dataset.resumeToken;
                window.location.href = `${this.baseUrl}/quiz/question/${resumeId}/${resumeToken}`;
            });
        }

        // Formulaire des questions
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.addEventListener('submit', (e) => this.handleAnswerSubmit(e));
            
            const answerInput = document.getElementById('answerInput');
            if (answerInput) {
                answerInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        answerForm.dispatchEvent(new Event('submit'));
                    }
                });
                // Réinitialiser toujours le champ
                answerInput.value = '';
                answerInput.focus();
            }
        }

        // Bouton de révélation finale
        const revealBtn = document.getElementById('revealBtn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealFinalMessage());
        }

    }

    handlePageLoad() {
        const path = window.location.pathname;
        
        if (path.includes('/quiz/question/')) {
            this.handleQuestionPage();
        } else if (path.includes('/quiz/success')) {
            this.handleSuccessPage();
        }
    }


    handleQuestionPage() {
        const questionId = this.getQuestionIdFromUrl();
        if (questionId) {
            this.saveProgress(questionId);
            this.animateProgressBar();
        }
    }

    handleSuccessPage() {
        console.log('Handling success page...');
        this.clearProgress();
        this.addSuccessAnimations();
        this.setupFeedbackListeners();
    }


    async handleAnswerSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const answerInput = document.getElementById('answerInput');
        const errorMessage = document.getElementById('errorMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!answerInput.value.trim()) {
            this.showError('Merci d\'écrire une réponse 💫');
            return;
        }

        this.showLoading(true);
        this.hideError();
        submitBtn.disabled = true;

        try {
            const response = await fetch(this.baseUrl + '/quiz/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                const questionId = parseInt(formData.get('question_id'));
                const answer = formData.get('answer');
                
                this.saveAnswer(questionId, answer);
                
                if (result.completed) {
                    window.location.href = result.redirect;
                } else {
                    this.animateSuccessTransition(() => {
                        window.location.href = result.redirect;
                    });
                }
            } else {
                this.showError(result.message || 'Réponse incorrecte, essaie encore ! 💫');
                answerInput.value = '';
                answerInput.focus();
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Une erreur est survenue. Essaie à nouveau ! 💫');
        } finally {
            this.showLoading(false);
            submitBtn.disabled = false;
        }
    }

    revealFinalMessage() {
        const finalMessage = document.getElementById('finalMessage');
        const revealBtn = document.getElementById('revealBtn');
        
        if (finalMessage && revealBtn) {
            revealBtn.style.display = 'none';
            finalMessage.style.display = 'block';
            
            setTimeout(() => {
                finalMessage.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }

    showLoading(show) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            errorMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    animateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const currentWidth = progressFill.style.width;
            progressFill.style.width = '0%';
            
            setTimeout(() => {
                progressFill.style.width = currentWidth;
            }, 100);
        }
    }

    animateSuccessTransition(callback) {
        const container = document.querySelector('.question-page');
        if (container) {
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0.8';
            
            setTimeout(() => {
                if (callback) callback();
            }, 300);
        } else {
            if (callback) callback();
        }
    }

    addSuccessAnimations() {
        const confettis = document.querySelectorAll('.confetti');
        confettis.forEach((confetti, index) => {
            confetti.style.setProperty('--i', index);
        });

        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            heart.style.setProperty('--i', index);
        });
    }

    getProgress() {
        const progress = localStorage.getItem(this.storageKey);
        return progress ? parseInt(progress) : 0;
    }

    saveProgress(questionId) {
        localStorage.setItem(this.storageKey, questionId.toString());
        this.currentProgress = questionId;
    }

    clearProgress() {
        localStorage.removeItem(this.storageKey);
        this.currentProgress = 0;
    }

    getAnswers() {
        const answers = localStorage.getItem(this.answersKey);
        return answers ? JSON.parse(answers) : {};
    }

    saveAnswer(questionId, answer) {
        this.userAnswers[questionId] = {
            answer: answer,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(this.answersKey, JSON.stringify(this.userAnswers));
    }

    clearAnswers() {
        localStorage.removeItem(this.answersKey);
        this.userAnswers = {};
    }

    getQuestionIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/quiz\/question\/(\d+)/);
        return matches ? parseInt(matches[1]) : null;
    }

    getFormattedAnswers() {
        return Object.entries(this.userAnswers)
            .map(([questionId, data]) => `Q${questionId}: ${data.answer}`)
            .join('\n');
    }

    setupFeedbackListeners() {
        console.log('Setting up feedback listeners...');
        const feedbackPositiveBtn = document.getElementById('feedbackPositiveBtn');
        const feedbackNegativeBtn = document.getElementById('feedbackNegativeBtn');
        
        console.log('Positive button:', feedbackPositiveBtn);
        console.log('Negative button:', feedbackNegativeBtn);
        
        if (feedbackPositiveBtn) {
            feedbackPositiveBtn.addEventListener('click', (e) => {
                console.log('Positive button clicked!');
                e.preventDefault();
                this.submitFeedback('positive');
            });
        }
        
        if (feedbackNegativeBtn) {
            feedbackNegativeBtn.addEventListener('click', (e) => {
                console.log('Negative button clicked!');
                e.preventDefault();
                this.submitFeedback('negative');
            });
        }
        
        // Setup discovery buttons
        const discoverMeBtn = document.getElementById('discoverMeBtn');
        const discoverYouBtn = document.getElementById('discoverYouBtn');
        
        if (discoverMeBtn) {
            discoverMeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDiscoveryPopup('me');
            });
        }
        
        if (discoverYouBtn) {
            discoverYouBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDiscoveryPopup('you');
            });
        }

        const discoverFeelBtn = document.getElementById('discoverFeelBtn');
        if (discoverFeelBtn) {
            discoverFeelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDiscoveryPopup('feel');
            });
        }

        // Setup popup close functionality
        const popupCloseButtons = document.querySelectorAll('.popup-close');
        const popupOverlays = document.querySelectorAll('.popup-overlay');
        
        popupCloseButtons.forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const popupType = e.target.dataset.popup;
                this.hideDiscoveryPopup(popupType);
            });
        });
        
        popupOverlays.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    const popupId = overlay.id;
                    const popupType = popupId.includes('Me') ? 'me' : (popupId.includes('Feel') ? 'feel' : 'you');
                    this.hideDiscoveryPopup(popupType);
                }
            });
        });
    }

    async submitFeedback(type) {
        console.log('Submit feedback called with type:', type);
        const feedbackButtons = document.getElementById('feedbackButtons');
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        console.log('Feedback buttons element:', feedbackButtons);
        console.log('Feedback message element:', feedbackMessage);
        
        try {
            console.log('Sending feedback request...');
            const response = await fetch(this.baseUrl + '/quiz/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback: type })
            });
            
            console.log('Response received:', response.status);
            
            if (response.ok) {
                console.log('Hiding buttons and showing message...');
                feedbackButtons.style.display = 'none';
                feedbackMessage.style.display = 'block';
            } else {
                console.error('Response not ok:', response.status);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du feedback:', error);
        }
    }

    showDiscoveryPopup(type) {
        let popupId;
        if (type === 'me') popupId = 'discoveryMePopup';
        else if (type === 'feel') popupId = 'discoveryFeelPopup';
        else popupId = 'discoveryYouPopup';

        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Empêche le scroll en arrière-plan
        }
    }

    hideDiscoveryPopup(type) {
        let popupId;
        if (type === 'me') popupId = 'discoveryMePopup';
        else if (type === 'feel') popupId = 'discoveryFeelPopup';
        else popupId = 'discoveryYouPopup';

        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = ''; // Rétablit le scroll
        }
    }
}

const quiz = new EndOfWordQuiz();

document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, button, [tabindex]');
    inputs.forEach((input, index) => {
        input.style.setProperty('--tab-index', index);
    });
});

// Plus besoin de sauvegarder temporairement les réponses
// car chaque question repart avec un champ vide