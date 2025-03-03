import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface VolunteerFormProps {
  eventId: string;
  roleId: string;
  onClose: () => void;
}

const VolunteerForm: React.FC<VolunteerFormProps> = ({ eventId, roleId, onClose }) => {
  const { addVolunteer, events } = useAppContext();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const event = events.find(e => e.id === eventId);
  const role = event?.roles.find(r => r.id === roleId);
  
  // Check if the role is at maximum capacity
  const isRoleFull = role ? 
    role.volunteers.length >= (role.maxCapacity || role.capacity) : 
    false;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRoleFull) {
      return;
    }
    
    if (name.trim() && email.trim() && phone.trim()) {
      addVolunteer(eventId, roleId, {
        name,
        email,
        phone,
        description
      });
      
      setSubmitted(true);
    }
  };
  
  if (isRoleFull) {
    return (
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold mb-2 text-red-600">Role is Full</h3>
        <p className="mb-6">
          Sorry, this role has reached its maximum capacity of volunteers.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold mb-2 text-secondary-600">Thank You!</h3>
        <p className="mb-6">
          Your volunteer application for {role?.name} has been submitted successfully.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Tell us about yourself (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default VolunteerForm;