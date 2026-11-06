import React, { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Preluarea datelor utilizatorului la încărcarea paginii (GET /api/profile sau /api/auth/me)
  useEffect(() => {
    fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setFirstName(data.first_name || data.prenume || '');
          setLastName(data.last_name || data.nume || '');
          setEmail(data.email || '');
        } else {
          setError('Nu s-au putut încărca datele profilului.');
        }
      })
      .catch(() => {
        setError('Eroare de conexiune cu serverul.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. Calcularea inițialelor pentru bulina rotundă (avatar)
  const getInitials = () => {
    const f = firstName ? firstName[0] : '';
    const l = lastName ? lastName[0] : '';
    return (f + l).toUpperCase() || 'U';
  };

  // 3. Trimiterea modificărilor către backend (PUT /api/profile)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          // Emailul nu este trimis sau este ignorat intenționat de backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profilul a fost actualizat cu succes!');
      } else {
        setError(data.error || Object.values(data.errors || {}).join(', ') || 'A apărut o eroare.');
      }
    } catch {
      setError('Eroare la salvarea modificărilor.');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Se încarcă profilul...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      {/* Criteriu: Bulina rotundă cu inițialele utilizatorului (avatar) */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-inner mb-2">
          {getInitials()}
        </div>
        <h2 className="text-xl font-bold text-gray-800">Contul Meu</h2>
        <p className="text-sm text-gray-500">Gestionează-ți datele personale</p>
      </div>

      {message && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md text-center">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prenume*</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nume*</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-xs text-gray-400 font-normal">(nu se poate modifica)</span>
          </label>
          {/* Criteriu: Emailul afișat, dar needitabil */}
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm text-gray-500 cursor-not-allowed select-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Salvează modificările
        </button>
      </form>
    </div>
  );
}
