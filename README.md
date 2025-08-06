# Simulatore Terminale Linux

Un simulatore completo di terminale Linux che funziona interamente nel browser, progettato per l'apprendimento e la pratica dei comandi Linux senza la necessità di un server o di accesso a un sistema Linux reale.

## Caratteristiche

### 🖥️ Interfaccia Realistica
- Aspetto e comportamento simile a un terminale Linux reale
- Prompt personalizzabile che mostra directory corrente
- Supporto per temi scuri con colori tipici del terminale

### 📁 File System Virtuale
- File system completo simulato in memoria
- Struttura di directory tipica di Linux (/home, /etc, /var, /usr, etc.)
- Supporto per permessi, proprietari e metadati dei file
- Persistenza durante la sessione

### 🛠️ Comandi Supportati

#### Navigazione
- `ls` - Lista file e directory (con opzioni -l, -a, -h)
- `cd` - Cambia directory
- `pwd` - Mostra directory corrente
- `find` - Cerca file per nome

#### Gestione File
- `mkdir` - Crea directory
- `touch` - Crea file vuoti
- `rm` - Rimuovi file e directory (con opzioni -r, -f)
- `cp` - Copia file
- `mv` - Sposta/rinomina file

#### Contenuto File
- `cat` - Mostra contenuto file
- `echo` - Stampa testo
- `grep` - Cerca pattern nei file
- `head` - Mostra prime righe
- `tail` - Mostra ultime righe
- `wc` - Conta righe, parole, caratteri
- `sort` - Ordina contenuto
- `uniq` - Rimuovi duplicati

#### Sistema
- `ps` - Mostra processi simulati
- `whoami` - Mostra utente corrente
- `date` - Mostra data e ora
- `uptime` - Tempo di attività del sistema
- `uname` - Informazioni sistema
- `df` - Spazio disco
- `du` - Utilizzo directory

#### Utilità
- `history` - Cronologia comandi
- `which` - Percorso comandi
- `file` - Tipo di file
- `man` - Pagine di manuale
- `clear` - Pulisci schermo
- `help` - Aiuto completo

### 🔧 Funzionalità Avanzate
- **Pipe**: Supporto per concatenazione comandi (es: `ls | grep txt`)
- **Tab Completion**: Completamento automatico di comandi e percorsi
- **Cronologia**: Navigazione con frecce ↑/↓
- **Scorciatoie**: Ctrl+C (annulla), Ctrl+L (pulisci)

## Come Utilizzare

1. **Avvio**: Apri `index.html` in qualsiasi browser moderno
2. **Primo utilizzo**: Digita `help` per vedere tutti i comandi disponibili
3. **Esplorazione**: Inizia con `ls` per vedere i file disponibili
4. **Apprendimento**: Prova `cat welcome.txt` per leggere la guida introduttiva

## Esempi di Utilizzo

```bash
# Esplorare il sistema
ls -la
cd Documents
pwd

# Lavorare con i file
touch nuovo_file.txt
echo "Ciao mondo" > nuovo_file.txt
cat nuovo_file.txt

# Cercare e filtrare
find -name "*.txt"
ls | grep txt
cat welcome.txt | head -5

# Informazioni sistema
ps
whoami
date
uname -a
```

## Struttura del Progetto

```
Terminale/
├── index.html          # Interfaccia principale
├── styles.css          # Stili e tema del terminale
├── filesystem.js       # Sistema di file virtuale
├── commands.js         # Implementazione comandi Linux
├── terminal.js         # Logica principale del terminale
└── README.md           # Documentazione
```

## Tecnologie Utilizzate

- **HTML5**: Struttura dell'interfaccia
- **CSS3**: Styling e animazioni
- **JavaScript ES6+**: Logica applicativa
- **File System API**: Simulazione file system in memoria

## Compatibilità

- ✅ Chrome/Chromium (versione 60+)
- ✅ Firefox (versione 55+)
- ✅ Safari (versione 12+)
- ✅ Edge (versione 79+)

## Caratteristiche Educative

### Perfetto per:
- **Studenti**: Apprendimento comandi Linux senza rischi
- **Sviluppatori**: Pratica scripting e automazione
- **Amministratori**: Ripasso comandi di sistema
- **Principianti**: Primo approccio alla riga di comando

### Vantaggi:
- **Sicuro**: Nessun rischio per il sistema reale
- **Accessibile**: Funziona su qualsiasi computer con browser
- **Interattivo**: Feedback immediato e guide integrate
- **Completo**: Oltre 30 comandi implementati fedelmente

## Limitazioni

- File system non persistente tra sessioni
- Alcuni comandi avanzati non implementati
- Nessun supporto per scripting bash completo
- Simulazione semplificata dei processi di sistema

## Sviluppi Futuri

- [ ] Persistenza locale del file system
- [ ] Supporto per più utenti e permessi
- [ ] Editor di testo integrato (nano/vim simulato)
- [ ] Supporto per variabili d'ambiente
- [ ] Simulazione network e processi più avanzata
- [ ] Modalità tutorial guidato

## Contribuire

Il progetto è open source e accetta contributi per:
- Nuovi comandi
- Miglioramenti dell'interfaccia
- Correzioni di bug
- Documentazione

## Licenza

Progetto rilasciato sotto licenza MIT - libero per uso educativo e commerciale.

---

**Buon apprendimento con Linux! 🐧**
