const CONFIG = {
    waNumber: '62895801457080',
    spamCooldownMs: 60000,
    getAutoMessage() {
        return "Halo Kak Shey,\n\nPerkenalkan, saya ingin menanyakan terkait layanan Paid Edit atau jasa penyuntingan video yang Anda sediakan.\n\nSaya tertarik menggunakan layanan editor profesional/kreator konten untuk mengubah rekaman gameplay (permainan) mentah menjadi video montage, highlight, atau konten media sosial yang lebih menarik dan estetis.\n\nMohon informasi lebih lanjut mengenai detail layanan, alur pengerjaan, estimasi waktu pengerjaan, serta rate card yang berlaku.\n\nAtas waktu dan perhatian yang diberikan, saya ucapkan terima kasih.\n\nSalam hangat.";
    }
};

const SecurityManager = {
    badWordsBase: [
        'anjing', 'babi', 'monyet', 'bangsat', 'kontol', 'memek', 'jembut', 'ngentot', 
        'goblok', 'tolol', 'asu', 'dancok', 'pantek', 'perek', 'pelacur', 'lonte', 
        'bajingan', 'kampret', 'titit', 'peler', 'pepek', 'kimpet', 'bego', 'bgst', 
        'kntl', 'mmk', 'anj', 'anjg', 'jancuk', 'jancok', 'ngewe', 'entot', 'jablay',
        'kentu', 'pukimak', 'sialan', 'setan', 'iblis', 'keparat', 'ngehe', 'telek',
        'khontol', 'pantat', 'toket', 'payudara', 'bokong', 'peli', 'burung', 'itil',
        'lonte', 'lacur', 'sundal', 'maho', 'bencong', 'banci'
    ],
    compiledRegex: null,

    init() {
        this.compiledRegex = this.buildProfanityRegex();
    },

    buildProfanityRegex() {
        const substitutionMap = {
            'a': '[aA4@]',
            'b': '[bB8]',
            'c': '(?:[cCkK]|[kK][hH])',
            'd': '[dD]',
            'e': '[eE3]',
            'f': '[fF]',
            'g': '[gG69]',
            'h': '[hH]',
            'i': '[iI1!|lL]',
            'j': '[jJ]',
            'k': '(?:[kKqQ]|[kK][hH]|[qQ][hH])',
            'l': '[lL1!|iI]',
            'm': '[mM]',
            'n': '[nN]',
            'o': '[oO0]',
            'p': '[pP]',
            'q': '[qQ]',
            'r': '[rR]',
            's': '[sS5$]',
            't': '[tT7]',
            'u': '[uUvV]',
            'v': '[vVuU]',
            'w': '[wW]',
            'x': '[xX]',
            'y': '[yY]',
            'z': '[zZ2]'
        };

        const patterns = this.badWordsBase.map(word => {
            let pattern = '';
            for (let i = 0; i < word.length; i++) {
                const char = word[i].toLowerCase();
                const sub = substitutionMap[char] || `[${char.toLowerCase()}${char.toUpperCase()}]`;
                pattern += sub + '+[\\W_]*';
            }
            return pattern.replace(/[\\W_]*$/, '');
        });

        return new RegExp(`(?:^|[^a-zA-Z0-9])(?:${patterns.join('|')})(?:[^a-zA-Z0-9]|$)`, 'i');
    },

    containsProfanity(text) {
        if (!this.compiledRegex) this.init();
        const normalizedText = text.replace(/\s+/g, ' ');
        const strippedText = text.replace(/[\W_]+/g, '');
        return this.compiledRegex.test(normalizedText) || this.compiledRegex.test(strippedText);
    },

    checkSpamRateLimit() {
        const lastSubmitTime = localStorage.getItem('shey_lastSubmit');
        if (lastSubmitTime) {
            const timeElapsed = Date.now() - parseInt(lastSubmitTime, 10);
            if (timeElapsed < CONFIG.spamCooldownMs) {
                const remainingSecs = Math.ceil((CONFIG.spamCooldownMs - timeElapsed) / 1000);
                return { isSpam: true, remaining: remainingSecs };
            }
        }
        return { isSpam: false, remaining: 0 };
    },

    checkDuplicateMessage(message) {
        const lastMessage = localStorage.getItem('shey_lastMessage');
        return lastMessage && lastMessage.trim().toLowerCase() === message.trim().toLowerCase();
    },

    recordSubmission(message) {
        localStorage.setItem('shey_lastSubmit', Date.now().toString());
        localStorage.setItem('shey_lastMessage', message);
    }
};

