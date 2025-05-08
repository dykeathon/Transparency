// Language switch functionality
const languageToggle = document.getElementById('languageToggle');
const languageLabel = document.getElementById('languageLabel');

// User info handling
let userInfo = null;

// Function to hash data using SHA-256
async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get Chrome identity info
chrome.identity.getAuthToken({ interactive: true }, function(token) {
  if (chrome.runtime.lastError) {
    console.error("Auth Error:", chrome.runtime.lastError.message);
    alert("Failed to get authentication token.");
    return;
  }

  fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(async user => {
      console.log("User ID:", user.id);
      // Hash the ID before storing
      const hashedId = await hashData(user.id);
      userInfo = {
        hashedId,
        token
      };
      console.log("Hashed ID:", hashedId);
    })
    .catch(error => {
      console.error("Error fetching user info:", error);
    });
});

document.addEventListener("DOMContentLoaded", async () => {

    const { selectedText } = await chrome.storage.local.get("selectedText");
    const generateButton = document.getElementById("generate");
    const copyButton = document.getElementById("copy");
    const outputElement = document.getElementById("output");
    
    // Initially hide copy button
    copyButton.disabled = true;

    // Session tracking
    const COOLDOWN_SECONDS = 5;
    const minTextLength = 5;
    let lastRequestTime = 0;
    let isRequestInProgress = false;
    
    // Function to check cooldown
    async function checkCooldown() {
      const isHebrew = languageToggle.checked;
      const now = Date.now();
      
      // Check cooldown
      if (now - lastRequestTime < COOLDOWN_SECONDS * 1000) {
        const remainingCooldown = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastRequestTime)) / 1000);
        outputElement.textContent = isHebrew ?
          `אנא המתני ${remainingCooldown} שניות לפני הבקשה הבאה.` :
          `Please wait ${remainingCooldown} seconds before your next request.`;
        return false;
      }
      
      return true;
    }
    
    // Function to update last request time
    async function updateLastRequestTime() {
      lastRequestTime = Date.now();
    }

    // Function to check if text contains mostly non-character symbols
    function hasMostlyNonCharacters(text) {
      // Remove spaces and count characters
      const cleanText = text.replace(/\s+/g, '');
      if (cleanText.length === 0) return true;
      
      // Count letters and common punctuation
      const letterCount = (cleanText.match(/[a-zA-Zא-ת]/g) || []).length;
      const punctuationCount = (cleanText.match(/[.,!?;:'"()]/g) || []).length;
      
      // Calculate percentage of meaningful characters
      const meaningfulChars = letterCount + punctuationCount;
      const percentage = (meaningfulChars / cleanText.length) * 100;
      
      return percentage < 50; // Return true if less than 50% are meaningful characters
    }

    // Function to check for repetitive text
    function hasRepetitiveText(text) {
      // Split text into words
      const words = text.toLowerCase().split(/\s+/);
      
      // Check for repeated words
      for (let i = 0; i < words.length - 2; i++) {
        if (words[i] === words[i + 1] && words[i] === words[i + 2]) {
          return true; // Found 3 consecutive same words
        }
      }
      
      // Check for repeated phrases (2-3 words)
      for (let i = 0; i < words.length - 3; i++) {
        const phrase1 = words.slice(i, i + 2).join(' ');
        const phrase2 = words.slice(i + 2, i + 4).join(' ');
        if (phrase1 === phrase2) {
          return true; // Found repeated phrase
        }
      }
      
      return false;
    }

    // Function to check for non-content patterns
    function hasNonContentPatterns(text) {
      const nonContentPatterns = [
        'read more',
        'see details',
        'click here',
        'learn more',
        'read more...',
        'see more',
        'continue reading',
        'קרא עוד',
        'לחץ כאן',
        'למידע נוסף',
        'לפרטים נוספים'
      ];
      
      const lowerText = text.toLowerCase();
      return nonContentPatterns.some(pattern => lowerText.includes(pattern));
    }
    
    // Function to validate input and update UI
    async function validateInput(text) {
      const isHebrew = languageToggle.checked;
      
      if (!text || text.trim() === "") {
        generateButton.disabled = true;
        copyButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "בבקשה סמנו טקסט" : 
          "Please select some text first";
        return false;
      }
      
      if (text.length < minTextLength) {
        generateButton.disabled = true;
        copyButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          `הטקסט המסומן חייב להיות לפחות ${minTextLength} תווים` : 
          `Selected text must be at least ${minTextLength} characters long`;
        return false;
      }

      if (hasMostlyNonCharacters(text)) {
        generateButton.disabled = true;
        copyButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "הטקסט המסומן מכיל יותר מדי מספרים או סימנים. אנא בחרי טקסט עם יותר מילים." : 
          "The selected text contains too many numbers or symbols. Please select text with more words.";
        return false;
      }

      if (hasRepetitiveText(text)) {
        generateButton.disabled = true;
        copyButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "הטקסט המסומן מכיל יותר מדי חזרות. אנא בחרי טקסט מגוון יותר." : 
          "The selected text contains too many repetitions. Please select more varied text.";
        return false;
      }

      if (hasNonContentPatterns(text)) {
        generateButton.disabled = true;
        copyButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "הטקסט המסומן מכיל ביטויים שאינם מתאימים. אנא בחרי טקסט תוכן אמיתי." : 
          "The selected text contains non-content patterns. Please select actual content text.";
        return false;
      }

      // Check cooldown
      if (!await checkCooldown()) {
        generateButton.disabled = true;
        copyButton.disabled = true;
        return false;
      }
      
      generateButton.disabled = false;
      copyButton.disabled = true; // Keep copy disabled until response is generated
      outputElement.textContent = "";
      return true;
    }

    // Set initial input and validate
    document.getElementById("input").value = selectedText || "“Trans people are just confused.”";
    validateInput(document.getElementById("input").value);

    // Set initial state of include link container
    const includeLinkContainer = document.getElementById("includelink-container");
    includeLinkContainer.style.display = document.getElementById("tone").value === "Informative" ? "block" : "none";

    // Add event listener for tone changes
    document.getElementById("tone").addEventListener("change", function () {
      includeLinkContainer.style.display = this.value === "Informative" ? "block" : "none";
      // Reset checkbox when hidden
      if (this.value !== "Informative") {
        document.getElementById("includeLink").checked = false;
      }
    });

    // Update validation message when language changes
    languageToggle.addEventListener("change", function() {
      validateInput(document.getElementById("input").value);
    });

    document.getElementById("generate").addEventListener("click", async () => {
      const input = document.getElementById("input").value;
      
      // Prevent double-send
      if (isRequestInProgress) {
        return;
      }
      
      // Validate input before proceeding
      if (!await validateInput(input)) {
        return;
      }

      // Set request in progress
      isRequestInProgress = true;
      generateButton.disabled = true;
      copyButton.disabled = true;

      const tone = document.getElementById("tone").value;
      const length = document.getElementById("length").value;
      const includeLink = document.getElementById("includeLink").checked ? "yes" : "no";

      const prompt = `
  [Simulated request]
  Comment: "${input}"
  Tone: ${tone}
  Length: ${length}
  Include links: ${includeLink}
  User ID: ${userInfo?.hashedId || 'anonymous'}
  Language: ${languageToggle.checked ? 'Hebrew' : 'English'}
  `;

      const requestBody = {
        hateful_content: input,
        response_generation_parameters: {
          length: document.getElementById('length').value.toLowerCase().replace('-', '_'),
          tone: document.getElementById('tone').value.toLowerCase().replace('-', '_'),
          should_include_links: document.getElementById('includeLink').checked,
          content_language: languageToggle.checked ? 'hebrew' : 'english'
        }
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      document.getElementById("output").textContent = languageToggle.checked ? 
        "⌛ יוצר תגובה..." : 
        "⌛ Generating response...";

      // Update last request time
      await updateLastRequestTime();

      // Send request to backend
      try {
        console.log('Sending request to:', "https://transparency-p5a6.onrender.com/transparency/generate_response");
        console.log('With headers:', {
          "Content-Type": "application/json",
          "X-User-ID": userInfo?.hashedId || 'anonymous',
          "X-Language": languageToggle.checked ? 'he' : 'en'
        });

        const response = await fetch("https://transparency-p5a6.onrender.com/transparency/generate_response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userInfo?.hashedId || 'anonymous',
            "X-Language": languageToggle.checked ? 'he' : 'en'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        console.log('Success response:', data);
        
        // Display the generated response
        let responseText = data.content;
        if (data.links && data.links.length > 0) {
          responseText += '\n\nResources:\n' + data.links.map(link => `- ${link}`).join('\n');
        }
        
        document.getElementById("output").textContent = responseText;
        copyButton.disabled = false;
        likeButton.disabled = false;
        dislikeButton.disabled = false;
      } catch (error) {
        console.error("Full error details:", error);
        document.getElementById("output").textContent = languageToggle.checked ? 
          "אירעה שגיאה ביצירת התגובה. אנא נסי שוב." : 
          "An error occurred while generating the response. Please try again.";
        copyButton.disabled = true;
        likeButton.disabled = true;
        dislikeButton.disabled = true;
      } finally {
        // Re-enable generate button after response
        generateButton.disabled = false;
        isRequestInProgress = false;
      }
    });

    document.getElementById("copy").addEventListener("click", () => {
      const text = document.getElementById("output").textContent;
      navigator.clipboard.writeText(text).then(() => {
        const isHebrew = languageToggle.checked;
        const successMessages = isHebrew ? [
          "!הועתק! ממשיכים להילחם בטרנספוביה💪",
          "מעולה! התגובה הועתקה. המשיכו להיות בעלי.ות ברית! 🌈",
          "הועתק בהצלחה! יחד נוכל לשנות את העולם 🌟",
          "כל הכבוד! ממשיכיםות להפיץ אהבה ותמיכה 💖",
          "התגובה שלך יכולה לעזור למישהו להרגיש נראה 💬",
          "אתםן עושיםות את ההבדל 👏"
        ] : [
          "Copied successfully! Keep fighting transphobia! 💪",
          "Great job! Response copied. Keep being an ally! 🌈",
          "Copied! Together we can change the world 🌟",
          "Well done! Keep spreading love and support 💖",
          "💬 Your response may help someone feel seen.",
          "👏 You're making a difference."
        ];
        
        const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        
        // Create success message element if it doesn't exist
        let successElement = document.getElementById('success-message');
        if (!successElement) {
          successElement = document.createElement('div');
          successElement.id = 'success-message';
          successElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            width: 100%;
            box-sizing: border-box;
          `;
          document.getElementById('output').style.position = 'relative';
          document.getElementById('output').appendChild(successElement);
        }
        
        // Show the message
        successElement.textContent = randomMessage;
        successElement.style.opacity = '1';
        
        // Hide the message after 3 seconds with fade effect
        setTimeout(() => {
          successElement.style.opacity = '0';
        }, 3000);
      });
    });

    // Add like/dislike button functionality
    const likeButton = document.getElementById("like");
    const dislikeButton = document.getElementById("dislike");

    // Initially disable feedback buttons
    likeButton.disabled = true;
    dislikeButton.disabled = true;

    // Function to handle feedback
    function handleFeedback(type) {
      const isHebrew = languageToggle.checked;
      const feedbackMessage = isHebrew ? 
        "תודה על המשוב!" : 
        "Thank you for your feedback!";
      
      // Disable both buttons after feedback
      likeButton.disabled = true;
      dislikeButton.disabled = true;
      
      // Show feedback message
      const output = document.getElementById("output");
      const originalText = output.textContent;
      output.textContent = `${originalText}\n\n${feedbackMessage}`;
    }

    likeButton.addEventListener("click", () => handleFeedback("like"));
    dislikeButton.addEventListener("click", () => handleFeedback("dislike"));
});


function updateLanguage(isHebrew) {
  // Update all elements with data attributes
  document.querySelectorAll('[data-en][data-he]').forEach(element => {
    element.textContent = isHebrew ? element.getAttribute('data-he') : element.getAttribute('data-en');
  });

  // Update select options
  document.querySelectorAll('select option').forEach(option => {
    if (option.hasAttribute('data-en') && option.hasAttribute('data-he')) {
      option.textContent = isHebrew ? option.getAttribute('data-he') : option.getAttribute('data-en');
    }
  });

  // Update document direction
  document.body.style.direction = isHebrew ? 'rtl' : 'ltr';
}

languageToggle.addEventListener('change', function () {
  const isHebrew = this.checked;
  languageLabel.textContent = isHebrew ? 'עברית' : 'English';
  updateLanguage(isHebrew);
});
