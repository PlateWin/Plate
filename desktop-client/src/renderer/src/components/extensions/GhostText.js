import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const GhostTextPluginKey = new PluginKey('ghostText');

export const GhostText = Extension.create({
  name: 'ghostText',

  addStorage() {
    return {
      text: '',
    };
  },

  addCommands() {
    return {
      setGhostText: (text) => ({ editor, tr }) => {
        editor.storage.ghostText.text = text;
        tr.setMeta(GhostTextPluginKey, { text });
        return true;
      },
      acceptGhostText: () => ({ editor, dispatch }) => {
        const text = editor.storage.ghostText.text;
        if (!text) return false;
        
        if (dispatch) {
          editor.commands.insertContent(text);
          editor.commands.setGhostText('');
        }
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: GhostTextPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, oldState) => {
            const meta = tr.getMeta(GhostTextPluginKey);
            
            // Handle explicit updates via commands
            if (meta !== undefined) {
              const text = meta.text;
              if (!text || !tr.selection.empty) {
                return DecorationSet.empty;
              }

              const widget = document.createElement('span');
              widget.className = 'italic pointer-events-none whitespace-pre-wrap select-none relative';
              widget.style.color = 'rgba(255, 255, 255, 0.25)'; // Explicitly low opacity for the ghost
              
              const fragment = document.createDocumentFragment();
              for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.textContent = text[i];
                charSpan.style.opacity = '0';
                charSpan.style.display = 'inline-block';
                const delay = i * 0.012;
                charSpan.style.animation = `ai-ink-flow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards ${delay}s`;
                
                if (text[i] === '\n') {
                  fragment.appendChild(document.createElement('br'));
                } else {
                  fragment.appendChild(charSpan);
                }
              }
              widget.appendChild(fragment);

              const deco = Decoration.widget(tr.selection.to, widget, {
                side: 1,
                key: 'ghost-text-widget',
              });

              return DecorationSet.create(tr.doc, [deco]);
            }

            // CRITICAL FIX: If the user moves the cursor or types anything, clear the suggestion
            if (tr.docChanged || tr.selectionSet) {
              // Also sync back to storage to ensure commands like 'accept' know it's gone
              this.storage.text = '';
              return DecorationSet.empty;
            }

            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const text = this.storage.text;
        if (text) {
          return this.editor.commands.acceptGhostText();
        }
        return false;
      },
    };
  },
});
