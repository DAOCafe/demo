import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Write your proposal description using Markdown...',
    minHeight = '300px'
}: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.substring(start, end);
        const newValue = value.substring(0, start) + before + selected + after + value.substring(end);

        onChange(newValue);

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + before.length + (selected ? selected.length : 0);
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    return (
        <div className="markdown-editor">
            {/* Toolbar */}
            <div className="markdown-toolbar">
                <div className="toolbar-buttons">
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('**', '**')}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('*', '*')}
                        title="Italic"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('## ')}
                        title="Heading"
                    >
                        H
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('- ')}
                        title="List"
                    >
                        •
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('1. ')}
                        title="Numbered List"
                    >
                        1.
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('`', '`')}
                        title="Inline Code"
                    >
                        {'</>'}
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('\n```\n', '\n```\n')}
                        title="Code Block"
                    >
                        {'{ }'}
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => insertMarkdown('[', '](url)')}
                        title="Link"
                    >
                        🔗
                    </button>
                </div>

                <div className="tab-buttons">
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
                        onClick={() => setActiveTab('write')}
                    >
                        Write
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {/* Editor / Preview */}
            {activeTab === 'write' ? (
                <textarea
                    id="markdown-editor"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="markdown-textarea"
                    style={{ minHeight }}
                />
            ) : (
                <div className="markdown-preview" style={{ minHeight }}>
                    {value ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <span className="preview-placeholder">Nothing to preview</span>
                    )}
                </div>
            )}
        </div>
    );
}
