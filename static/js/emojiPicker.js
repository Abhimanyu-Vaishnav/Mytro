// static/js/emojiPicker.js

class EmojiPicker {
    constructor(triggerElement, targetInput) {
        this.triggerElement = triggerElement;
        this.targetInput = targetInput;
        this.emojiCategories = {
            'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
            'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
            'Hands': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪'],
            'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠']
        };
        
        this.init();
    }

    init() {
        this.createPicker();
        this.bindEvents();
    }

    createPicker() {
        // Create emoji picker container
        this.picker = document.createElement('div');
        this.picker.className = 'emoji-picker';
        this.picker.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 10px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
        `;

        // Add category tabs
        const tabs = document.createElement('div');
        tabs.className = 'emoji-tabs';
        tabs.style.cssText = `
            display: flex;
            gap: 5px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        `;

        Object.keys(this.emojiCategories).forEach(category => {
            const tab = document.createElement('button');
            tab.textContent = category;
            tab.className = 'emoji-tab';
            tab.style.cssText = `
                padding: 5px 10px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 5px;
                font-size: 12px;
            `;
            tab.onclick = () => this.showCategory(category);
            tabs.appendChild(tab);
        });

        this.picker.appendChild(tabs);

        // Add emoji container
        this.emojiContainer = document.createElement('div');
        this.emojiContainer.className = 'emoji-container';
        this.emojiContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
        `;
        this.picker.appendChild(this.emojiContainer);

        // Show first category by default
        this.showCategory('Smileys');

        document.body.appendChild(this.picker);
    }

    showCategory(category) {
        this.emojiContainer.innerHTML = '';
        
        this.emojiCategories[category].forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.textContent = emoji;
            emojiButton.className = 'emoji-btn';
            emojiButton.style.cssText = `
                font-size: 20px;
                border: none;
                background: none;
                cursor: pointer;
                padding: 5px;
                border-radius: 5px;
                transition: background-color 0.2s;
            `;
            emojiButton.onmouseover = () => emojiButton.style.backgroundColor = '#f0f0f0';
            emojiButton.onmouseout = () => emojiButton.style.backgroundColor = 'transparent';
            emojiButton.onclick = () => this.insertEmoji(emoji);
            
            this.emojiContainer.appendChild(emojiButton);
        });
    }

    insertEmoji(emoji) {
        const input = this.targetInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
        
        // Trigger input event for live updates
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        this.hide();
    }

    bindEvents() {
        // Show picker when trigger is clicked
        this.triggerElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // Hide picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.picker.contains(e.target) && e.target !== this.triggerElement) {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.picker.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        const rect = this.triggerElement.getBoundingClientRect();
        this.picker.style.top = (rect.bottom + window.scrollY) + 'px';
        this.picker.style.left = (rect.left + window.scrollX) + 'px';
        this.picker.style.display = 'grid';
    }

    hide() {
        this.picker.style.display = 'none';
    }
}

// Usage: new EmojiPicker(triggerElement, targetInputElement);