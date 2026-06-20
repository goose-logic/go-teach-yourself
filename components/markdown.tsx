import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-curio max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-6 font-serif text-2xl font-semibold text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-6 font-serif text-xl font-semibold text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground">{children}</h3>,
          p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1 text-foreground/90">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1 text-foreground/90">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-foreground/95 p-4 font-mono text-sm text-background">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-primary pl-4 italic text-muted-foreground">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
