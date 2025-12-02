// Mock-Service für Gemini API

// Konfiguration (später durch echte API-Konfiguration ersetzbar)
const API_CONFIG = {
  baseDelay: 1500, // Basis-Verzögerung in ms
  variableDelay: 1000, // Variable Verzögerung (zufällig) in ms
  errorRate: 0.05, // 5% Fehlerwahrscheinlichkeit
  quotaLimit: 50, // Simuliertes Anfragelimit pro Stunde
}

// Simulierter Zähler für Anfragen
let requestCounter = 0
let lastResetTime = Date.now()

// Funktion zur Prüfung des Rate Limits
function checkRateLimit() {
  const now = Date.now();
  // Reset counter every hour
  if (now - lastResetTime > 60 * 60 * 1000) {
    requestCounter = 0;
    lastResetTime = now;
  }

  requestCounter++;
  if (requestCounter > API_CONFIG.quotaLimit) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Simulate potential API errors
  if (Math.random() < API_CONFIG.errorRate) {
    throw new Error('Simulated API error occurred.');
  }
}

// Mock-Antworten für verschiedene Materialtypen
const MOCK_RESPONSES = {
  worksheet: {
    title: "English Programming: Loops and Control Structures",
    content: `
      <h1>Loops and Control Structures in Programming</h1>

      <h2>Key Terminology</h2>
      <ul>
        <li><strong>Loop</strong>: A sequence of instructions that is continually repeated until a certain condition is reached.</li>
        <li><strong>Iteration</strong>: Each time the loop body is executed.</li>
        <li><strong>Control structure</strong>: Constructs that direct the flow of a program.</li>
      </ul>

      <h2>Types of Loops</h2>

      <h3>1. For Loop</h3>
      <p>Used when you know exactly how many times you want to loop through a block of code.</p>
      <pre><code>for (initialization; condition; increment) {
    // code to be executed
}</code></pre>

      <h3>2. While Loop</h3>
      <p>Used when you want to loop through a block of code as long as a specified condition is true.</p>
      <pre><code>while (condition) {
    // code to be executed
}</code></pre>

      <h2>Exercise 1: Complete the Code</h2>
      <p>Fill in the missing parts of the following for loop that prints numbers from 1 to 10:</p>
      <pre><code>for (___; i <= 10; ___) {
    console.log(i);
}</code></pre>
    `
  },

  quiz: {
    title: "Database Quiz: SQL Queries",
    content: `
      <h1>SQL Queries Quiz</h1>

      <p>Test your knowledge of SQL queries with the following multiple-choice questions:</p>

      <div class="question">
        <h3>Question 1: Which SQL command is used to extract data from a database?</h3>
        <div class="options">
          <div class="option">
            <input type="radio" name="q1" id="q1a" value="a">
            <label for="q1a">INSERT</label>
          </div>
          <div class="option">
            <input type="radio" name="q1" id="q1b" value="b">
            <label for="q1b">SELECT</label>
          </div>
          <div class="option">
            <input type="radio" name="q1" id="q1c" value="c">
            <label for="q1c">UPDATE</label>
          </div>
          <div class="option">
            <input type="radio" name="q1" id="q1d" value="d">
            <label for="q1d">DELETE</label>
          </div>
        </div>
      </div>

      <div class="question">
        <h3>Question 2: Which clause is used to filter records in SQL?</h3>
        <div class="options">
          <div class="option">
            <input type="radio" name="q2" id="q2a" value="a">
            <label for="q2a">WHERE</label>
          </div>
          <div class="option">
            <input type="radio" name="q2" id="q2b" value="b">
            <label for="q2b">HAVING</label>
          </div>
          <div class="option">
            <input type="radio" name="q2" id="q2c" value="c">
            <label for="q2c">GROUP BY</label>
          </div>
          <div class="option">
            <input type="radio" name="q2" id="q2d" value="d">
            <label for="q2d">ORDER BY</label>
          </div>
        </div>
      </div>
    `
  },

  glossary: {
    title: "Technical Vocabulary: Networking",
    content: `
      <h1>Networking Technical Vocabulary</h1>

      <div class="glossary-entry">
        <div class="term">Router</div>
        <div class="definition">A networking device that forwards data packets between computer networks.</div>
        <div class="example">Example: Home Wi-Fi routers connect your local network to the internet.</div>
      </div>

      <div class="glossary-entry">
        <div class="term">IP Address</div>
        <div class="definition">A numerical label assigned to each device connected to a computer network that uses the Internet Protocol for communication.</div>
        <div class="example">Example: 192.168.1.1 is a common IP address for home routers.</div>
      </div>

      <div class="glossary-entry">
        <div class="term">Subnet Mask</div>
        <div class="definition">A 32-bit number that masks an IP address and divides the IP address into network address and host address.</div>
        <div class="example">Example: 255.255.255.0 is a common subnet mask for home networks.</div>
      </div>

      <div class="glossary-entry">
        <div class="term">Firewall</div>
        <div class="definition">A network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules.</div>
        <div class="example">Example: Windows Defender Firewall blocks unauthorized access to your computer.</div>
      </div>
    `
  }
};

// Haupt-Service-Klasse
export default {
  async generateMaterial(type, params) {
    console.log(`Mock API: Generating material of type '${type}' with params:`, params);
    try {
      checkRateLimit();

      // Verzögerung simulieren
      const delay = API_CONFIG.baseDelay + Math.random() * API_CONFIG.variableDelay;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Mock-Antwort generieren
      let response = MOCK_RESPONSES[type] || {
        title: `${params?.subject || 'Unknown Subject'}: ${params?.topic || 'Unknown Topic'}`,
        content: `<h1>${params?.topic || 'Generated Topic'}</h1><p>Generated content based on provided parameters...</p><p>Language Level: ${params?.languageLevel || 'N/A'}</p>`
      };

      console.log("Mock API: Sending response:", response);
      return {
        success: true,
        data: response,
        metadata: {
          generationTime: delay / 1000, // Simulierte Generierungszeit
          tokensUsed: Math.floor(Math.random() * 1000) + 500, // Zufällige Tokenanzahl
          model: 'gemini-mock-1.0'
        }
      };
    } catch (error) {
      console.error('Gemini Mock API error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Beispiel für eine weitere Mock-Methode (kann erweitert werden)
  async analyzeText(text) {
    console.log("Mock API: Analyzing text:", text.substring(0, 50) + "...");
    try {
      checkRateLimit();
      const delay = API_CONFIG.baseDelay / 2 + Math.random() * API_CONFIG.variableDelay / 2;
      await new Promise(resolve => setTimeout(resolve, delay));

      const analysis = {
        readabilityScore: Math.random() * 100,
        languageLevel: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][Math.floor(Math.random() * 6)],
        keywords: ['mock', 'analysis', 'keywords', 'example']
      };

      console.log("Mock API: Sending analysis:", analysis);
      return {
        success: true,
        data: analysis,
         metadata: {
          generationTime: delay / 1000,
          model: 'gemini-mock-analyzer-1.0'
        }
      };
    } catch (error) {
       console.error('Gemini Mock API analysis error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 