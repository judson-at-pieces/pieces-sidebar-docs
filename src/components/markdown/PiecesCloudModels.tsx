
import React from 'react';
import { MarkdownCard } from './MarkdownCard';
import { CardGroup } from './CardGroup';

export function PiecesCloudModels() {
  const cloudModels = [
    {
      name: "GPT-4o",
      provider: "OpenAI",
      description: "Most capable GPT-4 model with vision capabilities and improved performance",
      features: ["128k context window", "Vision support", "Advanced reasoning"]
    },
    {
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      description: "High-performance model optimized for speed and efficiency",
      features: ["128k context window", "Faster responses", "Cost-effective"]
    },
    {
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      description: "Fast and efficient model for general-purpose tasks",
      features: ["16k context window", "Very fast", "Most affordable"]
    },
    {
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      description: "Most intelligent Claude model with superior coding capabilities",
      features: ["200k context window", "Advanced coding", "Strong reasoning"]
    },
    {
      name: "Claude 3 Opus",
      provider: "Anthropic",
      description: "Powerful model for complex tasks and analysis",
      features: ["200k context window", "Deep analysis", "Creative writing"]
    },
    {
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      description: "Fastest Claude model for instant responses",
      features: ["200k context window", "Lightning fast", "Cost-efficient"]
    },
    {
      name: "Gemini 1.5 Pro",
      provider: "Google",
      description: "Google's most advanced model with massive context window",
      features: ["1M token context", "Multimodal", "Advanced reasoning"]
    },
    {
      name: "Gemini 1.5 Flash",
      provider: "Google",
      description: "Optimized for speed with multimodal capabilities",
      features: ["1M token context", "Fast responses", "Multimodal"]
    }
  ];

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-6">Available Cloud Models</h2>
      <p className="text-muted-foreground mb-8">
        Pieces supports a wide range of cloud-based Large Language Models (LLMs) from leading providers. 
        These models run on remote servers and require an internet connection.
      </p>
      
      <div className="space-y-8">
        {['OpenAI', 'Anthropic', 'Google'].map(provider => (
          <div key={provider}>
            <h3 className="text-xl font-semibold mb-4">{provider} Models</h3>
            <CardGroup cols={2}>
              {cloudModels
                .filter(model => model.provider === provider)
                .map(model => (
                  <MarkdownCard key={model.name} title={model.name}>
                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                    <ul className="text-sm space-y-1">
                      {model.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </MarkdownCard>
                ))}
            </CardGroup>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Getting Started with Cloud Models</h4>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          To use these cloud models, you'll need to configure your API keys in Pieces. 
          Visit the settings to add your OpenAI, Anthropic, or Google API credentials.
        </p>
      </div>
    </div>
  );
}
