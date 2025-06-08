window.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#app',
    data: {
      input: '',
      output: [],
      path: ['/'],
      fs: {}, // inizializzato da localStorage o con root
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
        this.output.push(`${this.prompt}${command}`);
        this.execute(command);
        this.input = '';
      },
      execute(cmd) {
        const args = cmd.split(' ');
        const base = args[0];
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
          case 'json': this.showJSON(); break;
          default: this.output.push(`comando non trovato: ${base}`);
        }
      },
      currentDir() {
        // Naviga la struttura del filesystem, se manca una directory ritorna null
        return this.path.reduce((acc, dir) => {
          if (acc && acc[dir] && typeof acc[dir] === 'object') return acc[dir];
          return null;
        }, this.fs);
      },
      saveFS() {
        localStorage.setItem('fs_data', JSON.stringify(this.fs));
      },
      loadFS() {
        const data = localStorage.getItem('fs_data');
        if (data) {
          try {
            this.fs = JSON.parse(data);
          } catch (e) {
            this.fs = { '/': {} };
            console.error("Errore nel JSON, filesystem resettato.");
          }
        } else {
          this.fs = { '/': {} };
        }
      },
      ls() {
        const dir = this.currentDir();
        if (!dir) {
          this.output.push("Errore: directory non trovata.");
          return;
        }
        const keys = Object.keys(dir);
        this.output.push(keys.length ? keys.join('  ') : '');
      },
      cd(dir) {
        if (!dir) return;
        if (dir === '..') {
          if (this.path.length > 1) this.path.pop();
        } else {
          const current = this.currentDir();
          if (current && current[dir] && typeof current[dir] === 'object') {
            this.path.push(dir);
          } else if (current && current[dir] && typeof current[dir] !== 'object') {
            this.output.push(`cd: ${dir}: Non è una directory`);
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
        if (!current || current[name] === undefined) {
          this.output.push(`cat: ${name}: file non trovato`);
        } else if (typeof current[name] === 'object') {
          this.output.push(`cat: ${name}: è una directory`);
        } else {
          this.output.push(current[name]);
        }
      },
      nano(name) {
        if (!name) return this.output.push("nano: manca nome file");
        const current = this.currentDir();
        if (!current) return this.output.push("nano: directory non trovata");
        if (current[name] && typeof current[name] === 'object') {
          return this.output.push(`nano: ${name}: è una directory`);
        }
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
      },
      showJSON() {
        this.output.push(JSON.stringify(this.fs, null, 2));
      }
    },
    mounted() {
      this.loadFS();
    }
  });
});
