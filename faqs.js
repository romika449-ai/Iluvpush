import $ from 'jquery';

// faqs cat switching essentials
var faqCategories = $('#faqs .faq_menu .faq_menu_item')
var faqItems = $('#faqs .faq_list .faq_block')

var onFaqCatChanged = function(category) {
    faqCategories.each((i, node) => {
        var faqCat = $(node);
        if (faqCat.data().faqCat === category) {
            faqCat.addClass('active')
        } else {
            faqCat.removeClass('active')
        }
    })

    faqItems.each((i, node) => {
        var faqTtem = $(node);

        var cursorCats = faqTtem.data().faqCat.split(',').reduce((hash, p) => ({ ...hash,
            [p]: true
        }), {})

        if (cursorCats[category]) {
            faqTtem.addClass('visible');
        } else {
            faqTtem.removeClass('visible');
        }
    })
};

faqCategories.on('click', function() {
    var selectedCat = this.dataset.faqCat
    // $(this).addClass('active')
    // $(this).siblings().removeClass('active')
    onFaqCatChanged(selectedCat);
});

// call initial faq-cat switch
var initCat = 'kb'
var pathname = window.location.pathname
if (pathname.startsWith('/pricing')) {
    initCat = 'pricing'
} else if (
    pathname.startsWith('/multistream') ||
    pathname.startsWith('/products/multistreaming') ||
    pathname.startsWith('/solutions/game-streaming') ||
    pathname.startsWith('/features/multistreaming')) {
    initCat = 'multistream'
} else if (pathname.startsWith('/prerecorded')) {
    initCat = 'pre-recorded'
} else if (pathname.startsWith('/products/live-event-hosting')) {
    initCat = 'live-event'
} else if (
    pathname.startsWith('/livestreaming') ||
    pathname.startsWith('/solutions/game-streaming') ||
    pathname.startsWith('/solutions/live')) {
    initCat = 'live'
}

onFaqCatChanged(initCat)