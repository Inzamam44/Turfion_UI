import { useEffect, useState, useMemo } from 'react';
import { getDbAsync } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import SearchAndFilters, { FilterOptions } from './SearchAndFilters';
import { GlowCard } from './ui/spotlight-card';
import LoadingSpinner from './LoadingSpinner';

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
  createdAt: any;
};

const CARDS_PER_PAGE = 9;

export default function CommunityCards() {
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: '',
    minPrice: 0,
    maxPrice: 0,
    date: '',
    time: ''
  });
  const navigate = useNavigate();

  // Memoize filtered cards to avoid recalculation on every render
  const filteredCards = useMemo(() => {
    let filtered = allCards;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(searchLower) ||
        card.type.toLowerCase().includes(searchLower) ||
        card.location?.toLowerCase().includes(searchLower) ||
        card.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(card => card.type === filters.type);
    }

    if (filters.minPrice > 0) {
      filtered = filtered.filter(card => card.pricePerHour >= filters.minPrice);
    }

    if (filters.maxPrice > 0) {
      filtered = filtered.filter(card => card.pricePerHour <= filters.maxPrice);
    }

    // Time filter - check if the card is open at the specified time
    if (filters.time) {
      filtered = filtered.filter(card => {
        if (!card.openingTime || !card.closingTime) return true;
        
        const parseTime = (timeStr: string): number => {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          
          if (period?.toUpperCase() === 'PM' && hours !== 12) {
            hour24 += 12;
          } else if (period?.toUpperCase() === 'AM' && hours === 12) {
            hour24 = 0;
          }
          
          return hour24 * 60 + (minutes || 0);
        };

        try {
          const searchTimeMinutes = parseTime(filters.time);
          const openingMinutes = parseTime(card.openingTime);
          const closingMinutes = parseTime(card.closingTime);
          
          return searchTimeMinutes >= openingMinutes && searchTimeMinutes < closingMinutes;
        } catch (error) {
          return true; // If parsing fails, include the card
        }
      });
    }

    return filtered;
  }, [allCards, searchTerm, filters]);

  // Memoize displayed cards for current page
  const displayedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    return filteredCards.slice(startIndex, endIndex);
  }, [filteredCards, currentPage]);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const availableTypes = useMemo(() => 
    [...new Set(allCards.map(card => card.type))].filter(Boolean),
    [allCards]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const setupRealtimeListener = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Optimize query with limit and ordering (firestore functions loaded on demand)
        const firestore = await getDbAsync();
        if (!firestore) {
          setError('Database not available');
          setLoading(false);
          return;
        }
        const { collection, onSnapshot, query, orderBy, limit } = await import('firebase/firestore');
        const q = query(
          collection(firestore, 'cards'),
          orderBy('createdAt', 'desc'),
          limit(50) // Reduced limit for better performance
        );

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const cardsData: CardData[] = [];
          
          querySnapshot.forEach((doc) => {
            cardsData.push({
              id: doc.id,
              ...doc.data()
            } as CardData);
          });

          // Debounce updates to prevent excessive re-renders
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setAllCards(cardsData);
            setLoading(false);
          }, 100);

        }, (err) => {
          console.error('Error in real-time listener:', err);
          setError('Unable to load community cards at the moment.');
          setLoading(false);
        });

      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        setError('Unable to load community cards at the moment.');
        setLoading(false);
      }
    };

    // Delay initial load to improve perceived performance
    const initialTimeout = setTimeout(setupRealtimeListener, 100);

    return () => {
      if (unsubscribe) unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  if (loading && allCards.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Community Cards</h2>
        <LoadingSpinner size="md" className="py-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Community Cards</h2>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <p className="text-sm mt-1">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 mt-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Community Cards</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredCards.length > 0 ? (
            <>Showing {((currentPage - 1) * CARDS_PER_PAGE) + 1}-{Math.min(currentPage * CARDS_PER_PAGE, filteredCards.length)} of {filteredCards.length} cards</>
          ) : (
            <>No cards found</>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        availableTypes={availableTypes}
      />
      
      {filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchTerm || filters.type || filters.minPrice > 0 || filters.maxPrice > 0 || filters.date || filters.time
              ? 'No cards match your search criteria.'
              : 'No community cards available yet.'
            }
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            {searchTerm || filters.type || filters.minPrice > 0 || filters.maxPrice > 0 || filters.date || filters.time
              ? 'Try adjusting your search or filters.'
              : 'Be the first to create and share a card!'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-4">
            {displayedCards.map((card) => (
              <GlowCard key={card.id} className="cursor-pointer transition-transform duration-30 hover:scale-105">
                <div onClick={() => navigate(`/card/${card.id}`)}>
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                    <img 
                      src={card.imageUrl} 
                      alt={card.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3657154/pexels-photo-3657154.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs sm:text-sm">
                      Community
                    </div>
                    {card.pricePerHour > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                        ₹{card.pricePerHour}/hr
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">{card.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs sm:text-sm px-3 py-1 rounded-full">
                        {card.type}
                      </span>
                    </div>
                    {card.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{card.location}</span>
                      </div>
                    )}
                    {card.pricePerHour > 0 && (
                      <div className="flex items-center text-green-600 dark:text-green-400 text-sm mb-2">
                        <span className="font-semibold">₹{card.pricePerHour} per hour</span>
                      </div>
                    )}
                    {(card.openingTime || card.closingTime) && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {card.openingTime && card.closingTime 
                            ? `${card.openingTime} - ${card.closingTime}`
                            : card.openingTime || card.closingTime
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <div className="flex items-center space-x-2 overflow-x-auto">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}