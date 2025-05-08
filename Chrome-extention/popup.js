document.addEventListener("DOMContentLoaded", async () => {
    const { selectedText } = await chrome.storage.local.get("selectedText");
    document.getElementById("input").value = selectedText || "“Trans people are just confused.”";
  
    document.getElementById("generate").addEventListener("click", async () => {
      const input = document.getElementById("input").value;
  
      const tones = Array.from(document.getElementById("tone").selectedOptions)
                        .map(option => option.value).join(", ");
  
      const length = document.querySelector('input[name="length"]:checked').value;
      const includeLink = document.getElementById("includeLink").checked ? "yes" : "no";
  
      const prompt = `
  [Simulated request]
  Comment: "${input}"
  Tone: ${tones}
  Length: ${length}
  Include links: ${includeLink}
  `;
  
      document.getElementById("output").textContent = "⌛ Generating response...";
  
      // Simulate delay and dummy response
      setTimeout(() => {
        const fakeResponse = `Hey, I understand where this might be coming from, but it's important to recognize that being trans isn't a phase or confusion. Everyone deserves respect and dignity.
  
  ${includeLink === "yes" ? "Here’s a helpful resource: https://transequality.org/" : ""}`;
  
        document.getElementById("output").textContent = fakeResponse;
      }, 1500);
    });
  
    document.getElementById("copy").addEventListener("click", () => {
      const text = document.getElementById("output").textContent;
      navigator.clipboard.writeText(text);
    });
  });
  