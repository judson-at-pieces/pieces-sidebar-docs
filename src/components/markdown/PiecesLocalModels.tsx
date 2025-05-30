import React from 'react';

export function PiecesLocalModels() {
  const localModels = [
    {
      name: "Ollama",
      description: "Run large language models locally with ease",
      features: ["Privacy-focused", "Offline capable", "Multiple model support"],
      link: "/docs/core-dependencies/ollama"
    },
    {
      name: "Code Llama",
      description: "Meta's code-specialized language model",
      features: ["Code generation", "Code completion", "Code understanding"],
      link: "/docs/core-dependencies/ollama/supported-models"
    },
    {
      name: "Llama 2",
      description: "Meta's general-purpose language model",
      features: ["Conversational AI", "Text generation", "Question answering"],
      link: "/docs/core-dependencies/ollama/supported-models"
    },
    {
      name: "Mistral",
      description: "High-performance language model for various tasks",
      features: ["Fast inference", "Multilingual", "Instruction following"],
      link: "/docs/core-dependencies/ollama/supported-models"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🔒 Local Models with Pieces
        </h2>
        <p className="text-blue-800 dark:text-blue-200">
          Run AI models locally for maximum privacy and control. Pieces supports various local model providers 
          to keep your code and data completely private.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {localModels.map((model, index) => (
          <div key={index} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">{model.name}</h3>
            <p className="text-muted-foreground mb-4">{model.description}</p>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {model.features.map((feature, idx) => (
                  <li key={idx} className="text-muted-foreground">{feature}</li>
                ))}
              </ul>
            </div>
            
            <a 
              href={model.link} 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Learn more →
            </a>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          📋 Getting Started with Local Models
        </h3>
        <div className="text-yellow-800 dark:text-yellow-200 space-y-2">
          <p>To use local models with Pieces:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Install Ollama or your preferred local model provider</li>
            <li>Configure Pieces to connect to your local models</li>
            <li>Start using AI features with complete privacy</li>
          </ol>
          <p className="mt-4">
            <a href="/docs/core-dependencies/ollama" className="font-medium text-yellow-900 dark:text-yellow-100 hover:underline">
              View Ollama setup guide →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}