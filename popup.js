document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
  });

  // Save API key
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ apiKey: apiKey }, () => {
        const savedMessage = document.getElementById('apiKeySaved');
        savedMessage.classList.remove('hidden');
        setTimeout(() => {
          savedMessage.classList.add('hidden');
        }, 3000);
      });
    }
  });

  // Ask ChatGPT button
  document.getElementById('askButton').addEventListener('click', () => {
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
      showError('Please enter a question.');
      return;
    }

    // Clear previous responses and errors
    document.getElementById('responseContainer').classList.add('hidden');
    document.getElementById('errorContainer').classList.add('hidden');

    // Show loading indicator
    const askButton = document.getElementById('askButton');
    const originalText = askButton.textContent;
    askButton.textContent = 'Loading...';
    askButton.disabled = true;

    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        showError('Cannot access the current tab.');
        resetButton();
        return;
      }

      // Send message to background script
      chrome.runtime.sendMessage({ action: 'askChatGPT', prompt: prompt }, (response) => {
        resetButton();

        if (response && response.success) {
          // Show the response
          document.getElementById('responseContent').textContent = response.response;
          document.getElementById('responseContainer').classList.remove('hidden');
        } else {
          // Show error
          showError(response?.error || 'An error occurred while contacting ChatGPT.');
        }
      });
    });

    function resetButton() {
      askButton.textContent = originalText;
      askButton.disabled = false;
    }
  });

  function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
  }
});