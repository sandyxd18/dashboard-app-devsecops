import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';

import Overview from './pages/Overview';
import BooksApp from './pages/BooksApp';
import UsersApp from './pages/UsersApp';
import OrdersApp from './pages/OrdersApp';
import BlockchainApp from './pages/BlockchainApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="books" element={<BooksApp />} />
          <Route path="users" element={<UsersApp />} />
          <Route path="orders" element={<OrdersApp />} />
          <Route path="blockchain" element={<BlockchainApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
