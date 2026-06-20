document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("docchecker_token");
    if (!token) {
        window.location.href = "auth.html";
        return;
    }

    const userStr = localStorage.getItem("docchecker_user");
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.email) {
            const initial = user.email.substring(0, 2).toUpperCase();
            document.getElementById("user-badge").innerText = initial;
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get("id");
    if (!documentId) {
        window.location.href = "dashboard.html";
        return;
    }

    const API_BASE = `http://localhost:5000/api/documents/${documentId}`;
    
    // UI Elements
    const docTitle = document.getElementById("doc-title");
    const docClass = document.getElementById("doc-class");
    const docDate = document.getElementById("doc-date");
    const docRiskLabel = document.getElementById("doc-risk-label");
    const docScore = document.getElementById("doc-score");
    
    const skeleton = document.getElementById("audit-skeleton");
    const auditContent = document.getElementById("audit-content");
    const auditSummary = document.getElementById("audit-summary");
    const risksList = document.getElementById("risks-list");
    const datesList = document.getElementById("dates-list");
    const financialsList = document.getElementById("financials-list");
    const actionsList = document.getElementById("actions-list");

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatContainer = document.getElementById("chat-messages-container");
    const chatSubmitBtn = document.getElementById("chat-submit-btn");

    let currentDocument = null;

    async function loadPageData() {
        try {
            await fetchDocumentDetails();
            await fetchChatHistory();
        } catch (error) {
            console.error("Error setting up page:", error);
        }
    }

    async function fetchDocumentDetails() {
        try {
            const response = await fetch(API_BASE, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch document details.");

            const data = await response.json();
            currentDocument = data.document;

            renderDocumentDetails();
        } catch (error) {
            console.error(error);
            alert("Error loading document details.");
            window.location.href = "dashboard.html";
        }
    }

    function renderDocumentDetails() {
        docTitle.innerText = currentDocument.filename;
        docClass.innerText = currentDocument.classification || "General Document";
        
        const createdDate = currentDocument.created_at ? new Date(currentDocument.created_at).toLocaleDateString() : "";
        docDate.innerText = `Uploaded on ${createdDate}`;

        const results = currentDocument.analysis_results || {};
        const score = results.risk_score || 0;
        docScore.innerText = score;

        if (score > 70) {
            docRiskLabel.innerText = "High Risk";
            docRiskLabel.className = "text-sm font-bold text-rose-400";
            docScore.className = "w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/20 flex items-center justify-center text-lg font-bold text-rose-400";
        } else if (score > 40) {
            docRiskLabel.innerText = "Medium Risk";
            docRiskLabel.className = "text-sm font-bold text-amber-400";
            docScore.className = "w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-lg font-bold text-amber-400";
        } else {
            docRiskLabel.innerText = "Low Risk";
            docRiskLabel.className = "text-sm font-bold text-emerald-400";
            docScore.className = "w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400";
        }

        // Schema maps (executive_summary, liabilities, deadlines)
        auditSummary.innerText = results.executive_summary || "No executive summary compiled.";

        // Risks List
        if (results.risks && results.risks.length > 0) {
            risksList.innerHTML = "";
            results.risks.forEach(risk => {
                const riskDiv = document.createElement("div");
                riskDiv.className = "p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-1.5";
                
                let badgeClass = "bg-slate-900 text-slate-400 border-white/10";
                if (risk.level === "High") badgeClass = "bg-rose-950/40 border-rose-500/20 text-rose-300";
                else if (risk.level === "Medium") badgeClass = "bg-amber-950/40 border-amber-500/20 text-amber-300";
                else if (risk.level === "Low") badgeClass = "bg-emerald-950/40 border-emerald-500/20 text-emerald-300";

                riskDiv.innerHTML = `
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">${risk.category}</span>
                        <span class="px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${badgeClass}">${risk.level} Risk</span>
                    </div>
                    <p class="text-xs text-slate-500 italic mt-1">${risk.clause}</p>
                    <p class="text-sm text-slate-300 font-medium mt-1">${risk.explanation}</p>
                `;
                risksList.appendChild(riskDiv);
            });
        } else {
            risksList.innerHTML = `<p class="text-xs text-slate-500">No risks identified.</p>`;
        }

        // Deadlines mapping
        if (results.deadlines && results.deadlines.length > 0) {
            datesList.innerHTML = "";
            results.deadlines.forEach(item => {
                const div = document.createElement("div");
                div.className = "flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5";
                const dateLabel = item.date ? `<span class="bg-indigo-950/40 text-indigo-300 border border-indigo-500/10 px-2 py-0.5 rounded text-[10px] shrink-0 font-medium">${item.date}</span>` : "";
                
                div.innerHTML = `
                    <div class="flex flex-col gap-1 w-full">
                        <div class="flex justify-between items-start gap-4">
                            <span class="text-xs text-slate-300 font-medium">${item.description}</span>
                            ${dateLabel}
                        </div>
                    </div>
                `;
                datesList.appendChild(div);
            });
        } else {
            datesList.innerHTML = `<p class="text-xs text-slate-500 font-medium">No deadlines parsed.</p>`;
        }

        // Liabilities mapping
        if (results.liabilities && results.liabilities.length > 0) {
            financialsList.innerHTML = "";
            results.liabilities.forEach(ob => {
                const div = document.createElement("div");
                div.className = "flex items-start justify-between gap-4 p-3 rounded-xl bg-white/[0.01] border border-white/5";
                
                const amtLabel = ob.amount !== null ? `<span class="text-emerald-400 text-xs font-bold font-mono">$${ob.amount.toLocaleString()}</span>` : "";
                const freqLabel = ob.frequency ? `<span class="text-[9px] uppercase tracking-wider text-slate-500 block text-right mt-0.5">${ob.frequency}</span>` : "";

                div.innerHTML = `
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-slate-300 font-medium">${ob.description}</span>
                    </div>
                    <div class="shrink-0 text-right">
                        ${amtLabel}
                        ${freqLabel}
                    </div>
                `;
                financialsList.appendChild(div);
            });
        } else {
            financialsList.innerHTML = `<p class="text-xs text-slate-500 font-medium">No liabilities detected.</p>`;
        }

        // Action Items
        if (results.action_items && results.action_items.length > 0) {
            actionsList.innerHTML = "";
            results.action_items.forEach(action => {
                const li = document.createElement("li");
                li.className = "flex items-start gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl";
                li.innerHTML = `
                    <span class="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                        <svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>
                    </span>
                    <span class="text-xs text-slate-300 leading-relaxed font-medium">${action.item}</span>
                `;
                actionsList.appendChild(li);
            });
        } else {
            actionsList.innerHTML = `<p class="text-xs text-slate-500 font-medium">No recommended action items.</p>`;
        }

        skeleton.classList.add("hidden");
        auditContent.classList.remove("hidden");
    }

    async function fetchChatHistory() {
        try {
            const response = await fetch(`${API_BASE}/chat`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Could not load chat history.");

            const data = await response.json();
            chatContainer.innerHTML = "";
            (data.history || []).forEach(msg => {
                appendChatMessage(msg.role, msg.message);
            });
            
        } catch (error) {
            console.error("Error fetching chat logs:", error);
        }
    }

    function appendChatMessage(role, text) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "flex items-start gap-3";
        
        if (role === "user") {
            msgDiv.innerHTML = `
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 invisible"></div>
                <div class="glass-card bg-indigo-600/20 border-indigo-500/20 rounded-2xl rounded-tr-none p-3.5 ml-auto max-w-[85%] text-xs text-slate-200 leading-relaxed">
                    ${escapeHtml(text)}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span class="text-[10px] font-bold text-indigo-400">AI</span>
                </div>
                <div class="glass-card rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-xs text-slate-300 leading-relaxed">
                    ${escapeHtml(text).replace(/\n/g, "<br>")}
                </div>
            `;
        }

        chatContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    let activeLoader = null;
    function showChatLoader() {
        activeLoader = document.createElement("div");
        activeLoader.className = "flex items-start gap-3 animate-pulse";
        activeLoader.innerHTML = `
            <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <span class="text-[10px] font-bold text-indigo-400">AI</span>
            </div>
            <div class="glass-card rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-xs text-slate-500 flex items-center gap-1.5">
                <span>Thinking</span>
                <span class="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                <span class="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
            </div>
        `;
        chatContainer.appendChild(activeLoader);
        scrollToBottom();
    }

    function removeChatLoader() {
        if (activeLoader) {
            activeLoader.remove();
            activeLoader = null;
        }
    }

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question) return;

        chatInput.value = "";
        appendChatMessage("user", question);
        showChatLoader();
        
        chatInput.disabled = true;
        chatSubmitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();
            removeChatLoader();

            if (!response.ok) {
                throw new Error(data.error || "Failed to ask question.");
            }

            appendChatMessage("assistant", data.answer);
        } catch (error) {
            removeChatLoader();
            appendChatMessage("assistant", `Error: ${error.message}`);
        } finally {
            chatInput.disabled = false;
            chatSubmitBtn.disabled = false;
            chatInput.focus();
        }
    });

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadPageData();
});
