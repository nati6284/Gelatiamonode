import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Upload, Link as LinkIcon, LogOut, Lock, QrCode, DollarSign, ChevronLeft, Tag, Eye, EyeOff, X } from 'lucide-react'
import { api } from '../api'
import { CATEGORY_ORDER } from '../data'
import { QRPrintCard } from '../pages/QRPage'

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const data = await api.adminLogin({ username, password }); onLogin(data.token) }
    catch (err) { setError(err.message || 'Invalid credentials') }
    finally { setLoading(false) }
  }
  return (
    <>
      <section className="page-banner">
        <span className="eyebrow">ADMIN PANEL</span>
        <h1>Admin Login</h1>
        <p>Sign in to manage your content.</p>
      </section>
      <section className="section" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field"><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus /></div>
            <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {error && <p style={{ color: '#e53e3e', margin: 0 }}>{error}</p>}
            <button type="submit" className="button" disabled={loading}><Lock size={16} /> {loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>
      </section>
    </>
  )
}

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '')
  const [activeTab, setActiveTab] = useState('menu')
  const [menuItems, setMenuItems] = useState([])
  const [branches, setBranches] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [imageMode, setImageMode] = useState('url')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuCatFilter, setMenuCatFilter] = useState('')

  const [pricingBranch, setPricingBranch] = useState(null)
  const [branchMenuItems, setBranchMenuItems] = useState([])
  const [priceEdits, setPriceEdits] = useState({})
  const [savingPrice, setSavingPrice] = useState(null)
  const [branchImageMode, setBranchImageMode] = useState({})
  const [priceCatFilter, setPriceCatFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addCatFilter, setAddCatFilter] = useState('')
  const [addSearch, setAddSearch] = useState('')

  const handleLogin = (t) => {
    sessionStorage.setItem('adminToken', t); setToken(t)
    window.dispatchEvent(new Event('adminAuthChange'))
  }
  const handleLogout = async () => {
    try { await api.adminLogout(token) } catch {}
    sessionStorage.removeItem('adminToken'); setToken('')
    window.dispatchEvent(new Event('adminAuthChange'))
  }

  const categoryOrder = useMemo(
    () => categories.length > 0 ? categories.map(c => c.name) : CATEGORY_ORDER,
    [categories]
  )

  useEffect(() => {
    if (!token) return
    if (activeTab !== 'branches') setPricingBranch(null)
    if (activeTab === 'menu') loadMenu()
    else if (activeTab === 'categories') loadCategories()
    else loadBranches()
  }, [token, activeTab])

  useEffect(() => { if (token) { loadCategories(); loadMenu() } }, [token])

  const loadMenu = async () => {
    try { const data = await api.adminMenu(token); setMenuItems(Array.isArray(data) ? data : []) } catch (err) { console.error(err) }
  }
  const loadBranches = async () => {
    setLoading(true); setError('')
    try { const data = await api.adminBranches(token); setBranches(Array.isArray(data) ? data : []) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  const loadCategories = async () => {
    try { const data = await api.adminCategories(token); setCategories(Array.isArray(data) ? data : []) } catch (err) { console.error(err) }
  }

  const openBranchMenu = async (branch) => {
    setPricingBranch(branch); setPriceEdits({}); setPriceCatFilter(''); setBranchImageMode({})
    await refreshBranchMenu(branch)
  }
  const refreshBranchMenu = async (branch) => {
    try {
      const data = await api.getBranchMenu(branch.id, token)
      const validData = Array.isArray(data) ? data.filter(p => p.menuItem != null) : []
      setBranchMenuItems(validData)
      const edits = {}
      validData.forEach(p => { edits[p.menuItem.id] = { price: p.price, available: p.available, branchImage: p.branchImage || '' } })
      setPriceEdits(edits)
    } catch (err) { alert(err.message) }
  }
  const closeBranchMenu = () => { setPricingBranch(null); setBranchMenuItems([]) }

  const savePrice = async (menuItemId) => {
    setSavingPrice(menuItemId)
    try { await api.updateBranchMenuItem(pricingBranch.id, menuItemId, priceEdits[menuItemId], token) }
    catch (err) { alert(err.message) }
    finally { setSavingPrice(null) }
  }
  const removeFromBranch = async (menuItemId) => {
    if (!window.confirm('Remove this item from the branch menu?')) return
    try {
      await api.removeItemFromBranch(pricingBranch.id, menuItemId, token)
      setBranchMenuItems(prev => prev.filter(p => p.menuItem.id !== menuItemId))
      setPriceEdits(prev => { const n = {...prev}; delete n[menuItemId]; return n })
    } catch (err) { alert(err.message) }
  }
  const addItemsToBranch = async (selectedIds) => {
    const assignedIds = new Set(branchMenuItems.map(p => p.menuItem.id))
    for (const id of selectedIds.filter(id => !assignedIds.has(id))) {
      try { await api.addItemToBranch(pricingBranch.id, id, {}, token) }
      catch (err) { if (!err.message.includes('409') && !err.message.includes('already')) alert(err.message) }
    }
    await refreshBranchMenu(pricingBranch)
    setShowAddModal(false)
  }
  const handleBranchImageUpload = (e, mid) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Image too large.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onloadend = () => setPriceEdits(prev => ({ ...prev, [mid]: { ...prev[mid], branchImage: reader.result } }))
    reader.readAsDataURL(file)
  }

  const handleAddMenu = () => { setEditingItem({ name: '', description: '', category: '', price: '', image: '', available: true, popular: false }); setImageMode('url'); setShowModal(true) }
  const handleEditMenu = (item) => { setEditingItem({ ...item }); setImageMode('url'); setShowModal(true) }
  const handleDeleteMenu = async (id) => {
    if (!window.confirm('Delete this menu item from the catalog? It will also be removed from all branch menus.')) return
    try { await api.deleteMenuItem(id, token); setMenuItems(menuItems.filter(i => i.id !== id)) }
    catch (err) { alert(err.message) }
  }
  const handleSaveMenu = async (e) => {
    e.preventDefault()
    try {
      if (editingItem.id) {
        const updated = await api.updateMenuItem(editingItem.id, editingItem, token)
        setMenuItems(menuItems.map(i => i.id === updated.id ? updated : i))
      } else {
        const created = await api.createMenuItem(editingItem, token)
        setMenuItems([...menuItems, created])
      }
      setShowModal(false); setEditingItem(null)
    } catch (err) { alert(err.message) }
  }
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Image too large.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onloadend = () => setEditingItem({ ...editingItem, image: reader.result })
    reader.readAsDataURL(file)
  }

  const handleAddCategory = () => { setEditingItem({ name: '', displayOrder: categories.length }); setShowModal(true) }
  const handleEditCategory = (cat) => { setEditingItem({ ...cat }); setShowModal(true) }
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try { await api.deleteCategory(id, token); setCategories(categories.filter(c => c.id !== id)) }
    catch (err) { alert(err.message) }
  }
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingItem.id) {
        const updated = await api.updateCategory(editingItem.id, editingItem, token)
        setCategories(categories.map(c => c.id === updated.id ? updated : c))
      } else {
        const created = await api.createCategory(editingItem, token)
        setCategories([...categories, created])
      }
      setShowModal(false); setEditingItem(null)
    } catch (err) { alert(err.message) }
  }

  const handleAddBranch = () => { setEditingItem({ name: '', address: '', phone: '', code: '', mapUrl: '', active: true }); setShowModal(true) }
  const handleEditBranch = (branch) => { setEditingItem({ ...branch }); setShowModal(true) }
  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch?')) return
    try { await api.deleteBranch(id, token); setBranches(branches.filter(b => b.id !== id)) }
    catch (err) { alert(err.message) }
  }
  const handleSaveBranch = async (e) => {
    e.preventDefault()
    try {
      if (editingItem.id) {
        const updated = await api.updateBranch(editingItem.id, editingItem, token)
        setBranches(branches.map(b => b.id === updated.id ? updated : b))
      } else {
        const created = await api.createBranch(editingItem, token)
        setBranches([...branches, created])
      }
      setShowModal(false); setEditingItem(null)
    } catch (err) { alert(err.message) }
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  const assignedIds = new Set(branchMenuItems.map(p => p.menuItem.id))
  const unassignedItems = menuItems.filter(i => !assignedIds.has(i.id))
  const filteredUnassigned = unassignedItems.filter(i => {
    const matchCat = addCatFilter === '' || i.category === addCatFilter
    const matchSearch = addSearch === '' || (i.name + ' ' + i.description).toLowerCase().includes(addSearch.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <section className="page-banner">
        <span className="eyebrow">ADMIN PANEL</span>
        <h1>Manage Your Content</h1>
        <p>Add, edit, or remove menu items, categories and branch locations.</p>
      </section>
      <section className="section admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="admin-tabs" style={{ margin: 0 }}>
            <button className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}>Menu Catalog</button>
            <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}><Tag size={14} /> Categories</button>
            <button className={activeTab === 'branches' ? 'active' : ''} onClick={() => setActiveTab('branches')}>Branches</button>
            <button className={activeTab === 'qr' ? 'active' : ''} onClick={() => setActiveTab('qr')}><QrCode size={14} /> QR Codes</button>
          </div>
          <button className="button button-outline-dark" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
        {error && <p style={{ color: '#e53e3e' }}>{error}</p>}

        {activeTab === 'menu' && (
          <div className="admin-content">
            <div className="admin-heading">
              <h2>Menu Catalog</h2>
              <button className="button" onClick={handleAddMenu}><Plus size={16} /> Add Item</button>
            </div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
              The global catalog. Add items here, then assign them to branches individually.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button className={menuCatFilter === '' ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setMenuCatFilter('')}>All</button>
              {categoryOrder.filter(cat => menuItems.some(i => i.category === cat)).map(cat => (
                <button key={cat} className={menuCatFilter === cat ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setMenuCatFilter(cat)}>{cat}</button>
              ))}
            </div>
            <div className="admin-list">
              {menuItems.length === 0 ? <p className="empty-state">No menu items yet.</p> :
               menuItems.filter(item => menuCatFilter === '' || item.category === menuCatFilter).map(item => (
                <div key={item.id} className="admin-row">
                  <div className="admin-item-content">
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.category} • ETB {item.price}</p>
                      <small>{item.description}</small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button button-small" onClick={() => handleEditMenu(item)}><Edit size={14} /> Edit</button>
                    <button className="danger-button" onClick={() => handleDeleteMenu(item.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="admin-content">
            <div className="admin-heading">
              <h2>Category Management</h2>
              <button className="button" onClick={handleAddCategory}><Plus size={16} /> Add Category</button>
            </div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Categories group menu items. Display order controls the tab order on the menu page.
            </p>
            <div className="admin-list">
              {categories.length === 0 ? <p className="empty-state">No categories yet.</p> :
               [...categories].sort((a,b) => a.displayOrder - b.displayOrder).map(cat => (
                <div key={cat.id} className="admin-row">
                  <div>
                    <strong>{cat.name}</strong>
                    <p style={{ color: '#888', fontSize: '13px' }}>Display order: {cat.displayOrder}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button button-small" onClick={() => handleEditCategory(cat)}><Edit size={14} /> Edit</button>
                    <button className="danger-button" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="admin-content">
            {pricingBranch ? (
              <BranchMenuPanel
                branch={pricingBranch}
                branchMenuItems={branchMenuItems}
                priceEdits={priceEdits}
                setPriceEdits={setPriceEdits}
                savingPrice={savingPrice}
                branchImageMode={branchImageMode}
                setBranchImageMode={setBranchImageMode}
                priceCatFilter={priceCatFilter}
                setPriceCatFilter={setPriceCatFilter}
                categoryOrder={categoryOrder}
                onSavePrice={savePrice}
                onRemove={removeFromBranch}
                onBack={closeBranchMenu}
                onOpenAddModal={() => { setAddCatFilter(''); setAddSearch(''); setShowAddModal(true) }}
                onBranchImageUpload={handleBranchImageUpload}
              />
            ) : (
              <>
                <div className="admin-heading">
                  <h2>Branch Management</h2>
                  <button className="button" onClick={handleAddBranch}><Plus size={16} /> Add Branch</button>
                </div>
                <div className="admin-list">
                  {loading ? <p className="empty-state">Loading…</p> :
                   branches.length === 0 ? <p className="empty-state">No branches yet.</p> :
                   branches.map(branch => (
                    <div key={branch.id} className="admin-row">
                      <div>
                        <strong>{branch.name}</strong>
                        <p>{branch.address}</p>
                        <small>{branch.phone}{branch.openingHours ? ` · ${branch.openingHours}` : ''}</small>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="button button-small" onClick={() => openBranchMenu(branch)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={14}/> Menu
                        </button>
                        <button className="button button-small" onClick={() => handleEditBranch(branch)}><Edit size={14}/> Edit</button>
                        <button className="danger-button" onClick={() => handleDeleteBranch(branch.id)}><Trash2 size={14}/> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="admin-content">
            <div className="admin-heading"><h2>QR Codes</h2></div>
            {loading ? <p className="empty-state">Loading…</p> :
             branches.filter(b => b.active).length === 0 ? <p className="empty-state">No active branches.</p> : (
              <div className="qr-print-grid">
                {branches.filter(b => b.active).map(branch => <QRPrintCard key={branch.id} branch={branch}/>)}
              </div>
            )}
          </div>
        )}
      </section>

      {showAddModal && pricingBranch && (
        <AddItemsToBranchModal
          branchName={pricingBranch.name}
          items={filteredUnassigned}
          allItems={unassignedItems}
          categoryOrder={categoryOrder}
          addCatFilter={addCatFilter}
          setAddCatFilter={setAddCatFilter}
          addSearch={addSearch}
          setAddSearch={setAddSearch}
          onClose={() => setShowAddModal(false)}
          onAdd={addItemsToBranch}
        />
      )}

      {showModal && editingItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-side admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-section">
              <h2 className="modal-title">
                {editingItem.id ? 'Edit' : 'Add'} {activeTab === 'menu' ? 'Menu Item' : activeTab === 'categories' ? 'Category' : 'Branch'}
              </h2>
            </div>
            <div className="modal-body">
              {activeTab === 'menu' && (
                <form onSubmit={handleSaveMenu}>
                  <div className="field"><label>Item Name *</label><input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} required /></div>
                  <div className="field"><label>Description</label><textarea value={editingItem.description} rows="3" onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} /></div>
                  <div className="form-row">
                    <div className="field">
                      <label>Category *</label>
                      <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} required>
                        <option value="">Select Category</option>
                        {categories.length > 0
                          ? [...categories].sort((a,b) => a.displayOrder - b.displayOrder).map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                          : CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Price (ETB) *</label><input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} required /></div>
                  </div>
                  <div className="field">
                    <label>Image</label>
                    <div className="image-mode-toggle">
                      <button type="button" className={imageMode === 'url' ? 'active' : ''} onClick={() => setImageMode('url')}><LinkIcon size={16}/> URL</button>
                      <button type="button" className={imageMode === 'upload' ? 'active' : ''} onClick={() => setImageMode('upload')}><Upload size={16}/> Upload</button>
                    </div>
                    {imageMode === 'url'
                      ? <input type="url" placeholder="https://example.com/image.jpg" value={editingItem.image} onChange={e => setEditingItem({ ...editingItem, image: e.target.value })} />
                      : <div className="file-upload"><input type="file" accept="image/*" onChange={handleImageUpload} id="imageUpload"/><label htmlFor="imageUpload" className="file-upload-label"><Upload size={20}/><span>Choose image file</span></label></div>}
                    {editingItem.image && <div className="image-preview"><img src={editingItem.image} alt="Preview"/></div>}
                  </div>
                  <div className="field" style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={editingItem.available} onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })}/> Available</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={editingItem.popular || false} onChange={e => setEditingItem({ ...editingItem, popular: e.target.checked })}/> Popular</label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="button">Save Item</button>
                    <button type="button" className="button button-outline-dark" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              )}
              {activeTab === 'categories' && (
                <form onSubmit={handleSaveCategory}>
                  <div className="field"><label>Category Name *</label><input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} required /></div>
                  <div className="field">
                    <label>Display Order</label>
                    <input type="number" min="0" value={editingItem.displayOrder} onChange={e => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) || 0 })} />
                    <small style={{ color: '#888', fontSize: '12px' }}>Lower number = appears first on menu page</small>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="button">Save Category</button>
                    <button type="button" className="button button-outline-dark" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              )}
              {activeTab === 'branches' && (
                <form onSubmit={handleSaveBranch}>
                  <div className="field"><label>Branch Name *</label><input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} required /></div>
                  <div className="field"><label>Branch Code *</label><input type="text" placeholder="e.g. BOLE" value={editingItem.code || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} required /></div>
                  <div className="field"><label>Address *</label><textarea value={editingItem.address} rows="2" onChange={e => setEditingItem({ ...editingItem, address: e.target.value })} required /></div>
                  <div className="field"><label>Phone</label><input type="tel" value={editingItem.phone || ''} onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })} /></div>
                  <div className="field"><label>Google Maps URL</label><input type="url" placeholder="https://maps.app.goo.gl/…" value={editingItem.mapUrl || ''} onChange={e => setEditingItem({ ...editingItem, mapUrl: e.target.value })} /></div>
                  <div className="field"><label>Opening Hours</label><input type="text" placeholder="e.g. Every day · 8:00 AM – 10:00 PM" value={editingItem.openingHours || ''} onChange={e => setEditingItem({ ...editingItem, openingHours: e.target.value })} /></div>
                  <div className="field"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={editingItem.active} onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}/> Active</label></div>
                  <div className="form-actions">
                    <button type="submit" className="button">Save Branch</button>
                    <button type="button" className="button button-outline-dark" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BranchMenuPanel({
  branch, branchMenuItems, priceEdits, setPriceEdits, savingPrice,
  branchImageMode, setBranchImageMode, priceCatFilter, setPriceCatFilter,
  categoryOrder, onSavePrice, onRemove, onBack, onOpenAddModal, onBranchImageUpload
}) {
  const grouped = useMemo(() => {
    const g = {}
    branchMenuItems.forEach(p => { const cat = p.menuItem.category; if (!g[cat]) g[cat] = []; g[cat].push(p) })
    return g
  }, [branchMenuItems])

  const sortedCats = useMemo(() => Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a), bi = categoryOrder.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1; if (bi === -1) return -1; return ai - bi
  }), [grouped, categoryOrder])

  return (
    <>
      <div className="admin-heading">
        <button className="button button-outline-dark" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={16} /> Back to Branches
        </button>
        <h2 style={{ margin: 0 }}>Menu — {branch.name}</h2>
        <button className="button" onClick={onOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16}/> Add Items
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
        {branchMenuItems.length} item{branchMenuItems.length !== 1 ? 's' : ''} in this branch. Each can have its own price, availability, and image.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button className={priceCatFilter === '' ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setPriceCatFilter('')}>All</button>
        {sortedCats.map(cat => (
          <button key={cat} className={priceCatFilter === cat ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setPriceCatFilter(cat)}>{cat}</button>
        ))}
      </div>
      {branchMenuItems.length === 0 && <p className="empty-state">No items yet. Click "Add Items" to assign items from the catalog.</p>}
      {sortedCats.filter(cat => priceCatFilter === '' || cat === priceCatFilter).map(category => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px' }}>{category}</h3>
          {grouped[category].map(p => {
            const mid = p.menuItem.id
            const edit = priceEdits[mid] || { price: p.price, available: p.available, branchImage: p.branchImage || '' }
            const imgMode = branchImageMode[mid] || 'url'
            const effectiveImg = edit.branchImage || p.menuItem.image
            return (
              <div key={mid} className="admin-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {effectiveImg && <img src={effectiveImg} alt={p.menuItem.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <strong>{p.menuItem.name}</strong>
                    <small style={{ marginLeft: '8px', color: '#888' }}>catalog: ETB {p.menuItem.price}</small>
                    {edit.branchImage && <small style={{ marginLeft: '8px', color: '#4a9654' }}>branch image set</small>}
                  </div>
                  <button
                    className={edit.available ? 'button button-small' : 'button button-small button-outline-dark'}
                    onClick={() => setPriceEdits(prev => ({ ...prev, [mid]: { ...prev[mid], available: !edit.available } }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {edit.available ? <Eye size={14}/> : <EyeOff size={14}/>} {edit.available ? 'On' : 'Off'}
                  </button>
                  <span style={{ color: '#888', fontSize: '13px' }}>ETB</span>
                  <input type="number" step="0.01" min="0" value={edit.price ?? p.price}
                    onChange={e => setPriceEdits(prev => ({ ...prev, [mid]: { ...prev[mid], price: parseFloat(e.target.value) } }))}
                    style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px' }}/>
                  <button className="button button-small" onClick={() => onSavePrice(mid)} disabled={savingPrice === mid}>{savingPrice === mid ? '…' : 'Save'}</button>
                  <button className="danger-button" onClick={() => onRemove(mid)} title="Remove from branch"><Trash2 size={14}/></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>Branch image:</span>
                  <div className="image-mode-toggle" style={{ margin: 0 }}>
                    <button type="button" className={imgMode === 'url' ? 'active' : ''} onClick={() => setBranchImageMode(prev => ({...prev, [mid]: 'url'}))}><LinkIcon size={14}/> URL</button>
                    <button type="button" className={imgMode === 'upload' ? 'active' : ''} onClick={() => setBranchImageMode(prev => ({...prev, [mid]: 'upload'}))}><Upload size={14}/> Upload</button>
                  </div>
                  {imgMode === 'url' ? (
                    <input type="url" placeholder="https://… or leave blank to use catalog image"
                      value={edit.branchImage}
                      onChange={e => setPriceEdits(prev => ({ ...prev, [mid]: { ...prev[mid], branchImage: e.target.value } }))}
                      style={{ flex: 1, minWidth: '200px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}/>
                  ) : (
                    <div className="file-upload" style={{ margin: 0 }}>
                      <input type="file" accept="image/*" onChange={e => onBranchImageUpload(e, mid)} id={`bimg-${mid}`}/>
                      <label htmlFor={`bimg-${mid}`} className="file-upload-label"><Upload size={16}/><span>Choose image</span></label>
                    </div>
                  )}
                  {edit.branchImage && (
                    <button className="danger-button" style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => setPriceEdits(prev => ({ ...prev, [mid]: { ...prev[mid], branchImage: '' } }))}>Clear</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

function AddItemsToBranchModal({
  branchName, items, allItems, categoryOrder,
  addCatFilter, setAddCatFilter, addSearch, setAddSearch,
  onClose, onAdd
}) {
  const [selected, setSelected] = useState(new Set())
  const toggle = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const cats = useMemo(() => {
    const s = new Set(allItems.map(i => i.category))
    return categoryOrder.filter(c => s.has(c))
  }, [allItems, categoryOrder])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-side admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title">Add Items to {branchName}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        <div className="modal-body">
          <input className="search-input" placeholder="Search items…" value={addSearch} onChange={e => setAddSearch(e.target.value)} style={{ width: '100%', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button className={addCatFilter === '' ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setAddCatFilter('')}>All</button>
            {cats.map(cat => (
              <button key={cat} className={addCatFilter === cat ? 'button button-small' : 'button button-small button-outline-dark'} onClick={() => setAddCatFilter(cat)}>{cat}</button>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="empty-state">All catalog items are already in this branch menu.</p>
          ) : (
            <div className="admin-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {items.map(item => (
                <div key={item.id} className="admin-row" style={{ cursor: 'pointer' }} onClick={() => toggle(item.id)}>
                  <div className="admin-item-content">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} onClick={e => e.stopPropagation()}/>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}/>}
                    <div>
                      <strong>{item.name}</strong>
                      <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{item.category} • ETB {item.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button className="button" disabled={selected.size === 0} onClick={() => onAdd([...selected])}>
              Add {selected.size > 0 ? `(${selected.size})` : ''} Selected
            </button>
            <button className="button button-outline-dark" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
