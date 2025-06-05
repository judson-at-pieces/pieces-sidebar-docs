
import React from 'react';

interface StepProps {
  title: string;
  children: React.ReactNode;
}

interface StepsProps {
  children: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ children }) => {
  return <>{children}</>;
};

const Steps: React.FC<StepsProps> = ({ children }) => {
  // Process children to handle both JSX Step components and data-attribute divs
  const processedSteps = React.useMemo(() => {
    if (!children) return [];
    
    const childrenArray = React.Children.toArray(children);
    console.log('Steps processing children:', childrenArray.length, childrenArray);
    
    return childrenArray.map((child, index) => {
      console.log(`Processing child ${index}:`, child);
      
      // Handle React Step components (traditional JSX)
      if (React.isValidElement(child) && child.type === Step) {
        console.log('Found Step component with props:', child.props);
        return {
          number: index + 1,
          title: child.props.title,
          content: child.props.children
        };
      }
      
      // Handle data-attribute divs (from markdown processing)
      if (React.isValidElement(child) && child.type === 'div' && child.props) {
        const props = child.props as any;
        const stepNum = props['data-step'];
        const stepTitle = props['data-step-title'];
        
        console.log('Found div with data attributes:', { stepNum, stepTitle });
        
        if (stepNum && stepTitle) {
          return {
            number: parseInt(stepNum, 10) || index + 1,
            title: stepTitle,
            content: props.children
          };
        }
      }
      
      // Handle regular divs that might contain step content
      if (React.isValidElement(child) && child.props) {
        const props = child.props as any;
        console.log('Processing regular element:', { type: child.type, props: Object.keys(props) });
        
        // If it has a title prop, treat it as a step
        if (props.title) {
          return {
            number: index + 1,
            title: props.title,
            content: props.children
          };
        }
      }
      
      // Fallback for any other content - try to extract title from content
      let title = `Step ${index + 1}`;
      let content = child;
      
      // If child is a string that starts with a heading-like pattern, extract it
      if (typeof child === 'string') {
        const match = child.match(/^(.+?)\n\n?([\s\S]*)$/);
        if (match) {
          title = match[1].trim();
          content = match[2].trim();
        }
      }
      
      return {
        number: index + 1,
        title,
        content
      };
    }).filter(step => step.content !== undefined && step.content !== null && step.content !== '');
  }, [children]);

  console.log('Final processed steps:', processedSteps);

  if (!processedSteps.length) {
    return null;
  }

  return (
    <div className="my-6 [&>.step:last-of-type]:mb-0">
      {processedSteps.map((step, index) => {
        const isLast = index === processedSteps.length - 1;
        
        return (
          <div key={index} className="flex gap-4 step mb-5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 text-xs font-semibold border rounded-md flex items-center justify-center border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800/40 text-slate-700 dark:text-slate-200">
                {step.number}
              </div>
              {!isLast && (
                <div className="h-[20px] w-[1px] bg-slate-200 dark:bg-slate-800/80"></div>
              )}
            </div>
            <div className="flex-1 w-60">
              <div className="flex flex-col gap-3">
                <h3 className="font-medium text-base text-slate-700 dark:text-slate-200 m-0">
                  {step.title}
                </h3>
                <div className="text-base text-slate-600 dark:text-slate-300">
                  {step.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Export both components
export { Step, Steps };
export default Steps;
