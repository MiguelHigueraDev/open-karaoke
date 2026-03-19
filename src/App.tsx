import { useAppState } from './state/lyrics-context';
import { Step } from './types/steps';
import { UploadScreen } from './components/upload/upload-screen';
import { LineSyncScreen } from './components/line-sync/line-sync-screen';
import { WordSyncScreen } from './components/word-sync/word-sync-screen';
import { PreviewScreen } from './components/preview/preview-screen';
import { ExportScreen } from './components/export/export-screen';

function App() {
  const { step } = useAppState();

  switch (step) {
    case Step.Upload:
      return <UploadScreen />;
    case Step.LineSync:
      return <LineSyncScreen />;
    case Step.WordSync:
      return <WordSyncScreen />;
    case Step.Preview:
      return <PreviewScreen />;
    case Step.Export:
      return <ExportScreen />;
  }
}

export default App;
