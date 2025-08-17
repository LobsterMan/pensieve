/**
 * Pensieve Reader - Core JavaScript for parsing and rendering Pensieve notes
 * 
 * This file can be dropped into any HTML page. It will:
 * 1. Find content under #pensieve
 * 2. Parse the markdown content (including YAML frontmatter)
 * 3. Load the referenced schema
 * 4. Apply styling and validation
 * 5. Render the content according to schema rules
 */

class PensieveReader {
    constructor(options = {}) {
        this.options = {
            containerId: 'pensieve',
            baseUrl: '', // Base URL for resolving relative schema URLs
            debug: false,
            development: false, // Enable development mode for local schema loading
            localBaseUrl: 'http://localhost:8080', // Local base URL to replace GitHub URL
            ...options
        };
        
        this.schema = null;
        this.frontmatter = null;
        this.markdownBody = '';
        this.parsedContent = null;
    }

    /**
     * Initialize the reader and process any Pensieve content found
     */
    async init() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            this.log('No container found with id:', this.options.containerId);
            return;
        }

        const rawContent = container.textContent || container.innerText;
        if (!rawContent.trim()) {
            this.log('No content found in container');
            return;
        }

        try {
            await this.processContent(rawContent, container);
        } catch (error) {
            this.logError('Failed to process content:', error);
            this.renderError(container, error);
        }
    }

    /**
     * Process the raw markdown content
     */
    async processContent(rawContent, container) {
        // Parse frontmatter and body
        const { frontmatter, body } = this.parseFrontmatter(rawContent);
        this.frontmatter = frontmatter;
        this.markdownBody = body;

        this.log('Parsed frontmatter:', frontmatter);

        // Check if this is a Pensieve note
        if (!frontmatter.pensive_schema) {
            this.log('No pensive_schema found, treating as regular markdown');
            this.renderMarkdown(container, body);
            return;
        }

        // Load and validate schema
        this.schema = await this.loadSchema(frontmatter.pensive_schema);
        this.log('Loaded schema:', this.schema);

        // Validate frontmatter against schema
        this.validateFrontmatter();

        // Apply styling from schema
        await this.applySchemaStyles();

        // Render the content
        this.renderPensieveNote(container);
    }

    /**
     * Parse YAML frontmatter from markdown content
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, body: content };
        }

        const frontmatterYaml = match[1];
        const body = match[2];

        try {
            // Simple YAML parser (for basic cases - could be enhanced)
            const frontmatter = this.parseSimpleYaml(frontmatterYaml);
            return { frontmatter, body };
        } catch (error) {
            this.logError('Failed to parse frontmatter:', error);
            return { frontmatter: {}, body: content };
        }
    }

    /**
     * Simple YAML parser for basic key-value pairs and arrays
     * TODO: Replace with proper YAML library for production
     */
    parseSimpleYaml(yamlString) {
        const result = {};
        const lines = yamlString.split('\n');
        let currentKey = null;
        let isArray = false;

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                
                if (value === '') {
                    // Possible array start
                    currentKey = key;
                    isArray = true;
                    result[key] = [];
                } else if (value.startsWith('[') && value.endsWith(']')) {
                    // Inline array
                    const arrayContent = value.slice(1, -1);
                    result[key] = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
                    isArray = false;
                } else {
                    // Regular key-value
                    result[key] = this.parseYamlValue(value);
                    isArray = false;
                }
            } else if (line.startsWith('-') && isArray && currentKey) {
                // Array item
                const item = line.substring(1).trim();
                result[currentKey].push(this.parseYamlValue(item));
            }
        }

        return result;
    }

    /**
     * Parse individual YAML values
     */
    parseYamlValue(value) {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Parse numbers
        if (/^\d+$/.test(value)) {
            return parseInt(value);
        }
        if (/^\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        
        // Parse booleans
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        return value;
    }

    /**
     * Load schema from URL
     */
    async loadSchema(schemaUrl) {
        try {
            // Development URL replacement
            let finalSchemaUrl = schemaUrl;
            if (this.options.development) {
                const githubBase = 'https://raw.githubusercontent.com/LobsterMan/pensieve/main';
                if (schemaUrl.startsWith(githubBase)) {
                    finalSchemaUrl = schemaUrl.replace(githubBase, this.options.localBaseUrl);
                    this.log(`Development mode: replaced URL ${schemaUrl} -> ${finalSchemaUrl}`);
                }
            }
            
            // Append /schema.json to the URL
            const fullSchemaUrl = finalSchemaUrl.endsWith('/') ? 
                finalSchemaUrl + 'schema.json' : 
                finalSchemaUrl + '/schema.json';
            
            this.log('Loading schema from:', fullSchemaUrl);
            const response = await fetch(fullSchemaUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            this.logError('Failed to load schema from:', schemaUrl, error);
            throw new Error(`Could not load schema: ${error.message}`);
        }
    }

    /**
     * Validate frontmatter against schema
     */
    validateFrontmatter() {
        if (!this.schema?.frontmatterSchema) {
            this.log('No frontmatter schema to validate against');
            return;
        }

        // TODO: Implement JSON Schema validation
        this.log('Frontmatter validation not yet implemented');
    }

    /**
     * Parse markdown body according to schema rules
     */
    parseMarkdownBody(body) {
        const sections = [];
        const lines = body.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (headingMatch) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                // Start new section
                currentSection = {
                    type: 'heading',
                    level: headingMatch[1].length,
                    text: headingMatch[2],
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(line);
            } else {
                // Content before first heading
                if (!sections.length || sections[sections.length - 1].type !== 'prose') {
                    sections.push({ type: 'prose', content: [] });
                }
                sections[sections.length - 1].content.push(line);
            }
        }

        // Add final section
        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Apply CSS styles from schema
     */
    async applySchemaStyles() {
        if (!this.schema?.styling?.css) {
            this.log('No styling information in schema');
            return;
        }

        const styling = this.schema.styling.css;
        
        // Load main CSS file if specified
        if (styling.main) {
            const cssUrl = this.resolveSchemaRelativeUrl(styling.main);
            await this.loadCSS(cssUrl, 'pensieve-main-style');
        }
        
        // Load additional CSS files if specified (for future use)
        if (styling.tokens) {
            const tokensUrl = this.resolveSchemaRelativeUrl(styling.tokens);
            await this.loadCSS(tokensUrl, 'pensieve-tokens');
        }
        
        // Determine theme based on user preference or system
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const themeUrl = isDark ? styling.themeDark : styling.themeLight;
        
        if (themeUrl) {
            const resolvedThemeUrl = this.resolveSchemaRelativeUrl(themeUrl);
            await this.loadCSS(resolvedThemeUrl, 'pensieve-theme');
        }
    }

    /**
     * Resolve a relative URL from the schema's directory
     */
    resolveSchemaRelativeUrl(relativeUrl) {
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            // Already absolute URL
            return relativeUrl;
        }

        // Get the schema base URL (remove /schema.json from the end)
        const schemaUrl = this.frontmatter.pensive_schema;
        let schemaBaseUrl = schemaUrl;
        
        // Apply development URL replacement if needed
        if (this.options.development) {
            const githubBase = 'https://raw.githubusercontent.com/LobsterMan/pensieve/main';
            if (schemaBaseUrl.startsWith(githubBase)) {
                schemaBaseUrl = schemaBaseUrl.replace(githubBase, this.options.localBaseUrl);
                this.log(`Development mode: replaced CSS base URL ${schemaUrl} -> ${schemaBaseUrl}`);
            }
        }

        // Combine base URL with relative path
        const resolvedUrl = schemaBaseUrl.endsWith('/') ? 
            schemaBaseUrl + relativeUrl.replace('./', '') : 
            schemaBaseUrl + '/' + relativeUrl.replace('./', '');

        this.log('Resolved CSS URL:', relativeUrl, '->', resolvedUrl);
        return resolvedUrl;
    }

    /**
     * Load CSS from URL and inject into page
     */
    async loadCSS(url, id) {
        try {
            // Check if already loaded
            if (document.getElementById(id)) {
                return;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSS: ${response.status}`);
            }
            
            const cssText = await response.text();
            const style = document.createElement('style');
            style.id = id;
            style.textContent = cssText;
            document.head.appendChild(style);
            
            this.log('Loaded CSS:', url);
        } catch (error) {
            this.logError('Failed to load CSS:', url, error);
        }
    }

    /**
     * Render the Pensieve note with schema-aware styling
     */
    renderPensieveNote(container) {
        container.innerHTML = '';
        container.className = 'pensieve-note';
        
        // Add type-specific class
        if (this.frontmatter.type) {
            container.classList.add(`pensieve-${this.frontmatter.type}`);
        }

        // Render frontmatter info (title, etc.)
        this.renderFrontmatter(container);

        // Render body sections as vanilla HTML
        this.renderContent(container);

        this.log('Rendered Pensieve note');
    }

    /**
     * Render frontmatter information with deterministic classes
     */
    renderFrontmatter(container) {
        const header = document.createElement('header');
        header.className = 'pensieve-frontmatter';

        // Title
        if (this.frontmatter.title) {
            const title = document.createElement('h1');
            title.className = 'pensieve-title';
            title.textContent = this.frontmatter.title;
            header.appendChild(title);
        }

        // Date
        if (this.frontmatter.date) {
            const date = document.createElement('div');
            date.className = 'pensieve-date';
            date.textContent = this.frontmatter.date;
            header.appendChild(date);
        }

        // Tags
        if (this.frontmatter.tags && Array.isArray(this.frontmatter.tags)) {
            const tagsContainer = document.createElement('ul');
            tagsContainer.className = 'pensieve-tags';
            this.frontmatter.tags.forEach(tag => {
                const tagItem = document.createElement('li');
                tagItem.className = 'pensieve-tag';
                tagItem.textContent = tag;
                tagsContainer.appendChild(tagItem);
            });
            header.appendChild(tagsContainer);
        }

        // Type-specific fields for recipes
        if (this.frontmatter.type === 'recipe') {
            this.renderRecipeFrontmatter(header);
        }

        if (header.children.length > 0) {
            container.appendChild(header);
        }
    }

    /**
     * Render recipe-specific frontmatter fields
     */
    renderRecipeFrontmatter(header) {
        const recipeFields = ['servings', 'prep_time', 'cook_time', 'total_time', 'source'];
        
        recipeFields.forEach(field => {
            if (this.frontmatter[field]) {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = `pensieve-recipe-${field}`;
                fieldDiv.textContent = this.frontmatter[field];
                header.appendChild(fieldDiv);
            }
        });
    }

    /**
     * Render markdown content as vanilla HTML
     */
    renderContent(container) {
        const main = document.createElement('main');
        main.className = 'pensieve-content';

        // Convert markdown body to vanilla HTML
        const htmlContent = this.markdownToHtml(this.markdownBody);
        main.innerHTML = htmlContent;

        container.appendChild(main);
    }

    /**
     * Convert markdown to vanilla HTML (simple implementation)
     */
    markdownToHtml(markdown) {
        const lines = markdown.split('\n');
        const htmlLines = [];
        let inList = false;
        let listType = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
                // Close any open list
                if (inList) {
                    htmlLines.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                htmlLines.push('');
                continue;
            }

            // Handle headings
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                if (inList) {
                    htmlLines.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                htmlLines.push(`<h${level}>${this.escapeHtml(text)}</h${level}>`);
                continue;
            }

            // Handle unordered lists
            const ulMatch = trimmed.match(/^[*+-]\s+(.+)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) htmlLines.push(`</${listType}>`);
                    htmlLines.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                htmlLines.push(`<li>${this.processInlineMarkdown(ulMatch[1])}</li>`);
                continue;
            }

            // Handle ordered lists
            const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) htmlLines.push(`</${listType}>`);
                    htmlLines.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                htmlLines.push(`<li>${this.processInlineMarkdown(olMatch[1])}</li>`);
                continue;
            }

            // Handle images
            const imageMatch = trimmed.match(/^!\[\[(.+?)\]\]$/);
            if (imageMatch) {
                if (inList) {
                    htmlLines.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                htmlLines.push(`<img src="${this.escapeHtml(imageMatch[1])}" alt="${this.escapeHtml(imageMatch[1])}">`);
                continue;
            }

            // Regular paragraph
            if (inList) {
                htmlLines.push(`</${listType}>`);
                inList = false;
                listType = null;
            }
            htmlLines.push(`<p>${this.processInlineMarkdown(trimmed)}</p>`);
        }

        // Close any remaining list
        if (inList) {
            htmlLines.push(`</${listType}>`);
        }

        return htmlLines.join('\n');
    }

    /**
     * Process inline markdown (links, etc.)
     */
    processInlineMarkdown(text) {
        // Handle links [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        return this.escapeHtml(text);
    }

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render basic markdown without schema
     */
    renderMarkdown(container, body) {
        container.innerHTML = '';
        container.className = 'pensieve-markdown';
        
        const pre = document.createElement('pre');
        pre.textContent = body;
        container.appendChild(pre);
        
        this.log('Rendered as basic markdown');
    }

    /**
     * Render error message
     */
    renderError(container, error) {
        container.innerHTML = '';
        container.className = 'pensieve-error';
        
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <h3>Pensieve Error</h3>
            <p>${error.message}</p>
            <details>
                <summary>Details</summary>
                <pre>${error.stack || error.toString()}</pre>
            </details>
        `;
        container.appendChild(errorDiv);
    }

    /**
     * Logging utilities
     */
    log(...args) {
        if (this.options.debug) {
            console.log('[Pensieve]', ...args);
        }
    }

    logError(...args) {
        console.error('[Pensieve]', ...args);
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const reader = new PensieveReader({ 
            debug: true,
            development: true, // Enable development mode for local testing
            localBaseUrl: window.location.origin // Use current origin (e.g., http://localhost:8080)
        });
        reader.init();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PensieveReader;
}
