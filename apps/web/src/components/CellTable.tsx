import React from 'react'
import type { Cell, CellMap } from '@autolaskin/domain'

interface Props {
  cells: CellMap
  computed: CellMap
  onValueChange?: (id: string, value: number | undefined) => void
}

function fmt(value: number | undefined): string {
  if (value === undefined) return ''
  return value.toLocaleString('fi-FI', { maximumFractionDigits: 4 })
}

function CellRow({ cell, computed, onValueChange }: {
  cell: Cell
  computed: Cell | undefined
  onValueChange?: (id: string, value: number | undefined) => void
}) {
  const isComputed = !!cell.formula
  const result = computed?.result
  const error = computed?.error

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim()
    if (v === '') {
      onValueChange?.(cell.id, undefined)
    } else {
      const num = parseFloat(v.replace(',', '.'))
      if (!isNaN(num)) onValueChange?.(cell.id, num)
    }
  }

  return (
    <tr>
      <td style={{ fontFamily: 'monospace', color: '#555' }}>{cell.id}</td>
      <td>{cell.label}</td>
      <td style={{ textAlign: 'right' }}>
        {cell.defaultValue !== undefined ? fmt(cell.defaultValue) : ''}
      </td>
      <td>
        {!isComputed && onValueChange ? (
          <input
            type="number"
            step="any"
            defaultValue={cell.userValue ?? cell.defaultValue ?? ''}
            onChange={handleChange}
            style={{ width: '100px', textAlign: 'right' }}
          />
        ) : (
          cell.userValue !== undefined ? fmt(cell.userValue) : ''
        )}
      </td>
      <td>{cell.unit ?? ''}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '0.85em', color: '#444' }}>
        {cell.formula ?? ''}
      </td>
      <td style={{ textAlign: 'right', color: error ? 'red' : undefined }}>
        {error ? error : (result !== undefined ? fmt(result) : '')}
      </td>
    </tr>
  )
}

export default function CellTable({ cells, computed, onValueChange }: Props) {
  const rows = Object.values(cells)

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
      <thead>
        <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ccc' }}>
          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Tunniste</th>
          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Selite</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Oletusarvo</th>
          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Käyttäjän arvo</th>
          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Yksikkö</th>
          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Kaava</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Tulos</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((cell, i) => (
          <CellRow
            key={cell.id}
            cell={cell}
            computed={computed[cell.id]}
            onValueChange={onValueChange}
          />
        ))}
      </tbody>
    </table>
  )
}
