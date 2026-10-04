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
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
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
    id: 'rust',
    name: 'Rust',
    extensions: ['.rs'],
    defaultFilename: 'main.rs',
    sampleCode: `// Rust Syntax Highlighting Demo
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Total sum: {}", sum);
}
`,
  },
  {
    id: 'go',
    name: 'Go',
    extensions: ['.go'],
    defaultFilename: 'main.go',
    sampleCode: `// Go Syntax Highlighting Demo
package main

import "fmt"

func main() {
    messages := []string{"Hello", "from", "Go"}
    for _, msg := range messages {
        fmt.Println(msg)
    }
}
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
    "languageDetection": true
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
  <title>AI Code Editor</title>
</head>
<body>
  <h1>AI Code Editor Platform</h1>
</body>
</html>
`,
  },
  {
    id: 'css',
    name: 'CSS',
    extensions: ['.css', '.scss', '.less'],
    defaultFilename: 'styles.css',
    sampleCode: `/* CSS Syntax Highlighting Demo */
:root {
  --primary: #3b82f6;
  --bg-dark: #1e1e1e;
}

.container {
  display: flex;
  height: 100vh;
}
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    extensions: ['.cpp', '.cc', '.h', '.hpp', '.c'],
    defaultFilename: 'main.cpp',
    sampleCode: `// C++ Syntax Highlighting Demo
#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    for (int n : numbers) {
        std::cout << n << " ";
    }
    return 0;
}
`,
  },
  {
    id: 'sql',
    name: 'SQL',
    extensions: ['.sql'],
    defaultFilename: 'query.sql',
    sampleCode: `-- SQL Syntax Highlighting Demo
SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.name
ORDER BY order_count DESC;
`,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extensions: ['.md', '.markdown'],
    defaultFilename: 'notes.md',
    sampleCode: `# Code Review Notes

- Item 1: Checked for edge cases
- Item 2: Tested memory usage
`,
  },
];

export function detectLanguageFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return 'plaintext';

  const ext = filename.slice(dotIndex).toLowerCase();
  const matched = SUPPORTED_LANGUAGES.find((lang) => lang.extensions.includes(ext));

  return matched ? matched.id : 'plaintext';
}
