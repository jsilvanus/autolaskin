import React from 'react'
import { useCalculator } from '../store/calculatorStore.js'

function Row({ label, value, unit }: { label: string; value: number | undefined; unit?: string }) {
  const formatted = value !== undefined
    ? value.toLocaleString('fi-FI', { maximumFractionDigits: 2 })
    : '–'
  return (
    <tr>
      <td style={{ padding: '8px 12px' }}>{label}</td>
      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>{formatted}</td>
      <td style={{ padding: '8px 12px', color: '#666' }}>{unit ?? ''}</td>
    </tr>
  )
}

export default function Summary() {
  const { state } = useCalculator()
  const c = state.computed

  return (
    <div>
      <h2>Yhteenveto</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tunnusluku</th>
            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Arvo</th>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Yksikkö</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={3} style={{ padding: '8px 12px', background: '#e8f0fe', fontWeight: 'bold' }}>Nykyinen auto</td></tr>
          <Row label="Kokonaiskustannukset vuodessa" value={c['C13']?.result} unit="€/v" />
          <Row label="Kustannukset kuukaudessa" value={c['C14']?.result} unit="€/kk" />
          <Row label="Kustannukset per km" value={c['C15']?.result} unit="snt/km" />

          <tr><td colSpan={3} style={{ padding: '8px 12px', background: '#e8f0fe', fontWeight: 'bold' }}>Uusi auto</td></tr>
          <Row label="Kokonaiskustannukset vuodessa" value={c['N18']?.result} unit="€/v" />
          <Row label="Kustannukset kuukaudessa" value={c['N19']?.result} unit="€/kk" />
          <Row label="Kustannukset per km" value={c['N20']?.result} unit="snt/km" />

          <tr><td colSpan={3} style={{ padding: '8px 12px', background: '#e8f0fe', fontWeight: 'bold' }}>Säästöt</td></tr>
          <Row label="Kokonaiskustannusten säästö vuodessa" value={c['S2']?.result} unit="€/v" />
          <Row label="Kuukausittainen kokonaissäästö" value={c['S4']?.result} unit="€/kk" />

          <tr><td colSpan={3} style={{ padding: '8px 12px', background: '#e8f0fe', fontWeight: 'bold' }}>Rahoitus</td></tr>
          <Row label="Enimmäisrahoitus" value={c['F13']?.result} unit="€" />
          <Row label="Enimmäishankintahinta" value={c['F14']?.result} unit="€" />
        </tbody>
      </table>
    </div>
  )
}
