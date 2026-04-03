import { create } from 'zustand';
import type { TemplateGroup, TemplateFile } from '@/types';

interface TemplateStore {
  templateGroups: TemplateGroup[];
  currentGroup: TemplateGroup | null;
  currentGroupFiles: TemplateFile[];
  currentFile: TemplateFile | null;
  loading: boolean;
  setTemplateGroups: (groups: TemplateGroup[]) => void;
  setCurrentGroup: (group: TemplateGroup | null) => void;
  setCurrentGroupFiles: (files: TemplateFile[]) => void;
  setCurrentFile: (file: TemplateFile | null) => void;
  setLoading: (loading: boolean) => void;
  addTemplateGroup: (group: TemplateGroup) => void;
  updateTemplateGroup: (id: number, group: TemplateGroup) => void;
  removeTemplateGroup: (id: number) => void;
  updateFile: (id: number, file: TemplateFile) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templateGroups: [],
  currentGroup: null,
  currentGroupFiles: [],
  currentFile: null,
  loading: false,
  setTemplateGroups: (groups) => set({ templateGroups: groups }),
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setCurrentGroupFiles: (files) => set({ currentGroupFiles: files }),
  setCurrentFile: (file) => set({ currentFile: file }),
  setLoading: (loading) => set({ loading }),
  addTemplateGroup: (group) =>
    set((state) => ({
      templateGroups: [...state.templateGroups, group],
    })),
  updateTemplateGroup: (id, group) =>
    set((state) => ({
      templateGroups: state.templateGroups.map((g) => (g.id === id ? group : g)),
    })),
  removeTemplateGroup: (id) =>
    set((state) => ({
      templateGroups: state.templateGroups.filter((g) => g.id !== id),
    })),
  updateFile: (id, file) =>
    set((state) => ({
      currentGroupFiles: state.currentGroupFiles.map((f) => (f.id === id ? file : f)),
    })),
}));
