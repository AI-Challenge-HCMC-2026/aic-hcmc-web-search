import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './SearchPageShell.css';

export interface SearchFilter {
  label: string;
  options: string[];
  defaultValue?: string;
}

export interface SearchPageShellProps {
  title: string;
  subtitle: string;
  description: string;
  placeholder: string;
  filters: SearchFilter[];
  suggestions: string[];
  resultLabel: string;
}

export const SearchPageShell: React.FC<SearchPageShellProps> = ({
  title,
  subtitle,
  description,
  placeholder,
  filters,
  suggestions,
  resultLabel,
}) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((filter) => [filter.label, filter.defaultValue ?? filter.options[0] ?? ''])),
  );

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) setSubmittedQuery(trimmedQuery);
  };

  return (
    <div className="search-page-container">
      <header className="search-page-header">
        <div className="search-page-title-row">
          <span className="search-page-sparkle" aria-hidden="true">✻</span>
          <h1>{title}</h1>
        </div>
        <p className="search-page-subtitle">{subtitle}</p>
      </header>

      <section className="search-command-card" aria-label={`${title} command bar`}>
        <div className="search-command-intro">
          <span className="search-command-label">SEARCH COMMAND</span>
          <span>{description}</span>
        </div>
        <form className="search-command-form" onSubmit={submitSearch}>
          <div className="search-input-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
            {query && <button type="button" className="search-clear-button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </div>
          <div className="search-command-controls">
            <div className="search-filter-list">
              {filters.map((filter) => (
                <label className="search-filter" key={filter.label}>
                  <span>{filter.label}</span>
                  <select value={selectedFilters[filter.label]} onChange={(event) => setSelectedFilters((current) => ({ ...current, [filter.label]: event.target.value }))} aria-label={filter.label}>
                    {filter.options.map((option) => <option value={option} key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <Button type="submit" variant="primary" size="md" leftIcon={<span aria-hidden="true">↗</span>}>Search</Button>
          </div>
        </form>
      </section>

      <section className="search-results-card" aria-live="polite">
        <div className="search-results-header">
          <div>
            <span className="search-results-eyebrow">{resultLabel}</span>
            <h2>{submittedQuery ? `Ready to search “${submittedQuery}”` : 'Search workspace'}</h2>
          </div>
          <span className="search-results-status"><i /> Under development</span>
        </div>

        {!submittedQuery ? (
          <div className="search-ready-state">
            <div className="search-ready-icon" aria-hidden="true">✻</div>
            <h3>Start with a focused query</h3>
            <p>{description}</p>
            <div className="search-suggestions">
              {suggestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}<span aria-hidden="true">↗</span></button>
              ))}
            </div>
            <div className="search-preview-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((item) => <span key={item} />)}
            </div>
          </div>
        ) : (
          <div className="search-ready-state search-submitted-state">
            <div className="search-ready-icon" aria-hidden="true">⌁</div>
            <h3>Search pipeline is ready</h3>
            <p>Query submitted. Result rendering will connect to this search mode as its backend contract is enabled.</p>
            <div className="search-query-preview"><span>Query</span><strong>{submittedQuery}</strong></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPageShell;
