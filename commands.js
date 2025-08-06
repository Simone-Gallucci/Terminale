// Sistema di comandi del terminale
class CommandProcessor {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.processes = [
            { pid: 1, name: 'init', cpu: 0.1, memory: 2.5 },
            { pid: 123, name: 'bash', cpu: 0.2, memory: 1.8 },
            { pid: 456, name: 'firefox', cpu: 15.3, memory: 24.6 },
            { pid: 789, name: 'code', cpu: 8.7, memory: 12.3 }
        ];
    }

    processCommand(input) {
        const trimmedInput = input.trim();
        if (!trimmedInput) return '';

        this.history.push(trimmedInput);
        this.historyIndex = this.history.length;

        // Gestione redirection con >
        if (trimmedInput.includes(' > ')) {
            return this.handleRedirection(trimmedInput);
        }

        // Parsing del comando con pipe support basilare
        const commands = trimmedInput.split('|').map(cmd => cmd.trim());
        let result = '';

        try {
            for (let i = 0; i < commands.length; i++) {
                const parts = this.parseCommand(commands[i]);
                const command = parts[0];
                const args = parts.slice(1);

                if (i === 0) {
                    result = this.executeCommand(command, args);
                } else {
                    result = this.executeCommand(command, args, result);
                }
            }
        } catch (error) {
            result = `bash: ${error.message}`;
        }

        return result;
    }

    handleRedirection(input) {
        const parts = input.split(' > ');
        if (parts.length !== 2) {
            throw new Error('Sintassi redirection non valida');
        }

        const commandPart = parts[0].trim();
        const filePath = parts[1].trim();

        try {
            // Esegui il comando e ottieni l'output
            const commandParts = this.parseCommand(commandPart);
            const command = commandParts[0];
            const args = commandParts.slice(1);
            
            const output = this.executeCommand(command, args);
            
            // Scrivi l'output nel file
            fileSystem.createFile(filePath, output);
            
            return `Output scritto in '${filePath}'`;
        } catch (error) {
            throw new Error(`Redirection fallita: ${error.message}`);
        }
    }

    parseCommand(commandStr) {
        // Parsing basilare che gestisce virgolette
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < commandStr.length; i++) {
            const char = commandStr[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            parts.push(current);
        }

        return parts;
    }

    executeCommand(command, args, pipeInput = null) {
        const commandMap = {
            'ls': this.ls.bind(this),
            'cd': this.cd.bind(this),
            'pwd': this.pwd.bind(this),
            'mkdir': this.mkdir.bind(this),
            'touch': this.touch.bind(this),
            'rm': this.rm.bind(this),
            'rmdir': this.rmdir.bind(this),
            'cp': this.cp.bind(this),
            'mv': this.mv.bind(this),
            'cat': this.cat.bind(this),
            'echo': this.echo.bind(this),
            'grep': this.grep.bind(this),
            'find': this.find.bind(this),
            'head': this.head.bind(this),
            'tail': this.tail.bind(this),
            'wc': this.wc.bind(this),
            'sort': this.sort.bind(this),
            'uniq': this.uniq.bind(this),
            'ps': this.ps.bind(this),
            'whoami': this.whoami.bind(this),
            'date': this.date.bind(this),
            'clear': this.clear.bind(this),
            'help': this.help.bind(this),
            'man': this.man.bind(this),
            'history': this.historyCommand.bind(this),
            'which': this.which.bind(this),
            'file': this.file.bind(this),
            'du': this.du.bind(this),
            'df': this.df.bind(this),
            'uptime': this.uptime.bind(this),
            'uname': this.uname.bind(this),
            'nano': this.nano.bind(this),
            'reset-fs': this.resetFileSystem.bind(this),
            'debug-fs': this.debugFileSystem.bind(this),
            'export-fs': this.exportFileSystem.bind(this),
            'import-fs': this.importFileSystem.bind(this),
            'exit': this.exit.bind(this)
        };

        if (commandMap[command]) {
            const result = commandMap[command](args, pipeInput);
            return result;
        } else {
            throw new Error(`${command}: comando non trovato`);
        }
    }

    // Comandi di navigazione
    ls(args) {
        const options = { long: false, all: false, human: false };
        let path = fileSystem.getCurrentPath();

        // Parse delle opzioni
        for (const arg of args) {
            if (arg.startsWith('-')) {
                if (arg.includes('l')) options.long = true;
                if (arg.includes('a')) options.all = true;
                if (arg.includes('h')) options.human = true;
            } else {
                path = arg;
            }
        }

        try {
            const items = fileSystem.listDirectory(path);
            
            if (options.long) {
                let result = `totale ${items.length}\n`;
                items.forEach(item => {
                    const size = options.human ? this.humanReadableSize(item.size) : item.size;
                    const date = item.modified.toLocaleDateString('it-IT');
                    result += `${item.permissions} 1 ${item.owner} ${item.group} ${size.toString().padStart(8)} ${date} ${item.name}\n`;
                });
                return result.trim();
            } else {
                return items.map(item => {
                    const className = item.type === 'directory' ? 'output-directory' : 
                                    item.permissions.includes('x') ? 'output-executable' : 'output-file';
                    return `<span class="${className}">${item.name}</span>`;
                }).join('  ');
            }
        } catch (error) {
            throw new Error(`ls: ${error.message}`);
        }
    }

    cd(args) {
        const path = args[0] || '/home/user';
        try {
            const newPath = fileSystem.changeDirectory(path);
            // Aggiorna il prompt
            this.updatePrompt();
            return '';
        } catch (error) {
            throw new Error(`cd: ${error.message}`);
        }
    }

    pwd() {
        return fileSystem.getCurrentPath();
    }

    // Comandi di gestione file
    mkdir(args) {
        if (args.length === 0) {
            throw new Error('mkdir: operando mancante');
        }

        const results = [];
        for (const path of args) {
            try {
                fileSystem.createDirectory(path);
                results.push(`Directory '${path}' creata`);
            } catch (error) {
                results.push(`mkdir: ${error.message}`);
            }
        }
        return results.join('\n');
    }

    touch(args) {
        if (args.length === 0) {
            throw new Error('touch: operando mancante');
        }

        const results = [];
        for (const path of args) {
            try {
                fileSystem.createFile(path, '');
                results.push(`File '${path}' creato`);
            } catch (error) {
                results.push(`touch: ${error.message}`);
            }
        }
        return results.join('\n');
    }

    rm(args) {
        if (args.length === 0) {
            throw new Error('rm: operando mancante');
        }

        const recursive = args.includes('-r') || args.includes('-rf');
        const force = args.includes('-f') || args.includes('-rf');
        const files = args.filter(arg => !arg.startsWith('-'));

        const results = [];
        for (const path of files) {
            try {
                const node = fileSystem.getNode(path);
                if (!node) {
                    if (!force) {
                        results.push(`rm: '${path}' non trovato`);
                    }
                    continue;
                }
                
                if (node.type === 'directory' && !recursive) {
                    results.push(`rm: '${path}' è una directory (usa -r per rimuovere ricorsivamente)`);
                    continue;
                }
                
                fileSystem.removeNode(path);
                results.push(`'${path}' rimosso`);
            } catch (error) {
                if (!force) {
                    results.push(`rm: ${error.message}`);
                }
            }
        }
        return results.join('\n');
    }

    rmdir(args) {
        if (args.length === 0) {
            throw new Error('rmdir: operando mancante');
        }

        const results = [];
        for (const path of args) {
            try {
                const node = fileSystem.getNode(path);
                if (!node) {
                    results.push(`rmdir: '${path}' non trovato`);
                    continue;
                }
                
                if (node.type !== 'directory') {
                    results.push(`rmdir: '${path}' non è una directory`);
                    continue;
                }
                
                // Controlla se la directory è vuota
                if (Object.keys(node.content).length > 0) {
                    results.push(`rmdir: '${path}' directory non vuota`);
                    continue;
                }
                
                fileSystem.removeNode(path);
                results.push(`Directory '${path}' rimossa`);
            } catch (error) {
                results.push(`rmdir: ${error.message}`);
            }
        }
        return results.join('\n');
    }

    cp(args) {
        if (args.length < 2) {
            throw new Error('cp: operandi mancanti');
        }

        const source = args[0];
        const dest = args[1];

        try {
            const content = fileSystem.getFileContent(source);
            fileSystem.createFile(dest, content);
            return `'${source}' copiato in '${dest}'`;
        } catch (error) {
            throw new Error(`cp: ${error.message}`);
        }
    }

    mv(args) {
        if (args.length < 2) {
            throw new Error('mv: operandi mancanti');
        }

        const source = args[0];
        const dest = args[1];

        try {
            fileSystem.moveNode(source, dest);
            return `'${source}' spostato in '${dest}'`;
        } catch (error) {
            throw new Error(`mv: ${error.message}`);
        }
    }

    // Comandi di lettura file
    cat(args, pipeInput) {
        if (pipeInput) {
            return pipeInput;
        }

        if (args.length === 0) {
            throw new Error('cat: operando mancante');
        }

        const results = [];
        for (const path of args) {
            try {
                const content = fileSystem.getFileContent(path);
                results.push(content);
            } catch (error) {
                results.push(`cat: ${error.message}`);
            }
        }
        return results.join('\n');
    }

    echo(args) {
        return args.join(' ');
    }

    grep(args, pipeInput) {
        if (args.length === 0) {
            throw new Error('grep: pattern mancante');
        }

        const pattern = args[0];
        const regex = new RegExp(pattern, 'i');

        if (pipeInput) {
            return pipeInput.split('\n')
                .filter(line => regex.test(line))
                .join('\n');
        }

        if (args.length < 2) {
            throw new Error('grep: file mancante');
        }

        const results = [];
        for (let i = 1; i < args.length; i++) {
            try {
                const content = fileSystem.getFileContent(args[i]);
                const matches = content.split('\n')
                    .filter(line => regex.test(line));
                
                if (matches.length > 0) {
                    results.push(matches.join('\n'));
                }
            } catch (error) {
                results.push(`grep: ${error.message}`);
            }
        }
        return results.join('\n');
    }

    find(args) {
        const name = args.includes('-name') ? args[args.indexOf('-name') + 1] : null;
        const path = args.find(arg => !arg.startsWith('-') && arg !== name) || fileSystem.getCurrentPath();

        try {
            if (name) {
                const results = fileSystem.findFiles(name.replace(/['"]/g, ''), path);
                return results.join('\n');
            } else {
                throw new Error('find: opzioni non supportate');
            }
        } catch (error) {
            throw new Error(`find: ${error.message}`);
        }
    }

    head(args, pipeInput) {
        const lines = parseInt(args.find(arg => !isNaN(parseInt(arg)))) || 10;
        
        if (pipeInput) {
            return pipeInput.split('\n').slice(0, lines).join('\n');
        }

        const file = args.find(arg => !arg.startsWith('-') && isNaN(parseInt(arg)));
        if (!file) {
            throw new Error('head: file mancante');
        }

        try {
            const content = fileSystem.getFileContent(file);
            return content.split('\n').slice(0, lines).join('\n');
        } catch (error) {
            throw new Error(`head: ${error.message}`);
        }
    }

    tail(args, pipeInput) {
        const lines = parseInt(args.find(arg => !isNaN(parseInt(arg)))) || 10;
        
        if (pipeInput) {
            const inputLines = pipeInput.split('\n');
            return inputLines.slice(-lines).join('\n');
        }

        const file = args.find(arg => !arg.startsWith('-') && isNaN(parseInt(arg)));
        if (!file) {
            throw new Error('tail: file mancante');
        }

        try {
            const content = fileSystem.getFileContent(file);
            const contentLines = content.split('\n');
            return contentLines.slice(-lines).join('\n');
        } catch (error) {
            throw new Error(`tail: ${error.message}`);
        }
    }

    wc(args, pipeInput) {
        let input = pipeInput;
        
        if (!input) {
            if (args.length === 0) {
                throw new Error('wc: operando mancante');
            }
            try {
                input = fileSystem.getFileContent(args[0]);
            } catch (error) {
                throw new Error(`wc: ${error.message}`);
            }
        }

        const lines = input.split('\n').length;
        const words = input.split(/\s+/).filter(word => word.length > 0).length;
        const chars = input.length;

        return `${lines.toString().padStart(8)} ${words.toString().padStart(8)} ${chars.toString().padStart(8)}`;
    }

    sort(args, pipeInput) {
        if (!pipeInput && args.length === 0) {
            throw new Error('sort: operando mancante');
        }

        let input = pipeInput;
        if (!input) {
            try {
                input = fileSystem.getFileContent(args[0]);
            } catch (error) {
                throw new Error(`sort: ${error.message}`);
            }
        }

        return input.split('\n').sort().join('\n');
    }

    uniq(args, pipeInput) {
        if (!pipeInput && args.length === 0) {
            throw new Error('uniq: operando mancante');
        }

        let input = pipeInput;
        if (!input) {
            try {
                input = fileSystem.getFileContent(args[0]);
            } catch (error) {
                throw new Error(`uniq: ${error.message}`);
            }
        }

        const lines = input.split('\n');
        const unique = [];
        let prev = null;

        for (const line of lines) {
            if (line !== prev) {
                unique.push(line);
                prev = line;
            }
        }

        return unique.join('\n');
    }

    // Comandi di sistema
    ps() {
        let result = 'PID    COMMAND         %CPU  %MEM\n';
        this.processes.forEach(proc => {
            result += `${proc.pid.toString().padStart(6)} ${proc.name.padEnd(15)} ${proc.cpu.toFixed(1).padStart(5)} ${proc.memory.toFixed(1).padStart(5)}\n`;
        });
        return result.trim();
    }

    whoami() {
        return 'user';
    }

    date() {
        return new Date().toString();
    }

    clear() {
        return 'CLEAR_SCREEN';
    }

    help() {
        return `Comandi disponibili nel simulatore di terminale Linux:

NAVIGAZIONE:
  ls [opzioni] [dir]    Lista file e directory (-l per dettagli, -a per nascosti)
  cd [directory]        Cambia directory corrente
  pwd                   Mostra directory corrente
  find -name pattern    Cerca file per nome

GESTIONE FILE:
  mkdir directory       Crea una directory
  touch file           Crea un file vuoto
  rm file              Rimuovi file (-r per directory, -f per forzare)
  rmdir directory      Rimuovi directory vuota
  cp source dest       Copia file
  mv source dest       Sposta/rinomina file

CONTENUTO FILE:
  cat file             Mostra contenuto file
  echo text            Stampa testo
  grep pattern file    Cerca pattern in file
  head [-n] file       Mostra prime righe (default 10)
  tail [-n] file       Mostra ultime righe (default 10)
  wc file              Conta righe, parole, caratteri
  sort file            Ordina righe
  uniq file            Rimuovi righe duplicate
  nano file            Apri editor di testo

SISTEMA:
  ps                   Mostra processi attivi
  whoami               Mostra utente corrente
  date                 Mostra data e ora
  history              Mostra cronologia comandi
  which command        Mostra percorso comando
  file filename        Mostra tipo file
  du [dir]             Mostra utilizzo disco
  df                   Mostra filesystem
  uptime               Mostra tempo di attività
  uname                Mostra informazioni sistema

UTILITÀ:
  clear                Pulisci schermo
  help                 Mostra questo aiuto
  man command          Mostra manuale comando
  reset-fs             Resetta file system allo stato iniziale
  exit                 Salva automaticamente e chiudi sessione

BACKUP/RIPRISTINO:
  export-fs            Esporta file system come file JSON
  import-fs            Importa file system da file JSON
  debug-fs             Mostra informazioni di debug

PIPE E REDIRECTION:
  Usa | per collegare comandi: cat file | grep pattern
  Esempio: ls -l | grep txt | sort`;
    }

    man(args) {
        if (args.length === 0) {
            return 'man: quale pagina di manuale?';
        }

        const manPages = {
            'ls': 'LS(1)\nNOME\n    ls - lista contenuti directory\n\nSINOSSI\n    ls [OPZIONI] [FILE...]\n\nDESCRIZIONE\n    Lista informazioni sui FILE (directory corrente per default).\n\nOPZIONI\n    -l  usa formato lungo\n    -a  non nascondere voci che iniziano con .\n    -h  dimensioni in formato leggibile',
            'cd': 'CD(1)\nNOME\n    cd - cambia directory di lavoro\n\nSINOSSI\n    cd [DIRECTORY]\n\nDESCRIZIONE\n    Cambia la directory di lavoro corrente.',
            'cat': 'CAT(1)\nNOME\n    cat - concatena file e stampa su output standard\n\nSINOSSI\n    cat [FILE...]\n\nDESCRIZIONE\n    Concatena FILE(s) e stampa su output standard.',
            'grep': 'GREP(1)\nNOME\n    grep - stampa righe che corrispondono a pattern\n\nSINOSSI\n    grep PATTERN [FILE...]\n\nDESCRIZIONE\n    Cerca PATTERN in ogni FILE e stampa righe corrispondenti.',
            'nano': 'NANO(1)\nNOME\n    nano - editor di testo semplice\n\nSINOSSI\n    nano [FILE]\n\nDESCRIZIONE\n    nano è un editor di testo semplice da usare.\n\nSCORCIATOIE\n    Ctrl+X  Esci\n    Ctrl+O  Salva\n    Ctrl+G  Aiuto\n    Ctrl+W  Cerca\n    Ctrl+K  Taglia riga\n    Ctrl+U  Incolla riga',
            'export-fs': 'EXPORT-FS(1)\nNOME\n    export-fs - esporta file system come file JSON\n\nSINOSSI\n    export-fs\n\nDESCRIZIONE\n    Esporta l\'intero file system virtuale in un file JSON che può essere scaricato e salvato localmente.',
            'import-fs': 'IMPORT-FS(1)\nNOME\n    import-fs - importa file system da file JSON\n\nSINOSSI\n    import-fs\n\nDESCRIZIONE\n    Importa un file system precedentemente esportato da un file JSON. Sostituisce completamente il file system corrente.',
            'exit': 'EXIT(1)\nNOME\n    exit - salva automaticamente e chiudi sessione\n\nSINOSSI\n    exit\n\nDESCRIZIONE\n    Salva automaticamente il file system corrente come backup JSON, lo scarica e chiude la sessione del terminale.'
        };

        return manPages[args[0]] || `Nessuna voce di manuale per ${args[0]}`;
    }

    historyCommand() {
        return this.history.map((cmd, index) => `${(index + 1).toString().padStart(4)} ${cmd}`).join('\n');
    }

    which(args) {
        if (args.length === 0) {
            throw new Error('which: operando mancante');
        }
        
        const commands = ['ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'cat', 'echo', 'grep', 'find', 'nano'];
        return commands.includes(args[0]) ? `/bin/${args[0]}` : `${args[0]}: non trovato`;
    }

    file(args) {
        if (args.length === 0) {
            throw new Error('file: operando mancante');
        }

        try {
            const node = fileSystem.getNode(args[0]);
            if (!node) {
                throw new Error('file non trovato');
            }
            
            if (node.type === 'directory') {
                return `${args[0]}: directory`;
            } else {
                const content = node.content;
                if (content.includes('#!/bin/bash')) {
                    return `${args[0]}: script Bash`;
                } else if (content.includes('<html>')) {
                    return `${args[0]}: documento HTML`;
                } else {
                    return `${args[0]}: file di testo ASCII`;
                }
            }
        } catch (error) {
            throw new Error(`file: ${error.message}`);
        }
    }

    du(args) {
        const path = args[0] || fileSystem.getCurrentPath();
        try {
            const node = fileSystem.getNode(path);
            if (!node) {
                throw new Error('percorso non trovato');
            }
            
            if (node.type === 'file') {
                return `${Math.ceil(node.size / 1024)}\t${path}`;
            } else {
                let total = 4; // Directory size
                const items = Object.values(node.content);
                for (const item of items) {
                    total += item.type === 'file' ? Math.ceil(item.size / 1024) : 4;
                }
                return `${total}\t${path}`;
            }
        } catch (error) {
            throw new Error(`du: ${error.message}`);
        }
    }

    df() {
        return `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       20971520 5242880  15728640  26% /
tmpfs            2097152       0   2097152   0% /tmp
/dev/sda2       10485760 1048576   9437184  10% /home`;
    }

    uptime() {
        const uptime = Math.floor(Math.random() * 86400); // Random uptime
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        return ` ${new Date().toLocaleTimeString()} up ${hours}:${minutes.toString().padStart(2, '0')}, 1 user, load average: 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}`;
    }

    uname(args) {
        if (args.includes('-a')) {
            return 'Linux simulator 5.4.0-42-generic #46-Ubuntu SMP Fri Jul 10 00:24:02 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux';
        }
        return 'Linux';
    }

    nano(args) {
        if (args.length === 0) {
            throw new Error('nano: operando mancante');
        }

        const filePath = args[0];
        
        // Trigger per aprire l'editor nano
        if (window.terminal) {
            window.terminal.openNanoEditor(filePath);
            return 'NANO_EDITOR_OPENED';
        }
        
        throw new Error('nano: errore nell\'aprire l\'editor');
    }

    resetFileSystem() {
        fileSystem.clearFileSystem();
        return 'File system resettato allo stato iniziale. Le modifiche sono state cancellate.';
    }

    debugFileSystem() {
        const saved = localStorage.getItem('linux-simulator-filesystem');
        if (saved) {
            const data = JSON.parse(saved);
            return `File system salvato il: ${data.timestamp}\nDirectory corrente: ${data.currentPath}\nControlla la console del browser per dettagli completi.`;
        }
        return 'Nessun file system salvato trovato.';
    }

    exportFileSystem() {
        try {
            const data = {
                root: fileSystem.root,
                currentPath: fileSystem.currentPath,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `linux-filesystem-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return `File system esportato come: ${a.download}`;
        } catch (error) {
            throw new Error(`Errore nell'esportazione: ${error.message}`);
        }
    }

    importFileSystem() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            return new Promise((resolve) => {
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (!file) {
                        resolve('Importazione annullata.');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            
                            // Validazione base
                            if (!data.root || !data.currentPath) {
                                resolve('File non valido: mancano dati essenziali.');
                                return;
                            }
                            
                            // Ripristina le date
                            fileSystem.restoreDates(data.root);
                            
                            // Carica i dati
                            fileSystem.root = data.root;
                            fileSystem.currentPath = data.currentPath;
                            
                            // Salva nel localStorage
                            fileSystem.saveFileSystem();
                            
                            // Aggiorna il prompt
                            if (window.terminal) {
                                window.terminal.updatePrompt();
                            }
                            
                            resolve(`File system importato con successo!\nData backup: ${data.timestamp || 'N/A'}\nDirectory corrente: ${data.currentPath}`);
                        } catch (error) {
                            resolve(`Errore nel parsing del file: ${error.message}`);
                        }
                    };
                    reader.readAsText(file);
                };
                
                input.click();
            });
        } catch (error) {
            throw new Error(`Errore nell'importazione: ${error.message}`);
        }
    }

    exit() {
        try {
            // Salva automaticamente il file system
            const data = {
                root: fileSystem.root,
                currentPath: fileSystem.currentPath,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'linux-filesystem-backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Mostra messaggio di chiusura
            setTimeout(() => {
                if (window.terminal) {
                    window.terminal.showExitMessage();
                }
            }, 500);
            
            return 'File system salvato. Download in corso...';
        } catch (error) {
            throw new Error(`Errore nel salvataggio: ${error.message}`);
        }
    }

    // Utility functions
    humanReadableSize(bytes) {
        const sizes = ['B', 'K', 'M', 'G'];
        let size = bytes;
        let unit = 0;
        
        while (size >= 1024 && unit < sizes.length - 1) {
            size /= 1024;
            unit++;
        }
        
        return `${Math.round(size * 10) / 10}${sizes[unit]}`;
    }

    updatePrompt() {
        const currentPath = fileSystem.getCurrentPath();
        const displayPath = currentPath.replace('/home/user', '~');
        document.getElementById('prompt').textContent = `user@linux:${displayPath}$ `;
    }

    getHistory() {
        return this.history;
    }

    getHistoryItem(index) {
        return this.history[index] || '';
    }
}

// Istanza globale del processore di comandi
const commandProcessor = new CommandProcessor();
