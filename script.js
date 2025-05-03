const webview = document.getElementById('webview');
var address = document.getElementById('address-bar');

var browser_title = document.getElementById('browser-title');


document.getElementById('back-button').addEventListener('click', () => webview.goBack());
document.getElementById('forward-button').addEventListener('click', () => webview.goForward());
document.getElementById('home-button').addEventListener('click', () => webview.loadURL('https://start.duckduckgo.com/'));

function change_browser_title() {
    if (webview.getURL() == 'https://start.duckduckgo.com/') {
        browser_title.innerText = 'Shy Mouse';
    }
    else{
        browser_title.innerText = webview.getURL().replace('https://', '').replace('http://', '').replace(/\/$/, '');
    }
}

webview.addEventListener('did-navigate', () => {
    address.value = webview.getURL();
    change_browser_title()
  });
  
  webview.addEventListener('did-navigate-in-page', () => {
    address.value = webview.getURL();
    change_browser_title()
  });

function loadURL() {
    if (address.value== '') {
        url = 'https://start.duckduckgo.com/';
        webview.loadURL(url);
        change_browser_title();
    }
    else {
        const input = document.getElementById('address-bar').value.trim();
  const webview = document.getElementById('webview');

  let url = input;

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(input);
  const looksLikeDomain = /\.[a-z]{2,}($|\/)/i.test(input); // e.g. ".com", ".org", ".dev", etc.

  if (!hasScheme) {
    if (looksLikeDomain) {
      url = 'https://' + input;
    } else {
      // Treat as search query
      const encoded = encodeURIComponent(input);
      url = `https://duckduckgo.com/?q=${encoded}`;
    }
  }

  webview.loadURL(url);
        change_browser_title();
    }    
}

document.getElementById("address-bar").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        // Enter key pressed
        loadURL();
    }
});

document.getElementById('open-file-button').addEventListener('click', async () => {
    const fileURL = await window.electronAPI.openLocalFile();
    if (fileURL) {
        webview.loadURL(fileURL);
        browser_title.innerText = fileURL.replace('file://', '').replace(/%20/g, ' ');
        address.value = fileURL.replace('file://', '').replace(/%20/g, ' ');
    }
  });