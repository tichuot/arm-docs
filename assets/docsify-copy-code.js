/*!
 * docsify-copy-code
 * v2.0.2
 * https://github.com/jperasmus/docsify-copy-code
 * (c) 2018 JP Erasmus <jperasmus11@gmail.com>
 * MIT license
 */
!function() {
    "use strict";
    !function(e, o) {
        void 0 === o && (o = {});
        var t = o.insertAt;
        if (e && "undefined" != typeof document) {
            var n = document.head || document.getElementsByTagName("head")[0]
              , c = document.createElement("style");
            c.type = "text/css",
            "top" === t && n.firstChild ? n.insertBefore(c, n.firstChild) : n.appendChild(c),
            c.styleSheet ? c.styleSheet.cssText = e : c.appendChild(document.createTextNode(e))
        }
    }('.docsify-copy-code-button{z-index:1;right:0;padding:10px;opacity:0;border:0;border-radius:0;outline:0;cursor:pointer}.docsify-copy-code-button,.docsify-copy-code-button:after{position:absolute;top:0;background:#ccc;color:#fff;transition:all .25s ease}.docsify-copy-code-button:after{content:"Copied!";z-index:0;right:100%;margin:5px 10px 0;padding:5px;border-radius:3px;font-size:11px;-webkit-transform:translateX(120%) scale(0);transform:translateX(120%) scale(0)}.docsify-copy-code-button.success:after{-webkit-transform:translateX(0) scale(1);transform:translateX(0) scale(1)}pre[v-pre]:hover .docsify-copy-code-button{opacity:1}'),
    document.querySelector('link[href*="docsify-copy-code"]') && console.warn("[Deprecation] Link to external docsify-copy-code stylesheet is no longer necessary."),
    window.DocsifyCopyCodePlugin = {
        init: function() {
            return function(e, o) {
                e.ready(function() {
                    console.warn("[Deprecation] Manually initializing docsify-copy-code using window.DocsifyCopyCodePlugin.init() is no longer necessary.")
                })
            }
        }
    },
    window.$docsify = window.$docsify || {},
    window.$docsify.plugins = [function(e, o) {
        e.doneEach(function() {
            Array.apply(null, document.querySelectorAll("pre[v-pre]")).forEach(function(e, t, n) {
                var c = document.createElement("button");
                c.appendChild(document.createTextNode("Click to copy")),
                c.classList.add("docsify-copy-code-button"),
                o.config.themeColor && (c.style.background = o.config.themeColor),
                c.addEventListener("click", function(o) {
                    var t = document.createRange()
                      , n = e.querySelector("code")
                      , i = window.getSelection();
                    t.selectNode(n),
                    i.removeAllRanges(),
                    i.addRange(t);
                    try {
                        document.execCommand("copy") && (c.classList.add("success"),
                        setTimeout(function() {
                            c.classList.remove("success")
                        }, 1e3))
                    } catch (e) {
                        c.classList.add("error"),
                        setTimeout(function() {
                            c.classList.remove("error")
                        }, 1e3)
                    }
                    "function" == typeof (i = window.getSelection()).removeRange ? i.removeRange(t) : "function" == typeof i.removeAllRanges && i.removeAllRanges()
                }),
                e.appendChild(c)
            })
        })
    }
    ].concat(window.$docsify.plugins || [])
}();
//# sourceMappingURL=docsify-copy-code.min.js.map
