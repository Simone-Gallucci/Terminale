window.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#app',
    data: {
      input: '',
      output: [],
      path: ['/'],
      fs: {},
      showEditor: false,
      currentFile: '',
      editorContent: '',
      history: []
    },
    computed: {
      prompt() {
        const fullPath = this.path.join('/') || '/';
        return `root@kali [${fullPath}]$ `;
      }
    },
    methods: {
      handleCommand() {
        const command = this.input.trim();
        if (command) {
          this.output.push(`${this.prompt}${command}`);
          this.history.push(command);
          this.execute(command);
        }
        this.input = '';
        this.$nextTick(() => {
          this.scrollToBottom();
          this.focusInput();
        });
      },
      scrollToBottom() {
        const area = this.$refs.outputArea;
        if (area) area.scrollTop = area.scrollHeight;
      },
      focusInput() {
        const input = this.$refs.inputField;
        if (input) input.focus();
      },
      resolvePath(targetPath) {
        let parts = targetPath.startsWith('/') ? targetPath.split('/') : [...this.path, ...targetPath.split('/')];
        let resolved = [];
        for (let part of parts) {
          if (part === '' || part === '.') continue;
          if (part === '..') resolved.pop();
          else resolved.push(part);
        }
        return resolved.length ? resolved : ['/'];
      },
      getDir(pathArray) {
        return pathArray.reduce((acc, dir) => acc && acc[dir], this.fs);
      },
      currentDir() {
        return this.getDir(this.path);
      },
      saveFS() {
        localStorage.setItem('fs_data', JSON.stringify(this.fs));
      },
      loadFS() {
        const data = localStorage.getItem('fs_data');
        if (data) {
          try {
            this.fs = JSON.parse(data);
          } catch {
            this.fs = { '/': {} };
          }
        } else {
          this.fs = { '/': {} };
        }
      },
      execute(cmd) {
        const args = cmd.split(' ');
        const base = args[0]?.toLowerCase();
        const rest = args.slice(1);


        
      switch (base) {
          case 'ls': this.ls(rest); break;
          case 'pwd': this.output.push(this.path.join('/') || '/'); break;
          case 'cd': this.cd(rest[0]); break;
          case 'mkdir': this.mkdir(rest[0]); break;
          case 'touch': this.touch(rest[0]); break;
          case 'cat': this.cat(rest[0]); break;
          case 'echo': this.echo(rest); break;
          case 'nano': this.nano(rest[0]); break;
          case 'clear': this.output = []; break;
          case 'json': this.output.push(JSON.stringify(this.fs, null, 2)); break;
          case 'rm': this.rm(rest); break;
          case 'help': this.help(); break;
          case 'mv': this.mv(rest); break;
          default: this.output.push($1, '');
        }
      },
      ls(options = []) {
        const dir = this.currentDir();
        const entries = Object.keys(dir);

        const showAll = options.includes('-a') || options.includes('-la') || options.includes('-al');
        const showLong = options.includes('-l') || options.includes('-la') || options.includes('-al');

        if (showLong) {
          const lines = (showAll ? ['.', '..', ...entries] : entries).map(name => {
            const isDir = typeof dir[name] === 'object';
            const type = isDir ? 'd' : '-';
            const size = isDir ? '-' : `${dir[name].length}B`;
            return `${type}rw-r--r-- root root ${size} ${name}`;
          });
          this.output.push($1, '');
        } else if (showAll) {
          this.output.push(['.', '..', ...entries].join('  '));
        } else {
          this.output.push(entries.join('  '));
        }
      },
      cd(target) {
        if (!target) return;
        const newPath = this.resolvePath(target);
        const newDir = this.getDir(newPath);
        if (newDir && typeof newDir === 'object') {
          this.path = newPath;
        } else {
          this.output.push($1, '');
        }
      },
      mkdir(name) {
        if (!name) return this.output.push($1, '');
        const current = this.currentDir();
        if (!current[name]) {
          current[name] = {};
          this.saveFS();
        } else this.output.push($1, '');
      },
      touch(name) {
        if (!name) return this.output.push($1, '');
        const current = this.currentDir();
        if (!current[name]) {
          current[name] = "";
          this.saveFS();
        }
      },
      echo(args) {
        const text = args.join(' ');
        if (text.includes('>')) {
          const [value, file] = text.split('>');
          const current = this.currentDir();
          current[file.trim()] = value.trim();
          this.saveFS();
        } else {
          this.output.push($1, '');
        }
      },
      cat(name) {
        const current = this.currentDir();
        if (current[name] !== undefined) {
          this.output.push($1, '');
        } else {
          this.output.push($1, '');
        }
      },
      nano(name) {
        if (!name) return this.output.push($1, '');
        const current = this.currentDir();
        if (!current[name]) current[name] = "";
        this.currentFile = name;
        this.editorContent = current[name];
        this.showEditor = true;
      },
      saveEditor() {
        const current = this.currentDir();
        current[this.currentFile] = this.editorContent;
        this.output.push($1, '');
        this.saveFS();
        this.showEditor = false;
        this.editorContent = '';
        this.currentFile = '';
        this.$nextTick(() => {
          this.scrollToBottom();
          this.focusInput();
        });
      },
      rm(args) {
        const current = this.currentDir();
        if (!args.length) {
          this.output.push($1, '');
          return;
        }
        if (args[0] === '-r') {
          const dir = args[1];
          if (!dir || typeof current[dir] !== 'object') {
            this.output.push($1, '');
            return;
          }
          delete current[dir];
          this.output.push($1, '');
        } else {
          const file = args[0];
          if (!(file in current)) {
            this.output.push($1, '');
            return;
          }
          if (typeof current[file] === 'object') {
            this.output.push($1, '');
            return;
          }
          delete current[file];
          this.output.push($1, '');
        }
        this.saveFS();
      },
      mv(args) {
        if (args.length < 2) return this.output.push($1, '');
        const [oldName, newName] = args;
        const current = this.currentDir();
        if (!(oldName in current)) return this.output.push($1, '');
        current[newName] = current[oldName];
        delete current[oldName];
        this.output.push($1, '');
        this.saveFS();
      },
      help() {
        const cmds = [
          'ls [-a|-l]        Lista contenuti',
          'cd <path>         Cambia directory',
          'pwd               Percorso corrente',
          'mkdir <name>      Crea cartella',
          'touch <name>      Crea file',
          'echo "txt" > file Scrive in file',
          'cat <file>        Mostra contenuto',
          'nano <file>       Editor file',
          'clear             Pulisce output',
          'json              Mostra fs JSON',
          'rm <file>         Elimina file',
          'rm -r <dir>       Elimina cartella',
          'mv vecchio nuovo  Rinomina file/cartella',
          'help              Mostra questo aiuto'
        ];
        this.output.push($1, '');
      }
    },
    mounted() {
      this.loadFS();
      this.showEditor = false;
      this.$nextTick(() => {
        this.scrollToBottom();
        this.focusInput();
      });
    }
  });
});
