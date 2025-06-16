
import { useEffect, useState } from 'react';
import { llmTextService } from '@/services/llmTextService';

interface LLMTextProps {
  fullContent?: boolean;
}

export default function LLMText({ fullContent = false }: LLMTextProps) {
  const [llmText, setLLMText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateText = async () => {
      try {
        const text = await llmTextService.generateLLMText(fullContent);
        setLLMText(text);
        
        // Set page title for text
        document.title = fullContent ? 'LLMs Full Documentation' : 'LLMs Documentation Summary';
        
      } catch (error) {
        console.error('Failed to generate LLM text:', error);
        setLLMText('# Error\n\nFailed to generate LLM-friendly documentation text.');
      } finally {
        setLoading(false);
      }
    };

    generateText();
  }, [fullContent]);

  // For loading state, show minimal content
  if (loading) {
    return <pre>Generating LLM documentation text...</pre>;
  }

  // Return raw text as plain text
  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      margin: 0, 
      padding: '20px',
      backgroundColor: 'white',
      color: 'black',
      fontSize: '14px',
      lineHeight: '1.4'
    }}>
      {llmText}
    </pre>
  );
}
