import $ from 'jquery';
import ScrollTrigger from '@terwanerik/scrolltrigger';
// import 'owl.carousel/dist/assets/owl.carousel.css';
// import 'owl.carousel/dist/assets/owl.theme.default.css';

window.$ = $;
window.jQuery = $;

// require('owl.carousel');
require('./smoothscroll');
require('./cookieconsent');
require('./faqs');
// require('./popups');

// Create a new ScrollTrigger instance with default options
var trigger = new ScrollTrigger();
trigger.add('[data-element-appear]');

var openIntercomChat = function(initialMessage, fallbackUrl) {
    var attempts = 0;

    var open = function() {
        if (window.Intercom) {
            if (initialMessage) {
                window.Intercom('showNewMessage', initialMessage);
            } else {
                window.Intercom('show');
            }

            return;
        }

        attempts += 1;

        if (attempts < 16) {
            setTimeout(open, 300);
            return;
        }

        if (fallbackUrl) {
            window.location.href = fallbackUrl;
        }
    };

    open();
};

window.openChat = function(initialMessage, fallbackUrl) {
    openIntercomChat(initialMessage, fallbackUrl);
};

$(document).on('click', '[data-intercom-message]', function(event) {
    event.preventDefault();
    openIntercomChat(this.getAttribute('data-intercom-message'), this.getAttribute('href'));
});

(function registerCurrentPage() {
    if (!window.Intercom) {
        setTimeout(registerCurrentPage, 1000);
        return
    }

    window.Intercom('trackEvent', 'visited_page', {
        page: window.location.href
    });
})();

// navbar essentials
(function() {
    $('#navbarNav').on('click', 'a', function() {
        $('.navbar-toggle').click();
    });

    $('.navbar-toggler').click(function() {
        var collapsable = $(this.dataset.target);
        collapsable.toggleClass(this.dataset.toggle);
        $(this).attr('aria-expanded', !collapsable.hasClass(this.dataset.toggle));
    });

    // media query to check
    // var phoneMQ = '(max-width: 1000px) and (orientation: portrait)';
    var phoneMQ = '(max-width: 1000px)';
    var isPhoneView = window.matchMedia(phoneMQ).matches;
    if (isPhoneView) {
        $('.nav-item').on('click', function() {
            $(this).siblings().find('.dropdown-content').removeClass('visible')
            $('.dropdown-content', this).toggleClass('visible')
        })

        $('.navbar-toggler-icon-alt').on('click', function() {
            $('.nav-item .dropdown-content').removeClass('visible')
        })

    }

})();

// Header scroll
(function() {
    // $(window).scroll(function() {
    var nav = $('#navbar');
    var navbarHeight = nav.height();
    if (nav.length) {
        navbarHeight = parseFloat(window.getComputedStyle(nav[0]).height);
    }

    // var heroSectionHeight = window.innerHeight - (navbarHeight * 2)
    var heroSectionHeight = navbarHeight;

    var onNavbarScroll = function() {
        if ($(this).scrollTop() > heroSectionHeight) {
            nav.addClass('header-scrolled');
        } else {
            nav.removeClass('header-scrolled');
        }
    };

    window.addEventListener('scroll', onNavbarScroll);
    // run init
    setTimeout(onNavbarScroll, 0);
})();

// init segment plugin
var segmentLoaded = false;
var segmentHandlerDetached = false;

