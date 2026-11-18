import { useEffect, useState } from 'react'
import { ArrowRight, Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { useI18n } from '../i18n'
import { cafeConfig } from '../config'
import { api } from '../api'

export default function ContactPage({ selectedBranch }) {
  const {t}=useI18n()
  const [branches, setBranches] = useState([])
  const [activeBranch, setActiveBranch] = useState(selectedBranch)
  
  useEffect(() => {
    api.branches().then(data => setBranches(Array.isArray(data) ? data : [])).catch(console.error)
  }, [])
  
  useEffect(() => {
    if (selectedBranch) {
      setActiveBranch(selectedBranch)
    }
  }, [selectedBranch])
  
  return <>
    <section className="page-banner page-banner--bg">
      <span className="eyebrow">WE WOULD LOVE TO SEE YOU</span>
      <h1>{t('contactTitle')}</h1>
      <p>Questions, celebrations, or just saying hello — we're here.</p>
    </section>
    
    
    {/* Branch Details */}
    {activeBranch && (
      <>
        <section className="section contact-grid">
          <div className="contact-card">
            <span className="contact-icon"><MapPin/></span>
            <h2>{t('location')}</h2>
            <p><strong>{activeBranch.name}</strong></p>
            <p>{activeBranch.address}</p>
            {activeBranch.mapUrl && (
              <a className="text-link" href={activeBranch.mapUrl} target="_blank" rel="noreferrer">
                Open map <ArrowRight size={15}/>
              </a>
            )}
          </div>
          <div className="contact-card">
            <span className="contact-icon"><Phone/></span>
            <h2>Contact</h2>
            {activeBranch.phone && <p><strong>Phone:</strong><br/>{activeBranch.phone}</p>}
            {cafeConfig.email && <p><strong>Email:</strong><br/>{cafeConfig.email}</p>}
          </div>
          <div className="contact-card">
            <span className="contact-icon"><Clock/></span>
            <h2>{t('hours')}</h2>
            <p>{activeBranch.openingHours || cafeConfig.openingHours}</p>
            <p style={{fontSize: '14px', color: '#666'}}>Hours may vary on public holidays.</p>
          </div>
        </section>
        
        <section className="section" style={{textAlign: 'center', paddingTop: '20px'}}>
          <h2 style={{marginBottom: '20px'}}>Connect With Us</h2>
          <div style={{display:'flex',gap:'15px',justifyContent:'center',flexWrap:'wrap'}}>
            <a className="button button-small" href={cafeConfig.instagram} target="_blank" rel="noreferrer">
              <Instagram size={16} style={{marginRight: '8px'}} />
              Instagram
            </a>
            <a className="button button-small" href={cafeConfig.facebook} target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a className="button button-small" href={cafeConfig.tiktok} target="_blank" rel="noreferrer">
              TikTok
            </a>
          </div>
        </section>
      </>
    )}
    
    {!activeBranch && (
      <section className="map-placeholder">
        <MapPin size={30}/>
        <h2>Select a Branch</h2>
        <p>Choose a branch above to see location details, contact information, and directions.</p>
      </section>
    )}
  </>
}
