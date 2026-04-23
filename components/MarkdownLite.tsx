import React from "react";

// Minimal dependency-free markdown renderer for legal pages. Supports headings,
// **bold** / *italic*, [links](url), bullet lists, --- rules. Anything richer
// renders as plain text — acceptable for lawyer-authored static copy.

type InlineNode = React.ReactNode;

// React's text-node rendering already escapes HTML entities, so regex output
// passed via {raw.slice(...)} is safe. No manual escapeHtml needed.

// Inline formatting (bold, italic, links) applied to a text run.
function renderInline(raw: string, keyPrefix: string): InlineNode[] {
    // Regex matches one token at a time: link | **bold** | *italic*.
    const pattern = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
    const out: InlineNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = pattern.exec(raw)) !== null) {
        if (match.index > last) out.push(raw.slice(last, match.index));
        if (match[1]) {
            // [text](url)
            out.push(
                <a
                    key={`${keyPrefix}-l-${i}`}
                    href={match[3]}
                    className="text-[hsl(16,70%,60%)] hover:underline"
                    target={match[3].startsWith("http") ? "_blank" : undefined}
                    rel={match[3].startsWith("http") ? "noopener noreferrer" : undefined}
                >
                    {match[2]}
                </a>
            );
        } else if (match[4]) {
            out.push(
                <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
                    {match[5]}
                </strong>
            );
        } else if (match[6]) {
            out.push(
                <em key={`${keyPrefix}-i-${i}`} className="italic">
                    {match[7]}
                </em>
            );
        }
        last = pattern.lastIndex;
        i++;
    }
    if (last < raw.length) out.push(raw.slice(last));
    return out;
}

export function MarkdownLite({ source }: { source: string }) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    const blocks: React.ReactNode[] = [];

    let paragraphBuf: string[] = [];
    let listBuf: string[] = [];
    let key = 0;

    const flushParagraph = () => {
        if (paragraphBuf.length === 0) return;
        const text = paragraphBuf.join(" ");
        blocks.push(
            <p key={`p-${key++}`} className="text-white/70 leading-relaxed mb-4">
                {renderInline(text, `p${key}`)}
            </p>
        );
        paragraphBuf = [];
    };

    const flushList = () => {
        if (listBuf.length === 0) return;
        blocks.push(
            <ul key={`ul-${key++}`} className="list-disc pl-6 mb-4 space-y-2 text-white/70">
                {listBuf.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                        {renderInline(item, `li${key}-${i}`)}
                    </li>
                ))}
            </ul>
        );
        listBuf = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === "") {
            flushParagraph();
            flushList();
            continue;
        }

        if (trimmed === "---") {
            flushParagraph();
            flushList();
            blocks.push(<hr key={`hr-${key++}`} className="border-white/10 my-8" />);
            continue;
        }

        // Headings
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const className =
                level === 1
                    ? "text-3xl md:text-4xl font-black text-white mt-8 mb-6 first:mt-0"
                    : level === 2
                      ? "text-2xl md:text-3xl font-bold text-white mt-10 mb-4"
                      : level === 3
                        ? "text-xl md:text-2xl font-bold text-white mt-8 mb-3"
                        : "text-lg md:text-xl font-semibold text-white mt-6 mb-2";
            const Tag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements;
            blocks.push(
                React.createElement(
                    Tag,
                    { key: `h-${key++}`, className },
                    renderInline(text, `h${key}`)
                )
            );
            continue;
        }

        // Bullet list
        const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (listMatch) {
            flushParagraph();
            listBuf.push(listMatch[1]);
            continue;
        }

        // Accumulate paragraph text
        flushList();
        paragraphBuf.push(trimmed);
    }

    flushParagraph();
    flushList();

    return <div className="max-w-none">{blocks}</div>;
}
