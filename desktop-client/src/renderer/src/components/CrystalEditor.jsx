import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Quote, List, ListTodo, Sparkles, Languages, Type, Trash2 } from 'lucide-react';
import { GhostText } from './extensions/GhostText';
import { WikiLink } from './extensions/WikiLink';
import SlashCommand from './extensions/SlashCommand';
import CommandList from './CommandList';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const CrystalEditor = ({ currentCrystalSlug, currentUser, onBack, onNavigate, onCrystalSaved, onDeleteCrystal, onOpenMemoryVault }) => {
  const [title, setTitle] = useState('');
  const [backlinks, setBacklinks] = useState([]);
  const [memoryPreview, setMemoryPreview] = useState([]);
  const [saveState, setSaveState] = useState('saved');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isRecallingMemories, setIsRecallingMemories] = useState(false);

  const contentRef = useRef('');
  const recallTimer = useRef(null);
  const autoSaveTimer = useRef(null);
  const handleAIActionRef = useRef(null);
  const triggerAIGhostFetchRef = useRef(null);

  const recallMemories = useCallback(async (content) => {
    const plainText = (content || '').trim();
    if (!currentUser || !plainText) {
      setMemoryPreview([]);
      setIsRecallingMemories(false);
      return;
    }

    setIsRecallingMemories(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/memories/recall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser
        },
        body: JSON.stringify({ content: plainText, limit: 5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Memory recall failed');
      setMemoryPreview(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('[Memory] Recall error:', err);
      setMemoryPreview([]);
    } finally {
      setIsRecallingMemories(false);
    }
  }, [currentUser]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#00D1FF] underline decoration-[#00D1FF]/30 hover:decoration-[#00D1FF] cursor-pointer' }
      }),
      GhostText.configure({
        onTab: (editorInstance) => {
          triggerAIGhostFetchRef.current?.(editorInstance);
          return true;
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
              if (!Array.isArray(data)) return [];
              return data.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
            } catch (err) {
              console.error('Failed to fetch suggestions', err);
              return [];
            }
          }
        }
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) => {
            const items = [
              { title: 'Summary', description: 'Summarize current content', icon: <Sparkles size={14} />, action: 'summary' },
              { title: 'Improve Writing', description: 'Polish wording and flow', icon: <Sparkles size={14} />, action: 'improve' },
              { title: 'Expand Thought', description: 'Add detail and explanation', icon: <Sparkles size={14} />, action: 'expand' },
              { title: 'Bullet Brief', description: 'Turn into bullet points', icon: <List size={14} />, action: 'brief' }
            ];

            return items
              .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
              .map((item) => ({
                ...item,
                command: ({ editor: editorInstance, range }) => {
                  editorInstance.chain().focus().deleteRange(range).run();
                  handleAIActionRef.current?.(item.action, editorInstance);
                }
              }));
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
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
                  zIndex: 9999
                });
              },
              onUpdate: (props) => {
                if (!props.clientRect) return;
                component?.updateProps(props);
                popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props);
              },
              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
              }
            };
          }
        }
      }),
      Placeholder.configure({
        placeholder: 'Capture an idea, link another crystal with [[, or pause to invite AI continuation.'
      })
    ],
    content: '',
    onUpdate: ({ editor: editorInstance }) => {
      contentRef.current = editorInstance.getHTML();
      setSaveState((prev) => (prev === 'unsaved' ? prev : 'unsaved'));
      editorInstance.commands.setGhostText('');

      clearTimeout(recallTimer.current);
      recallTimer.current = setTimeout(() => {
        recallMemories(editorInstance.getText());
      }, 1800);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]'
      }
    }
  });

  const handleAIAction = useCallback(async (action, editorInstance, customContent = null) => {
    const activeEditor = editorInstance || editor;
    if (!activeEditor) return;

    const textToProcess =
      customContent ||
      activeEditor.state.doc.textBetween(activeEditor.state.selection.from, activeEditor.state.selection.to) ||
      activeEditor.getText();

    if (!textToProcess.trim()) return;

    setIsAiThinking(true);
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
      const data = JSON.parse(rawResponse);
      if (!res.ok) throw new Error(data.error || 'AI action failed');

      const result = data.choices?.[0]?.message?.content;
      if (result && !activeEditor.isDestroyed) {
        activeEditor.chain().focus().insertContent('<p></p>').insertContent(marked.parse(result)).run();
      }
    } catch (err) {
      console.error('[AI] Action error:', err);
    } finally {
      setIsAiThinking(false);
    }
  }, [currentUser, editor]);

  const triggerAIGhostFetch = useCallback(async (editorInstance) => {
    const activeEditor = editorInstance || editor;
    if (!activeEditor || isAiThinking) return;
    const textContent = activeEditor.getText();
    if (!textContent.trim()) return;

    setIsAiThinking(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser
        },
        body: JSON.stringify({ prompt: textContent.slice(-1000) })
      });

      const rawResponse = await res.text();
      const data = JSON.parse(rawResponse);
      if (!res.ok) throw new Error(data.error || 'Ghost completion failed');

      const suggestion = data.choices?.[0]?.message?.content;
      if (suggestion && !activeEditor.isDestroyed) activeEditor.commands.setGhostText(suggestion);
    } catch (err) {
      console.error('[AI] Ghost error:', err);
    } finally {
      setIsAiThinking(false);
    }
  }, [currentUser, editor, isAiThinking]);

  useEffect(() => {
    handleAIActionRef.current = handleAIAction;
    triggerAIGhostFetchRef.current = triggerAIGhostFetch;
  }, [handleAIAction, triggerAIGhostFetch]);

  useEffect(() => {
    return () => {
      clearTimeout(recallTimer.current);
      clearTimeout(autoSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!currentCrystalSlug) return;

    const loadData = async () => {
      try {
        const crystalRes = await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}`, {
          headers: { 'X-User-Name': currentUser }
        });
        const crystalData = await crystalRes.json();
        setTitle(crystalData.title || '');
        contentRef.current = crystalData.content || '';

        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(crystalData.content || '');
        }
        recallMemories(crystalData.content || '');
        setSaveState('saved');

        const backlinksRes = await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}/backlinks`, {
          headers: { 'X-User-Name': currentUser }
        });
        const backlinksData = await backlinksRes.json();
        setBacklinks(Array.isArray(backlinksData) ? backlinksData : []);
      } catch (err) {
        console.error('Failed to load crystal data:', err);
      }
    };

    loadData();
  }, [currentCrystalSlug, currentUser, editor, recallMemories]);

  const handleSave = useCallback(async () => {
    if (!currentCrystalSlug || saveState === 'saved') return;
    setSaveState('saving');

    try {
      const latestContent = editor?.getHTML?.() || contentRef.current;
      const res = await fetch(`http://localhost:8080/api/v1/crystals/${currentCrystalSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser
        },
        body: JSON.stringify({ title, content: latestContent })
      });

      if (!res.ok) throw new Error('Save failed');
      const savedCrystal = await res.json();
      setTitle(savedCrystal.title ?? title);
      contentRef.current = savedCrystal.content ?? latestContent;
      recallMemories(editor?.getText?.() || latestContent);
      onCrystalSaved?.();
      setSaveState('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveState('unsaved');
    }
  }, [currentCrystalSlug, currentUser, editor, onCrystalSaved, recallMemories, saveState, title]);

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

  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    if (!currentCrystalSlug || saveState !== 'unsaved') return;

    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => clearTimeout(autoSaveTimer.current);
  }, [currentCrystalSlug, handleSave, saveState]);

  useEffect(() => {
    const linkInstances = tippy('.wiki-link', {
      content: 'Loading preview...',
      allowHTML: true,
      delay: [500, 0],
      interactive: true,
      appendTo: () => document.body,
      onShow: async (instance) => {
        const slug = instance.reference.getAttribute('data-id');
        try {
          const res = await fetch(`http://localhost:8080/api/v1/crystals/${slug}`, {
            headers: { 'X-User-Name': currentUser }
          });
          const data = await res.json();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.content;
          const plainText = `${tempDiv.innerText.slice(0, 150)}...`;

          instance.setContent(`
            <div class="p-3 bg-[#0a0a0a] border border-white/10 rounded-lg max-w-xs">
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
      linkInstances.forEach((instance) => instance.destroy());
    };
  }, [currentCrystalSlug, currentUser]);

  const handleEditorClick = useCallback(async (e) => {
    const target = e.target;
    if (!target.classList.contains('wiki-link')) return;

    const slug = target.getAttribute('data-id');
    if (!slug || !onNavigate) return;

    if (saveState === 'unsaved') await handleSave();
    onNavigate(slug);
  }, [handleSave, onNavigate, saveState]);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative rounded-[20px] p-[2px]">
      <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[18px] pointer-events-none z-10 border border-[#1a1a1a]"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-5 min-w-0">
            <button onClick={onBack} className="px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.03] text-gray-400 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-colors text-sm">
              {'< Back'}
            </button>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.32em] text-white/25 font-mono mb-2">Crystal Workspace</div>
              <input
                type="text"
                className="w-full bg-transparent text-2xl font-semibold text-white focus:outline-none placeholder-gray-600"
                placeholder="Untitled Crystal"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveState((prev) => (prev === 'unsaved' ? prev : 'unsaved'));
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenMemoryVault?.()}
              className="px-3.5 py-2 rounded-full text-sm font-medium border border-cyan-400/12 bg-cyan-400/[0.06] text-cyan-100/80 hover:bg-cyan-400/[0.12] hover:border-cyan-400/22 transition-colors"
            >
              Memory Vault
            </button>
            <button
              onClick={() => onDeleteCrystal?.(currentCrystalSlug)}
              className="px-3.5 py-2 rounded-full text-sm font-medium border border-rose-400/12 bg-rose-400/6 text-rose-100/80 hover:bg-rose-400/10 hover:border-rose-400/22 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-full border text-[11px] font-mono tracking-[0.18em] uppercase ${
              saveState === 'unsaved'
                ? 'border-amber-400/20 bg-amber-400/8 text-amber-200'
                : saveState === 'saving'
                  ? 'border-cyan-400/20 bg-cyan-400/8 text-cyan-200'
                  : 'border-emerald-400/20 bg-emerald-400/8 text-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                saveState === 'unsaved' ? 'bg-amber-300' : saveState === 'saving' ? 'bg-cyan-300' : 'bg-emerald-300'
              }`}></span>
              {saveState === 'unsaved' && 'Pending Sync'}
              {saveState === 'saving' && 'Saving'}
              {saveState === 'saved' && 'Synced'}
            </div>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                saveState === 'unsaved'
                  ? 'bg-[#00D1FF] text-black border-[#00D1FF]'
                  : saveState === 'saving'
                    ? 'bg-[#0b1620] text-cyan-100 border-cyan-400/20'
                    : 'bg-white/[0.03] text-white/65 border-white/10 hover:bg-white/[0.05]'
              }`}
            >
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save Now'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative block-editor">
          {isAiThinking && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-[20px] bg-black border border-[#ffffff10] flex items-center gap-3 z-10">
              <div className="w-2 h-2 rounded-full bg-cyan-300"></div>
              <span className="text-xs text-white/70 font-medium tracking-wide">AI is composing...</span>
            </div>
          )}

          <div className="max-w-6xl mx-auto h-full pb-32 relative flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full max-w-3xl relative group/editor">
              {editor && (
                <>
                  <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    className="flex items-center gap-1 px-2 py-1.5 bg-[#0a0a0a] rounded-xl border border-white/10"
                  >
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg ${editor.isActive('bold') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Bold size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg ${editor.isActive('italic') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Italic size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-lg ${editor.isActive('strike') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Strikethrough size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-1.5 rounded-lg ${editor.isActive('code') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Code size={15} strokeWidth={2.5} /></button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-lg ${editor.isActive('heading', { level: 1 }) ? 'bg-[#C084FC]/20 text-[#C084FC]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Heading1 size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-lg ${editor.isActive('heading', { level: 2 }) ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Heading2 size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-lg ${editor.isActive('blockquote') ? 'bg-[#34d399]/20 text-[#34d399]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Quote size={15} strokeWidth={2.5} /></button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => handleAIAction('improve')} className="p-1.5 rounded-lg text-[#00D1FF] hover:bg-[#00D1FF]/10 flex items-center gap-1.5 px-2.5">
                      <Sparkles size={14} />
                      <span className="text-[11px] font-medium tracking-tight">AI Polish</span>
                    </button>
                    <button onClick={() => handleAIAction('translate_en')} className="p-1.5 rounded-lg text-[#C084FC] hover:bg-[#C084FC]/10 px-2">
                      <Languages size={14} />
                    </button>
                    <button onClick={() => handleAIAction('tone_pro')} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 px-2">
                      <Type size={14} />
                    </button>
                  </BubbleMenu>

                  <FloatingMenu
                    editor={editor}
                    tippyOptions={{ duration: 100, offset: [0, 24] }}
                    className="flex items-center gap-1 px-1 py-1 bg-[#0a0a0a] rounded-lg border border-white/5 -ml-24 opacity-60 hover:opacity-100"
                  >
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Bullet List"><List size={15} strokeWidth={2.5} /></button>
                    <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded-lg ${editor.isActive('taskList') ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Task List"><ListTodo size={15} strokeWidth={2.5} /></button>
                  </FloatingMenu>
                </>
              )}

              <div onClick={handleEditorClick}>
                <div className="rounded-[28px] border border-white/[0.06] bg-[#0f1014] px-8 py-8">
                  <EditorContent editor={editor} />
                </div>
              </div>

              {backlinks.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/5 pb-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-3 bg-[#00D1FF] rounded-full"></div>
                    <h3 className="text-[12px] font-mono uppercase tracking-[0.2em] text-white/40">Inbound Connections</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {backlinks.map((link) => (
                      <div
                        key={link.id}
                        onClick={() => onNavigate(link.slug)}
                        className="group flex flex-col p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#00D1FF]/30 transition-colors cursor-pointer"
                      >
                        <span className="text-sm font-medium text-white/80 group-hover:text-[#00D1FF]">{link.title}</span>
                        <span className="text-[10px] font-mono text-white/30 uppercase mt-1">Edited {new Date(link.updated_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="w-full lg:w-[340px] shrink-0">
              <div className="rounded-[28px] border border-white/8 bg-[#0b0d11] overflow-hidden relative">
                <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between relative">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#7dd3fc] font-mono">Phase 4</div>
                    <div className="text-base text-white/85 mt-1 font-medium">Memory Recall</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${isRecallingMemories ? 'bg-[#22d3ee]' : 'bg-white/20'}`}></div>
                </div>
                <div className="px-5 py-5 space-y-4 relative">
                  <div className="rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-3 text-xs text-white/45 leading-6">
                    {isRecallingMemories ? 'Scanning your long-term memory across all your crystals...' : 'Relevant facts and style traces from your personal crystal archive appear here and are also supplied to AI writing actions.'}
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/70 font-mono mb-1">Personal Scope</div>
                    <div className="text-xs text-white/55 leading-6">Memory recall is already cross-crystal. We match against all memories extracted from this user&apos;s crystals, not only the current note.</div>
                  </div>
                  {memoryPreview.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-xs text-white/35 leading-6">
                      Write a bit more or save this crystal to strengthen recall across your whole archive.
                    </div>
                  ) : (
                    memoryPreview.map((item) => (
                      <div key={`${item.id}-${item.score}`} className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-mono border ${item.category === 'style' ? 'text-[#c084fc] border-[#c084fc]/20 bg-[#c084fc]/8' : 'text-[#67e8f9] border-[#67e8f9]/20 bg-[#67e8f9]/8'}`}>{item.category}</span>
                          <span className="text-[10px] text-white/30 font-mono">score {item.score}</span>
                        </div>
                        {item.entity && <div className="text-xs text-white/55 mb-2">{item.entity}</div>}
                        <div className="text-sm text-white/82 leading-6">{item.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrystalEditor;
