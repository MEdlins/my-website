import type { NotionBlock, NotionRichText } from '@/lib/notion-cms'

function RichText({ segments }: { segments: NotionRichText[] }) {
  return (
    <>
      {segments.map((s, i) => {
        let node: React.ReactNode = s.text
        if (s.code) node = <code key={i}>{node}</code>
        if (s.bold) node = <strong key={i}>{node}</strong>
        if (s.italic) node = <em key={i}>{node}</em>
        if (s.strikethrough) node = <s key={i}>{node}</s>
        if (s.href) {
          node = (
            <a key={i} href={s.href} target="_blank" rel="noreferrer">
              {node}
            </a>
          )
        }
        return <span key={i}>{node}</span>
      })}
    </>
  )
}

export function NotionBlocks({ blocks }: { blocks: NotionBlock[] }) {
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]!

    // Group consecutive list items into a single <ul>/<ol>
    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const type = block.type
      const items: NotionBlock[] = []
      while (i < blocks.length && blocks[i]!.type === type) {
        items.push(blocks[i]!)
        i++
      }
      const Tag = type === 'bulleted_list_item' ? 'ul' : 'ol'
      elements.push(
        <Tag key={block.id} style={{ margin: '0 0 12px', paddingLeft: 22 }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 4 }}>
              <RichText segments={item.richText} />
            </li>
          ))}
        </Tag>
      )
      continue
    }

    switch (block.type) {
      case 'paragraph':
        if (block.richText.length > 0) {
          elements.push(
            <p key={block.id} style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              <RichText segments={block.richText} />
            </p>
          )
        }
        break
      case 'heading_1':
        elements.push(
          <h2 key={block.id} style={{ margin: '28px 0 12px', fontSize: 22, fontWeight: 700 }}>
            <RichText segments={block.richText} />
          </h2>
        )
        break
      case 'heading_2':
        elements.push(
          <h3 key={block.id} style={{ margin: '24px 0 10px', fontSize: 18, fontWeight: 700 }}>
            <RichText segments={block.richText} />
          </h3>
        )
        break
      case 'heading_3':
        elements.push(
          <h4 key={block.id} style={{ margin: '20px 0 8px', fontSize: 15, fontWeight: 700 }}>
            <RichText segments={block.richText} />
          </h4>
        )
        break
      case 'quote':
        elements.push(
          <blockquote
            key={block.id}
            style={{
              margin: '0 0 16px',
              padding: '4px 0 4px 18px',
              borderLeft: '3px solid #ff3246',
              fontStyle: 'italic'
            }}
          >
            <RichText segments={block.richText} />
          </blockquote>
        )
        break
      case 'divider':
        elements.push(
          <hr key={block.id} style={{ border: 'none', borderTop: '1px solid #e7e3d2', margin: '24px 0' }} />
        )
        break
      case 'image':
        if (block.imageUrl) {
          elements.push(
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={block.id}
              src={block.imageUrl}
              alt=""
              style={{ width: '100%', borderRadius: 10, margin: '12px 0 20px', display: 'block' }}
            />
          )
        }
        break
      default:
        // Unsupported block type (callout, embed, table, etc.) - skip rather than
        // render something broken. Common types are covered above.
        break
    }

    i++
  }

  return <>{elements}</>
}
