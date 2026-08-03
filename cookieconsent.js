// check and set up cookie consent
(function() {
    var cookieProp = 'accept_cookies';
    var cookieWidgetAppearDelay = 5000;

    if (window.localStorage.getItem(cookieProp) === '1') {
        onCookiesAccepted()
        return;
    }

    // var pathname = window.location.pathname
    // if (!pathname || !pathname.startsWith('/sign')) {
    //   return;
    // }

    var cookiebox = document.createElement('div');
    cookiebox.className = 'cookie-box';
    cookiebox.setAttribute('role', 'dialog');
    cookiebox.setAttribute('aria-modal', 'false');
    cookiebox.setAttribute('aria-live', 'polite');
    cookiebox.setAttribute('aria-labelledby', 'cookie-consent-title');
    cookiebox.setAttribute('aria-describedby', 'cookie-consent-desc cookie-consent-more');
    cookiebox.innerHTML =
        '<div class="message-wrap"><h2 id="cookie-consent-title">Cookies on Livepush</h2><p id="cookie-consent-desc">We use cookies and browser storage to keep you signed in, remember preferences, and understand site performance.</p><p id="cookie-consent-more">Read our <a href="/privacypolicy/index.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a> for details.</p></div>';

    var actionswrap = document.createElement('div');
    actionswrap.className = 'actions-wrap';

    var consentbtn = document.createElement('button');
    consentbtn.type = 'button';
    consentbtn.textContent = 'Accept cookies';
    consentbtn.onclick = onCookiesAccepted;
    actionswrap.appendChild(consentbtn);
    cookiebox.appendChild(actionswrap);
    document.body.appendChild(cookiebox);

    function onCookiesAccepted() {
        window.localStorage.setItem(cookieProp, '1');

        if (window.gtag) {
            gtag('consent', 'update', {
                'ad_user_data': 'granted',
                'analytics_storage': 'granted'
            });
        }
        hideCookieBox();
    }

    function showCookieBox() {
        if (!cookiebox) return;

        cookiebox.classList.add('visible');
    }

    function hideCookieBox() {
        if (!cookiebox) return;

        cookiebox.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(cookiebox);
        }, 1000);
    }

    setTimeout(showCookieBox, cookieWidgetAppearDelay);
})();