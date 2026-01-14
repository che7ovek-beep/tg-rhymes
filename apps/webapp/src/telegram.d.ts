declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: { user?: { id: number; language_code?: string } };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export {};
