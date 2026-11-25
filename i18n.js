/* Shared language switcher: data-i18n + localStorage + ?lang= */
(function (global) {
    var STORAGE_KEY = 'sake-lang';
    var SUPPORTED = ['zh', 'en', 'jp'];
    var HTML_LANG = { zh: 'zh-tw', en: 'en', jp: 'ja' };
    var INTERNAL_PAGES = ['index.html', 'terms.html', 'privacy.html', ''];

    function getQueryLang() {
        try {
            var q = new URLSearchParams(window.location.search).get('lang');
            return SUPPORTED.indexOf(q) !== -1 ? q : null;
        } catch (e) {
            return null;
        }
    }

    function getStoredLang() {
        try {
            var s = window.localStorage.getItem(STORAGE_KEY);
            return SUPPORTED.indexOf(s) !== -1 ? s : null;
        } catch (e) {
            return null;
        }
    }

    function preferredLang() {
        return getQueryLang() || getStoredLang() || 'zh';
    }

    function persist(lang) {
        try {
            window.localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) { /* private mode */ }
        try {
            var url = new URL(window.location.href);
            if (url.searchParams.get('lang') !== lang) {
                url.searchParams.set('lang', lang);
                window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            }
        } catch (e) { /* ignore */ }
    }

    function decorateLinks(lang) {
        var anchors = document.querySelectorAll('a[href]');
        for (var i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            var href = a.getAttribute('href');
            if (!href) continue;
            var hashIdx = href.indexOf('#');
            var hash = hashIdx === -1 ? '' : href.slice(hashIdx);
            var withoutHash = hashIdx === -1 ? href : href.slice(0, hashIdx);
            if (!withoutHash) continue; // pure in-page hash
            if (/^(https?:|mailto:|tel:|javascript:)/i.test(withoutHash)) continue;
            var path = withoutHash.split('?')[0];
            var file = path.split('/').pop();
            if (INTERNAL_PAGES.indexOf(file) === -1) continue;
            var next = (path || file) + '?lang=' + lang + hash;
            a.setAttribute('href', next);
        }
    }

    function apply(translations, lang) {
        document.documentElement.lang = HTML_LANG[lang] || 'zh-tw';

        var links = document.querySelectorAll('.nav-lang-link');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var active = link.id === 'lang-' + lang;
            if (active) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('is-active');
                link.removeAttribute('aria-current');
            }
        }

        var nodes = document.querySelectorAll('[data-i18n]');
        for (var j = 0; j < nodes.length; j++) {
            var el = nodes[j];
            var key = el.getAttribute('data-i18n');
            if (translations[lang] && Object.prototype.hasOwnProperty.call(translations[lang], key)) {
                el.innerHTML = translations[lang][key];
            }
        }

        if (translations[lang] && translations[lang]['doc-title']) {
            document.title = translations[lang]['doc-title'];
        }

        decorateLinks(lang);
    }

    function initI18n(translations) {
        function setLanguage(lang) {
            if (SUPPORTED.indexOf(lang) === -1) lang = 'zh';
            persist(lang);
            apply(translations, lang);
        }

        var links = document.querySelectorAll('.nav-lang-link');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function (e) {
                e.preventDefault();
                var lang = this.id.split('-')[1];
                setLanguage(lang);
            });
        }

        setLanguage(preferredLang());
    }

    global.initI18n = initI18n;
})(window);
