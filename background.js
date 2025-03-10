// background.js
// ===========================================================
// Global variables to store the extracted content
let pageContent = '';
let pageTitle = '';

// Create context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askAboutPage",
    title: "Ask ChatGPT about this page",
    contexts: ["page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAboutPage") {
    // Send message to content script to show prompt dialog
    chrome.tabs.sendMessage(tab.id, { action: 'showPromptDialog' });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storePageContent') {
    // Store the extracted content
    pageContent = request.content;
    pageTitle = request.title;
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getPageContent') {
    // Return the stored content
    sendResponse({ content: pageContent, title: pageTitle });
    return true;
  }

  if (request.action === 'askChatGPT') {
    // Make a request to ChatGPT API
    askChatGPT(request.prompt, pageContent)
      .then(response => {
        sendResponse({ success: true, response: response });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Function to make a request to ChatGPT API
async function askChatGPT(prompt, content) {
  // Retrieve API key from storage
  const data = await chrome.storage.sync.get(['apiKey']);
  const apiKey = data.apiKey;

  if (!apiKey) {
    throw new Error('API key not found. Please set your ChatGPT API key in the extension settings.');
  }

  // Prepare the API request
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes web page content.'
        },
        {
          role: 'user',
          content: `The following is the content of a web page. ${prompt}\n\nPage content:\n${content}`
        }
      ],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const responseData = await response.json();
  return responseData.choices[0].message.content;
}