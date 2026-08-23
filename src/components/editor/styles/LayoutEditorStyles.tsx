function LayoutEditorStyles() {
  return (
    <style>{`
      .layer-tree-item {
        border-radius: 6px;

        transition:
          background-color 120ms ease,
          border-color 120ms ease;
      }

      .layer-tree-item:hover {
        background: #f1f5f9;
      }

      .editor-side-panel {
        position: fixed;

        top: 0;
        bottom: 0;

        width: 280px;

        display: flex;
        flex-direction: column;

        background: #ffffff;

        z-index: 1200;

        overflow: hidden;

        box-shadow:
          0 0 20px rgba(15, 23, 42, 0.08);
      }

      .editor-side-panel.left {
        left: 0;

        border-right:
          1px solid #e2e8f0;
      }

      .editor-side-panel.right {
        right: 0;

        border-left:
          1px solid #e2e8f0;
      }

      .editor-panel-backdrop {
        display: none;
      }

      .editor-main {
        min-height: 100vh;

        background-color: #f1f5f9;

        background-image:
          radial-gradient(
            circle,
            rgba(100, 116, 139, 0.28) 1px,
            transparent 1px
          );

        background-size: 20px 20px;

        transition:
          margin-left 160ms ease,
          margin-right 160ms ease;
      }

      .editor-edit-panel {
        position: fixed;

        top: 0;
        right: 0;
        bottom: 0;

        width: 400px;
        max-width: 100vw;

        display: flex;
        flex-direction: column;

        background: #ffffff;

        border-left: 1px solid #e2e8f0;

        box-shadow:
          -8px 0 30px
          rgba(15, 23, 42, 0.10);

        z-index: 1400;

        overflow: hidden;
      }

      .editor-edit-panel-header {
        flex-shrink: 0;

        display: flex;

        align-items: center;
        justify-content: space-between;

        padding: 14px 16px;

        border-bottom: 1px solid #e2e8f0;

        background: #ffffff;
      }

      .editor-edit-panel-body {
        flex: 1 1 auto;

        min-height: 180px;

        overflow-y: auto;

        padding: 16px;
      }

      .editor-edit-panel-footer {
        flex-shrink: 0;

        display: flex;

        justify-content: flex-end;

        gap: 8px;

        padding: 12px 16px;        

        border-top: 1px solid #e2e8f0;
      }

      .editor-favorite-section {
        flex: 0 0 auto;

        max-height: 35vh;

        overflow-y: auto;

        background: #ffffff;
      }

      .builder-preview {
        position: relative;

        width: 100%;
        max-width: 1100px;

        min-height: calc(100vh - 100px);

        margin:
          0
          auto
          40px;

        padding: 24px;

        background: #ffffff;

        border:
          1px solid #e2e8f0;

        border-radius: 12px;

        box-shadow:
          0 8px 30px
          rgba(15, 23, 42, 0.08);

        box-sizing: border-box;
      }

      .component-drag-handle,
      .layer-drag-handle {
        touch-action: none;

        -webkit-user-select: none;
        user-select: none;

        -webkit-touch-callout: none;
      }

      .desktop-layer-open-button {
        box-shadow:
          0 3px 12px
          rgba(15, 23, 42, 0.15);
      }

      .editor-mobile-panel-buttons {
        display: none;
      }

      @media (max-width: 767.98px) {
        .editor-side-panel {
          width: min(88vw, 340px);

          z-index: 1300;

          box-shadow:
            0 0 28px
            rgba(15, 23, 42, 0.22);
        }

        .editor-panel-backdrop {
          display: block;

          position: fixed;

          inset: 0;

          background:
            rgba(15, 23, 42, 0.38);

          backdrop-filter: blur(1px);

          z-index: 1290;
        }

        .editor-main {
          margin-left: 0 !important;
          margin-right: 0 !important;

          padding: 8px !important;

          background-image: none;

          background-color: #eef2f7;
        }

        .editor-edit-panel {
          width: min(92vw, 380px);
        }

        .builder-preview {
          width: 100% !important;
          max-width: none !important;

          min-height: calc(100vh - 16px) !important;

          margin: 0 !important;

          padding: 12px !important;

          border-radius: 8px !important;

          box-shadow: none !important;

          padding-bottom: 80px !important;
        }

        .editor-mobile-panel-buttons {
          display: flex;

          position: fixed;

          left: 12px;
          right: 12px;
          bottom:
            calc(
              12px
              + env(safe-area-inset-bottom)
            );

          z-index: 1250;

          gap: 8px;

          pointer-events: none;
        }

        .editor-mobile-panel-buttons > button {
          pointer-events: auto;

          min-height: 44px;

          border-radius: 10px;

          box-shadow:
            0 4px 16px
            rgba(15, 23, 42, 0.20);
        }

        .desktop-layer-open-button {
          display: none !important;
        }

        .component-drag-handle,
        .layer-drag-handle {
          width: 44px !important;
          height: 44px !important;

          min-width: 44px !important;
          min-height: 44px !important;

          font-size: 20px;

          touch-action: none;

          -webkit-user-select: none;
          user-select: none;

          -webkit-touch-callout: none;
        }
      }

      @media (min-width: 768px) {
        .editor-mobile-panel-buttons {
          display: none !important;
        }
      }
    `}</style>
  );
}

export default LayoutEditorStyles;
