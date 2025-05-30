import React from 'react';

export function GlossaryAll() {
  const glossaryTerms = [
    {
      term: "AI-Powered Code Management",
      definition: "Using artificial intelligence to automatically organize, tag, and enhance code snippets with metadata and contextual information."
    },
    {
      term: "Code Snippet",
      definition: "A small block of reusable code that can be stored, organized, and shared within the Pieces ecosystem."
    },
    {
      term: "Context Awareness",
      definition: "The ability of Pieces to understand the surrounding context of code, including project information, file types, and development environment."
    },
    {
      term: "Copilot",
      definition: "Pieces' AI assistant that helps with code generation, debugging, documentation, and answering development questions."
    },
    {
      term: "Drive",
      definition: "The core storage and organization system in Pieces where all code snippets and materials are saved and managed."
    },
    {
      term: "Enrichment",
      definition: "The automatic process of adding metadata, tags, descriptions, and contextual information to saved code snippets."
    },
    {
      term: "Extensions & Plugins",
      definition: "Integrations that allow Pieces to work seamlessly within various IDEs and development environments like VS Code, JetBrains, and more."
    },
    {
      term: "LLM (Large Language Model)",
      definition: "AI models used by Pieces for code understanding, generation, and conversational assistance. Can be cloud-based or run locally."
    },
    {
      term: "Long-term Memory (LTM)",
      definition: "Pieces' ability to remember and recall previous conversations, code snippets, and project context across sessions."
    },
    {
      term: "Materials",
      definition: "Any code, text, or data saved in Pieces, including snippets, files, links, and associated metadata."
    },
    {
      term: "MCP (Model Context Protocol)",
      definition: "A standardized way for AI assistants to securely access external data sources and tools while maintaining user privacy."
    },
    {
      term: "Metadata",
      definition: "Additional information automatically attached to code snippets, such as language, tags, creation date, and source context."
    },
    {
      term: "On-Device Storage",
      definition: "Local storage of all Pieces data on your machine, ensuring privacy and offline access to your code snippets."
    },
    {
      term: "Pieces OS",
      definition: "The core background service that powers all Pieces applications and handles data management, AI processing, and integrations."
    },
    {
      term: "Quick Menu",
      definition: "A fast-access interface for searching and inserting code snippets directly into your development workflow."
    },
    {
      term: "Reuse",
      definition: "The practice of finding and applying existing code snippets to new projects or contexts, facilitated by Pieces' search and organization features."
    },
    {
      term: "Search & Discovery",
      definition: "Intelligent search capabilities that allow finding code using natural language queries, tags, or technical specifications."
    },
    {
      term: "Sharing",
      definition: "The ability to securely share code snippets and materials with team members while maintaining context and metadata."
    },
    {
      term: "Transformations",
      definition: "AI-powered modifications to code snippets, such as converting between languages, adding documentation, or optimizing performance."
    },
    {
      term: "Workflow Activity",
      definition: "The tracking and analysis of development patterns and code usage to provide insights and improve productivity."
    },
    {
      term: "Workstream Activity",
      definition: "Comprehensive tracking of development workflows and context to enhance AI assistance and code recommendations."
    }
  ];

  const groupedTerms = glossaryTerms.reduce((acc, item) => {
    const firstLetter = item.term[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(item);
    return acc;
  }, {} as Record<string, typeof glossaryTerms>);

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📚 Pieces Glossary
        </h2>
        <p className="text-blue-800 dark:text-blue-200">
          Comprehensive definitions of terms and concepts used throughout the Pieces ecosystem.
        </p>
      </div>

      {/* Alphabetical Navigation */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {sortedLetters.map(letter => (
          <a 
            key={letter} 
            href={`#letter-${letter}`}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900 rounded transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      {/* Terms by Letter */}
      {sortedLetters.map(letter => (
        <div key={letter} id={`letter-${letter}`} className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b pb-2">
            {letter}
          </h3>
          <div className="space-y-6">
            {groupedTerms[letter].map((item, index) => (
              <div key={index} className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {item.term}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
          💡 Can't find a term?
        </h3>
        <p className="text-green-800 dark:text-green-200">
          If you can't find a specific term or need clarification on any Pieces concept, 
          check out our <a href="/docs/support" className="font-medium hover:underline">support documentation</a> or 
          reach out to our community for help.
        </p>
      </div>
    </div>
  );
}