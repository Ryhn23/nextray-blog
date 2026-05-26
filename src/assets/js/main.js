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

    // Initialize custom native Cloudflare Worker comments & post reactions
    initComments();
    initPostReactions();
}

async function initPostReactions() {
    const reactionsContainer = document.getElementById('post-reactions');
    if (!reactionsContainer) return;

    const WORKER_URL = "https://nextray-comments.nextray.workers.dev"; 

    const postIdInput = document.getElementById('comment-post-id');
    if (!postIdInput) return;
    const postId = postIdInput.value;

    const buttons = reactionsContainer.querySelectorAll('.post-reaction-btn');

    // 1. Fetch current reactions
    try {
        const response = await fetch(`${WORKER_URL}/api/post/reactions?post_id=${encodeURIComponent(postId)}`);
        if (!response.ok) throw new Error('Failed to fetch post reactions');
        const reactions = await response.json();

        // Update UI counts
        buttons.forEach(btn => {
            const emoji = btn.getAttribute('data-emoji');
            const countSpan = btn.querySelector('.reaction-count');
            const count = reactions[emoji] || 0;
            countSpan.innerText = count;

            // Highlight if already reacted in localStorage
            const hasReacted = localStorage.getItem(`post_reacted_${postId}_${emoji}`) === 'true';
            if (hasReacted) {
                btn.classList.add('active');
            }
        });
    } catch (err) {
        console.error(err);
    }

    // 2. Handle reaction clicks
    buttons.forEach(btn => {
        btn.onclick = async () => {
            const emoji = btn.getAttribute('data-emoji');
            const hasReacted = localStorage.getItem(`post_reacted_${postId}_${emoji}`) === 'true';
            const countSpan = btn.querySelector('.reaction-count');
            const currentCount = parseInt(countSpan.innerText);
            
            let action = "react";
            if (hasReacted) {
                action = "unreact";
                countSpan.innerText = Math.max(0, currentCount - 1);
                btn.classList.remove('active');
                localStorage.setItem(`post_reacted_${postId}_${emoji}`, 'false');
            } else {
                action = "react";
                countSpan.innerText = currentCount + 1;
                btn.classList.add('active');
                localStorage.setItem(`post_reacted_${postId}_${emoji}`, 'true');
                
                // Float emoji effect for a beautiful visual touch!
                createFloatingEmoji(emoji, btn);
            }

            try {
                await fetch(`${WORKER_URL}/api/post/react`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        post_id: postId,
                        emoji: emoji,
                        action: action
                    })
                });
            } catch (err) {
                console.error('Failed to save post reaction', err);
            }
        };
    });

    // Helper to create a cute floating emoji effect
    function createFloatingEmoji(emoji, targetBtn) {
        const floatEl = document.createElement('span');
        floatEl.innerText = emoji;
        floatEl.style.position = 'absolute';
        floatEl.style.fontSize = '1.5rem';
        floatEl.style.pointerEvents = 'none';
        floatEl.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        floatEl.style.opacity = '1';
        floatEl.style.zIndex = '999';
        
        // Position relative to button
        const rect = targetBtn.getBoundingClientRect();
        floatEl.style.left = `${window.scrollX + rect.left + rect.width / 2 - 10}px`;
        floatEl.style.top = `${window.scrollY + rect.top - 10}px`;

        document.body.appendChild(floatEl);

        // Animate up and fade out
        setTimeout(() => {
            floatEl.style.transform = `translateY(-60px) scale(1.4) rotate(${Math.random() * 40 - 20}deg)`;
            floatEl.style.opacity = '0';
        }, 10);

        // Remove after animation completes
        setTimeout(() => {
            floatEl.remove();
        }, 800);
    }
}

