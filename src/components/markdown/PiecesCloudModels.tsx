import React from 'react';
import { Card } from './Card';
import { CardGroup } from './CardGroup';

const cloudModels = [
  {
    name: 'GPT-3',
    description: 'OpenAI\'s powerful language model for various tasks.',
    url: 'https://openai.com/api/gpt-3/'
  },
  {
    name: 'LaMDA',
    description: 'Google\'s language model for engaging in open-ended dialogue.',
    url: 'https://ai.googleblog.com/2022/01/lamda-towards-safe-grounded-and-high.html'
  },
  {
    name: 'Cohere',
    description: 'A language AI platform for understanding and generating text.',
    url: 'https://cohere.ai/'
  }
];

export function PiecesCloudModels() {
  return (
    <div className="my-8">
      <CardGroup cols={parseInt('3') as 2 | 3 | 4}>
        {cloudModels.map((model, index) => (
          <Card
            key={index}
            title={model.name}
            href={model.url}
            external
          >
            {model.description}
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}
