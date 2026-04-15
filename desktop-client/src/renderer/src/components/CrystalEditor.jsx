import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Quote, List, ListTodo } from 'lucide-react';
import { motion } from 'framer-motion';
import { GhostText } from './extensions/GhostText';
import { WikiLink } from './extensions/WikiLink';
import SlashCommand from './extensions/SlashCommand';
import CommandList from './CommandList';
import { Sparkles, Languages, Zap, Palette, FileText, Wand2, Type } from 'lucide-react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { ReactRenderer } from '@tiptap/react';

const CrystalEditor = ({ currentCrystalSlug, currentUser, onBack, onNavigate }) => {
  const [crystal, setCrystal] = useState({ title: '', content: '' });
  const [backlinks, setBacklinks] = useState([]);
  const [saveState, setSaveState] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTypingTimer = useRef(null);
  const handleAIActionRef = useRef();
  const triggerAIGhostFetchRef = useRef();

  // High-performance Glow State Machine
  const [glowVisible, setGlowVisible] = useState(false);
  const [glowRender, setGlowRender] = useState(false);
  const glowStartTime = useRef(0);
  const glowTimer = useRef(null);

  const triggerGlow = useCallback(() => {
    setGlowRender(true);
    setTimeout(() => setGlowVisible(true), 10);
    glowStartTime.current = Date.now();
    clearTimeout(glowTimer.current);
  }, []);

  const endGlow = useCallback((interrupted = false) => {
    clearTimeout(glowTimer.current);
    if (interrupted) {
      setGlowVisible(false);
      setTimeout(() => setGlowRender(false), 700);
    } else {
      const elapsed = Date.now() - glowStartTime.current;
      const remaining = Math.max(0, 5000 - elapsed);
      glowTimer.current = setTimeout(() => {
        setGlowVisible(false);
        setTimeout(() => setGlowRender(false), 700);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    if (isAiThinking || saveState === 'saving') {
      triggerGlow();
    } else if (glowRender) {     
      endGlow(false);
    }
  }, [isAiThinking, saveState, triggerGlow, endGlow]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#00D1FF] underline decoration-[#00D1FF]/30 hover:decoration-[#00D1FF] transition-colors cursor-pointer' } }),
      GhostText.configure({
        onTab: (editor) => {
          triggerAIGhostFetchRef.current?.(editor);
          return true; // Mark handled
        }
      }),
      WikiLink.configure({
        suggestion: {
          items: async ({ query }) => {
            try {
              const res = await fetch('http://localhost:8080/api/v1/crystals', {
                headers: { 'X-User-Name': currentUser }
              });
              const data = await res.json();
              if (!data) return [];
              return data
                .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8); // Top 8 suggestions
            } catch (err) {
              console.error("Failed to fetch suggestions", err);
              return [];
            }
          },
        },
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) => {
            return [
              { title: 'Summary', description: '生成当前内容的摘要', icon: <FileText size={14} />, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); handleAIActionRef.current?.('summary', editor); } },
              { title: 'Improve Writing', description: '优化语法与措辞', icon: <Wand2 size={14} />, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); handleAIActionRef.current?.('improve', editor); } },
              { title: 'Expand Thought', description: '扩展当前想法', icon: <Zap size={14} />, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); handleAIActionRef.current?.('expand', editor); } },
              { title: 'Bullet Brief', description: '转为要点列表', icon: <List size={14} />, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).run(); handleAIActionRef.current?.('brief', editor); } },
            ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
          },
          render: () => {
            let component;
            let popup;
            return {
              onStart: props => {
                if (!props.clientRect) return;
                component = new ReactRenderer(CommandList, { props, editor: props.editor });
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  zIndex: 9999,
                });
              },
              onUpdate: props => {
                if (!props.clientRect) return;
                component?.updateProps(props);
                popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
              },
              onKeyDown: props => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props);
              },
              onExit: () => {
                if (popup && popup[0]) popup[0].destroy();
                if (component) component.destroy();
              },
            };
          },
        },
      }),
      Placeholder.configure({
        placeholder: '记录此刻的思考... ( 停顿即触发 AI 续写, 输入 [[ 关联结晶 )',
      }),
    ],
    content: crystal.content,
    onUpdate: ({ editor }) => {
      setCrystal(prev => ({ ...prev, content: editor.getHTML() }));
      setSaveState('unsaved');
      
      editor.commands.setGhostText('');
      if (isAiThinking) {
        setIsAiThinking(false);
        endGlow(true);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  const handleAIAction = useCallback(async (action, editorInstance, customContent = null) => {
    // FALLBACK: If editorInstance is not provided, use the closure editor
    const activeEditor = editorInstance || editor;
    if (!activeEditor) {
      console.error("[AI] No editor instance available");
      return;
    }

    const textToProcess = customContent || 
                         activeEditor.state.doc.textBetween(activeEditor.state.selection.from, activeEditor.state.selection.to) || 
                         activeEditor.getText();

    if (!textToProcess.trim()) {
      console.warn("[AI] No content to process");
      return;
    }

    console.log(`[AI] Triggering action: ${action} with ${textToProcess.length} chars`);
    setIsAiThinking(true);
    triggerGlow();

    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Name': currentUser 
        },
        body: JSON.stringify({ action, content: textToProcess })
      });

      const rawResponse = await res.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error("[AI] JSON Parse Failed. Raw:", rawResponse);
        throw new Error(`Invalid JSON response from server.`);
      }

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Unknown API error');
      }

      const result = data.choices?.[0]?.message?.content;
      
      if (result && !activeEditor.isDestroyed) {
        console.log(`[AI] Action ${action} success`);
        // Add spacing before content
        activeEditor.chain()
          .focus()
          .insertContent('<p></p>')
          .insertContent(result)
          .run();
      } else {
        console.warn("[AI] Empty result or editor destroyed");
      }
    } catch (err) {
      console.error("[AI] Action error:", err);
    } finally {
      setIsAiThinking(false);
      endGlow(true);
    }
  }, [editor, isAiThinking, triggerGlow, endGlow]);

  const triggerAIGhostFetch = useCallback(async (editorInstance) => {
    const activeEditor = editorInstance || editor;
    if (!activeEditor || isAiThinking) return;
    
    const textContent = activeEditor.getText();
    if (!textContent.trim()) return;

    console.log("[AI] Triggering ghost completion...");
    setIsAiThinking(true);
    triggerGlow();

    const promptContext = textContent.slice(-1000);
    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Name': currentUser 
        },
        body: JSON.stringify({ prompt: promptContext })
      });

      const rawResponse = await res.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${rawResponse.slice(0, 50)}`);
      }

      if (!res.ok) throw new Error(data.error || 'API incomplete fetch failed');

      const suggestion = data.choices?.[0]?.message?.content;
      if (suggestion && !activeEditor.isDestroyed) {
        activeEditor.commands.setGhostText(suggestion);
      }
    } catch (err) {
      console.error("[AI] Ghost error:", err);
    } finally {
      setIsAiThinking(false);
      endGlow(true);
    }
  }, [editor, isAiThinking, triggerGlow, endGlow]);

  // Sync refs to allow Tiptap extensions to access latest handlers without stale closures
  useEffect(() => {
    handleAIActionRef.current = handleAIAction;
    triggerAIGhostFetchRef.current = triggerAIGhostFetch;
  }, [handleAIAction, triggerAIGhostFetch]);

  // Load crystal data & Backlinks
  useEffect(() => {
    if (!currentCrystalSlug) return;
    const loadData = async () => {
      try {
        // Fetch Crystal Content
        const res = await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}`, {
          headers: { 'X-User-Name': currentUser }
        });
        const data = await res.json();
        setCrystal(data);
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(data.content || '');
        }

        // Fetch Backlinks
        const res_bl = await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}/backlinks`, {
          headers: { 'X-User-Name': currentUser }
        });
        const blData = await blRes.json();
        setBacklinks(Array.isArray(blData) ? blData : []);
      } catch (err) {
        console.error('Failed to load crystal data:', err);
      }
    };
    loadData();
  }, [currentCrystalSlug, editor]);



  const handleSave = useCallback(async () => {
    if (!currentCrystalSlug || saveState === 'saved') return;
    setSaveState('saving');
    try {
      await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Name': currentUser 
        },
        body: JSON.stringify({
          title: crystal.title,
          content: crystal.content
        })
      });
      setTimeout(() => setSaveState('saved'), 500);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveState('unsaved');
    }
  }, [crystal, currentCrystalSlug, saveState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle Hover Preview with Tippy
  useEffect(() => {
    const linkInstances = tippy('.wiki-link', {
      content: 'Loading preview...',
      allowHTML: true,
      delay: [400, 0],
      interactive: true,
      appendTo: () => document.body,
      onShow: async (instance) => {
        const slug = instance.reference.getAttribute('data-id');
        try {
          const res = await fetch(`http://localhost:8080/api/v1/crystals/${slug}`, {
            headers: { 'X-User-Name': currentUser }
          });
          const data = await res.json();
          // Extract plain text from HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.content;
          const plainText = tempDiv.innerText.slice(0, 150) + '...';
          
          instance.setContent(`
            <div class="p-3 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl max-w-xs transition-all">
              <div class="text-[10px] uppercase tracking-widest text-[#00D1FF] font-mono mb-2 opacity-70">Crystal Preview</div>
              <div class="text-[14px] font-semibold text-white mb-1">${data.title}</div>
              <div class="text-[12px] text-white/50 leading-relaxed">${plainText}</div>
            </div>
          `);
        } catch (err) {
          instance.setContent('Could not load preview.');
        }
      }
    });

    return () => {
      linkInstances.forEach(ins => ins.destroy());
    };
  }, [crystal.content]);

  const handleEditorClick = useCallback(async (e) => {
    const target = e.target;
    if (target.classList.contains('wiki-link')) {
      const slug = target.getAttribute('data-id');
      if (slug && onNavigate) {
        // Automatically save current state before navigating
        if (saveState === 'unsaved') {
          await handleSave();
        }
        onNavigate(slug);
      }
    }
  }, [onNavigate, saveState, handleSave]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex-1 flex flex-col h-full bg-transparent relative transition-all duration-500 rounded-[20px] p-[2px]"
    >
      {/* V6 Aura Engine: ZERO CPU BLUR, Pure Hardware Scaling & Gradients */}
      
      {/* 1. Ambient Volumetric Glow (Static, GPU friendly box-shadow) */}
      {glowRender && (
        <div className={`absolute inset-0 z-0 rounded-[20px] pointer-events-none transition-opacity duration-700 ease-in-out ${glowVisible ? 'opacity-100' : 'opacity-0'}`}
             style={{ boxShadow: '0 0 30px rgba(192,132,252,0.1), 0 0 60px rgba(0,209,255,0.08)' }}></div>
      )}

      {/* 2. Precision Rotating Edge Track (Cropped by overflow-hidden, lit by rotating radial orbs) */}
      {glowRender && (
        <div className={`absolute inset-0 z-0 rounded-[20px] pointer-events-none overflow-hidden transition-opacity duration-700 ease-in-out ${glowVisible ? 'opacity-100' : 'opacity-0'}`}
             style={{ willChange: 'opacity' }}>
           <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2"
                style={{ animation: 'ai-spin 4s linear infinite', willChange: 'transform' }}>
              <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(0,209,255,1)_0%,transparent_60%)]"></div>
              <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(192,132,252,1)_0%,transparent_60%)]"></div>
              <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(249,115,82,1)_0%,transparent_60%)]"></div>
              <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,1)_0%,transparent_60%)]"></div>
           </div>
        </div>
      )}

      {/* 3. Solid Armor Core (Sits at inset 2px, acting as the physical mask for the track) */}
      <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[18px] pointer-events-none z-10 border border-[#1a1a1a]"
           style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">← Back</button>
            <input 
              type="text"
              className="bg-transparent text-2xl font-semibold text-white focus:outline-none placeholder-gray-600"
              placeholder="无题结晶"
              value={crystal.title}
              onChange={(e) => {
                setCrystal(prev => ({ ...prev, title: e.target.value }));
                setSaveState('unsaved');
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-mono tracking-wider">
              {saveState === 'unsaved' && '* 未保存'}
              {saveState === 'saving' && '正在写入...'}
              {saveState === 'saved' && '已保存'}
            </span>
            <button onClick={handleSave} disabled={saveState === 'saved'}
              className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-all duration-300 ${saveState === 'unsaved' ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)] hover:shadow-[0_0_20px_rgba(0,209,255,0.5)]' : 'bg-[#1a1a1a] text-gray-500 border border-[#333]'}`}
            >
              Save (Ctrl+S)
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative block-editor">
          {isAiThinking && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-[20px] bg-black/60 backdrop-blur-md border border-[#ffffff10] shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 z-10">
               <div className="relative flex items-center justify-center w-4 h-4">
                 <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff007a] via-[#8b5cf6] to-[#00D1FF] blur-sm animate-[spin_2s_linear_infinite]"></div>
                 <div className="w-2 h-2 rounded-full bg-white z-10"></div>
               </div>
               <span className="text-xs bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a1a1aa] font-medium tracking-wide">AI 正在构建晶体...</span>
            </div>
          )}
          <div className="max-w-3xl mx-auto h-full pb-32 relative group/editor">
            {editor && (
              <>
                <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }} 
                  className="flex items-center gap-1 px-2 py-1.5 glass-panel rounded-xl border border-white/10 shadow-2xl backdrop-blur-3xl bg-[#0a0a0a]/90"
                >
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Bold size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Italic size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('strike') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Strikethrough size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('code') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Code size={15} strokeWidth={2.5} /></button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-[#C084FC]/20 text-[#C084FC]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Heading1 size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Heading2 size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('blockquote') ? 'bg-[#34d399]/20 text-[#34d399]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Quote size={15} strokeWidth={2.5} /></button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button onClick={() => handleAIAction('improve')} className="p-1.5 rounded-lg text-[#00D1FF] hover:bg-[#00D1FF]/10 transition-all flex items-center gap-1.5 px-2.5">
                    <Sparkles size={14} />
                    <span className="text-[11px] font-medium tracking-tight">AI 润色</span>
                  </button>
                  <button onClick={() => handleAIAction('translate_en')} className="p-1.5 rounded-lg text-[#C084FC] hover:bg-[#C084FC]/10 transition-all px-2">
                    <Languages size={14} />
                  </button>
                  <button onClick={() => handleAIAction('tone_pro')} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all px-2">
                    <Type size={14} />
                  </button>
                </BubbleMenu>
                <FloatingMenu editor={editor} tippyOptions={{ duration: 150, offset: [0, 24] }}
                  className="flex items-center gap-1 px-1 py-1 glass-panel rounded-lg border border-white/5 shadow-2xl backdrop-blur-3xl bg-[#0a0a0a]/80 -ml-24 opacity-40 hover:opacity-100 transition-opacity"
                >
                  <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Bullet List"><List size={15} strokeWidth={2.5} /></button>
                  <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded-lg transition-all ${editor.isActive('taskList') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Task List"><ListTodo size={15} strokeWidth={2.5} /></button>
                </FloatingMenu>
              </>
            )}
            <div onClick={handleEditorClick}>
              <EditorContent editor={editor} />
            </div>

            {/* Backlinks Panel */}
            {backlinks.length > 0 && (
              <div className="mt-16 pt-8 border-t border-white/5 pb-20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-3 bg-[#00D1FF] rounded-full shadow-[0_0_8px_#00D1FF]"></div>
                  <h3 className="text-[12px] font-mono uppercase tracking-[0.2em] text-white/40">Inbound Connections</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backlinks.map(link => (
                    <div 
                      key={link.id} 
                      onClick={() => onNavigate(link.slug)}
                      className="group flex flex-col p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#00D1FF]/30 transition-all cursor-pointer"
                    >
                      <span className="text-sm font-medium text-white/80 group-hover:text-[#00D1FF] transition-colors">{link.title}</span>
                      <span className="text-[10px] font-mono text-white/30 uppercase mt-1">Edited {new Date(link.updated_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CrystalEditor;
