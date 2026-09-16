/**
 * tabAnimator.js
 * Creates a continuous moving / scrolling marquee ticker animation for the browser tab title
 * across all states (default "Synapse | Real-Time Messaging", unread messages, and typing),
 * plus an animated pulsing ripple badge on the favicon when unread messages exist.
 */

let baseLogo = null;
let isImageLoaded = false;
let canvas = null;

let titleInterval = null;
let faviconInterval = null;

function initCanvas() {
    if (typeof document === 'undefined') return;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
    }
    if (!baseLogo) {
        baseLogo = new Image();
        baseLogo.crossOrigin = 'anonymous';
        baseLogo.src = '/synapse-logo.png';
        baseLogo.onload = () => {
            isImageLoaded = true;
        };
    }
}

function getFaviconLink() {
    if (typeof document === 'undefined') return null;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }
    return link;
}

/**
 * Draw animated favicon with moving ripple pulse around the notification badge
 */
function drawFavicon(unreadCount, pulsePhase = 0) {
    if (!canvas || !isImageLoaded || !baseLogo) {
        if (baseLogo && !isImageLoaded) {
            baseLogo.onload = () => {
                isImageLoaded = true;
                drawFavicon(unreadCount, pulsePhase);
            };
        }
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 32, 32);

    // 1. Draw rounded base logo
    ctx.save();
    ctx.beginPath();
    const r = 6;
    ctx.moveTo(r, 0);
    ctx.lineTo(32 - r, 0);
    ctx.quadraticCurveTo(32, 0, 32, r);
    ctx.lineTo(32, 32 - r);
    ctx.quadraticCurveTo(32, 32, 32 - r, 32);
    ctx.lineTo(r, 32);
    ctx.quadraticCurveTo(0, 32, 0, 32 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseLogo, 0, 0, 32, 32);
    ctx.restore();

    // 2. Animated Moving Notification Badge on top right
    if (unreadCount > 0) {
        const badgeX = 23;
        const badgeY = 9;
        const baseRadius = unreadCount > 9 ? 8 : 7;

        // Moving pulse wave (phases 0, 1, 2, 3)
        const haloOffsets = [1, 2.5, 4.5, 2.5];
        const haloAlphas = [0.4, 0.7, 0.5, 0.3];
        const offset = haloOffsets[pulsePhase % haloOffsets.length];
        const alpha = haloAlphas[pulsePhase % haloAlphas.length];

        // Outer moving halo wave
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, baseRadius + offset, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.fill();

        // Inner badge gradient — brand purple/violet
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, baseRadius, 0, Math.PI * 2);
        const grad = ctx.createLinearGradient(badgeX - 6, badgeY - 6, badgeX + 6, badgeY + 6);
        grad.addColorStop(0, '#c084fc'); // purple-400
        grad.addColorStop(0.5, '#9333ea'); // purple-600
        grad.addColorStop(1, '#6b21a8'); // purple-800
        ctx.fillStyle = grad;
        ctx.fill();

        // White border ring for sharp contrast
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Unread count text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = unreadCount > 99 ? '99+' : `${unreadCount}`;
        ctx.fillText(text, badgeX, badgeY + 0.5);
    }

    const link = getFaviconLink();
    if (link) {
        link.href = canvas.toDataURL('image/png');
    }
}

/**
 * Start moving/scrolling ticker animation for the browser tab title
 * Handles:
 * 1. Default steady state: "Synapse | Real-Time Messaging • " (continuous moving animation)
 * 2. Unread messages state: "(9) Synapse | Real-Time Messaging • 🔔 9 New Messages! • 💬 Chat active • "
 * 3. Active typing state: "✍️ [Name] is typing... • Synapse | Real-Time Messaging • "
 */
export function updateTabAnimation({ unreadCount = 0, isTyping = false, typingName = '' } = {}) {
    if (typeof document === 'undefined') return;

    initCanvas();

    // Clear any existing intervals
    if (titleInterval) {
        clearInterval(titleInterval);
        titleInterval = null;
    }
    if (faviconInterval) {
        clearInterval(faviconInterval);
        faviconInterval = null;
    }

    let scrollText = '';
    const intervalSpeed = 220; // 220ms per character gives a smooth, readable moving ticker

    if (unreadCount > 0) {
        // MOVING MARQUEE FOR UNREAD MESSAGES
        scrollText = `(${unreadCount}) Synapse | Real-Time Messaging • 🔔 ${unreadCount} New Message${unreadCount > 1 ? 's' : ''}! • 💬 Chat active • `;

        // Moving pulse ripple on favicon badge
        let pulsePhase = 0;
        drawFavicon(unreadCount, pulsePhase);

        faviconInterval = setInterval(() => {
            pulsePhase = (pulsePhase + 1) % 4;
            drawFavicon(unreadCount, pulsePhase);
        }, 280);
    } else if (isTyping) {
        // MOVING MARQUEE FOR TYPING
        const name = typingName || 'Someone';
        scrollText = `✍️ ${name} is typing... • Synapse | Real-Time Messaging • `;

        const link = getFaviconLink();
        if (link) link.href = '/synapse-logo.png';
    } else {
        // MOVING MARQUEE FOR DEFAULT "Synapse | Real-Time Messaging"
        scrollText = `Synapse | Real-Time Messaging • `;

        const link = getFaviconLink();
        if (link) link.href = '/synapse-logo.png';
    }

    // Unicode-safe continuous marquee scroll
    const chars = Array.from(scrollText);
    let scrollPos = 0;
    document.title = scrollText;

    titleInterval = setInterval(() => {
        scrollPos = (scrollPos + 1) % chars.length;
        const movedChars = [...chars.slice(scrollPos), ...chars.slice(0, scrollPos)];
        document.title = movedChars.join('');
    }, intervalSpeed);
}

/**
 * Stop unread/typing animation and return to the continuous default moving ticker.
 */
export function stopTabAnimation() {
    if (titleInterval) {
        clearInterval(titleInterval);
        titleInterval = null;
    }
    if (faviconInterval) {
        clearInterval(faviconInterval);
        faviconInterval = null;
    }
    updateTabAnimation({ unreadCount: 0 });
}

// Auto-initialize moving animation on load
if (typeof window !== 'undefined') {
    updateTabAnimation({ unreadCount: 0 });
}
