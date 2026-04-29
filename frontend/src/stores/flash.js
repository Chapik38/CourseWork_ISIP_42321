import { defineStore } from 'pinia';
export const useFlashStore = defineStore('flash', {
  state: () => ({ queue: [] }),
  actions: {
    push(type, message) {
      const item = { id: crypto.randomUUID(), type, message };
      this.queue.push(item);
      setTimeout(() => this.remove(item.id), 4000);
    },
    remove(id) { this.queue = this.queue.filter(i => i.id !== id); }
  }
});
