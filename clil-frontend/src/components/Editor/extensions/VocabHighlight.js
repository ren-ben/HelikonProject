import { Mark, mergeAttributes } from '@tiptap/core';

export default Mark.create({
  name: 'vocabHighlight',

  addAttributes() {
    return {
      // Du kannst hier Attribute hinzufügen, z.B. für Tooltips
      // 'data-tooltip': { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.vocab-highlight', // Oder ein spezifischeres Tag/Klasse
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'vocab-highlight' }), 0];
  },

  addCommands() {
    return {
      toggleVocabHighlight: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
}); 