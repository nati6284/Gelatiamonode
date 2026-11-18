import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, MapPin, Phone, Clock } from 'lucide-react'
import { useI18n } from '../i18n'
import { cafeConfig } from '../config'
import { api } from '../api'

function TikTokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

export default function Footer() {
  const {t} = useI18n()
  const [branches, setBranches] = useState([])

  useEffect(() => {
    api.branches().then(data => setBranches(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Brand */}
        <div className="footer-col">
          <Link to="/" className="brand brand-light">
            <img src={cafeConfig.logo} alt="GELATIAMO" className="brand-logo"/>
          </Link>
          <p className="footer-tagline">{t('footer')}</p>
        </div>

        {/* Branches */}
        <div className="footer-col footer-col--branches">
          <h3>Our Branches</h3>
          {branches.length > 0 ? (
            <ul className="footer-branches">
              {branches.map(branch => (
                <li key={branch.id} className="footer-branch">
                  <span className="footer-branch-name">{branch.name}</span>
                  {branch.address && (
                    <span className="footer-branch-row">
                      <MapPin size={11} className="footer-branch-icon"/>
                      {branch.address}
                    </span>
                  )}
                  {branch.phone && (
                    <span className="footer-branch-row">
                      <Phone size={11} className="footer-branch-icon"/>
                      {branch.phone}
                    </span>
                  )}
                  <span className="footer-branch-row footer-branch-hours">
                    <Clock size={11} className="footer-branch-icon"/>
                    {branch.openingHours || cafeConfig.openingHours}
                  </span>
                  {branch.mapUrl && (
                    <a className="footer-branch-map" href={branch.mapUrl} target="_blank" rel="noreferrer">
                      Open map ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p><strong>Email:</strong> {cafeConfig.email}</p>
              <p><strong>Address:</strong> {cafeConfig.address}</p>
            </>
          )}
        </div>

        {/* Hours */}
        {/* <div className="footer-col">
          <h3>Hours</h3>
          <p>{cafeConfig.openingHours}</p>
          <p className="footer-note">Hours may vary by branch and on public holidays</p>
        </div> */}

        {/* Social */}
        <div className="footer-col">
          <h3>Follow Us</h3>
          <div className="social-links">
            <a href={cafeConfig.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram/>
            </a>
            <a href={cafeConfig.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook/>
            </a>
            <a href={cafeConfig.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
              <TikTokIcon/>
            </a>
          </div>
          <p className="footer-note" style={{marginTop:'15px'}}>
            Stay connected for updates and special offers
          </p>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {cafeConfig.name}. All rights reserved.</span>
      </div>
    </footer>
  )
}