function initSegment() {
    if (segmentLoaded) return;
    segmentLoaded = true;

    if (!segmentHandlerDetached) {
        window.document.removeEventListener('mouseover', initSegment);
        segmentHandlerDetached = true;
    }

    var analytics = (window.analytics = window.analytics || []);
    if (!analytics.initialize)
        if (analytics.invoked)
            window.console &&
            console.error &&
            console.error('Segment snippet included twice.');
        else {
            analytics.invoked = !0;
            analytics.methods = [
                'trackSubmit',
                'trackClick',
                'trackLink',
                'trackForm',
                'pageview',
                'identify',
                'reset',
                'group',
                'track',
                'ready',
                'alias',
                'debug',
                'page',
                'once',
                'off',
                'on',
                'addSourceMiddleware',
                'addIntegrationMiddleware',
                'setAnonymousId',
                'addDestinationMiddleware',
            ];
            analytics.factory = function(e) {
                return function() {
                    var t = Array.prototype.slice.call(arguments);
                    t.unshift(e);
                    analytics.push(t);
                    return analytics;
                };
            };
            for (var e = 0; e < analytics.methods.length; e++) {
                var key = analytics.methods[e];
                analytics[key] = analytics.factory(key);
            }
            analytics.load = function(key, e) {
                var t = document.createElement('script');
                t.type = 'text/javascript';
                // t.async = !0;
                t.defer = true;
                t.src =
                    'https://cdn.segment.com/analytics.js/v1/' +
                    key +
                    '/analytics.min.js';
                var n = document.getElementsByTagName('script')[0];
                n.parentNode.insertBefore(t, n);
                analytics._loadOptions = e;
            };
            analytics.SNIPPET_VERSION = '4.13.1';
            analytics.load('aDjb4FDOYXHh1qyqYP1h8t4sZC08uTnb');
            analytics.page();
        }
}

var fbPixelLoaded = false;

function initFBPixel() {
    if (fbPixelLoaded) return;
    fbPixelLoaded = true;

    ! function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
    }(window, document, 'script',
        'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1019460525483085');
    fbq('track', 'PageView');

    var noscript = document.createElement('noscript')
    noscript.src = 'https://www.facebook.com/tr?id=1019460525483085&ev=PageView&noscript=1'
    noscript.height = 1
    noscript.width = 1
    noscript.style.display = 'none'

    document.head.appendChild(noscript)
}

// Defer analytics bootstrap off the first interaction: on touch devices the
// first tap fires `mouseover`, so initializing Segment/FB Pixel synchronously
// here used to run inside that tap's critical path and hurt INP. Instead,
// schedule the init for idle time right after the interaction completes.
var analyticsInitScheduled = false;

function scheduleAnalyticsInit() {
    if (analyticsInitScheduled) return;
    analyticsInitScheduled = true;

    window.document.removeEventListener('mouseover', scheduleAnalyticsInit);
    window.removeEventListener('touchstart', scheduleAnalyticsInit);

    var runInit = function() {
        initSegment();
        initFBPixel();
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(runInit, {
            timeout: 2000
        });
    } else {
        setTimeout(runInit, 600);
    }
}

window.document.addEventListener('mouseover', scheduleAnalyticsInit, {
    passive: true
});
window.addEventListener('touchstart', scheduleAnalyticsInit, {
    passive: true
});

// lazy load images

window.addEventListener("load", function() {
    var lazyloadImages = [];
    var lazyloadThrottleTimeout;
    document.querySelectorAll(".lazy").forEach(function(img) {
        lazyloadImages.push(img);
    });

    function lazyload() {
        if (lazyloadThrottleTimeout) {
            clearTimeout(lazyloadThrottleTimeout);
        }

        lazyloadThrottleTimeout = setTimeout(function() {
            var scrollTop = window.pageYOffset;
            lazyloadImages.forEach(function(img) {
                if (img.offsetTop < (window.innerHeight + scrollTop)) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');

                    lazyloadImages.splice(lazyloadImages.indexOf(img), 1);
                }
            });

            if (lazyloadImages.length == 0) {
                document.removeEventListener("scroll", lazyload);
                window.removeEventListener("resize", lazyload);
                window.removeEventListener("orientationChange", lazyload);
            }
        }, 20);
    }

    document.addEventListener("scroll", lazyload);
    window.addEventListener("resize", lazyload);
    window.addEventListener("orientationChange", lazyload);
});

