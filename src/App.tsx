import { MagneticDemo } from '../features/magnetic/Demo';

/**
 * The shell. Right now it shows the magnetic demo. As more features land under features/, this is
 * where they get a tab or a route. Each feature stays self-contained in its own folder.
 */
export default function App() {
  return (
    <div className="h-screen w-screen">
      <MagneticDemo />
    </div>
  );
}
