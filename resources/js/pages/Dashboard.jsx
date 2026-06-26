import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/components/App';

export default function Dashboard() {
    return (
        <Router basename="/dashboard">
            <App />
        </Router>
    );
}
