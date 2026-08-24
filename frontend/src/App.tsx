/** Minimal root component; routing and providers stay in the app layer. */
import { AppRouter } from '@/app/router'

/** Render the application router as the React root. */
export default function App() {
  return <AppRouter />
}
