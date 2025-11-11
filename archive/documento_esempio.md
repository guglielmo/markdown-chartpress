# Executive Summary

Questo documento rappresenta un template riutilizzabile per documenti aziendali di DEPP Srl. Include tutti gli elementi chiave per una presentazione professionale: pagina iniziale con logo, header/footer personalizzati, gestione delle sezioni con break di pagina, e integrazione di immagini.

**Caratteristiche principali:**

- **Pagina iniziale personalizzabile** con logo DEPP centrato
- **Header e footer professionali** su ogni pagina
- **Gestione automatica numerazione** pagine
- **Stile coerente** per titoli e sezioni
- **Integrazione immagini** e grafici

\newpage

# Introduzione

## Contesto

Questo template è stato sviluppato per standardizzare la produzione di documenti aziendali in DEPP Srl. L'obiettivo è garantire:

1. **Coerenza visiva** tra tutti i documenti
2. **Facilità di utilizzo** anche per utenti non tecnici
3. **Professionalità** nella comunicazione con stakeholder
4. **Riutilizzabilità** per diverse tipologie di documento

## Struttura del Template

Il template è organizzato come segue:

- `documento_esempio.md` - File Markdown sorgente (questo file)
- `header.tex` - Configurazione LaTeX per header/footer
- `logo-depp.png` - Logo aziendale
- `Makefile` - Automazione generazione PDF
- `README.md` - Istruzioni d'uso

\newpage

# Sezione Tecnica

## Tecnologie Utilizzate

Il sistema di generazione documenti si basa su:

| Componente | Versione | Funzione |
|-----------|----------|----------|
| Pandoc | 2.x+ | Conversione Markdown → LaTeX → PDF |
| XeLaTeX | - | Engine PDF per rendering tipografico |
| Make | - | Automazione build process |

## Workflow di Generazione

Il processo di generazione è completamente automatizzato:

```bash
# Genera il PDF
make pdf

# Pulisce i file generati
make clean

# Visualizza aiuto
make help
```

## Personalizzazione Header/Footer

Il file `header.tex` definisce lo stile di header e footer. Gli elementi personalizzabili sono:

- **Logo**: dimensioni e posizionamento
- **Colori**: schema colori DEPP (blu aziendale)
- **Font**: dimensioni e stili
- **Numerazione**: formato numero pagina

\newpage

# Integrazione Immagini

## Esempio di Immagine Centrata

Le immagini possono essere integrate facilmente nel documento usando la sintassi Markdown o LaTeX.

![Logo DEPP](logo-depp.png){ width=60% }

## Immagini con Didascalie

Le immagini possono includere didascalie descrittive che appaiono sotto l'immagine:

\begin{figure}[h]
\centering
\includegraphics[width=0.5\textwidth]{logo-depp.png}
\caption{Logo ufficiale DEPP Srl - Esempio di integrazione immagine con didascalia}
\label{fig:logo}
\end{figure}

Le immagini possono essere referenziate nel testo (es. "come mostrato in Figura \ref{fig:logo}").

\newpage

# Esempi di Formattazione

## Liste e Enumerazioni

**Lista non ordinata:**

- Primo elemento
  - Sotto-elemento A
  - Sotto-elemento B
- Secondo elemento
- Terzo elemento

**Lista ordinata:**

1. Primo passo: raccolta requisiti
2. Secondo passo: analisi delle opzioni
3. Terzo passo: implementazione
4. Quarto passo: verifica e validazione

## Tabelle Complesse

| Categoria | Q1 2025 | Q2 2025 | Q3 2025 | Totale |
|-----------|---------|---------|---------|--------|
| Ricavi | €150K | €180K | €200K | €530K |
| Costi | €100K | €110K | €120K | €330K |
| **Utile** | **€50K** | **€70K** | **€80K** | **€200K** |

## Blocchi di Codice

```python
# Esempio di codice Python
def genera_documento(titolo, autore, data):
    """Genera un documento DEPP da template"""
    template = load_template('documento_esempio.md')
    documento = template.format(
        titolo=titolo,
        autore=autore,
        data=data
    )
    return documento
```

\newpage

# Box Informativi e Note

## Note Importanti

> **Nota Importante:** Questo è un esempio di nota evidenziata. Può essere usato per richiamare l'attenzione su informazioni critiche o avvertimenti.

> **Suggerimento:** Le note possono essere di diversi tipi: informativi, di avvertimento, o suggerimenti pratici.

## Elenchi con Checkbox

Esempio di task list per progetti:

- [x] Setup ambiente di sviluppo
- [x] Creazione template documento
- [x] Test generazione PDF
- [ ] Revisione stakeholder
- [ ] Deploy in produzione

\newpage

# Conclusioni e Next Steps

## Riepilogo

Questo template fornisce una base solida per la creazione di documenti professionali in DEPP Srl. I benefici principali sono:

1. **Risparmio di tempo** - Non serve ricreare lo stile per ogni documento
2. **Coerenza** - Tutti i documenti hanno lo stesso look & feel
3. **Facilità** - Sintassi Markdown semplice da usare
4. **Professionalità** - Output PDF di alta qualità

## Prossimi Passi

Per utilizzare questo template:

1. **Copia la cartella** `depp_docs_template` in una nuova directory
2. **Modifica** `documento_esempio.md` con i tuoi contenuti
3. **Aggiorna** titolo, autore, data nella prima pagina
4. **Genera PDF** con `make pdf`
5. **Personalizza** header.tex se necessario

## Supporto

Per domande o problemi con il template, contattare:

- **Responsabile tecnico:** [Nome], [email]
- **Repository:** [link repository git]
- **Documentazione:** [link documentazione]

\newpage

# Appendice: Riferimenti Rapidi

## Comandi Pandoc Utili

```bash
# Conversione base
pandoc input.md -o output.pdf

# Con header personalizzato
pandoc input.md -o output.pdf -H header.tex

# Con template LaTeX
pandoc input.md -o output.pdf --template=custom.tex

# Con variabili personalizzate
pandoc input.md -o output.pdf -V author="Nome Autore"
```

## Sintassi LaTeX per Break di Pagina

```latex
\newpage          % Break di pagina standard
\clearpage        % Break di pagina + flush immagini
\pagebreak        % Break di pagina con stretch
```

## Sintassi Integrazione Immagini

```markdown
![Didascalia](path/immagine.png)
![Didascalia](path/immagine.png){ width=50% }
```

```latex
\includegraphics[width=0.5\textwidth]{path/immagine.png}
\includegraphics[width=8cm,height=6cm]{path/immagine.png}
```

---

**Fine del documento**

*Generato con Template DEPP Srl v1.0*
