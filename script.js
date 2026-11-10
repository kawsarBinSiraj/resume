(function () {
    function flash(button, text) {
        const label = button.querySelector("[data-label]");
        const original = label.dataset.label;
        label.textContent = text;
        clearTimeout(button._resetTimer);
        button._resetTimer = setTimeout(() => (label.textContent = original), 2000);
    }

    async function copyLink(button) {
        const url = window.location.href.split("#")[0];
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback for non-secure contexts (file://, plain http)
                const input = document.createElement("textarea");
                input.value = url;
                input.setAttribute("readonly", "");
                input.style.position = "fixed";
                input.style.opacity = "0";
                document.body.appendChild(input);
                input.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(input);
                if (!ok) throw new Error("copy failed");
            }
            flash(button, "Link Copied!");
        } catch (err) {
            window.prompt("Copy this link:", url);
        }
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        if (button.dataset.action === "copy-link") copyLink(button);
        if (button.dataset.action === "print") window.print();
    });
})();
