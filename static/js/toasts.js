(function(){
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);

    window.showToast = function(message, type='info', timeout=3000){
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(()=>{
            el.style.opacity = '0';
            setTimeout(()=> el.remove(), 400);
        }, timeout);
    }

    // Promise-based non-blocking prompt modal
    window.showPrompt = function(title, options = {}){
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'prompt-modal';
            modal.setAttribute('role','dialog');
            modal.setAttribute('aria-modal','true');
            modal.innerHTML = `
                <div class="prompt-backdrop"></div>
                <div class="prompt-panel">
                    <h3 class="prompt-title">${escapeHtml(title || '')}</h3>
                    <textarea class="prompt-input" placeholder="${escapeHtml(options.placeholder || '')}"></textarea>
                    <div class="prompt-actions">
                        <button class="prompt-cancel">Cancel</button>
                        <button class="prompt-ok">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const input = modal.querySelector('.prompt-input');
            const btnOk = modal.querySelector('.prompt-ok');
            const btnCancel = modal.querySelector('.prompt-cancel');

            // focus
            setTimeout(()=> input.focus(), 50);

            function cleanup(val){
                modal.remove();
                resolve(val);
            }

            btnCancel.addEventListener('click', ()=> cleanup(null));
            btnOk.addEventListener('click', ()=> cleanup(input.value));

            modal.addEventListener('keydown', (e)=>{
                if(e.key === 'Escape') cleanup(null);
                if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) cleanup(input.value);
            });
            // click outside to cancel
            modal.querySelector('.prompt-backdrop').addEventListener('click', ()=> cleanup(null));
        });
    }

    function escapeHtml(unsafe) {
        return String(unsafe).replace(/[&<"'`=\/]/g, function (s) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '`': '&#96;',
                '=': '&#61;',
                '/': '&#x2F;'
            })[s];
        });
    }

})();
