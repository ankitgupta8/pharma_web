import React, { useState, useEffect } from 'react';
import { DrugNote } from '../../types/drug.types';
import { 
  getDrugNotes, 
  addDrugNote, 
  updateDrugNote, 
  deleteDrugNote,
  getAllTags 
} from '../../data/database';

interface NotesManagerProps {
  drugId: number;
  drugName: string;
  onClose: () => void;
}

const NotesManager: React.FC<NotesManagerProps> = ({ drugId, drugName, onClose }) => {
  const [notes, setNotes] = useState<DrugNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [editingNote, setEditingNote] = useState<DrugNote | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editTags, setEditTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
    loadTags();
  }, [drugId]);

  const loadNotes = async () => {
    try {
      const drugNotes = await getDrugNotes(drugId);
      setNotes(drugNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await addDrugNote(drugId, newNote.trim(), tags);
      setNewNote('');
      setNewTags('');
      await loadNotes();
      await loadTags();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = (note: DrugNote) => {
    setEditingNote(note);
    setEditNote(note.note);
    setEditTags(note.tags ? note.tags.join(', ') : '');
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editNote.trim()) return;

    try {
      const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await updateDrugNote(editingNote.id!, editNote.trim(), tags);
      setEditingNote(null);
      setEditNote('');
      setEditTags('');
      await loadNotes();
      await loadTags();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDrugNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTagClick = (tag: string) => {
    const currentTags = newTags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      setNewTags(currentTags.length > 0 ? `${newTags}, ${tag}` : tag);
    }
  };

  if (loading) {
    return (
      <div className="notes-modal">
        <div className="notes-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-modal">
      <div className="notes-content">
        <div className="notes-header">
          <h2>📝 Notes for {drugName}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="notes-body">
          {/* Add New Note */}
          <div className="add-note-section">
            <h3>Add New Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              className="note-textarea"
              rows={4}
            />
            
            <div className="tags-section">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="tags-input"
              />
              
              {availableTags.length > 0 && (
                <div className="available-tags">
                  <span className="tags-label">Quick tags:</span>
                  {availableTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      className="tag-button"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className="add-note-btn"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Add Note
            </button>
          </div>

          {/* Existing Notes */}
          <div className="notes-list">
            <h3>Your Notes ({notes.length})</h3>
            
            {notes.length === 0 ? (
              <div className="no-notes">
                <p>No notes yet. Add your first note above!</p>
              </div>
            ) : (
              <div className="notes-container">
                {notes.map(note => (
                  <div key={note.id} className="note-card">
                    {editingNote?.id === note.id ? (
                      <div className="edit-note-form">
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="note-textarea"
                          rows={3}
                        />
                        <input
                          type="text"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="Tags (comma-separated)"
                          className="tags-input"
                        />
                        <div className="edit-actions">
                          <button 
                            className="save-btn"
                            onClick={handleUpdateNote}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => setEditingNote(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="note-content">
                          <p>{note.note}</p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="note-tags">
                              {note.tags.map(tag => (
                                <span key={tag} className="note-tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="note-meta">
                          <span className="note-date">
                            {note.updatedAt.getTime() !== note.createdAt.getTime() 
                              ? `Updated ${formatDate(note.updatedAt)}`
                              : `Created ${formatDate(note.createdAt)}`
                            }
                          </span>
                          
                          <div className="note-actions">
                            <button 
                              className="edit-note-btn"
                              onClick={() => handleEditNote(note)}
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-note-btn"
                              onClick={() => handleDeleteNote(note.id!)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesManager;