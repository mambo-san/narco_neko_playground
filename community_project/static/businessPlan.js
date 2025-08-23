// Language toggle with localStorage + graceful default
(function () {
    const KEY = 'businessPlan.lang';
    const $buttons = document.querySelectorAll('#lang-toggle .toggle');
    const $allLangBlocks = document.querySelectorAll('.lang-ja, .lang-en');

    function applyLang(lang) {
        // show/hide blocks
        $allLangBlocks.forEach(el => {
            const isMatch = el.classList.contains(`lang-${lang}`);
            el.style.display = isMatch ? '' : 'none';
        });
        // button states
        $buttons.forEach(btn => {
            const pressed = btn.dataset.lang === lang;
            btn.setAttribute('aria-pressed', String(pressed));
        });
        localStorage.setItem(KEY, lang);
        document.documentElement.setAttribute('lang', lang === 'ja' ? 'ja' : 'en');
    }

    function detectInitialLang() {
        const saved = localStorage.getItem(KEY);
        if (saved === 'ja' || saved === 'en') return saved;
        const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        return nav.startsWith('ja') ? 'ja' : 'en';
    }

    $buttons.forEach(btn => {
        btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });

    applyLang(detectInitialLang());
})();

// Subtle fade when toggling sections (optional enhancement)
(function () {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.btn-link');
        if (!link) return;
        // little ripple/fade hint
        const panel = link.closest('.panel');
        if (!panel || panel.dataset.animating === '1') return;
        panel.dataset.animating = '1';
        const anim = panel.animate(
            [{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 1, transform: 'translateY(0px)' }],
            { duration: 200, easing: 'ease-out' }
        );
        anim.onfinish = () => { panel.dataset.animating = ''; };
        anim.oncancel = anim.onfinish;
    }, { capture: true });
})();
