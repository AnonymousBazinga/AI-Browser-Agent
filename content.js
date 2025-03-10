// content.js
// ===========================================================
// Function to extract the readable content from the page using DOMAwareTextSplitter
function extractReadableContent() {
  // Check if we're in a frame and if so, don't proceed
  if (window !== window.top) return;

  // Extract the page title
  const pageTitle = document.title;

  // Use the DOMAwareTextSplitter to extract content
  const splitter = new DOMAwareTextSplitter();
  const result = splitter.extractContent();

  // Send the extracted content to the background script
  chrome.runtime.sendMessage({
    action: 'storePageContent',
    content: result.content,
    title: pageTitle
  });
}

// Run the extraction when the page is fully loaded
window.addEventListener('load', () => {
  setTimeout(extractReadableContent, 1000); // Give a slight delay to ensure page is fully rendered
});

// Re-extract content when the page changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(extractReadableContent, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Create a modal dialog for the chat prompt
function createPromptDialog() {
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'page-reader-modal';
  modal.style.position = 'fixed';
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  modal.style.zIndex = '2147483647'; // Maximum z-index
  modal.style.maxWidth = '500px';
  modal.style.width = '80%';
  modal.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';

  // Create modal content
  const title = document.createElement('h3');
  title.textContent = 'Ask about this page';
  title.style.margin = '0 0 15px 0';
  title.style.color = '#4285f4';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'E.g., Summarize this article';
  input.style.width = '100%';
  input.style.padding = '10px';
  input.style.marginBottom = '15px';
  input.style.boxSizing = 'border-box';
  input.style.border = '1px solid #ddd';
  input.style.borderRadius = '4px';

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.justifyContent = 'flex-end';
  buttonsContainer.style.gap = '10px';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.backgroundColor = '#f2f2f2';
  cancelButton.style.color = '#444';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.cursor = 'pointer';

  const askButton = document.createElement('button');
  askButton.textContent = 'Ask ChatGPT';
  askButton.style.padding = '8px 16px';
  askButton.style.backgroundColor = '#4285f4';
  askButton.style.color = 'white';
  askButton.style.border = 'none';
  askButton.style.borderRadius = '4px';
  askButton.style.cursor = 'pointer';

  // Append elements
  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(askButton);
  modal.appendChild(title);
  modal.appendChild(input);
  modal.appendChild(buttonsContainer);

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
  backdrop.style.zIndex = '2147483646'; // Just below modal

  // Add event listeners
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });

  backdrop.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });

  askButton.addEventListener('click', () => {
    const promptInput = input.value.trim();
    if (promptInput) {
      // Show loading state
      askButton.textContent = 'Loading...';
      askButton.disabled = true;

      chrome.runtime.sendMessage(
        { action: 'askChatGPT', prompt: promptInput },
        (response) => {
          // Remove prompt dialog
          document.body.removeChild(modal);
          document.body.removeChild(backdrop);

          if (response.success) {
            // Show response in a new modal
            showResponseModal(promptInput, response.response);
          } else {
            // Show error
            alert(`Error: ${response.error || 'Unknown error occurred'}`);
          }
        }
      );
    }
  });

  // Allow pressing Enter to submit
  input.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      askButton.click();
    }
  });

  // Append to body
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // Focus the input
  input.focus();
}

// Show response modal
function showResponseModal(question, answer) {
  // Create modal container
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  modal.style.zIndex = '2147483647';
  modal.style.maxWidth = '600px';
  modal.style.width = '80%';
  modal.style.maxHeight = '80vh';
  modal.style.overflow = 'auto';
  modal.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';

  // Create modal content
  const title = document.createElement('h3');
  title.textContent = question;
  title.style.marginTop = '0';
  title.style.color = '#4285f4';

  const content = document.createElement('div');
  content.textContent = answer;
  content.style.whiteSpace = 'pre-wrap';
  content.style.lineHeight = '1.5';
  content.style.margin = '15px 0';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.padding = '8px 16px';
  closeButton.style.backgroundColor = '#4285f4';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.float = 'right';

  // Append elements
  modal.appendChild(title);
  modal.appendChild(content);
  modal.appendChild(closeButton);

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
  backdrop.style.zIndex = '2147483646';

  // Add event listeners
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });

  backdrop.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.removeChild(backdrop);
  });

  // Append to body
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showPromptDialog') {
    createPromptDialog();
  }
  return true;
});