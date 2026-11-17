import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OrganizerRequestSection } from '@/components/OrganizerRequestSection';

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
    <div className="max-w-md mx-auto mt-10 p-6 bg-card text-card-foreground rounded-2xl shadow-sm border border-border">
      {/* Criteriu: Bulina rotundă cu inițialele utilizatorului (avatar) */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-inner mb-2">
          {getInitials()}
        </div>
        <h2 className="text-xl font-bold text-foreground">Contul Meu</h2>
        <p className="text-sm text-muted-foreground">Gestionează-ți datele personale</p>
      </div>

      {message && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md text-center">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Prenume*</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-input bg-card text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Nume*</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-input bg-card text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Email{' '}
            <span className="text-xs text-muted-foreground font-normal">
              (nu se poate modifica)
            </span>
          </label>
          {/* Criteriu: Emailul afișat, dar needitabil */}
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-border bg-muted rounded-md shadow-sm text-muted-foreground cursor-not-allowed select-none"
          />
        </div>

        <Button type="submit" className="w-full font-semibold">
          Salvează modificările
        </Button>
      </form>

      <OrganizerRequestSection />
    </div>
  );
}
