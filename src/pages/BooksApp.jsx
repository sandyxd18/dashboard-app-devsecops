import React, { useState, useEffect } from 'react';
import { bookApi } from '../services/api';

export default function BooksApp() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', price: '', stock: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [hoverBookId, setHoverBookId] = useState(null);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({ id: '', title: '', price: '', stock: '', description: '' });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await bookApi.get('/books');
      setBooks(res.data?.data?.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await bookApi.delete(`/books/${id}`);
      fetchBooks();
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('author', formData.author);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      if (formData.description) data.append('description', formData.description);
      if (imageFile) data.append('image', imageFile);

      await bookApi.post('/books', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({ title: '', author: '', price: '', stock: '', description: '' });
      setImageFile(null);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to create book");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = new FormData();
      if (updateData.price) data.append('price', updateData.price);
      if (updateData.stock) data.append('stock', updateData.stock);
      if (updateData.description !== undefined) data.append('description', updateData.description);

      await bookApi.put(`/books/${updateData.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUpdateModal(false);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to update book");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{marginBottom: '20px'}}>
        <h3>Book Management</h3>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search book title..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minWidth: '250px'}}
          />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Book</button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
              <tr key={b.id}>
                <td>
                  <img 
                    src={b.image_url || 'https://via.placeholder.com/50'} 
                    alt="cover" 
                    style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'}}
                    onClick={() => setPreviewImage(b.image_url || 'https://via.placeholder.com/500')}
                  />
                </td>
                <td style={{fontWeight: 500}}>
                  <span 
                    style={{cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline'}} 
                    onClick={() => {
                      setUpdateData({ id: b.id, title: b.title, price: b.price, stock: b.stock, description: b.description || '' });
                      setShowUpdateModal(true);
                    }}
                  >
                    {b.title}
                  </span>
                </td>
                <td>{b.author}</td>
                <td>{formatIDR(b.price)}</td>
                <td>{b.stock}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn" style={{backgroundColor: '#e5e7eb', color: 'black', fontSize: '12px', padding: '4px 8px'}} onClick={() => {
                      setUpdateData({ id: b.id, title: b.title, price: b.price, stock: b.stock, description: b.description || '' });
                      setShowUpdateModal(true);
                    }}>Update</button>
                    <button className="btn btn-danger" style={{fontSize: '12px', padding: '4px 8px'}} onClick={() => setDeleteConfirmId(b.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="6" style={{textAlign: 'center'}}>No books found.</td></tr>}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginBottom: '20px'}}>Add New Book</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input type="text" required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>
              <div className="form-group" style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label>Price (Rp)</label>
                  <input type="number" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                  <label>Stock</label>
                  <input type="number" min="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Cover Image (Optional)</label>
                <input type="file" accept="image/jpeg, image/png" onChange={e => setImageFile(e.target.files[0])} style={{border: 'none', padding: 0}} />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter book description..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <div className="flex justify-between" style={{marginTop: '24px'}}>
                <button type="button" className="btn" style={{backgroundColor: '#e5e7eb', color: 'black'}} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginBottom: '5px'}}>Book Details</h3>
            <p style={{fontSize: '15px', fontWeight: 'bold', color: '#111827', marginBottom: '15px'}}>{updateData.title}</p>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group" style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label>Price (Rp)</label>
                  <input type="number" min="0" required value={updateData.price} onChange={e => setUpdateData({...updateData, price: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                  <label>Stock</label>
                  <input type="number" min="0" required value={updateData.stock} onChange={e => setUpdateData({...updateData, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows="3"
                  value={updateData.description}
                  onChange={e => setUpdateData({...updateData, description: e.target.value})}
                  placeholder="Enter book description..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
              <div className="flex justify-between">
                <button type="button" className="btn btn-danger" onClick={() => { setShowUpdateModal(false); setDeleteConfirmId(updateData.id); }}>Delete Book</button>
                <div className="flex gap-2">
                  <button type="button" className="btn" style={{backgroundColor: '#e5e7eb', color: 'black'}} onClick={() => setShowUpdateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Updating...' : 'Update'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '350px'}}>
            <h3 style={{marginBottom: '10px', color: '#dc2626'}}>Confirm Deletion</h3>
            <p style={{fontSize: '14px', marginBottom: '20px'}}>Are you sure you want to delete this book? This action cannot be undone.</p>
            <div className="flex justify-between">
              <button type="button" className="btn" style={{backgroundColor: '#e5e7eb', color: 'black'}} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }}>Delete Book</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div style={{position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="preview" style={{maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'}} />
            <button 
              className="btn" 
              style={{position: 'absolute', top: '-15px', right: '-15px', background: 'white', color: 'black', borderRadius: '50%', padding: '0', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
              onClick={() => setPreviewImage(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
