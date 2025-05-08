// Language switch functionality
const languageToggle = document.getElementById('languageToggle');
const languageLabel = document.getElementById('languageLabel');


//show chrome ID
let userInfo = null;
chrome.identity.getAuthToken({'interactive' : true}, function(token) {
  console.log('Token:', token);
  // userInfo = info;
  // if (info.id) {
  //   // Convert the ID to a Uint8Array
  //   const encoder = new TextEncoder();
  //   const data = encoder.encode(info.id);
    
  //   // Hash the data with SHA-256
  //   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
  //   // Convert the hash to a hex string
  //   const hashArray = Array.from(new Uint8Array(hashBuffer));
  //   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
  //   // Store the hashed ID
  //   userInfo.hashedId = hashHex;
  //   console.log('Original ID:', info.id);
  //   console.log('Hashed ID:', hashHex);
  }
);

document.addEventListener("DOMContentLoaded", async () => {
    // Check if this is first load
    const { uid } = await chrome.storage.local.get("uid");
    if (!uid) {
      const newUid = generateUID();
      await chrome.storage.local.set({ uid: newUid });
    }

    const { selectedText } = await chrome.storage.local.get("selectedText");
    const generateButton = document.getElementById("generate");
    const outputElement = document.getElementById("output");
    
    // Function to validate input and update UI
    function validateInput(text) {
      const isHebrew = languageToggle.checked;
      
      if (!text || text.trim() === "") {
        generateButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "בבקשה סמנו טקסט" : 
          "Please select some text first";
        return false;
      }
      
      if (text.length < 10) {
        generateButton.disabled = true;
        outputElement.textContent = isHebrew ? 
          "הטקסט המסומן חייב להיות לפחות 10 תווים" : 
          "Selected text must be at least 10 characters long";
        return false;
      }
      
      generateButton.disabled = false;
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
      
      // Validate input before proceeding
      if (!validateInput(input)) {
        return;
      }

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
  `;

      // Create request structure with headers and body
      const request = {
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userInfo?.hashedId || 'anonymous'
        },
        body: {
          selected_text: input,
          params: {
            tone: tone,
            length: length,
            include_link: includeLink === "yes"
          }
        }
      };
      
      console.log('Request to backend:', request);

      document.getElementById("output").textContent = languageToggle.checked ? 
        "⌛ יוצר תגובה..." : 
        "⌛ Generating response...";

      // Simulate delay and dummy response
      setTimeout(() => {
        const fakeResponse = `Hey, I understand where this might be coming from, but it's important to recognize that being trans isn't a phase or confusion. Everyone deserves respect and dignity.
  
  ${includeLink === "yes" ? "Here's a helpful resource: https://transequality.org/" : ""}`;

        document.getElementById("output").textContent = fakeResponse;
      }, 1500);
    });

    document.getElementById("copy").addEventListener("click", () => {
      const text = document.getElementById("output").textContent;
      navigator.clipboard.writeText(text);
    });
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
