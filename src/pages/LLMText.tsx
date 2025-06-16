
import { useEffect, useState } from 'react';
import { llmTextService } from '@/services/llmTextService';

export default function LLMText() {
  const [content, setContent] = useState<string>('Generating LLM summary...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateContent = async () => {
      try {
        const { summary } = await llmTextService.generateLLMText();
        setContent(summary);
        
        // Set page title
        document.title = 'Pieces Documentation Summary - llms.txt';
        
      } catch (error) {
        console.error('Failed to generate LLM summary:', error);
        setContent('Error: Failed to generate documentation summary');
      } finally {
        setLoading(false);
      }
    };

    generateContent();
  }, []);

  // For loading state, show minimal content
  if (loading) {
    return <pre>Generating LLM summary...</pre>;
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
      {content}
    </pre>
  );
}
