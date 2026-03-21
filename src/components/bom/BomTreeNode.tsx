import type { BomTreeNode as BomTreeNodeType } from '../../types'
import { itemsMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'

interface Props {
  node: BomTreeNodeType
  depth?: number
}

export function BomTreeNode({ node, depth = 0 }: Props) {
  const item = itemsMap.get(node.itemId)
  const hasChildren = node.children.length > 0
  const covered = node.quantityShort === 0

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2 rounded-lg transition-colors px-2"
        style={{ marginLeft: depth * 24 }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {depth > 0 && (
          <span className="text-white/10 text-xs flex-shrink-0" style={{ marginLeft: -12 }}>└</span>
        )}

        <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={24} />

        <span className="flex-1 font-body text-base text-ink truncate min-w-0">
          {item?.name ?? node.itemId}
        </span>

        {/* Quantities */}
        <div className="flex items-center gap-3 text-sm font-body flex-shrink-0">
          {node.quantityAvailable > 0 && (
            <span style={{ color: '#34d399' }}>+{node.quantityAvailable.toLocaleString()}</span>
          )}
          <span
            className="font-500"
            style={{ color: node.quantityShort > 0 ? '#fb7185' : '#34d399' }}
          >
            {node.quantityShort > 0
              ? `${node.quantityShort.toLocaleString()} needed`
              : '✓ covered'}
          </span>
          <span className="text-ink-muted">/{node.quantityNeeded.toLocaleString()}</span>
        </div>

        {hasChildren && (
          <span
            className="text-xs rounded px-1.5 py-0.5 font-body flex-shrink-0"
            style={{ background: 'rgba(230,168,23,0.1)', color: '#e6a817' }}
          >
            craftable
          </span>
        )}
      </div>

      {hasChildren && (
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: depth * 24 + 14 }}>
          {node.children.map((child, i) => (
            <BomTreeNode key={`${child.itemId}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
