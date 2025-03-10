// langchain-dom-splitter.js
// Implementation of a DOM-aware text splitter inspired by LangChain

/**
 * DOMAwareTextSplitter
 * A text extraction utility for webpages that intelligently preserves content structure
 * and context by considering DOM hierarchy and semantic importance.
 */
class DOMAwareTextSplitter {
  constructor() {
    // Tags to exclude completely from extraction
    this.excludeTags = new Set([
      'script', 'style', 'noscript', 'svg', 'canvas', 'template', 'iframe',
      'button', 'input', 'select', 'textarea', 'form'
    ]);

    // Tags that generally contain important content
    this.contentTags = new Set([
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'article',
      'section', 'main', 'span', 'div', 'blockquote', 'pre', 'code'
    ]);

    // Prioritize these tags as they tend to contain the main content
    this.priorityTags = new Set([
      'article', 'main', 'section', 'div.content', 'div.main', 'div.article',
      '.content', '.main', '.article', '.post', '.blog-post'
    ]);
  }

  /**
   * Extract content from the DOM, preserving hierarchical structure
   * and prioritizing important content
   */
  extractContent(rootElement = document.body) {
    // Create storage for extracted content
    let extractedText = [];
    let metadata = {};

    // Get the page title
    metadata.title = document.title;
    metadata.url = window.location.href;

    // Extract headings for structure
    const headings = this._extractHeadings();
    if (headings.length > 0) {
      metadata.headings = headings;
    }

    // First try to find main content areas
    const priorityElements = this._findPriorityElements();

    if (priorityElements.length > 0) {
      // If we found priority content areas, focus on those
      priorityElements.forEach(element => {
        extractedText.push(...this._extractFromElement(element));
      });
    } else {
      // Otherwise, extract from the entire body with structure
      extractedText = this._extractFromElement(rootElement);
    }

    // Clean and combine text chunks
    let cleanedText = this._cleanAndFormatText(extractedText);

    return {
      content: cleanedText,
      metadata: metadata
    };
  }

  /**
   * Find elements that likely contain the main content
   */
  _findPriorityElements() {
    const results = [];

    // Check each priority selector
    this.priorityTags.forEach(selector => {
      // Handle both tag names and CSS selectors
      let elements;
      if (selector.includes('.')) {
        elements = document.querySelectorAll(selector);
      } else {
        elements = document.getElementsByTagName(selector);
      }

      // Filter out small elements that likely aren't main content
      Array.from(elements).forEach(el => {
        // Only include reasonably sized content
        if (el.textContent && el.textContent.length > 500) {
          results.push(el);
        }
      });
    });

    return results;
  }

  /**
   * Extract headings to preserve document structure
   */
  _extractHeadings() {
    const headings = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headingElements.forEach(el => {
      if (el.textContent && el.textContent.trim()) {
        headings.push({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent.trim()
        });
      }
    });

    return headings;
  }

  /**
   * Recursively extract content from an element and its children
   */
  _extractFromElement(element, depth = 0) {
    if (!element || this.excludeTags.has(element.tagName.toLowerCase())) {
      return [];
    }

    const results = [];
    const tagName = element.tagName.toLowerCase();

    // Check if this element has its own text content (not just from children)
    let ownText = this._getDirectTextContent(element);

    // If it's a content element with text, add it with appropriate metadata
    if (ownText && this.contentTags.has(tagName)) {
      results.push({
        text: ownText,
        tag: tagName,
        depth: depth,
        isHeading: /^h[1-6]$/.test(tagName)
      });
    }

    // Process children
    Array.from(element.children).forEach(child => {
      results.push(...this._extractFromElement(child, depth + 1));
    });

    return results;
  }

  /**
   * Get direct text content of an element (excluding child elements)
   */
  _getDirectTextContent(element) {
    let text = '';

    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    });

    return text.trim();
  }

  /**
   * Clean and format the extracted text chunks
   */
  _cleanAndFormatText(textChunks) {
    if (textChunks.length === 0) return '';

    // Convert array of chunks to formatted text
    return textChunks
      .filter(chunk => chunk.text && chunk.text.trim().length > 0)
      .map(chunk => {
        // Add hierarchy info for headings
        if (chunk.isHeading) {
          return `## ${chunk.text}`;
        }
        return chunk.text;
      })
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
  }
}

// Make the splitter available globally
window.DOMAwareTextSplitter = DOMAwareTextSplitter;