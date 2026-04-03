const chatbox = document.getElementById("chatbox");
const chatform = document.getElementById("chatform");
const userinput = document.getElementById("userinput");
const sendButton = document.getElementById("send-btn");
const sessionList = document.getElementById("session-list");

// Session helper functions
function generateSessionId() {
    return "session_" + Date.now();
}

function saveSession(id, history) {
    localStorage.setItem(id, JSON.stringify(history));
}

function loadSession(id) {
    return JSON.parse(localStorage.getItem(id)) || [];
}

function getAllSessions() {
    return JSON.parse(localStorage.getItem("zuriSessions")) || [];
}

function saveSessionList(sessions) {
    localStorage.setItem("zuriSessions", JSON.stringify(sessions));
}

// Current session state
let currentSessionId = generateSessionId();
let conversationHistory = [];
let sessions = getAllSessions();

// Render sidebar session list
function renderSessionList() {
    sessionList.innerHTML = "";
    sessions.forEach(function(session) {
        const btn = document.createElement("button");
        btn.textContent = session.name;
        btn.classList.add("session-btn");
        if (session.id === currentSessionId) {
            btn.classList.add("active-session");
        }
        btn.addEventListener("click", function() {
            switchSession(session.id);
        });
        sessionList.appendChild(btn);
    });
}

// Switch to an existing session
function switchSession(id) {
    currentSessionId = id;
    conversationHistory = loadSession(id);
    chatbox.innerHTML = "";
    conversationHistory.forEach(function(entry) {
        const div = document.createElement("div");
        if (entry.role === "user") {
            div.classList.add("user-msg");
            div.textContent = "You: " + entry.parts[0].text;
        } else {
            div.classList.add("bot-msg");
            div.innerHTML = "Zuri: " + marked.parse(entry.parts[0].text);
        }
        chatbox.appendChild(div);
    });
    document.querySelector("h1").style.display = conversationHistory.length ? "none" : "block";
    document.getElementById("chatbox").style.height = conversationHistory.length ? "400px" : "0";
    renderSessionList();
}

// New chat button
document.getElementById("new-chat-btn").addEventListener("click", function() {
    currentSessionId = generateSessionId();
    conversationHistory = [];
    chatbox.innerHTML = "";
    document.querySelector("h1").style.display = "block";
    document.getElementById("chatbox").style.height = "0";
    renderSessionList();
});

// Submit handler
chatform.addEventListener("submit", async function(event) {
    event.preventDefault();

    document.querySelector("h1").style.display = "none";
    document.getElementById("chatbox").style.height = "400px";

    const message = userinput.value;
    const userDiv = document.createElement("div");
    userDiv.classList.add("user-msg");
    userDiv.textContent = "You: " + message;
    chatbox.appendChild(userDiv);
    userinput.value = "";

    conversationHistory.push({
        role: "user",
        parts: [{ text: message }]
    });

    // If this is the first message, register the session
    if (conversationHistory.length === 1) {
        sessions.unshift({ id: currentSessionId, name: message.slice(0, 30) });
        saveSessionList(sessions);
        renderSessionList();
    }

    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("bot-msg");
    loadingDiv.id = "loading";
    loadingDiv.textContent = "Zuri is typing...";
    chatbox.appendChild(loadingDiv);
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyA-fds6TDqF-JmypT_0o6f8-EEuc0R1F2o", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: "Your name is Zuri. You are a helpful, friendly and concise assistant. You have a warm personality. If asked about current events or recent news, honestly say your knowledge may be outdated and suggest the user verify online." }]
            },
            contents: conversationHistory
        })
    });

    const data = await response.json();
    console.log(data);
    const reply = data.candidates[0].content.parts[0].text;

    document.getElementById("loading").remove();
    sendButton.disabled = false;
    sendButton.textContent = "Send";

    const botDiv = document.createElement("div");
    botDiv.classList.add("bot-msg");
    botDiv.innerHTML = "Zuri: " + marked.parse(reply);
    chatbox.appendChild(botDiv);

    conversationHistory.push({
        role: "model",
        parts: [{ text: reply }]
    });

    saveSession(currentSessionId, conversationHistory);
});

// Clear chat button
document.getElementById("clear-btn").addEventListener("click", function() {
    localStorage.removeItem(currentSessionId);
    sessions = sessions.filter(s => s.id !== currentSessionId);
    saveSessionList(sessions);
    conversationHistory = [];
    chatbox.innerHTML = "";
    currentSessionId = generateSessionId();
    document.querySelector("h1").style.display = "block";
    document.getElementById("chatbox").style.height = "0";
    renderSessionList();
});

// Initial render
renderSessionList();