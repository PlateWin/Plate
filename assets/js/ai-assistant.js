import { AI_URL } from './config.js';

/**
 * Plate. AI Assistant Core Logic
 * Proxied through /api/ai (server-side)
 */

const CONFIG = {
    model: "deepseek-ai/DeepSeek-V4-Flash"
};

const SYSTEM_PROMPT = `
You are Plate. AI, the digital assistant for the "Plate. | Algorithm & Aesthetics" portfolio. 
Your goal is to help visitors explore the projects, achievements, and technical insights of the author.

IDENTITY & TONE:
- Name: Plate. AI.
- Tone: Professional, geeky, concise, and highly knowledgeable. 
- Style: Use Markdown for formatting. Be direct but helpful.

KNOWLEDGE BASE:
1. KEY PROJECTS:
   - "知几安全 (InsightSafe)": LLM security system for RAG, focusing on GNN and causal inference to prevent knowledge injection.
   - "Redou": A lightweight memory enhancement system for LLMs using Knowledge Graphs and TEE architecture.
   - "MindDream": A full-stack psychological dream analysis platform using Vue 3 and AI workflows.

2. MILESTONES (AWARDS):
   - 2026: National 3rd Prize (GPLT Team Programming), Provincial 1st Prize (Lanqiao Cup C++).
   - 2025: National 3rd Prize (Robocom), Provincial 2nd Prize (Lanqiao Cup), Provincial 3rd Prize (Robot & AI Contest).
   - 2024: 2nd & 3rd Prizes (Teddy Cup Data Analysis), 2nd Prize (Chuanzhi Cup IT Contest).

3. TECHNICAL STACK:
   - Core: C++, Python, Go, JavaScript (React/Vue/Node).
   - AI/Security: LLM Memory, RAG Security, GNN, TEE.
   - Creative: AE, PR, VSCode, Obsidian.

4. BLOG POSTS:
   - "探索大模型状态外包": Discusses state outsourcing for LLMs, focusing on stateless pain points and dynamic forgetting mechanisms.
   - "RAG 安全防护：因果推断与知识注入防御": Explains how InsightSafe uses GNNs and causal inference to defend against graph poisoning.
   - "复杂交互系统的前端架构": Explores integrating WebGL/R3F with React for high-performance 3D interfaces.
   - "算法美学：从时间复杂度到视觉交互的秩序之美": Connects the elegance of O(1) algorithms with minimalist UI design and smooth lerp animations.

CONSTRAINTS:
- Do NOT provide any private, confidential, or sensitive personal data beyond what is listed above.
- If asked about something not in your knowledge base, politely state you don't have that information.
- Use the primary brand color reference (Klein Blue #002FA7) if describing visuals.
`;

let conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

