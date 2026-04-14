import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { PluginKey } from '@tiptap/pm/state';
import WikiSuggestionList from '../WikiSuggestionList';

export const WikiLink = Mention.extend({
  name: 'wikiLink',
  
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'wiki-link text-[#00D1FF] bg-[#00D1FF]/10 font-medium px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-[#00D1FF]/20 transition-colors border border-[#00D1FF]/20',
      },
      renderLabel({ options, node }) {
        return `[[${node.attrs.label ?? node.attrs.id}]]`;
      },
      suggestion: {
        char: '[[',
        pluginKey: new PluginKey('wiki-link'),
        allowedPrefixes: null,
        command: ({ editor, range, props }) => {
          // Add spacing after the link
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
        allow: ({ state, range }) => {
          // Allow inside paragraphs etc.
          return true;
        },
        render: () => {
          let component;
          let popup;

          return {
            onStart: props => {
              component = new ReactRenderer(WikiSuggestionList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              return component.ref?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseDOM: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-id': attributes.id,
          }
        },
      },
      label: {
        default: null,
        parseDOM: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }
          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },
});
