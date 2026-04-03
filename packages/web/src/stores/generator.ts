import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeneratorConfig, PreviewResult } from '@/types';

type SourceMode = 'database' | 'ddl';

interface GeneratorStore {
  sourceMode: SourceMode;
  ddlContent: string;
  selectedTables: string[];
  selectedTemplateGroupId: number | null;
  selectedTemplateFileIds: number[];
  config: GeneratorConfig;
  previewResults: Map<string, PreviewResult>;
  generating: boolean;
  setSourceMode: (mode: SourceMode) => void;
  setDdlContent: (content: string) => void;
  setSelectedTables: (tables: string[]) => void;
  setSelectedTemplateGroupId: (id: number | null) => void;
  setSelectedTemplateFileIds: (ids: number[]) => void;
  setConfig: (config: GeneratorConfig) => void;
  updateConfig: (key: string, value: any) => void;
  setPreviewResult: (key: string, result: PreviewResult) => void;
  clearPreviewResults: () => void;
  setGenerating: (generating: boolean) => void;
  reset: () => void;
}

export const useGeneratorStore = create<GeneratorStore>()(
  persist(
    (set) => ({
      sourceMode: 'database',
      ddlContent: '',
      selectedTables: [],
      selectedTemplateGroupId: null,
      selectedTemplateFileIds: [],
      config: {
        author: 'admin',
        packageName: 'com.example.demo',
        moduleName: 'system',
        tablePrefix: 'sys_',
        date: new Date().toISOString().split('T')[0],
        idType: 'AUTO',
      },
      previewResults: new Map(),
      generating: false,
      setSourceMode: (mode) => set({ sourceMode: mode }),
      setDdlContent: (content) => set({ ddlContent: content }),
      setSelectedTables: (tables) => set({ selectedTables: tables }),
      setSelectedTemplateGroupId: (id) => set({ selectedTemplateGroupId: id }),
      setSelectedTemplateFileIds: (ids) => set({ selectedTemplateFileIds: ids }),
      setConfig: (config) => set({ config }),
      updateConfig: (key, value) =>
        set((state) => ({
          config: { ...state.config, [key]: value },
        })),
      setPreviewResult: (key, result) =>
        set((state) => {
          const newMap = new Map(state.previewResults);
          newMap.set(key, result);
          return { previewResults: newMap };
        }),
      clearPreviewResults: () => set({ previewResults: new Map() }),
      setGenerating: (generating) => set({ generating }),
      reset: () =>
        set({
          sourceMode: 'database',
          ddlContent: '',
          selectedTables: [],
          previewResults: new Map(),
          generating: false,
        }),
    }),
    {
      name: 'codeforge-generator-store',
      partialize: (state) => ({
        sourceMode: state.sourceMode,
        ddlContent: state.ddlContent,
        selectedTables: state.selectedTables,
        selectedTemplateGroupId: state.selectedTemplateGroupId,
        selectedTemplateFileIds: state.selectedTemplateFileIds,
        config: state.config,
      }),
    },
  ),
);
