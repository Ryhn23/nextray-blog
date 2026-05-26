document.addEventListener('DOMContentLoaded', () => {
    initAudioPlayer();
    initPageContent();
    initPjax();
});

function initAudioPlayer() {
    // Only init once
    if (window.audioPlayerInitialized) return;
    window.audioPlayerInitialized = true;

    const audio = document.getElementById('bg-audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('audio-progress');
    const volumeSlider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('mute-btn');
    const volWaves = document.querySelectorAll('.vol-waves');
    const volMuteLine = document.querySelector('.vol-mute');

    if (volumeSlider) {
        audio.volume = volumeSlider.value;

        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            if (audio.volume == 0) {
                volWaves.forEach(w => w.style.display = 'none');
                volMuteLine.style.display = 'block';
            } else {
                volWaves.forEach(w => w.style.display = 'block');
                volMuteLine.style.display = 'none';
            }
        });

        let previousVolume = audio.volume;
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.volume > 0) {
                previousVolume = audio.volume;
                audio.volume = 0;
                volumeSlider.value = 0;
                volWaves.forEach(w => w.style.display = 'none');
                volMuteLine.style.display = 'block';
            } else {
                audio.volume = previousVolume > 0 ? previousVolume : 0.5;
                volumeSlider.value = audio.volume;
                volWaves.forEach(w => w.style.display = 'block');
                volMuteLine.style.display = 'none';
            }
        });
    }

    // Setup play/pause icon toggle
    const playIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    const pauseIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

    let isPlaying = false;

    const tryAutoplay = async () => {
        try {
            await audio.play();
            isPlaying = true;
            playPauseBtn.innerHTML = pauseIcon;
        } catch (err) {
            document.body.addEventListener('click', initAudioOnInteract, { once: true });
        }
    };

    const initAudioOnInteract = () => {
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                playPauseBtn.innerHTML = pauseIcon;
            }).catch(e => console.error(e));
        }
    };

    tryAutoplay();

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) {
            audio.pause();
            playPauseBtn.innerHTML = playIcon;
            isPlaying = false;
        } else {
            audio.play();
            playPauseBtn.innerHTML = pauseIcon;
            isPlaying = true;
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }
    });
}

function initPageContent() {
    // View Count Simulation (Placeholder)
    const viewCountEl = document.getElementById('view-count');
    if (viewCountEl) {
        const randomViews = Math.floor(Math.random() * 1000) + 100;
        viewCountEl.textContent = randomViews.toLocaleString();
    }

    // Initialize custom native Cloudflare Worker comments
    initComments();
}

async function initComments() {
    const commentsContainer = document.getElementById('comments-container');
    const commentForm = document.getElementById('comment-form');
    if (!commentsContainer || !commentForm) return;

    // TODO: Ganti dengan URL Cloudflare Worker punyamu setelah di-deploy
    const WORKER_URL = "https://nextray-comments.nextray.workers.dev";

    const postIdInput = document.getElementById('comment-post-id');
    if (!postIdInput) return;
    const postId = postIdInput.value;

    const nicknameInput = document.getElementById('comment-nickname');
    const messageInput = document.getElementById('comment-message');
    const submitBtn = document.getElementById('comment-submit-btn');

    // Helper to format date
    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // 1. Fetch Comments from Cloudflare Worker
    try {
        commentsContainer.innerHTML = '<div class="loading-comments">Memuat komentar...</div>';
        const response = await fetch(`${WORKER_URL}/api/comments?post_id=${encodeURIComponent(postId)}`);
        if (!response.ok) throw new Error('Gagal mengambil komentar');
        const comments = await response.json();

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<div class="no-comments">Belum ada komentar. Jadilah yang pertama!</div>';
        } else {
            commentsContainer.innerHTML = '';
            comments.forEach(comment => {
                const card = document.createElement('div');
                card.className = 'comment-card';
                card.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(comment.nickname)}</span>
                        <span class="comment-date">${formatDate(comment.date)}</span>
                    </div>
                    <div class="comment-body">${escapeHTML(comment.message)}</div>
                `;
                commentsContainer.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
        commentsContainer.innerHTML = '<div class="no-comments" style="color: #ff6b6b;">Gagal memuat komentar. Pastikan Worker URL sudah di-setup dengan benar.</div>';
    }

    // 2. Handle Submit Comment
    commentForm.onsubmit = async (e) => {
        e.preventDefault();

        const nickname = nicknameInput.value.trim();
        const message = messageInput.value.trim();

        if (!nickname || !message) return;

        submitBtn.disabled = true;
        submitBtn.innerText = 'Mengirim...';

        try {
            const response = await fetch(`${WORKER_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_id: postId,
                    nickname: nickname,
                    message: message
                })
            });

            if (!response.ok) throw new Error('Gagal mengirim komentar');
            const newComment = await response.json();

            // Clear input message, but preserve nickname for convenience!
            messageInput.value = '';

            // Remove "no comments" text if it was there
            const noCommentsEl = commentsContainer.querySelector('.no-comments');
            if (noCommentsEl) {
                commentsContainer.innerHTML = '';
            }

            // Append new comment smoothly
            const card = document.createElement('div');
            card.className = 'comment-card';
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'all 0.3s ease';
            card.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${escapeHTML(newComment.nickname)}</span>
                    <span class="comment-date">${formatDate(newComment.date)}</span>
                </div>
                <div class="comment-body">${escapeHTML(newComment.message)}</div>
            `;
            commentsContainer.appendChild(card);

            // Trigger animation reflow
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);

        } catch (err) {
            console.error(err);
            alert('Gagal mengirim komentar. Silakan coba lagi.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Kirim Komentar';
        }
    };
}

function initPjax() {
    const loadPage = async (url) => {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.opacity = '0.3'; // Loading state

        try {
            const response = await fetch(url);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newMainContent = doc.querySelector('.main-content').innerHTML;
            const newTitle = doc.querySelector('title').innerText;

            mainContent.innerHTML = newMainContent;
            document.title = newTitle;

            window.history.pushState({}, newTitle, url);

            initPageContent();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('PJAX error:', err);
            window.location.href = url; // Fallback
        } finally {
            mainContent.style.opacity = '1';
        }
    };

    window.pjaxLoadPage = loadPage;

    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || link.target === '_blank' || href.startsWith('javascript:')) {
            return;
        }

        e.preventDefault();
        loadPage(href);
    });

    window.addEventListener('popstate', async () => {
        try {
            const mainContent = document.querySelector('.main-content');
            mainContent.style.opacity = '0.3';

            const response = await fetch(window.location.href);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            mainContent.innerHTML = doc.querySelector('.main-content').innerHTML;
            document.title = doc.querySelector('title').innerText;

            initPageContent();
            mainContent.style.opacity = '1';
        } catch (err) {
            window.location.reload();
        }
    });
}
