(function () {
    const VIEWS = ["resume", "email", "text"];
    const STORE_KEY = "cover-fields";
    const inputs = document.querySelectorAll("[data-input]");
    const navLinks = document.querySelectorAll('nav[aria-label="Resume versions"] a');

    // Opened locally (file://): folder links show a directory listing, so point nav at index.html.
    navLinks.forEach((link) => {
        let href = link.getAttribute("href");
        if (window.location.protocol === "file:" && href.endsWith("/")) href += "index.html";
        link.dataset.base = href;
    });

    // ── Cover letter fields: fill placeholders live, persist per browser ──
    function loadFields() {
        try {
            return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveFields(values) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(values));
        } catch (e) {}
    }

    function readInputs() {
        const values = {};
        inputs.forEach((input) => (values[input.dataset.input] = input.value.trim()));
        return values;
    }

    function renderFields() {
        const values = readInputs();
        document.querySelectorAll("[data-field]").forEach((el) => {
            const value = values[el.dataset.field];
            el.textContent = value || el.dataset.default;
            // Highlight only true placeholders (bracketed defaults)
            el.classList.toggle("ph-empty", !value && el.dataset.default.startsWith("["));
        });
        saveFields(values);
        renderPlainText();
    }

    // ── Text Cover Letter: built from the hidden letter source ──
    function toText(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, " ");
        if (node.nodeName === "BR") return "\n";
        return [...node.childNodes].map(toText).join("");
    }

    function renderPlainText() {
        const body = document.querySelector("[data-letter-source] [data-body]");
        const target = document.getElementById("plain-text");
        if (!body || !target) return;
        const text = [...body.children]
            .map((p) =>
                toText(p)
                    .split("\n")
                    .map((line) => line.trim())
                    .join("\n")
                    .trim()
            )
            .join("\n\n");
        target.textContent = text;
        const words = text.split(/\s+/).filter(Boolean).length;
        const count = document.querySelector("[data-text-count]");
        if (count) count.textContent = `${words} words · ${text.length} characters`;
    }

    // ── Document tabs: resume / email / text; state in URL hash (#email, #text) ──
    let current = "resume";

    function show(view) {
        current = VIEWS.includes(view) ? view : "resume";

        document.querySelectorAll("[data-view-tab]").forEach((tab) => {
            const active = tab.dataset.viewTab === current;
            tab.setAttribute("aria-selected", active);
            tab.tabIndex = active ? 0 : -1;
        });
        document.querySelectorAll("[data-view]").forEach((section) => (section.hidden = section.dataset.view !== current));
        document.querySelectorAll("[data-cover-only]").forEach((el) => (el.hidden = current === "resume"));

        // Switching resume keeps the same view
        const hash = current === "resume" ? "" : `#${current}`;
        navLinks.forEach((link) => link.setAttribute("href", link.dataset.base + hash));
        if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname + location.search);
    }

    document.querySelectorAll("[data-view-tab]").forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.viewTab)));

    document.querySelectorAll('[role="tablist"]').forEach((list) => {
        list.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            const step = event.key === "ArrowRight" ? 1 : VIEWS.length - 1;
            const next = VIEWS[(VIEWS.indexOf(current) + step) % VIEWS.length];
            show(next);
            list.querySelector(`[data-view-tab="${next}"]`)?.focus();
        });
    });

    window.addEventListener("hashchange", () => show(location.hash.slice(1)));

    // ── Copy buttons (email subject/body, plain text) ──
    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        if (!ok) throw new Error("copy failed");
    }

    function flashCopied(button) {
        const label = button.querySelector("[data-copy-label]");
        label.textContent = "Copied!";
        clearTimeout(button._timer);
        button._timer = setTimeout(() => (label.textContent = label.dataset.copyLabel), 2000);
    }

    document.addEventListener("click", async (event) => {
        if (event.target.closest('[data-action="print"]')) {
            window.print();
            return;
        }
        const button = event.target.closest("[data-copy-target]");
        if (!button) return;
        const text = document.getElementById(button.dataset.copyTarget).innerText.replace(/\n{3,}/g, "\n\n").trim();
        try {
            await copyText(text);
            flashCopied(button);
        } catch (e) {
            window.prompt("Copy this text:", text);
        }
    });

    // ── Init ──
    const saved = loadFields();
    inputs.forEach((input) => {
        input.value = saved[input.dataset.input] || "";
        input.addEventListener("input", renderFields);
    });
    show(location.hash.slice(1));
    renderFields();
})();
