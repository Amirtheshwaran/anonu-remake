import { create } from 'zustand';
import { PostIdentity, PostType } from '../types/post';

export interface QueuedPost {
  id: string;
  content: string;
  identity: PostIdentity;
  type: PostType;
  tags: string[];
  imageUrls: string[];
  poll?: {
    options: string[];
    durationHours: number;
  };
  timeLimitHours?: number | null;
  createdAt: number;
  status: 'queued' | 'publishing' | 'failed';
  error?: string;
}

interface OutboxState {
  queue: QueuedPost[];
  isProcessing: boolean;
  enqueue: (post: Omit<QueuedPost, 'id' | 'createdAt' | 'status'>) => string;
  remove: (id: string) => void;
  retry: (id: string) => void;
  clear: () => void;
  processQueue: (publishFn: (post: QueuedPost) => Promise<any>) => Promise<{ succeeded: number; failed: number }>;
}

export const useOutboxStore = create<OutboxState>((set, get) => ({
  queue: [],
  isProcessing: false,

  enqueue: (postData) => {
    const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPost: QueuedPost = {
      ...postData,
      id,
      createdAt: Date.now(),
      status: 'queued',
    };

    set((state) => ({
      queue: [...state.queue, newPost],
    }));

    return id;
  },

  remove: (id) => {
    set((state) => ({
      queue: state.queue.filter((p) => p.id !== id),
    }));
  },

  retry: (id) => {
    set((state) => ({
      queue: state.queue.map((p) => (p.id === id ? { ...p, status: 'queued', error: undefined } : p)),
    }));
  },

  clear: () => {
    set({ queue: [] });
  },

  processQueue: async (publishFn) => {
    const { queue, isProcessing } = get();
    if (isProcessing || queue.length === 0) {
      return { succeeded: 0, failed: 0 };
    }

    set({ isProcessing: true });
    let succeeded = 0;
    let failed = 0;

    const queuedItems = get().queue.filter((p) => p.status === 'queued');

    for (const item of queuedItems) {
      // Mark as publishing
      set((state) => ({
        queue: state.queue.map((p) => (p.id === item.id ? { ...p, status: 'publishing' } : p)),
      }));

      try {
        await publishFn(item);
        // Succeeded: remove from outbox
        set((state) => ({
          queue: state.queue.filter((p) => p.id !== item.id),
        }));
        succeeded++;
      } catch (err: any) {
        // Failed: update status and save error
        set((state) => ({
          queue: state.queue.map((p) =>
            p.id === item.id ? { ...p, status: 'failed', error: err.message || 'Network error' } : p
          ),
        }));
        failed++;
      }
    }

    set({ isProcessing: false });
    return { succeeded, failed };
  },
}));
