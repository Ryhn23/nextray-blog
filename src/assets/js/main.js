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

    // Re-initialize Giscus because scripts inside innerHTML don't execute automatically
    const giscusContainer = document.getElementById('giscus-container');
    if (giscusContainer) {
        const oldScript = giscusContainer.querySelector('script');
        if (oldScript) {
            const newScript = document.createElement('script');
            // Copy all attributes (src, data-repo, etc.) from template
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            oldScript.remove();
            giscusContainer.appendChild(newScript); // This triggers the browser to load it
        }
    }
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
