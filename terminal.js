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
      editorContent: ''
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
      execute(cmd) {
        const args = cmd.split(' ');
        const base = args[0]?.toLowerCase(); // trasformiamo il comando in minuscolo
        const rest = args.slice(1);
        switch (base) {
          case 'ls': this.ls(); break;
          case 'pwd': this.output.push(this.path.join('/') || '/'); break;
          case 'cd': this.cd(rest[0]); break;
          case 'mkdir': this.mkdir(rest[0]); break;
          case 'touch': this.touch(rest[0]); break;
          case 'cat': this.cat(rest[0]); break;
          case 'echo': this.echo(rest); break;
          case 'nano': this.nano(rest[0]); break;
          case 'clear': this.output = []; break;
          case 'json': this.output.push(JSON.stringify(this.fs, null, 2)); break;
          default: this.output.push(`comando non trovato: ${base}`);
        }
      },
      currentDir() {
        return this.path.reduce((acc, dir) => acc[dir], this.fs);
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
      ls() {
        const dir = this.currentDir();
        this.output.push(Object.keys(dir).join('  '));
      },
      cd(dir) {
        if (!dir) return;
        if (dir === '..') {
          if (this.path.length > 1) this.path.pop();
        } else {
          const current = this.currentDir();
          if (current[dir] && typeof current[dir] === 'object') {
            this.path.push(dir);
          } else {
            this.output.push(`cd: ${dir}: Nessuna directory`);
          }
        }
      },
      mkdir(name) {
        if (!name) return this.output.push("mkdir: manca nome");
        const current = this.currentDir();
        if (!current[name]) {
          current[name] = {};
          this.saveFS();
        } else this.output.push(`mkdir: '${name}' esiste già`);
      },
      touch(name) {
        if (!name) return this.output.push("touch: manca nome");
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
          this.output.push(text);
        }
      },
      cat(name) {
        const current = this.currentDir();
        if (current[name] !== undefined) {
          this.output.push(current[name]);
        } else {
          this.output.push(`cat: ${name}: file non trovato`);
        }
      },
      nano(name) {
        if (!name) return this.output.push("nano: manca nome file");
        const current = this.currentDir();
        if (!current[name]) current[name] = "";
        this.currentFile = name;
        this.editorContent = current[name];
        this.showEditor = true;
      },
      saveEditor() {
        const current = this.currentDir();
        current[this.currentFile] = this.editorContent;
        this.output.push(`File '${this.currentFile}' salvato.`);
        this.saveFS();
        this.showEditor = false;
        this.editorContent = '';
        this.currentFile = '';
        this.$nextTick(() => {
          this.scrollToBottom();
          this.focusInput();
        });
      }
    },
    mounted() {
      this.loadFS();
      this.$nextTick(() => {
        this.scrollToBottom();
        this.focusInput();
      });
    }
  });
});
