/* Passkey gate: hides the page until the visitor enters the shared passkey.
   Unlocking is remembered per browser for every site on this origin. */
(function () {
  var HASH = "45256d06aacb9395f4ad0db8a6f085fb00e10de93f474f3d2f2c00c4db6eaa4a";
  var KEY = "pk-gate";
  var doc = document;
  var root = doc.documentElement;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
  }
  if (read() === HASH) return;

  function sha256(str) {
    var K = [], H = [], i, j;
    var isPrime = function (n) { for (var f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; };
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) | 0; };
    for (i = 2, j = 0; j < 64; i++) {
      if (!isPrime(i)) continue;
      if (j < 8) H[j] = frac(Math.pow(i, 1 / 2));
      K[j++] = frac(Math.pow(i, 1 / 3));
    }
    var bytes = unescape(encodeURIComponent(str)), words = [], l = bytes.length * 8;
    for (i = 0; i < bytes.length; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
    words[l >> 5] |= 0x80 << (24 - (l % 32));
    words[(((l + 64) >> 9) << 4) + 15] = l;
    var rot = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (i = 0; i < words.length; i += 16) {
      var w = [], a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = words[i + j] | 0;
        else {
          var s0 = rot(w[j - 15], 7) ^ rot(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          var s1 = rot(w[j - 2], 17) ^ rot(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
        var t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = "";
    for (i = 0; i < 8; i++) out += ("00000000" + (H[i] >>> 0).toString(16)).slice(-8);
    return out;
  }

  root.classList.add("pk-locked");
  var css = doc.createElement("style");
  css.textContent =
    "html.pk-locked,html.pk-locked body{overflow:hidden!important}" +
    "html.pk-locked body>*:not(#pk-gate){visibility:hidden!important}" +
    "#pk-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;" +
    "background:#fff;font:15px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0b1220;visibility:visible!important}" +
    "#pk-gate form{width:min(320px,calc(100vw - 32px));display:flex;flex-direction:column;gap:12px}" +
    "#pk-gate h1{margin:0 0 4px;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none}" +
    "#pk-gate p{margin:0;color:#5b6475;font-size:14px}" +
    "#pk-gate input{height:44px;padding:0 14px;border:1px solid #d5dae3;border-radius:10px;font:inherit;color:inherit;background:#fff;outline:none}" +
    "#pk-gate input:focus{border-color:#0b1220}" +
    "#pk-gate button{height:44px;border:0;border-radius:10px;background:#0b1220;color:#fff;font:inherit;font-weight:600;cursor:pointer}" +
    "#pk-gate .pk-err{color:#c0362c;font-size:13px;min-height:20px}";
  (doc.head || root).appendChild(css);

  function unlock() {
    root.classList.remove("pk-locked");
    var g = doc.getElementById("pk-gate");
    if (g) g.parentNode.removeChild(g);
  }

  window.addEventListener("storage", function (ev) {
    if (ev.key === KEY && ev.newValue === HASH) unlock();
  });

  function mount() {
    if (!root.classList.contains("pk-locked") || doc.getElementById("pk-gate")) return;
    var gate = doc.createElement("div");
    gate.id = "pk-gate";
    gate.innerHTML =
      '<form autocomplete="off">' +
      "<h1>Enter passkey</h1>" +
      "<p>This site is private. Enter the passkey to continue.</p>" +
      '<input type="password" aria-label="Passkey" autofocus>' +
      '<button type="submit">Unlock</button>' +
      '<div class="pk-err" role="alert"></div>' +
      "</form>";
    doc.body.appendChild(gate);
    var form = gate.querySelector("form");
    var input = gate.querySelector("input");
    var err = gate.querySelector(".pk-err");
    input.focus();
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (sha256(input.value.trim()) === HASH) {
        write(HASH);
        unlock();
      } else {
        err.textContent = "Incorrect passkey.";
        input.select();
      }
    });
  }

  if (doc.body) mount();
  else doc.addEventListener("DOMContentLoaded", mount);
})();
