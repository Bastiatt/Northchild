import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import './App.css';
import backgroundCard from './ui/northchild-card.webp';
import html2canvas from 'html2canvas';

function App() {
  const [sagaName, setSagaName] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [slotData, setSlotData] = useState({});
  const [boardId, setBoardId] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const animals = [
    'Winter-Keeper', 'Night-Watcher', 'Sky-Warden', 'Coil-Weaver',
    'Pack-Hunter', 'Oath-Stag', 'Deep-Kin', 'Omen-Bearer'
  ];

  const toggleRune = async (id) => {
    const updatedData = { ...slotData };
    // Toggle between active (1) and inactive (undefined/0)
    if (updatedData[id]) {
      delete updatedData[id];
    } else {
      updatedData[id] = true;
    }
    setSlotData(updatedData);
    saveToCloud(updatedData);
  };

  const logout = () => {
  localStorage.clear();
  window.location.reload();
  };

  const shareBoard = async () => {
    const element = document.querySelector('.game-card');
    const canvas = await html2canvas(element, {
      backgroundColor: null, // Keeps transparency if you have any
      scale: 2, // High resolution for Discord
    });

    canvas.toBlob((blob) => {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]);
      alert("The Saga image has been copied to your clipboard!");
    });
  };

  const getAnimalArchetype = (slotId) => {
    const mapping = {
      'Winter-Keeper': 'Bear',
      'Night-Watcher': 'Owl',
      'Sky-Warden': 'Eagle',
      'Coil-Weaver': 'Serpent',
      'Pack-Hunter': 'Wolf',
      'Oath-Stag': 'Stag',
      'Deep-Kin': 'Orca',
      'Omen-Bearer': 'Raven'
    };
    // Use the same split/slice/join logic here
  const animalKey = slotId.split('-').slice(0, 2).join('-');
  return mapping[animalKey] || 'Spirit';
};

  // 1. AUTO-LOGIN: Checks browser memory for a saved Saga
  useEffect(() => {
    const savedSaga = localStorage.getItem('northchild_saga');
    const savedPin = localStorage.getItem('northchild_pin');
    
    if (savedSaga && savedPin) {
      setSagaName(savedSaga);
      setPin(savedPin);
      
      const autoLoad = async () => {
        try {
          const { data } = await supabase
            .from('boards')
            .select('*')
            .eq('saga_name', savedSaga.toLowerCase())
            .eq('pin', savedPin)
            .maybeSingle();
          
          if (data) {
            setSlotData(data.slot_data || {});
            setBoardId(data.id);
            setIsAuthorized(true); // <--- This opens the door!
          }
        } catch (err) {
          console.error("Auto-load failed:", err);
        } finally {
          setIsLoading(false); // <--- This stops the "black screen"
        }
      };
      autoLoad();
    } else {
      setIsLoading(false); // No saved saga, show login immediately
    }
  }, []);

  // 2. IDENTIFY SAGA: The "Login" logic
  const identifySaga = async (e) => {
    e.preventDefault();
    if (!sagaName || !pin) return;
    const normalizedSaga = sagaName.toLowerCase().trim();

    const { data } = await supabase
      .from('boards')
      .select('*')
      .eq('saga_name', normalizedSaga)
      .eq('pin', pin)
      .maybeSingle();

    if (data) {
      setSlotData(data.slot_data || {});
      setBoardId(data.id);
    } else {
      const { data: newBoard } = await supabase
        .from('boards')
        .insert([{ saga_name: normalizedSaga, pin: pin, slot_data: {} }])
        .select().single();
      if (newBoard) {
        setBoardId(newBoard.id);
        setSlotData({});
      }
    }

    localStorage.setItem('northchild_saga', normalizedSaga);
    localStorage.setItem('northchild_pin', pin);
    setIsAuthorized(true);
  };

  const saveToCloud = async (newData) => {
    if (boardId) {
      await supabase.from('boards').update({ slot_data: newData }).eq('id', boardId);
    }
  };

  const handlePasteUrl = async (url) => {
    if (!url) return;
    const updatedData = { ...slotData, [activeSlot]: url };
    setSlotData(updatedData);
    saveToCloud(updatedData);
    closeModal();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    const apiKey = 'AIzaSyCMtnzeQipM425CmnAgTGnTkyiEqm5TOaM'; 
    const encodedTitle = encodeURIComponent(searchTerm);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedTitle}&maxResults=5&key=${apiKey}`;
    try {
      const res = await axios.get(url);
      setSearchResults(res.data.items || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const selectBook = async (book) => {
    const coverUrl = book.volumeInfo.imageLinks?.thumbnail;
    const updatedData = { ...slotData, [activeSlot]: coverUrl };
    setSlotData(updatedData);
    saveToCloud(updatedData);
    closeModal();
  };

  const clearSlot = async () => {
    const updatedData = { ...slotData };
    delete updatedData[activeSlot];
    setSlotData(updatedData);
    saveToCloud(updatedData);
    closeModal();
  };

  const closeModal = () => {
    setActiveSlot(null);
    setSearchTerm('');
    setSearchResults([]);
  };
  if (isLoading) return <div style={{background: '#1a1a1a', height: '100vh'}} />;

  return (
    <div className="app-container">
      {!isAuthorized ? (
        <div className="login-overlay">
          <div className="login-content">
            <h2 style={{fontFamily: 'Viking', color: '#4b576d', letterSpacing: '4px'}}>Identify Your Saga</h2>
            <form onSubmit={identifySaga}>
              <input 
                placeholder="Saga Name (e.g. Bastiat)" 
                value={sagaName}
                onChange={(e) => setSagaName(e.target.value)}
                style={{fontFamily: 'Norse'}}
              />
              <input 
                type="password" 
                maxLength="4" 
                placeholder="4-Digit PIN" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{fontFamily: 'Norse'}}
              />
              <button type="submit" className="clear-button" style={{marginTop: '20px', border: '1px solid #4b576d', color: '#4b576d'}}>
                Begin the Journey
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="game-card" style={{ backgroundImage: `url(${backgroundCard})` }}>
            {animals.map((animal, index) => (
              <React.Fragment key={animal}>
                <div className={`slot-single block-${index}`} onClick={() => setActiveSlot(`${animal}-text`)}>
                  {slotData[`${animal}-text`] ? (
                    <img src={slotData[`${animal}-text`]} alt="cover" />
                  ) : (
                    <span className="plus">+</span>
                  )}
                </div>
                
                <div className={`slot-row row-${index}`}>
                  {[1, 2, 3, 4].map(num => {
                    const id = `${animal}-slot-${num}`;
                    return (
                      <div key={id} className="slot-item" onClick={() => setActiveSlot(id)}>
                        {slotData[id] ? (
                          <img src={slotData[id]} alt="cover" />
                        ) : (
                          <span className="plus">+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Rune Clusters */}
                  <div className="rune-cluster highflame-cluster">
                    {[0, 1, 2, 3, 4].map(i => (
                      <img 
                        key={`hf-${i}`}
                        src="/public/runes/highflame.svg" 
                        className={`rune-icon ${slotData[`highflame-${i}`] ? 'active' : ''}`}
                        onClick={() => toggleRune(`highflame-${i}`)}
                        alt="Highflame Rune"
                      />
                    ))}
                  </div>

                  <div className="rune-cluster gravesong-cluster">
                    {[0, 1, 2, 3, 4].map(i => (
                      <img 
                        key={`gs-${i}`}
                        src="public/runes/gravesong.svg" 
                        className={`rune-icon ${slotData[`gravesong-${i}`] ? 'active' : ''}`}
                        onClick={() => toggleRune(`gravesong-${i}`)}
                        alt="Gravesong Rune"
                      />
                    ))}
                  </div>
              </React.Fragment>
            ))}
          </div>

          {activeSlot && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* 1. THE RITUAL HEADER (The Text) */}
                <div className="ritual-header">
                  {activeSlot.includes('-text') ? (
                    <>
                      <p className="ritual-command">Sacrifice a book to the</p>
                      <h3 className="ritual-title">{activeSlot.split('-').slice(0, 2).join('-')}</h3>
                      <p className="ritual-subtitle">Open the Path of the {getAnimalArchetype(activeSlot)}</p>
                    </>
                  ) : (
                    <>
                      <p className="ritual-command">Invoke the</p>
                      <h3 className="ritual-title">{activeSlot.split('-').slice(0, 2).join('-')}</h3>
                      <p className="ritual-subtitle">Let Her Fate Be Guided</p>
                    </>
                  )}
                </div>

                {/* 2. THE SEARCH TOOLS (The Missing Options) */}
                <form onSubmit={handleSearch}>
                  <input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search Google Books..." 
                    autoFocus
                  />
                </form>

                <div className="modal-divider"><span>OR</span></div>

                <input 
                  type="text"
                  placeholder="Paste Image URL..."
                  onPaste={(e) => handlePasteUrl(e.clipboardData.getData('text'))}
                  onChange={(e) => {
                    if (e.target.value.startsWith('http')) handlePasteUrl(e.target.value);
                  }}
                />

                {/* 3. THE RESULTS GRID */}
                <div className="results-grid">
                  {searchResults.map((book) => (
                    <div key={book.id} className="result-item" onClick={() => selectBook(book)}>
                      <img src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192'} alt="cover" />
                    </div>
                  ))}
                </div>

                {/* 4. THE CLEAR BUTTON */}
                {slotData[activeSlot] && (
                  <button onClick={clearSlot} className="clear-button">Clear This Slot</button>
                )}
              </div>
            </div>
          )}
        </>
      )}
       {isAuthorized && (
          <div className="saga-dashboard">
            <button onClick={shareBoard} className="dashboard-link">
              Copy Card Image
            </button>
            <button onClick={logout} className="dashboard-link">
              Abandon this Saga
            </button>
          </div>
        )}
    </div>
  );
}

export default App;