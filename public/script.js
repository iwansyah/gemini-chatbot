const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = form.querySelector('button'); // Get a reference to the button

// --- Appends a user's message to the chat box instantly ---
function appendUserMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('message', 'user');
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Types out a bot's message character by character ---
function typeBotMessage(fullText, onComplete) {
    const msgElement = document.createElement('div');
    msgElement.classList.add('message', 'bot');
    chatBox.appendChild(msgElement); // Add the empty bubble first
    chatBox.scrollTop = chatBox.scrollHeight;

    const paragraphs = fullText.split('\n');
    let paragraphIndex = 0;
    const typingSpeed = 30; // milliseconds per character; adjust for desired speed

    function typeNextCharacterOfParagraph(currentPElement, paragraphText, charIndex) {
        if (charIndex < paragraphText.length) {
            currentPElement.textContent += paragraphText.charAt(charIndex);
            chatBox.scrollTop = chatBox.scrollHeight;
            setTimeout(() => typeNextCharacterOfParagraph(currentPElement, paragraphText, charIndex + 1), typingSpeed);
        } else {
            // Current paragraph finished, type next paragraph
            typeNextParagraph();
        }
    }

    function typeNextParagraph() {
        if (paragraphIndex < paragraphs.length) {
            const pText = paragraphs[paragraphIndex];
            const pElement = document.createElement('p');
            // Optional: Add margin if default <p> styling is not enough
            // pElement.style.margin = "0 0 0.25em 0"; // Example
            msgElement.appendChild(pElement);
            chatBox.scrollTop = chatBox.scrollHeight;

            paragraphIndex++;
            typeNextCharacterOfParagraph(pElement, pText, 0);
        } else {
            // All paragraphs typed
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        }
    }
    typeNextParagraph(); // Start the process
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;
  appendUserMessage(userMessage); // Use specific function for user message
  input.value = '';

  // Add a visual loading indicator element
  const loadingIndicator = document.createElement('div');
  loadingIndicator.classList.add('message', 'bot', 'loading-indicator'); // Add 'loading-indicator' class for styling
  loadingIndicator.textContent = 'Typing'; // Base text for the indicator
  chatBox.appendChild(loadingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the new message

  // Disable input and button
  input.disabled = true;
  sendButton.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    // Always remove the loading indicator if it's still there
    if (chatBox.contains(loadingIndicator)) {
      chatBox.removeChild(loadingIndicator);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ reply: "Server returned an error, but no details were provided." }));
      throw new Error(errorData.reply || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    typeBotMessage(data.reply, () => {
      // Re-enable input and button AFTER typing is complete
      input.disabled = false;
      sendButton.disabled = false;
      input.focus(); // Optionally focus the input field
    });
  } catch (error) {
    // Ensure loading indicator is removed if it hasn't been already
    if (chatBox.contains(loadingIndicator)) {
        chatBox.removeChild(loadingIndicator);
    }

    console.error('Error sending message to API:', error);
    typeBotMessage(`Sorry, something went wrong: ${error.message}`, () => {
      // Re-enable input and button AFTER error typing is complete
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    });
  }
});
// The old generic appendMessage function is no longer needed.
