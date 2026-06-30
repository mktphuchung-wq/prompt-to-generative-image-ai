declare namespace chrome {
  namespace runtime {
    interface MessageSender {
      tab?: tabs.Tab;
    }

    const onInstalled: {
      addListener(callback: () => void): void;
    };

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void;
    };

    function sendMessage<TResponse = unknown>(message: unknown): Promise<TResponse>;
  }

  namespace action {
    const onClicked: {
      addListener(callback: (tab: tabs.Tab) => void | Promise<void>): void;
    };
  }

  namespace tabs {
    interface Tab {
      id?: number;
      windowId?: number;
    }
  }

  namespace windows {
    interface Window {
      id?: number;
    }

    function getCurrent(): Promise<Window>;
  }

  namespace sidePanel {
    function open(options: { windowId: number }): Promise<void>;
    function setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  }

  namespace storage {
    namespace local {
      function get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
    }
  }
}
