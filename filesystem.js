// Sistema di file virtuale
class FileSystem {
    constructor() {
        this.root = {
            type: 'directory',
            name: '/',
            content: {},
            permissions: 'drwxr-xr-x',
            owner: 'root',
            group: 'root',
            size: 4096,
            modified: new Date()
        };
        
        this.currentPath = '/home/user';
        this.storageKey = 'linux-simulator-filesystem';
        
        // Carica il file system salvato o inizializza uno nuovo
        this.loadFileSystem();
    }

    initializeFileSystem() {
        // Crea struttura di directory tipica di Linux
        this.createDirectory('/home');
        this.createDirectory('/home/user');
        this.createDirectory('/home/user/Documents');
        this.createDirectory('/home/user/Downloads');
        this.createDirectory('/home/user/Pictures');
        this.createDirectory('/home/user/Music');
        this.createDirectory('/home/user/Videos');
        this.createDirectory('/etc');
        this.createDirectory('/var');
        this.createDirectory('/var/log');
        this.createDirectory('/usr');
        this.createDirectory('/usr/bin');
        this.createDirectory('/tmp');
        this.createDirectory('/bin');
        this.createDirectory('/sbin');
        this.createDirectory('/dev');
        this.createDirectory('/proc');
        this.createDirectory('/sys');

        // Crea alcuni file di esempio
        this.createFile('/home/user/welcome.txt', 'Benvenuto nel simulatore di terminale Linux!\nQuesto è un ambiente di apprendimento sicuro.\n\nProva alcuni comandi:\n- ls per vedere i file\n- cd per cambiare directory\n- cat per leggere questo file\n- help per vedere tutti i comandi disponibili');
        
        this.createFile('/home/user/Documents/esempio.txt', 'Questo è un file di esempio nella cartella Documents.');
        this.createFile('/home/user/Documents/note.md', '# Note\n\n- Questo è un file markdown\n- Puoi usare grep per cercare testo\n- Prova: grep "markdown" note.md');
        
        this.createFile('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\n');
        this.createFile('/etc/hosts', '127.0.0.1 localhost\n::1 localhost\n');
        
        this.createFile('/var/log/system.log', '2024-01-01 10:00:00 System started\n2024-01-01 10:01:00 User logged in\n2024-01-01 10:02:00 Network connected\n');
    }

    resolvePath(path) {
        if (path.startsWith('/')) {
            return this.normalizePath(path);
        } else {
            return this.normalizePath(this.currentPath + '/' + path);
        }
    }

    normalizePath(path) {
        const parts = path.split('/').filter(part => part !== '');
        const resolved = [];
        
        for (const part of parts) {
            if (part === '..') {
                resolved.pop();
            } else if (part !== '.') {
                resolved.push(part);
            }
        }
        
        return '/' + resolved.join('/');
    }

    getNode(path) {
        const normalizedPath = this.resolvePath(path);
        const parts = normalizedPath.split('/').filter(part => part !== '');
        
        let current = this.root;
        for (const part of parts) {
            if (current.type !== 'directory' || !current.content[part]) {
                return null;
            }
            current = current.content[part];
        }
        return current;
    }

    createDirectory(path) {
        const normalizedPath = this.resolvePath(path);
        const parts = normalizedPath.split('/').filter(part => part !== '');
        const dirName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parent = this.getNode(parentPath);
        if (!parent || parent.type !== 'directory') {
            throw new Error('Directory padre non trovata');
        }
        
        if (parent.content[dirName]) {
            throw new Error('Directory già esistente');
        }
        
        parent.content[dirName] = {
            type: 'directory',
            name: dirName,
            content: {},
            permissions: 'drwxr-xr-x',
            owner: 'user',
            group: 'user',
            size: 4096,
            modified: new Date()
        };
        
        this.saveFileSystem(); // Salva automaticamente
        return true;
    }

    createFile(path, content = '') {
        const normalizedPath = this.resolvePath(path);
        const parts = normalizedPath.split('/').filter(part => part !== '');
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parent = this.getNode(parentPath);
        if (!parent || parent.type !== 'directory') {
            throw new Error('Directory padre non trovata');
        }
        
        parent.content[fileName] = {
            type: 'file',
            name: fileName,
            content: content,
            permissions: '-rw-r--r--',
            owner: 'user',
            group: 'user',
            size: content.length,
            modified: new Date()
        };
        
        this.saveFileSystem(); // Salva automaticamente
        return true;
    }

