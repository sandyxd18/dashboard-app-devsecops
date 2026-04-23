import React, { useEffect, useState } from 'react';
import { Users, BookOpen, ShoppingBag, Activity } from 'lucide-react';
import { authApi, bookApi, paymentApi } from '../services/api';

export default function Overview() {
  const [stats, setStats] = useState({ users: '-', books: '-', payments: '-' });

  useEffect(() => {
    // Quick fetch to give dashboard some life
    Promise.allSettled([
      authApi.get('/auth/admin/users'),
      bookApi.get('/books'),
      paymentApi.get('/payments')
    ]).then(([usersRes, booksRes, paymentsRes]) => {
      setStats({
        users: usersRes.status === 'fulfilled' ? usersRes.value.data.data.length : 'Error',
        books: booksRes.status === 'fulfilled' ? (booksRes.value.data.data?.books?.length || 0) : 'Error',
        payments: paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data.data?.payments?.length || 0) : 'Error'
      });
    });
  }, []);

  return (
    <div>
      <h3 style={{marginBottom: '20px'}}>System Overview</h3>
      <div className="flex gap-4" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
        <div className="card flex flex-col items-center justify-center gap-2">
           <Users size={32} color="#3b82f6"/>
           <div style={{color: '#6b7280', fontSize: '14px'}}>Total Users</div>
           <div style={{fontSize: '28px', fontWeight: 'bold'}}>{stats.users}</div>
        </div>
        <div className="card flex flex-col items-center justify-center gap-2">
           <BookOpen size={32} color="#10b981"/>
           <div style={{color: '#6b7280', fontSize: '14px'}}>Total Books</div>
           <div style={{fontSize: '28px', fontWeight: 'bold'}}>{stats.books}</div>
        </div>
        <div className="card flex flex-col items-center justify-center gap-2">
           <ShoppingBag size={32} color="#f59e0b"/>
           <div style={{color: '#6b7280', fontSize: '14px'}}>Total Payments</div>
           <div style={{fontSize: '28px', fontWeight: 'bold'}}>{stats.payments}</div>
        </div>
      </div>
    </div>
  );
}