function initAI() {
    const toggleBtn = document.getElementById('ai-toggle');
    const closeBtn = document.getElementById('ai-close');
    const chatWindow = document.getElementById('ai-window');
    const inputField = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    const messagesContainer = document.getElementById('ai-messages');

    if (!toggleBtn || !chatWindow) {
        console.error("Plate. AI: Required elements not found.");
        return;
    }

    console.log("Plate. AI: Initialized successfully.");
    let isLoading = false;
    let hasQuickActions = false;
    let typingAnimationId = null;

    const updateSendState = () => {
        const hasInput = inputField.value.trim().length > 0;
        sendBtn.disabled = !hasInput || isLoading;
        sendBtn.classList.toggle('is-loading', isLoading);
    };

    const setWindowOpen = (open) => {
        chatWindow.classList.toggle('open', open);
        toggleBtn.classList.toggle('active', open);
        toggleBtn.setAttribute('aria-expanded', String(open));
        if (open) {
            inputField.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setWindowOpen(!chatWindow.classList.contains('open'));
    });

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setWindowOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
            setWindowOpen(false);
        }
    });

    document.addEventListener('click', (e) => {
        if (!chatWindow.classList.contains('open')) return;
        const clickedInsideWidget = e.target.closest('#ai-assistant');
        if (!clickedInsideWidget) {
            setWindowOpen(false);
        }
    });

    const handleSend = async () => {
        if (isLoading) return;
        const text = inputField.value.trim();
        if (!text) return;

        removeQuickActions();
        appendMessage('user', text);
        inputField.value = '';
        inputField.style.height = 'auto';
        isLoading = true;
        updateSendState();

        conversationHistory.push({ role: "user", content: text });
        const typingId = showTypingIndicator();

        try {
            const response = await fetch(AI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: CONFIG.model,
                    messages: conversationHistory,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            removeTypingIndicator(typingId);

            if (response.status === 503) {
                appendMessage('ai', "暂时连不上大脑... API Key 还没配置，稍后再来看看吧。");
                return;
            }

            if (response.ok) {
                const aiResponse = data.choices[0].message.content;
                await appendMessageStreaming(aiResponse);
                conversationHistory.push({ role: "assistant", content: aiResponse });
            } else {
                throw new Error(data.error?.message || "Failed to fetch AI response");
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            appendMessage('ai', "连接出了点问题，稍等一下再试试？");
            console.error("AI Error:", error);
        } finally {
            isLoading = false;
            updateSendState();
        }
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    inputField.addEventListener('input', () => {
        inputField.style.height = 'auto';
        inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        updateSendState();
    });

    function appendMessage(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message message-enter`;
        const formattedContent = renderMessage(content);
        msgDiv.innerHTML = formattedContent;
        messagesContainer.appendChild(msgDiv);
        requestAnimationFrame(() => {
            msgDiv.classList.add('visible');
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function appendMessageStreaming(content) {
        if (typingAnimationId) {
            cancelAnimationFrame(typingAnimationId);
            typingAnimationId = null;
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai-message message-enter';
        messagesContainer.appendChild(msgDiv);
        requestAnimationFrame(() => {
            msgDiv.classList.add('visible');
        });

        const chars = Array.from(content);
        let cursor = 0;
        let buffer = '';
        let lastTime = 0;
        const total = chars.length;
        const batch = total > 1500 ? 12 : total > 600 ? 8 : 5;
        const frameInterval = 16;

        await new Promise((resolve) => {
            const tick = (time) => {
                if (time - lastTime >= frameInterval) {
                    lastTime = time;
                    if (cursor < total) {
                        const nextCursor = Math.min(cursor + batch, total);
                        for (let i = cursor; i < nextCursor; i++) {
                            buffer += chars[i];
                        }
                        cursor = nextCursor;
                        msgDiv.innerHTML = renderMessage(buffer);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    } else {
                        typingAnimationId = null;
                        resolve();
                        return;
                    }
                }
                typingAnimationId = requestAnimationFrame(tick);
            };
            typingAnimationId = requestAnimationFrame(tick);
        });
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = 'message ai-message';
        msgDiv.innerHTML = '<span class="typing-dot"></span> <span class="typing-dot"></span> <span class="typing-dot"></span>';
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderMessage(content) {
        const escaped = escapeHtml(content);
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, '<br>');
    }

    function addQuickActions() {
        if (hasQuickActions) return;
        hasQuickActions = true;
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-quick-actions';
        wrapper.id = 'ai-quick-actions';
        const prompts = [
            '你最骄傲的项目是什么？',
            'InsightSafe 怎么防御知识注入？',
            '介绍一下你的技术栈和获奖经历'
        ];

        prompts.forEach((prompt) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ai-quick-btn';
            btn.textContent = prompt;
            btn.addEventListener('click', () => {
                inputField.value = prompt;
                inputField.focus();
                inputField.dispatchEvent(new Event('input'));
            });
            wrapper.appendChild(btn);
        });

        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeQuickActions() {
        const quick = document.getElementById('ai-quick-actions');
        if (quick) quick.remove();
    }

    addQuickActions();
    updateSendState();
}

initAI();
