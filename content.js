// content.js
// ===========================================================
// Function to extract the readable content from the page
function extractReadableContent() {
  // Check if we're in a frame and if so, don't proceed
  if (window !== window.top) return;

  // Extract the page title
  const pageTitle = document.title;

  // Extract all text content from the body
  const pageContent = document.querySelector("body").innerText;

  // Send the extracted content to the background script
  chrome.runtime.sendMessage({
    action: 'storePageContent',
    content: pageContent,
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

// Add floating action button to the page
function addFloatingButton() {
  // Check if we're in a frame and if so, don't proceed
  if (window !== window.top) return;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'page-reader-fab';
  buttonContainer.style.position = 'fixed';
  buttonContainer.style.right = '20px';
  buttonContainer.style.top = '20px';
  buttonContainer.style.zIndex = '10000';
  buttonContainer.style.width = '40px';
  buttonContainer.style.height = '40px';
  buttonContainer.style.borderRadius = '50%';
  buttonContainer.style.backgroundColor = '#4285f4';
  buttonContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  buttonContainer.style.cursor = 'pointer';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.transition = 'all 0.3s ease';

  // Create button icon (a simple magnifying glass)
  const buttonIcon = document.createElement('div');
  buttonIcon.innerHTML = '?';
  buttonIcon.style.color = 'white';
  buttonIcon.style.fontSize = '20px';
  buttonIcon.style.fontWeight = 'bold';

  buttonContainer.appendChild(buttonIcon);
  document.body.appendChild(buttonContainer);

  // Add hover effect
  buttonContainer.addEventListener('mouseover', () => {
    buttonContainer.style.transform = 'scale(1.1)';
  });

  buttonContainer.addEventListener('mouseout', () => {
    buttonContainer.style.transform = 'scale(1)';
  });

  // Add click event
  buttonContainer.addEventListener('click', () => {
    const promptInput = prompt('Ask something about this page:');
    if (promptInput) {
      // Show loading indicator
      const originalText = buttonIcon.innerHTML;
      buttonIcon.innerHTML = '⏳';

      chrome.runtime.sendMessage(
        { action: 'askChatGPT', prompt: promptInput },
        (response) => {
          buttonIcon.innerHTML = originalText;

          if (response.success) {
            // Create a modal to display the response
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.backgroundColor = 'white';
            modal.style.padding = '20px';
            modal.style.borderRadius = '8px';
            modal.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            modal.style.zIndex = '10001';
            modal.style.maxWidth = '600px';
            modal.style.width = '80%';
            modal.style.maxHeight = '80vh';
            modal.style.overflow = 'auto';

            const modalContent = document.createElement('div');
            const title = document.createElement('h3');
            title.textContent = promptInput;
            title.style.marginTop = '0';

            const content = document.createElement('p');
            content.textContent = response.response;
            content.style.whiteSpace = 'pre-wrap';

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.padding = '8px 16px';
            closeButton.style.backgroundColor = '#4285f4';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '4px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginTop = '15px';

            modalContent.appendChild(title);
            modalContent.appendChild(content);
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100%';
            backdrop.style.height = '100%';
            backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
            backdrop.style.zIndex = '10000';
            document.body.appendChild(backdrop);

            // Close modal on button click or backdrop click
            closeButton.addEventListener('click', () => {
              document.body.removeChild(modal);
              document.body.removeChild(backdrop);
            });

            backdrop.addEventListener('click', () => {
              document.body.removeChild(modal);
              document.body.removeChild(backdrop);
            });
          } else {
            alert(`Error: ${response.error || 'Unknown error occurred'}`);
          }
        }
      );
    }
  });
}

// Add the floating button after the page loads
window.addEventListener('load', () => {
  setTimeout(addFloatingButton, 1500);
});