async function initComments() {
    const commentsContainer = document.getElementById('comments-container');
    const commentForm = document.getElementById('comment-form');
    if (!commentsContainer || !commentForm) return;

    const WORKER_URL = "https://nextray-comments.nextray.workers.dev"; 

    const postIdInput = document.getElementById('comment-post-id');
    if (!postIdInput) return;
    const postId = postIdInput.value;

    const parentIdInput = document.getElementById('comment-parent-id');
    const replyIndicator = document.getElementById('reply-indicator');
    const replyTargetAuthor = document.getElementById('reply-target-author');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');

    const nicknameInput = document.getElementById('comment-nickname');
    const messageInput = document.getElementById('comment-message');
    const submitBtn = document.getElementById('comment-submit-btn');

    // Helper to format date
    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', {
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

    // Cancel reply handler
    if (cancelReplyBtn) {
        cancelReplyBtn.onclick = () => {
            parentIdInput.value = '';
            replyIndicator.style.display = 'none';
        };
    }

    // Render helper for single comment card
    const createCommentCard = (comment, isReply = false) => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        card.id = `comment-${comment.id}`;

        if (!comment.reactions) {
            comment.reactions = { "👍": 0, "❤️": 0, "🔥": 0, "😂": 0, "😢": 0, "🗿": 0 };
        }

        card.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">
                    ${escapeHTML(comment.nickname)}
                    ${comment.isAuthor ? `<span class="author-badge">Author</span>` : ''}
                </span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <div class="comment-body">${escapeHTML(comment.message)}</div>
            <div class="comment-actions">
                <div class="comment-action-buttons">
                    <button type="button" class="comment-reply-btn" data-id="${comment.id}" data-author="${comment.nickname}" data-parent="${comment.parentId || comment.id}">
                        Reply
                    </button>
                    <div class="reaction-picker-container">
                        <button type="button" class="comment-react-trigger-btn">＋ Reaction</button>
                        <div class="emoji-picker-popover" style="display: none;">
                            <button type="button" class="picker-emoji-btn" data-emoji="👍">👍</button>
                            <button type="button" class="picker-emoji-btn" data-emoji="❤️">❤️</button>
                            <button type="button" class="picker-emoji-btn" data-emoji="🔥">🔥</button>
                            <button type="button" class="picker-emoji-btn" data-emoji="😂">😂</button>
                            <button type="button" class="picker-emoji-btn" data-emoji="😢">😢</button>
                            <button type="button" class="picker-emoji-btn" data-emoji="🗿">🗿</button>
                        </div>
                    </div>
                </div>
                <div class="comment-active-reactions"></div>
            </div>
        `;

        // Render Slack/GitHub style reaction badges
        const renderActiveReactions = () => {
            const activeContainer = card.querySelector('.comment-active-reactions');
            if (!activeContainer) return;
            activeContainer.innerHTML = '';

            const emojis = ["👍", "❤️", "🔥", "😂", "😢", "🗿"];
            emojis.forEach(emoji => {
                const count = comment.reactions[emoji] || 0;
                const hasReacted = localStorage.getItem(`reacted_${comment.id}_${emoji}`) === 'true';

                if (count > 0 || hasReacted) {
                    const badge = document.createElement('button');
                    badge.type = 'button';
                    badge.className = `active-reaction-badge ${hasReacted ? 'active' : ''}`;
                    badge.innerHTML = `<span>${emoji}</span> <span class="badge-count">${count}</span>`;
                    
                    badge.onclick = async () => {
                        let action = hasReacted ? "unreact" : "react";
                        const newCount = hasReacted ? Math.max(0, count - 1) : count + 1;
                        
                        localStorage.setItem(`reacted_${comment.id}_${emoji}`, hasReacted ? 'false' : 'true');
                        comment.reactions[emoji] = newCount;
                        renderActiveReactions();

                        try {
                            await fetch(`${WORKER_URL}/api/comments/react`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    post_id: postId,
                                    comment_id: comment.id,
                                    emoji: emoji,
                                    action: action
                                })
                            });
                        } catch (err) {
                            console.error('Failed to toggle reaction', err);
                        }
                    };
                    
                    activeContainer.appendChild(badge);
                }
            });
        };

        // Initialize active reactions rendering
        renderActiveReactions();

        // Bind reply click inside this card
        const replyBtn = card.querySelector('.comment-reply-btn');
        replyBtn.onclick = () => {
            const parentId = replyBtn.getAttribute('data-parent');
            const author = replyBtn.getAttribute('data-author');
            
            parentIdInput.value = parentId;
            replyTargetAuthor.innerText = `@${author}`;
            replyIndicator.style.display = 'flex';
            
            // Prefill reply text with mention if it's a sub-reply
            if (comment.parentId) {
                messageInput.value = `@${author} `;
            }
            
            commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageInput.focus();
        };

        // Popover Emoji Picker Handlers
        const triggerBtn = card.querySelector('.comment-react-trigger-btn');
        const popover = card.querySelector('.emoji-picker-popover');

        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            // Close other open popovers first
            document.querySelectorAll('.emoji-picker-popover').forEach(p => {
                if (p !== popover) p.style.display = 'none';
            });
            popover.style.display = popover.style.display === 'none' ? 'flex' : 'none';
        };

        // Close popover when clicking anywhere else
        document.addEventListener('click', () => {
            popover.style.display = 'none';
        });

        // Prevent clicking popover content from closing it
        popover.onclick = (e) => e.stopPropagation();

        // Handle emoji selection from picker
        const pickerButtons = card.querySelectorAll('.picker-emoji-btn');
        pickerButtons.forEach(pickerBtn => {
            pickerBtn.onclick = async () => {
                const emoji = pickerBtn.getAttribute('data-emoji');
                const hasReacted = localStorage.getItem(`reacted_${comment.id}_${emoji}`) === 'true';
                
                let action = hasReacted ? "unreact" : "react";
                const currentCount = comment.reactions[emoji] || 0;
                const newCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;
                
                localStorage.setItem(`reacted_${comment.id}_${emoji}`, hasReacted ? 'false' : 'true');
                comment.reactions[emoji] = newCount;
                
                renderActiveReactions();
                popover.style.display = 'none';

                try {
                    await fetch(`${WORKER_URL}/api/comments/react`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            post_id: postId,
                            comment_id: comment.id,
                            emoji: emoji,
                            action: action
                        })
                    });
                } catch (err) {
                    console.error('Failed to send reaction from picker', err);
                }
            };
        });

        return card;
    };

    // 1. Fetch and render comments tree
    try {
        commentsContainer.innerHTML = '<div class="loading-comments">Loading comments...</div>';
        const response = await fetch(`${WORKER_URL}/api/comments?post_id=${encodeURIComponent(postId)}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const comments = await response.json();

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        } else {
            commentsContainer.innerHTML = '';
            
            // Group comments by hierarchy
            const roots = [];
            const repliesMap = {};

            comments.forEach(comment => {
                if (!comment.parentId) {
                    roots.push(comment);
                } else {
                    if (!repliesMap[comment.parentId]) {
                        repliesMap[comment.parentId] = [];
                    }
                    repliesMap[comment.parentId].push(comment);
                }
            });

            // Render roots and their replies
            roots.forEach(root => {
                const rootCard = createCommentCard(root);
                commentsContainer.appendChild(rootCard);

                // Render nested replies container if replies exist
                const replies = repliesMap[root.id] || [];
                if (replies.length > 0) {
                    const repliesWrapper = document.createElement('div');
                    repliesWrapper.className = 'comment-replies';
                    replies.forEach(reply => {
                        const replyCard = createCommentCard(reply, true);
                        repliesWrapper.appendChild(replyCard);
                    });
                    commentsContainer.appendChild(repliesWrapper);
                }
            });
        }
    } catch (err) {
        console.error(err);
        commentsContainer.innerHTML = '<div class="no-comments" style="color: #ff6b6b;">Failed to load comments. Make sure the Worker URL is set up correctly.</div>';
    }

    // 2. Handle Submit Comment / Reply
    commentForm.onsubmit = async (e) => {
        e.preventDefault();

        const nickname = nicknameInput.value.trim();
        const message = messageInput.value.trim();
        const parentId = parentIdInput.value;

        if (!nickname || !message) return;

        submitBtn.disabled = true;
        submitBtn.innerText = 'Posting...';

        try {
            const response = await fetch(`${WORKER_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_id: postId,
                    nickname: nickname,
                    message: message,
                    parent_id: parentId || null
                })
            });

            if (!response.ok) throw new Error('Failed to post comment');
            const newComment = await response.json();

            // Reset form
            messageInput.value = '';
            parentIdInput.value = '';
            replyIndicator.style.display = 'none';

            // Remove "no comments" message if present
            const noCommentsEl = commentsContainer.querySelector('.no-comments');
            if (noCommentsEl) {
                commentsContainer.innerHTML = '';
            }

            const newCard = createCommentCard(newComment, !!parentId);
            newCard.style.opacity = '0';
            newCard.style.transform = 'translateY(10px)';
            newCard.style.transition = 'all 0.3s ease';

            if (parentId) {
                // Find or create nested replies wrapper under parent card
                const parentCard = document.getElementById(`comment-${parentId}`);
                if (parentCard) {
                    let repliesWrapper = parentCard.nextElementSibling;
                    if (!repliesWrapper || !repliesWrapper.classList.contains('comment-replies')) {
                        repliesWrapper = document.createElement('div');
                        repliesWrapper.className = 'comment-replies';
                        parentCard.parentNode.insertBefore(repliesWrapper, parentCard.nextSibling);
                    }
                    repliesWrapper.appendChild(newCard);
                } else {
                    commentsContainer.appendChild(newCard);
                }
            } else {
                commentsContainer.appendChild(newCard);
            }

            // Smooth reveal
            setTimeout(() => {
                newCard.style.opacity = '1';
                newCard.style.transform = 'translateY(0)';
            }, 50);

        } catch (err) {
            console.error(err);
            alert('Failed to post comment. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Post Comment';
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
