/* ==========================================================================
   Bohuainter — site behaviour and tool logic
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- navigation ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });
  }
  /* mobile: tap "Tools" to expand the dropdown */
  document.querySelectorAll(".nav-item > .nav-link").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (window.innerWidth <= 860 && btn.parentElement.classList.contains("nav-item")) {
        if (btn.dataset.dropdown === "true") {
          e.preventDefault();
          btn.parentElement.classList.toggle("open");
        }
      }
    });
  });

  /* ---------- text metrics ---------- */
  function splitWords(t) {
    return t.trim() ? t.trim().split(/\s+/) : [];
  }
  function countWords(t) {
    return splitWords(t).length;
  }
  function countChars(t, spaces) {
    return spaces ? t.length : t.replace(/\s/g, "").length;
  }
  function countGraphemes(t) {
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        var seg = new Intl.Segmenter("en", { granularity: "grapheme" });
        var n = 0;
        seg.segment(t).forEach(function () { n++; });
        return n;
      }
    } catch (e) {}
    return Array.from(t).length;
  }
  var NOEMOJI_RE = /[\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\p{S}]/gu;
  function countNoEmoji(t) {
    try {
      return t.replace(NOEMOJI_RE, "").length;
    } catch (e) {
      return t.length;
    }
  }
  function countSentences(t) {
    var parts = t.split(/[.!?]+(?:\s|$)/).filter(function (s) {
      return s.trim().length > 0;
    });
    return parts.length;
  }
  function countParagraphs(t) {
    return t.split(/\n\s*\n|\n/).filter(function (s) {
      return s.trim().length > 0;
    }).length;
  }
  function readTime(words, wpm) {
    if (!words) return "0 min";
    var m = Math.ceil(words / (wpm || 225));
    return (m < 1 ? "<1" : m) + " min";
  }
  function fmt(n) {
    return (n || 0).toLocaleString("en-US");
  }

  /* ---------- shared live stats ---------- */
  window.Bohua = { countWords: countWords, countChars: countChars, fmt: fmt };

  /* ==========================================================
     Tool 1 — character counter
     ========================================================== */
  var cc = document.getElementById("cc-input");
  if (cc) {
    var ccOut = {
      chars: document.getElementById("cc-chars"),
      charsNs: document.getElementById("cc-chars-ns"),
      words: document.getElementById("cc-words"),
      sentences: document.getElementById("cc-sentences"),
      paragraphs: document.getElementById("cc-paragraphs"),
      lines: document.getElementById("cc-lines"),
      reading: document.getElementById("cc-reading"),
      emoji: document.getElementById("cc-emoji"),
      noemoji: document.getElementById("cc-noemoji")
    };
    var ccLimit = document.getElementById("cc-limit");
    var ccRemain = document.getElementById("cc-remaining");
    var render = function () {
      var t = cc.value;
      ccOut.chars.textContent = fmt(t.length);
      ccOut.charsNs.textContent = fmt(countChars(t, false));
      if (ccOut.emoji) ccOut.emoji.textContent = fmt(countGraphemes(t));
      if (ccOut.noemoji) ccOut.noemoji.textContent = fmt(countNoEmoji(t));
      ccOut.words.textContent = fmt(countWords(t));
      ccOut.sentences.textContent = fmt(countSentences(t));
      ccOut.paragraphs.textContent = fmt(countParagraphs(t));
      if (ccOut.lines) ccOut.lines.textContent = fmt(t ? t.split(/\n/).length : 0);
      ccOut.reading.textContent = readTime(countWords(t));
      if (ccRemain && ccLimit) {
        var lim = parseInt(ccLimit.value, 10);
        if (isNaN(lim) || lim < 0) {
          ccRemain.textContent = "\u221E";
          ccRemain.classList.remove("neg");
        } else {
          var left = lim - t.length;
          ccRemain.textContent = fmt(left);
          ccRemain.classList.toggle("neg", left < 0);
        }
      }
    };
    cc.addEventListener("input", render);
    if (ccLimit) ccLimit.addEventListener("input", render);
    render();

    document.querySelectorAll("[data-cc-action]").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.dataset.ccAction;
        if (act === "clear") cc.value = "";
        if (act === "copy") {
          cc.select();
          document.execCommand("copy");
          b.textContent = "Copied";
          setTimeout(function () { b.textContent = "Copy text"; }, 1400);
          return;
        }
        if (act === "sample") {
          cc.value =
            "Clear writing is a habit, not a talent. Writers who count their words learn something surprising about their own rhythm. Short sentences carry weight. Longer ones give the reader room to breathe before the next idea arrives.\n\nTry writing without stopping for ten minutes, then count what you produced. The number is less important than the shape of the paragraph.";
        }
        render();
      });
    });
  }

  /* ==========================================================
     Tool 2 — words to pages calculator
     ========================================================== */
  var wp = document.getElementById("wp-words");
  if (wp) {
    var wpPage = document.getElementById("wp-per-page");
    var wpSize = document.getElementById("wp-size");
    var wpSpace = document.getElementById("wp-space");

    var wpOut = {
      pages: document.getElementById("wp-pages"),
      exact: document.getElementById("wp-exact"),
      sheets: document.getElementById("wp-sheets"),
      time: document.getElementById("wp-time"),
      single: document.getElementById("wp-single"),
      note: document.getElementById("wp-note")
    };

    var calcWp = function () {
      var words = parseFloat(wp.value) || 0;
      var perPage = parseFloat(wpPage.value) || 500;
      var size = wpSize.value;
      var dbl = wpSpace.value === "double";
      var single = perPage;
      var pages = words / perPage;
      var sheets = Math.ceil(pages * (dbl ? 2 : 1));

      wpOut.pages.textContent = fmt(Math.ceil(pages));
      wpOut.exact.textContent = pages.toFixed(pages < 10 ? 2 : 1);
      wpOut.sheets.textContent = fmt(sheets);
      wpOut.time.textContent = readTime(words);
      wpOut.single.textContent = fmt(perPage);
      wpOut.note.textContent =
        size === "a4" ? "Based on A4 at 12pt, 1 inch margins" : "Based on US Letter at 12pt, 1 inch margins";
    };

    [wp, wpPage].forEach(function (el) { el.addEventListener("input", calcWp); });
    [wpSize, wpSpace].forEach(function (el) { el.addEventListener("change", calcWp); });

    document.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-preset]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        wpPage.value = b.dataset.preset;
        calcWp();
      });
    });
    calcWp();

    /* the reverse direction: pages to words */
    var pv = document.getElementById("pv-pages");
    if (pv) {
      var pvOut = document.getElementById("pv-words");
      var calcPv = function () {
        var p = parseFloat(pv.value) || 0;
        var per = parseFloat(wpPage.value) || 500;
        pvOut.textContent = fmt(Math.round(p * per));
      };
      pv.addEventListener("input", calcPv);
      wpPage.addEventListener("input", calcPv);
      calcPv();
    }
  }

  /* ==========================================================
     Tool 3 — characters to words
     ========================================================== */
  var c2w = document.getElementById("c2w-chars");
  if (c2w) {
    var c2wOut = {
      words: document.getElementById("c2w-words"),
      sentences: document.getElementById("c2w-sentences"),
      minutes: document.getElementById("c2w-minutes"),
      paragraphs: document.getElementById("c2w-paragraphs"),
      perWord: document.getElementById("c2w-perword"),
      mode: document.getElementById("c2w-mode")
    };
    var calcC2w = function () {
      var withSpaces = c2wOut.mode.value === "with";
      var chars = parseFloat(c2w.value) || 0;
      var effective = withSpaces ? chars * 0.83 : chars;
      var words = effective / 5.1;
      var sentences = words / 15;
      var paragraphs = sentences / 4;
      c2wOut.words.textContent = fmt(Math.round(words));
      c2wOut.sentences.textContent = fmt(Math.max(1, Math.round(sentences)));
      c2wOut.minutes.textContent = Math.max(1, Math.ceil(words / 225)) + " min";
      c2wOut.paragraphs.textContent = fmt(Math.max(1, Math.round(paragraphs)));
      c2wOut.perWord.textContent = words > 0 ? (chars / words).toFixed(2) : "0.00";
    };
    c2w.addEventListener("input", calcC2w);
    c2wOut.mode.addEventListener("change", calcC2w);
    calcC2w();
  }

  /* ==========================================================
     Tool 4 — essay word counter
     ========================================================== */
  var ew = document.getElementById("ew-input");
  if (ew) {
    var ewTarget = document.getElementById("ew-target");
    var ewOut = {
      words: document.getElementById("ew-words"),
      chars: document.getElementById("ew-chars"),
      sentences: document.getElementById("ew-sentences"),
      paragraphs: document.getElementById("ew-paragraphs"),
      avg: document.getElementById("ew-avg"),
      reading: document.getElementById("ew-reading"),
      progress: document.getElementById("ew-progress"),
      remain: document.getElementById("ew-remain"),
      meter: document.getElementById("ew-meter"),
      pages: document.getElementById("ew-pages")
    };
    var calcEw = function () {
      var t = ew.value;
      var words = countWords(t);
      var sentences = countSentences(t);
      var target = parseFloat(ewTarget.value) || 0;
      var pct = target > 0 ? Math.min(100, (words / target) * 100) : 0;
      ewOut.words.textContent = fmt(words);
      ewOut.chars.textContent = fmt(countChars(t, true));
      ewOut.sentences.textContent = fmt(sentences);
      ewOut.paragraphs.textContent = fmt(countParagraphs(t));
      ewOut.avg.textContent = sentences > 0 ? (words / sentences).toFixed(1) : "0";
      if (ewOut.reading) ewOut.reading.textContent = readTime(words);
      ewOut.pages.textContent = (words / 275).toFixed(1);
      ewOut.progress.textContent = target > 0 ? Math.round(pct) + "%" : "--";
      ewOut.remain.textContent = target > 0 ? fmt(Math.max(0, target - words)) : "--";
      ewOut.meter.style.width = pct + "%";
      ewOut.meter.style.background = words > target && target > 0 ? "#f59e0b" : "var(--blue)";
    };
    ew.addEventListener("input", calcEw);
    ewTarget.addEventListener("input", calcEw);
    calcEw();
  }

  /* ==========================================================
     Tool 5 & 6 — upper / lower case
     ========================================================== */
  var caseInput = document.getElementById("case-input");
  if (caseInput) {
    var caseOut = document.getElementById("case-output");
    var caseCount = document.getElementById("case-count");
    var run = function () {
      var mode = document.querySelector("[data-case].active");
      var v = caseInput.value;
      var r = v;
      if (mode) {
        switch (mode.dataset.case) {
          case "upper": r = v.toUpperCase(); break;
          case "lower": r = v.toLowerCase(); break;
          case "firstbig":
            r = v.replace(/(^|\s|["'(\[])(\S)/g, function (m, p, c) { return p + c.toUpperCase(); });
            break;
          case "title":
            r = (function (str) {
              var minor = { a: 1, an: 1, the: 1, and: 1, but: 1, or: 1, nor: 1, for: 1, so: 1, yet: 1, at: 1, by: 1, in: 1, of: 1, on: 1, per: 1, to: 1, up: 1, via: 1, as: 1, vs: 1 };
              var words = str.toLowerCase().split(/(\s+)/);
              var seen = 0;
              var total = words.filter(function (w) { return /\S/.test(w); }).length;
              return words.map(function (w) {
                if (!/\S/.test(w)) return w;
                seen++;
                var bare = w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
                var keepLower = seen > 1 && seen < total && minor[bare] === 1;
                return w.replace(/[a-z]/, function (c) { return keepLower ? c : c.toUpperCase(); });
              }).join("");
            })(v);
            break;
          case "alternating":
            r = (function (str) {
              var n = 0;
              return str.replace(/[a-zA-Z]/g, function (c) {
                n++;
                return n % 2 === 1 ? c.toLowerCase() : c.toUpperCase();
              });
            })(v);
            break;
          case "sentence":
            r = v.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, function (m) { return m.toUpperCase(); });
            break;
          case "slug":
            r = v.toLowerCase().trim()
              .replace(/['"\u2018\u2019\u201C\u201D]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            break;
          case "inverse":
            r = v.replace(/[a-zA-Z]/g, function (c) {
              return c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase();
            });
            break;
          case "snake":
            r = v.toLowerCase().trim()
              .replace(/['"\u2018\u2019\u201C\u201D]/g, "")
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");
            break;
          case "camel":
            r = v.toLowerCase().replace(/[^a-z0-9]+(.)/g, function (m, c) { return c.toUpperCase(); })
              .replace(/^[A-Z]/, function (c) { return c.toLowerCase(); });
            break;
          case "pascal":
            r = v.toLowerCase().replace(/(^|[^a-z0-9]+)(.)/g, function (m, p, c) { return c.toUpperCase(); });
            break;
        }
      }
      caseOut.value = r;
      caseOut.dispatchEvent(new Event("input"));
      if (caseCount) {
        caseCount.textContent = fmt(r.length) + " characters · " + fmt(countWords(r)) + " words";
      }
    };
    caseInput.addEventListener("input", run);
    document.querySelectorAll("[data-case]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-case]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        run();
      });
    });
    document.querySelectorAll("[data-case-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        caseOut.select();
        document.execCommand("copy");
        var old = b.textContent;
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = old; }, 1400);
      });
    });
    document.querySelectorAll("[data-case-clear]").forEach(function (b) {
      b.addEventListener("click", function () {
        caseInput.value = "";
        caseOut.value = "";
        if (caseCount) caseCount.textContent = "0 characters · 0 words";
      });
    });
    document.querySelectorAll("[data-case-download]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = caseOut.value || "";
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "converted-text.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
    });
    var sample = document.getElementById("case-sample");
    if (sample) {
      sample.addEventListener("click", function () {
        caseInput.value = sample.dataset.sample;
        run();
      });
    }
    run();
  }

  /* ==========================================================
     Tool 7 — twitter counter
     ========================================================== */
  var tw = document.getElementById("tw-input");
  if (tw) {
    var twOut = {
      chars: document.getElementById("tw-chars"),
      remain: document.getElementById("tw-remain"),
      words: document.getElementById("tw-words"),
      meter: document.getElementById("tw-meter"),
      ring: document.getElementById("tw-ring"),
      status: document.getElementById("tw-status"),
      weighted: document.getElementById("tw-weighted"),
      para: document.getElementById("tw-para")
    };
    var limit = 280;
    document.querySelectorAll("[data-limit]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-limit]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        limit = parseInt(b.dataset.limit, 10);
        calcTw();
      });
    });
    /* X counts most CJK characters as 2 units */
    function weightedLength(str) {
      var n = 0;
      for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        n += code > 0x2e80 ? 2 : 1;
      }
      return n;
    }
    /* X wraps every link in t.co and charges a flat 23 units regardless of length */
    var URL_RE = /(https?:\/\/|www\.)[^\s]+/gi;
    function weightedWithLinks(str) {
      var total = 0;
      var last = 0;
      var m;
      URL_RE.lastIndex = 0;
      while ((m = URL_RE.exec(str)) !== null) {
        total += weightedLength(str.slice(last, m.index)) + 23;
        last = m.index + m[0].length;
      }
      total += weightedLength(str.slice(last));
      return total;
    }
    var calcTw = function () {
      var v = tw.value;
      var used = weightedWithLinks(v);
      var remain = limit - used;
      var pct = Math.min(100, (used / limit) * 100);
      twOut.chars.textContent = fmt(used);
      twOut.words.textContent = fmt(countWords(v));
      twOut.weighted.textContent = fmt(v.length);
      if (twOut.para) twOut.para.textContent = fmt(countParagraphs(v));
      twOut.remain.textContent = fmt(Math.abs(remain));
      twOut.remain.style.color = remain < 0 ? "#dc2626" : "inherit";
      twOut.meter.style.width = pct + "%";
      twOut.meter.style.background = remain < 0 ? "#dc2626" : remain < limit * 0.1 ? "#f59e0b" : "var(--blue)";
      twOut.ring.textContent = remain >= 0 ? "You have room for " + fmt(remain) + " more characters" : fmt(-remain) + " characters over the limit";
      twOut.status.textContent = remain < 0 ? "Too long" : remain < 20 ? "Almost full" : "Ready to post";
      twOut.status.style.color = remain < 0 ? "#dc2626" : remain < 20 ? "#b45309" : "#047857";
    };
    tw.addEventListener("input", calcTw);
    calcTw();
    var twSample = document.getElementById("tw-sample");
    if (twSample) {
      twSample.addEventListener("click", function () {
        tw.value = twSample.dataset.sample;
        calcTw();
      });
    }
  }

  /* ==========================================================
     Tool 8 — google meta counter
     ========================================================== */
  var metaTitle = document.getElementById("meta-title");
  if (metaTitle) {
    var metaDesc = document.getElementById("meta-desc");
    var mOut = {
      titleChars: document.getElementById("meta-title-chars"),
      titlePx: document.getElementById("meta-title-px"),
      titleState: document.getElementById("meta-title-state"),
      titleBar: document.getElementById("meta-title-bar"),
      descChars: document.getElementById("meta-desc-chars"),
      descPx: document.getElementById("meta-desc-px"),
      descState: document.getElementById("meta-desc-state"),
      descBar: document.getElementById("meta-desc-bar"),
      prevTitle: document.getElementById("prev-title"),
      prevDesc: document.getElementById("prev-desc"),
      prevUrl: document.getElementById("prev-url"),
      prevSlug: document.getElementById("prev-slug")
    };

    /* rough pixel estimator: desktop ~ 9px per char at avg width */
    function px(str, base) {
      var w = 0;
      for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (/[iljtfIr.,'!|]/.test(c)) w += base * 0.42;
        else if (/[mwMW]/.test(c)) w += base * 1.35;
        else if (/[A-Z0-9]/.test(c)) w += base * 1.05;
        else if (c === " ") w += base * 0.55;
        else w += base;
      }
      return Math.round(w);
    }

    function setState(el, bar, value, max, min) {
      var pct = Math.min(100, (value / max) * 100);
      bar.style.width = pct + "%";
      var label, color;
      if (value === 0) { label = "Empty"; color = "#9ca3af"; bar.style.background = "#d1d5db"; }
      else if (value < min) { label = "Too short"; color = "#b45309"; bar.style.background = "#f59e0b"; }
      else if (value > max) { label = "Cut off by Google"; color = "#b91c1c"; bar.style.background = "#dc2626"; }
      else { label = "Good length"; color = "#047857"; bar.style.background = "#10b981"; }
      el.textContent = label;
      el.style.color = color;
    }

    var calcMeta = function () {
      var t = metaTitle.value, d = metaDesc.value;
      mOut.titleChars.textContent = fmt(t.length);
      mOut.titlePx.textContent = fmt(px(t, 10.5)) + " px";
      mOut.descChars.textContent = fmt(d.length);
      mOut.descPx.textContent = fmt(px(d, 9.2)) + " px";
      setState(mOut.titleState, mOut.titleBar, t.length, 60, 30);
      setState(mOut.descState, mOut.descBar, d.length, 160, 70);
      mOut.prevTitle.textContent = t || "Your page title appears here";
      mOut.prevDesc.textContent = d || "Write a meta description that earns the click. Google shows roughly 155 characters on desktop.";
      mOut.prevUrl.textContent = "https://bohuainter.com/" + (mOut.prevSlug.value ? mOut.prevSlug.value.replace(/^\/|\/$/g, "") + "/" : "");
    };
    metaTitle.addEventListener("input", calcMeta);
    metaDesc.addEventListener("input", calcMeta);
    mOut.prevSlug.addEventListener("input", calcMeta);
    calcMeta();
  }

  /* ==========================================================
     Tool 9 — image alt text generator
     ========================================================== */
  var altInput = document.getElementById("alt-input");
  if (altInput) {
    var altOut = document.getElementById("alt-out");
    var altNameOut = document.getElementById("alt-name-out");
    var altPre = document.getElementById("alt-copy-pre");
    var altCopyAll = document.getElementById("alt-copy-all");

    function altTitleCase(v) {
      var clean = v.replace(/\s+/g, " ").trim();
      if (!clean) return "";
      return clean.split(" ").map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(" ");
    }

    function altSlug(v) {
      return v.trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
    }

    function altBlock(alt, name) {
      return "Image name: " + name + "\nImage alt: " + alt;
    }

    function setAltValue(el, value) {
      el.textContent = value;
      el.classList.toggle("is-empty", !value);
    }

    function flashCopied(btn) {
      var original = btn.dataset.originalLabel || btn.textContent;
      btn.dataset.originalLabel = original;
      btn.textContent = "Copied";
      clearTimeout(btn._altTimer);
      btn._altTimer = setTimeout(function () {
        btn.textContent = original;
      }, 1400);
    }

    function copyAltText(text, btn) {
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); flashCopied(btn); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          flashCopied(btn);
        }, fallback);
      } else {
        fallback();
      }
    }

    var renderAlt = function () {
      var raw = altInput.value;
      var alt = altTitleCase(raw);
      var name = altSlug(raw);
      setAltValue(altOut, alt);
      setAltValue(altNameOut, name);
      altPre.textContent = altBlock(alt, name);
      altCopyAll.disabled = !raw.trim();
    };

    altInput.addEventListener("input", renderAlt);
    renderAlt();

    document.querySelectorAll("[data-alt-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.dataset.altCopy === "alt" ? altOut.textContent : altNameOut.textContent;
        if (value) copyAltText(value, btn);
      });
    });

    altCopyAll.addEventListener("click", function () {
      if (!altInput.value.trim()) return;
      copyAltText(altBlock(altOut.textContent, altNameOut.textContent), altCopyAll);
    });

    var altSample = document.getElementById("alt-sample");
    if (altSample) {
      altSample.addEventListener("click", function () {
        altInput.value = "blue ceramic coffee mug on a wooden table";
        renderAlt();
        altInput.focus();
      });
    }

    var altClear = document.getElementById("alt-clear");
    if (altClear) {
      altClear.addEventListener("click", function () {
        altInput.value = "";
        renderAlt();
        altInput.focus();
      });
    }
  }

  /* ==========================================================
     Tool 10 — chinese word counter
     ========================================================== */
  var cw = document.getElementById("cwc-input");
  if (cw) {
    var HANZI_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;
    var CJK_PUNCT_RE = /[，。！？；：、“”‘’（）《》〈〉【】〔〕「」『』～·—…•﹐﹒﹔﹕﹖﹗＄％＼｜]/g;
    var LAT_PUNCT_RE = /[,.!?;:"'()[\]{}<>\/\\|@#$%^&*~`+=\-_]/g;
    var cwOut = {
      hanzi: document.getElementById("cwc-hanzi"),
      words: document.getElementById("cwc-words"),
      chars: document.getElementById("cwc-chars"),
      enwords: document.getElementById("cwc-enwords"),
      punct: document.getElementById("cwc-punct"),
      sentences: document.getElementById("cwc-sentences"),
      paragraphs: document.getElementById("cwc-paragraphs"),
      reading: document.getElementById("cwc-reading")
    };
    var calcCw = function () {
      var t = cw.value;
      var hanzi = (t.match(HANZI_RE) || []).length;
      var enWords = (t.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
      var wordCount = hanzi + enWords;
      var charsNoSpace = t.replace(/\s/g, "").length;
      var punct = (t.match(CJK_PUNCT_RE) || []).length + (t.match(LAT_PUNCT_RE) || []).length;
      var sentences = t.split(/[。！？]+|[.!?]+(?:\s|$)/).filter(function (s) {
        return s.trim().length > 0;
      }).length;
      var paragraphs = t.split(/\n\s*\n|\n/).filter(function (s) {
        return s.trim().length > 0;
      }).length;
      cwOut.hanzi.textContent = fmt(hanzi);
      cwOut.words.textContent = fmt(wordCount);
      cwOut.chars.textContent = fmt(charsNoSpace);
      cwOut.enwords.textContent = fmt(enWords);
      cwOut.punct.textContent = fmt(punct);
      cwOut.sentences.textContent = fmt(sentences);
      cwOut.paragraphs.textContent = fmt(paragraphs);
      if (cwOut.reading) {
        cwOut.reading.textContent = (hanzi + enWords) > 0 ? Math.max(1, Math.round((hanzi + enWords) / 300)) + " min" : "0 min";
      }
    };
    cw.addEventListener("input", calcCw);
    var cwcClear = document.getElementById("cwc-clear");
    if (cwcClear) {
      cwcClear.addEventListener("click", function () {
        cw.value = "";
        calcCw();
        cw.focus();
      });
    }
    var cwcSample = document.getElementById("cwc-sample");
    if (cwcSample) {
      cwcSample.addEventListener("click", function () {
        cw.value = "中文文本没有空格，所以统计字数和统计词数是两件事。一个汉字算一个字，两个或多个字再组成一个词，例如电脑和人工智能。Mixed English words are counted separately.";
        calcCw();
        cw.focus();
      });
    }
    calcCw();
  }

  /* ==========================================================
     Tool 11 — instagram character counter
     ========================================================== */
  var ig = document.getElementById("ic-input");
  if (ig) {
    var igLimit = 2200;
    var igOut = {
      field: document.getElementById("ic-field"),
      chars: document.getElementById("ic-chars"),
      nospace: document.getElementById("ic-nospace"),
      words: document.getElementById("ic-words"),
      hashtags: document.getElementById("ic-hashtags"),
      mentions: document.getElementById("ic-mentions"),
      lines: document.getElementById("ic-lines"),
      used: document.getElementById("ic-used"),
      total: document.getElementById("ic-total"),
      left: document.getElementById("ic-left"),
      meter: document.getElementById("ic-meter")
    };
    var HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;
    var MENTION_RE = /@[\p{L}\p{N}._]+/gu;

    function igTagCount(text, re, fallback) {
      try {
        return (text.match(re) || []).length;
      } catch (e) {
        return (text.match(fallback) || []).length;
      }
    }

    function applyLimit(used, limit, outUsed, outTotal, outLeft, meter) {
      outUsed.textContent = fmt(used);
      outTotal.textContent = fmt(limit);
      outLeft.textContent = fmt(limit - used);
      var pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
      meter.style.width = pct + "%";
      meter.classList.toggle("is-over", used > limit);
    }

    var calcIg = function () {
      var t = ig.value;
      var chars = countGraphemes(t);
      var words = countWords(t);
      igOut.chars.textContent = fmt(chars);
      igOut.nospace.textContent = fmt(countChars(t, false));
      igOut.words.textContent = fmt(words);
      igOut.hashtags.textContent = fmt(igTagCount(t, HASHTAG_RE, /#[A-Za-z0-9_]+/g));
      igOut.mentions.textContent = fmt(igTagCount(t, MENTION_RE, /@[A-Za-z0-9._]+/g));
      igOut.lines.textContent = fmt(t ? t.split("\n").length : 0);
      applyLimit(chars, igLimit, igOut.used, igOut.total, igOut.left, igOut.meter);
    };
    ig.addEventListener("input", calcIg);

    document.querySelectorAll("[data-ic-limit]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-ic-limit]").forEach(function (c) {
          c.classList.toggle("active", c === chip);
        });
        igLimit = parseInt(chip.dataset.icLimit, 10) || 2200;
        igOut.field.textContent = chip.dataset.icField || "Caption";
        calcIg();
      });
    });

    var icSample = document.getElementById("ic-sample");
    if (icSample) {
      icSample.addEventListener("click", function () {
        ig.value = "One small change that saved our launch week.\n\nWe shipped the pricing page on a Tuesday instead of a Friday, and support tickets fell by half.\n\n#launchweek @ourteam";
        calcIg();
        ig.focus();
      });
    }
    var icClear = document.getElementById("ic-clear");
    if (icClear) {
      icClear.addEventListener("click", function () {
        ig.value = "";
        calcIg();
        ig.focus();
      });
    }
    calcIg();
  }

  /* ==========================================================
     Tool 12 — linkedin character counter
     ========================================================== */
  var li = document.getElementById("li-input");
  if (li) {
    var liLimit = 3000;
    var liOut = {
      field: document.getElementById("li-field"),
      chars: document.getElementById("li-chars"),
      nospace: document.getElementById("li-nospace"),
      words: document.getElementById("li-words"),
      lines: document.getElementById("li-lines"),
      hook: document.getElementById("li-hook"),
      reading: document.getElementById("li-reading"),
      used: document.getElementById("li-used"),
      total: document.getElementById("li-total"),
      left: document.getElementById("li-left"),
      meter: document.getElementById("li-meter")
    };

    var calcLi = function () {
      var t = li.value;
      var chars = countGraphemes(t);
      var words = countWords(t);
      var hook = t.split("\n")[0];
      liOut.chars.textContent = fmt(chars);
      liOut.nospace.textContent = fmt(countChars(t, false));
      liOut.words.textContent = fmt(words);
      liOut.lines.textContent = fmt(t ? t.split("\n").length : 0);
      liOut.hook.textContent = fmt(t ? hook.length : 0);
      liOut.reading.textContent = readTime(words, 220);
      applyLimit(chars, liLimit, liOut.used, liOut.total, liOut.left, liOut.meter);
    };
    li.addEventListener("input", calcLi);

    document.querySelectorAll("[data-li-limit]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-li-limit]").forEach(function (c) {
          c.classList.toggle("active", c === chip);
        });
        liLimit = parseInt(chip.dataset.liLimit, 10) || 3000;
        liOut.field.textContent = chip.dataset.liField || "Post";
        calcLi();
      });
    });

    var liSample = document.getElementById("li-sample");
    if (liSample) {
      liSample.addEventListener("click", function () {
        li.value = "We cut our onboarding from nine screens to three and activation rose 22 percent.\n\nHere is what we removed. The company size field nobody used, the role picker that duplicated the job title, and the tour that ran before the first real task.\n\nWhat would you cut first?";
        calcLi();
        li.focus();
      });
    }
    var liClear = document.getElementById("li-clear");
    if (liClear) {
      liClear.addEventListener("click", function () {
        li.value = "";
        calcLi();
        li.focus();
      });
    }
    calcLi();
  }

  /* ==========================================================
     Tool 13 — website word counter
     ========================================================== */
  var ww = document.getElementById("ww-input");
  if (ww) {
    var WW_STOP = "the a an and or of to in for on at with is are was were be been it this that as by from you your we our its not but if then than so can will just into out up".split(" ");
    var wwOut = {
      words: document.getElementById("ww-words"),
      unique: document.getElementById("ww-unique"),
      chars: document.getElementById("ww-chars"),
      paras: document.getElementById("ww-paras"),
      reading: document.getElementById("ww-reading"),
      hits: document.getElementById("ww-hits"),
      top: document.getElementById("ww-top"),
      term: document.getElementById("ww-term")
    };

    function wwClean(raw) {
      var t = raw;
      if (/<\/?[a-z][\s\S]*>/i.test(t)) {
        t = t.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ");
        t = t.replace(/<!--[\s\S]*?-->/g, " ");
        t = t.replace(/<[^>]+>/g, " ");
        t = t.replace(/&nbsp;/gi, " ")
             .replace(/&amp;/gi, "&")
             .replace(/&lt;/gi, "<")
             .replace(/&gt;/gi, ">")
             .replace(/&quot;/gi, '"')
             .replace(/&#39;/g, "'");
      }
      return t;
    }

    function wwToken(w) {
      try {
        return w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      } catch (e) {
        return w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
      }
    }

    var calcWw = function () {
      var text = wwClean(ww.value);
      var words = splitWords(text);
      var freq = {};
      var uniqueSet = {};
      words.forEach(function (raw) {
        var k = wwToken(raw);
        if (!k) return;
        uniqueSet[k] = true;
        if (k.length > 2 && WW_STOP.indexOf(k) === -1) freq[k] = (freq[k] || 0) + 1;
      });
      wwOut.words.textContent = fmt(words.length);
      wwOut.unique.textContent = fmt(Object.keys(uniqueSet).length);
      wwOut.chars.textContent = fmt(countChars(text, true));
      wwOut.paras.textContent = fmt(text.split(/\n\s*\n/).filter(function (p) {
        return p.trim().length > 0;
      }).length);
      wwOut.reading.textContent = readTime(words.length, 230);

      var term = (wwOut.term && wwOut.term.value || "").trim().toLowerCase();
      if (!term) {
        wwOut.hits.textContent = "0";
      } else {
        var hay = text.toLowerCase();
        var hits = 0;
        var idx = hay.indexOf(term);
        while (idx !== -1) {
          hits++;
          idx = hay.indexOf(term, idx + term.length);
        }
        wwOut.hits.textContent = fmt(hits);
      }

      var top = Object.keys(freq).sort(function (a, b) {
        return freq[b] - freq[a] || a.localeCompare(b);
      }).slice(0, 8);
      wwOut.top.innerHTML = top.length
        ? top.map(function (w) {
            return '<span class="chip" style="cursor:default">' + w + " " + freq[w] + "</span>";
          }).join("")
        : '<span style="font-size:13px;color:var(--gray-400)">Paste a page to see its most repeated words.</span>';
    };

    ww.addEventListener("input", calcWw);
    if (wwOut.term) wwOut.term.addEventListener("input", calcWw);
    var wwSample = document.getElementById("ww-sample");
    if (wwSample) {
      wwSample.addEventListener("click", function () {
        ww.value = "<h1>Shipping a static site in a weekend</h1>\n\nA static site is a folder of files. Every page is a file, every asset is a file, and the host serves them as they are. That simplicity is why a static site loads fast and costs almost nothing to run.\n\nThe trade off is that anything dynamic has to happen somewhere else. Forms need a service. Search needs an index. Comments need a third party or a build step that rebuilds the pages when someone posts.";
        calcWw();
        ww.focus();
      });
    }
    var wwClear = document.getElementById("ww-clear");
    if (wwClear) {
      wwClear.addEventListener("click", function () {
        ww.value = "";
        calcWw();
        ww.focus();
      });
    }
    calcWw();
  }

  /* ==========================================================
     Tool 14 — number counter (tap counter)
     ========================================================== */
  var ncTap = document.getElementById("nc-tap");
  if (ncTap) {
    var nc = { taps: 0, total: 0 };
    var ncStepEl = document.getElementById("nc-step");
    var ncTargetEl = document.getElementById("nc-target");
    var ncOut = {
      value: document.getElementById("nc-value"),
      taps: document.getElementById("nc-taps"),
      sum: document.getElementById("nc-sum"),
      step: document.getElementById("nc-step-out"),
      target: document.getElementById("nc-target-out"),
      left: document.getElementById("nc-left"),
      percent: document.getElementById("nc-percent"),
      progress: document.getElementById("nc-progress"),
      remain: document.getElementById("nc-remain"),
      meter: document.getElementById("nc-meter")
    };

    function ncStep() {
      var v = parseInt(ncStepEl.value, 10);
      return isNaN(v) || v < 1 ? 1 : v;
    }
    function ncTarget() {
      var v = parseInt(ncTargetEl.value, 10);
      return isNaN(v) || v < 0 ? 0 : v;
    }

    var calcNc = function () {
      var step = ncStep();
      var target = ncTarget();
      var pct = target > 0 ? Math.min(100, (nc.total / target) * 100) : 0;
      ncOut.value.textContent = fmt(nc.total);
      ncOut.taps.textContent = fmt(nc.taps);
      ncOut.sum.textContent = fmt(nc.total);
      ncOut.step.textContent = fmt(step);
      ncOut.target.textContent = target ? fmt(target) : "none";
      ncOut.left.textContent = target ? fmt(Math.max(0, target - nc.total)) : "-";
      ncOut.percent.textContent = Math.round(pct) + "%";
      ncOut.progress.textContent = Math.round(pct) + "%";
      ncOut.remain.textContent = target ? Math.max(0, target - nc.total) : 0;
      ncOut.meter.style.width = pct + "%";
    };

    ncTap.addEventListener("click", function () {
      nc.taps += 1;
      nc.total += ncStep();
      calcNc();
    });
    var ncMinus = document.getElementById("nc-minus");
    if (ncMinus) {
      ncMinus.addEventListener("click", function () {
        nc.total = Math.max(0, nc.total - ncStep());
        nc.taps += 1;
        calcNc();
      });
    }
    var ncClear = document.getElementById("nc-clear");
    if (ncClear) {
      ncClear.addEventListener("click", function () {
        nc.taps = 0;
        nc.total = 0;
        calcNc();
      });
    }
    [ncStepEl, ncTargetEl].forEach(function (el) {
      el.addEventListener("input", calcNc);
    });
    document.addEventListener("keydown", function (e) {
      if (e.code !== "Space" && e.key !== " ") return;
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      nc.taps += 1;
      nc.total += ncStep();
      calcNc();
    });
    calcNc();
  }

  /* ==========================================================
     Tool 15 — haiku checker
     ========================================================== */
  var hkL1 = document.getElementById("hk-l1");
  if (hkL1) {
    var hkLines = [
      { input: hkL1, target: 5, badge: document.getElementById("hk-s1") },
      { input: document.getElementById("hk-l2"), target: 7, badge: document.getElementById("hk-s2") },
      { input: document.getElementById("hk-l3"), target: 5, badge: document.getElementById("hk-s3") }
    ];
    var hkOut = {
      total: document.getElementById("hk-total"),
      words: document.getElementById("hk-words"),
      lines: document.getElementById("hk-lines"),
      longest: document.getElementById("hk-longest"),
      form: document.getElementById("hk-form"),
      verdict: document.getElementById("hk-verdict")
    };

    function hkSyllWord(word) {
      var w = word.toLowerCase().replace(/[^a-z]/g, "");
      if (!w) return 0;
      if (w.length <= 3) return 1;
      w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
      w = w.replace(/^y/, "");
      var m = w.match(/[aeiouy]{1,2}/g);
      return m ? m.length : 1;
    }

    function hkSyllLine(text) {
      var words = splitWords(text);
      if (!words.length) return 0;
      var n = 0;
      for (var i = 0; i < words.length; i++) n += hkSyllWord(words[i]);
      return n;
    }

    var calcHk = function () {
      var total = 0;
      var words = 0;
      var filled = 0;
      var longest = 0;
      var ok = true;
      hkLines.forEach(function (row) {
        var n = hkSyllLine(row.input.value);
        total += n;
        words += countWords(row.input.value);
        if (row.input.value.trim()) filled++;
        longest = Math.max(longest, n);
        row.badge.textContent = n + " / " + row.target;
        row.badge.classList.toggle("ok", n === row.target);
        row.badge.classList.toggle("over", n > row.target);
        if (n !== row.target) ok = false;
      });
      hkOut.total.textContent = fmt(total);
      hkOut.words.textContent = fmt(words);
      hkOut.lines.textContent = fmt(filled);
      hkOut.longest.textContent = fmt(longest);
      hkOut.form.textContent = ok && filled === 3 ? "5-7-5" : "Off";
      if (filled < 3) {
        hkOut.verdict.textContent = "Add three lines to check the form.";
        hkOut.verdict.style.color = "var(--gray-500)";
      } else if (ok) {
        hkOut.verdict.textContent = "5-7-5 holds. This poem is in haiku form.";
        hkOut.verdict.style.color = "#047857";
      } else {
        hkOut.verdict.textContent = "Not 5-7-5 yet. " + total + " syllables across three lines, 17 needed.";
        hkOut.verdict.style.color = "#b45309";
      }
    };

    hkLines.forEach(function (row) {
      row.input.addEventListener("input", calcHk);
    });

    var HK_FIVE = ["a morning glory", "beside the still pond", "the old wooden gate", "one crow on the wire"];
    var HK_SEVEN = ["and the white petals open", "the morning glory climbs on", "a river under the bridge"];

    var hkSample = document.getElementById("hk-sample");
    if (hkSample) {
      hkSample.addEventListener("click", function () {
        hkLines[0].input.value = HK_FIVE[0];
        hkLines[1].input.value = HK_SEVEN[0];
        hkLines[2].input.value = HK_FIVE[1];
        calcHk();
      });
    }
    var hkMake = document.getElementById("hk-make");
    if (hkMake) {
      hkMake.addEventListener("click", function () {
        hkLines[0].input.value = HK_FIVE[Math.floor(Math.random() * HK_FIVE.length)];
        hkLines[1].input.value = HK_SEVEN[Math.floor(Math.random() * HK_SEVEN.length)];
        hkLines[2].input.value = HK_FIVE[Math.floor(Math.random() * HK_FIVE.length)];
        calcHk();
      });
    }
    var hkClear = document.getElementById("hk-clear");
    if (hkClear) {
      hkClear.addEventListener("click", function () {
        hkLines.forEach(function (row) { row.input.value = ""; });
        calcHk();
      });
    }
    calcHk();
  }

  /* ==========================================================
     Tool 16 — link counter and URL length checker
     ========================================================== */
  var lk = document.getElementById("lk-input");
  if (lk) {
    var lkOut = {
      count: document.getElementById("lk-count"),
      unique: document.getElementById("lk-unique"),
      domains: document.getElementById("lk-domains"),
      over: document.getElementById("lk-over"),
      longest: document.getElementById("lk-longest"),
      average: document.getElementById("lk-average"),
      list: document.getElementById("lk-list")
    };

    function lkDomain(url) {
      var m = url.match(/^[a-z][a-z0-9+.-]*:\/\/([^\/?#:]+)/i);
      if (m) return m[1].toLowerCase().replace(/^www\./, "");
      m = url.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
      return m ? m[1].toLowerCase().replace(/^www\./, "") : "";
    }

    var calcLk = function () {
      var urls = lk.value.split(/\n+/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      var seen = {};
      var domains = {};
      var over = 0;
      var longest = 0;
      var sum = 0;
      urls.forEach(function (u) {
        seen[u] = true;
        var dom = lkDomain(u);
        if (dom) domains[dom] = true;
        if (u.length > 75) over++;
        longest = Math.max(longest, u.length);
        sum += u.length;
      });
      lkOut.count.textContent = fmt(urls.length);
      lkOut.unique.textContent = fmt(Object.keys(seen).length);
      lkOut.domains.textContent = fmt(Object.keys(domains).length);
      lkOut.over.textContent = fmt(over);
      lkOut.longest.textContent = fmt(longest);
      lkOut.average.textContent = urls.length ? fmt(Math.round(sum / urls.length)) : "0";
      lkOut.list.innerHTML = urls.slice(0, 8).map(function (u) {
        var cls = u.length > 75 ? "lk-row over" : "lk-row";
        return '<div class="' + cls + '"><span class="lk-url">' + u.replace(/&/g, "&amp;").replace(/</g, "&lt;") +
               '</span><span class="lk-len">' + u.length + "</span></div>";
      }).join("");
    };

    lk.addEventListener("input", calcLk);
    var lkSample = document.getElementById("lk-sample");
    if (lkSample) {
      lkSample.addEventListener("click", function () {
        lk.value = "https://bohuainter.com/tool/character-counter/\nhttps://bohuainter.com/tool/number-counter/\nhttps://example.com/a/very/long/path/that/keeps/going/and/going/until/it/is/cut/off/in/a/search/result\nhttps://bohuainter.com/tool/character-counter/";
        calcLk();
        lk.focus();
      });
    }
    var lkClear = document.getElementById("lk-clear");
    if (lkClear) {
      lkClear.addEventListener("click", function () {
        lk.value = "";
        calcLk();
        lk.focus();
      });
    }
    calcLk();
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
