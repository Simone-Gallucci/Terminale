// Gestione principale del terminale
class Terminal {
    constructor() {
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.historyIndex = -1;
        this.completionOptions = [];
        this.cutBuffer = ''; // Per nano cut/uncut
        
        this.initializeEventListeners();
        this.displayWelcomeMessage();
        this.input.focus();
    }

    initializeEventListeners() {
        this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.input.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Focus sempre sull'input quando si clicca nel terminale
        document.addEventListener('click', (e) => {
            if (e.target.closest('.terminal-container')) {
                this.input.focus();
            }
        });

        // Gestione del pannello di aiuto
        const toggleHelp = document.getElementById('toggle-help');
        const helpPanel = document.querySelector('.help-panel');
        
        toggleHelp.addEventListener('click', () => {
            helpPanel.classList.toggle('open');
        });

        // Chiudi il pannello se si clicca fuori
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.help-panel') && !e.target.closest('.toggle-help')) {
                helpPanel.classList.remove('open');
            }
        });
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.processCommand();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.navigateHistory(-1);
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                this.navigateHistory(1);
                break;
                
            case 'Tab':
                event.preventDefault();
                this.handleTabCompletion();
                break;
                
            case 'c':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.handleCtrlC();
                }
                break;
                
            case 'l':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.clearScreen();
                }
                break;
        }
    }

    handleKeyUp(event) {
        // Reset completion quando l'utente digita
        if (event.key !== 'Tab') {
            this.completionOptions = [];
        }
    }

    processCommand() {
        const command = this.input.value.trim();
        if (!command) return;

        // Mostra il comando nella output
        this.addOutput(`<span class="output-command">${this.getCurrentPrompt()}${command}</span>`);

        try {
            const result = commandProcessor.processCommand(command);
            
            if (result === 'CLEAR_SCREEN') {
                this.clearScreen();
            } else if (result === 'NANO_EDITOR_OPENED') {
                // L'editor è stato aperto, non aggiungere output
            } else if (result) {
                this.addOutput(`<span class="output-result">${result}</span>`);
            }
        } catch (error) {
            this.addOutput(`<span class="output-error">${error.message}</span>`);
        }

        // Pulisci input e resetta history index
        this.input.value = '';
        this.historyIndex = -1;
        
        // Aggiorna il prompt (potrebbe essere cambiato con cd)
        commandProcessor.updatePrompt();
        
        // Scroll in fondo
        this.scrollToBottom();
    }

    navigateHistory(direction) {
        const history = commandProcessor.getHistory();
        
        if (direction === -1) { // Su
            if (this.historyIndex < history.length - 1) {
                this.historyIndex++;
                this.input.value = history[history.length - 1 - this.historyIndex];
            }
        } else { // Giù
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = history[history.length - 1 - this.historyIndex];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.input.value = '';
            }
        }
        
        // Posiziona il cursore alla fine
        this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }

    handleTabCompletion() {
        const inputValue = this.input.value;
        const parts = inputValue.split(' ');
        const lastPart = parts[parts.length - 1];

        if (parts.length === 1) {
            // Completamento comandi
            this.completeCommand(lastPart);
        } else {
            // Completamento percorsi
            this.completePath(lastPart);
        }
    }

    completeCommand(partial) {
        const commands = [
            'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'rmdir', 'cp', 'mv',
            'cat', 'echo', 'grep', 'find', 'head', 'tail', 'wc',
            'sort', 'uniq', 'ps', 'whoami', 'date', 'clear', 'help',
            'man', 'history', 'which', 'file', 'du', 'df', 'uptime', 'uname', 'nano', 'reset-fs'
        ];

        const matches = commands.filter(cmd => cmd.startsWith(partial));
        
        if (matches.length === 1) {
            this.input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            this.showCompletionOptions(matches);
        }
    }

    completePath(partial) {
        try {
            let searchPath = fileSystem.getCurrentPath();
            let searchPattern = partial;

            // Se il path contiene /, determina la directory di ricerca
            if (partial.includes('/')) {
                const lastSlash = partial.lastIndexOf('/');
                const pathPart = partial.substring(0, lastSlash + 1);
                searchPattern = partial.substring(lastSlash + 1);
                
                if (partial.startsWith('/')) {
                    searchPath = pathPart;
                } else {
                    searchPath = fileSystem.resolvePath(pathPart);
                }
            }

            const items = fileSystem.listDirectory(searchPath);
            const matches = items
                .filter(item => item.name.startsWith(searchPattern))
                .map(item => {
                    const prefix = partial.substring(0, partial.lastIndexOf('/') + 1);
                    return prefix + item.name + (item.type === 'directory' ? '/' : '');
                });

            if (matches.length === 1) {
                const inputParts = this.input.value.split(' ');
                inputParts[inputParts.length - 1] = matches[0];
                this.input.value = inputParts.join(' ');
            } else if (matches.length > 1) {
                this.showCompletionOptions(matches.map(match => 
                    match.substring(match.lastIndexOf('/') + 1)
                ));
            }
        } catch (error) {
            // Ignora errori di completamento
        }
    }

    showCompletionOptions(options) {
        this.addOutput(`<span class="output-result">${options.join('  ')}</span>`);
        this.scrollToBottom();
    }

    handleCtrlC() {
        this.addOutput(`<span class="output-command">${this.getCurrentPrompt()}${this.input.value}^C</span>`);
        this.input.value = '';
        this.addOutput(''); // Riga vuota
        this.scrollToBottom();
    }

    clearScreen() {
        this.output.innerHTML = '';
        this.scrollToBottom();
    }

    addOutput(content) {
        const line = document.createElement('div');
        line.className = 'output-line';
        line.innerHTML = content;
        this.output.appendChild(line);
    }

    scrollToBottom() {
        const terminalBody = document.querySelector('.terminal-body');
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    getCurrentPrompt() {
        return document.getElementById('prompt').textContent;
    }

    displayWelcomeMessage() {
        const wasLoaded = fileSystem.root && localStorage.getItem('linux-simulator-filesystem');
        
        const welcomeMessage = `
<span class="output-result">Benvenuto nel Simulatore di Terminale Linux!</span>
<span class="output-result">===============================================</span>
<span class="output-result"></span>
${wasLoaded ? '<span class="output-result">✅ File system precedente caricato - le tue modifiche sono state ripristinate!</span>' : '<span class="output-result">🆕 Nuovo file system inizializzato</span>'}
<span class="output-result"></span>
<span class="output-result">Questo è un ambiente di apprendimento sicuro per praticare i comandi Linux.</span>
<span class="output-result">Non verranno apportate modifiche al tuo sistema reale.</span>
<span class="output-result"></span>
<span class="output-result">💾 <strong>NOVITÀ: Persistenza Automatica!</strong></span>
<span class="output-result">• Tutti i file e cartelle che crei vengono salvati automaticamente</span>
<span class="output-result">• Le modifiche rimangono quando chiudi e riapri il simulatore</span>
<span class="output-result">• Usa <span class="output-executable">reset-fs</span> per resettare tutto allo stato iniziale</span>
<span class="output-result"></span>
<span class="output-result">Comandi utili per iniziare:</span>
<span class="output-result">  • <span class="output-executable">help</span> - Mostra tutti i comandi disponibili</span>
<span class="output-result">  • <span class="output-executable">ls</span> - Lista file e directory</span>
<span class="output-result">  • <span class="output-executable">nano file.txt</span> - Apri editor di testo</span>
<span class="output-result">  • <span class="output-executable">clear</span> - Pulisci lo schermo</span>
<span class="output-result"></span>
<span class="output-result">Suggerimenti:</span>
<span class="output-result">  • Usa TAB per il completamento automatico</span>
<span class="output-result">  • Usa ↑/↓ per navigare nella cronologia</span>
<span class="output-result">  • Usa Ctrl+C per annullare un comando</span>
<span class="output-result">  • Usa Ctrl+L per pulire lo schermo</span>
<span class="output-result">  • Clicca su ? per vedere tutti i comandi disponibili</span>
<span class="output-result"></span>
<span class="output-result">Buon apprendimento!</span>
<span class="output-result"></span>`;

        this.output.innerHTML = welcomeMessage;
        this.scrollToBottom();
    }

    openNanoEditor(filePath) {
        // Crea il contenitore dell'editor
        const editorContainer = document.createElement('div');
        editorContainer.className = 'nano-editor';
        editorContainer.innerHTML = `
            <div class="nano-header">
                <div class="nano-title">GNU nano ${fileSystem.resolvePath(filePath)}</div>
            </div>
            <div class="nano-content">
                <textarea id="nano-textarea" class="nano-textarea" spellcheck="false"></textarea>
                <div class="nano-line-numbers" id="nano-line-numbers"></div>
            </div>
            <div class="nano-footer">
                <div class="nano-shortcuts">
                    <span>^G Get Help</span>
                    <span>^O Write Out</span>
                    <span>^W Where Is</span>
                    <span>^K Cut Text</span>
                    <span>^J Justify</span>
                    <span>^X Exit</span>
                    <span>^R Read File</span>
                    <span>^Y Prev Page</span>
                    <span>^T To Spell</span>
                    <span>^U Uncut Text</span>
                    <span>^C Cur Pos</span>
                    <span>^V Next Page</span>
                </div>
            </div>
        `;

        // Nasconde il terminale e mostra l'editor
        document.querySelector('.terminal-container').style.display = 'none';
        document.querySelector('.help-panel').style.display = 'none';
        document.body.appendChild(editorContainer);

        const textarea = document.getElementById('nano-textarea');
        const lineNumbers = document.getElementById('nano-line-numbers');

        // Carica il contenuto del file se esiste
        try {
            const content = fileSystem.getFileContent(filePath);
            textarea.value = content;
        } catch (error) {
            // File nuovo, lascia vuoto
            textarea.value = '';
        }

        // Aggiorna i numeri di riga
        this.updateLineNumbers(textarea, lineNumbers);

        // Event listeners per l'editor
        textarea.addEventListener('input', () => {
            this.updateLineNumbers(textarea, lineNumbers);
        });

        textarea.addEventListener('scroll', () => {
            lineNumbers.scrollTop = textarea.scrollTop;
        });

        textarea.addEventListener('keydown', (e) => {
            this.handleNanoKeydown(e, filePath, editorContainer);
        });

        // Focus sull'editor
        textarea.focus();
    }

    updateLineNumbers(textarea, lineNumbers) {
        const lines = textarea.value.split('\n');
        const lineNumbersHtml = lines.map((_, index) => 
            `<div class="line-number">${(index + 1).toString().padStart(3)}</div>`
        ).join('');
        lineNumbers.innerHTML = lineNumbersHtml;
    }

    handleNanoKeydown(event, filePath, editorContainer) {
        if (event.ctrlKey) {
            switch (event.key.toLowerCase()) {
                case 'x': // Exit
                    event.preventDefault();
                    this.closeNanoEditor(editorContainer, false);
                    break;
                
                case 'o': // Write Out (Save)
                    event.preventDefault();
                    this.saveNanoFile(filePath, editorContainer);
                    break;
                
                case 'g': // Get Help
                    event.preventDefault();
                    this.showNanoHelp();
                    break;
                
                case 'w': // Where Is (Find)
                    event.preventDefault();
                    this.nanoFind();
                    break;
                
                case 'k': // Cut Text
                    event.preventDefault();
                    this.nanoCutLine(event.target);
                    break;
                
                case 'u': // Uncut Text
                    event.preventDefault();
                    this.nanoUncut(event.target);
                    break;
            }
        }
    }

    saveNanoFile(filePath, editorContainer) {
        const textarea = editorContainer.querySelector('#nano-textarea');
        const content = textarea.value;
        
        try {
            // Controlla se il file esiste già
            const existingNode = fileSystem.getNode(filePath);
            if (existingNode) {
                // Aggiorna il contenuto
                existingNode.content = content;
                existingNode.size = content.length;
                existingNode.modified = new Date();
            } else {
                // Crea nuovo file
                fileSystem.createFile(filePath, content);
            }
            
            // Salva nel localStorage
            fileSystem.saveFileSystem();
            
            // Mostra messaggio di salvataggio
            const statusBar = editorContainer.querySelector('.nano-footer');
            const originalHtml = statusBar.innerHTML;
            statusBar.innerHTML = `<div class="nano-status">[ Wrote ${content.split('\n').length} lines ]</div>`;
            
            setTimeout(() => {
                statusBar.innerHTML = originalHtml;
            }, 2000);
            
        } catch (error) {
            const statusBar = editorContainer.querySelector('.nano-footer');
            const originalHtml = statusBar.innerHTML;
            statusBar.innerHTML = `<div class="nano-status error">[ Error: ${error.message} ]</div>`;
            
            setTimeout(() => {
                statusBar.innerHTML = originalHtml;
            }, 3000);
        }
    }

    closeNanoEditor(editorContainer, saved = true) {
        // Rimuove l'editor
        editorContainer.remove();
        
        // Ripristina il terminale
        document.querySelector('.terminal-container').style.display = 'flex';
        document.querySelector('.help-panel').style.display = 'block';
        
        // Pulisci input e resetta history index
        this.input.value = '';
        this.historyIndex = -1;
        
        // Aggiorna il prompt (potrebbe essere cambiato)
        commandProcessor.updatePrompt();
        
        // Focus sull'input del terminale
        this.input.focus();
        
        // Mostra messaggio di chiusura
        const message = saved ? 'File salvato e editor chiuso' : 'Editor chiuso';
        this.addOutput(`<span class="output-result">[ ${message} ]</span>`);
        this.scrollToBottom();
    }

    showNanoHelp() {
        alert(`GNU nano - Editor di testo

Scorciatoie principali:
Ctrl+X - Esci dall'editor
Ctrl+O - Salva file (Write Out)
Ctrl+G - Mostra questo aiuto
Ctrl+W - Cerca testo
Ctrl+K - Taglia riga
Ctrl+U - Incolla riga

Usa le frecce per navigare nel testo.
Il simbolo ^ indica il tasto Ctrl.`);
    }

    nanoFind() {
        const searchTerm = prompt('Cerca:');
        if (searchTerm) {
            const textarea = document.getElementById('nano-textarea');
            const content = textarea.value;
            const index = content.indexOf(searchTerm);
            
            if (index !== -1) {
                textarea.focus();
                textarea.setSelectionRange(index, index + searchTerm.length);
            } else {
                alert('Testo non trovato');
            }
        }
    }

    nanoCutLine(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const lines = textarea.value.split('\n');
        
        // Trova la riga corrente
        let lineStart = 0;
        let currentLine = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const lineEnd = lineStart + lines[i].length;
            if (start <= lineEnd) {
                currentLine = i;
                break;
            }
            lineStart = lineEnd + 1; // +1 per il \n
        }
        
        // Taglia la riga
        this.cutBuffer = lines[currentLine];
        lines.splice(currentLine, 1);
        textarea.value = lines.join('\n');
        
        // Aggiorna i numeri di riga
        const lineNumbers = document.getElementById('nano-line-numbers');
        this.updateLineNumbers(textarea, lineNumbers);
    }

    nanoUncut(textarea) {
        if (this.cutBuffer) {
            const start = textarea.selectionStart;
            const value = textarea.value;
            
            // Inserisce la riga tagliata
            const before = value.substring(0, start);
            const after = value.substring(start);
            textarea.value = before + this.cutBuffer + '\n' + after;
            
            // Aggiorna i numeri di riga
            const lineNumbers = document.getElementById('nano-line-numbers');
            this.updateLineNumbers(textarea, lineNumbers);
        }
    }
}

// Inizializza il terminale quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal();
});
