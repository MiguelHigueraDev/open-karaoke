import { useAppState } from './state/lyrics-context';
import { Step } from './types/steps';
import { HomeScreen } from './components/home/home-screen';
import { UploadScreen } from './components/upload/upload-screen';
import { LineSyncScreen } from './components/line-sync/line-sync-screen';
import { WordSyncScreen } from './components/word-sync/word-sync-screen';
import { PreviewScreen } from './components/preview/preview-screen';
import { ExportScreen } from './components/export/export-screen';
import { PlayerScreen } from './components/player/player-screen';

function App() {
  const { appMode, step } = useAppState();

  if (appMode === 'home') return <HomeScreen />;
  if (appMode === 'player') return <PlayerScreen />;

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
    default:
      return <UploadScreen />;
  }
}

export default App;
