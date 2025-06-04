// Static navigation fallback based on content structure
export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  description?: string;
  icon?: string;
  order_index: number;
  parent_id?: string;
  is_auto_generated: boolean;
  file_path?: string;
  items?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  order_index: number;
  items: NavigationItem[];
}

export interface NavigationStructure {
  sections: NavigationSection[];
}

export const staticNavigation: NavigationStructure = {
  sections: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      slug: 'getting-started',
      order_index: 1,
      items: [
        {
          id: 'meet-pieces',
          title: 'Meet Pieces',
          href: '/meet-pieces',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'getting-started-guide',
          title: 'Getting Started Guide',
          href: '/docs/getting-started',
          order_index: 2,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'cli',
      title: 'CLI',
      slug: 'cli',
      order_index: 2,
      items: [
        {
          id: 'cli-overview',
          title: 'Overview',
          href: '/cli',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'cli-get-started',
          title: 'Get Started',
          href: '/cli/get-started',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'cli-commands',
          title: 'Commands',
          href: '/cli/commands',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'cli-configuration',
          title: 'Configuration',
          href: '/cli/configuration',
          order_index: 4,
          is_auto_generated: true,
        },
        {
          id: 'cli-copilot',
          title: 'Copilot',
          href: '/cli/copilot',
          order_index: 5,
          is_auto_generated: true,
        },
        {
          id: 'cli-drive',
          title: 'Drive',
          href: '/cli/drive',
          order_index: 6,
          is_auto_generated: true,
        },
        {
          id: 'cli-troubleshooting',
          title: 'Troubleshooting',
          href: '/cli/troubleshooting',
          order_index: 7,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'desktop',
      title: 'Desktop',
      slug: 'desktop',
      order_index: 3,
      items: [
        {
          id: 'desktop-overview',
          title: 'Overview',
          href: '/desktop',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'desktop-download',
          title: 'Download',
          href: '/desktop/download',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'desktop-onboarding',
          title: 'Onboarding',
          href: '/desktop/onboarding',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'desktop-navigation',
          title: 'Navigation',
          href: '/desktop/navigation',
          order_index: 4,
          is_auto_generated: true,
        },
        {
          id: 'desktop-configuration',
          title: 'Configuration',
          href: '/desktop/configuration',
          order_index: 5,
          is_auto_generated: true,
        },
        {
          id: 'desktop-copilot',
          title: 'Copilot',
          href: '/desktop/copilot',
          order_index: 6,
          is_auto_generated: true,
        },
        {
          id: 'desktop-drive',
          title: 'Drive',
          href: '/desktop/drive',
          order_index: 7,
          is_auto_generated: true,
        },
        {
          id: 'desktop-actions',
          title: 'Actions',
          href: '/desktop/actions',
          order_index: 8,
          is_auto_generated: true,
        },
        {
          id: 'desktop-troubleshooting',
          title: 'Troubleshooting',
          href: '/desktop/troubleshooting',
          order_index: 9,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'web-extension',
      title: 'Web Extension',
      slug: 'web-extension',
      order_index: 4,
      items: [
        {
          id: 'web-extension-overview',
          title: 'Overview',
          href: '/web-extension',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-get-started',
          title: 'Get Started',
          href: '/web-extension/get-started',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-configuration',
          title: 'Configuration',
          href: '/web-extension/configuration',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-copilot',
          title: 'Copilot',
          href: '/web-extension/copilot',
          order_index: 4,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-drive',
          title: 'Drive',
          href: '/web-extension/drive',
          order_index: 5,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-shortcuts',
          title: 'Shortcuts',
          href: '/web-extension/shortcuts',
          order_index: 6,
          is_auto_generated: true,
        },
        {
          id: 'web-extension-troubleshooting',
          title: 'Troubleshooting',
          href: '/web-extension/troubleshooting',
          order_index: 7,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'obsidian',
      title: 'Obsidian',
      slug: 'obsidian',
      order_index: 5,
      items: [
        {
          id: 'obsidian-overview',
          title: 'Overview',
          href: '/obsidian',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-get-started',
          title: 'Get Started',
          href: '/obsidian/get-started',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-commands',
          title: 'Commands',
          href: '/obsidian/commands',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-configuration',
          title: 'Configuration',
          href: '/obsidian/configuration',
          order_index: 4,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-copilot',
          title: 'Copilot',
          href: '/obsidian/copilot',
          order_index: 5,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-drive',
          title: 'Drive',
          href: '/obsidian/drive',
          order_index: 6,
          is_auto_generated: true,
        },
        {
          id: 'obsidian-troubleshooting',
          title: 'Troubleshooting',
          href: '/obsidian/troubleshooting',
          order_index: 7,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'extensions-plugins',
      title: 'Extensions & Plugins',
      slug: 'extensions-plugins',
      order_index: 6,
      items: [
        {
          id: 'extensions-plugins-overview',
          title: 'Overview',
          href: '/extensions-plugins',
          order_index: 1,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'core-dependencies',
      title: 'Core Dependencies',
      slug: 'core-dependencies',
      order_index: 7,
      items: [
        {
          id: 'core-dependencies-overview',
          title: 'Overview',
          href: '/core-dependencies',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'pieces-os',
          title: 'Pieces OS',
          href: '/core-dependencies/pieces-os',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'ollama',
          title: 'Ollama',
          href: '/core-dependencies/ollama',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'on-device-storage',
          title: 'On-Device Storage',
          href: '/core-dependencies/on-device-storage',
          order_index: 4,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'large-language-models',
      title: 'Large Language Models',
      slug: 'large-language-models',
      order_index: 8,
      items: [
        {
          id: 'llm-overview',
          title: 'Overview',
          href: '/large-language-models',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'cloud-models',
          title: 'Cloud Models',
          href: '/large-language-models/cloud-models',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'local-models',
          title: 'Local Models',
          href: '/large-language-models/local-models',
          order_index: 3,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'mcp',
      title: 'MCP',
      slug: 'mcp',
      order_index: 9,
      items: [
        {
          id: 'mcp-overview',
          title: 'Overview',
          href: '/mcp',
          order_index: 1,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'quick-guides',
      title: 'Quick Guides',
      slug: 'quick-guides',
      order_index: 10,
      items: [
        {
          id: 'quick-guides-overview',
          title: 'Overview',
          href: '/quick-guides',
          order_index: 1,
          is_auto_generated: true,
        }
      ]
    },
    {
      id: 'more',
      title: 'More',
      slug: 'more',
      order_index: 11,
      items: [
        {
          id: 'productivity',
          title: 'Productivity',
          href: '/productivity',
          order_index: 1,
          is_auto_generated: true,
        },
        {
          id: 'privacy-security',
          title: 'Privacy & Security',
          href: '/privacy-security-your-data',
          order_index: 2,
          is_auto_generated: true,
        },
        {
          id: 'glossary',
          title: 'Glossary',
          href: '/glossary',
          order_index: 3,
          is_auto_generated: true,
        },
        {
          id: 'support',
          title: 'Support',
          href: '/support',
          order_index: 4,
          is_auto_generated: true,
        },
        {
          id: 'help',
          title: 'Help',
          href: '/help',
          order_index: 5,
          is_auto_generated: true,
        }
      ]
    }
  ]
};