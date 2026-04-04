export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0) return null;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    const showStart = (currentPage - 1) * itemsPerPage + 1;
    const showEnd = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div id="pagination-container" class="pagination-container">
            <div class="pagination-left">
                <span id="pagination-info" class="pagination-info">
                    Showing {showStart} - {showEnd} of {totalItems}
                </span>
                <select
                    id="items-per-page"
                    class="filter-select"
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
            <div class="pagination-right">
                <button
                    id="btn-prev-page"
                    class="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => { onPageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                    ‹
                </button>
                <div id="pagination-pages" class="pagination-pages">
                    {pages.map(i => (
                        <button
                            key={i}
                            class={`pagination-page-btn ${i === currentPage ? 'active' : ''}`}
                            onClick={() => { onPageChange(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            {i}
                        </button>
                    ))}
                </div>
                <button
                    id="btn-next-page"
                    class="pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => { onPageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                    ›
                </button>
            </div>
        </div>
    );
}
