// ================= Language switch refs =================
const languageToggle = document.getElementById('languageToggle');
const languageLabel  = document.getElementById('languageLabel');

// ================= User info =================
let userInfo = null; // { hashedId, idToken }

// ---- SHA-256 helper ----
async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ================= OIDC (ID token) =================
// Get Google **ID token** (JWT starting with eyJ...)
async function getGoogleIdToken() {
  const clientId    = "<YOUR_WEB_CLIENT_ID>.apps.googleusercontent.com"; // <-- REPLACE
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
  const nonce       = crypto.randomUUID();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("nonce", nonce);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (uri) => {
        if (chrome.runtime.lastError || !uri) {
          return reject(chrome.runtime.lastError || new Error("Auth flow failed"));
        }
        const params  = new URLSearchParams(new URL(uri).hash.slice(1));
        const idToken = params.get("id_token");
        return idToken ? resolve(idToken) : reject(new Error("No id_token in response"));
      }
    );
  });
}

// Decode JWT payload helper
function decodeJwtPayload(idToken) {
  const payloadBase64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(payloadBase64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(json);
}

// Acquire ID token up front and prepare userInfo.hashedId
(async () => {
  try {
    const idToken = await getGoogleIdToken();
    const payload = decodeJwtPayload(idToken); // has 'sub', 'email', etc.
    const stableId = payload.sub || payload.email || 'anonymous';
    const hashedId = await hashData(stableId);
    userInfo = { hashedId, idToken };
    console.log("OIDC OK, hashedId:", hashedId);
  } catch (e) {
    console.error("OIDC auth error (will retry on send):", e);
    userInfo = { hashedId: 'anonymous', idToken: null };
  }
})();

// ================= Main UI / logic =================
document.addEventListener("DOMContentLoaded", async () => {
  const { selectedText } = await chrome.storage.local.get("selectedText");
  const generateButton   = document.getElementById("generate");
  const copyButton       = document.getElementById("copy");
  const outputElement    = document.getElementById("output");

  // Initially hide copy button
  copyButton.disabled = true;

  // ----- Session tracking -----
  const COOLDOWN_SECONDS = 5;
  const minTextLength = 5;
  let lastRequestTime = 0;
  let isRequestInProgress = false;

  async function checkCooldown() {
    const isHebrew = languageToggle.checked;
    const now = Date.now();
    if (now - lastRequestTime < COOLDOWN_SECONDS * 1000) {
      const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastRequestTime)) / 1000);
      outputElement.textContent = isHebrew
        ? `אנא המתני ${remaining} שניות לפני הבקשה הבאה.`
        : `Please wait ${remaining} seconds before your next request.`;
      return false;
    }
    return true;
  }
  async function updateLastRequestTime() { lastRequestTime = Date.now(); }

  // ----- Validation helpers -----
  function hasMostlyNonCharacters(text) {
    const cleanText = text.replace(/\s+/g, '');
    if (cleanText.length === 0) return true;
    const letterCount = (cleanText.match(/[a-zA-Zא-ת]/g) || []).length;
    const punctuationCount = (cleanText.match(/[.,!?;:'"()]/g) || []).length;
    const meaningfulChars = letterCount + punctuationCount;
    const percentage = (meaningfulChars / cleanText.length) * 100;
    return percentage < 50;
  }

  function hasRepetitiveText(text) {
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i] === words[i + 1] && words[i] === words[i + 2]) return true;
    }
    for (let i = 0; i < words.length - 3; i++) {
      const phrase1 = words.slice(i, i + 2).join(' ');
      const phrase2 = words.slice(i + 2, i + 4).join(' ');
      if (phrase1 === phrase2) return true;
    }
    return false;
  }

  function hasNonContentPatterns(text) {
    const patterns = [
      'read more','see details','click here','learn more','read more...','see more','continue reading',
      'קרא עוד','לחץ כאן','למידע נוסף','לפרטים נוספים'
    ];
    const lower = text.toLowerCase();
    return patterns.some(p => lower.includes(p));
  }

  async function validateInput(text) {
    const isHebrew = languageToggle.checked;

    if (!text || text.trim() === "") {
      generateButton.disabled = true;
      copyButton.disabled = true;
      outputElement.textContent = isHebrew ? "בבקשה סמנו טקסט" : "Please select some text first";
      return false;
    }
    if (text.length < minTextLength) {
      generateButton.disabled = true;
      copyButton.disabled = true;
      outputElement.textContent = isHebrew
        ? `הטקסט המסומן חייב להיות לפחות ${minTextLength} תווים`
        : `Selected text must be at least ${minTextLength} characters long`;
      return false;
    }
    if (hasMostlyNonCharacters(text)) {
      generateButton.disabled = true;
      copyButton.disabled = true;
      outputElement.textContent = isHebrew
        ? "הטקסט המסומן מכיל יותר מדי מספרים או סימנים. אנא בחרי טקסט עם יותר מילים."
        : "The selected text contains too many numbers or symbols. Please select text with more words.";
      return false;
    }
    if (hasRepetitiveText(text)) {
      generateButton.disabled = true;
      copyButton.disabled = true;
      outputElement.textContent = isHebrew
        ? "הטקסט המסומן מכיל יותר מדי חזרות. אנא בחרי טקסט מגוון יותר."
        : "The selected text contains too many repetitions. Please select more varied text.";
      return false;
    }
    if (hasNonContentPatterns(text)) {
      generateButton.disabled = true;
      copyButton.disabled = true;
      outputElement.textContent = isHebrew
        ? "הטקסט המסומן מכיל ביטויים שאינם מתאימים. אנא בחרי טקסט תוכן אמיתי."
        : "The selected text contains non-content patterns. Please select actual content text.";
      return false;
    }
    if (!await checkCooldown()) {
      generateButton.disabled = true;
      copyButton.disabled = true;
      return false;
    }

    generateButton.disabled = false;
    copyButton.disabled = true;
    outputElement.textContent = "";
    return true;
  }

  // Initial input & UI
  document.getElementById("input").value = selectedText || "“Trans people are just confused.”";
  validateInput(document.getElementById("input").value);

  const includeLinkContainer = document.getElementById("includelink-container");
  includeLinkContainer.style.display = document.getElementById("tone").value === "Informative" ? "block" : "none";
  document.getElementById("tone").addEventListener("change", function () {
    includeLinkContainer.style.display = this.value === "Informative" ? "block" : "none";
    if (this.value !== "Informative") document.getElementById("includeLink").checked = false;
  });

  languageToggle.addEventListener("change", function () {
    validateInput(document.getElementById("input").value);
  });

  // ================= Generate (REAL backend call) =================
  document.getElementById("generate").addEventListener("click", async () => {
    const input = document.getElementById("input").value;
    if (isRequestInProgress || !await validateInput(input)) return;

    isRequestInProgress = true;
    generateButton.disabled = true;
    copyButton.disabled = true;

    const requestBody = {
      hateful_content: input,
      response_generation_parameters: {
        length: document.getElementById('length').value.toLowerCase().replace('-', '_'),
        tone: document.getElementById('tone').value.toLowerCase().replace('-', '_'),
        should_include_links: document.getElementById('includeLink').checked,
        content_language: languageToggle.checked ? 'hebrew' : 'english'
      }
    };

    outputElement.textContent = languageToggle.checked ? "⌛ יוצר תגובה..." : "⌛ Generating response...";
    await updateLastRequestTime();

    try {
      // Ensure we have an ID token; if initial attempt failed, try again now
      const idToken = userInfo?.idToken || await getGoogleIdToken();
      if (!userInfo?.hashedId) {
        // derive stable hashedId from token payload if missing
        const payload = decodeJwtPayload(idToken);
        const stableId = payload.sub || payload.email || 'anonymous';
        userInfo = { ...(userInfo || {}), hashedId: await hashData(stableId), idToken };
      }

      const response = await fetch("https://transparency-p5a6.onrender.com/transparency/generate_response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,                 // <-- IMPORTANT
          "X-User-ID": userInfo?.hashedId || 'anonymous',
          "X-Language": languageToggle.checked ? 'he' : 'en'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json(); // { content, links }
      let responseText = data.content || "";
      if (Array.isArray(data.links) && data.links.length) {
        responseText += '\n\nResources:\n' + data.links.map(l => `- ${l}`).join('\n');
      }

      outputElement.textContent = responseText;
      document.getElementById("copy").disabled = false;
      document.getElementById("like").disabled = false;
      document.getElementById("dislike").disabled = false;
    } catch (err) {
      console.error("Request failed:", err);
      outputElement.textContent = languageToggle.checked
        ? "אירעה שגיאה ביצירת התגובה. אנא נסי שוב."
        : "An error occurred while generating the response. Please try again.";
      document.getElementById("copy").disabled = true;
      document.getElementById("like").disabled = true;
      document.getElementById("dislike").disabled = true;
    } finally {
      generateButton.disabled = false;
      isRequestInProgress = false;
    }
  });

  // ================= Copy button =================
  document.getElementById("copy").addEventListener("click", () => {
    const text = outputElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const isHebrew = languageToggle.checked;
      const messages = isHebrew
        ? ["!הועתק! ממשיכים להילחם בטרנספוביה💪", "מעולה! התגובה הועתקה. 🌈"]
        : ["Copied successfully! 💪", "Great job! Response copied. 🌈"];

      let successElement = document.getElementById('success-message');
      if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'success-message';
        successElement.style.cssText = `
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          background-color: #4CAF50; color: white; padding: 10px 20px;
          border-radius: 5px; opacity: 0; transition: opacity 0.3s ease-in-out;
          z-index: 1000; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          width: 100%; box-sizing: border-box;
        `;
        document.getElementById('output').style.position = 'relative';
        document.getElementById('output').appendChild(successElement);
      }

      successElement.textContent = messages[Math.floor(Math.random() * messages.length)];
      successElement.style.opacity = '1';
      setTimeout(() => { successElement.style.opacity = '0'; }, 3000);
    });
  });

  // ================= Like / Dislike =================
  const likeButton = document.getElementById("like");
  const dislikeButton = document.getElementById("dislike");
  likeButton.disabled = true;
  dislikeButton.disabled = true;

  function handleFeedback(type) {
    const msg = languageToggle.checked ? "תודה על המשוב!" : "Thank you for your feedback!";
    likeButton.disabled = true;
    dislikeButton.disabled = true;
    outputElement.textContent += `\n\n${msg}`;
  }

  likeButton.addEventListener("click", () => handleFeedback("like"));
  dislikeButton.addEventListener("click", () => handleFeedback("dislike"));
});

// ================= Language switching =================
function updateLanguage(isHebrew) {
  document.querySelectorAll('[data-en][data-he]').forEach(el => {
    el.textContent = isHebrew ? el.getAttribute('data-he') : el.getAttribute('data-en');
  });
  document.querySelectorAll('select option').forEach(opt => {
    if (opt.hasAttribute('data-en') && opt.hasAttribute('data-he')) {
      opt.textContent = isHebrew ? opt.getAttribute('data-he') : opt.getAttribute('data-en');
    }
  });
  document.body.style.direction = isHebrew ? 'rtl' : 'ltr';
}

languageToggle.addEventListener('change', function () {
  const isHebrew = this.checked;
  languageLabel.textContent = isHebrew ? 'עברית' : 'English';
  updateLanguage(isHebrew);
});
