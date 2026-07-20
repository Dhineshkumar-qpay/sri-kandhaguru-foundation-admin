import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Tag, Info, Link as LinkIcon } from 'lucide-react';
import api from '../services/api';

interface EventDetail {
  id: number;
  image: string;
  title: string;
  description: string;
  category: string;
  eventdate: string;
  starttime: string;
  endtime: string;
  partcipants: number;
  registrationfee: string;
  venuename: string;
  address: string;
  city: string;
  state: string;
  maplink: string;
  eventtype: string;
  status: string;
  createdAt: string;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await api.post('/event/details', { id: Number(id) });
        if (response.data?.success) {
          setEvent(response.data.data);
        } else {
          setError('Failed to fetch event details.');
        }
      } catch (err) {
        setError('An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEventDetail();
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !event) return <div className="p-8 text-center text-red-500">{error || 'Event not found'}</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-64 md:h-80 w-full relative bg-gray-100 border-b border-gray-200">
          <img 
            src={event.image ? (event.image.startsWith('http') ? event.image : `http://localhost:3003${event.image}`) : 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=1200&h=400'} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${
              event.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {event.status}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm bg-blue-100 text-blue-800 border border-blue-200">
              {event.eventtype}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <Tag className="w-4 h-4" /> {event.category}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{event.title}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-3">Schedule & Location</h3>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="font-semibold text-gray-900">{new Date(event.eventdate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Time</p>
                  <p className="font-semibold text-gray-900">{event.starttime} - {event.endtime}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Venue</p>
                  <p className="font-semibold text-gray-900">{event.venuename}</p>
                  <p className="text-sm text-gray-600 mt-1">{event.address}, {event.city}, {event.state}</p>
                  {event.maplink && (
                    <a href={event.maplink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm mt-2 transition-colors">
                      <LinkIcon className="w-3.5 h-3.5" /> View on Map
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-3">Event Details</h3>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Expected Participants</p>
                  <p className="font-semibold text-gray-900">{event.partcipants.toLocaleString()} <span className="font-normal text-gray-500 text-sm">people</span></p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="w-5 h-5 flex items-center justify-center text-gray-600 font-bold text-lg">₹</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Registration Fee</p>
                  <p className="font-semibold text-gray-900">{Number(event.registrationfee) === 0 ? 'Free' : `₹${event.registrationfee}`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" /> About Event
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {event.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
