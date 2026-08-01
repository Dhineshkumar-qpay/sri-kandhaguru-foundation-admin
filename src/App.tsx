import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Videos from './pages/Videos';
import Gallery from './pages/Gallery';
import VideoTestimonials from './pages/VideoTestimonials';
import Users from './pages/Users';
import EventDetail from './pages/EventDetail';
import Categories from './pages/Categories';
import Contacts from './pages/Contacts';
import Reviews from './pages/Reviews';
import Bookings from './pages/Bookings';
import Banners from './pages/Banners';
import Products from './pages/Products';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Donations from './pages/Donations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />

        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="categories" element={<Categories />} />
          <Route path="videos" element={<Videos />} />
          <Route path="video-testimonials" element={<VideoTestimonials />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="users" element={<Users />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
          <Route path="banners" element={<Banners />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="donations" element={<Donations />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
