import Link from 'next/link';
import './styles.scss';

export default function NavBar() {
    return (
        <header>
            <Link href="/" className="logo">
                <h1>Score</h1>
            </Link>
            <nav>
                <ul>
                    <li><Link href="/search">Search</Link></li>
                </ul>
            </nav>
        </header>
    );
}
