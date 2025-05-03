const address = document.getElementById('address-bar');
const browser_title = document.getElementById('browser-title');
const tab_dropdown = document.getElementById('tab-dropdown');
const webviewContainer = document.getElementById('webview-container');

let tabs = [];
let currentTabIndex = -1;

// Tab Management Functions
async function addTab(title = 'New Tab', url = 'https://start.duckduckgo.com/') {
    try {
        const webview = createWebview(url);
        
        if (tabs[currentTabIndex]?.webview) {
            tabs[currentTabIndex].webview.style.display = 'none';
        }

        tabs.push({ title, url, webview });
        currentTabIndex = tabs.length - 1;

        const option = document.createElement('option');
        option.value = currentTabIndex;
        option.textContent = title;
        tab_dropdown.appendChild(option);
        tab_dropdown.value = currentTabIndex;

        address.value = url;
        webview.style.display = 'flex';
        webview.focus();

        await saveTabsToStorage();
        return webview;
    } catch (err) {
        console.error('Add tab error:', err);
        return null;
    }
}

function createWebview(url) {
    const wv = document.createElement('webview');
    wv.src = url;
    Object.assign(wv.style, {
        flex: '1',
        width: '100%',
        border: 'none',
        display: 'none'
    });
    
    wv.addEventListener('did-finish-load', updateTabInfo);
    wv.addEventListener('page-title-updated', updateTabInfo);
    wv.addEventListener('did-navigate', updateTabInfo);
    wv.addEventListener('did-navigate-in-page', updateTabInfo);
    
    webviewContainer.appendChild(wv);
    return wv;
}

async function deleteCurrentTab() {
    try {
        if (currentTabIndex === -1) return;

        const tab = tabs[currentTabIndex];
        tab.webview.remove();
        tabs.splice(currentTabIndex, 1);
        tab_dropdown.remove(currentTabIndex);

        if (tabs.length === 0) {
            await addTab('Home', 'https://start.duckduckgo.com/');
        } else {
            const newIndex = Math.max(currentTabIndex - 1, 0);
            await switchToTab(newIndex);
        }

        await saveTabsToStorage();
    } catch (err) {
        console.error('Delete tab error:', err);
    }
}

async function switchToTab(index) {
    try {
        if (index < 0 || index >= tabs.length) return;

        tabs.forEach(tab => {
            try {
                tab.webview.style.display = 'none';
            } catch (err) {
                console.error('Hide tab error:', err);
            }
        });

        currentTabIndex = index;
        const tab = tabs[index];
        
        tab.webview.style.display = 'flex';
        tab_dropdown.selectedIndex = index;
        address.value = tab.webview.getURL();
        change_browser_title();

        await saveTabsToStorage();
    } catch (err) {
        console.error('Switch tab error:', err);
    }
}

// Persistence Functions
async function saveTabsToStorage() {
    try {
        const tabsData = tabs.map(tab => ({
            title: tab.title,
            url: tab.webview?.getURL() || tab.url
        }));
        
        await window.electronAPI.saveTabs(tabsData, currentTabIndex);
    } catch (err) {
        console.error('Save tabs error:', err);
    }
}

async function loadSavedTabs() {
    try {
        const savedData = await window.electronAPI.loadTabs();
        
        // Clear existing tabs safely
        tabs.forEach(tab => {
            try {
                if (tab.webview && tab.webview.parentNode) {
                    tab.webview.parentNode.removeChild(tab.webview);
                }
            } catch (err) {
                console.error('Tab cleanup error:', err);
            }
        });
        tabs = [];
        tab_dropdown.innerHTML = '';

        if (savedData?.tabs?.length > 0) {
            // Create all tabs first
            await Promise.all(savedData.tabs.map(async (tabData) => {
                const webview = createWebview(tabData.url);
                const newTab = {
                    title: tabData.title,
                    url: tabData.url,
                    webview: webview
                };
                tabs.push(newTab);
                
                const option = document.createElement('option');
                option.textContent = tabData.title;
                tab_dropdown.appendChild(option);

                // Wait for initial load
                await new Promise(resolve => {
                    webview.addEventListener('did-finish-load', resolve, { once: true });
                });
            }));

            // Set current index after all tabs are created
            currentTabIndex = savedData.currentIndex >= 0 && savedData.currentIndex < tabs.length 
                ? savedData.currentIndex 
                : 0;
            
            await switchToTab(currentTabIndex);
            address.value = tabs[currentTabIndex].webview.getURL();
        } else {
            await addTab('Home', 'https://start.duckduckgo.com/');
        }
    } catch (err) {
        console.error('Load tabs error:', err);
        await addTab('Home', 'https://start.duckduckgo.com/');
    }
}

// Update Functions
async function updateTabInfo(event) {
    try {
        const tab = tabs[currentTabIndex];
        if (!tab || !tab.webview) return;

        tab.url = event.target.getURL();
        tab.title = event.title || tab.url;
        
        address.value = tab.url;
        if (tab_dropdown.options[currentTabIndex]) {
            tab_dropdown.options[currentTabIndex].textContent = tab.title;
        }
        document.title = tab.title || 'Shy Mouse';
        
        await saveTabsToStorage();
    } catch (err) {
        console.error('Update tab info error:', err);
    }
}

function change_browser_title() {
    try {
        const webview = getCurrentWebview();
        if (!webview) return;

        const url = webview.getURL();
        browser_title.textContent = url === 'https://start.duckduckgo.com/' 
            ? 'Shy Mouse' 
            : url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    } catch (err) {
        console.error('Title change error:', err);
    }
}

// Helper Functions
function getCurrentWebview() {
    return tabs[currentTabIndex]?.webview || null;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.electronAPI.onSaveBeforeClose(async () => {
            await saveTabsToStorage();
            // Clean up webviews
            tabs.forEach(tab => {
                try {
                    tab.webview?.remove();
                } catch (err) {
                    console.error('Cleanup error:', err);
                }
            });
        });
        
        await loadSavedTabs();
    } catch (err) {
        console.error('Initialization error:', err);
    }
});

document.getElementById('back-button').addEventListener('click', () => getCurrentWebview()?.goBack());
document.getElementById('forward-button').addEventListener('click', () => getCurrentWebview()?.goForward());
document.getElementById('home-button').addEventListener('click', () => {
    const webview = getCurrentWebview();
    if (webview) {
        webview.loadURL('https://start.duckduckgo.com/');
    }
});
document.getElementById('reload-button').addEventListener('click', () => getCurrentWebview()?.reload());
document.getElementById('new-tab').addEventListener('click', () => addTab());
document.getElementById('delete-tab').addEventListener('click', () => deleteCurrentTab());
tab_dropdown.addEventListener('change', () => switchToTab(parseInt(tab_dropdown.value)));
address.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        loadURL();
    }
});

document.getElementById('open-file-button').addEventListener('click', async () => {
    try {
        const fileURL = await window.electronAPI.openLocalFile();
        if (fileURL) {
            const wv = getCurrentWebview();
            if (wv) {
                wv.loadURL(fileURL);
                await saveTabsToStorage();
            }
        }
    } catch (err) {
        console.error('File open error:', err);
    }
});

// Navigation Handler
async function loadURL() {
    try {
        const input = address.value.trim();
        let url = input;
        
        if (!/^https?:\/\//i.test(input)) {
            url = input.includes('.') 
                ? `https://${input}`
                : `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
        }

        const webview = getCurrentWebview();
        if (webview) {
            webview.loadURL(url);
            await saveTabsToStorage();
        }
    } catch (err) {
        console.error('Navigation error:', err);
    }
}