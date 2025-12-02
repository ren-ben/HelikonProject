# Helikon - CLIL Material Generator

Ein Tool zur Erstellung von CLIL-Unterrichtsmaterialien (Content and Language Integrated Learning) mit Unterstützung für lokale LLM-Modelle.

## Features

- 🤖 **Lokale LLM-Integration**: Verwendet Ollama für lokal installierte Sprachmodelle
- 📝 **5-Schritt Material-Erstellung**: Geführter Workflow für die Material-Generierung
- 🎯 **CLIL-fokussiert**: Spezialisiert auf bilingualen Fachunterricht
- 💾 **Material-Verwaltung**: Speichern, Bearbeiten und Exportieren von Materialien
- 🎨 **Rich-Text Editor**: TipTap-basierter Editor mit Formatierungsoptionen
- 🌍 **Mehrsprachig**: Unterstützung für Deutsch, Englisch und technische Fächer

## Technologie-Stack

### Backend
- Java 21
- Spring Boot 3.2.3
- PostgreSQL 15
- Ollama API Integration

### Frontend
- Vue.js 3
- Vuetify 3
- Vite
- Pinia (State Management)

## Voraussetzungen

- Java 21 oder höher
- Node.js 18 oder höher
- Docker & Docker Compose
- Ollama (mit installierten Modellen)

## Installation & Setup

### 1. Ollama installieren

```bash
# macOS
brew install ollama

# Modelle installieren
ollama pull llama3.2
ollama pull gemma2:9b
ollama pull deepseek-r1:8b
```

### 2. Datenbank starten

```bash
docker-compose up -d
```

### 3. Backend starten

```bash
./mvnw spring-boot:run
```

Das Backend läuft auf: `http://localhost:8081`

### 4. Frontend starten

```bash
cd clil-frontend
npm install
npm run dev
```

Das Frontend läuft auf: `http://localhost:5173`

## Verwendung

1. Öffne `http://localhost:5173` im Browser
2. Klicke auf "Neues Material erstellen"
3. Folge dem 5-Schritt-Prozess:
   - **Schritt 1**: Material-Typ auswählen (Arbeitsblatt, Quiz, etc.)
   - **Schritt 2**: Fach und Thema angeben
   - **Schritt 3**: CLIL-Parameter festlegen (Sprachniveau, Vokabular-Anteil)
   - **Schritt 4**: LLM-Modell auswählen und Prompt anpassen
   - **Schritt 5**: Material generieren

## Verfügbare Modelle

Das System lädt automatisch alle lokal installierten Ollama-Modelle. Um neue Modelle hinzuzufügen:

```bash
ollama pull <model-name>
```

Beispiele:
- `llama3.2` - Schnelles Allzweck-Modell
- `gemma2:9b` - Größeres Modell für komplexe Aufgaben
- `mistral` - Optimiert für deutsche Texte

## API Endpoints

- `GET /api/v1/clil/models` - Liste aller verfügbaren lokalen Modelle
- `POST /api/v1/clil/generate` - Material generieren
- `GET /api/v1/clil/materials` - Alle gespeicherten Materialien
- `GET /api/v1/clil/materials/{id}` - Einzelnes Material abrufen
- `POST /api/v1/clil/materials` - Material speichern
- `PUT /api/v1/clil/materials/{id}` - Material aktualisieren
- `DELETE /api/v1/clil/materials/{id}` - Material löschen

## Konfiguration

Die Hauptkonfiguration befindet sich in `src/main/resources/application.properties`:

```properties
# Server
server.port=8081

# Ollama API
ollama.api.url=http://localhost:11434
ollama.api.default-model=llama3.2

# Timeouts (3 Minuten für lokale Modelle)
spring.mvc.async.request-timeout=180000
```

## Hinweise

- Die Generierung mit lokalen Modellen kann je nach Hardware 1-3 Minuten dauern
- Größere Modelle (>7B Parameter) benötigen mehr Zeit und Ressourcen
- Die Qualität der Ergebnisse variiert je nach gewähltem Modell

## Lizenz

Dieses Projekt ist für den akademischen und pädagogischen Einsatz gedacht