    removeNode(path) {
        const normalizedPath = this.resolvePath(path);
        const parts = normalizedPath.split('/').filter(part => part !== '');
        const itemName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parent = this.getNode(parentPath);
        if (!parent || parent.type !== 'directory' || !parent.content[itemName]) {
            throw new Error('File o directory non trovata');
        }
        
        delete parent.content[itemName];
        this.saveFileSystem(); // Salva automaticamente
        return true;
    }

    moveNode(sourcePath, destPath) {
        const sourceNode = this.getNode(sourcePath);
        if (!sourceNode) {
            throw new Error('File sorgente non trovato');
        }
        
        // Copia il nodo
        this.createFile(destPath, sourceNode.content || '');
        const destNode = this.getNode(destPath);
        if (destNode) {
            destNode.type = sourceNode.type;
            destNode.permissions = sourceNode.permissions;
            destNode.content = sourceNode.content;
        }
        
        // Rimuovi il nodo originale
        this.removeNode(sourcePath);
        this.saveFileSystem(); // Salva automaticamente
        return true;
    }

    listDirectory(path = this.currentPath) {
        const node = this.getNode(path);
        if (!node || node.type !== 'directory') {
            throw new Error('Non è una directory');
        }
        
        return Object.values(node.content);
    }

    changeDirectory(path) {
        const newPath = this.resolvePath(path);
        const node = this.getNode(newPath);
        
        if (!node) {
            throw new Error('Directory non trovata');
        }
        
        if (node.type !== 'directory') {
            throw new Error('Non è una directory');
        }
        
        this.currentPath = newPath === '/' ? '/' : newPath;
        this.saveFileSystem(); // Salva anche il cambio di directory
        return this.currentPath;
    }

    getCurrentPath() {
        return this.currentPath;
    }

    getFileContent(path) {
        const node = this.getNode(path);
        if (!node) {
            throw new Error('File non trovato');
        }
        
        if (node.type !== 'file') {
            throw new Error('Non è un file');
        }
        
        return node.content;
    }

    findFiles(pattern, searchPath = this.currentPath) {
        const results = [];
        
        const search = (node, currentPath) => {
            if (node.type === 'file') {
                if (node.name.includes(pattern) || currentPath.includes(pattern)) {
                    results.push(currentPath);
                }
            } else if (node.type === 'directory') {
                for (const [name, child] of Object.entries(node.content)) {
                    search(child, currentPath === '/' ? '/' + name : currentPath + '/' + name);
                }
            }
        };
        
        const startNode = this.getNode(searchPath);
        if (startNode) {
            search(startNode, searchPath);
        }
        
        return results;
    }

    // Funzioni di persistenza
    saveFileSystem() {
        try {
            const data = {
                root: this.root,
                currentPath: this.currentPath,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Impossibile salvare il file system:', error);
        }
    }

    loadFileSystem() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                
                // Ripristina le date dagli oggetti JSON
                this.restoreDates(data.root);
                
                this.root = data.root;
                this.currentPath = data.currentPath || '/home/user';
                
                console.log('File system caricato dal localStorage');
                return true;
            }
        } catch (error) {
            console.warn('Errore nel caricamento del file system:', error);
        }
        
        // Se non c'è niente salvato o c'è un errore, inizializza il sistema base
        this.initializeFileSystem();
        return false;
    }

    restoreDates(node) {
        if (node.modified && typeof node.modified === 'string') {
            node.modified = new Date(node.modified);
        }
        
        if (node.type === 'directory' && node.content) {
            Object.values(node.content).forEach(child => {
                this.restoreDates(child);
            });
        }
    }

    clearFileSystem() {
        try {
            localStorage.removeItem(this.storageKey);
            this.initializeFileSystem();
            console.log('File system resettato');
        } catch (error) {
            console.warn('Errore nel reset del file system:', error);
        }
    }
}

// Istanza globale del file system
const fileSystem = new FileSystem();
