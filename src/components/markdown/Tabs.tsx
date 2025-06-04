import React, { useState } from 'react';

interface TabItemProps {
  title: string;
  children: React.ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabItemProps>[];
  defaultActiveTab?: number;
}

const TabItem: React.FC<TabItemProps> = ({ children }) => {
  return <>{children}</>;
};

const Tabs: React.FC<TabsProps> = ({ children, defaultActiveTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const tabs = React.Children.toArray(children) as React.ReactElement<TabItemProps>[];

  return (
    <div className="mb-6">
      {/* Tab List */}
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex gap-3 border-b border-slate-200 dark:border-slate-800/80 w-full overflow-x-auto mb-6"
        tabIndex={0}
      >
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tab-content-${index}`}
            data-state={activeTab === index ? 'active' : 'inactive'}
            id={`tab-trigger-${index}`}
            className={`pt-1 pb-2 ${
              activeTab === index
                ? 'border-b-2 border-slate-700 dark:border-slate-200'
                : ''
            }`}
          >
            <button
              className="bg-transparent text-nowrap text-slate-700 dark:text-slate-200 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm font-medium rounded-md"
              onClick={() => setActiveTab(index)}
            >
              {tab.props.title}
            </button>
          </div>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab, index) => (
        <div
          key={index}
          role="tabpanel"
          aria-labelledby={`tab-trigger-${index}`}
          id={`tab-content-${index}`}
          data-state={activeTab === index ? 'active' : 'inactive'}
          className={`mb-2 ${activeTab === index ? 'block' : 'hidden'}`}
          tabIndex={0}
          style={{ animationDuration: '0s' }}
        >
          <div className="text-base text-slate-700 dark:text-slate-200">
            {tab.props.children}
          </div>
        </div>
      ))}
    </div>
  );
};

// Export both components
export { TabItem, Tabs };
export default Tabs;