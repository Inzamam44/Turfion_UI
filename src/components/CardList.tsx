import React, { useEffect, useState } from 'react';
import { getDbAsync } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Edit, Save, X, Trash2, MapPin, DollarSign, Image, FileText, Globe, Users, Star, Zap, Shield } from 'lucide-react';
const Card3D = React.lazy(() => import('./ui/animated-3d-card').then(m => ({ default: m.Card3D })));
import { Suspense } from 'react';

type CardData = {
  id: string;
  title: string;
  imageUrl: string;
  type: string;
  openingTime: string;
  closingTime: string;
  pricePerHour: number;
  location: string;
  description: string;
  userId: string;
  assignedHost?: string;
  createdAt: any;
  Card_ID: string;
};

export default function CardList() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CardData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  // Generate time options from 00:00 to 23:00
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      options.push(timeString);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    let cancelled = false;

    const setupListener = async () => {
      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }

      const firestore = await getDbAsync();
      if (!firestore) {
        setCards([]);
        setLoading(false);
        return;
      }

      const { collection, onSnapshot, query, where } = await import('firebase/firestore');

      let q;
      if (hasRole('admin')) {
        q = query(collection(firestore, 'cards'));
      } else if (hasRole('host')) {
        q = query(collection(firestore, 'cards'), where('assignedHost', '==', user.uid));
      } else {
        q = query(collection(firestore, 'cards'), where('userId', '==', user.uid));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (cancelled) return;
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as CardData[];
          items.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          setCards(items);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching cards:', error);
          if (cancelled) return;
          setLoading(false);
        }
      );

      return unsubscribe;
    };

    let unsub: any;
    setupListener().then((u) => (unsub = u)).catch((err) => console.error('Listener setup failed:', err));

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [user, hasRole]);

  // Prefetch the animated card bundle once we have cards to render so the
  // lazy-loaded Card3D appears quickly and reduces the time users see the
  // fallback skeleton. This warms the module cache in the background.
  useEffect(() => {
    if (cards.length === 0) return;
    // dynamic import to warm the bundle cache; ignore result
    import('./ui/animated-3d-card')
      .then(() => {
        // prefetched
      })
      .catch((err) => {
        // non-fatal, just log for debugging
        console.debug('Prefetch Card3D failed:', err);
      });
  }, [cards.length]);

  const handleEditClick = (card: CardData) => {
    setEditingCard(card.id);
    setEditForm({
      title: card.title,
      imageUrl: card.imageUrl,
      type: card.type,
      openingTime: card.openingTime,
      closingTime: card.closingTime,
      pricePerHour: card.pricePerHour,
      location: card.location,
      description: card.description
    });
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditForm({});
  };

  const handleSaveEdit = async (cardId: string) => {
    if (!editForm.title || !editForm.type || !editForm.pricePerHour) {
      alert('Please fill in all required fields');
      return;
    }

    if (editForm.pricePerHour <= 0) {
      alert('Price per hour must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const firestore = await getDbAsync();
      if (!firestore) throw new Error('Firestore not available');
      const { doc, updateDoc } = await import('firebase/firestore');
      const cardRef = doc(firestore, 'cards', cardId);
      await updateDoc(cardRef, {
        title: editForm.title,
        imageUrl: editForm.imageUrl || '',
        type: editForm.type,
        openingTime: editForm.openingTime || '00:00',
        closingTime: editForm.closingTime || '23:00',
        pricePerHour: editForm.pricePerHour,
        location: editForm.location || '',
        description: editForm.description || '',
        updatedAt: new Date()
      });

      setEditingCard(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string, cardTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${cardTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(cardId);
    try {
      const firestore = await getDbAsync();
      if (!firestore) throw new Error('Firestore not available');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(firestore, 'cards', cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleInputChange = (field: keyof CardData, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardClick = (cardId: string) => {
    navigate(`/card/${cardId}`);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Map card types to lucide icons
  const iconForType = (type: string | undefined) => {
    if (!type) return Globe;
    const t = type.toLowerCase();
    if (t.includes('football') || t.includes('soccer')) return Users;
    if (t.includes('cricket')) return Zap;
    if (t.includes('tennis') || t.includes('badminton')) return Star;
    if (t.includes('security') || t.includes('safe')) return Shield;
    if (t.includes('community') || t.includes('global')) return Globe;
    // default
    return Globe;
  };

  const canEditCard = (card: CardData): boolean => {
    if (hasRole('admin')) return true;
    if (hasRole('host') && card.assignedHost === user?.uid) return true;
    if (hasRole('user') && card.userId === user?.uid) return true;
    return false;
  };

  const canDeleteCard = (_card: CardData): boolean => {
    return hasRole('admin');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view cards.</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {hasRole('admin') ? 'No cards in the system yet.' : 
           hasRole('host') ? 'No cards assigned to you yet.' : 
           'No cards yet. Add your first card!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.id} className="relative overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-1005">
          <div onClick={() => handleCardClick(card.id)}>
            <div className="relative bg-gray-200 dark:bg-gray-700">
              {editingCard === card.id ? (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="w-full">
                    <label className="block text-white text-sm mb-2 flex items-center">
                      <Image className="w-4 h-4 mr-1" />
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={editForm.imageUrl || ''}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Image URL"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm"
                    />
                  </div>
                </div>
              ) : (
                <Suspense fallback={<div className="h-80 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" /> }>
                  <Card3D
                    title={card.title}
                    description={card.description}
                    image={card.imageUrl || undefined}
                    icon={React.createElement(iconForType(card.type))}
                    theme={"primary"}
                    size={"md"}
                    variant={"default"}
                  />
                </Suspense>
              )}
              <div className="absolute top-2 left-2">
                {hasRole('admin') ? (
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                    Admin View
                  </span>
                ) : hasRole('host') && card.assignedHost === user?.uid ? (
                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                    Assigned to You
                  </span>
                ) : (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    Your Card
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2">
                {editingCard === card.id ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(card.id);
                      }}
                      disabled={saving}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-1">
                    {canEditCard(card) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(card);
                        }}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteCard(card) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id, card.title);
                        }}
                        disabled={deleting === card.id}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        {deleting === card.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {editingCard === card.id ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => handleInputChange('title', capitalizeFirstLetter(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Card title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type *
                    </label>
                    <input
                      type="text"
                      value={editForm.type || ''}
                      onChange={(e) => handleInputChange('type', capitalizeFirstLetter(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Card type"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => handleInputChange('location', capitalizeFirstLetter(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Location"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Price per Hour (₹) *
                    </label>
                    <input
                      type="number"
                      value={editForm.pricePerHour || ''}
                      onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Price per hour"
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => handleInputChange('description', capitalizeFirstLetter(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Opening Time
                      </label>
                      <select
                        value={editForm.openingTime || '00:00'}
                        onChange={(e) => handleInputChange('openingTime', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Closing Time
                      </label>
                      <select
                        value={editForm.closingTime || '23:00'}
                        onChange={(e) => handleInputChange('closingTime', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 
                    className="text-xl font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {card.title}
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm px-3 py-1 rounded-full">
                      {card.type}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {card.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently added'}
                    </span>
                  </div>

                  {/* Location */}
                  {card.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{card.location}</span>
                    </div>
                  )}

                  {/* Price */}
                  {card.pricePerHour > 0 && (
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm mb-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="font-semibold">₹{card.pricePerHour} per hour</span>
                    </div>
                  )}
                  
                  {/* Opening and Closing Times */}
                  {(card.openingTime || card.closingTime) && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {card.openingTime && card.closingTime 
                          ? `${card.openingTime} - ${card.closingTime}`
                          : card.openingTime || card.closingTime
                        }
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {card.description && (
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      <p className="line-clamp-2">{card.description}</p>
                    </div>
                  )}

                  {/* Card ID */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="font-mono">ID: {card.Card_ID}</span>
                  </div>

                  {/* Show assignment info for admins */}
                  {hasRole('admin') && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created by: {card.userId}
                      </p>
                      {card.assignedHost && (
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          Assigned to: {card.assignedHost}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}