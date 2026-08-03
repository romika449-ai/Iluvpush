import $ from 'jquery';
import videojs from "video.js";
import axios from "axios";
import "videojs-contrib-quality-levels";
import "videojs-http-source-selector";
// import "videojs-overlay";
import {
    parseQueryParams
} from '../js/shared/utils'

require('./shared/layout');

var setOffline = function() {
    if ($("#status-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "status-overlay";
    overlay.innerHTML =
        "<div><h1>Sorry, we are not <u>live</u> right now</h1><p>Please check us back at a later time</p></div>";

    var statusWrapper = $(".video-cover");
    if (!statusWrapper) {
        statusWrapper = $(".video-cover-wrapper");
    }

    statusWrapper.appendChild(overlay);

    $(".app").addClass("offline");
};

var unsetOffline = function() {
    var app = $(".app");
    app.addClass("online");
    app.removeClass("offline");
};

window.addEventListener("load", function() {
    var hasStopped = false;
    var isOffline = false;
    var retryTimeoutInt;
    var retryInterval = 6000;

    // var element = $(".theoplayer-container")[0];
    var videoUI = $("#video")[0];
    var playerSrcMime = 'application/x-mpegurl'

    /**@type {import('video.js').default.Player} */
    var videojsPlayer
    var statsInterval
    var playbackType = 'm3u8'
    var playbackURL = $('#player-url').val()
    var defaultPlaybackURLs = {
        live: 'https://hls-harbor-livepush.akamaized.net/live_cdn/nsqIStpj8PaG-Ev/emcQJ0pGpremocy/index.m3u8',
        mpd: 'https://hls-harbor-livepush.akamaized.net/live_cdn/nsqIStpj8PaG-Ev/emcQJ0pGpremocy/index.mpd',
        // vod: 'https://live-hls-abr-cdn.livepush.io/vod/bigbuckbunnyclip.mp4',
        vod: 'https://live-hls-abr-cdn.livepush.io/vod/bigbuckbunnyclip.mp4',
    };

    var defaultPlaybackEmbedIds = {
        live: 'emvoh7TEXeR9c',
        vod: 'emvhF973nVsJM',
        mpd: 'emvDByP0wGq2q',
    };

    var embedId = null

    var setMediaSourceType = function(onkeyup) {
        if (playbackURL.endsWith('.mpd')) {
            playbackType = 'dash'
            playerSrcMime = 'application/dash+xml'
        } else if (playbackURL.endsWith('.mp4')) {
            playbackType = 'mp4'
            playerSrcMime = 'video/mp4'
        } else {
            playbackType = 'm3u8'
            playerSrcMime = 'application/x-mpegurl'
        }

        if (onkeyup !== true) {
            var dom = $('[data-playback-type=' + playbackType + ']')
            if (dom.length > 0) {
                $('[data-playback-type]').removeClass('active')
                dom.addClass('active')
            }
        }
    };

    $('#player-url').on('keyup', function() {
        // console.log('url-value', this.value, this)
        var url = this.value
        playbackURL = url

        setMediaSourceType(true)

        $("#extname").text(playbackType)
    });

    var onFailedToLoad = function() {
        setOffline();
        isOffline = true;
        hasStopped = true;
        // console.log("stopping player");
        videojsPlayer.pause();

        retryTimeoutInt = setTimeout(function() {
            // console.log("retrying play");
            videojsPlayer.play();
        }, retryInterval);
    };

    var onSuccessToLoad = function() {
        // if (isOffline) {
        unsetOffline();
        // }

        isOffline = false;
        clearTimeout(retryTimeoutInt);
    };

    var createVideoElement = function() {
        var video = document.createElement('video')
        video.className = 'video-js vjs-theme-city'
        video.controls = true
        video.crossorigin = true
        video.playsInline = true
        document.querySelector('.player-wrap').append(video)
        return video
    }

    var startPlayback = function(ignoreURLCompute) {

        $('.player-video-before').hide();
        $('.hlsp-stats-graphic').removeClass('hlsp-stats-error');

        // getEmbedId(function (embedId) {
        //   setEmbedLink(embedId)
        // })

        if (ignoreURLCompute !== true) {
            var url = $('#player-url').val()
            playbackURL = url
        }

        // if (playbackURL.endsWith('.mpd')) {
        //   playbackType = 'dash'
        //   playerSrcMime = 'application/dash+xml'
        // } else if (playbackURL.endsWith('.mp4')) {
        //   playbackType = 'mp4'
        //   playerSrcMime = 'video/mp4'
        // } else {
        //   playbackType = 'm3u8'
        //   playerSrcMime = 'application/x-mpegurl'
        // }
        setMediaSourceType()

        $("#extname").text(playbackType)

        if (videojsPlayer) {
            videojsPlayer.dispose();
            videoUI = createVideoElement();
        }

        // player = new THEOplayer.Player(element, {
        //   libraryLocation:
        //     "https://cdn.myth.theoplayer.com/8d6f7eb6-077c-40b6-a6fa-34e48aab1d08",
        //   license:
        //     "sZP7IYe6T6fzTDfLCLAg3Ok63LboFSaZCSf-TS3K36zk3K0oCDIl0KBL3S56FOPlUY3zWokgbgjNIOf9flXK3Kac3oh_FSbzCKf-3uCL06k6IlCLFSbz3LfiTSRcCDIeCmfVfK4_bQgZCYxNWoryIQXzImf90SCZ3S5z3Lfi0u5i0Oi6Io4pIYP1UQgqWgjeCYxgflEc3lBr3LC_0ueLTuBLFOPeWok1dDrLYtA1Ioh6TgV6UQ1gWtAVCYggb6rlWoz6FOPVWo31WQ1qbta6FOfJfgzVfKxqWDXNWG3ybojkbK3gflNWfGxEIDjiWQXrIYfpCoj-f6i6WQjlCDcEWt3zf6i6v6PUFOPLIQ-LflNWfK1zWDikfgzVfG3gWKxydDkibK4LbogqW6f9UwPkIYz",
        //   autoplay: true
        // });

        var options = {
            bigPlayButton: false,
            controls: true,
            // fluid: true,
            // muted: retryMuted === true,
            muted: true,
            autoplay: true,
            controlBar: {
                timeDivider: true,
                currentTimeDisplay: true,
                remainingTimeDisplay: false,
                playToggle: true,
                seekToLive: true,
                liveDisplay: true,
                volumePanel: {},
                fullscreenToggle: true,
                playbackRateMenuButton: false,
            },
            html5: {
                vhs: {
                    experimentalBufferBasedABR: true,
                    useDevicePixelRatio: true
                },
                nativeAudioTracks: false,
                nativeVideoTracks: false,
                useBandwidthFromLocalStorage: true
            },
            techOrder: ['html5'],
            plugins: {
                // chromecast: {},
                httpSourceSelector: {
                    default: 'low'
                },
            },
            sources: [{
                src: playbackURL,
                // type: 'application/x-mpegURL'
                type: playerSrcMime
            }],
        };

        videojsPlayer = videojs(videoUI, options);
        videojsPlayer.volume(1)

        videojsPlayer.log = function() {}
        videojs.log.error = videojs.log.warn = videojsPlayer.log;

        var qualityLevels = videojsPlayer.qualityLevels()
        // console.log('qualityLevels', qualityLevels)
        videojsPlayer.httpSourceSelector();

        // console.log('setting up player')
        videojsPlayer.on("play", function() {
            // hasStarted = true;
            hasStopped = false;
            // hasPaused = false;
        });

        // ---- Playback error state: flip the stats panel red while the stream is broken ----
        videojsPlayer.on('error', function() {
            $('.hlsp-stats-graphic').addClass('hlsp-stats-error');
            $('#hlsp-stat-type').text('ERROR');
        });
        videojsPlayer.on('loadedmetadata', function() {
            $('.hlsp-stats-graphic').removeClass('hlsp-stats-error');
        });
        videojsPlayer.on('playing', function() {
            $('.hlsp-stats-graphic').removeClass('hlsp-stats-error');
        });

        // console.log('player', videojsPlayer)
        var qualityLevelInit = false
        var setQualityLevel = function() {
            var qualityLevel = qualityLevels[qualityLevels.selectedIndex]
            if (qualityLevel) {
                var placeholderUI = $('.vjs-button.vjs-http-source-selector .vjs-icon-placeholder')
                if (placeholderUI) {
                    qualityLevelInit = true
                    // console.log('qualityLevel', qualityLevel)
                    var height = qualityLevel.height
                    var currentLabel = 'Auto'
                    if (height) {
                        // currentLabel += 'p'
                        if (height >= 1920) {
                            currentLabel = '4K'
                        } else if (height >= 1440 && height < 1920) {
                            currentLabel = '2K'
                        } else if (height >= 1080 && height < 1440) {
                            currentLabel = 'FHD'
                        } else if (height >= 720 && height < 1080) {
                            currentLabel = 'HD'
                        } else {
                            currentLabel = height + 'p'
                        }

                        currentLabel = currentLabel || (height + 'p')
                        currentLabel = height + 'p'
                    } else {
                        // currentLabel = qualityLevel.bitrate
                        var bitrate = qualityLevel.bitrate
                        if (Number(bitrate)) {
                            currentLabel = Math.round(bitrate / 1000) + 'K'
                        } else {
                            currentLabel = 'HD'
                        }
                    }

                    placeholderUI.html(currentLabel);
                    if (!placeholderUI.length) {
                        setTimeout(function() {
                            $('.vjs-button.vjs-http-source-selector .vjs-icon-placeholder').html(currentLabel);
                        }, 1000);
                    }
                }
            }
            console.log('qualityLevel', qualityLevel)
        }

        qualityLevels.on('change', function() {
            setQualityLevel();
            updateStats();
        });

        var resizePLAYER = function() {
            var width = $('.player-wrap').width()
            $('.player-wrap').height(width / 1.7777777777)
        }

        resizePLAYER();
        $(window).on('resize', resizePLAYER)

        // ---- Live stats panel (player info / stream info, akamai-style) ----
        var formatBitrate = function(bps) {
            bps = Number(bps)
            if (!bps || isNaN(bps)) return '-'
            if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps'
            return Math.round(bps / 1000) + ' kbps'
        }

        var getVhs = function() {
            try {
                var tech = videojsPlayer.tech({
                    IWillNotUseThisInPlugins: true
                })
                return tech && tech.vhs
            } catch (e) {
                return null
            }
        }

        var getSelectedLevel = function() {
            if (!qualityLevels || !qualityLevels.length || qualityLevels.selectedIndex == null || qualityLevels.selectedIndex < 0) {
                return null
            }
            return qualityLevels[qualityLevels.selectedIndex] || null
        }

        var isManualQuality = function() {
            for (var i = 0; i < qualityLevels.length; i++) {
                if (!qualityLevels[i].enabled) return true
            }
            return false
        }

        var selectRendition = function(index) {
            for (var i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = (index === -1) ? true : (i === index)
            }
            renderRenditions()
            updateStats()
        }

        // Rebuilding the renditions list is the most expensive part of the stats
        // refresh (innerHTML + layout). Skip it when nothing changed, so the 1s
        // stats interval doesn't churn the DOM and compete with user interactions.
        var lastRenditionsSignature = null
        var renderRenditions = function() {
            var list = $('#hlsp-renditions')
            if (!list.length) return

            var manual = isManualQuality()

            var signature = qualityLevels.length + ':' + qualityLevels.selectedIndex + ':' + (manual ? 'm' : 'a')
            for (var s = 0; s < qualityLevels.length; s++) {
                signature += (qualityLevels[s].enabled ? '1' : '0')
            }
            if (signature === lastRenditionsSignature) return
            lastRenditionsSignature = signature

            var html = ''
            var count = 0

            if (qualityLevels.length > 1) {
                html += '<div class="hls-abr-row hls-abr-selectable' + (manual ? '' : ' hls-abr-active') + '" data-level-index="-1">' +
                    '<span class="hls-abr-dot"></span>' +
                    '<span class="hls-abr-res">Auto</span>' +
                    '<span class="hls-abr-rate">Adaptive quality</span>' +
                    '<span class="hls-abr-badge">' + (manual ? 'switch' : 'ACTIVE') + '</span>' +
                    '</div>'
            }

            for (var i = 0; i < qualityLevels.length; i++) {
                var lvl = qualityLevels[i]
                var isActive = i === qualityLevels.selectedIndex && manual
                var res = lvl.height ? (lvl.width + 'x' + lvl.height) : 'Audio only'
                count++
                html += '<div class="hls-abr-row hls-abr-selectable' + (isActive ? ' hls-abr-active' : '') + '" data-level-index="' + i + '">' +
                    '<span class="hls-abr-dot"></span>' +
                    '<span class="hls-abr-res">' + res + '</span>' +
                    '<span class="hls-abr-rate">' + formatBitrate(lvl.bitrate) + '</span>' +
                    '<span class="hls-abr-badge">' + (isActive ? 'ACTIVE' : 'select') + '</span>' +
                    '</div>'
            }

            list.html(html || '<div class="hls-recording-meta" style="padding:6px 2px;">No rendition data yet, press play</div>')
            $('#hlsp-stat-levels-count').text(count ? (count + (count === 1 ? ' rendition' : ' renditions')) : '-')
        }

        $('#hlsp-renditions').off('click.hlspRendition').on('click.hlspRendition', '.hls-abr-row', function() {
            var index = parseInt($(this).attr('data-level-index'), 10)
            if (isNaN(index) || !qualityLevels || !qualityLevels.length) return
            selectRendition(index)
        })

        var updateStats = function() {
            if (!videojsPlayer) return
            // Nobody can see the panel while the tab is hidden — don't burn main
            // thread time on it (the next visible tick repaints everything anyway).
            if (document.hidden) return

            $('#hlsp-player-name').text(
                playbackType === 'mp4' ? 'Video.js - Progressive MP4' : 'Video.js - VHS (HTTP Streaming)'
            )
            $('#hlsp-player-version').text(videojs.VERSION ? ('v' + videojs.VERSION) : '-')

            var vhs = getVhs()
            var selectedLevel = getSelectedLevel()
            var isErrored = $('.hlsp-stats-graphic').hasClass('hlsp-stats-error')

            var media = null
            try {
                media = vhs && vhs.playlists && vhs.playlists.media && vhs.playlists.media()
            } catch (e) {}

            var isLive = false
            try {
                isLive = videojsPlayer.duration() === Infinity
            } catch (e) {}
            if (media && typeof media.endList === 'boolean') {
                isLive = !media.endList
            }
            if (!isErrored) {
                $('#hlsp-stat-type').text(playbackType === 'mp4' ? 'VOD' : (isLive ? 'LIVE' : 'VOD'))
            }

            var mediaAttrs = media && media.attributes
            var targetDuration = (media && media.targetDuration) || null
            $('#hlsp-stat-segment').text(targetDuration ? (targetDuration + 's') : '-')

            var resWidth = (selectedLevel && selectedLevel.width) || (mediaAttrs && mediaAttrs.RESOLUTION && mediaAttrs.RESOLUTION.width)
            var resHeight = (selectedLevel && selectedLevel.height) || (mediaAttrs && mediaAttrs.RESOLUTION && mediaAttrs.RESOLUTION.height)
            if (isErrored) {
                $('#hlsp-stat-resolution').text('-')
            } else if (resHeight) {
                $('#hlsp-stat-resolution').text(resWidth + 'x' + resHeight)
            } else {
                $('#hlsp-stat-resolution').text(playbackType === 'mp4' ? 'Source' : 'Auto')
            }

            var levelBitrate = (selectedLevel && selectedLevel.bitrate) || (mediaAttrs && mediaAttrs.BANDWIDTH)
            $('#hlsp-stat-bitrate').text(isErrored ? '-' : formatBitrate(levelBitrate))

            var bandwidth = null
            if (!isErrored) {
                try {
                    if (vhs) {
                        bandwidth = vhs.bandwidth || vhs.systemBandwidth || (vhs.stats && vhs.stats.bandwidth)
                    }
                } catch (e) {}
            }
            $('#hlsp-stat-bandwidth').text(isErrored ? '-' : formatBitrate(bandwidth))

            var bufferedEnd = 0
            var currentTime = videojsPlayer.currentTime() || 0
            try {
                var buffered = videojsPlayer.buffered()
                if (buffered && buffered.length) {
                    bufferedEnd = buffered.end(buffered.length - 1)
                }
            } catch (e) {}
            var bufferAhead = Math.max(0, bufferedEnd - currentTime)
            $('#hlsp-stat-buffer').text(bufferAhead.toFixed(1) + 's')

            try {
                var tech = videojsPlayer.tech({
                    IWillNotUseThisInPlugins: true
                })
                var videoEl = tech && tech.el_
                if (videoEl && videoEl.getVideoPlaybackQuality) {
                    var q = videoEl.getVideoPlaybackQuality()
                    $('#hlsp-stat-dropped').text(q.droppedVideoFrames + ' / ' + q.totalVideoFrames)
                }
            } catch (e) {}

            renderRenditions()
        }

        clearInterval(statsInterval)
        statsInterval = setInterval(updateStats, 1000)
        videojsPlayer.one('loadedmetadata', updateStats)
        qualityLevels.on('addqualitylevel', function() {
            renderRenditions()
            updateStats()
        })
        videojsPlayer.on('dispose', function() {
            clearInterval(statsInterval)
        })
        updateStats()

        updateShareLink(playbackURL)
        updateSnippets(playbackURL)

    };

    // Paint-first wrapper around startPlayback: hide the cover and let the
    // browser paint that feedback BEFORE running the heavy video.js setup.
    // Running videojs() synchronously inside the tap handler was a single long
    // task that delayed the next paint and showed up as poor INP on mobile.
    var startPlaybackDeferred = function(ignoreURLCompute) {
        $('.player-video-before').hide();
        $('.hlsp-stats-graphic').removeClass('hlsp-stats-error');

        window.requestAnimationFrame(function() {
            setTimeout(function() {
                startPlayback(ignoreURLCompute);
            }, 0);
        });
    };

    // ---- Share widget: builds a ?src= link for the current test and copies it ----
    var updateShareLink = function(url) {
        var shareInput = $('#hlsp-share-url')
        if (!shareInput.length || !url) return

        var shareURL = window.location.origin + window.location.pathname + '?src=' + encodeURIComponent(url)
        shareInput.val(shareURL)

        if (window.history && window.history.replaceState) {
            try {
                window.history.replaceState(null, '', shareURL)
            } catch (e) {}
        }
    }

    var copyShareLink = function() {
        var shareInput = $('#hlsp-share-url')
        var btn = $('#hlsp-share-copy-btn')
        if (!shareInput.length) return

        var value = shareInput.val()
        var onCopied = function() {
            var original = btn.data('original-label') || btn.text()
            btn.data('original-label', original)
            btn.text('Copied!')
            clearTimeout(btn.data('reset-timeout'))
            var t = setTimeout(function() {
                btn.text(original)
            }, 1800)
            btn.data('reset-timeout', t)
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(onCopied).catch(function() {
                shareInput.get(0).select()
                document.execCommand('copy')
                onCopied()
            })
        } else {
            shareInput.get(0).select()
            document.execCommand('copy')
            onCopied()
        }
    }

    // ---- Code snippets: show how to consume the tested stream URL in common languages ----
    var snippetState = {
        lang: 'js',
        url: ''
    }

    var escapeHtml = function(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    var snippetBuilders = {
        js: function(url) {
            return {
                filename: 'player.js',
                code: '<span class="hlc-dim">// 1. Install hls.js</span>\n' +
                    '<span class="hlc-dim">// npm install hls.js</span>\n' +
                    '<span class="hlc-dim">// or: &lt;script src="' + '<span class="hlc-str">https://cdn.jsdelivr.net/npm/hls.js@latest</span>' + '"&gt;&lt;/script&gt;</span>\n\n' +
                    '<span class="hlc-dim">// 2. Load and play this stream</span>\n' +
                    '<span class="hlc-kw">import</span> Hls <span class="hlc-kw">from</span> <span class="hlc-str">\'hls.js\'</span>;\n\n' +
                    '<span class="hlc-kw">const</span> hls = <span class="hlc-kw">new</span> <span class="hlc-fn">Hls</span>();\n\n' +
                    'hls.<span class="hlc-fn">loadSource</span>(<span class="hlc-str">\'' + escapeHtml(url) + '\'</span>);\n' +
                    'hls.<span class="hlc-fn">attachMedia</span>(videoEl);\n' +
                    'hls.<span class="hlc-fn">on</span>(Hls.Events.<span class="hlc-const">MANIFEST_PARSED</span>, () =&gt; {\n' +
                    '  videoEl.<span class="hlc-fn">play</span>();\n' +
                    '});'
            }
        },
        swift: function(url) {
            return {
                filename: 'Player.swift',
                code: '<span class="hlc-dim">// iOS - AVPlayer native</span>\n' +
                    '<span class="hlc-kw">import</span> <span class="hlc-const">AVFoundation</span>\n\n' +
                    '<span class="hlc-kw">let</span> url = <span class="hlc-const">URL</span>(string: <span class="hlc-str">"' + escapeHtml(url) + '"</span>)!\n' +
                    '<span class="hlc-kw">let</span> player = <span class="hlc-const">AVPlayer</span>(url: url)\n\n' +
                    '<span class="hlc-kw">let</span> layer = <span class="hlc-const">AVPlayerLayer</span>(player: player)\n' +
                    'layer.frame = view.bounds\n' +
                    'view.layer.<span class="hlc-fn">addSublayer</span>(layer)\n' +
                    'player.<span class="hlc-fn">play</span>()'
            }
        },
        kotlin: function(url) {
            return {
                filename: 'Player.kt',
                code: '<span class="hlc-dim">// Android - ExoPlayer</span>\n' +
                    '<span class="hlc-kw">val</span> player = <span class="hlc-const">ExoPlayer</span>\n' +
                    '  .Builder(<span class="hlc-kw">this</span>).<span class="hlc-fn">build</span>()\n\n' +
                    '<span class="hlc-kw">val</span> item = <span class="hlc-const">MediaItem</span>\n' +
                    '  .<span class="hlc-fn">fromUri</span>(<span class="hlc-str">"' + escapeHtml(url) + '"</span>)\n\n' +
                    'player.<span class="hlc-fn">setMediaItem</span>(item)\n' +
                    'player.<span class="hlc-fn">prepare</span>()\n' +
                    'player.<span class="hlc-fn">play</span>()'
            }
        },
        curl: function(url) {
            return {
                filename: 'terminal',
                code: '<span class="hlc-dim"># Fetch and inspect the manifest</span>\n' +
                    '<span class="hlc-fn">curl</span> -s <span class="hlc-str">"' + escapeHtml(url) + '"</span>\n\n' +
                    '<span class="hlc-dim"># Play directly with ffplay or VLC</span>\n' +
                    '<span class="hlc-fn">ffplay</span> <span class="hlc-str">"' + escapeHtml(url) + '"</span>'
            }
        }
    }

    var renderSnippet = function() {
        var pre = $('#hlsp-snippet-pre')
        var filenameEl = $('#hlsp-snippet-filename')
        if (!pre.length) return

        var builder = snippetBuilders[snippetState.lang] || snippetBuilders.js
        var url = snippetState.url || 'https://your-cdn.example.com/stream/index.m3u8'
        var result = builder(url)

        pre.addClass('hls-dev-pre-fading')
        setTimeout(function() {
            pre.html(result.code)
            filenameEl.text(result.filename)
            pre.removeClass('hls-dev-pre-fading')
        }, 150)
    }

    var updateSnippets = function(url) {
        snippetState.url = url
        renderSnippet()
    }

    $('#hlsp-snippet-tabs').on('click', '.hls-dev-lang', function() {
        var lang = $(this).attr('data-lang')
        if (!lang || lang === snippetState.lang) return
        snippetState.lang = lang
        $('#hlsp-snippet-tabs .hls-dev-lang').removeClass('hls-dev-lang-active')
        $(this).addClass('hls-dev-lang-active')
        renderSnippet()
    })

    $('#hlsp-snippet-copy-btn').on('click', function() {
        var btn = $(this)
        var text = $('#hlsp-snippet-pre').get(0).textContent

        var onCopied = function() {
            var label = btn.find('span')
            var original = label.data('original-label') || label.text()
            label.data('original-label', original)
            label.text('Copied!')
            clearTimeout(btn.data('reset-timeout'))
            var t = setTimeout(function() {
                label.text(original)
            }, 1500)
            btn.data('reset-timeout', t)
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(function() {
                var range = document.createRange()
                range.selectNode(document.getElementById('hlsp-snippet-pre'))
                window.getSelection().removeAllRanges()
                window.getSelection().addRange(range)
                document.execCommand('copy')
                window.getSelection().removeAllRanges()
                onCopied()
            })
        } else {
            var range2 = document.createRange()
            range2.selectNode(document.getElementById('hlsp-snippet-pre'))
            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range2)
            document.execCommand('copy')
            window.getSelection().removeAllRanges()
            onCopied()
        }
    })

    var _send = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function() {
        _send.apply(this, arguments)

        // console.log('xhr-send-cb', this)
        this.addEventListener('readystatechange', function() {
            var statusCode = this.status;
            if (this.readyState === 4) {
                if (statusCode >= 200 && statusCode <= 302) {
                    onSuccessToLoad();
                } else if (statusCode >= 400) {
                    onFailedToLoad(url, statusCode);
                }
            }
        }, false);
    };

    var getEmbedId = function(cb) {
        var videoURL = $('#player-url').val()

        embedId = null
        if (videoURL === defaultPlaybackURLs.live) {
            embedId = defaultPlaybackEmbedIds.live
        } else if (videoURL === defaultPlaybackURLs.mpd) {
            embedId = defaultPlaybackEmbedIds.mpd
        } else if (videoURL === defaultPlaybackURLs.vod) {
            embedId = defaultPlaybackEmbedIds.vod
        }

        var ondone = function() {
            $('#embed-url-copy-btn').removeClass('form-btn-disabled');
            $('#embed-url-copy-btn').removeAttr('disabled');

            cb(embedId);
        }

        if (embedId) return ondone()

        $('#embed-url-copy-btn').addClass('form-btn-disabled');
        $('#embed-url-copy-btn').attr('disabled', 'disabled');
        setEmbedLink('Generating link..', true)

        axios
            .post('https://player-api.livepush.io/v1/embeds', {
                videoURL
            })
            // .post('http://127.0.0.1:4567/v1/embeds', { videoURL })
            .then(function(res) {
                embedId = res.data.embedId
            })
            .finally(ondone)
    }

    var setEmbedLink = function(embedId, isFullLink) {
        var embedURL = 'https://player.livepush.io/' + embedId;
        if (isFullLink) {
            embedURL = embedId
        }
        $('#embed-url').val(embedURL);
    }

    var copyEmbedCode = function(embedId) {
        var embedURLUI = $('#embed-url');
        // var embedURL = embedURLUI.val();
        embedURLUI.select()
        document.execCommand('copy');
    }

    window.HELP_IMPROVE_VIDEOJS = false;

    // disabling auto start on page load
    // startPlayback();

    // read src if in url
    const qs = parseQueryParams(window.location.search)
    if (qs && qs.src) {
        $('#player-url').val(qs.src)
    }
    updateShareLink($('#player-url').val())
    updateSnippets($('#player-url').val())

    // bind to button
    $('#player-play-btn').on('click', function() {
        startPlaybackDeferred()
    })
    $('#hlsp-share-copy-btn').on('click', copyShareLink)
    // $('#embed-url-copy-btn').on('click', copyEmbedCode)

    $('.form-btn.btn-type').on('click', function() {
        var btn = $(this)
        if (btn.hasClass('active')) return;

        btn.addClass('active');
        $(this).siblings().removeClass('active');

        var mediaType = this.dataset.playbackType
        if (playbackURL === defaultPlaybackURLs[mediaType]) true

        playbackURL = defaultPlaybackURLs[mediaType]
        $('#player-url').val(playbackURL)

        startPlaybackDeferred(true)
    })
});