const UIManager = {
    elements: {
        loadingOverlay: document.getElementById('loadingOverlay'),
        pageContent: document.getElementById('pageContent'),
        waAutoAction: document.getElementById('waAutoAction'),
        waCopyBtn: document.getElementById('waCopyBtn'),
        waManualForm: document.getElementById('waManualForm'),
        manualMessageArea: document.getElementById('manualMessage'),
        waSubmitBtn: document.getElementById('waSubmitBtn'),
        modal: document.getElementById('notificationModal'),
        modalBackdrop: document.getElementById('modalBackdrop'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        modalIconContainer: document.getElementById('modalIconContainer'),
        modalTitle: document.getElementById('modalTitle'),
        modalDesc: document.getElementById('modalDesc')
    },
    waGeneratedUrl: '',
    cooldownInterval: null,

    init() {
        SecurityManager.init();
        this.setWAAutoLink();
        this.bindEvents();
        this.handleInitialLoad();
        this.updateSubmitButtonState();
    },

    setWAAutoLink() {
        const rawMessage = CONFIG.getAutoMessage();
        const encodedMessage = encodeURIComponent(rawMessage);
        this.waGeneratedUrl = `https://wa.me/${CONFIG.waNumber}?text=${encodedMessage}`;
        
        this.elements.waAutoAction.setAttribute('href', this.waGeneratedUrl);
        this.elements.waAutoAction.setAttribute('target', '_blank');
        this.elements.waAutoAction.setAttribute('rel', 'noopener noreferrer');
    },

    bindEvents() {
        window.addEventListener('load', () => this.removeLoadingState());

        this.elements.waCopyBtn.addEventListener('click', (e) => this.handleCopyAction(e));
        this.elements.waManualForm.addEventListener('submit', (e) => this.handleManualFormSubmit(e));
        this.elements.manualMessageArea.addEventListener('input', () => this.handleTextInput());
        
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.modalBackdrop.addEventListener('click', () => this.closeModal());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    },

    handleInitialLoad() {
        if (document.readyState === 'complete') {
            this.removeLoadingState();
        }
    },

    removeLoadingState() {
        setTimeout(() => {
            this.elements.loadingOverlay.classList.add('hidden');
            
            setTimeout(() => {
                this.elements.pageContent.classList.add('visible');
            }, 150); 
            
            setTimeout(() => {
                this.elements.loadingOverlay.style.display = 'none';
            }, 500); 
        }, 300);
    },

    updateSubmitButtonState() {
        const rateLimit = SecurityManager.checkSpamRateLimit();
        if (rateLimit.isSpam) {
            this.elements.waSubmitBtn.disabled = true;
            this.elements.waSubmitBtn.querySelector('span').textContent = `Tunggu ${rateLimit.remaining}d`;
            
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = setInterval(() => {
                const currentLimit = SecurityManager.checkSpamRateLimit();
                if (currentLimit.isSpam) {
                    this.elements.waSubmitBtn.querySelector('span').textContent = `Tunggu ${currentLimit.remaining}d`;
                } else {
                    this.resetSubmitButton();
                }
            }, 1000);
        } else {
            this.resetSubmitButton();
        }
    },

    resetSubmitButton() {
        clearInterval(this.cooldownInterval);
        this.elements.waSubmitBtn.disabled = false;
        this.elements.waSubmitBtn.querySelector('span').textContent = 'Kirim via WhatsApp';
    },

    handleTextInput() {
        if (this.elements.manualMessageArea.classList.contains('error')) {
            this.elements.manualMessageArea.style.borderColor = '';
            this.elements.manualMessageArea.classList.remove('error');
        }
    },

    async handleCopyAction(event) {
        const button = event.currentTarget;
        const iconElement = button.querySelector('i');

        try {
            await navigator.clipboard.writeText(this.waGeneratedUrl);
            this.animateCopyButton(iconElement);
            this.showModal('success', 'Tautan Disalin', 'Tautan WhatsApp dengan pesan otomatis telah disalin ke papan klip Anda.');
        } catch (error) {
            this.showModal('error', 'Gagal Menyalin', 'Sistem gagal menyalin tautan. Silakan coba lagi.');
        }
    },

    animateCopyButton(iconElement) {
        iconElement.classList.replace('fa-regular', 'fa-solid');
        iconElement.classList.replace('fa-copy', 'fa-check');
        iconElement.style.color = 'var(--color-primary)';
        
        setTimeout(() => {
            iconElement.classList.replace('fa-solid', 'fa-regular');
            iconElement.classList.replace('fa-check', 'fa-copy');
            iconElement.style.color = '';
        }, 2000);
    },

    handleManualFormSubmit(event) {
        event.preventDefault();
        const rawMessage = this.elements.manualMessageArea.value;
        
        if (!rawMessage.trim()) {
            this.showModal('warning', 'Pesan Kosong', 'Harap tuliskan pesan Anda sebelum mengirimkannya.');
            return;
        }

        if (SecurityManager.containsProfanity(rawMessage)) {
            this.elements.manualMessageArea.style.borderColor = 'var(--color-error)';
            this.elements.manualMessageArea.classList.add('error');
            this.showModal('error', 'Pelanggaran Konten', 'Sistem mendeteksi adanya penggunaan kata-kata tidak pantas. Harap gunakan bahasa yang profesional.');
            return;
        }

        const rateLimit = SecurityManager.checkSpamRateLimit();
        if (rateLimit.isSpam) {
            this.showModal('warning', 'Aktivitas Terlalu Cepat', `Sistem mendeteksi pengiriman ganda. Silakan tunggu ${rateLimit.remaining} detik sebelum mengirim kembali.`);
            return;
        }

        if (SecurityManager.checkDuplicateMessage(rawMessage)) {
            this.showModal('warning', 'Pesan Terduplikasi', 'Pesan yang Anda kirimkan sama persis dengan pesan sebelumnya. Harap ubah isi pesan Anda.');
            return;
        }

        SecurityManager.recordSubmission(rawMessage);
        this.updateSubmitButtonState();
        
        const processedMessage = encodeURIComponent(rawMessage.trim());
        const waUrl = `https://wa.me/${CONFIG.waNumber}?text=${processedMessage}`;
        
        this.showModal('success', 'Pesan Dialihkan', 'Mengarahkan Anda ke WhatsApp untuk melanjutkan percakapan.');
        
        setTimeout(() => {
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            this.elements.waManualForm.reset();
            this.closeModal();
        }, 1500);
    },

    showModal(type, title, description) {
        const iconConfig = {
            success: '<i class="fa-solid fa-circle-check"></i>',
            warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
            error: '<i class="fa-solid fa-circle-xmark"></i>'
        };

        this.elements.modalIconContainer.className = `modal-icon-container ${type}`;
        this.elements.modalIconContainer.innerHTML = iconConfig[type];
        
        this.elements.modalTitle.textContent = title;
        this.elements.modalDesc.textContent = description;
        
        this.elements.closeModalBtn.className = `modal-btn ${type === 'success' ? '' : type}`;

        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});

document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });
});