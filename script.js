(function () {
    function setCopied(button, copied) {
        const label = button.querySelector("[data-label]");
        label.textContent = copied ? "Link Copied!" : label.dataset.label;
        button.querySelector('[data-icon="default"]')?.classList.toggle("hidden", copied);
        button.querySelector('[data-icon="copied"]')?.classList.toggle("hidden", !copied);
        button.classList.toggle("text-gray-800", !copied);
        button.classList.toggle("text-green-600", copied);
    }

    function flash(button) {
        setCopied(button, true);
        clearTimeout(button._resetTimer);
        button._resetTimer = setTimeout(() => setCopied(button, false), 2000);
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
            flash(button);
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
