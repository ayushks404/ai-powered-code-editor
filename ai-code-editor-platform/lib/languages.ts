export interface LanguageOption {
  id: string;
  name: string;
  extensions: string[];
  defaultFilename: string;
  sampleCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    defaultFilename: 'sample.ts',
    sampleCode: `// TypeScript Syntax Highlighting Demo
interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

function calculateScore<T extends number>(scores: T[]): number {
  return scores.reduce((acc, curr) => acc + curr, 0);
}

const activeUser: User = {
  id: 101,
  name: "Alex",
  role: "admin"
};

console.log(\`User \${activeUser.name} score:\`, calculateScore([85, 92, 78]));
`,
  },
  {
    id: 'python',
    name: 'Python',
    extensions: ['.py'],
    defaultFilename: 'main.py',
    sampleCode: `# Python Syntax Highlighting Demo
from dataclasses import dataclass
import asyncio

@dataclass
class DataProcessor:
    batch_size: int = 64
    
    async def process_batch(self, items: list[str]) -> dict[str, int]:
        await asyncio.sleep(0.1)
        return {item: len(item) for item in items}

async def main():
    processor = DataProcessor(batch_size=32)
    results = await processor.process_batch(["monaco", "editor", "python"])
    print(f"Processed results: {results}")

if __name__ == "__main__":
    asyncio.run(main())
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs'],
    defaultFilename: 'script.js',
    sampleCode: `// JavaScript Syntax Highlighting Demo
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, ...args) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(fn => fn(...args));
  }
}

const emitter = new EventEmitter();
emitter.on('data', (payload) => console.log('Received:', payload));
emitter.emit('data', { status: 'success', code: 200 });
`,
  },
  {
    id: 'json',
    name: 'JSON',
    extensions: ['.json'],
    defaultFilename: 'config.json',
    sampleCode: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "name": "ai-code-editor-platform",
  "version": "1.0.0",
  "features": {
    "syntaxHighlighting": true,
    "languageDetection": true,
    "supportedLanguages": ["typescript", "python", "javascript", "json", "html", "css"]
  },
  "settings": {
    "theme": "vs-dark",
    "fontSize": 14,
    "tabSize": 2
  }
}
`,
  },
  {
    id: 'html',
    name: 'HTML',
    extensions: ['.html', '.htm'],
    defaultFilename: 'index.html',
    sampleCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monaco Editor - HTML Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #121212; color: #fff; margin: 2rem; }
    .card { background: #1e1e1e; padding: 1.5rem; border-radius: 8px; border: 1px solid #333; }
  </style>
</head>
<body>
  <div class="card">
    <h1>AI Code Editor Platform</h1>
    <p>Real-time syntax highlighting for HTML5, CSS, and JS.</p>
  </div>
</body>
</html>
`,
  },
  {
    id: 'css',
    name: 'CSS',
    extensions: ['.css'],
    defaultFilename: 'styles.css',
    sampleCode: `/* CSS Syntax Highlighting Demo */
:root {
  --primary-color: #3b82f6;
  --bg-dark: #1e1e1e;
  --border-color: #374151;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-dark);
}

.editor-header {
  height: 40px;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
}
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    extensions: ['.cpp', '.cc', '.h', '.hpp'],
    defaultFilename: 'main.cpp',
    sampleCode: `// C++ Syntax Highlighting Demo
#include <iostream>
#include <vector>
#include <algorithm>

template <typename T>
void printVector(const std::vector<T>& vec) {
    std::cout << "[ ";
    for (const auto& item : vec) {
        std::cout << item << " ";
    }
    std::cout << "]" << std::endl;
}

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    std::sort(numbers.begin(), numbers.end());
    printVector(numbers);
    return 0;
}
`,
  }
];

export function detectLanguageFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return 'plaintext';
  
  const ext = filename.slice(dotIndex).toLowerCase();
  const matched = SUPPORTED_LANGUAGES.find(lang => lang.extensions.includes(ext));
  
  return matched ? matched.id : 'plaintext';
}
