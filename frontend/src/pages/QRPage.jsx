import { useEffect, useState } from 'react'
import { cafeConfig } from '../config'
import { api } from '../api'

export function QRPrintCard({ branch }) {
  const menuUrl = `${window.location.origin}/menu?branch=${branch.code}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`
  const logoSrc = `${window.location.origin}/logo.png`

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=800,height=1100')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${branch.name} — QR Code</title>
      <style>
        @page { size: A4; margin: 0 }
        * { margin: 0; padding: 0; box-sizing: border-box }
        body {
          font-family: 'Playfair Display',serif;
          background: #fff;
          color: #1a1a1a;
          width: 210mm;
          min-height: 297mm;
          padding: 52px 60px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 36px;
        }
        .header img.logo {
          height: 80px;
          width: auto;
          object-fit: contain;
        }
        .brand h1 {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: 2px;
          line-height: 1;
          color: #009246;
        }
        .brand p {
          font-size: 15px;
          color: #555;
          margin-top: 6px;
          font-weight: 400;
        }
        hr {
          border: none;
          border-top: 2.5px solid #009246;
          margin: 0 auto 70px;
          width: 380px;
        }
        .scan-title {
          font-size: 34px;
          font-weight: 700;
          color: #009246;
          text-align: center;
          margin-bottom: 12px;
        }
        .branch-name {
          font-size: 15px;
          color: #131212ff;
          text-align: center;
          font-style: bold;
          margin-bottom: 28px;
        }
        .qr-box {
          border: 2.5px solid #009246;
          border-radius: 20px;
          padding: 36px;
          background: #fff;
          width: 380px;
          margin: 0 auto 32px;
        }
        .qr-box img {
          display: block;
          width: 100%;
          height: auto;
        }
        .hint {
          font-size: 13px;
          color: #777;
          text-align: center;
          line-height: 1.6;
        }
      </style>
    </head><body>
      <div class="header">
        <img class="logo" src="${logoSrc}" alt="logo" />
        <div class="brand">
          <h1>${cafeConfig.name}</h1>
          <p>${cafeConfig.tagline}</p>
        </div>
      </div>
      <hr/>
      <p class="scan-title">Scan for Our Digital Menu</p>
      <p class="branch-name">${branch.name}</p>
      <div class="qr-box">
        <img id="qr" src="${qrSrc}" alt="QR Code" />
      </div>
      <p class="hint">Point your camera at the QR code to view our complete menu</p>
      <script>
        var qr = document.getElementById('qr');
        var logo = document.querySelector('.logo');
        var loaded = 0;
        function tryPrint() { loaded++; if (loaded >= 2) { window.focus(); window.print(); window.close(); } }
        qr.onload = tryPrint; qr.onerror = tryPrint;
        logo.onload = tryPrint; logo.onerror = tryPrint;
        if (qr.complete) tryPrint();
        if (logo.complete) tryPrint();
      </script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="qr-print-card">
      <div className="qr-print-preview">
        <div className="qr-print-header">
          <img src="/logo.png" alt="logo" className="qr-print-logo" />
          <div>
            <strong>{cafeConfig.name}</strong>
            <span>{cafeConfig.tagline}</span>
          </div>
        </div>
        {/* <div className="qr-print-divider" /> */}
        <p className="qr-print-title">Scan for Our Digital Menu</p>
        <p className="qr-print-branch">{branch.name}</p>
        <div className="qr-print-box">
          <img src={qrSrc} alt={`QR for ${branch.name}`} />
        </div>
        <p className="qr-print-hint">Point your camera at the QR code to view our complete menu</p>
      </div>

      <button className="button" onClick={handlePrint}>
        Print QR — {branch.name}
      </button>
    </div>
  )
}

export default function QRPage() {
  const [branches, setBranches] = useState([])

  useEffect(() => {
    api.branches().then(data => setBranches(Array.isArray(data) ? data : [])).catch(console.error)
  }, [])

  return <>
    <section className="page-banner">
      <span className="eyebrow eyebrow-dark">DIGITAL MENU</span>
      <h1>Branch QR Codes</h1>
      <p>Printable QR codes for each branch location</p>
    </section>

    <section className="section">
      <div className="qr-print-grid">
        {branches.filter(b => b.active).map(branch => (
          <QRPrintCard key={branch.id} branch={branch} />
        ))}
        {branches.length === 0 && (
          <p className="empty-state">No branches available.</p>
        )}
      </div>
    </section>
  </>
}
