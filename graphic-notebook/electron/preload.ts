import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  appVersion: () => Promise<string>;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowSetMainClickThrough: (ignore: boolean) => Promise<void>;
  windowCloseAnnotation: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
  windowOpenAnnotation: () => Promise<void>;
  annotationSetClickThrough: (ignore: boolean) => Promise<void>;
  windowOpenWhiteboard: () => Promise<void>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
}

const api: ElectronAPI = {
  appVersion: () => ipcRenderer.invoke("app:version"),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  windowSetMainClickThrough: (ignore: boolean) => ipcRenderer.invoke("window:setMainClickThrough", ignore),
  windowCloseAnnotation: () => ipcRenderer.invoke("window:closeAnnotation"),
  windowIsMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  windowOpenAnnotation: () => ipcRenderer.invoke("window:openAnnotation"),
  annotationSetClickThrough: (ignore: boolean) => ipcRenderer.invoke("annotation:setClickThrough", ignore),
  windowOpenWhiteboard: () => ipcRenderer.invoke("window:openWhiteboard"),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on("window:maximize-change", (_, isMaximized) => {
      callback(isMaximized);
    });
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