// pricing widget
(function() {
    var onPeriodSwitchTap = function() {
        // var btn = $(this);
        var activePeriod = $(this).data('period');
        // activePeriod = activePeriod || $(this).data('period');
        const currentURL = window.location.href
        if (activePeriod !== 'y' && currentURL.includes('promotion')) {
            return;
        }

        var switchSelector = '.pricing-period-switch .period-control[data-period=' + activePeriod + ']'
        var btn = $(switchSelector);
        btn.siblings().removeClass('selected');
        btn.addClass('selected');

        $(this).parent().siblings().each((i, e) => {
            var label = $(e)
            if (label.data().period === activePeriod) {
                label.addClass('selected')
            } else {
                label.removeClass('selected')
            }
        })

        // if (activePeriod === 'y') {
        //   $('#pricing-plans .pricing-card').not('[data-no-value]').addClass('at-annual');
        //   $('.pricing-list-row').addClass('at-annual');
        //   $('#pricing-plans .plan-id-wrap').addClass('at-annual');
        //   $('#pricing-plans .pricing-table').addClass('at-annual');
        // } else {
        //   $('#pricing-plans .pricing-card').not('[data-no-value]').removeClass('at-annual');
        //   $('.pricing-list-row').removeClass('at-annual');
        //   $('#pricing-plans .plan-id-wrap').removeClass('at-annual');
        //   $('#pricing-plans .pricing-table').removeClass('at-annual');
        // }
        if (activePeriod === 'y') {
            $('.pricing-card').not('[data-no-value]').addClass('at-annual');
            $('.pricing-list-row').addClass('at-annual');
            $('.plan-id-wrap').addClass('at-annual');
            $('.pricing-table').addClass('at-annual');
        } else {
            $('.pricing-card').not('[data-no-value]').removeClass('at-annual');
            $('.pricing-list-row').removeClass('at-annual');
            $('.plan-id-wrap').removeClass('at-annual');
            $('.pricing-table').removeClass('at-annual');
        }

        btn.parent().attr('data-selected-period', activePeriod);
    };

    window.onPeriodSwitchTap = onPeriodSwitchTap;

    var toggleCompanyPricing = function(showCompanyPlans, forLivePlans) {
        $('.pricing-switch-checkbox[data-entity=company]').prop('checked', showCompanyPlans)

        var parenSelector = !forLivePlans ? '#pricing-plans:not([data-product=livestream_cdn])' : '#pricing-plans[data-product=livestream_cdn]'

        if (showCompanyPlans) {
            $('#pricing-plans[data-product=livestream_cdn]').addClass('at-company');
            $('#pricing-plans .pricing-card').addClass('at-company');
            // $('.pricing-card').addClass('at-company');
            $(parenSelector + ' .plan-id-wrap').addClass('at-company');
            $(parenSelector + ' .pricing-table').addClass('at-company');
            $(parenSelector + ' .pricing-switch-wrap').addClass('at-company');
            $(parenSelector + ' .pricing-actions-wrap').addClass('at-company');
        } else {
            $('#pricing-plans[data-product=livestream_cdn]').removeClass('at-company');
            $('#pricing-plans .pricing-card').removeClass('at-company');
            $(parenSelector + ' .plan-id-wrap').removeClass('at-company');
            $(parenSelector + ' .pricing-table').removeClass('at-company');
            $(parenSelector + ' .pricing-switch-wrap').removeClass('at-company');
            $(parenSelector + ' .pricing-actions-wrap').removeClass('at-company');
        }
    };

    var onPlanEntityChange = function() {
        var activeEntity = $(this).data('entity');
        // make changes to whatevery controls
        var showCompanyPlans = activeEntity === 'company';
        if (this.tagName === 'INPUT') {
            showCompanyPlans = this.checked === true;
            if (!showCompanyPlans) {
                activeEntity = 'user'
            }
        }

        var switchSelector = '.pricing-entity-switch .period-control[data-entity=' + activeEntity + ']'
        var btn = $(switchSelector);
        btn.siblings().removeClass('selected');
        btn.addClass('selected');

        toggleCompanyPricing(showCompanyPlans);
    };

    $('.pricing-switch-wrap label').on('click', onPeriodSwitchTap);
    $('.pricing-period-switch .period-control').on('click', onPeriodSwitchTap);

    $('.pricing-entity-switch .period-control').click(onPlanEntityChange);
    // $('.pricing-entity-switch .period-control').click(onPlanEntityChange);

    $('.pricing-switch-checkbox').change(onPlanEntityChange);


    // live delivert type switch
    $('.live-cat-tabs .live-cat-tab').on('click', function() {
        var el = $(this)
        el.addClass('selected')
        el.siblings().removeClass('selected')

        var showCompanyPlans = el.data('entity') === 'company'
        toggleCompanyPricing(showCompanyPlans, true);
    });

})();