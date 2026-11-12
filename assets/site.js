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
      reading: document.getElementById("cc-reading")
    };
    var render = function () {
      var t = cc.value;
      ccOut.chars.textContent = fmt(t.length);
      ccOut.charsNs.textContent = fmt(countChars(t, false));
      ccOut.words.textContent = fmt(countWords(t));
      ccOut.sentences.textContent = fmt(countSentences(t));
      ccOut.paragraphs.textContent = fmt(countParagraphs(t));
      ccOut.lines.textContent = fmt(t ? t.split(/\n/).length : 0);
      ccOut.reading.textContent = readTime(countWords(t));
    };
    cc.addEventListener("input", render);
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
      ewOut.reading.textContent = readTime(words);
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
          case "title":
            r = v.toLowerCase().replace(/(^|\s|["'(\[])([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
            break;
          case "sentence":
            r = v.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, function (m) { return m.toUpperCase(); });
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
      weighted: document.getElementById("tw-weighted")
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
    var calcTw = function () {
      var v = tw.value;
      var used = weightedLength(v);
      var remain = limit - used;
      var pct = Math.min(100, (used / limit) * 100);
      twOut.chars.textContent = fmt(used);
      twOut.words.textContent = fmt(countWords(v));
      twOut.weighted.textContent = fmt(v.length);
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

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
