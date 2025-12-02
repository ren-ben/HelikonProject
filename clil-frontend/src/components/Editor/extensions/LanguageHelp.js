import { Node, mergeAttributes } from '@tiptap/core';

export default Node.create({
  name: 'languageHelp',

  group: 'block',

  content: 'block+', // Erlaubt anderen Block-Content innerhalb der Box

  addAttributes() {
    return {
      title: {
        default: 'Sprachliche Hilfe',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.language-help-box',
        getAttrs: dom => ({
          title: dom.querySelector('h4')?.innerText || 'Sprachliche Hilfe',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const title = node.attrs.title || 'Sprachliche Hilfe';
    // Erzeuge die DOM-Struktur für die Box
    const dom = document.createElement('div');
    dom.className = 'language-help-box';
    Object.entries(mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)).forEach(([key, value]) => {
        dom.setAttribute(key, value);
    });

    const titleElement = document.createElement('h4');
    titleElement.innerText = title;
    dom.appendChild(titleElement);

    const contentElement = document.createElement('div');
    // Tiptap rendert den Inhalt in dieses contentElement

    return {
      dom,
      contentDom: contentElement,
    };
  },

  addCommands() {
    return {
      insertLanguageHelp: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attrs,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: attrs.content || 'Hier Inhalt einfügen...',
                },
              ],
            },
          ],
        });
      },
    };
  },
}); 