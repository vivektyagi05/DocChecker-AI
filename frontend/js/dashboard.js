document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("docchecker_token");
    if (!token) {
        window.location.href = "auth.html";
        return;
    }

    const API_BASE = "/api/documents";
    const AUTH_BASE = "/api/auth";

    // UI Elements
    const userBadge = document.getElementById("user-badge");
    const userRoleText = document.getElementById("user-role");
    const quotaUsedText = document.getElementById("quota-used");
    const quotaTotalText = document.getElementById("quota-total");
    const quotaBar = document.getElementById("quota-bar");

    const counterTotal = document.getElementById("counter-total");
    const counterRisk = document.getElementById("counter-risk");

    const uploadZone = document.getElementById("upload-zone");
    const fileInput = document.getElementById("file-input");
    const uploadText = document.getElementById("upload-text");
    const uploadProgressPanel = document.getElementById("upload-progress-panel");
    const uploadProgressBar = document.getElementById("upload-progress-bar");
    const uploadStatusText = document.getElementById("upload-status-text");

    const vaultSearch = document.getElementById("vault-search");
    const vaultEmptyState = document.getElementById("vault-empty-state");
    const vaultTableContainer = document.getElementById("vault-table-container");
    const vaultTbody = document.getElementById("vault-tbody");

    const featuredCard = document.getElementById("featured-card");
    const featuredTitle = document.getElementById("featured-title");
    const featuredClass = document.getElementById("featured-class");
    const featuredLevel = document.getElementById("featured-level");
    const featuredScore = document.getElementById("featured-score");
    const featuredRing = document.getElementById("featured-ring");
    const featuredSummary = document.getElementById("featured-summary");
    const featuredBullets = document.getElementById("featured-bullets");

    const activityFeed = document.getElementById("activity-feed");

    let documentList = [];
    let riskChartInstance = null;

    // Logout Action
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("docchecker_token");
        localStorage.removeItem("docchecker_user");
        window.location.href = "auth.html";
    });

    // Animate Counters helper
    function animateCounter(element, targetValue) {
        let currentValue = 0;
        const duration = 800; // ms
        const stepTime = Math.max(Math.floor(duration / (targetValue || 1)), 15);
        
        element.innerText = "0";
        if (targetValue === 0) return;

        const timer = setInterval(() => {
            currentValue += 1;
            element.innerText = currentValue;
            if (currentValue >= targetValue) {
                clearInterval(timer);
                element.innerText = targetValue;
            }
        }, stepTime);
    }

    // Fetch Profile details
    async function loadUserProfile() {
        try {
            const response = await fetch(`${AUTH_BASE}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                
                // Update User badges
                const initial = user.email.substring(0, 2).toUpperCase();
                userBadge.innerText = initial;
                userRoleText.innerText = user.role === "admin" ? "ADMIN ACCOUNT" : "STANDARD ACCOUNT";
                
                // Quota mappings
                const quota = user.doc_quota || 5;
                quotaTotalText.innerText = quota;
            }
        } catch (e) {
            console.error("Error loading user profile:", e);
        }
    }

    // Fetch and Load Documents
    async function loadDocuments() {
        try {
            const response = await fetch(`${API_BASE}/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem("docchecker_token");
                window.location.href = "auth.html";
                return;
            }

            const data = await response.json();
            documentList = data.documents || [];
            
            renderDashboard();
            updateActivityTimeline();
        } catch (error) {
            console.error("Error loading documents:", error);
        }
    }

    // Render stats, vaults, and charts
    function renderDashboard() {
        const query = vaultSearch.value.trim().toLowerCase();
        
        const filteredDocs = documentList.filter(doc => 
            doc.filename.toLowerCase().includes(query) ||
            doc.classification.toLowerCase().includes(query)
        );

        // Update Counters
        animateCounter(counterTotal, documentList.length);
        
        const quotaTotal = parseInt(quotaTotalText.innerText) || 5;
        quotaUsedText.innerText = documentList.length;
        const quotaPct = Math.min((documentList.length / quotaTotal) * 100, 100);
        quotaBar.style.width = `${quotaPct}%`;

        const completedDocs = documentList.filter(d => d.status === "completed");
        let avgScore = 0;
        let lowCount = 0, medCount = 0, highCount = 0;

        completedDocs.forEach(d => {
            const score = d.analysis_results?.risk_score || 0;
            avgScore += score;
            if (score > 70) highCount++;
            else if (score > 40) medCount++;
            else lowCount++;
        });

        if (completedDocs.length > 0) {
            avgScore = Math.round(avgScore / completedDocs.length);
            animateCounter(counterRisk, avgScore);
        } else {
            counterRisk.innerText = "0";
        }

        // Draw Chart.js risk analytics
        renderRiskChart(lowCount, medCount, highCount);

        // Featured Spotlight (updated schema bindings)
        const spotlightDoc = documentList.find(d => d.status === "completed") || documentList[0];
        if (spotlightDoc) {
            featuredCard.classList.remove("hidden");
            featuredTitle.innerText = spotlightDoc.filename;
            featuredClass.innerText = spotlightDoc.classification || "General Document";
            
            const results = spotlightDoc.analysis_results || {};
            const score = results.risk_score || 0;
            featuredScore.innerText = score;
            featuredSummary.innerText = results.executive_summary || "AI Audit complete.";

            const offset = 251.32 - (score / 100) * 251.32;
            featuredRing.style.strokeDashoffset = offset;

            // Risk labels
            if (score > 70) {
                featuredLevel.innerText = "High Risk";
                featuredLevel.className = "px-2 py-0.5 rounded-full bg-rose-950/50 border border-rose-500/20 text-rose-300 text-[10px] font-medium";
                featuredRing.setAttribute("class", "text-rose-500 progress-ring__circle");
            } else if (score > 40) {
                featuredLevel.innerText = "Medium Risk";
                featuredLevel.className = "px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/20 text-amber-300 text-[10px] font-medium";
                featuredRing.setAttribute("class", "text-amber-500 progress-ring__circle");
            } else {
                featuredLevel.innerText = "Low Risk";
                featuredLevel.className = "px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium";
                featuredRing.setAttribute("class", "text-emerald-500 progress-ring__circle");
            }

            // Bullet summary warnings
            let bulletsHTML = "";
            if (results.risks && results.risks.length > 0) {
                bulletsHTML += `
                    <div class="flex items-start gap-2 text-slate-300">
                        <span class="text-rose-400 font-bold shrink-0">⚠️</span>
                        <span><strong>Risk:</strong> ${results.risks[0].explanation}</span>
                    </div>
                `;
            }
            if (results.deadlines && results.deadlines.length > 0) {
                const dateVal = results.deadlines[0].date ? ` on ${results.deadlines[0].date}` : "";
                bulletsHTML += `
                    <div class="flex items-start gap-2 text-slate-300">
                        <span class="text-indigo-400 font-bold shrink-0">📅</span>
                        <span><strong>Notice:</strong> ${results.deadlines[0].description}${dateVal}</span>
                    </div>
                `;
            }
            featuredBullets.innerHTML = bulletsHTML || `<p class="text-slate-500 italic">No risks identified.</p>`;
        } else {
            featuredCard.classList.add("hidden");
        }

        // Vault Table Render
        if (filteredDocs.length === 0) {
            vaultTableContainer.classList.add("hidden");
            vaultEmptyState.classList.remove("hidden");
        } else {
            vaultTableContainer.classList.remove("hidden");
            vaultEmptyState.classList.add("hidden");
            
            vaultTbody.innerHTML = "";
            filteredDocs.forEach(doc => {
                const tr = document.createElement("tr");
                tr.className = "hover:bg-white/[0.02] transition-colors cursor-pointer";
                tr.onclick = (e) => {
                    if (e.target.closest(".action-btn")) return;
                    window.location.href = `document.html?id=${doc.id}`;
                };

                let ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-500">Pending</span>`;
                if (doc.status === "completed") {
                    const sc = doc.analysis_results?.risk_score || 0;
                    if (sc > 70) {
                        ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/45 border border-red-500/20 text-red-400">${sc} / 100</span>`;
                    } else if (sc > 40) {
                        ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/45 border border-amber-500/20 text-amber-400">${sc} / 100</span>`;
                    } else {
                        ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/45 border border-emerald-500/20 text-emerald-400">${sc} / 100</span>`;
                    }
                } else if (doc.status === "failed") {
                    ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/30 border border-rose-500/10 text-rose-300">Failed</span>`;
                } else if (doc.status === "processing") {
                    ratingPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/50 border border-indigo-500/20 text-indigo-300 animate-pulse">Auditing...</span>`;
                }

                const createdDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-";

                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-white truncate max-w-[200px]">${doc.filename}</td>
                    <td class="px-6 py-4 text-slate-400">${doc.classification || "Pending"}</td>
                    <td class="px-6 py-4">${ratingPill}</td>
                    <td class="px-6 py-4 text-slate-400">${createdDate}</td>
                    <td class="px-6 py-4 text-right">
                        <button class="action-btn text-rose-400/70 hover:text-rose-400 transition-colors p-1" data-id="${doc.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </td>
                `;

                const delBtn = tr.querySelector(".action-btn");
                delBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const docId = delBtn.getAttribute("data-id");
                    if (confirm("Delete document from vault?")) {
                        await deleteDocument(docId);
                    }
                });

                vaultTbody.appendChild(tr);
            });
        }
    }

    // Chart.js renderer
    function renderRiskChart(low, med, high) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        
        if (riskChartInstance) {
            riskChartInstance.destroy();
        }

        // Draw doughnut chart
        riskChartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Low Risk", "Medium Risk", "High Risk"],
                datasets: [{
                    data: [low || 1, med || 0, high || 0], // Default placeholder if zero
                    backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#94a3b8",
                            font: { size: 10 }
                        }
                    }
                },
                cutout: "70%"
            }
        });
    }

    // Timeline Timeline logger
    function updateActivityTimeline() {
        activityFeed.innerHTML = "";
        
        if (documentList.length === 0) {
            activityFeed.innerHTML = `<p class="text-xs text-slate-500">No activity logs recorded yet.</p>`;
            return;
        }

        // Map documents list to displayable timeline items
        documentList.slice(0, 5).forEach(doc => {
            const item = document.createElement("div");
            item.className = "flex items-start gap-3 text-xs border-b border-white/5 pb-2";
            
            let icon = "⚙️";
            if (doc.status === "completed") icon = "✅";
            else if (doc.status === "failed") icon = "❌";
            else if (doc.status === "processing") icon = "🌀";

            const logDate = doc.created_at ? new Date(doc.created_at).toLocaleTimeString() : "";

            item.innerHTML = `
                <span class="text-sm shrink-0">${icon}</span>
                <div class="grow">
                    <p class="text-slate-300 font-medium">${doc.filename} status: <span class="capitalize text-indigo-400 font-semibold">${doc.status}</span></p>
                    <p class="text-[10px] text-slate-500 mt-0.5">${logDate}</p>
                </div>
            `;
            activityFeed.appendChild(item);
        });
    }

    // Delete document
    async function deleteDocument(docId) {
        try {
            const response = await fetch(`${API_BASE}/${docId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                documentList = documentList.filter(d => d.id !== docId);
                renderDashboard();
                updateActivityTimeline();
            } else {
                alert("Failed to delete the document.");
            }
        } catch (error) {
            console.error("Error deleting doc:", error);
        }
    }

    // File Drop upload pipeline
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleUpload(file);
    });

    uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("dragover"); });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    });

    async function handleUpload(file) {
        // Quota check before uploading
        if (documentList.length >= parseInt(quotaTotalText.innerText)) {
            alert("Upload limit reached. Upgrade to Pro for unlimited document audits.");
            return;
        }

        uploadProgressPanel.classList.remove("hidden");
        uploadProgressBar.style.width = "20%";
        uploadStatusText.innerText = "Staging document...";
        fileInput.disabled = true;

        const formData = new FormData();
        formData.append("file", file);

        try {
            uploadProgressBar.style.width = "50%";
            uploadStatusText.innerText = "Analyzing risk levels (Gemini 2.5)...";

            const response = await fetch(`${API_BASE}/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            uploadProgressBar.style.width = "90%";
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze document.");
            }

            uploadProgressBar.style.width = "100%";
            uploadStatusText.innerText = "Analysis compiled successfully!";

            setTimeout(() => {
                uploadProgressPanel.classList.add("hidden");
                fileInput.disabled = false;
                loadDocuments();
            }, 1000);

        } catch (error) {
            uploadStatusText.innerText = `Audit Failed: ${error.message}`;
            uploadProgressBar.style.backgroundColor = "#ef4444";
            setTimeout(() => {
                uploadProgressPanel.classList.add("hidden");
                uploadProgressBar.style.backgroundColor = "#6366f1";
                fileInput.disabled = false;
            }, 4000);
        }
    }

    // Search vault
    vaultSearch.addEventListener("input", renderDashboard);

    // Bootstrap
    async function init() {
        await loadUserProfile();
        await loadDocuments();
    }
    init();
});
