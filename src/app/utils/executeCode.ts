// src/app/utils/executeCode.ts

export type RunnableLanguage =
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "c"
  | "rust"
  | "go"
  | "ruby"
  | "php"
  | "csharp";

export type EditorLanguage = RunnableLanguage | "css" | "json" | "text";

export const LANGUAGE_VERSIONS: Record<RunnableLanguage, string> = {
  javascript: "18.15.0",
  python: "3.10.0",
  java: "15.0.2",
  cpp: "10.2.0",
  c: "10.2.0",
  rust: "1.50.0",
  go: "1.16.2",
  ruby: "3.0.1",
  php: "8.2.3",
  csharp: "6.12.0",
};

export const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JS",
  python: "PY",
  java: "JAVA",
  cpp: "C++",
  c: "C",
  rust: "RUST",
  go: "GO",
  ruby: "RB",
  php: "PHP",
  csharp: "C#",
  css: "CSS",
  json: "JSON",
  text: "TXT",
};

export const FILE_EXTENSION_LANGUAGE_MAP: Record<string, EditorLanguage> = {
  js: "javascript",
  py: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  rs: "rust",
  go: "go",
  rb: "ruby",
  php: "php",
  cs: "csharp",
  css: "css",
  json: "json",
  txt: "text",
  md: "text",
};

export const RUNNABLE_LANGUAGES = new Set<RunnableLanguage>(Object.keys(LANGUAGE_VERSIONS) as RunnableLanguage[]);

export function getLanguageFromFileName(fileName: string): EditorLanguage {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_EXTENSION_LANGUAGE_MAP[extension] || "text";
}

export function isRunnableLanguage(language: EditorLanguage): language is RunnableLanguage {
  return RUNNABLE_LANGUAGES.has(language as RunnableLanguage);
}

type PistonExecuteResponse = {
  message?: string;
  compile?: {
    code: number;
    stdout?: string;
    stderr?: string;
    output?: string;
    message?: string | null;
  };
  run?: {
    code: number;
    stdout?: string;
    stderr?: string;
    output?: string;
    message?: string | null;
  };
};

type ExecuteCodeArgs = {
  language: RunnableLanguage;
  sourceCode: string;
  fileName?: string;
};

export async function executeCode({ language, sourceCode, fileName = "main.txt" }: ExecuteCodeArgs) {
  const version = LANGUAGE_VERSIONS[language];

  const response = await fetch("/api/piston/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      language,
      version,
      files: [
        {
          name: fileName,
          content: sourceCode,
        },
      ],
      stdin: "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  const data = (await response.json()) as PistonExecuteResponse;

  if (!response.ok) {
    throw new Error(data.message || "Error executing code in sandbox.");
  }

  if (data.compile && data.compile.code !== 0) {
    throw new Error(
      data.compile.output || data.compile.stderr || data.compile.stdout || data.compile.message || "Compilation failed.",
    );
  }

  if (data.run && data.run.code !== 0) {
    throw new Error(data.run.stderr || data.run.output || data.run.message || "Runtime error.");
  }

  if (data.run) {
    return data.run.stdout || data.run.output || "";
  }

  return "";
}

// Starter templates so the editor isn't empty when a user switches languages
export const CODE_TEMPLATES: Record<string, string> = {
  javascript: 'console.log("Welcome to Aura-Vine IDE!");',
  python: 'print("Welcome to Aura-Vine IDE!")',
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Welcome to Aura-Vine IDE!");\n  }\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Welcome to Aura-Vine IDE!" << std::endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Welcome to Aura-Vine IDE!\\n");\n    return 0;\n}`,
  rust: `fn main() {\n    println!("Welcome to Aura-Vine IDE!");\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Welcome to Aura-Vine IDE!")\n}`,
  ruby: `puts "Welcome to Aura-Vine IDE!"`,
  php: `<?php\n\necho "Welcome to Aura-Vine IDE!";\n?>`,
  csharp: `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Welcome to Aura-Vine IDE!");\n  }\n}`
};
