import { Composition } from 'remotion';
import { Hello } from './Hello';

// The composition line from the migration guide.
export const Root: React.FC = () => (
  <Composition id="Hello" component={Hello} durationInFrames={120} fps={30} width={1920} height={1080} />
);
