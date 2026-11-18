import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import MenuCard from '../components/MenuCard'
import PrintableMenu from '../components/PrintableMenu'
import { CATEGORY_ORDER } from '../data'

export default function MenuPage({items, onSelectItem, selectedBranch, categories}) {
  const {t}=useI18n();
  const [activeCategory,setActiveCategory]=useState('');
  const [search,setSearch]=useState('')
  const [printView,setPrintView]=useState(false)
  const isAdmin = !!sessionStorage.getItem('adminToken')

  // Build ordered category list: use API categories if available, fall back to CATEGORY_ORDER
  const categoryOrder = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0)
      return categories.map(c => c.name)
    return CATEGORY_ORDER
  }, [categories])
  
  // Group items by category
  const groupedByCategory = useMemo(() => {
    const groups = {}
    ;(Array.isArray(items) ? items : []).forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])
  
  const categories_sorted = useMemo(() => {
    const keys = Object.keys(groupedByCategory)
    return keys.sort((a, b) => {
      const ai = categoryOrder.indexOf(a)
      const bi = categoryOrder.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [groupedByCategory, categoryOrder])
  
  // Scroll to category
  const scrollToCategory = (cat) => {
    const element = document.getElementById(`category-${cat}`)
    if (element) {
      const offset = 200 // offset for sticky header + category nav
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }
  
  useEffect(() => {
    if (!categories_sorted.length) return
    
    const handleScroll = () => {
      const isMobile = window.innerWidth <= 780
      const offset = isMobile ? 150 : 250
      const scrollPosition = window.scrollY + offset
      
      let currentCategory = categories_sorted[0]
      
      for (const cat of categories_sorted) {
        const element = document.getElementById(`category-${cat}`)
        if (element) {
          const elementTop = element.offsetTop
          const viewThreshold = isMobile ? 50 : 100
          if (scrollPosition >= elementTop - viewThreshold) currentCategory = cat
        }
      }
      
      setActiveCategory(currentCategory)
      
      const activeButton = document.querySelector('.category-nav-sticky button.active')
      const navContainer = document.querySelector('.category-nav-sticky')
      
      if (activeButton && navContainer) {
        const buttonLeft = activeButton.offsetLeft
        const buttonWidth = activeButton.offsetWidth
        const containerWidth = navContainer.offsetWidth
        const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2)
        navContainer.scrollTo({ left: targetScroll, behavior: 'smooth' })
      }
    }
    
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [categories_sorted, activeCategory])
  
  const filtered = search ? (Array.isArray(items) ? items : []).filter(x=>(x.name+' '+x.description).toLowerCase().includes(search.toLowerCase())&&x.available!==false) : (Array.isArray(items) ? items : [])
  
  return <>
    <section
      className="page-banner page-banner--menu-bg no-print"
      style={selectedBranch?.interior_image ? { backgroundImage: `url(${selectedBranch.interior_image})` } : {}}
    >
      <span className="eyebrow">FRESH FROM OUR KITCHEN</span>
      {selectedBranch && (
        <p className="branch-welcome">Welcome to {selectedBranch.name}</p>
      )}
      <h1>{t('menuTitle')}</h1>
      <p>{t('menuSub')}</p>
    </section>
    <section className="section menu-page">

      {printView && isAdmin ? (
        <>
          <button className="print-back-btn no-print" onClick={()=>setPrintView(false)}>
            ← Back to Menu
          </button>
          <PrintableMenu items={items} branch={selectedBranch} categories={categories}/>
        </>
      ) : (
        <>
          {/* Toolbar */}
          <div className="menu-tools-search">
            {isAdmin && (
              <button className="print-trigger-btn" onClick={()=>setPrintView(true)}>
                🖨 Print Menu
              </button>
            )}
            <input className="search-input" placeholder="Search menu..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Category Navigation */}
          <div className="category-nav-sticky">
            {categories_sorted.map(cat=>
              <button
                className={activeCategory===cat?'active':''}
                key={cat}
                onClick={()=>scrollToCategory(cat)}
              >
                {t(`categories.${cat}`)===`categories.${cat}`?cat:t(`categories.${cat}`)}
              </button>
            )}
          </div>

          {search ? (
            filtered.length ?
              <div className="menu-grid">{filtered.map(item=><MenuCard key={item.id} item={item} onClick={onSelectItem}/>)}</div> :
              <p className="empty-state">No menu items found.</p>
          ) : (
            <div className="menu-by-category">
              {categories_sorted.map(cat => (
                <div key={cat} id={`category-${cat}`} className="category-section">
                  <h2 className="category-title">{t(`categories.${cat}`)===`categories.${cat}`?cat:t(`categories.${cat}`)}</h2>
                  <div className="menu-grid">
                    {groupedByCategory[cat].map(item=><MenuCard key={item.id} item={item} onClick={onSelectItem}/>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  </>
}
