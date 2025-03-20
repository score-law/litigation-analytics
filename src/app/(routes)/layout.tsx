
import './styles.scss';

export default function SearchLayout({children}: {children: React.ReactNode}) {
    return (
        <div className="search-page-container">
            {children}
        </div>
    );
}